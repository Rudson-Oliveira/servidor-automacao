CREATE TABLE `obsidian_operations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operacao` varchar(100) NOT NULL,
	`caminho_arquivo` varchar(1000),
	`status` enum('sucesso','falha','pendente') NOT NULL DEFAULT 'pendente',
	`tentativas` int DEFAULT 1,
	`erro` text,
	`detalhes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_operations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `operacao_idx` ON `obsidian_operations` (`operacao`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `obsidian_operations` (`status`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `obsidian_operations` (`createdAt`);