CREATE TABLE `anticorpos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pattern_name` varchar(255) NOT NULL,
	`symptoms` text NOT NULL,
	`root_cause_tags` text NOT NULL,
	`severity` enum('critico','alto','medio','baixo') NOT NULL,
	`preventive_fix` text NOT NULL,
	`effectiveness_score` float NOT NULL DEFAULT 0.5,
	`times_applied` int NOT NULL DEFAULT 0,
	`times_successful` int NOT NULL DEFAULT 0,
	`last_applied` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anticorpos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback_correcoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`anticorpo_id` int,
	`erro_id` varchar(255) NOT NULL,
	`tipo_correcao` varchar(100) NOT NULL,
	`sucesso` boolean NOT NULL,
	`tempo_execucao` int NOT NULL,
	`metricas_antes` text NOT NULL,
	`metricas_depois` text,
	`rollback` boolean NOT NULL DEFAULT false,
	`observacoes` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_correcoes_id` PRIMARY KEY(`id`)
);
