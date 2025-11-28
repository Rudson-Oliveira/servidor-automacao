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
--> statement-breakpoint
CREATE TABLE `obsidian_backlinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vault_id` int NOT NULL,
	`nota_origem_id` int NOT NULL,
	`nota_destino_id` int NOT NULL,
	`tipo_link` enum('wikilink','markdown','embed') DEFAULT 'wikilink',
	`contexto` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_backlinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vault_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`tipo_backup` enum('manual','automatico','pre_sync') DEFAULT 'manual',
	`caminho_arquivo` varchar(1000) NOT NULL,
	`url_download` varchar(1000),
	`tamanho` int DEFAULT 0,
	`total_notas` int DEFAULT 0,
	`hash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_backups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_fluxos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`ativo` int NOT NULL DEFAULT 1,
	`trigger_tipo` enum('nota_criada','nota_modificada','nota_deletada','tag_adicionada','whatsapp_recebido','whatsapp_enviado','agendamento','webhook') NOT NULL,
	`trigger_config` text,
	`filtros` text,
	`actions` text NOT NULL,
	`total_execucoes` int DEFAULT 0,
	`total_sucessos` int DEFAULT 0,
	`total_falhas` int DEFAULT 0,
	`ultima_execucao` timestamp,
	`proxima_execucao` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obsidian_fluxos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_fluxos_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fluxo_id` int NOT NULL,
	`status` enum('sucesso','falha','parcial') NOT NULL,
	`trigger_data` text,
	`actions_executadas` text,
	`erro` text,
	`tempo_execucao` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_fluxos_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_notas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vault_id` int NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`caminho` varchar(1000) NOT NULL,
	`conteudo` text NOT NULL,
	`conteudo_plain_text` text,
	`frontmatter` text,
	`tamanho` int DEFAULT 0,
	`palavras` int DEFAULT 0,
	`hash` varchar(64),
	`versao` int DEFAULT 1,
	`ultima_modificacao` timestamp NOT NULL,
	`ultimo_sync` timestamp,
	`sync_status` enum('sincronizado','pendente','conflito','erro') DEFAULT 'sincronizado',
	`conflito` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obsidian_notas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_notas_historico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nota_id` int NOT NULL,
	`versao` int NOT NULL,
	`conteudo` text NOT NULL,
	`frontmatter` text,
	`hash` varchar(64) NOT NULL,
	`tamanho` int DEFAULT 0,
	`modificado_por` varchar(255),
	`tipo_mudanca` enum('criacao','edicao','sync','conflito_resolvido') DEFAULT 'edicao',
	`diferencas` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_notas_historico_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_notas_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nota_id` int NOT NULL,
	`tag_id` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_notas_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_search_index` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nota_id` int NOT NULL,
	`titulo_indexado` text,
	`conteudo_indexado` text,
	`tags_indexadas` text,
	`metadados_indexados` text,
	`ultima_indexacao` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_search_index_id` PRIMARY KEY(`id`),
	CONSTRAINT `obsidian_search_index_nota_id_unique` UNIQUE(`nota_id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_sync_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vault_id` int NOT NULL,
	`sync_automatico` int NOT NULL DEFAULT 1,
	`intervalo_sync` int DEFAULT 300,
	`resolucao_conflito` enum('manual','local_vence','remoto_vence','mais_recente_vence','mesclar') DEFAULT 'manual',
	`incluir_pastas` text,
	`excluir_pastas` text,
	`incluir_extensoes` varchar(500) DEFAULT '.md,.txt',
	`backup_antes` int NOT NULL DEFAULT 1,
	`backup_intervalo` int DEFAULT 86400,
	`backup_retencao` int DEFAULT 30,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obsidian_sync_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `obsidian_sync_configs_vault_id_unique` UNIQUE(`vault_id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vault_id` int NOT NULL,
	`tag` varchar(255) NOT NULL,
	`cor` varchar(7),
	`uso_count` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obsidian_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obsidian_vaults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`caminho` varchar(1000),
	`cor` varchar(7) DEFAULT '#8b5cf6',
	`icone` varchar(50) DEFAULT '📚',
	`ativo` int NOT NULL DEFAULT 1,
	`ultimo_sync` timestamp,
	`total_notas` int DEFAULT 0,
	`total_tags` int DEFAULT 0,
	`total_backlinks` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obsidian_vaults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `desktop_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`device_name` varchar(255),
	`platform` varchar(50),
	`version` varchar(50),
	`status` enum('online','offline','busy','error') NOT NULL DEFAULT 'offline',
	`last_ping` timestamp,
	`ip_address` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `desktop_agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `desktop_agents_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `desktop_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`user_id` int NOT NULL,
	`command_type` varchar(50) NOT NULL,
	`command_data` text,
	`status` enum('pending','sent','executing','completed','failed') NOT NULL DEFAULT 'pending',
	`result` text,
	`error_message` text,
	`sent_at` timestamp,
	`completed_at` timestamp,
	`execution_time_ms` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_commands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `desktop_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`command_id` int,
	`agent_id` int NOT NULL,
	`user_id` int NOT NULL,
	`level` enum('debug','info','warning','error') NOT NULL DEFAULT 'info',
	`message` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `desktop_screenshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`user_id` int NOT NULL,
	`image_url` text NOT NULL,
	`image_key` varchar(500) NOT NULL,
	`width` int,
	`height` int,
	`file_size` int,
	`format` varchar(20) DEFAULT 'png',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_screenshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`events` json NOT NULL,
	`secret` varchar(255),
	`headers` json,
	`max_retries` int NOT NULL DEFAULT 3,
	`retry_delay` int NOT NULL DEFAULT 5000,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_triggered_at` timestamp,
	CONSTRAINT `webhooks_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhook_id` int NOT NULL,
	`user_id` int NOT NULL,
	`event` varchar(100) NOT NULL,
	`payload` json NOT NULL,
	`status_code` int,
	`response_body` text,
	`status` enum('pending','success','failed','retrying') NOT NULL,
	`attempt` int NOT NULL DEFAULT 1,
	`error_message` text,
	`sent_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`duration_ms` int,
	CONSTRAINT `webhooks_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `whatsapp_campaign_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_id` int NOT NULL,
	`phone` varchar(20) NOT NULL,
	`name` varchar(255),
	`variables` json,
	`status` enum('pending','sent','delivered','read','failed','blocked') NOT NULL DEFAULT 'pending',
	`sent_at` timestamp,
	`delivered_at` timestamp,
	`read_at` timestamp,
	`failed_at` timestamp,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_campaign_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`template_id` int,
	`session_id` varchar(100) NOT NULL,
	`status` enum('draft','scheduled','running','paused','completed','cancelled','failed') NOT NULL DEFAULT 'draft',
	`scheduled_start` timestamp,
	`scheduled_end` timestamp,
	`allowed_hours_start` int DEFAULT 9,
	`allowed_hours_end` int DEFAULT 18,
	`max_messages_per_hour` int DEFAULT 40,
	`max_messages_per_day` int DEFAULT 300,
	`auto_pause_enabled` boolean DEFAULT true,
	`auto_pause_threshold` int DEFAULT 5,
	`total_contacts` int DEFAULT 0,
	`messages_sent` int DEFAULT 0,
	`messages_delivered` int DEFAULT 0,
	`messages_read` int DEFAULT 0,
	`messages_failed` int DEFAULT 0,
	`messages_blocked` int DEFAULT 0,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`started_at` timestamp,
	`completed_at` timestamp,
	`paused_at` timestamp,
	`pause_reason` text,
	CONSTRAINT `whatsapp_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`content` text NOT NULL,
	`variables` json,
	`description` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `whatsapp_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `desktop_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`agent_id` int,
	`command_id` int,
	`type` enum('command_blocked','agent_offline','command_failed','screenshot_captured','agent_online','command_success','security_alert') NOT NULL,
	`severity` enum('info','warning','error','critical') NOT NULL DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`is_read` int NOT NULL DEFAULT 0,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `desktop_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `desktop_scheduled_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`agent_id` int NOT NULL,
	`command` text NOT NULL,
	`description` varchar(500),
	`schedule_type` enum('once','interval','cron','event') NOT NULL,
	`schedule_config` text NOT NULL,
	`status` enum('active','paused','completed','failed') NOT NULL DEFAULT 'active',
	`max_retries` int NOT NULL DEFAULT 3,
	`current_retries` int NOT NULL DEFAULT 0,
	`last_executed_at` timestamp,
	`next_execution_at` timestamp,
	`last_result` text,
	`last_error` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `desktop_scheduled_commands_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE INDEX `vault_id_idx` ON `obsidian_backlinks` (`vault_id`);--> statement-breakpoint
CREATE INDEX `nota_origem_idx` ON `obsidian_backlinks` (`nota_origem_id`);--> statement-breakpoint
CREATE INDEX `nota_destino_idx` ON `obsidian_backlinks` (`nota_destino_id`);--> statement-breakpoint
CREATE INDEX `origem_destino_unique` ON `obsidian_backlinks` (`nota_origem_id`,`nota_destino_id`);--> statement-breakpoint
CREATE INDEX `vault_id_idx` ON `obsidian_backups` (`vault_id`);--> statement-breakpoint
CREATE INDEX `tipo_backup_idx` ON `obsidian_backups` (`tipo_backup`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `obsidian_fluxos` (`user_id`);--> statement-breakpoint
CREATE INDEX `ativo_idx` ON `obsidian_fluxos` (`ativo`);--> statement-breakpoint
CREATE INDEX `trigger_tipo_idx` ON `obsidian_fluxos` (`trigger_tipo`);--> statement-breakpoint
CREATE INDEX `fluxo_id_idx` ON `obsidian_fluxos_log` (`fluxo_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `obsidian_fluxos_log` (`status`);--> statement-breakpoint
CREATE INDEX `vault_id_idx` ON `obsidian_notas` (`vault_id`);--> statement-breakpoint
CREATE INDEX `titulo_idx` ON `obsidian_notas` (`titulo`);--> statement-breakpoint
CREATE INDEX `caminho_idx` ON `obsidian_notas` (`caminho`);--> statement-breakpoint
CREATE INDEX `sync_status_idx` ON `obsidian_notas` (`sync_status`);--> statement-breakpoint
CREATE INDEX `hash_idx` ON `obsidian_notas` (`hash`);--> statement-breakpoint
CREATE INDEX `nota_id_idx` ON `obsidian_notas_historico` (`nota_id`);--> statement-breakpoint
CREATE INDEX `versao_idx` ON `obsidian_notas_historico` (`versao`);--> statement-breakpoint
CREATE INDEX `nota_id_idx` ON `obsidian_notas_tags` (`nota_id`);--> statement-breakpoint
CREATE INDEX `tag_id_idx` ON `obsidian_notas_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `nota_tag_unique` ON `obsidian_notas_tags` (`nota_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `nota_id_idx` ON `obsidian_search_index` (`nota_id`);--> statement-breakpoint
CREATE INDEX `vault_id_idx` ON `obsidian_tags` (`vault_id`);--> statement-breakpoint
CREATE INDEX `tag_idx` ON `obsidian_tags` (`tag`);--> statement-breakpoint
CREATE INDEX `vault_tag_unique` ON `obsidian_tags` (`vault_id`,`tag`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `obsidian_vaults` (`user_id`);--> statement-breakpoint
CREATE INDEX `ativo_idx` ON `obsidian_vaults` (`ativo`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `desktop_agents` (`user_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `desktop_agents` (`status`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `desktop_agents` (`token`);--> statement-breakpoint
CREATE INDEX `agent_id_idx` ON `desktop_commands` (`agent_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `desktop_commands` (`user_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `desktop_commands` (`status`);--> statement-breakpoint
CREATE INDEX `command_type_idx` ON `desktop_commands` (`command_type`);--> statement-breakpoint
CREATE INDEX `command_id_idx` ON `desktop_logs` (`command_id`);--> statement-breakpoint
CREATE INDEX `agent_id_idx` ON `desktop_logs` (`agent_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `desktop_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `level_idx` ON `desktop_logs` (`level`);--> statement-breakpoint
CREATE INDEX `agent_id_idx` ON `desktop_screenshots` (`agent_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `desktop_screenshots` (`user_id`);