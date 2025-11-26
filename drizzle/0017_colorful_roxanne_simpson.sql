ALTER TABLE `execucoes` ADD `skill_id` int;--> statement-breakpoint
ALTER TABLE `execucoes` ADD `timestamp` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `skills` ADD `versao` varchar(20) DEFAULT '1.0';