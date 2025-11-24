CREATE TABLE `apis_personalizadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(200) NOT NULL,
	`descricao` text,
	`url` varchar(500) NOT NULL,
	`metodo` enum('GET','POST','PUT','DELETE','PATCH') NOT NULL DEFAULT 'POST',
	`headers` text,
	`chave_api` varchar(500),
	`tipo_autenticacao` enum('none','bearer','api_key','basic','custom') DEFAULT 'bearer',
	`parametros` text,
	`ativa` int NOT NULL DEFAULT 1,
	`teste_conexao` int DEFAULT 0,
	`ultimo_teste` timestamp,
	`mensagem_erro` text,
	`uso_count` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apis_personalizadas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ativa_idx` ON `apis_personalizadas` (`ativa`);--> statement-breakpoint
CREATE INDEX `nome_idx` ON `apis_personalizadas` (`nome`);