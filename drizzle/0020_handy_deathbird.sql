CREATE TABLE `whatsapp_blacklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(20) NOT NULL,
	`reason` enum('blocked','reported','invalid','opt_out','manual') NOT NULL,
	`blocked_number` varchar(20),
	`details` text,
	`contact_name` varchar(255),
	`last_campaign` varchar(255),
	`attempt_count` int DEFAULT 0,
	`blocked_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	CONSTRAINT `whatsapp_blacklist_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsapp_blacklist_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_block_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affected_number` varchar(20) NOT NULL,
	`alert_type` enum('multiple_blocks','high_failure_rate','spam_detected','number_at_risk') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`count` int NOT NULL,
	`period_hours` int NOT NULL,
	`details` text,
	`owner_notified` int DEFAULT 0,
	`notified_at` timestamp,
	`status` enum('active','resolved','ignored') DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`resolved_at` timestamp,
	CONSTRAINT `whatsapp_block_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_send_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` varchar(100) NOT NULL,
	`sender_number` varchar(20) NOT NULL,
	`recipient_phone` varchar(20) NOT NULL,
	`status` enum('pending','sent','delivered','read','failed','blocked') NOT NULL DEFAULT 'pending',
	`message_preview` text,
	`template_id` varchar(100),
	`campaign` varchar(255),
	`error_code` varchar(50),
	`error_message` text,
	`sent_at` timestamp,
	`delivered_at` timestamp,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_send_history_id` PRIMARY KEY(`id`)
);
