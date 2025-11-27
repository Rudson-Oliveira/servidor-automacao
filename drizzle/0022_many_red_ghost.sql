CREATE TABLE `agente_execucoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agente_id` varchar(64) NOT NULL,
	`agente_nome` varchar(255) NOT NULL,
	`comando` varchar(255) NOT NULL,
	`parametros` text,
	`resultado` text,
	`erro` text,
	`status` enum('sucesso','erro','timeout') NOT NULL,
	`duracao_ms` int,
	`executado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agente_execucoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agente_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`ativo` int NOT NULL DEFAULT 1,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`ultimo_uso` timestamp,
	CONSTRAINT `agente_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `agente_tokens_token_unique` UNIQUE(`token`)
);
