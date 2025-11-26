DROP TABLE `agentes_locais`;--> statement-breakpoint
DROP TABLE `anticorpos`;--> statement-breakpoint
DROP TABLE `comandos_agente`;--> statement-breakpoint
DROP TABLE `feedback_correcoes`;--> statement-breakpoint
DROP TABLE `mensagens_agente`;--> statement-breakpoint
ALTER TABLE `execucoes` DROP COLUMN `skill_id`;--> statement-breakpoint
ALTER TABLE `execucoes` DROP COLUMN `timestamp`;--> statement-breakpoint
ALTER TABLE `skills` DROP COLUMN `versao`;