CREATE TABLE `aprendizados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoria` varchar(100) NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text NOT NULL,
	`conhecimento` json NOT NULL,
	`validado` boolean NOT NULL DEFAULT false,
	`vezes_aplicado` int NOT NULL DEFAULT 0,
	`taxa_sucesso` float NOT NULL DEFAULT 0,
	`origem` enum('auto_descoberta','problema_resolvido','padrao_identificado','manual','outro') NOT NULL DEFAULT 'auto_descoberta',
	`confianca` float NOT NULL DEFAULT 0.5,
	`importancia` int NOT NULL DEFAULT 5,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aprendizados_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dependencias_gerenciadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('python','npm','sistema','outro') NOT NULL,
	`nome` varchar(255) NOT NULL,
	`versao` varchar(50),
	`instalado` boolean NOT NULL DEFAULT false,
	`instalado_em` timestamp,
	`comando_instalacao` text,
	`log_instalacao` text,
	`sucesso_instalacao` boolean,
	`requerido` boolean NOT NULL DEFAULT true,
	`descricao` text,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dependencias_gerenciadas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `padroes_identificados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text NOT NULL,
	`padrao_erro` json NOT NULL,
	`solucao_recomendada` json NOT NULL,
	`vezes_detectado` int NOT NULL DEFAULT 0,
	`vezes_resolvido` int NOT NULL DEFAULT 0,
	`taxa_sucesso` float NOT NULL DEFAULT 0,
	`prioridade` int NOT NULL DEFAULT 5,
	`ativo` boolean NOT NULL DEFAULT true,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `padroes_identificados_id` PRIMARY KEY(`id`),
	CONSTRAINT `padroes_identificados_nome_unique` UNIQUE(`nome`)
);
--> statement-breakpoint
CREATE TABLE `problemas_detectados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('erro_python','dependencia_faltando','erro_execucao','erro_api','erro_banco','erro_arquivo','erro_rede','performance','memoria','outro') NOT NULL,
	`categoria` varchar(100) NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text NOT NULL,
	`stack_trace` text,
	`codigo_erro` varchar(50),
	`mensagem_erro` text,
	`arquivo` varchar(500),
	`linha` int,
	`funcao` varchar(255),
	`contexto` json,
	`ambiente` varchar(50) DEFAULT 'production',
	`ocorrencias` int NOT NULL DEFAULT 1,
	`primeira_ocorrencia` timestamp NOT NULL DEFAULT (now()),
	`ultima_ocorrencia` timestamp NOT NULL DEFAULT (now()),
	`resolvido` boolean NOT NULL DEFAULT false,
	`resolvido_em` timestamp,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `problemas_detectados_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `solucoes_aplicadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`problema_id` int NOT NULL,
	`tipo` enum('instalar_dependencia','corrigir_codigo','reiniciar_servico','limpar_cache','atualizar_config','executar_script','rollback','outro') NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text NOT NULL,
	`comando` text,
	`script` text,
	`parametros` json,
	`sucesso` boolean NOT NULL,
	`mensagem_resultado` text,
	`tempo_execucao` int,
	`mudancas_realizadas` json,
	`arquivos_modificados` json,
	`confianca` float NOT NULL DEFAULT 0.5,
	`feedback` text,
	`aplicada_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `solucoes_aplicadas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `categoria_idx` ON `aprendizados` (`categoria`);--> statement-breakpoint
CREATE INDEX `validado_idx` ON `aprendizados` (`validado`);--> statement-breakpoint
CREATE INDEX `taxa_sucesso_idx` ON `aprendizados` (`taxa_sucesso`);--> statement-breakpoint
CREATE INDEX `tipo_nome_idx` ON `dependencias_gerenciadas` (`tipo`,`nome`);--> statement-breakpoint
CREATE INDEX `instalado_idx` ON `dependencias_gerenciadas` (`instalado`);--> statement-breakpoint
CREATE INDEX `nome_idx` ON `padroes_identificados` (`nome`);--> statement-breakpoint
CREATE INDEX `ativo_idx` ON `padroes_identificados` (`ativo`);--> statement-breakpoint
CREATE INDEX `taxa_sucesso_idx` ON `padroes_identificados` (`taxa_sucesso`);--> statement-breakpoint
CREATE INDEX `tipo_idx` ON `problemas_detectados` (`tipo`);--> statement-breakpoint
CREATE INDEX `categoria_idx` ON `problemas_detectados` (`categoria`);--> statement-breakpoint
CREATE INDEX `resolvido_idx` ON `problemas_detectados` (`resolvido`);--> statement-breakpoint
CREATE INDEX `problema_idx` ON `solucoes_aplicadas` (`problema_id`);--> statement-breakpoint
CREATE INDEX `tipo_idx` ON `solucoes_aplicadas` (`tipo`);--> statement-breakpoint
CREATE INDEX `sucesso_idx` ON `solucoes_aplicadas` (`sucesso`);