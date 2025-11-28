import { CronJob } from "cron";
import { exec } from "child_process";
import { promisify } from "util";
import { notifyOwner } from "./notification";
import { sistemaPai } from "./sistema-pai";
import { getDb } from "../db";
import { mysqlTable, int, timestamp, text, varchar } from "drizzle-orm/mysql-core";

const execAsync = promisify(exec);

/**
 * AUTO-TESTES NOTURNOS COMPLETOS
 * 
 * Executa todos os 392 testes automaticamente às 3h da manhã.
 * Se falhar > 5%, não aplicar mudanças e notificar.
 */

// Schema para registrar execuções de testes
export const autoTestRuns = mysqlTable("auto_test_runs", {
  id: int("id").autoincrement().primaryKey(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  durationMs: int("duration_ms"),
  totalTests: int("total_tests").notNull(),
  passingTests: int("passing_tests").notNull(),
  failingTests: int("failing_tests").notNull(),
  passRate: int("pass_rate").notNull(), // 0-100
  output: text("output"), // Output completo dos testes
  status: varchar("status", { length: 50 }).notNull(), // 'success', 'failed', 'threshold-exceeded'
  actionTaken: varchar("action_taken", { length: 100 }), // 'backup-created', 'rollback-triggered', 'none'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

let testJob: CronJob | null = null;

interface TestConfig {
  enabled: boolean;
  cronPattern: string; // Default: "0 0 3 * * *" (3h da manhã)
  failureThreshold: number; // Default: 5 (5%)
  autoRollbackOnFailure: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

const defaultConfig: TestConfig = {
  enabled: true,
  cronPattern: "0 0 3 * * *", // 3h da manhã todos os dias
  failureThreshold: 5, // 5%
  autoRollbackOnFailure: true,
  notifyOnSuccess: false, // Não notificar se tudo OK
  notifyOnFailure: true, // Sempre notificar falhas
};

let currentConfig: TestConfig = { ...defaultConfig };

/**
 * Inicializa o agendador de auto-testes
 */
export async function initializeAutoTestScheduler(config?: Partial<TestConfig>): Promise<void> {
  // Merge config
  currentConfig = { ...defaultConfig, ...config };

  if (!currentConfig.enabled) {
    console.log("[AutoTest] Auto-testes noturnos desabilitados");
    return;
  }

  try {
    // Criar cron job
    testJob = new CronJob(
      currentConfig.cronPattern,
      async () => {
        await executeScheduledTests();
      },
      null, // onComplete
      true, // start
      "America/Sao_Paulo" // timezone
    );

    console.log(`[AutoTest] ✅ Agendador iniciado - Testes automáticos: ${currentConfig.cronPattern}`);
  } catch (error) {
    console.error("[AutoTest] Erro ao inicializar agendador:", error);
  }
}

/**
 * Para o agendador de auto-testes
 */
export function stopAutoTestScheduler(): void {
  if (testJob) {
    testJob.stop();
    testJob = null;
    console.log("[AutoTest] Agendador parado");
  }
}

/**
 * Executa testes agendados
 */
async function executeScheduledTests(): Promise<void> {
  console.log("[AutoTest] 🧪 Iniciando execução de testes automáticos...");

  const startedAt = new Date();
  const db = await getDb();

  try {
    // Criar backup ANTES de executar testes
    console.log("[AutoTest] Criando backup de segurança antes dos testes...");
    await sistemaPai.createBackup({
      type: "pre-update",
      description: "Backup automático antes da execução de testes noturnos",
    });

    // Executar todos os testes
    console.log("[AutoTest] Executando bateria completa de testes...");
    const { stdout, stderr } = await execAsync(
      "cd /home/ubuntu/servidor-automacao && pnpm test --run 2>&1",
      { timeout: 300000 } // 5 minutos timeout
    );

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    // Parse do output
    const testResults = parseTestOutput(stdout + stderr);

    // Calcular taxa de falha
    const failureRate = testResults.totalTests > 0 
      ? ((testResults.failingTests / testResults.totalTests) * 100) 
      : 0;

    // Determinar status
    let status: "success" | "failed" | "threshold-exceeded" = "success";
    let actionTaken: string = "none";

    if (testResults.failingTests > 0) {
      if (failureRate > currentConfig.failureThreshold) {
        status = "threshold-exceeded";
        console.log(`[AutoTest] ⚠️ Taxa de falha (${failureRate.toFixed(2)}%) excedeu threshold (${currentConfig.failureThreshold}%)`);

        // Rollback automático se configurado
        if (currentConfig.autoRollbackOnFailure) {
          console.log("[AutoTest] Iniciando rollback automático...");
          const backups = await sistemaPai.listBackups(2);
          
          // Pegar o penúltimo backup (o último é o que acabamos de criar)
          if (backups.length >= 2) {
            const previousBackup = backups[1];
            const rollbackSuccess = await sistemaPai.restoreBackup(previousBackup.id, {
              reason: "auto-correction-failed",
              reasonDetails: `Taxa de falha de ${failureRate.toFixed(2)}% excedeu threshold de ${currentConfig.failureThreshold}%`,
              requestedBy: "auto-test-scheduler",
            });

            actionTaken = rollbackSuccess ? "rollback-triggered" : "rollback-failed";
          } else {
            console.warn("[AutoTest] Não há backup anterior disponível para rollback");
            actionTaken = "no-backup-available";
          }
        }
      } else {
        status = "failed";
        console.log(`[AutoTest] ⚠️ Testes falharam mas dentro do threshold (${failureRate.toFixed(2)}% < ${currentConfig.failureThreshold}%)`);
        actionTaken = "backup-created";
      }
    } else {
      console.log(`[AutoTest] ✅ Todos os testes passaram (${testResults.totalTests}/${testResults.totalTests})`);
      actionTaken = "backup-created";
    }

    // Registrar execução no banco
    if (db) {
      await db.insert(autoTestRuns).values({
        startedAt,
        completedAt,
        durationMs,
        totalTests: testResults.totalTests,
        passingTests: testResults.passingTests,
        failingTests: testResults.failingTests,
        passRate: Math.round(testResults.passRate),
        output: (stdout + stderr).substring(0, 65000), // Limitar tamanho
        status,
        actionTaken,
      });
    }

    // Notificar
    await notifyTestResults(testResults, status, actionTaken, durationMs);

  } catch (error) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("[AutoTest] ❌ Erro ao executar testes:", errorMessage);

    // Registrar erro no banco
    if (db) {
      await db.insert(autoTestRuns).values({
        startedAt,
        completedAt,
        durationMs,
        totalTests: 0,
        passingTests: 0,
        failingTests: 0,
        passRate: 0,
        output: errorMessage.substring(0, 65000),
        status: "failed",
        actionTaken: "error",
      });
    }

    // Notificar erro
    await notifyOwner({
      title: "❌ Erro nos Testes Automáticos",
      content: `Falha crítica ao executar testes noturnos.\n\nErro: ${errorMessage}\nTempo: ${(durationMs / 1000).toFixed(2)}s\nHorário: ${new Date().toLocaleString("pt-BR")}`,
    });
  }
}

/**
 * Parse do output dos testes
 */
function parseTestOutput(output: string): {
  totalTests: number;
  passingTests: number;
  failingTests: number;
  passRate: number;
} {
  // Tentar extrair informações do output do vitest
  const passMatch = output.match(/(\d+) passed/);
  const failMatch = output.match(/(\d+) failed/);
  const totalMatch = output.match(/Test Files\s+\d+ passed.*?\((\d+)\)/);

  const passingTests = passMatch ? parseInt(passMatch[1]) : 0;
  const failingTests = failMatch ? parseInt(failMatch[1]) : 0;
  const totalTests = totalMatch ? parseInt(totalMatch[1]) : passingTests + failingTests;
  const passRate = totalTests > 0 ? (passingTests / totalTests) * 100 : 0;

  return {
    totalTests,
    passingTests,
    failingTests,
    passRate,
  };
}

/**
 * Notifica resultados dos testes
 */
async function notifyTestResults(
  results: ReturnType<typeof parseTestOutput>,
  status: string,
  actionTaken: string,
  durationMs: number
): Promise<void> {
  const shouldNotify =
    (status === "success" && currentConfig.notifyOnSuccess) ||
    (status !== "success" && currentConfig.notifyOnFailure);

  if (!shouldNotify) return;

  let emoji = "✅";
  let title = "Testes Automáticos Concluídos";

  if (status === "threshold-exceeded") {
    emoji = "🚨";
    title = "ALERTA: Testes Falharam Acima do Threshold";
  } else if (status === "failed") {
    emoji = "⚠️";
    title = "Testes com Falhas (Dentro do Threshold)";
  }

  const failureRate = results.totalTests > 0 
    ? ((results.failingTests / results.totalTests) * 100) 
    : 0;

  await notifyOwner({
    title: `${emoji} ${title}`,
    content: `Execução de testes noturnos concluída.\n\n` +
      `📊 Resultados:\n` +
      `• Total: ${results.totalTests} testes\n` +
      `• Passaram: ${results.passingTests} (${results.passRate.toFixed(2)}%)\n` +
      `• Falharam: ${results.failingTests} (${failureRate.toFixed(2)}%)\n\n` +
      `⏱️ Tempo: ${(durationMs / 1000).toFixed(2)}s\n` +
      `🔧 Ação: ${actionTaken}\n` +
      `🕐 Horário: ${new Date().toLocaleString("pt-BR")}`,
  });
}

/**
 * Força execução imediata dos testes (para testes manuais)
 */
export async function forceTestNow(): Promise<void> {
  console.log("[AutoTest] 🧪 Execução manual de testes forçada...");
  await executeScheduledTests();
}

/**
 * Atualiza configuração do agendador
 */
export async function updateTestConfig(config: Partial<TestConfig>): Promise<void> {
  currentConfig = { ...currentConfig, ...config };

  // Reiniciar agendador se necessário
  if (testJob) {
    stopAutoTestScheduler();
    await initializeAutoTestScheduler(currentConfig);
  }

  console.log("[AutoTest] Configuração atualizada");
}

/**
 * Obtém configuração atual
 */
export function getTestConfig(): TestConfig {
  return { ...currentConfig };
}
