CREATE TABLE `ia_feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ia_origem` varchar(100) NOT NULL,
	`tema` varchar(100) NOT NULL,
	`tipo_feedback` enum('descoberta','correcao','atualizacao','sugestao') NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text NOT NULL,
	`evidencias` text,
	`impacto` enum('baixo','medio','alto','critico') DEFAULT 'medio',
	`status` enum('pendente','em_analise','aprovado','rejeitado','implementado') DEFAULT 'pendente',
	`prioridade` int DEFAULT 5,
	`analisado_por` varchar(100),
	`comentario_analise` text,
	`data_analise` timestamp,
	`data_implementacao` timestamp,
	`versao_antes` varchar(50),
	`versao_depois` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ia_feedbacks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ia_origem_idx` ON `ia_feedbacks` (`ia_origem`);--> statement-breakpoint
CREATE INDEX `tema_idx` ON `ia_feedbacks` (`tema`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `ia_feedbacks` (`status`);--> statement-breakpoint
CREATE INDEX `tipo_feedback_idx` ON `ia_feedbacks` (`tipo_feedback`);