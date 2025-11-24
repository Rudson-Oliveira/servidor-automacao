CREATE TABLE `desktop_captures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`screenshot_url` text NOT NULL,
	`resolucao_largura` int NOT NULL,
	`resolucao_altura` int NOT NULL,
	`total_programas` int DEFAULT 0,
	`total_janelas` int DEFAULT 0,
	`analisado` int DEFAULT 0,
	`analise_texto` text,
	`tags_detectadas` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_captures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `desktop_janelas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`capture_id` int NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`processo` varchar(255),
	`pid` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_janelas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `desktop_programas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`capture_id` int NOT NULL,
	`pid` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`usuario` varchar(100),
	`memoria_mb` int DEFAULT 0,
	`cpu_percent` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_programas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `desktop_captures` (`timestamp`);--> statement-breakpoint
CREATE INDEX `analisado_idx` ON `desktop_captures` (`analisado`);--> statement-breakpoint
CREATE INDEX `capture_id_idx` ON `desktop_janelas` (`capture_id`);--> statement-breakpoint
CREATE INDEX `processo_idx` ON `desktop_janelas` (`processo`);--> statement-breakpoint
CREATE INDEX `capture_id_idx` ON `desktop_programas` (`capture_id`);--> statement-breakpoint
CREATE INDEX `nome_idx` ON `desktop_programas` (`nome`);