CREATE TABLE `sistema_pai_backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`backup_date` timestamp NOT NULL,
	`day_of_week` int NOT NULL,
	`version_id` varchar(64) NOT NULL,
	`backup_type` varchar(50) NOT NULL,
	`is_prototype_original` int NOT NULL DEFAULT 0,
	`backup_path` text NOT NULL,
	`backup_size` int NOT NULL,
	`system_state` json NOT NULL,
	`health_score` int NOT NULL,
	`has_errors` int NOT NULL DEFAULT 0,
	`description` text,
	`notes` text,
	`created_by` varchar(100) NOT NULL DEFAULT 'system',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_restored` timestamp,
	`restore_count` int NOT NULL DEFAULT 0,
	CONSTRAINT `sistema_pai_backups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sistema_pai_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`backup_enabled` int NOT NULL DEFAULT 1,
	`backup_time` varchar(5) NOT NULL DEFAULT '03:00',
	`max_backups` int NOT NULL DEFAULT 7,
	`auto_restore_enabled` int NOT NULL DEFAULT 1,
	`auto_restore_threshold` int NOT NULL DEFAULT 50,
	`prototype_backup_id` int,
	`prototype_created_at` timestamp,
	`notify_on_backup` int NOT NULL DEFAULT 0,
	`notify_on_restore` int NOT NULL DEFAULT 1,
	`notify_email` varchar(255),
	`notify_whatsapp` varchar(20),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sistema_pai_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sistema_pai_restores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`backup_id` int NOT NULL,
	`previous_version_id` varchar(64) NOT NULL,
	`previous_health_score` int NOT NULL,
	`reason` varchar(100) NOT NULL,
	`reason_details` text,
	`success` int NOT NULL,
	`error_message` text,
	`started_at` timestamp NOT NULL,
	`completed_at` timestamp,
	`duration_ms` int,
	`requested_by` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sistema_pai_restores_id` PRIMARY KEY(`id`)
);
