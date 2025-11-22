import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, index } from "drizzle-orm/mysql-core";

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

/**
 * Tabela de skills (habilidades) para base de conhecimento
 * Armazena instruções reutilizáveis para tarefas comuns
 */
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull().unique(),
  descricao: text("descricao"),
  instrucoes: text("instrucoes").notNull(),
  exemplo: text("exemplo"),
  tags: varchar("tags", { length: 500 }),
  categoria: varchar("categoria", { length: 100 }),
  autonomiaNivel: mysqlEnum("autonomia_nivel", ["baixa", "media", "alta", "total"]).default("media"),
  usoCount: int("uso_count").default(0),
  sucessoCount: int("sucesso_count").default(0),
  falhaCount: int("falha_count").default(0),
  ultimaExecucao: timestamp("ultima_execucao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

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

export type Conversa = typeof conversas.$inferSelect;
export type InsertConversa = typeof conversas.$inferInsert;

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

export type Execucao = typeof execucoes.$inferSelect;
export type InsertExecucao = typeof execucoes.$inferInsert;

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

export type CometContexto = typeof cometContexto.$inferSelect;
export type InsertCometContexto = typeof cometContexto.$inferInsert;

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
}));

export type CometArquivo = typeof cometArquivos.$inferSelect;
export type InsertCometArquivo = typeof cometArquivos.$inferInsert;

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

export type CometPreferencia = typeof cometPreferencias.$inferSelect;
export type InsertCometPreferencia = typeof cometPreferencias.$inferInsert;
