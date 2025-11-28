CREATE TABLE `desktop_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`user_id` int NOT NULL,
	`command_type` varchar(50) NOT NULL,
	`command_data` text,
	`status` enum('pending','sent','executing','completed','failed') NOT NULL DEFAULT 'pending',
	`result` text,
	`error_message` text,
	`sent_at` timestamp,
	`completed_at` timestamp,
	`execution_time_ms` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_commands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `desktop_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`command_id` int,
	`agent_id` int NOT NULL,
	`user_id` int NOT NULL,
	`level` enum('debug','info','warning','error') NOT NULL DEFAULT 'info',
	`message` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `desktop_screenshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`user_id` int NOT NULL,
	`image_url` text NOT NULL,
	`image_key` varchar(500) NOT NULL,
	`width` int,
	`height` int,
	`file_size` int,
	`format` varchar(20) DEFAULT 'png',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_screenshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agent_id_idx` ON `desktop_commands` (`agent_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `desktop_commands` (`user_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `desktop_commands` (`status`);--> statement-breakpoint
CREATE INDEX `command_type_idx` ON `desktop_commands` (`command_type`);--> statement-breakpoint
CREATE INDEX `command_id_idx` ON `desktop_logs` (`command_id`);--> statement-breakpoint
CREATE INDEX `agent_id_idx` ON `desktop_logs` (`agent_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `desktop_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `level_idx` ON `desktop_logs` (`level`);--> statement-breakpoint
CREATE INDEX `agent_id_idx` ON `desktop_screenshots` (`agent_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `desktop_screenshots` (`user_id`);