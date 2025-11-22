CREATE TABLE `conversas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` varchar(50) NOT NULL,
	`mensagem` text NOT NULL,
	`contexto` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `execucoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tarefa` text NOT NULL,
	`navegador` varchar(50),
	`planoBAtivado` int DEFAULT 0,
	`sucesso` int DEFAULT 1,
	`tempoExecucao` int,
	`resultado` text,
	`erro` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `execucoes_id` PRIMARY KEY(`id`)
);
