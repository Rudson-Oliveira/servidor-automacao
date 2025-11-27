import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, index, boolean } from "drizzle-orm/mysql-core";

/**
 * 🔗 SCHEMA DE INTEGRAÇÃO AVANÇADA COM OBSIDIAN
 * 
 * Suporta:
 * - Sincronização bidirecional
 * - Múltiplos vaults
 * - Versionamento de notas
 * - Backlinks e graph view
 * - Fluxos de automação
 * - Busca full-text
 */

/**
 * Vaults do Obsidian
 * Cada vault é uma coleção isolada de notas
 */
export const obsidianVaults = mysqlTable("obsidian_vaults", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  caminho: varchar("caminho", { length: 1000 }), // Caminho local (se sincronizado)
  cor: varchar("cor", { length: 7 }).default("#8b5cf6"), // Cor para identificação visual
  icone: varchar("icone", { length: 50 }).default("📚"),
  ativo: int("ativo").default(1).notNull(),
  ultimoSync: timestamp("ultimo_sync"),
  totalNotas: int("total_notas").default(0),
  totalTags: int("total_tags").default(0),
  totalBacklinks: int("total_backlinks").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  ativoIdx: index("ativo_idx").on(table.ativo),
}));

export type ObsidianVault = typeof obsidianVaults.$inferSelect;
export type InsertObsidianVault = typeof obsidianVaults.$inferInsert;

/**
 * Notas do Obsidian
 * Armazena conteúdo completo das notas com metadados
 */
export const obsidianNotas = mysqlTable("obsidian_notas", {
  id: int("id").autoincrement().primaryKey(),
  vaultId: int("vault_id").notNull(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  caminho: varchar("caminho", { length: 1000 }).notNull(), // Caminho relativo no vault
  conteudo: text("conteudo").notNull(),
  conteudoPlainText: text("conteudo_plain_text"), // Sem markdown, para busca
  frontmatter: text("frontmatter"), // JSON com metadados YAML
  tamanho: int("tamanho").default(0), // Bytes
  palavras: int("palavras").default(0),
  hash: varchar("hash", { length: 64 }), // SHA-256 do conteúdo para detecção de mudanças
  versao: int("versao").default(1),
  ultimaModificacao: timestamp("ultima_modificacao").notNull(),
  ultimoSync: timestamp("ultimo_sync"),
  syncStatus: mysqlEnum("sync_status", ["sincronizado", "pendente", "conflito", "erro"]).default("sincronizado"),
  conflito: text("conflito"), // JSON com detalhes do conflito
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  vaultIdIdx: index("vault_id_idx").on(table.vaultId),
  tituloIdx: index("titulo_idx").on(table.titulo),
  caminhoIdx: index("caminho_idx").on(table.caminho),
  syncStatusIdx: index("sync_status_idx").on(table.syncStatus),
  hashIdx: index("hash_idx").on(table.hash),
}));

export type ObsidianNota = typeof obsidianNotas.$inferSelect;
export type InsertObsidianNota = typeof obsidianNotas.$inferInsert;

/**
 * Histórico de versões das notas
 * Permite rollback e visualização de mudanças
 */
export const obsidianNotasHistorico = mysqlTable("obsidian_notas_historico", {
  id: int("id").autoincrement().primaryKey(),
  notaId: int("nota_id").notNull(),
  versao: int("versao").notNull(),
  conteudo: text("conteudo").notNull(),
  frontmatter: text("frontmatter"),
  hash: varchar("hash", { length: 64 }).notNull(),
  tamanho: int("tamanho").default(0),
  modificadoPor: varchar("modificado_por", { length: 255 }), // Sistema ou usuário
  tipoMudanca: mysqlEnum("tipo_mudanca", ["criacao", "edicao", "sync", "conflito_resolvido"]).default("edicao"),
  diferencas: text("diferencas"), // JSON com diff
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  notaIdIdx: index("nota_id_idx").on(table.notaId),
  versaoIdx: index("versao_idx").on(table.versao),
}));

export type ObsidianNotaHistorico = typeof obsidianNotasHistorico.$inferSelect;
export type InsertObsidianNotaHistorico = typeof obsidianNotasHistorico.$inferInsert;

/**
 * Tags das notas
 * Permite navegação e filtros por tags
 */
export const obsidianTags = mysqlTable("obsidian_tags", {
  id: int("id").autoincrement().primaryKey(),
  vaultId: int("vault_id").notNull(),
  tag: varchar("tag", { length: 255 }).notNull(),
  cor: varchar("cor", { length: 7 }),
  usoCount: int("uso_count").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  vaultIdIdx: index("vault_id_idx").on(table.vaultId),
  tagIdx: index("tag_idx").on(table.tag),
  vaultTagUnique: index("vault_tag_unique").on(table.vaultId, table.tag),
}));

export type ObsidianTag = typeof obsidianTags.$inferSelect;
export type InsertObsidianTag = typeof obsidianTags.$inferInsert;

/**
 * Relação entre notas e tags
 */
export const obsidianNotasTags = mysqlTable("obsidian_notas_tags", {
  id: int("id").autoincrement().primaryKey(),
  notaId: int("nota_id").notNull(),
  tagId: int("tag_id").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  notaIdIdx: index("nota_id_idx").on(table.notaId),
  tagIdIdx: index("tag_id_idx").on(table.tagId),
  notaTagUnique: index("nota_tag_unique").on(table.notaId, table.tagId),
}));

export type ObsidianNotaTag = typeof obsidianNotasTags.$inferSelect;
export type InsertObsidianNotaTag = typeof obsidianNotasTags.$inferInsert;

/**
 * Backlinks (links entre notas)
 * Permite graph view e navegação bidirecional
 */
export const obsidianBacklinks = mysqlTable("obsidian_backlinks", {
  id: int("id").autoincrement().primaryKey(),
  vaultId: int("vault_id").notNull(),
  notaOrigemId: int("nota_origem_id").notNull(),
  notaDestinoId: int("nota_destino_id").notNull(),
  tipoLink: mysqlEnum("tipo_link", ["wikilink", "markdown", "embed"]).default("wikilink"),
  contexto: text("contexto"), // Texto ao redor do link
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  vaultIdIdx: index("vault_id_idx").on(table.vaultId),
  notaOrigemIdx: index("nota_origem_idx").on(table.notaOrigemId),
  notaDestinoIdx: index("nota_destino_idx").on(table.notaDestinoId),
  origemDestinoUnique: index("origem_destino_unique").on(table.notaOrigemId, table.notaDestinoId),
}));

export type ObsidianBacklink = typeof obsidianBacklinks.$inferSelect;
export type InsertObsidianBacklink = typeof obsidianBacklinks.$inferInsert;

/**
 * Fluxos de automação
 * Define triggers e actions para integração com outros sistemas
 */
export const obsidianFluxos = mysqlTable("obsidian_fluxos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  ativo: int("ativo").default(1).notNull(),
  
  // Trigger (quando executar)
  triggerTipo: mysqlEnum("trigger_tipo", [
    "nota_criada",
    "nota_modificada",
    "nota_deletada",
    "tag_adicionada",
    "whatsapp_recebido",
    "whatsapp_enviado",
    "agendamento",
    "webhook"
  ]).notNull(),
  triggerConfig: text("trigger_config"), // JSON com configurações do trigger
  
  // Filtros (condições)
  filtros: text("filtros"), // JSON com condições (ex: tag específica, vault específico)
  
  // Actions (o que fazer)
  actions: text("actions").notNull(), // JSON array de ações sequenciais
  
  // Estatísticas
  totalExecucoes: int("total_execucoes").default(0),
  totalSucessos: int("total_sucessos").default(0),
  totalFalhas: int("total_falhas").default(0),
  ultimaExecucao: timestamp("ultima_execucao"),
  proximaExecucao: timestamp("proxima_execucao"), // Para agendamentos
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  ativoIdx: index("ativo_idx").on(table.ativo),
  triggerTipoIdx: index("trigger_tipo_idx").on(table.triggerTipo),
}));

export type ObsidianFluxo = typeof obsidianFluxos.$inferSelect;
export type InsertObsidianFluxo = typeof obsidianFluxos.$inferInsert;

/**
 * Log de execuções de fluxos
 * Histórico de automações executadas
 */
export const obsidianFluxosLog = mysqlTable("obsidian_fluxos_log", {
  id: int("id").autoincrement().primaryKey(),
  fluxoId: int("fluxo_id").notNull(),
  status: mysqlEnum("status", ["sucesso", "falha", "parcial"]).notNull(),
  triggerData: text("trigger_data"), // JSON com dados que dispararam o fluxo
  actionsExecutadas: text("actions_executadas"), // JSON com resultado de cada action
  erro: text("erro"),
  tempoExecucao: int("tempo_execucao"), // ms
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  fluxoIdIdx: index("fluxo_id_idx").on(table.fluxoId),
  statusIdx: index("status_idx").on(table.status),
}));

export type ObsidianFluxoLog = typeof obsidianFluxosLog.$inferSelect;
export type InsertObsidianFluxoLog = typeof obsidianFluxosLog.$inferInsert;

/**
 * Backups de vaults
 * Histórico de backups completos
 */
export const obsidianBackups = mysqlTable("obsidian_backups", {
  id: int("id").autoincrement().primaryKey(),
  vaultId: int("vault_id").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  tipoBackup: mysqlEnum("tipo_backup", ["manual", "automatico", "pre_sync"]).default("manual"),
  caminhoArquivo: varchar("caminho_arquivo", { length: 1000 }).notNull(), // Path do .zip no S3
  urlDownload: varchar("url_download", { length: 1000 }),
  tamanho: int("tamanho").default(0), // Bytes
  totalNotas: int("total_notas").default(0),
  hash: varchar("hash", { length: 64 }), // SHA-256 do backup
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  vaultIdIdx: index("vault_id_idx").on(table.vaultId),
  tipoBackupIdx: index("tipo_backup_idx").on(table.tipoBackup),
}));

export type ObsidianBackup = typeof obsidianBackups.$inferSelect;
export type InsertObsidianBackup = typeof obsidianBackups.$inferInsert;

/**
 * Configurações de sincronização
 * Define como cada vault deve sincronizar
 */
export const obsidianSyncConfigs = mysqlTable("obsidian_sync_configs", {
  id: int("id").autoincrement().primaryKey(),
  vaultId: int("vault_id").notNull().unique(),
  
  // Configurações gerais
  syncAutomatico: int("sync_automatico").default(1).notNull(),
  intervaloSync: int("intervalo_sync").default(300), // Segundos
  
  // Resolução de conflitos
  resolucaoConflito: mysqlEnum("resolucao_conflito", [
    "manual",
    "local_vence",
    "remoto_vence",
    "mais_recente_vence",
    "mesclar"
  ]).default("manual"),
  
  // Filtros
  incluirPastas: text("incluir_pastas"), // JSON array de paths
  excluirPastas: text("excluir_pastas"), // JSON array de paths
  incluirExtensoes: varchar("incluir_extensoes", { length: 500 }).default(".md,.txt"),
  
  // Backup automático
  backupAntes: int("backup_antes").default(1).notNull(),
  backupIntervalo: int("backup_intervalo").default(86400), // Segundos (1 dia)
  backupRetencao: int("backup_retencao").default(30), // Dias
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ObsidianSyncConfig = typeof obsidianSyncConfigs.$inferSelect;
export type InsertObsidianSyncConfig = typeof obsidianSyncConfigs.$inferInsert;

/**
 * Índice de busca full-text
 * Otimiza buscas em conteúdo de notas
 */
export const obsidianSearchIndex = mysqlTable("obsidian_search_index", {
  id: int("id").autoincrement().primaryKey(),
  notaId: int("nota_id").notNull().unique(),
  tituloIndexado: text("titulo_indexado"), // Título normalizado para busca
  conteudoIndexado: text("conteudo_indexado"), // Conteúdo normalizado
  tagsIndexadas: text("tags_indexadas"), // Tags concatenadas
  metadadosIndexados: text("metadados_indexados"), // Frontmatter concatenado
  ultimaIndexacao: timestamp("ultima_indexacao").defaultNow().notNull(),
}, (table) => ({
  notaIdIdx: index("nota_id_idx").on(table.notaId),
}));

export type ObsidianSearchIndex = typeof obsidianSearchIndex.$inferSelect;
export type InsertObsidianSearchIndex = typeof obsidianSearchIndex.$inferInsert;
