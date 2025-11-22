import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const conversas = pgTable("conversas", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(), // 'usuario', 'sistema', 'erro_corrigido'
  mensagem: text("mensagem").notNull(),
  contexto: jsonb("contexto"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const execucoes = pgTable("execucoes", {
  id: serial("id").primaryKey(),
  tarefa: text("tarefa").notNull(),
  navegador: text("navegador"),
  planoBAtivado: integer("plano_b_ativado").default(0),
  sucesso: integer("sucesso").default(1),
  tempoExecucao: integer("tempo_execucao"), // em milissegundos
  resultado: text("resultado"),
  erro: text("erro"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversaSchema = createInsertSchema(conversas);
export const selectConversaSchema = createSelectSchema(conversas);
export const insertExecucaoSchema = createInsertSchema(execucoes);
export const selectExecucaoSchema = createSelectSchema(execucoes);

export type Conversa = typeof conversas.$inferSelect;
export type InsertConversa = typeof conversas.$inferInsert;
export type Execucao = typeof execucoes.$inferSelect;
export type InsertExecucao = typeof execucoes.$inferInsert;
