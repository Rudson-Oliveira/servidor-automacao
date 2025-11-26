CREATE TABLE `agentes_locais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`id_agente` varchar(200) NOT NULL,
	`user_id` int,
	`sistema` text,
	`permissoes` text,
	`status` enum('conectado','desconectado','erro') DEFAULT 'desconectado',
	`conectado_em` timestamp,
	`ultimo_heartbeat` timestamp,
	`versao_agente` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentes_locais_id` PRIMARY KEY(`id`),
	CONSTRAINT `agentes_locais_id_agente_unique` UNIQUE(`id_agente`)
);
--> statement-breakpoint
CREATE TABLE `comandos_agente` (
	`id` int AUTO_INCREMENT NOT NULL,
	`id_comando` varchar(100) NOT NULL,
	`id_agente` varchar(200) NOT NULL,
	`comando` varchar(100) NOT NULL,
	`parametros` text,
	`status` enum('pendente','executando','sucesso','erro','timeout') DEFAULT 'pendente',
	`resposta` text,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`executado_em` timestamp,
	`tempo_execucao_ms` int,
	CONSTRAINT `comandos_agente_id` PRIMARY KEY(`id`),
	CONSTRAINT `comandos_agente_id_comando_unique` UNIQUE(`id_comando`)
);
--> statement-breakpoint
CREATE TABLE `mensagens_agente` (
	`id` int AUTO_INCREMENT NOT NULL,
	`id_agente` varchar(200) NOT NULL,
	`tipo` varchar(100) NOT NULL,
	`dados` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mensagens_agente_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `status_idx` ON `agentes_locais` (`status`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `agentes_locais` (`user_id`);--> statement-breakpoint
CREATE INDEX `id_agente_idx` ON `comandos_agente` (`id_agente`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `comandos_agente` (`status`);--> statement-breakpoint
CREATE INDEX `comando_idx` ON `comandos_agente` (`comando`);--> statement-breakpoint
CREATE INDEX `id_agente_idx` ON `mensagens_agente` (`id_agente`);--> statement-breakpoint
CREATE INDEX `tipo_idx` ON `mensagens_agente` (`tipo`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `mensagens_agente` (`timestamp`);