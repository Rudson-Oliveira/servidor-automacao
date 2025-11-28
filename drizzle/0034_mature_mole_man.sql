CREATE TABLE `ai_clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`version` varchar(50),
	`provider` varchar(100),
	`client_id` varchar(64) NOT NULL,
	`client_secret` varchar(128) NOT NULL,
	`capabilities` json,
	`limitations` text,
	`contact_email` varchar(320),
	`status` enum('pending','active','suspended','banned') NOT NULL DEFAULT 'pending',
	`trust_score` int NOT NULL DEFAULT 50,
	`tier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`accepted_policies_version` varchar(20),
	`accepted_policies_at` timestamp,
	`total_requests` int NOT NULL DEFAULT 0,
	`successful_requests` int NOT NULL DEFAULT 0,
	`failed_requests` int NOT NULL DEFAULT 0,
	`total_violations` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_seen_at` timestamp,
	CONSTRAINT `ai_clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_clients_client_id_unique` UNIQUE(`client_id`)
);
--> statement-breakpoint
CREATE TABLE `ai_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(20) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`policies` json NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`effective_from` timestamp NOT NULL,
	`grace_period_days` int NOT NULL DEFAULT 7,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`created_by` varchar(255),
	CONSTRAINT `ai_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_policies_version_unique` UNIQUE(`version`)
);
--> statement-breakpoint
CREATE TABLE `ai_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` varchar(64) NOT NULL,
	`session_token` varchar(128) NOT NULL,
	`context` json,
	`policies_version` varchar(20) NOT NULL,
	`policies_acknowledged` boolean NOT NULL DEFAULT false,
	`request_count` int NOT NULL DEFAULT 0,
	`violation_count` int NOT NULL DEFAULT 0,
	`status` enum('active','expired','terminated') NOT NULL DEFAULT 'active',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`last_activity_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`terminated_at` timestamp,
	CONSTRAINT `ai_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_sessions_session_token_unique` UNIQUE(`session_token`)
);
--> statement-breakpoint
CREATE TABLE `ai_trust_score_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` varchar(64) NOT NULL,
	`previous_score` int NOT NULL,
	`new_score` int NOT NULL,
	`change` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`details` text,
	`factors` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_trust_score_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_violations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` varchar(64) NOT NULL,
	`session_id` int,
	`violation_type` varchar(100) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`description` text NOT NULL,
	`endpoint` varchar(255),
	`request_data` json,
	`action_taken` varchar(100),
	`resolved` boolean NOT NULL DEFAULT false,
	`resolved_at` timestamp,
	`resolved_by` varchar(255),
	`resolution` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_violations_id` PRIMARY KEY(`id`)
);
