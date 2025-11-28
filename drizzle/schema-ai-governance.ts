import { int, mysqlTable, text, varchar, timestamp, mysqlEnum, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Sistema de Governança para IAs Externas
 * 
 * Este schema gerencia o registro, políticas, sessões e confiança
 * de IAs externas (Comet, ChatGPT, Claude, etc) que se conectam ao servidor.
 */

// Tabela de IAs registradas
export const aiClients = mysqlTable("ai_clients", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Comet", "ChatGPT-4"
  version: varchar("version", { length: 50 }), // Ex: "1.0.0", "gpt-4-turbo"
  provider: varchar("provider", { length: 100 }), // Ex: "OpenAI", "Anthropic", "Custom"
  
  // Certificado único
  clientId: varchar("client_id", { length: 64 }).notNull().unique(), // UUID gerado
  clientSecret: varchar("client_secret", { length: 128 }).notNull(), // Hash do secret
  
  // Informações técnicas
  capabilities: json("capabilities").$type<string[]>(), // ["text", "vision", "code", "web"]
  limitations: text("limitations"), // Limitações conhecidas
  contactEmail: varchar("contact_email", { length: 320 }),
  
  // Status
  status: mysqlEnum("status", ["pending", "active", "suspended", "banned"]).default("pending").notNull(),
  trustScore: int("trust_score").default(50).notNull(), // 0-100
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum"]).default("bronze").notNull(),
  
  // Políticas
  acceptedPoliciesVersion: varchar("accepted_policies_version", { length: 20 }), // Ex: "2.1.0"
  acceptedPoliciesAt: timestamp("accepted_policies_at"),
  
  // Métricas
  totalRequests: int("total_requests").default(0).notNull(),
  successfulRequests: int("successful_requests").default(0).notNull(),
  failedRequests: int("failed_requests").default(0).notNull(),
  totalViolations: int("total_violations").default(0).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastSeenAt: timestamp("last_seen_at"),
});

// Tabela de políticas
export const aiPolicies = mysqlTable("ai_policies", {
  id: int("id").autoincrement().primaryKey(),
  
  version: varchar("version", { length: 20 }).notNull().unique(), // Ex: "2.1.0"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Conteúdo das políticas
  policies: json("policies").$type<{
    rateLimit: { requests: number; window: string }; // Ex: { requests: 100, window: "1m" }
    allowedEndpoints: string[];
    forbiddenActions: string[];
    requiredHeaders: string[];
    dataRetention: string;
    securityRequirements: string[];
  }>().notNull(),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  effectiveFrom: timestamp("effective_from").notNull(),
  gracePeriodDays: int("grace_period_days").default(7).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 255 }), // Admin que criou
});

// Tabela de sessões
export const aiSessions = mysqlTable("ai_sessions", {
  id: int("id").autoincrement().primaryKey(),
  
  clientId: varchar("client_id", { length: 64 }).notNull(), // FK para ai_clients
  sessionToken: varchar("session_token", { length: 128 }).notNull().unique(),
  
  // Contexto da sessão
  context: json("context").$type<{
    conversationId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }>(),
  
  // Políticas reforçadas
  policiesVersion: varchar("policies_version", { length: 20 }).notNull(),
  policiesAcknowledged: boolean("policies_acknowledged").default(false).notNull(),
  
  // Métricas da sessão
  requestCount: int("request_count").default(0).notNull(),
  violationCount: int("violation_count").default(0).notNull(),
  
  // Status
  status: mysqlEnum("status", ["active", "expired", "terminated"]).default("active").notNull(),
  
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  terminatedAt: timestamp("terminated_at"),
});

// Tabela de violações
export const aiViolations = mysqlTable("ai_violations", {
  id: int("id").autoincrement().primaryKey(),
  
  clientId: varchar("client_id", { length: 64 }).notNull(),
  sessionId: int("session_id"),
  
  // Detalhes da violação
  violationType: varchar("violation_type", { length: 100 }).notNull(), // "rate_limit", "forbidden_endpoint", etc
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  description: text("description").notNull(),
  
  // Contexto
  endpoint: varchar("endpoint", { length: 255 }),
  requestData: json("request_data"),
  
  // Ação tomada
  actionTaken: varchar("action_taken", { length: 100 }), // "warning", "rate_limited", "suspended"
  
  // Resolução
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by", { length: 255 }),
  resolution: text("resolution"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela de histórico de trust score
export const aiTrustScoreHistory = mysqlTable("ai_trust_score_history", {
  id: int("id").autoincrement().primaryKey(),
  
  clientId: varchar("client_id", { length: 64 }).notNull(),
  
  // Score
  previousScore: int("previous_score").notNull(),
  newScore: int("new_score").notNull(),
  change: int("change").notNull(), // Pode ser negativo
  
  // Motivo
  reason: varchar("reason", { length: 255 }).notNull(),
  details: text("details"),
  
  // Fatores que influenciaram
  factors: json("factors").$type<{
    successRate?: number;
    violationCount?: number;
    uptime?: number;
    responseQuality?: number;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tipos TypeScript
export type AIClient = typeof aiClients.$inferSelect;
export type InsertAIClient = typeof aiClients.$inferInsert;

export type AIPolicy = typeof aiPolicies.$inferSelect;
export type InsertAIPolicy = typeof aiPolicies.$inferInsert;

export type AISession = typeof aiSessions.$inferSelect;
export type InsertAISession = typeof aiSessions.$inferInsert;

export type AIViolation = typeof aiViolations.$inferSelect;
export type InsertAIViolation = typeof aiViolations.$inferInsert;

export type AITrustScoreHistory = typeof aiTrustScoreHistory.$inferSelect;
export type InsertAITrustScoreHistory = typeof aiTrustScoreHistory.$inferInsert;
