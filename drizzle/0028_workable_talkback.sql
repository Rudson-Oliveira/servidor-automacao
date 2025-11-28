CREATE TABLE `desktop_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`device_name` varchar(255),
	`platform` varchar(50),
	`version` varchar(50),
	`status` enum('connected','disconnected') NOT NULL DEFAULT 'disconnected',
	`last_ping` timestamp,
	`ip_address` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `desktop_agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `desktop_agents_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `desktop_agents` (`user_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `desktop_agents` (`status`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `desktop_agents` (`token`);