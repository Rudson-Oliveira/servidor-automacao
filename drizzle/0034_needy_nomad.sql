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
--> statement-breakpoint
CREATE TABLE `telemetry_anomalies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(100) NOT NULL,
	`metric` varchar(200) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`description` text,
	`expected_value` decimal(20,4),
	`actual_value` decimal(20,4) NOT NULL,
	`deviation` decimal(10,2),
	`resolved` int NOT NULL DEFAULT 0,
	`resolved_at` timestamp,
	`detected_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telemetry_anomalies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telemetry_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`severity` enum('debug','info','warning','error','critical') NOT NULL,
	`category` varchar(100) NOT NULL,
	`metadata` json,
	`timestamp` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telemetry_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telemetry_learnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`pattern` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`confidence` decimal(5,2) NOT NULL,
	`occurrences` int NOT NULL DEFAULT 1,
	`impact` enum('positive','neutral','negative') NOT NULL,
	`recommendation` text,
	`applied` int NOT NULL DEFAULT 0,
	`applied_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telemetry_learnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telemetry_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`type` enum('counter','gauge','histogram','summary') NOT NULL,
	`value` decimal(20,4) NOT NULL,
	`unit` varchar(50),
	`tags` json,
	`timestamp` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telemetry_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telemetry_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(100) NOT NULL,
	`component` varchar(200) NOT NULL,
	`probability` decimal(5,2) NOT NULL,
	`time_to_failure` int,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`indicators` json,
	`preventive_actions` json,
	`status` enum('pending','prevented','occurred','false_positive') NOT NULL DEFAULT 'pending',
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telemetry_predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`email_enabled` boolean NOT NULL DEFAULT true,
	`email_address` varchar(320),
	`whatsapp_enabled` boolean NOT NULL DEFAULT false,
	`whatsapp_number` varchar(20),
	`push_enabled` boolean NOT NULL DEFAULT true,
	`min_severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`anomaly_alerts` boolean NOT NULL DEFAULT true,
	`prediction_alerts` boolean NOT NULL DEFAULT true,
	`error_alerts` boolean NOT NULL DEFAULT true,
	`performance_alerts` boolean NOT NULL DEFAULT true,
	`throttle_minutes` int NOT NULL DEFAULT 15,
	`allowed_hours` json,
	`allowed_days` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`config_id` int,
	`type` enum('anomaly','prediction','error','performance','custom') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`metadata` json,
	`channels` json NOT NULL,
	`email_sent` boolean NOT NULL DEFAULT false,
	`email_error` text,
	`whatsapp_sent` boolean NOT NULL DEFAULT false,
	`whatsapp_error` text,
	`push_sent` boolean NOT NULL DEFAULT false,
	`push_error` text,
	`source_type` varchar(50),
	`source_id` int,
	`sent_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('anomaly','prediction','error','performance','custom') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`email_subject` varchar(255),
	`email_body` text,
	`email_html` text,
	`whatsapp_message` text,
	`push_title` varchar(100),
	`push_body` text,
	`variables` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_system` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_templates_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `ml_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metric_name` varchar(100) NOT NULL,
	`component` varchar(200) NOT NULL DEFAULT 'system',
	`predicted_value` decimal(10,2) NOT NULL,
	`confidence` decimal(5,4) NOT NULL,
	`is_anomaly` int NOT NULL DEFAULT 0,
	`threshold` decimal(10,2),
	`predicted_at` timestamp NOT NULL,
	`predicted_for` timestamp NOT NULL,
	`actual_value` decimal(10,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ml_predictions_id` PRIMARY KEY(`id`)
);
