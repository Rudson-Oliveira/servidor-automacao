CREATE TABLE `desktop_scheduled_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`agent_id` int NOT NULL,
	`command` text NOT NULL,
	`description` varchar(500),
	`schedule_type` enum('once','interval','cron','event') NOT NULL,
	`schedule_config` text NOT NULL,
	`status` enum('active','paused','completed','failed') NOT NULL DEFAULT 'active',
	`max_retries` int NOT NULL DEFAULT 3,
	`current_retries` int NOT NULL DEFAULT 0,
	`last_executed_at` timestamp,
	`next_execution_at` timestamp,
	`last_result` text,
	`last_error` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `desktop_scheduled_commands_id` PRIMARY KEY(`id`)
);
