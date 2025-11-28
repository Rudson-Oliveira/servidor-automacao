import { int, mysqlTable, text, timestamp, varchar, json, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * Sistema de Webhooks para Integração Externa
 * 
 * Permite enviar eventos do sistema para URLs externas,
 * proporcionando saídas alternativas quando há restrições.
 */

export const webhooks_config = mysqlTable("webhooks_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  
  // Eventos que disparam o webhook
  events: json("events").$type<string[]>().notNull(), // ['command_executed', 'command_failed', 'agent_offline', 'screenshot_captured']
  
  // Autenticação HMAC SHA-256
  secret: varchar("secret", { length: 255 }), // Secret para assinar payloads
  
  // Headers customizados
  headers: json("headers").$type<Record<string, string>>(),
  
  // Configurações de retry
  maxRetries: int("max_retries").default(3).notNull(),
  retryDelay: int("retry_delay").default(5000).notNull(), // ms
  
  // Status
  isActive: int("is_active").default(1).notNull(), // 0 = inativo, 1 = ativo
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastTriggeredAt: timestamp("last_triggered_at"),
});

export const webhooks_logs = mysqlTable("webhooks_logs", {
  id: int("id").autoincrement().primaryKey(),
  webhookId: int("webhook_id").notNull(),
  userId: int("user_id").notNull(),
  
  // Evento que disparou
  event: varchar("event", { length: 100 }).notNull(),
  
  // Payload enviado
  payload: json("payload").$type<Record<string, any>>().notNull(),
  
  // Resposta recebida
  statusCode: int("status_code"),
  responseBody: text("response_body"),
  
  // Status da tentativa
  status: mysqlEnum("status", ["pending", "success", "failed", "retrying"]).notNull(),
  
  // Retry
  attempt: int("attempt").default(1).notNull(),
  errorMessage: text("error_message"),
  
  // Timing
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  durationMs: int("duration_ms"),
});

export type WebhookConfig = typeof webhooks_config.$inferSelect;
export type InsertWebhookConfig = typeof webhooks_config.$inferInsert;
export type WebhookLog = typeof webhooks_logs.$inferSelect;
export type InsertWebhookLog = typeof webhooks_logs.$inferInsert;
