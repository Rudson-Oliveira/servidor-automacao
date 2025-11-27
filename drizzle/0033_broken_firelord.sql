CREATE TABLE `webhooks_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`events` json NOT NULL,
	`secret` varchar(255),
	`headers` json,
	`max_retries` int NOT NULL DEFAULT 3,
	`retry_delay` int NOT NULL DEFAULT 5000,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_triggered_at` timestamp,
	CONSTRAINT `webhooks_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhook_id` int NOT NULL,
	`user_id` int NOT NULL,
	`event` varchar(100) NOT NULL,
	`payload` json NOT NULL,
	`status_code` int,
	`response_body` text,
	`status` enum('pending','success','failed','retrying') NOT NULL,
	`attempt` int NOT NULL DEFAULT 1,
	`error_message` text,
	`sent_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`duration_ms` int,
	CONSTRAINT `webhooks_logs_id` PRIMARY KEY(`id`)
);
