ALTER TABLE `obsidian_backlinks` ADD `vault_id` int NOT NULL;--> statement-breakpoint
CREATE INDEX `vault_id_idx` ON `obsidian_backlinks` (`vault_id`);