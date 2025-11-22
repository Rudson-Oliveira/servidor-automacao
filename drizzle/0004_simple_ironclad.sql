CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(64) NOT NULL,
	`nome` varchar(200) NOT NULL,
	`descricao` text,
	`ativa` int NOT NULL DEFAULT 1,
	`ultimo_uso` timestamp,
	`total_requisicoes` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_chave_unique` UNIQUE(`chave`)
);
--> statement-breakpoint
CREATE INDEX `chave_idx` ON `api_keys` (`chave`);--> statement-breakpoint
CREATE INDEX `ativa_idx` ON `api_keys` (`ativa`);