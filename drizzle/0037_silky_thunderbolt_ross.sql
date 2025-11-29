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
