CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`endpoint` text NOT NULL,
	`keys` json NOT NULL,
	`user_agent` text,
	`device_name` varchar(255),
	`enabled_events` json NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_used_at` timestamp,
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
