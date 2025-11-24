CREATE TABLE `alertas_servidor` (
	`id` int AUTO_INCREMENT NOT NULL,
	`servidor_id` int NOT NULL,
	`tipo` enum('espaco_disco','arquivo_modificado','acesso_negado','servidor_offline','erro_raspagem','arquivo_importante') NOT NULL,
	`severidade` enum('info','aviso','erro','critico') DEFAULT 'info',
	`titulo` varchar(255) NOT NULL,
	`mensagem` text NOT NULL,
	`detalhes` text,
	`lido` int NOT NULL DEFAULT 0,
	`resolvido` int NOT NULL DEFAULT 0,
	`data_resolucao` timestamp,
	`resolvido_por` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertas_servidor_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `arquivos_mapeados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`departamento_id` int NOT NULL,
	`nome` varchar(500) NOT NULL,
	`caminho_completo` text NOT NULL,
	`caminho_relativo` text,
	`extensao` varchar(20),
	`tipo_arquivo` varchar(100),
	`tamanho` int DEFAULT 0,
	`data_criacao` timestamp,
	`data_modificacao` timestamp,
	`data_acesso` timestamp,
	`hash` varchar(64),
	`conteudo_indexado` text,
	`metadados` text,
	`tags` varchar(500),
	`importante` int DEFAULT 0,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `arquivos_mapeados_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `catalogos_obsidian` (
	`id` int AUTO_INCREMENT NOT NULL,
	`servidor_id` int,
	`departamento_id` int,
	`titulo` varchar(255) NOT NULL,
	`tipo` enum('servidor_completo','departamento','tipo_arquivo','personalizado') NOT NULL,
	`uri` text NOT NULL,
	`nome_arquivo` varchar(255) NOT NULL,
	`total_links` int DEFAULT 0,
	`categorias` int DEFAULT 0,
	`gerado_por` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `catalogos_obsidian_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`servidor_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`caminho` text NOT NULL,
	`descricao` text,
	`categoria` varchar(100),
	`total_subpastas` int DEFAULT 0,
	`total_arquivos` int DEFAULT 0,
	`tamanho_total` int DEFAULT 0,
	`ultima_atualizacao` timestamp,
	`permissoes` text,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logs_raspagem` (
	`id` int AUTO_INCREMENT NOT NULL,
	`servidor_id` int NOT NULL,
	`tipo_operacao` enum('mapeamento','raspagem_completa','raspagem_incremental','verificacao') NOT NULL,
	`status` enum('iniciado','em_progresso','concluido','erro','cancelado') DEFAULT 'iniciado',
	`iniciado_por` varchar(100),
	`departamentos_processados` int DEFAULT 0,
	`arquivos_novos` int DEFAULT 0,
	`arquivos_atualizados` int DEFAULT 0,
	`arquivos_removidos` int DEFAULT 0,
	`erros_encontrados` int DEFAULT 0,
	`tempo_execucao` int,
	`detalhes` text,
	`mensagem_erro` text,
	`data_inicio` timestamp NOT NULL DEFAULT (now()),
	`data_fim` timestamp,
	CONSTRAINT `logs_raspagem_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `servidores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(200) NOT NULL,
	`endereco` varchar(255) NOT NULL,
	`tipo` enum('smb','ftp','sftp','http','local') DEFAULT 'smb',
	`descricao` text,
	`autenticacao_tipo` varchar(50),
	`usuario` varchar(255),
	`porta` int DEFAULT 445,
	`ativo` int NOT NULL DEFAULT 1,
	`ultima_mapeamento` timestamp,
	`ultima_raspagem` timestamp,
	`total_departamentos` int DEFAULT 0,
	`total_arquivos` int DEFAULT 0,
	`tamanho_total` int DEFAULT 0,
	`status` enum('online','offline','erro','mapeando','raspando') DEFAULT 'offline',
	`mensagem_erro` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `servidores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `servidor_id_idx` ON `alertas_servidor` (`servidor_id`);--> statement-breakpoint
CREATE INDEX `tipo_idx` ON `alertas_servidor` (`tipo`);--> statement-breakpoint
CREATE INDEX `severidade_idx` ON `alertas_servidor` (`severidade`);--> statement-breakpoint
CREATE INDEX `lido_idx` ON `alertas_servidor` (`lido`);--> statement-breakpoint
CREATE INDEX `resolvido_idx` ON `alertas_servidor` (`resolvido`);--> statement-breakpoint
CREATE INDEX `departamento_id_idx` ON `arquivos_mapeados` (`departamento_id`);--> statement-breakpoint
CREATE INDEX `nome_idx` ON `arquivos_mapeados` (`nome`);--> statement-breakpoint
CREATE INDEX `extensao_idx` ON `arquivos_mapeados` (`extensao`);--> statement-breakpoint
CREATE INDEX `tipo_arquivo_idx` ON `arquivos_mapeados` (`tipo_arquivo`);--> statement-breakpoint
CREATE INDEX `hash_idx` ON `arquivos_mapeados` (`hash`);--> statement-breakpoint
CREATE INDEX `servidor_id_idx` ON `catalogos_obsidian` (`servidor_id`);--> statement-breakpoint
CREATE INDEX `departamento_id_idx` ON `catalogos_obsidian` (`departamento_id`);--> statement-breakpoint
CREATE INDEX `tipo_idx` ON `catalogos_obsidian` (`tipo`);--> statement-breakpoint
CREATE INDEX `servidor_id_idx` ON `departamentos` (`servidor_id`);--> statement-breakpoint
CREATE INDEX `nome_idx` ON `departamentos` (`nome`);--> statement-breakpoint
CREATE INDEX `categoria_idx` ON `departamentos` (`categoria`);--> statement-breakpoint
CREATE INDEX `servidor_id_idx` ON `logs_raspagem` (`servidor_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `logs_raspagem` (`status`);--> statement-breakpoint
CREATE INDEX `tipo_operacao_idx` ON `logs_raspagem` (`tipo_operacao`);--> statement-breakpoint
CREATE INDEX `data_inicio_idx` ON `logs_raspagem` (`data_inicio`);--> statement-breakpoint
CREATE INDEX `endereco_idx` ON `servidores` (`endereco`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `servidores` (`status`);--> statement-breakpoint
CREATE INDEX `ativo_idx` ON `servidores` (`ativo`);