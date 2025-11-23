CREATE TABLE `deepsite_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scrape_id` int NOT NULL,
	`analysis_type` varchar(50) NOT NULL,
	`summary` text,
	`entities` text,
	`category` varchar(100),
	`language` varchar(10),
	`sentiment` varchar(20),
	`confidence` int,
	`analyzed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deepsite_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deepsite_cache_metadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` varchar(2048) NOT NULL,
	`scrape_id` int NOT NULL,
	`cached_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	`hit_count` int DEFAULT 0,
	`size` int,
	CONSTRAINT `deepsite_cache_metadata_id` PRIMARY KEY(`id`),
	CONSTRAINT `deepsite_cache_metadata_url_unique` UNIQUE(`url`)
);
--> statement-breakpoint
CREATE TABLE `deepsite_rate_limits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain` varchar(255) NOT NULL,
	`crawl_delay` int DEFAULT 1000,
	`last_request` timestamp,
	`request_count` int DEFAULT 0,
	`robots_txt` text,
	`robots_updated_at` timestamp,
	CONSTRAINT `deepsite_rate_limits_id` PRIMARY KEY(`id`),
	CONSTRAINT `deepsite_rate_limits_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `deepsite_scrapes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` varchar(2048) NOT NULL,
	`html` text,
	`metadata` text,
	`status` enum('success','failed','pending') NOT NULL DEFAULT 'pending',
	`error` text,
	`response_time` int,
	`scraped_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	CONSTRAINT `deepsite_scrapes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `scrape_id_idx` ON `deepsite_analyses` (`scrape_id`);--> statement-breakpoint
CREATE INDEX `analysis_type_idx` ON `deepsite_analyses` (`analysis_type`);--> statement-breakpoint
CREATE INDEX `analyzed_at_idx` ON `deepsite_analyses` (`analyzed_at`);--> statement-breakpoint
CREATE INDEX `url_idx` ON `deepsite_cache_metadata` (`url`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `deepsite_cache_metadata` (`expires_at`);--> statement-breakpoint
CREATE INDEX `scrape_id_idx` ON `deepsite_cache_metadata` (`scrape_id`);--> statement-breakpoint
CREATE INDEX `domain_idx` ON `deepsite_rate_limits` (`domain`);--> statement-breakpoint
CREATE INDEX `last_request_idx` ON `deepsite_rate_limits` (`last_request`);--> statement-breakpoint
CREATE INDEX `url_idx` ON `deepsite_scrapes` (`url`);--> statement-breakpoint
CREATE INDEX `scraped_at_idx` ON `deepsite_scrapes` (`scraped_at`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `deepsite_scrapes` (`expires_at`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `deepsite_scrapes` (`status`);