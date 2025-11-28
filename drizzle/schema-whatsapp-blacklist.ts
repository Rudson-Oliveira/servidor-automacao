import { int, mysqlTable, text, timestamp, varchar, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * Tabela de Blacklist do WhatsApp
 * Armazena contatos que bloquearam, denunciaram ou devem ser excluídos
 */
export const whatsappBlacklist = mysqlTable("whatsapp_blacklist", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Número de telefone no formato internacional (+5521999999999) */
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  
  /** Motivo da exclusão */
  reason: mysqlEnum("reason", [
    "blocked",      // Usuário bloqueou nosso número
    "reported",     // Usuário denunciou como spam
    "invalid",      // Número inválido/inexistente
    "opt_out",      // Usuário pediu para não receber mais
    "manual",       // Adicionado manualmente
  ]).notNull(),
  
  /** Número WhatsApp que foi bloqueado pelo contato */
  blockedNumber: varchar("blocked_number", { length: 20 }),
  
  /** Detalhes adicionais sobre o bloqueio */
  details: text("details"),
  
  /** Nome do contato (se disponível) */
  contactName: varchar("contact_name", { length: 255 }),
  
  /** Última vaga/campanha que foi enviada */
  lastCampaign: varchar("last_campaign", { length: 255 }),
  
  /** Quantidade de tentativas de envio antes do bloqueio */
  attemptCount: int("attempt_count").default(0),
  
  /** Data/hora em que foi detectado o bloqueio */
  blockedAt: timestamp("blocked_at").defaultNow().notNull(),
  
  /** Data/hora de criação do registro */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  /** Notas adicionais (opcional) */
  notes: text("notes"),
});

/**
 * Tabela de Histórico de Envios WhatsApp
 * Rastreia todas as mensagens enviadas para detectar padrões de bloqueio
 */
export const whatsappSendHistory = mysqlTable("whatsapp_send_history", {
  id: int("id").autoincrement().primaryKey(),
  
  /** ID da mensagem na fila */
  messageId: varchar("message_id", { length: 100 }).notNull(),
  
  /** Número que enviou */
  senderNumber: varchar("sender_number", { length: 20 }).notNull(),
  
  /** Número destinatário */
  recipientPhone: varchar("recipient_phone", { length: 20 }).notNull(),
  
  /** Status da mensagem */
  status: mysqlEnum("status", [
    "pending",      // Na fila
    "sent",         // Enviada
    "delivered",    // Entregue
    "read",         // Lida
    "failed",       // Falhou
    "blocked",      // Bloqueada (destinatário bloqueou)
  ]).notNull().default("pending"),
  
  /** Conteúdo da mensagem (primeiros 500 caracteres) */
  messagePreview: text("message_preview"),
  
  /** Template usado */
  templateId: varchar("template_id", { length: 100 }),
  
  /** Campanha/vaga relacionada */
  campaign: varchar("campaign", { length: 255 }),
  
  /** Código de erro (se falhou) */
  errorCode: varchar("error_code", { length: 50 }),
  
  /** Mensagem de erro */
  errorMessage: text("error_message"),
  
  /** Data/hora de envio */
  sentAt: timestamp("sent_at"),
  
  /** Data/hora de entrega */
  deliveredAt: timestamp("delivered_at"),
  
  /** Data/hora de leitura */
  readAt: timestamp("read_at"),
  
  /** Data/hora de criação */
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Tabela de Alertas de Bloqueio
 * Registra quando múltiplos bloqueios são detectados
 */
export const whatsappBlockAlerts = mysqlTable("whatsapp_block_alerts", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Número WhatsApp afetado */
  affectedNumber: varchar("affected_number", { length: 20 }).notNull(),
  
  /** Tipo de alerta */
  alertType: mysqlEnum("alert_type", [
    "multiple_blocks",    // Múltiplos bloqueios em curto período
    "high_failure_rate",  // Alta taxa de falha
    "spam_detected",      // Padrão de spam detectado
    "number_at_risk",     // Número em risco de banimento
  ]).notNull(),
  
  /** Severidade */
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  
  /** Quantidade de bloqueios/falhas */
  count: int("count").notNull(),
  
  /** Período de tempo (em horas) */
  periodHours: int("period_hours").notNull(),
  
  /** Detalhes do alerta */
  details: text("details"),
  
  /** Se o owner foi notificado */
  ownerNotified: int("owner_notified").default(0), // 0 = não, 1 = sim
  
  /** Data/hora da notificação */
  notifiedAt: timestamp("notified_at"),
  
  /** Status do alerta */
  status: mysqlEnum("status", ["active", "resolved", "ignored"]).default("active"),
  
  /** Data/hora de criação */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  /** Data/hora de resolução */
  resolvedAt: timestamp("resolved_at"),
});

export type WhatsappBlacklist = typeof whatsappBlacklist.$inferSelect;
export type InsertWhatsappBlacklist = typeof whatsappBlacklist.$inferInsert;

export type WhatsappSendHistory = typeof whatsappSendHistory.$inferSelect;
export type InsertWhatsappSendHistory = typeof whatsappSendHistory.$inferInsert;

export type WhatsappBlockAlert = typeof whatsappBlockAlerts.$inferSelect;
export type InsertWhatsappBlockAlert = typeof whatsappBlockAlerts.$inferInsert;
