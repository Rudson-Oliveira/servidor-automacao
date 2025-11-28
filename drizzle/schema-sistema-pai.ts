import { int, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * SISTEMA PAI - Backup e Proteção do Protótipo Original
 * 
 * Este schema gerencia o "Sistema Pai" - a fórmula original que NUNCA pode ser perdida.
 * Similar à fórmula da Coca-Cola, mantemos o protótipo original sempre preservado.
 */

/**
 * Tabela de backups automáticos do sistema
 * Mantém 7 versões rolling (1 por dia da semana)
 */
export const sistemaPaiBackups = mysqlTable("sistema_pai_backups", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação do backup
  backupDate: timestamp("backup_date").notNull(), // Data/hora do backup
  dayOfWeek: int("day_of_week").notNull(), // 0-6 (Domingo-Sábado) para rolling
  versionId: varchar("version_id", { length: 64 }).notNull(), // ID da versão (git commit hash)
  
  // Tipo de backup
  backupType: varchar("backup_type", { length: 50 }).notNull(), // 'daily', 'manual', 'pre-update', 'sistema-pai'
  isPrototypeOriginal: int("is_prototype_original").notNull().default(0), // 1 = Protótipo Original (NUNCA deletar)
  
  // Localização do backup
  backupPath: text("backup_path").notNull(), // Caminho completo do arquivo .tar.gz
  backupSize: int("backup_size").notNull(), // Tamanho em bytes
  
  // Metadados do sistema no momento do backup
  systemState: json("system_state").$type<{
    totalTests: number;
    passingTests: number;
    failingTests: number;
    testPassRate: number;
    totalEndpoints: number;
    totalFiles: number;
    totalLines: number;
    dependencies: Record<string, string>;
  }>().notNull(),
  
  // Informações de saúde
  healthScore: int("health_score").notNull(), // 0-100
  hasErrors: int("has_errors").notNull().default(0), // 1 = tinha erros no momento do backup
  
  // Descrição e notas
  description: text("description"), // Descrição do que foi feito antes deste backup
  notes: text("notes"), // Notas adicionais
  
  // Controle
  createdBy: varchar("created_by", { length: 100 }).notNull().default("system"), // 'system', 'manual', 'auto-correction'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Restauração
  lastRestored: timestamp("last_restored"), // Última vez que este backup foi restaurado
  restoreCount: int("restore_count").notNull().default(0), // Quantas vezes foi restaurado
});

/**
 * Tabela de histórico de restaurações
 * Registra todas as vezes que um backup foi restaurado
 */
export const sistemaPaiRestores = mysqlTable("sistema_pai_restores", {
  id: int("id").autoincrement().primaryKey(),
  
  // Backup restaurado
  backupId: int("backup_id").notNull(), // FK para sistema_pai_backups
  
  // Estado antes da restauração
  previousVersionId: varchar("previous_version_id", { length: 64 }).notNull(),
  previousHealthScore: int("previous_health_score").notNull(),
  
  // Motivo da restauração
  reason: varchar("reason", { length: 100 }).notNull(), // 'manual', 'auto-correction-failed', 'critical-error', 'rollback-requested'
  reasonDetails: text("reason_details"), // Detalhes do motivo
  
  // Resultado da restauração
  success: int("success").notNull(), // 1 = sucesso, 0 = falha
  errorMessage: text("error_message"), // Se falhou, qual foi o erro
  
  // Tempo de execução
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  durationMs: int("duration_ms"), // Tempo em milissegundos
  
  // Quem solicitou
  requestedBy: varchar("requested_by", { length: 100 }).notNull(), // 'system', 'user:rudson', 'auto-correction'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Tabela de configuração do Sistema Pai
 * Configurações globais do sistema de backup
 */
export const sistemaPaiConfig = mysqlTable("sistema_pai_config", {
  id: int("id").autoincrement().primaryKey(),
  
  // Configurações de backup
  backupEnabled: int("backup_enabled").notNull().default(1), // 1 = ativo
  backupTime: varchar("backup_time", { length: 5 }).notNull().default("03:00"), // Horário do backup diário (HH:MM)
  maxBackups: int("max_backups").notNull().default(7), // Máximo de backups rolling
  
  // Configurações de restauração automática
  autoRestoreEnabled: int("auto_restore_enabled").notNull().default(1), // 1 = restaurar automaticamente em caso de erro crítico
  autoRestoreThreshold: int("auto_restore_threshold").notNull().default(50), // Se health score < 50, restaurar automaticamente
  
  // Protótipo original
  prototypeBackupId: int("prototype_backup_id"), // ID do backup do protótipo original
  prototypeCreatedAt: timestamp("prototype_created_at"), // Quando o protótipo foi criado
  
  // Notificações
  notifyOnBackup: int("notify_on_backup").notNull().default(0), // 1 = notificar a cada backup
  notifyOnRestore: int("notify_on_restore").notNull().default(1), // 1 = notificar a cada restauração
  notifyEmail: varchar("notify_email", { length: 255 }), // Email para notificações
  notifyWhatsapp: varchar("notify_whatsapp", { length: 20 }), // WhatsApp para notificações
  
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SistemaPaiBackup = typeof sistemaPaiBackups.$inferSelect;
export type InsertSistemaPaiBackup = typeof sistemaPaiBackups.$inferInsert;
export type SistemaPaiRestore = typeof sistemaPaiRestores.$inferSelect;
export type InsertSistemaPaiRestore = typeof sistemaPaiRestores.$inferInsert;
export type SistemaPaiConfig = typeof sistemaPaiConfig.$inferSelect;
export type InsertSistemaPaiConfig = typeof sistemaPaiConfig.$inferInsert;
