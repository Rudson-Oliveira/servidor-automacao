/**
 * Schema para Knowledge Persistence Layer
 * 
 * Armazena aprendizados do sistema de forma persistente:
 * - Problemas detectados
 * - Soluções aplicadas
 * - Taxa de sucesso
 * - Ranking de soluções
 */

import { mysqlTable, int, text, varchar, timestamp, float, json, mysqlEnum, index, boolean } from "drizzle-orm/mysql-core";

/**
 * Problemas Detectados pelo Sistema
 */
export const knowledgeProblems = mysqlTable("knowledge_problems", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação
  tipo: varchar("tipo", { length: 100 }).notNull(),
  categoria: varchar("categoria", { length: 100 }).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao").notNull(),
  
  // Contexto do Erro
  mensagemErro: text("mensagem_erro"),
  stackTrace: text("stack_trace"),
  
  // Metadados
  severidade: mysqlEnum("severidade", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  ambiente: varchar("ambiente", { length: 50 }).default("production"),
  
  // Frequência
  ocorrencias: int("ocorrencias").default(1).notNull(),
  primeiraOcorrencia: timestamp("primeira_ocorrencia").defaultNow().notNull(),
  ultimaOcorrencia: timestamp("ultima_ocorrencia").defaultNow().notNull(),
  
  // Status
  resolvido: boolean("resolvido").default(false).notNull(),
  resolvidoEm: timestamp("resolvido_em"),
  
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tipoIdx: index("tipo_idx").on(table.tipo),
  categoriaIdx: index("categoria_idx").on(table.categoria),
  resolvidoIdx: index("resolvido_idx").on(table.resolvido),
  severidadeIdx: index("severidade_idx").on(table.severidade),
}));

/**
 * Soluções Aplicadas
 */
export const knowledgeSolutions = mysqlTable("knowledge_solutions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamento
  problemId: int("problem_id").notNull(),
  
  // Identificação da Solução
  tipo: varchar("tipo", { length: 100 }).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao").notNull(),
  
  // Ação Executada
  comando: text("comando"),
  parametros: json("parametros").$type<Record<string, any>>(),
  
  // Resultado
  sucesso: boolean("sucesso").notNull(),
  mensagemResultado: text("mensagem_resultado"),
  tempoExecucaoMs: int("tempo_execucao_ms"),
  
  // Aprendizado
  confianca: float("confianca").default(0.5).notNull(),
  
  aplicadaEm: timestamp("aplicada_em").defaultNow().notNull(),
}, (table) => ({
  problemIdx: index("problem_idx").on(table.problemId),
  tipoIdx: index("tipo_idx").on(table.tipo),
  sucessoIdx: index("sucesso_idx").on(table.sucesso),
}));

/**
 * Ranking de Soluções
 * Agrega estatísticas de sucesso de cada tipo de solução
 */
export const knowledgeSolutionRanking = mysqlTable("knowledge_solution_ranking", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação
  tipoProblema: varchar("tipo_problema", { length: 100 }).notNull(),
  tipoSolucao: varchar("tipo_solucao", { length: 100 }).notNull(),
  
  // Estatísticas
  vezesAplicada: int("vezes_aplicada").default(0).notNull(),
  vezesSucesso: int("vezes_sucesso").default(0).notNull(),
  vezesFalha: int("vezes_falha").default(0).notNull(),
  taxaSucesso: float("taxa_sucesso").default(0).notNull(), // 0.0 a 1.0
  
  // Performance
  tempoMedioMs: int("tempo_medio_ms").default(0).notNull(),
  
  // Confiança
  confiancaMedia: float("confianca_media").default(0.5).notNull(),
  
  // Metadados
  ultimaAplicacao: timestamp("ultima_aplicacao"),
  
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tipoProblemaIdx: index("tipo_problema_idx").on(table.tipoProblema),
  tipoSolucaoIdx: index("tipo_solucao_idx").on(table.tipoSolucao),
  taxaSucessoIdx: index("taxa_sucesso_idx").on(table.taxaSucesso),
}));

// Tipos TypeScript
export type KnowledgeProblem = typeof knowledgeProblems.$inferSelect;
export type InsertKnowledgeProblem = typeof knowledgeProblems.$inferInsert;

export type KnowledgeSolution = typeof knowledgeSolutions.$inferSelect;
export type InsertKnowledgeSolution = typeof knowledgeSolutions.$inferInsert;

export type KnowledgeSolutionRanking = typeof knowledgeSolutionRanking.$inferSelect;
export type InsertKnowledgeSolutionRanking = typeof knowledgeSolutionRanking.$inferInsert;
