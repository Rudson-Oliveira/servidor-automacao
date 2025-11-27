import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";
import { index } from "drizzle-orm/mysql-core";

/**
 * 🖥️ SCHEMA DE CONTROLE DESKTOP REMOTO
 * 
 * Sistema de automação desktop que permite controlar computadores locais
 * remotamente através da interface web.
 * 
 * Componentes:
 * - Desktop Agents: Aplicativos rodando nos PCs dos usuários
 * - Comandos: Ações enviadas para os Desktop Agents
 * - Screenshots: Capturas de tela da área de trabalho
 * - Logs: Histórico de execução de comandos
 */


/**
 * Desktop Agents conectados
 * Armazena informações sobre os aplicativos Desktop Agent rodando nos PCs dos usuários
 */
export const desktopAgents = mysqlTable("desktop_agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(), // Token único para autenticação
  deviceName: varchar("device_name", { length: 255 }), // Nome do computador
  platform: varchar("platform", { length: 50 }), // win32, darwin, linux
  version: varchar("version", { length: 50 }), // Versão do Desktop Agent
  status: mysqlEnum("status", ["online", "offline", "busy", "error"]).default("offline").notNull(),
  lastPing: timestamp("last_ping"), // Último heartbeat recebido
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 ou IPv6
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  tokenIdx: index("token_idx").on(table.token),
}));

export type DesktopAgent = typeof desktopAgents.$inferSelect;
export type InsertDesktopAgent = typeof desktopAgents.$inferInsert;


/**
 * Comandos enviados aos Desktop Agents
 * Armazena todos os comandos (click, type, openApp, etc) enviados para execução
 */
export const desktopCommands = mysqlTable("desktop_commands", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agent_id").notNull(), // FK para desktop_agents
  userId: int("user_id").notNull(), // FK para users
  commandType: varchar("command_type", { length: 50 }).notNull(), // click, type, openApp, screenshot, etc
  commandData: text("command_data"), // JSON com parâmetros do comando
  status: mysqlEnum("status", ["pending", "sent", "executing", "completed", "failed"]).default("pending").notNull(),
  result: text("result"), // JSON com resultado da execução
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  executionTimeMs: int("execution_time_ms"), // Tempo de execução em milissegundos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  agentIdIdx: index("agent_id_idx").on(table.agentId),
  userIdIdx: index("user_id_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  commandTypeIdx: index("command_type_idx").on(table.commandType),
}));

export type DesktopCommand = typeof desktopCommands.$inferSelect;
export type InsertDesktopCommand = typeof desktopCommands.$inferInsert;

/**
 * Screenshots capturados da área de trabalho
 * Armazena imagens da tela do usuário
 */
export const desktopScreenshots = mysqlTable("desktop_screenshots", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agent_id").notNull(), // FK para desktop_agents
  userId: int("user_id").notNull(), // FK para users
  imageUrl: text("image_url").notNull(), // URL da imagem no S3
  imageKey: varchar("image_key", { length: 500 }).notNull(), // Chave S3
  width: int("width"), // Largura da imagem
  height: int("height"), // Altura da imagem
  fileSize: int("file_size"), // Tamanho em bytes
  format: varchar("format", { length: 20 }).default("png"), // png, jpg, webp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  agentIdIdx: index("agent_id_idx").on(table.agentId),
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export type DesktopScreenshot = typeof desktopScreenshots.$inferSelect;
export type InsertDesktopScreenshot = typeof desktopScreenshots.$inferInsert;

/**
 * Logs de execução de comandos
 * Armazena logs detalhados para debugging
 */
export const desktopLogs = mysqlTable("desktop_logs", {
  id: int("id").autoincrement().primaryKey(),
  commandId: int("command_id"), // FK para desktop_commands (opcional)
  agentId: int("agent_id").notNull(), // FK para desktop_agents
  userId: int("user_id").notNull(), // FK para users
  level: mysqlEnum("level", ["debug", "info", "warning", "error"]).default("info").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON com informações adicionais
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  commandIdIdx: index("command_id_idx").on(table.commandId),
  agentIdIdx: index("agent_id_idx").on(table.agentId),
  userIdIdx: index("user_id_idx").on(table.userId),
  levelIdx: index("level_idx").on(table.level),
}));

export type DesktopLog = typeof desktopLogs.$inferSelect;
export type InsertDesktopLog = typeof desktopLogs.$inferInsert;
