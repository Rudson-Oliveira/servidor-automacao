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
  password: varchar("password", { length: 255 }), // Hash da senha
  dateOfBirth: timestamp("date_of_birth"), // Data de nascimento
  phone: varchar("phone", { length: 20 }), // Telefone/WhatsApp
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de auditoria para detecção de alucinações
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  input: text("input"),
  output: text("output"),
  validationScore: int("validation_score").notNull(),
  isHallucination: mysqlEnum("is_hallucination", ["0", "1"]).default("0").notNull(),
  realDataVerified: mysqlEnum("real_data_verified", ["0", "1"]).default("0").notNull(),
  discrepancies: text("discrepancies"),
  executionTimeMs: int("execution_time_ms").notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// TODO: Add your tables here

/**
 * Skills (habilidades) para base de conhecimento
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

/**
 * Tabela de chaves API para autenticação de IAs externas
 * Permite acesso seguro ao sistema de automação
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  chave: varchar("chave", { length: 128 }).notNull().unique(),
  nome: varchar("nome", { length: 200 }).notNull(), // Nome da IA (ex: "Comet", "Abacus")
  descricao: text("descricao"),
  ativa: int("ativa").default(1).notNull(), // 1 = ativa, 0 = desativada
  ultimoUso: timestamp("ultimo_uso"),
  totalRequisicoes: int("total_requisicoes").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  chaveIdx: index("chave_idx").on(table.chave),
  ativaIdx: index("ativa_idx").on(table.ativa),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Tabela de análises visuais do Comet Vision
 * Armazena resultados de análise de websites
 */
export const cometVisionAnalyses = mysqlTable("comet_vision_analyses", {
  id: int("id").autoincrement().primaryKey(),
  url: varchar("url", { length: 1000 }).notNull(),
  title: varchar("title", { length: 500 }),
  numScreenshots: int("num_screenshots").default(0),
  numComponents: int("num_components").default(0),
  numColors: int("num_colors").default(0),
  layoutType: varchar("layout_type", { length: 100 }),
  domStructure: text("dom_structure"), // JSON
  computedStyles: text("computed_styles"), // JSON
  visualPatterns: text("visual_patterns"), // JSON
  analyzerVersion: varchar("analyzer_version", { length: 50 }),
  status: mysqlEnum("status", ["pendente", "concluido", "erro"]).default("pendente"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  urlIdx: index("url_idx").on(table.url),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type CometVisionAnalysis = typeof cometVisionAnalyses.$inferSelect;
export type InsertCometVisionAnalysis = typeof cometVisionAnalyses.$inferInsert;

/**
 * Tabela de screenshots capturados pelo Comet Vision
 */
export const cometVisionScreenshots = mysqlTable("comet_vision_screenshots", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysis_id").notNull(),
  filePath: text("file_path").notNull(),
  width: int("width"),
  height: int("height"),
  section: varchar("section", { length: 100 }), // 'hero', 'features', 'footer', etc
  scrollPosition: int("scroll_position"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  analysisIdIdx: index("analysis_id_idx").on(table.analysisId),
}));

export type CometVisionScreenshot = typeof cometVisionScreenshots.$inferSelect;
export type InsertCometVisionScreenshot = typeof cometVisionScreenshots.$inferInsert;

/**
 * Tabela de validações de código gerado
 * Compara código gerado com site original
 */
export const cometVisionValidations = mysqlTable("comet_vision_validations", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysis_id").notNull(),
  urlOriginal: varchar("url_original", { length: 1000 }).notNull(),
  urlGerada: varchar("url_gerada", { length: 1000 }).notNull(),
  similaridadeGeral: int("similaridade_geral").notNull(), // 0-100
  ssimScore: int("ssim_score"), // 0-100
  colorSimilarity: int("color_similarity"), // 0-100
  layoutSimilarity: int("layout_similarity"), // 0-100
  threshold: int("threshold").default(90),
  aprovado: int("aprovado").default(0), // 1 = aprovado, 0 = reprovado
  diffImagePath: text("diff_image_path"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  analysisIdIdx: index("analysis_id_idx").on(table.analysisId),
  aprovadoIdx: index("aprovado_idx").on(table.aprovado),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type CometVisionValidation = typeof cometVisionValidations.$inferSelect;
export type InsertCometVisionValidation = typeof cometVisionValidations.$inferInsert;
