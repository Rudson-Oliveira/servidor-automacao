import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { getDb } from "../db";
import { sistemaPaiBackups, sistemaPaiRestores, sistemaPaiConfig } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notifyOwner } from "./notification";

const execAsync = promisify(exec);

/**
 * SISTEMA PAI - Gerenciamento de Backups e Proteção do Protótipo Original
 * 
 * Este serviço implementa o "Sistema Pai" - similar à fórmula da Coca-Cola.
 * Mantém o protótipo original sempre preservado e gerencia backups rolling de 7 dias.
 */

export interface BackupOptions {
  type?: "daily" | "manual" | "pre-update" | "sistema-pai";
  description?: string;
  notes?: string;
  isPrototypeOriginal?: boolean;
}

export interface RestoreOptions {
  reason: "manual" | "auto-correction-failed" | "critical-error" | "rollback-requested";
  reasonDetails?: string;
  requestedBy: string;
}

export interface SystemState {
  totalTests: number;
  passingTests: number;
  failingTests: number;
  testPassRate: number;
  totalEndpoints: number;
  totalFiles: number;
  totalLines: number;
  dependencies: Record<string, string>;
}

export class SistemaPai {
  private backupDir: string;
  private projectDir: string;

  constructor() {
    this.backupDir = "/home/ubuntu/backups-sistema-pai";
    this.projectDir = "/home/ubuntu/servidor-automacao";
  }

  /**
   * Inicializa o Sistema Pai
   * Cria diretórios necessários e configuração inicial
   */
  async initialize(): Promise<void> {
    // Criar diretório de backups se não existir
    await fs.mkdir(this.backupDir, { recursive: true });

    // Verificar se configuração existe, senão criar
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const configs = await db.select().from(sistemaPaiConfig).limit(1);
    
    if (configs.length === 0) {
      await db.insert(sistemaPaiConfig).values({
        backupEnabled: 1,
        backupTime: "03:00",
        maxBackups: 7,
        autoRestoreEnabled: 1,
        autoRestoreThreshold: 50,
        notifyOnBackup: 0,
        notifyOnRestore: 1,
      });
      console.log("[SistemaPai] Configuração inicial criada");
    }
  }

  /**
   * Cria um backup completo do sistema
   */
  async createBackup(options: BackupOptions = {}): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    console.log(`[SistemaPai] Iniciando backup (tipo: ${options.type || "daily"})...`);

    // Obter estado atual do sistema
    const systemState = await this.getSystemState();
    const healthScore = this.calculateHealthScore(systemState);

    // Obter versão atual (git commit hash)
    const versionId = await this.getCurrentVersionId();

    // Determinar dia da semana para rolling backup
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0-6

    // Criar nome do arquivo de backup
    const backupFileName = `backup-${dayOfWeek}-${Date.now()}.tar.gz`;
    const backupPath = path.join(this.backupDir, backupFileName);

    // Criar backup (tar.gz do diretório do projeto)
    await this.createTarGz(this.projectDir, backupPath);

    // Obter tamanho do backup
    const stats = await fs.stat(backupPath);
    const backupSize = stats.size;

    // Inserir registro no banco
    const [result] = await db.insert(sistemaPaiBackups).values({
      backupDate: now,
      dayOfWeek,
      versionId,
      backupType: options.type || "daily",
      isPrototypeOriginal: options.isPrototypeOriginal ? 1 : 0,
      backupPath,
      backupSize,
      systemState,
      healthScore,
      hasErrors: systemState.failingTests > 0 ? 1 : 0,
      description: options.description || null,
      notes: options.notes || null,
      createdBy: options.type === "manual" ? "manual" : "system",
    });

    const backupId = result.insertId;

    console.log(`[SistemaPai] Backup criado com sucesso (ID: ${backupId}, tamanho: ${(backupSize / 1024 / 1024).toFixed(2)}MB)`);

    // Se é o protótipo original, atualizar config
    if (options.isPrototypeOriginal) {
      await db.update(sistemaPaiConfig)
        .set({ 
          prototypeBackupId: backupId,
          prototypeCreatedAt: now,
        });
      console.log(`[SistemaPai] ⭐ PROTÓTIPO ORIGINAL definido (ID: ${backupId})`);
    }

    // Limpar backups antigos (manter apenas 7 mais recentes por tipo)
    await this.cleanOldBackups();

    // Notificar se configurado
    const config = await this.getConfig();
    if (config.notifyOnBackup) {
      await notifyOwner({
        title: "✅ Backup Criado",
        content: `Backup ${options.type || "daily"} criado com sucesso.\n\nHealth Score: ${healthScore}/100\nTamanho: ${(backupSize / 1024 / 1024).toFixed(2)}MB\nVersão: ${versionId.substring(0, 8)}`,
      });
    }

    return backupId;
  }

  /**
   * Restaura um backup específico
   */
  async restoreBackup(backupId: number, options: RestoreOptions): Promise<boolean> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    console.log(`[SistemaPai] Iniciando restauração do backup ID: ${backupId}...`);

    // Buscar backup
    const [backup] = await db.select().from(sistemaPaiBackups).where(eq(sistemaPaiBackups.id, backupId));
    if (!backup) {
      throw new Error(`Backup ID ${backupId} não encontrado`);
    }

    // Obter estado atual antes da restauração
    const currentState = await this.getSystemState();
    const currentVersionId = await this.getCurrentVersionId();
    const currentHealthScore = this.calculateHealthScore(currentState);

    const startedAt = new Date();

    try {
      // Criar backup de segurança antes de restaurar
      console.log("[SistemaPai] Criando backup de segurança antes da restauração...");
      await this.createBackup({
        type: "pre-update",
        description: `Backup automático antes de restaurar para versão ${backup.versionId.substring(0, 8)}`,
      });

      // Extrair backup
      await this.extractTarGz(backup.backupPath, this.projectDir);

      // Reinstalar dependências
      console.log("[SistemaPai] Reinstalando dependências...");
      await execAsync("cd /home/ubuntu/servidor-automacao && pnpm install", { timeout: 120000 });

      // Reiniciar servidor (será feito automaticamente pelo tsx watch)
      
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      // Registrar restauração bem-sucedida
      await db.insert(sistemaPaiRestores).values({
        backupId,
        previousVersionId: currentVersionId,
        previousHealthScore: currentHealthScore,
        reason: options.reason,
        reasonDetails: options.reasonDetails || null,
        success: 1,
        errorMessage: null,
        startedAt,
        completedAt,
        durationMs,
        requestedBy: options.requestedBy,
      });

      // Atualizar contador de restaurações no backup
      await db.update(sistemaPaiBackups)
        .set({
          lastRestored: completedAt,
          restoreCount: backup.restoreCount + 1,
        })
        .where(eq(sistemaPaiBackups.id, backupId));

      console.log(`[SistemaPai] ✅ Restauração concluída com sucesso em ${(durationMs / 1000).toFixed(2)}s`);

      // Notificar
      const config = await this.getConfig();
      if (config.notifyOnRestore) {
        await notifyOwner({
          title: "🔄 Sistema Restaurado",
          content: `Sistema restaurado com sucesso para versão ${backup.versionId.substring(0, 8)}.\n\nMotivo: ${options.reason}\nTempo: ${(durationMs / 1000).toFixed(2)}s\nHealth Score anterior: ${currentHealthScore}/100\nHealth Score do backup: ${backup.healthScore}/100`,
        });
      }

      return true;
    } catch (error) {
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Registrar falha
      await db.insert(sistemaPaiRestores).values({
        backupId,
        previousVersionId: currentVersionId,
        previousHealthScore: currentHealthScore,
        reason: options.reason,
        reasonDetails: options.reasonDetails || null,
        success: 0,
        errorMessage,
        startedAt,
        completedAt,
        durationMs,
        requestedBy: options.requestedBy,
      });

      console.error(`[SistemaPai] ❌ Falha na restauração: ${errorMessage}`);

      // Notificar falha
      await notifyOwner({
        title: "❌ Falha na Restauração",
        content: `Erro ao restaurar sistema para versão ${backup.versionId.substring(0, 8)}.\n\nErro: ${errorMessage}\nTempo: ${(durationMs / 1000).toFixed(2)}s`,
      });

      return false;
    }
  }

  /**
   * Restaura o protótipo original
   */
  async restorePrototype(options: Omit<RestoreOptions, "reason">): Promise<boolean> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const config = await this.getConfig();
    if (!config.prototypeBackupId) {
      throw new Error("Protótipo original não definido");
    }

    console.log(`[SistemaPai] ⭐ Restaurando PROTÓTIPO ORIGINAL (ID: ${config.prototypeBackupId})...`);

    return await this.restoreBackup(config.prototypeBackupId, {
      ...options,
      reason: "rollback-requested",
      reasonDetails: "Restauração do protótipo original (fórmula da Coca-Cola)",
    });
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups(limit: number = 20): Promise<typeof sistemaPaiBackups.$inferSelect[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db.select()
      .from(sistemaPaiBackups)
      .orderBy(desc(sistemaPaiBackups.backupDate))
      .limit(limit);
  }

  /**
   * Obtém configuração do Sistema Pai
   */
  async getConfig(): Promise<typeof sistemaPaiConfig.$inferSelect> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [config] = await db.select().from(sistemaPaiConfig).limit(1);
    if (!config) {
      throw new Error("Configuração do Sistema Pai não encontrada");
    }

    return config;
  }

  /**
   * Atualiza configuração do Sistema Pai
   */
  async updateConfig(updates: Partial<typeof sistemaPaiConfig.$inferSelect>): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.update(sistemaPaiConfig).set(updates);
    console.log("[SistemaPai] Configuração atualizada");
  }

  // ========================================
  // Métodos Auxiliares Privados
  // ========================================

  private async getSystemState(): Promise<SystemState> {
    try {
      // Executar testes e coletar estatísticas
      const { stdout } = await execAsync("cd /home/ubuntu/servidor-automacao && pnpm test --run 2>&1 || true", { timeout: 120000 });
      
      // Parse do output dos testes
      const testMatch = stdout.match(/(\d+) passed/);
      const failMatch = stdout.match(/(\d+) failed/);
      const totalMatch = stdout.match(/Test Files\s+\d+ passed.*?\((\d+)\)/);
      
      const passingTests = testMatch ? parseInt(testMatch[1]) : 0;
      const failingTests = failMatch ? parseInt(failMatch[1]) : 0;
      const totalTests = totalMatch ? parseInt(totalMatch[1]) : passingTests + failingTests;
      const testPassRate = totalTests > 0 ? (passingTests / totalTests) * 100 : 0;

      // Contar arquivos e linhas
      const { stdout: fileCount } = await execAsync("find /home/ubuntu/servidor-automacao -type f \\( -name '*.ts' -o -name '*.tsx' \\) | wc -l");
      const { stdout: lineCount } = await execAsync("find /home/ubuntu/servidor-automacao -type f \\( -name '*.ts' -o -name '*.tsx' \\) -exec wc -l {} + | tail -1 | awk '{print $1}'");
      
      // Contar endpoints (aproximado)
      const { stdout: endpointCount } = await execAsync("grep -r 'router\\.' /home/ubuntu/servidor-automacao/server/routers/*.ts | wc -l");

      // Ler dependências do package.json
      const packageJson = JSON.parse(await fs.readFile("/home/ubuntu/servidor-automacao/package.json", "utf-8"));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      return {
        totalTests,
        passingTests,
        failingTests,
        testPassRate,
        totalEndpoints: parseInt(endpointCount.trim()),
        totalFiles: parseInt(fileCount.trim()),
        totalLines: parseInt(lineCount.trim()),
        dependencies,
      };
    } catch (error) {
      console.error("[SistemaPai] Erro ao obter estado do sistema:", error);
      return {
        totalTests: 0,
        passingTests: 0,
        failingTests: 0,
        testPassRate: 0,
        totalEndpoints: 0,
        totalFiles: 0,
        totalLines: 0,
        dependencies: {},
      };
    }
  }

  private calculateHealthScore(state: SystemState): number {
    // Health score baseado em múltiplos fatores
    let score = 0;

    // 50% baseado em taxa de aprovação de testes
    score += (state.testPassRate / 100) * 50;

    // 30% baseado em não ter testes falhando
    if (state.failingTests === 0) {
      score += 30;
    } else if (state.failingTests <= 2) {
      score += 20;
    } else if (state.failingTests <= 5) {
      score += 10;
    }

    // 20% baseado em ter testes (mínimo 100)
    if (state.totalTests >= 100) {
      score += 20;
    } else if (state.totalTests >= 50) {
      score += 10;
    }

    return Math.min(100, Math.round(score));
  }

  private async getCurrentVersionId(): Promise<string> {
    try {
      const { stdout } = await execAsync("cd /home/ubuntu/servidor-automacao && git rev-parse HEAD");
      return stdout.trim();
    } catch {
      return "unknown";
    }
  }

  private async createTarGz(sourceDir: string, targetFile: string): Promise<void> {
    // Excluir node_modules, .git, backups, etc
    const excludes = [
      "--exclude=node_modules",
      "--exclude=.git",
      "--exclude=dist",
      "--exclude=build",
      "--exclude=*.log",
      "--exclude=backups-sistema-pai",
    ].join(" ");

    await execAsync(`tar -czf ${targetFile} ${excludes} -C ${path.dirname(sourceDir)} ${path.basename(sourceDir)}`);
  }

  private async extractTarGz(tarFile: string, targetDir: string): Promise<void> {
    // Remover diretório atual (exceto node_modules e backups)
    await execAsync(`find ${targetDir} -mindepth 1 -maxdepth 1 ! -name node_modules ! -name backups-sistema-pai -exec rm -rf {} +`);
    
    // Extrair backup
    await execAsync(`tar -xzf ${tarFile} -C ${path.dirname(targetDir)} --strip-components=1`);
  }

  private async cleanOldBackups(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const config = await this.getConfig();
    
    // Buscar backups por tipo, ordenados por data (mais recentes primeiro)
    const allBackups = await db.select()
      .from(sistemaPaiBackups)
      .orderBy(desc(sistemaPaiBackups.backupDate));

    // Agrupar por tipo
    const byType: Record<string, typeof sistemaPaiBackups.$inferSelect[]> = {};
    for (const backup of allBackups) {
      if (!byType[backup.backupType]) {
        byType[backup.backupType] = [];
      }
      byType[backup.backupType].push(backup);
    }

    // Para cada tipo, manter apenas os N mais recentes (exceto protótipo original)
    for (const [type, backups] of Object.entries(byType)) {
      if (backups.length > config.maxBackups) {
        const toDelete = backups.slice(config.maxBackups);
        
        for (const backup of toDelete) {
          // NUNCA deletar protótipo original
          if (backup.isPrototypeOriginal === 1) {
            console.log(`[SistemaPai] ⭐ Protótipo original preservado (ID: ${backup.id})`);
            continue;
          }

          // Deletar arquivo físico
          try {
            await fs.unlink(backup.backupPath);
          } catch (error) {
            console.warn(`[SistemaPai] Aviso: Não foi possível deletar arquivo ${backup.backupPath}`);
          }

          // Deletar registro do banco
          await db.delete(sistemaPaiBackups).where(eq(sistemaPaiBackups.id, backup.id));
          console.log(`[SistemaPai] Backup antigo removido (ID: ${backup.id}, tipo: ${type})`);
        }
      }
    }
  }
}

// Instância singleton
export const sistemaPai = new SistemaPai();
