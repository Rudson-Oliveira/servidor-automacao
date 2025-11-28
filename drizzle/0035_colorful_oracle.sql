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
