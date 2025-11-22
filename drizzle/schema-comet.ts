import { int, mysqlTable, text, timestamp, varchar, index } from "drizzle-orm/mysql-core";

/**
 * Tabela de contexto de conversas do Comet
 * Armazena histórico e estado entre requisições
 */
export const cometContexto = mysqlTable("comet_contexto", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  mensagemUsuario: text("mensagem_usuario").notNull(),
  mensagemComet: text("mensagem_comet"),
  contexto: text("contexto"), // JSON com informações de contexto
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index("session_idx").on(table.sessionId),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
}));

/**
 * Tabela de índice de arquivos para busca rápida
 * Indexa arquivos do computador para busca eficiente
 */
export const cometArquivos = mysqlTable("comet_arquivos", {
  id: int("id").autoincrement().primaryKey(),
  caminho: text("caminho").notNull(),
  nome: varchar("nome", { length: 500 }).notNull(),
  tipo: varchar("tipo", { length: 50 }),
  tamanho: int("tamanho"),
  dataModificacao: timestamp("data_modificacao"),
  conteudoIndexado: text("conteudo_indexado"), // Primeiros 1000 caracteres para busca
  ultimaIndexacao: timestamp("ultima_indexacao").defaultNow().notNull(),
}, (table) => ({
  nomeIdx: index("nome_idx").on(table.nome),
  tipoIdx: index("tipo_idx").on(table.tipo),
  caminhoIdx: index("caminho_idx").on(table.caminho),
}));

/**
 * Tabela de preferências do usuário
 * Aprende com as interações para melhorar assertividade
 */
export const cometPreferencias = mysqlTable("comet_preferencias", {
  id: int("id").autoincrement().primaryKey(),
  chave: varchar("chave", { length: 255 }).notNull().unique(),
  valor: text("valor").notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'string', 'number', 'boolean', 'json'
  categoria: varchar("categoria", { length: 100 }), // 'busca', 'execucao', 'formato'
  confianca: int("confianca").default(50), // 0-100, aumenta com uso bem-sucedido
  ultimaAtualizacao: timestamp("ultima_atualizacao").defaultNow().notNull(),
});

export type CometContexto = typeof cometContexto.$inferSelect;
export type InsertCometContexto = typeof cometContexto.$inferInsert;

export type CometArquivo = typeof cometArquivos.$inferSelect;
export type InsertCometArquivo = typeof cometArquivos.$inferInsert;

export type CometPreferencia = typeof cometPreferencias.$inferSelect;
export type InsertCometPreferencia = typeof cometPreferencias.$inferInsert;
