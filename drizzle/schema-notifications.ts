import { int, mysqlTable, text, timestamp, varchar, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * Tabela de notificações do Desktop Control System
 * Armazena todas as notificações enviadas aos usuários
 */
export const desktopNotifications = mysqlTable("desktop_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // ID do usuário que receberá a notificação
  agentId: int("agent_id"), // ID do agent relacionado (opcional)
  commandId: int("command_id"), // ID do comando relacionado (opcional)
  
  // Tipo de notificação
  type: mysqlEnum("type", [
    "command_blocked",      // Comando crítico bloqueado
    "agent_offline",        // Agent ficou offline
    "command_failed",       // Comando falhou após múltiplas tentativas
    "screenshot_captured",  // Screenshot capturado com sucesso
    "agent_online",         // Agent voltou online
    "command_success",      // Comando executado com sucesso
    "security_alert",       // Alerta de segurança
  ]).notNull(),
  
  // Severidade da notificação
  severity: mysqlEnum("severity", ["info", "warning", "error", "critical"]).notNull().default("info"),
  
  // Conteúdo da notificação
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON com dados adicionais
  
  // Status da notificação
  isRead: int("is_read").notNull().default(0), // 0 = não lida, 1 = lida
  readAt: timestamp("read_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DesktopNotification = typeof desktopNotifications.$inferSelect;
export type InsertDesktopNotification = typeof desktopNotifications.$inferInsert;
