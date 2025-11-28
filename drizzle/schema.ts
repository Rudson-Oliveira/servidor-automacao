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

// WhatsApp Blacklist e Proteção
export * from './schema-whatsapp-blacklist';

// Integração Avançada com Obsidian
export * from './schema-obsidian';

// Controle Desktop Remoto
export * from './schema-desktop-control';

// Sistema de Webhooks
export * from './schema-webhooks';

// Governança de IAs Externas
export * from './schema-ai-governance';

// TODO: Add your tables here
/**
 * Tabela de logs de auditoria para detecção de alucinações
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

/**
 * Tabela de feedbacks de IAs
 * Armazena descobertas, correções e novas informações reportadas pelas IAs
 */
export const iaFeedbacks = mysqlTable("ia_feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  iaOrigem: varchar("ia_origem", { length: 100 }).notNull(), // Nome da IA (Comet, Abacus, etc.)
  tema: varchar("tema", { length: 100 }).notNull(), // obsidian, perplexity, genspark, etc.
  tipoFeedback: mysqlEnum("tipo_feedback", ["descoberta", "correcao", "atualizacao", "sugestao"]).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao").notNull(),
  evidencias: text("evidencias"), // JSON com links, screenshots, logs, etc.
  impacto: mysqlEnum("impacto", ["baixo", "medio", "alto", "critico"]).default("medio"),
  status: mysqlEnum("status", ["pendente", "em_analise", "aprovado", "rejeitado", "implementado"]).default("pendente"),
  prioridade: int("prioridade").default(5), // 1-10
  analisadoPor: varchar("analisado_por", { length: 100 }), // Quem analisou (Rudson, Manus, etc.)
  comentarioAnalise: text("comentario_analise"),
  dataAnalise: timestamp("data_analise"),
  dataImplementacao: timestamp("data_implementacao"),
  versaoAntes: varchar("versao_antes", { length: 50 }),
  versaoDepois: varchar("versao_depois", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  iaOrigemIdx: index("ia_origem_idx").on(table.iaOrigem),
  temaIdx: index("tema_idx").on(table.tema),
  statusIdx: index("status_idx").on(table.status),
  tipoFeedbackIdx: index("tipo_feedback_idx").on(table.tipoFeedback),
}));

export type IaFeedback = typeof iaFeedbacks.$inferSelect;
export type InsertIaFeedback = typeof iaFeedbacks.$inferInsert;

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

/**
 * Tabela de operações do Obsidian
 * Registra todas as operações realizadas via API do Obsidian
 */
export const obsidianOperations = mysqlTable("obsidian_operations", {
  id: int("id").autoincrement().primaryKey(),
  operacao: varchar("operacao", { length: 100 }).notNull(), // 'criar_arquivo', 'atualizar_arquivo', 'deletar_arquivo', 'configurar'
  caminhoArquivo: varchar("caminho_arquivo", { length: 1000 }),
  status: mysqlEnum("status", ["sucesso", "falha", "pendente"]).default("pendente").notNull(),
  tentativas: int("tentativas").default(1),
  erro: text("erro"),
  detalhes: text("detalhes"), // JSON com informações adicionais
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  operacaoIdx: index("operacao_idx").on(table.operacao),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type ObsidianOperation = typeof obsidianOperations.$inferSelect;
export type InsertObsidianOperation = typeof obsidianOperations.$inferInsert;

/**
 * Tabela de scrapes do DeepSITE
 * Armazena histórico de scraping de websites
 */
export const deepsiteScrapes = mysqlTable("deepsite_scrapes", {
  id: int("id").autoincrement().primaryKey(),
  url: varchar("url", { length: 2048 }).notNull(),
  html: text("html"), // HTML completo (pode ser grande)
  metadata: text("metadata"), // JSON com title, description, og:tags, etc
  status: mysqlEnum("status", ["success", "failed", "pending"]).default("pending").notNull(),
  error: text("error"),
  responseTime: int("response_time"), // em milissegundos
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // TTL do cache
}, (table) => ({
  urlIdx: index("url_idx").on(table.url),
  scrapedAtIdx: index("scraped_at_idx").on(table.scrapedAt),
  expiresAtIdx: index("expires_at_idx").on(table.expiresAt),
  statusIdx: index("status_idx").on(table.status),
}));

export type DeepsiteScrape = typeof deepsiteScrapes.$inferSelect;
export type InsertDeepsiteScrape = typeof deepsiteScrapes.$inferInsert;

/**
 * Tabela de análises de IA do DeepSITE
 * Armazena resultados de análise de conteúdo com LLM
 */
export const deepsiteAnalyses = mysqlTable("deepsite_analyses", {
  id: int("id").autoincrement().primaryKey(),
  scrapeId: int("scrape_id").notNull(),
  analysisType: varchar("analysis_type", { length: 50 }).notNull(), // 'full', 'summary', 'extract', 'classify'
  summary: text("summary"),
  entities: text("entities"), // JSON com entidades extraídas
  category: varchar("category", { length: 100 }),
  language: varchar("language", { length: 10 }),
  sentiment: varchar("sentiment", { length: 20 }),
  confidence: int("confidence"), // 0-100
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
}, (table) => ({
  scrapeIdIdx: index("scrape_id_idx").on(table.scrapeId),
  analysisTypeIdx: index("analysis_type_idx").on(table.analysisType),
  analyzedAtIdx: index("analyzed_at_idx").on(table.analyzedAt),
}));

export type DeepsiteAnalysis = typeof deepsiteAnalyses.$inferSelect;
export type InsertDeepsiteAnalysis = typeof deepsiteAnalyses.$inferInsert;

/**
 * Tabela de rate limits do DeepSITE
 * Controla taxa de requisições por domínio
 */
export const deepsiteRateLimits = mysqlTable("deepsite_rate_limits", {
  id: int("id").autoincrement().primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  crawlDelay: int("crawl_delay").default(1000), // em milissegundos
  lastRequest: timestamp("last_request"),
  requestCount: int("request_count").default(0),
  robotsTxt: text("robots_txt"), // Conteúdo do robots.txt
  robotsUpdatedAt: timestamp("robots_updated_at"),
}, (table) => ({
  domainIdx: index("domain_idx").on(table.domain),
  lastRequestIdx: index("last_request_idx").on(table.lastRequest),
}));

export type DeepsiteRateLimit = typeof deepsiteRateLimits.$inferSelect;
export type InsertDeepsiteRateLimit = typeof deepsiteRateLimits.$inferInsert;

/**
 * Tabela de metadados de cache do DeepSITE
 * Rastreia estatísticas e performance do cache
 */
export const deepsiteCacheMetadata = mysqlTable("deepsite_cache_metadata", {
  id: int("id").autoincrement().primaryKey(),
  url: varchar("url", { length: 2048 }).notNull().unique(),
  scrapeId: int("scrape_id").notNull(),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  hitCount: int("hit_count").default(0),
  size: int("size"), // tamanho em bytes
}, (table) => ({
  urlIdx: index("url_idx").on(table.url),
  expiresAtIdx: index("expires_at_idx").on(table.expiresAt),
  scrapeIdIdx: index("scrape_id_idx").on(table.scrapeId),
}));

export type DeepsiteCacheMetadata = typeof deepsiteCacheMetadata.$inferSelect;
export type InsertDeepsiteCacheMetadata = typeof deepsiteCacheMetadata.$inferInsert;


/**
 * ========================================
 * MENTOR E LEITOR DE ENDPOINTS
 * Sistema de mapeamento e raspagem de servidores de rede
 * ========================================
 */

/**
 * Tabela de servidores monitorados
 * Armazena informações dos servidores de rede (SMB/Windows/Linux)
 */
export const servidores = mysqlTable("servidores", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  endereco: varchar("endereco", { length: 255 }).notNull(), // IP ou hostname (ex: 192.168.50.11)
  tipo: mysqlEnum("tipo", ["smb", "ftp", "sftp", "http", "local"]).default("smb"),
  descricao: text("descricao"),
  autenticacaoTipo: varchar("autenticacao_tipo", { length: 50 }), // 'ntlm', 'basic', 'key'
  usuario: varchar("usuario", { length: 255 }),
  porta: int("porta").default(445), // 445 para SMB, 21 para FTP, etc
  ativo: int("ativo").default(1).notNull(),
  ultimaMapeamento: timestamp("ultima_mapeamento"),
  ultimaRaspagem: timestamp("ultima_raspagem"),
  totalDepartamentos: int("total_departamentos").default(0),
  totalArquivos: int("total_arquivos").default(0),
  tamanhoTotal: int("tamanho_total").default(0), // em bytes
  status: mysqlEnum("status", ["online", "offline", "erro", "mapeando", "raspando"]).default("offline"),
  mensagemErro: text("mensagem_erro"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  enderecoIdx: index("endereco_idx").on(table.endereco),
  statusIdx: index("status_idx").on(table.status),
  ativoIdx: index("ativo_idx").on(table.ativo),
}));

export type Servidor = typeof servidores.$inferSelect;
export type InsertServidor = typeof servidores.$inferInsert;

/**
 * Tabela de departamentos/pastas principais
 * Estrutura organizacional do servidor
 */
export const departamentos = mysqlTable("departamentos", {
  id: int("id").autoincrement().primaryKey(),
  servidorId: int("servidor_id").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  caminho: text("caminho").notNull(), // Caminho completo (ex: \\192.168.50.11\psicologia)
  descricao: text("descricao"),
  categoria: varchar("categoria", { length: 100 }), // 'administrativo', 'clinico', 'financeiro', etc
  totalSubpastas: int("total_subpastas").default(0),
  totalArquivos: int("total_arquivos").default(0),
  tamanhoTotal: int("tamanho_total").default(0), // em bytes
  ultimaAtualizacao: timestamp("ultima_atualizacao"),
  permissoes: text("permissoes"), // JSON com permissões de acesso
  ativo: int("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  servidorIdIdx: index("servidor_id_idx").on(table.servidorId),
  nomeIdx: index("nome_idx").on(table.nome),
  categoriaIdx: index("categoria_idx").on(table.categoria),
}));

export type Departamento = typeof departamentos.$inferSelect;
export type InsertDepartamento = typeof departamentos.$inferInsert;

/**
 * Tabela de arquivos mapeados
 * Índice completo de todos os arquivos do servidor
 */
export const arquivosMapeados = mysqlTable("arquivos_mapeados", {
  id: int("id").autoincrement().primaryKey(),
  departamentoId: int("departamento_id").notNull(),
  nome: varchar("nome", { length: 500 }).notNull(),
  caminhoCompleto: text("caminho_completo").notNull(),
  caminhoRelativo: text("caminho_relativo"), // Relativo ao departamento
  extensao: varchar("extensao", { length: 20 }),
  tipoArquivo: varchar("tipo_arquivo", { length: 100 }), // 'documento', 'planilha', 'imagem', 'pdf', etc
  tamanho: int("tamanho").default(0), // em bytes
  dataCriacao: timestamp("data_criacao"),
  dataModificacao: timestamp("data_modificacao"),
  dataAcesso: timestamp("data_acesso"),
  hash: varchar("hash", { length: 64 }), // MD5 ou SHA256 para detectar duplicatas
  conteudoIndexado: text("conteudo_indexado"), // Primeiros 1000 caracteres para busca
  metadados: text("metadados"), // JSON com metadados extras (autor, título, etc)
  tags: varchar("tags", { length: 500 }),
  importante: int("importante").default(0), // Flag para arquivos importantes
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  departamentoIdIdx: index("departamento_id_idx").on(table.departamentoId),
  nomeIdx: index("nome_idx").on(table.nome),
  extensaoIdx: index("extensao_idx").on(table.extensao),
  tipoArquivoIdx: index("tipo_arquivo_idx").on(table.tipoArquivo),
  hashIdx: index("hash_idx").on(table.hash),
}));

export type ArquivoMapeado = typeof arquivosMapeados.$inferSelect;
export type InsertArquivoMapeado = typeof arquivosMapeados.$inferInsert;

/**
 * Tabela de logs de raspagem
 * Histórico de todas as operações de mapeamento e raspagem
 */
export const logsRaspagem = mysqlTable("logs_raspagem", {
  id: int("id").autoincrement().primaryKey(),
  servidorId: int("servidor_id").notNull(),
  tipoOperacao: mysqlEnum("tipo_operacao", ["mapeamento", "raspagem_completa", "raspagem_incremental", "verificacao"]).notNull(),
  status: mysqlEnum("status", ["iniciado", "em_progresso", "concluido", "erro", "cancelado"]).default("iniciado"),
  iniciadoPor: varchar("iniciado_por", { length: 100 }), // 'Comet', 'Manus', 'Rudson', 'Agendado'
  departamentosProcessados: int("departamentos_processados").default(0),
  arquivosNovos: int("arquivos_novos").default(0),
  arquivosAtualizados: int("arquivos_atualizados").default(0),
  arquivosRemovidos: int("arquivos_removidos").default(0),
  errosEncontrados: int("erros_encontrados").default(0),
  tempoExecucao: int("tempo_execucao"), // em segundos
  detalhes: text("detalhes"), // JSON com detalhes da operação
  mensagemErro: text("mensagem_erro"),
  dataInicio: timestamp("data_inicio").defaultNow().notNull(),
  dataFim: timestamp("data_fim"),
}, (table) => ({
  servidorIdIdx: index("servidor_id_idx").on(table.servidorId),
  statusIdx: index("status_idx").on(table.status),
  tipoOperacaoIdx: index("tipo_operacao_idx").on(table.tipoOperacao),
  dataInicioIdx: index("data_inicio_idx").on(table.dataInicio),
}));

export type LogRaspagem = typeof logsRaspagem.$inferSelect;
export type InsertLogRaspagem = typeof logsRaspagem.$inferInsert;

/**
 * Tabela de alertas e notificações
 * Sistema de monitoramento e alertas automáticos
 */
export const alertasServidor = mysqlTable("alertas_servidor", {
  id: int("id").autoincrement().primaryKey(),
  servidorId: int("servidor_id").notNull(),
  tipo: mysqlEnum("tipo", ["espaco_disco", "arquivo_modificado", "acesso_negado", "servidor_offline", "erro_raspagem", "arquivo_importante"]).notNull(),
  severidade: mysqlEnum("severidade", ["info", "aviso", "erro", "critico"]).default("info"),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem").notNull(),
  detalhes: text("detalhes"), // JSON com informações adicionais
  lido: int("lido").default(0).notNull(),
  resolvido: int("resolvido").default(0).notNull(),
  dataResolucao: timestamp("data_resolucao"),
  resolvidoPor: varchar("resolvido_por", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  servidorIdIdx: index("servidor_id_idx").on(table.servidorId),
  tipoIdx: index("tipo_idx").on(table.tipo),
  severidadeIdx: index("severidade_idx").on(table.severidade),
  lidoIdx: index("lido_idx").on(table.lido),
  resolvidoIdx: index("resolvido_idx").on(table.resolvido),
}));

export type AlertaServidor = typeof alertasServidor.$inferSelect;
export type InsertAlertaServidor = typeof alertasServidor.$inferInsert;

/**
 * Tabela de catálogos Obsidian gerados
 * Histórico de catálogos enviados para o Obsidian
 */
export const catalogosObsidian = mysqlTable("catalogos_obsidian", {
  id: int("id").autoincrement().primaryKey(),
  servidorId: int("servidor_id"),
  departamentoId: int("departamento_id"),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  tipo: mysqlEnum("tipo", ["servidor_completo", "departamento", "tipo_arquivo", "personalizado"]).notNull(),
  uri: text("uri").notNull(), // URI do Obsidian
  nomeArquivo: varchar("nome_arquivo", { length: 255 }).notNull(),
  totalLinks: int("total_links").default(0),
  categorias: int("categorias").default(0),
  geradoPor: varchar("gerado_por", { length: 100 }), // 'Comet', 'Manus', 'Agendado'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  servidorIdIdx: index("servidor_id_idx").on(table.servidorId),
  departamentoIdIdx: index("departamento_id_idx").on(table.departamentoId),
  tipoIdx: index("tipo_idx").on(table.tipo),
}));

export type CatalogoObsidian = typeof catalogosObsidian.$inferSelect;
export type InsertCatalogoObsidian = typeof catalogosObsidian.$inferInsert;


/**
 * Tabela de APIs personalizadas configuradas pelo usuário
 * Permite adicionar integrações com APIs externas customizadas
 */
export const apisPersonalizadas = mysqlTable("apis_personalizadas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  url: varchar("url", { length: 500 }).notNull(),
  metodo: mysqlEnum("metodo", ["GET", "POST", "PUT", "DELETE", "PATCH"]).default("POST").notNull(),
  headers: text("headers"), // JSON com headers customizados
  chaveApi: varchar("chave_api", { length: 500 }), // Criptografada
  tipoAutenticacao: mysqlEnum("tipo_autenticacao", ["none", "bearer", "api_key", "basic", "custom"]).default("bearer"),
  parametros: text("parametros"), // JSON com parâmetros padrão
  ativa: int("ativa").default(1).notNull(),
  testeConexao: int("teste_conexao").default(0), // 0=não testado, 1=sucesso, 2=falha
  ultimoTeste: timestamp("ultimo_teste"),
  mensagemErro: text("mensagem_erro"),
  usoCount: int("uso_count").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ativaIdx: index("ativa_idx").on(table.ativa),
  nomeIdx: index("nome_idx").on(table.nome),
}));

export type ApiPersonalizada = typeof apisPersonalizadas.$inferSelect;
export type InsertApiPersonalizada = typeof apisPersonalizadas.$inferInsert;


/**
 * Tabela de capturas de área de trabalho
 * Armazena screenshots e análises visuais do desktop
 */
export const desktopCaptures = mysqlTable("desktop_captures", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  screenshotUrl: text("screenshot_url").notNull(), // URL do screenshot no S3
  resolucaoLargura: int("resolucao_largura").notNull(),
  resolucaoAltura: int("resolucao_altura").notNull(),
  totalProgramas: int("total_programas").default(0),
  totalJanelas: int("total_janelas").default(0),
  analisado: int("analisado").default(0), // 0=não, 1=sim
  analiseTexto: text("analise_texto"), // Análise gerada pelo Comet Vision
  tagsDetectadas: text("tags_detectadas"), // JSON com tags/categorias
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  timestampIdx: index("timestamp_idx").on(table.timestamp),
  analisadoIdx: index("analisado_idx").on(table.analisado),
}));

export type DesktopCapture = typeof desktopCaptures.$inferSelect;
export type InsertDesktopCapture = typeof desktopCaptures.$inferInsert;

/**
 * Tabela de programas detectados nas capturas
 * Relaciona programas com capturas específicas
 */
export const desktopProgramas = mysqlTable("desktop_programas", {
  id: int("id").autoincrement().primaryKey(),
  captureId: int("capture_id").notNull(),
  pid: int("pid").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  usuario: varchar("usuario", { length: 100 }),
  memoriaMb: int("memoria_mb").default(0),
  cpuPercent: int("cpu_percent").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  captureIdIdx: index("capture_id_idx").on(table.captureId),
  nomeIdx: index("nome_idx").on(table.nome),
}));

export type DesktopPrograma = typeof desktopProgramas.$inferSelect;
export type InsertDesktopPrograma = typeof desktopProgramas.$inferInsert;

/**
 * Tabela de janelas detectadas nas capturas
 * Armazena informações sobre janelas abertas
 */
export const desktopJanelas = mysqlTable("desktop_janelas", {
  id: int("id").autoincrement().primaryKey(),
  captureId: int("capture_id").notNull(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  processo: varchar("processo", { length: 255 }),
  pid: int("pid"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  captureIdIdx: index("capture_id_idx").on(table.captureId),
  processoIdx: index("processo_idx").on(table.processo),
}));

export type DesktopAgent = typeof desktopAgents.$inferSelect;

// ========================================
// TELEMETRIA E AUTO-CONHECIMENTO
// ========================================

export * from "./schema-telemetry";
export type InsertDesktopJanela = typeof desktopJanelas.$inferInsert;


// Importar schemas de campanhas e templates
export * from './schema-campaigns';
export * from './schema-notifications';
export * from './schema-scheduler';
