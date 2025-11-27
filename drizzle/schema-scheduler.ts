import { int, mysqlTable, text, timestamp, varchar, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * Tabela de comandos agendados
 * Armazena comandos para execução futura (horário específico ou intervalo)
 */
export const desktopScheduledCommands = mysqlTable("desktop_scheduled_commands", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // ID do usuário que criou o agendamento
  agentId: int("agent_id").notNull(), // ID do agent que executará o comando
  
  // Comando a ser executado
  command: text("command").notNull(),
  description: varchar("description", { length: 500 }), // Descrição do agendamento
  
  // Tipo de agendamento
  scheduleType: mysqlEnum("schedule_type", [
    "once",       // Executar uma vez em horário específico
    "interval",   // Executar em intervalos regulares
    "cron",       // Executar baseado em expressão cron
    "event",      // Executar baseado em evento (ex: quando agent conectar)
  ]).notNull(),
  
  // Configuração do agendamento
  scheduleConfig: text("schedule_config").notNull(), // JSON com configuração específica
  
  // Controle de execução
  status: mysqlEnum("status", [
    "active",     // Agendamento ativo
    "paused",     // Agendamento pausado
    "completed",  // Agendamento concluído (apenas para "once")
    "failed",     // Agendamento falhou
  ]).notNull().default("active"),
  
  // Retry automático
  maxRetries: int("max_retries").notNull().default(3),
  currentRetries: int("current_retries").notNull().default(0),
  
  // Histórico de execução
  lastExecutedAt: timestamp("last_executed_at"),
  nextExecutionAt: timestamp("next_execution_at"),
  lastResult: text("last_result"), // Resultado da última execução
  lastError: text("last_error"), // Erro da última execução (se houver)
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DesktopScheduledCommand = typeof desktopScheduledCommands.$inferSelect;
export type InsertDesktopScheduledCommand = typeof desktopScheduledCommands.$inferInsert;

/**
 * Exemplos de scheduleConfig (JSON):
 * 
 * once: { executeAt: "2024-01-15T14:30:00Z" }
 * interval: { intervalMinutes: 60, startAt: "2024-01-15T00:00:00Z" }
 * cron: { cronExpression: "0 2 * * *" } // Diariamente às 2h
 * event: { eventType: "agent_connect" }
 */
