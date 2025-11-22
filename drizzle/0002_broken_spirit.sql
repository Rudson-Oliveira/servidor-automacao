CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(200) NOT NULL,
	`descricao` text,
	`instrucoes` text NOT NULL,
	`exemplo` text,
	`tags` varchar(500),
	`categoria` varchar(100),
	`autonomia_nivel` enum('baixa','media','alta','total') DEFAULT 'media',
	`uso_count` int DEFAULT 0,
	`sucesso_count` int DEFAULT 0,
	`falha_count` int DEFAULT 0,
	`ultima_execucao` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `skills_nome_unique` UNIQUE(`nome`)
);
