CREATE TABLE `obsidian_backlinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nota_origem_id` int NOT NULL,
	`nota_destino_id` int NOT NULL,
	`tipo_link` enum('wikilink','markdown','embed') DEFAULT 'wikilink',
	`contexto` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_backlinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vault_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`tipo_backup` enum('manual','automatico','pre_sync') DEFAULT 'manual',
	`caminho_arquivo` varchar(1000) NOT NULL,
	`url_download` varchar(1000),
	`tamanho` int DEFAULT 0,
	`total_notas` int DEFAULT 0,
	`hash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_backups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_fluxos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`ativo` int NOT NULL DEFAULT 1,
	`trigger_tipo` enum('nota_criada','nota_modificada','nota_deletada','tag_adicionada','whatsapp_recebido','whatsapp_enviado','agendamento','webhook') NOT NULL,
	`trigger_config` text,
	`filtros` text,
	`actions` text NOT NULL,
	`total_execucoes` int DEFAULT 0,
	`total_sucessos` int DEFAULT 0,
	`total_falhas` int DEFAULT 0,
	`ultima_execucao` timestamp,
	`proxima_execucao` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obsidian_fluxos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_fluxos_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fluxo_id` int NOT NULL,
	`status` enum('sucesso','falha','parcial') NOT NULL,
	`trigger_data` text,
	`actions_executadas` text,
	`erro` text,
	`tempo_execucao` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_fluxos_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_notas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vault_id` int NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`caminho` varchar(1000) NOT NULL,
	`conteudo` text NOT NULL,
	`conteudo_plain_text` text,
	`frontmatter` text,
	`tamanho` int DEFAULT 0,
	`palavras` int DEFAULT 0,
	`hash` varchar(64),
	`versao` int DEFAULT 1,
	`ultima_modificacao` timestamp NOT NULL,
	`ultimo_sync` timestamp,
	`sync_status` enum('sincronizado','pendente','conflito','erro') DEFAULT 'sincronizado',
	`conflito` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obsidian_notas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_notas_historico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nota_id` int NOT NULL,
	`versao` int NOT NULL,
	`conteudo` text NOT NULL,
	`frontmatter` text,
	`hash` varchar(64) NOT NULL,
	`tamanho` int DEFAULT 0,
	`modificado_por` varchar(255),
	`tipo_mudanca` enum('criacao','edicao','sync','conflito_resolvido') DEFAULT 'edicao',
	`diferencas` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_notas_historico_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_notas_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nota_id` int NOT NULL,
	`tag_id` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_notas_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_search_index` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nota_id` int NOT NULL,
	`titulo_indexado` text,
	`conteudo_indexado` text,
	`tags_indexadas` text,
	`metadados_indexados` text,
	`ultima_indexacao` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_search_index_id` PRIMARY KEY(`id`),
	CONSTRAINT `obsidian_search_index_nota_id_unique` UNIQUE(`nota_id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_sync_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vault_id` int NOT NULL,
	`sync_automatico` int NOT NULL DEFAULT 1,
	`intervalo_sync` int DEFAULT 300,
	`resolucao_conflito` enum('manual','local_vence','remoto_vence','mais_recente_vence','mesclar') DEFAULT 'manual',
	`incluir_pastas` text,
	`excluir_pastas` text,
	`incluir_extensoes` varchar(500) DEFAULT '.md,.txt',
	`backup_antes` int NOT NULL DEFAULT 1,
	`backup_intervalo` int DEFAULT 86400,
	`backup_retencao` int DEFAULT 30,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obsidian_sync_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `obsidian_sync_configs_vault_id_unique` UNIQUE(`vault_id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vault_id` int NOT NULL,
	`tag` varchar(255) NOT NULL,
	`cor` varchar(7),
	`uso_count` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_vaults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`caminho` varchar(1000),
	`cor` varchar(7) DEFAULT '#8b5cf6',
	`icone` varchar(50) DEFAULT '📚',
	`ativo` int NOT NULL DEFAULT 1,
	`ultimo_sync` timestamp,
	`total_notas` int DEFAULT 0,
	`total_tags` int DEFAULT 0,
	`total_backlinks` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obsidian_vaults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `nota_origem_idx` ON `obsidian_backlinks` (`nota_origem_id`);--> statement-breakpoint
CREATE INDEX `nota_destino_idx` ON `obsidian_backlinks` (`nota_destino_id`);--> statement-breakpoint
CREATE INDEX `origem_destino_unique` ON `obsidian_backlinks` (`nota_origem_id`,`nota_destino_id`);--> statement-breakpoint
CREATE INDEX `vault_id_idx` ON `obsidian_backups` (`vault_id`);--> statement-breakpoint
CREATE INDEX `tipo_backup_idx` ON `obsidian_backups` (`tipo_backup`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `obsidian_fluxos` (`user_id`);--> statement-breakpoint
CREATE INDEX `ativo_idx` ON `obsidian_fluxos` (`ativo`);--> statement-breakpoint
CREATE INDEX `trigger_tipo_idx` ON `obsidian_fluxos` (`trigger_tipo`);--> statement-breakpoint
CREATE INDEX `fluxo_id_idx` ON `obsidian_fluxos_log` (`fluxo_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `obsidian_fluxos_log` (`status`);--> statement-breakpoint
CREATE INDEX `vault_id_idx` ON `obsidian_notas` (`vault_id`);--> statement-breakpoint
CREATE INDEX `titulo_idx` ON `obsidian_notas` (`titulo`);--> statement-breakpoint
CREATE INDEX `caminho_idx` ON `obsidian_notas` (`caminho`);--> statement-breakpoint
CREATE INDEX `sync_status_idx` ON `obsidian_notas` (`sync_status`);--> statement-breakpoint
CREATE INDEX `hash_idx` ON `obsidian_notas` (`hash`);--> statement-breakpoint
CREATE INDEX `nota_id_idx` ON `obsidian_notas_historico` (`nota_id`);--> statement-breakpoint
CREATE INDEX `versao_idx` ON `obsidian_notas_historico` (`versao`);--> statement-breakpoint
CREATE INDEX `nota_id_idx` ON `obsidian_notas_tags` (`nota_id`);--> statement-breakpoint
CREATE INDEX `tag_id_idx` ON `obsidian_notas_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `nota_tag_unique` ON `obsidian_notas_tags` (`nota_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `nota_id_idx` ON `obsidian_search_index` (`nota_id`);--> statement-breakpoint
CREATE INDEX `vault_id_idx` ON `obsidian_tags` (`vault_id`);--> statement-breakpoint
CREATE INDEX `tag_idx` ON `obsidian_tags` (`tag`);--> statement-breakpoint
CREATE INDEX `vault_tag_unique` ON `obsidian_tags` (`vault_id`,`tag`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `obsidian_vaults` (`user_id`);--> statement-breakpoint
CREATE INDEX `ativo_idx` ON `obsidian_vaults` (`ativo`);