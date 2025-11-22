CREATE TABLE `comet_arquivos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caminho` text NOT NULL,
	`nome` varchar(500) NOT NULL,
	`tipo` varchar(50),
	`tamanho` int,
	`data_modificacao` timestamp,
	`conteudo_indexado` text,
	`ultima_indexacao` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comet_arquivos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comet_contexto` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` varchar(255) NOT NULL,
	`mensagem_usuario` text NOT NULL,
	`mensagem_comet` text,
	`contexto` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comet_contexto_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comet_preferencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(255) NOT NULL,
	`valor` text NOT NULL,
	`tipo` varchar(50) NOT NULL,
	`categoria` varchar(100),
	`confianca` int DEFAULT 50,
	`ultima_atualizacao` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comet_preferencias_id` PRIMARY KEY(`id`),
	CONSTRAINT `comet_preferencias_chave_unique` UNIQUE(`chave`)
);
--> statement-breakpoint
CREATE INDEX `nome_idx` ON `comet_arquivos` (`nome`);--> statement-breakpoint
CREATE INDEX `tipo_idx` ON `comet_arquivos` (`tipo`);--> statement-breakpoint
CREATE INDEX `session_idx` ON `comet_contexto` (`session_id`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `comet_contexto` (`timestamp`);