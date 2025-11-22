CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`endpoint` varchar(255) NOT NULL,
	`input` text,
	`output` text,
	`validation_score` int NOT NULL,
	`is_hallucination` enum('0','1') NOT NULL DEFAULT '0',
	`real_data_verified` enum('0','1') NOT NULL DEFAULT '0',
	`discrepancies` text,
	`execution_time_ms` int NOT NULL,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
