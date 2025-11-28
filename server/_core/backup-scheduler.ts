import { CronJob } from "cron";
import { sistemaPai } from "./sistema-pai";
import { notifyOwner } from "./notification";

/**
 * AGENDADOR DE BACKUPS NOTURNOS
 * 
 * Executa backups automáticos diários às 3h da manhã (horário de baixo uso)
 */

let backupJob: CronJob | null = null;

/**
 * Inicializa o agendador de backups
 */
export async function initializeBackupScheduler(): Promise<void> {
  try {
    // Inicializar Sistema Pai
    await sistemaPai.initialize();
    console.log("[BackupScheduler] Sistema Pai inicializado");

    // Obter configuração
    const config = await sistemaPai.getConfig();

    if (!config.backupEnabled) {
      console.log("[BackupScheduler] Backups automáticos desabilitados");
      return;
    }

    // Parse do horário (formato HH:MM)
    const [hour, minute] = config.backupTime.split(":").map(Number);

    // Criar cron job (executar diariamente no horário configurado)
    // Formato: segundo minuto hora dia mês dia-da-semana
    const cronPattern = `0 ${minute} ${hour} * * *`;

    backupJob = new CronJob(
      cronPattern,
      async () => {
        await executeScheduledBackup();
      },
      null, // onComplete
      true, // start
      "America/Sao_Paulo" // timezone
    );

    console.log(`[BackupScheduler] ✅ Agendador iniciado - Backups diários às ${config.backupTime}`);

    // Criar backup inicial se não houver nenhum
    const backups = await sistemaPai.listBackups(1);
    if (backups.length === 0) {
      console.log("[BackupScheduler] Nenhum backup encontrado, criando backup inicial...");
      await executeScheduledBackup();
    }
  } catch (error) {
    console.error("[BackupScheduler] Erro ao inicializar agendador:", error);
  }
}

/**
 * Para o agendador de backups
 */
export function stopBackupScheduler(): void {
  if (backupJob) {
    backupJob.stop();
    backupJob = null;
    console.log("[BackupScheduler] Agendador parado");
  }
}

/**
 * Executa backup agendado
 */
async function executeScheduledBackup(): Promise<void> {
  console.log("[BackupScheduler] 🔄 Iniciando backup agendado...");

  try {
    const startTime = Date.now();

    // Criar backup
    const backupId = await sistemaPai.createBackup({
      type: "daily",
      description: `Backup automático diário - ${new Date().toLocaleString("pt-BR")}`,
      notes: "Backup agendado executado automaticamente pelo sistema",
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[BackupScheduler] ✅ Backup concluído em ${duration}s (ID: ${backupId})`);

    // Notificar se configurado
    const config = await sistemaPai.getConfig();
    if (config.notifyOnBackup) {
      await notifyOwner({
        title: "✅ Backup Automático Concluído",
        content: `Backup diário criado com sucesso.\n\nID: ${backupId}\nTempo: ${duration}s\nHorário: ${new Date().toLocaleString("pt-BR")}`,
      });
    }
  } catch (error) {
    console.error("[BackupScheduler] ❌ Erro ao executar backup agendado:", error);

    // Notificar erro
    await notifyOwner({
      title: "❌ Erro no Backup Automático",
      content: `Falha ao criar backup diário.\n\nErro: ${error instanceof Error ? error.message : String(error)}\nHorário: ${new Date().toLocaleString("pt-BR")}`,
    });
  }
}

/**
 * Força execução imediata de um backup (para testes)
 */
export async function forceBackupNow(): Promise<number> {
  console.log("[BackupScheduler] 🔄 Backup manual forçado...");
  return await sistemaPai.createBackup({
    type: "manual",
    description: "Backup manual forçado via API",
  });
}
