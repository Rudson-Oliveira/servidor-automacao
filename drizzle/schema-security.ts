import { int, mysqlTable, text, timestamp, varchar, mysqlEnum } from "drizzle-orm/mysql-core";
import { index } from "drizzle-orm/mysql-core";

/**
 * 🛡️ SCHEMA DE SEGURANÇA PARA DESKTOP CONTROL
 * 
 * Sistema de validação e auditoria de comandos shell para prevenir
 * execução de comandos perigosos.
 * 
 * Componentes:
 * - Command Whitelist: Comandos permitidos (padrões seguros)
 * - Command Blacklist: Comandos bloqueados (padrões perigosos)
 * - Command Audit: Auditoria completa de todas as tentativas de execução
 */


/**
 * Whitelist de comandos permitidos
 * Define padrões de comandos que são considerados seguros
 */
export const commandWhitelist = mysqlTable("command_whitelist", {
  id: int("id").autoincrement().primaryKey(),
  pattern: varchar("pattern", { length: 500 }).notNull(), // Padrão regex ou string exata
  description: text("description"), // Descrição do que o padrão permite
  category: varchar("category", { length: 100 }), // Categoria (ex: "filesystem", "network", "system")
  isActive: mysqlEnum("is_active", ["yes", "no"]).default("yes").notNull(),
  createdBy: int("created_by").notNull(), // User ID que criou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  isActiveIdx: index("is_active_idx").on(table.isActive),
}));

export type CommandWhitelist = typeof commandWhitelist.$inferSelect;
export type InsertCommandWhitelist = typeof commandWhitelist.$inferInsert;


/**
 * Blacklist de comandos bloqueados
 * Define padrões de comandos que são considerados perigosos
 */
export const commandBlacklist = mysqlTable("command_blacklist", {
  id: int("id").autoincrement().primaryKey(),
  pattern: varchar("pattern", { length: 500 }).notNull(), // Padrão regex ou string exata
  description: text("description"), // Descrição do perigo
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  requiresConfirmation: mysqlEnum("requires_confirmation", ["yes", "no"]).default("yes").notNull(), // Se requer confirmação manual
  isActive: mysqlEnum("is_active", ["yes", "no"]).default("yes").notNull(),
  createdBy: int("created_by").notNull(), // User ID que criou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  severityIdx: index("severity_idx").on(table.severity),
  isActiveIdx: index("is_active_idx").on(table.isActive),
}));

export type CommandBlacklist = typeof commandBlacklist.$inferSelect;
export type InsertCommandBlacklist = typeof commandBlacklist.$inferInsert;


/**
 * Auditoria de comandos
 * Registra TODAS as tentativas de execução de comandos (permitidos ou bloqueados)
 */
export const commandAudit = mysqlTable("command_audit", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // Quem tentou executar
  agentId: int("agent_id").notNull(), // Em qual agent
  commandId: int("command_id"), // FK para desktop_commands (se foi criado)
  command: text("command").notNull(), // Comando completo tentado
  action: mysqlEnum("action", ["allowed", "blocked", "confirmed"]).notNull(), // Resultado da validação
  reason: text("reason"), // Motivo do bloqueio ou permissão
  matchedRule: varchar("matched_rule", { length: 500 }), // Regra que foi aplicada (whitelist/blacklist)
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]), // Severidade (se bloqueado)
  ipAddress: varchar("ip_address", { length: 45 }), // IP de origem
  userAgent: text("user_agent"), // User agent do navegador
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  agentIdIdx: index("agent_id_idx").on(table.agentId),
  actionIdx: index("action_idx").on(table.action),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type CommandAudit = typeof commandAudit.$inferSelect;
export type InsertCommandAudit = typeof commandAudit.$inferInsert;
