import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Schema para Sistema de Alertas Proativos
 * 
 * Tabelas:
 * - alert_configs: Configurações de alertas por usuário
 * - alert_history: Histórico de alertas enviados
 * - alert_templates: Templates de mensagens
 */

export const alertConfigs = mysqlTable("alert_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Canais de notificação
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  emailAddress: varchar("email_address", { length: 320 }),
  
  whatsappEnabled: boolean("whatsapp_enabled").default(false).notNull(),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  
  pushEnabled: boolean("push_enabled").default(true).notNull(),
  
  // Configurações de severidade
  minSeverity: mysqlEnum("min_severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  
  // Tipos de alertas habilitados
  anomalyAlerts: boolean("anomaly_alerts").default(true).notNull(),
  predictionAlerts: boolean("prediction_alerts").default(true).notNull(),
  errorAlerts: boolean("error_alerts").default(true).notNull(),
  performanceAlerts: boolean("performance_alerts").default(true).notNull(),
  
  // Configurações de throttling (evitar spam)
  throttleMinutes: int("throttle_minutes").default(15).notNull(), // Mínimo de minutos entre alertas do mesmo tipo
  
  // Horários permitidos (JSON: {start: "09:00", end: "22:00"})
  allowedHours: json("allowed_hours").$type<{ start: string; end: string }>(),
  
  // Dias da semana permitidos (JSON: [0,1,2,3,4,5,6] onde 0=domingo)
  allowedDays: json("allowed_days").$type<number[]>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const alertHistory = mysqlTable("alert_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  configId: int("config_id"),
  
  // Tipo e severidade
  type: mysqlEnum("type", ["anomaly", "prediction", "error", "performance", "custom"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  
  // Conteúdo
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  
  // Canais de envio
  channels: json("channels").$type<string[]>().notNull(), // ["email", "whatsapp", "push"]
  
  // Status de entrega
  emailSent: boolean("email_sent").default(false).notNull(),
  emailError: text("email_error"),
  
  whatsappSent: boolean("whatsapp_sent").default(false).notNull(),
  whatsappError: text("whatsapp_error"),
  
  pushSent: boolean("push_sent").default(false).notNull(),
  pushError: text("push_error"),
  
  // Relacionamento com origem
  sourceType: varchar("source_type", { length: 50 }), // "anomaly", "prediction", "error"
  sourceId: int("source_id"), // ID da anomalia, predição, etc
  
  // Timestamps
  sentAt: timestamp("sent_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alertTemplates = mysqlTable("alert_templates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação
  name: varchar("name", { length: 100 }).notNull().unique(),
  type: mysqlEnum("type", ["anomaly", "prediction", "error", "performance", "custom"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  
  // Templates por canal
  emailSubject: varchar("email_subject", { length: 255 }),
  emailBody: text("email_body"),
  emailHtml: text("email_html"),
  
  whatsappMessage: text("whatsapp_message"),
  
  pushTitle: varchar("push_title", { length: 100 }),
  pushBody: text("push_body"),
  
  // Variáveis disponíveis (JSON: ["value", "threshold", "component"])
  variables: json("variables").$type<string[]>(),
  
  // Metadados
  isActive: boolean("is_active").default(true).notNull(),
  isSystem: boolean("is_system").default(false).notNull(), // Templates do sistema não podem ser deletados
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AlertConfig = typeof alertConfigs.$inferSelect;
export type InsertAlertConfig = typeof alertConfigs.$inferInsert;

export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

export type AlertTemplate = typeof alertTemplates.$inferSelect;
export type InsertAlertTemplate = typeof alertTemplates.$inferInsert;
