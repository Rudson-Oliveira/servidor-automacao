import { int, mysqlTable, text, timestamp, varchar, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * MÓDULO: Agentes Locais (Sistema Vercept)
 * Tabelas para autenticação e histórico de agentes
 */

/**
 * Tabela de tokens de autenticação para agentes locais
 */
export const agenteTokens = mysqlTable("agente_tokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  ativo: int("ativo").default(1).notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  ultimoUso: timestamp("ultimo_uso"),
});

/**
 * Tabela de histórico de execuções de comandos
 */
export const agenteExecucoes = mysqlTable("agente_execucoes", {
  id: int("id").autoincrement().primaryKey(),
  agenteId: varchar("agente_id", { length: 64 }).notNull(),
  agenteNome: varchar("agente_nome", { length: 255 }).notNull(),
  comando: varchar("comando", { length: 255 }).notNull(),
  parametros: text("parametros"),
  resultado: text("resultado"),
  erro: text("erro"),
  status: mysqlEnum("status", ["sucesso", "erro", "timeout"]).notNull(),
  duracaoMs: int("duracao_ms"),
  executadoEm: timestamp("executado_em").defaultNow().notNull(),
});

export type AgenteToken = typeof agenteTokens.$inferSelect;
export type InsertAgenteToken = typeof agenteTokens.$inferInsert;
export type AgenteExecucao = typeof agenteExecucoes.$inferSelect;
export type InsertAgenteExecucao = typeof agenteExecucoes.$inferInsert;
