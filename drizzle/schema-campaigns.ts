import { int, mysqlTable, text, timestamp, varchar, mysqlEnum, boolean, json } from 'drizzle-orm/mysql-core';

/**
 * Templates de Mensagens WhatsApp
 */
export const whatsappTemplates = mysqlTable('whatsapp_templates', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }), // recrutamento, marketing, suporte, etc
  content: text('content').notNull(), // Conteúdo com variáveis {{nome}}, {{vaga}}, etc
  variables: json('variables').$type<string[]>(), // ['nome', 'vaga', 'empresa']
  description: text('description'),
  createdBy: int('created_by'), // ID do usuário
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

/**
 * Campanhas de Envio em Massa
 */
export const whatsappCampaigns = mysqlTable('whatsapp_campaigns', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  templateId: int('template_id'), // FK para whatsapp_templates
  sessionId: varchar('session_id', { length: 100 }).notNull(), // Sessão WhatsApp Web
  status: mysqlEnum('status', [
    'draft',
    'scheduled',
    'running',
    'paused',
    'completed',
    'cancelled',
    'failed',
  ])
    .default('draft')
    .notNull(),

  // Agendamento
  scheduledStart: timestamp('scheduled_start'),
  scheduledEnd: timestamp('scheduled_end'),
  allowedHoursStart: int('allowed_hours_start').default(9), // 9h
  allowedHoursEnd: int('allowed_hours_end').default(18), // 18h

  // Limites
  maxMessagesPerHour: int('max_messages_per_hour').default(40),
  maxMessagesPerDay: int('max_messages_per_day').default(300),

  // Auto-pause baseado em bloqueios
  autoPauseEnabled: boolean('auto_pause_enabled').default(true),
  autoPauseThreshold: int('auto_pause_threshold').default(5), // Pausar se 5% de bloqueios

  // Estatísticas
  totalContacts: int('total_contacts').default(0),
  messagesSent: int('messages_sent').default(0),
  messagesDelivered: int('messages_delivered').default(0),
  messagesRead: int('messages_read').default(0),
  messagesFailed: int('messages_failed').default(0),
  messagesBlocked: int('messages_blocked').default(0),

  // Metadados
  createdBy: int('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  pausedAt: timestamp('paused_at'),
  pauseReason: text('pause_reason'),
});

/**
 * Contatos de Campanha
 */
export const whatsappCampaignContacts = mysqlTable('whatsapp_campaign_contacts', {
  id: int('id').autoincrement().primaryKey(),
  campaignId: int('campaign_id').notNull(), // FK para whatsapp_campaigns
  phone: varchar('phone', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }),
  variables: json('variables').$type<Record<string, string>>(), // { vaga: 'Desenvolvedor', empresa: 'TechCorp' }

  // Status de envio
  status: mysqlEnum('status', ['pending', 'sent', 'delivered', 'read', 'failed', 'blocked'])
    .default('pending')
    .notNull(),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
  failedAt: timestamp('failed_at'),
  errorMessage: text('error_message'),

  // Metadados
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type WhatsAppTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsAppTemplate = typeof whatsappTemplates.$inferInsert;

export type WhatsAppCampaign = typeof whatsappCampaigns.$inferSelect;
export type InsertWhatsAppCampaign = typeof whatsappCampaigns.$inferInsert;

export type WhatsAppCampaignContact = typeof whatsappCampaignContacts.$inferSelect;
export type InsertWhatsAppCampaignContact = typeof whatsappCampaignContacts.$inferInsert;
