import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

/**
 * Tabela de conversas do sistema de automação
 */
export const conversas = mysqlTable("conversas", {
  id: int("id").autoincrement().primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'usuario', 'sistema', 'erro_corrigido'
  mensagem: text("mensagem").notNull(),
  contexto: text("contexto"), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Tabela de execuções de tarefas
 */
export const execucoes = mysqlTable("execucoes", {
  id: int("id").autoincrement().primaryKey(),
  tarefa: text("tarefa").notNull(),
  navegador: varchar("navegador", { length: 50 }),
  planoBAtivado: int("planoBAtivado").default(0),
  sucesso: int("sucesso").default(1),
  tempoExecucao: int("tempoExecucao"), // em milissegundos
  resultado: text("resultado"),
  erro: text("erro"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conversa = typeof conversas.$inferSelect;
export type InsertConversa = typeof conversas.$inferInsert;
export type Execucao = typeof execucoes.$inferSelect;
export type InsertExecucao = typeof execucoes.$inferInsert;