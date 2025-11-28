CREATE TABLE `desktop_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`agent_id` int,
	`command_id` int,
	`type` enum('command_blocked','agent_offline','command_failed','screenshot_captured','agent_online','command_success','security_alert') NOT NULL,
	`severity` enum('info','warning','error','critical') NOT NULL DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`is_read` int NOT NULL DEFAULT 0,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_notifications_id` PRIMARY KEY(`id`)
);
