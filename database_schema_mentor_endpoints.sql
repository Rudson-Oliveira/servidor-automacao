-- ========================================
-- MENTOR E LEITOR DE ENDPOINTS
-- Schema SQL Completo - MySQL/MariaDB
-- ========================================
-- Sistema de mapeamento e raspagem de servidores de rede
-- Autor: Manus
-- Data: 24/11/2025
-- Versão: 1.0.0
-- ========================================

-- ========================================
-- 1. TABELA: servidores
-- Armazena informações dos servidores monitorados
-- ========================================

CREATE TABLE IF NOT EXISTS `servidores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(200) NOT NULL COMMENT 'Nome amigável do servidor',
  `endereco` VARCHAR(255) NOT NULL COMMENT 'IP ou hostname (ex: 192.168.50.11)',
  `tipo` ENUM('smb', 'ftp', 'sftp', 'http', 'local') DEFAULT 'smb' COMMENT 'Tipo de protocolo',
  `descricao` TEXT COMMENT 'Descrição do servidor',
  `autenticacao_tipo` VARCHAR(50) COMMENT 'Tipo de autenticação (ntlm, basic, key)',
  `usuario` VARCHAR(255) COMMENT 'Usuário para autenticação',
  `porta` INT DEFAULT 445 COMMENT 'Porta de conexão (445 SMB, 21 FTP, etc)',
  `ativo` INT DEFAULT 1 NOT NULL COMMENT '1 = ativo, 0 = inativo',
  `ultima_mapeamento` TIMESTAMP NULL COMMENT 'Data/hora do último mapeamento',
  `ultima_raspagem` TIMESTAMP NULL COMMENT 'Data/hora da última raspagem',
  `total_departamentos` INT DEFAULT 0 COMMENT 'Total de departamentos/shares',
  `total_arquivos` INT DEFAULT 0 COMMENT 'Total de arquivos mapeados',
  `tamanho_total` BIGINT DEFAULT 0 COMMENT 'Tamanho total em bytes',
  `status` ENUM('online', 'offline', 'erro', 'mapeando', 'raspando') DEFAULT 'offline',
  `mensagem_erro` TEXT COMMENT 'Última mensagem de erro',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX `idx_endereco` (`endereco`),
  INDEX `idx_status` (`status`),
  INDEX `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Servidores de rede monitorados pelo sistema';

-- ========================================
-- 2. TABELA: departamentos
-- Estrutura organizacional - pastas/shares principais
-- ========================================

CREATE TABLE IF NOT EXISTS `departamentos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `servidor_id` INT NOT NULL COMMENT 'FK para servidores.id',
  `nome` VARCHAR(255) NOT NULL COMMENT 'Nome do departamento/share',
  `caminho` TEXT NOT NULL COMMENT 'Caminho completo (ex: \\\\192.168.50.11\\psicologia)',
  `descricao` TEXT COMMENT 'Descrição do departamento',
  `categoria` VARCHAR(100) COMMENT 'Categoria (administrativo, clinico, financeiro, etc)',
  `total_subpastas` INT DEFAULT 0 COMMENT 'Total de subpastas',
  `total_arquivos` INT DEFAULT 0 COMMENT 'Total de arquivos',
  `tamanho_total` BIGINT DEFAULT 0 COMMENT 'Tamanho total em bytes',
  `ultima_atualizacao` TIMESTAMP NULL COMMENT 'Última atualização dos dados',
  `permissoes` TEXT COMMENT 'JSON com permissões de acesso',
  `ativo` INT DEFAULT 1 NOT NULL COMMENT '1 = ativo, 0 = inativo',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX `idx_servidor_id` (`servidor_id`),
  INDEX `idx_nome` (`nome`),
  INDEX `idx_categoria` (`categoria`),
  
  FOREIGN KEY (`servidor_id`) REFERENCES `servidores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Departamentos/shares dos servidores';

-- ========================================
-- 3. TABELA: arquivos_mapeados
-- Índice completo de todos os arquivos
-- ========================================

CREATE TABLE IF NOT EXISTS `arquivos_mapeados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `departamento_id` INT NOT NULL COMMENT 'FK para departamentos.id',
  `nome` VARCHAR(500) NOT NULL COMMENT 'Nome do arquivo',
  `caminho_completo` TEXT NOT NULL COMMENT 'Caminho completo UNC',
  `caminho_relativo` TEXT COMMENT 'Caminho relativo ao departamento',
  `extensao` VARCHAR(20) COMMENT 'Extensão do arquivo (.pdf, .docx, etc)',
  `tipo_arquivo` VARCHAR(100) COMMENT 'Categoria (documento, planilha, imagem, etc)',
  `tamanho` BIGINT DEFAULT 0 COMMENT 'Tamanho em bytes',
  `data_criacao` TIMESTAMP NULL COMMENT 'Data de criação do arquivo',
  `data_modificacao` TIMESTAMP NULL COMMENT 'Data da última modificação',
  `data_acesso` TIMESTAMP NULL COMMENT 'Data do último acesso',
  `hash` VARCHAR(64) COMMENT 'Hash MD5 ou SHA256 para detectar duplicatas',
  `conteudo_indexado` TEXT COMMENT 'Primeiros 1000 caracteres para busca',
  `metadados` TEXT COMMENT 'JSON com metadados extras (autor, título, etc)',
  `tags` VARCHAR(500) COMMENT 'Tags separadas por vírgula',
  `importante` INT DEFAULT 0 COMMENT '1 = importante, 0 = normal',
  `observacoes` TEXT COMMENT 'Observações adicionais',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX `idx_departamento_id` (`departamento_id`),
  INDEX `idx_nome` (`nome`(255)),
  INDEX `idx_extensao` (`extensao`),
  INDEX `idx_tipo_arquivo` (`tipo_arquivo`),
  INDEX `idx_hash` (`hash`),
  FULLTEXT INDEX `ft_nome_conteudo` (`nome`, `conteudo_indexado`),
  
  FOREIGN KEY (`departamento_id`) REFERENCES `departamentos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Índice completo de arquivos mapeados';

-- ========================================
-- 4. TABELA: logs_raspagem
-- Histórico de operações de mapeamento e raspagem
-- ========================================

CREATE TABLE IF NOT EXISTS `logs_raspagem` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `servidor_id` INT NOT NULL COMMENT 'FK para servidores.id',
  `tipo_operacao` ENUM('mapeamento', 'raspagem_completa', 'raspagem_incremental', 'verificacao') NOT NULL,
  `status` ENUM('iniciado', 'em_progresso', 'concluido', 'erro', 'cancelado') DEFAULT 'iniciado',
  `iniciado_por` VARCHAR(100) COMMENT 'Quem iniciou (Comet, Manus, Rudson, Agendado)',
  `departamentos_processados` INT DEFAULT 0 COMMENT 'Quantidade de departamentos processados',
  `arquivos_novos` INT DEFAULT 0 COMMENT 'Arquivos novos encontrados',
  `arquivos_atualizados` INT DEFAULT 0 COMMENT 'Arquivos atualizados',
  `arquivos_removidos` INT DEFAULT 0 COMMENT 'Arquivos removidos',
  `erros_encontrados` INT DEFAULT 0 COMMENT 'Quantidade de erros',
  `tempo_execucao` INT COMMENT 'Tempo de execução em segundos',
  `detalhes` TEXT COMMENT 'JSON com detalhes da operação',
  `mensagem_erro` TEXT COMMENT 'Mensagem de erro (se houver)',
  `data_inicio` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `data_fim` TIMESTAMP NULL COMMENT 'Data/hora de conclusão',
  
  INDEX `idx_servidor_id` (`servidor_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_tipo_operacao` (`tipo_operacao`),
  INDEX `idx_data_inicio` (`data_inicio`),
  
  FOREIGN KEY (`servidor_id`) REFERENCES `servidores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Histórico de operações de raspagem';

-- ========================================
-- 5. TABELA: alertas_servidor
-- Sistema de monitoramento e alertas automáticos
-- ========================================

CREATE TABLE IF NOT EXISTS `alertas_servidor` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `servidor_id` INT NOT NULL COMMENT 'FK para servidores.id',
  `tipo` ENUM('espaco_disco', 'arquivo_modificado', 'acesso_negado', 'servidor_offline', 'erro_raspagem', 'arquivo_importante') NOT NULL,
  `severidade` ENUM('info', 'aviso', 'erro', 'critico') DEFAULT 'info',
  `titulo` VARCHAR(255) NOT NULL COMMENT 'Título do alerta',
  `mensagem` TEXT NOT NULL COMMENT 'Mensagem detalhada',
  `detalhes` TEXT COMMENT 'JSON com informações adicionais',
  `lido` INT DEFAULT 0 NOT NULL COMMENT '1 = lido, 0 = não lido',
  `resolvido` INT DEFAULT 0 NOT NULL COMMENT '1 = resolvido, 0 = pendente',
  `data_resolucao` TIMESTAMP NULL COMMENT 'Data/hora da resolução',
  `resolvido_por` VARCHAR(100) COMMENT 'Quem resolveu',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  INDEX `idx_servidor_id` (`servidor_id`),
  INDEX `idx_tipo` (`tipo`),
  INDEX `idx_severidade` (`severidade`),
  INDEX `idx_lido` (`lido`),
  INDEX `idx_resolvido` (`resolvido`),
  
  FOREIGN KEY (`servidor_id`) REFERENCES `servidores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Alertas e notificações do sistema';

-- ========================================
-- 6. TABELA: catalogos_obsidian
-- Histórico de catálogos gerados para Obsidian
-- ========================================

CREATE TABLE IF NOT EXISTS `catalogos_obsidian` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `servidor_id` INT COMMENT 'FK para servidores.id (NULL se personalizado)',
  `departamento_id` INT COMMENT 'FK para departamentos.id (NULL se servidor completo)',
  `titulo` VARCHAR(255) NOT NULL COMMENT 'Título do catálogo',
  `tipo` ENUM('servidor_completo', 'departamento', 'tipo_arquivo', 'personalizado') NOT NULL,
  `uri` TEXT NOT NULL COMMENT 'URI do Obsidian (obsidian://...)',
  `nome_arquivo` VARCHAR(255) NOT NULL COMMENT 'Nome do arquivo no Obsidian',
  `total_links` INT DEFAULT 0 COMMENT 'Total de links no catálogo',
  `categorias` INT DEFAULT 0 COMMENT 'Quantidade de categorias',
  `gerado_por` VARCHAR(100) COMMENT 'Quem gerou (Comet, Manus, Agendado)',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  INDEX `idx_servidor_id` (`servidor_id`),
  INDEX `idx_departamento_id` (`departamento_id`),
  INDEX `idx_tipo` (`tipo`),
  
  FOREIGN KEY (`servidor_id`) REFERENCES `servidores`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`departamento_id`) REFERENCES `departamentos`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Histórico de catálogos gerados para Obsidian';

-- ========================================
-- VIEWS ÚTEIS
-- ========================================

-- View: Estatísticas por Servidor
CREATE OR REPLACE VIEW `v_estatisticas_servidor` AS
SELECT 
  s.id,
  s.nome,
  s.endereco,
  s.status,
  COUNT(DISTINCT d.id) AS total_departamentos,
  COUNT(DISTINCT a.id) AS total_arquivos,
  SUM(a.tamanho) AS tamanho_total_bytes,
  ROUND(SUM(a.tamanho) / 1024 / 1024 / 1024, 2) AS tamanho_total_gb,
  MAX(a.data_modificacao) AS arquivo_mais_recente,
  s.ultima_raspagem
FROM servidores s
LEFT JOIN departamentos d ON s.id = d.servidor_id
LEFT JOIN arquivos_mapeados a ON d.id = a.departamento_id
GROUP BY s.id, s.nome, s.endereco, s.status, s.ultima_raspagem;

-- View: Top 10 Departamentos por Tamanho
CREATE OR REPLACE VIEW `v_top_departamentos_tamanho` AS
SELECT 
  d.id,
  d.nome,
  s.nome AS servidor_nome,
  d.total_arquivos,
  SUM(a.tamanho) AS tamanho_total_bytes,
  ROUND(SUM(a.tamanho) / 1024 / 1024 / 1024, 2) AS tamanho_total_gb
FROM departamentos d
INNER JOIN servidores s ON d.servidor_id = s.id
LEFT JOIN arquivos_mapeados a ON d.id = a.departamento_id
GROUP BY d.id, d.nome, s.nome, d.total_arquivos
ORDER BY tamanho_total_bytes DESC
LIMIT 10;

-- View: Arquivos Duplicados (mesmo hash)
CREATE OR REPLACE VIEW `v_arquivos_duplicados` AS
SELECT 
  a.hash,
  COUNT(*) AS quantidade_duplicatas,
  SUM(a.tamanho) AS espaco_desperdicado_bytes,
  ROUND(SUM(a.tamanho) / 1024 / 1024, 2) AS espaco_desperdicado_mb,
  GROUP_CONCAT(CONCAT(d.nome, '/', a.nome) SEPARATOR ' | ') AS localizacoes
FROM arquivos_mapeados a
INNER JOIN departamentos d ON a.departamento_id = d.id
WHERE a.hash IS NOT NULL
GROUP BY a.hash
HAVING COUNT(*) > 1
ORDER BY espaco_desperdicado_bytes DESC;

-- View: Distribuição de Tipos de Arquivo
CREATE OR REPLACE VIEW `v_distribuicao_tipos_arquivo` AS
SELECT 
  a.tipo_arquivo,
  COUNT(*) AS quantidade,
  SUM(a.tamanho) AS tamanho_total_bytes,
  ROUND(SUM(a.tamanho) / 1024 / 1024 / 1024, 2) AS tamanho_total_gb,
  ROUND(AVG(a.tamanho) / 1024 / 1024, 2) AS tamanho_medio_mb
FROM arquivos_mapeados a
GROUP BY a.tipo_arquivo
ORDER BY quantidade DESC;

-- View: Alertas Não Resolvidos
CREATE OR REPLACE VIEW `v_alertas_pendentes` AS
SELECT 
  a.id,
  s.nome AS servidor_nome,
  a.tipo,
  a.severidade,
  a.titulo,
  a.mensagem,
  a.createdAt,
  TIMESTAMPDIFF(HOUR, a.createdAt, NOW()) AS horas_pendente
FROM alertas_servidor a
INNER JOIN servidores s ON a.servidor_id = s.id
WHERE a.resolvido = 0
ORDER BY 
  CASE a.severidade
    WHEN 'critico' THEN 1
    WHEN 'erro' THEN 2
    WHEN 'aviso' THEN 3
    WHEN 'info' THEN 4
  END,
  a.createdAt DESC;

-- ========================================
-- PROCEDURES ÚTEIS
-- ========================================

-- Procedure: Atualizar Estatísticas do Servidor
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `sp_atualizar_estatisticas_servidor`(IN p_servidor_id INT)
BEGIN
  UPDATE servidores s
  SET 
    s.total_departamentos = (
      SELECT COUNT(*) 
      FROM departamentos 
      WHERE servidor_id = p_servidor_id
    ),
    s.total_arquivos = (
      SELECT COUNT(*) 
      FROM arquivos_mapeados a
      INNER JOIN departamentos d ON a.departamento_id = d.id
      WHERE d.servidor_id = p_servidor_id
    ),
    s.tamanho_total = (
      SELECT COALESCE(SUM(a.tamanho), 0)
      FROM arquivos_mapeados a
      INNER JOIN departamentos d ON a.departamento_id = d.id
      WHERE d.servidor_id = p_servidor_id
    )
  WHERE s.id = p_servidor_id;
END//
DELIMITER ;

-- Procedure: Atualizar Estatísticas do Departamento
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `sp_atualizar_estatisticas_departamento`(IN p_departamento_id INT)
BEGIN
  UPDATE departamentos d
  SET 
    d.total_arquivos = (
      SELECT COUNT(*) 
      FROM arquivos_mapeados 
      WHERE departamento_id = p_departamento_id
    ),
    d.tamanho_total = (
      SELECT COALESCE(SUM(tamanho), 0)
      FROM arquivos_mapeados 
      WHERE departamento_id = p_departamento_id
    ),
    d.ultima_atualizacao = NOW()
  WHERE d.id = p_departamento_id;
END//
DELIMITER ;

-- Procedure: Limpar Logs Antigos (mais de 90 dias)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `sp_limpar_logs_antigos`()
BEGIN
  DELETE FROM logs_raspagem
  WHERE data_inicio < DATE_SUB(NOW(), INTERVAL 90 DAY)
  AND status IN ('concluido', 'cancelado');
  
  SELECT ROW_COUNT() AS registros_removidos;
END//
DELIMITER ;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger: Atualizar estatísticas ao inserir arquivo
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_arquivos_after_insert`
AFTER INSERT ON `arquivos_mapeados`
FOR EACH ROW
BEGIN
  -- Atualizar departamento
  UPDATE departamentos 
  SET 
    total_arquivos = total_arquivos + 1,
    tamanho_total = tamanho_total + NEW.tamanho,
    ultima_atualizacao = NOW()
  WHERE id = NEW.departamento_id;
  
  -- Atualizar servidor
  UPDATE servidores s
  INNER JOIN departamentos d ON s.id = d.servidor_id
  SET 
    s.total_arquivos = s.total_arquivos + 1,
    s.tamanho_total = s.tamanho_total + NEW.tamanho
  WHERE d.id = NEW.departamento_id;
END//
DELIMITER ;

-- Trigger: Atualizar estatísticas ao deletar arquivo
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_arquivos_after_delete`
AFTER DELETE ON `arquivos_mapeados`
FOR EACH ROW
BEGIN
  -- Atualizar departamento
  UPDATE departamentos 
  SET 
    total_arquivos = total_arquivos - 1,
    tamanho_total = tamanho_total - OLD.tamanho,
    ultima_atualizacao = NOW()
  WHERE id = OLD.departamento_id;
  
  -- Atualizar servidor
  UPDATE servidores s
  INNER JOIN departamentos d ON s.id = d.servidor_id
  SET 
    s.total_arquivos = s.total_arquivos - 1,
    s.tamanho_total = s.tamanho_total - OLD.tamanho
  WHERE d.id = OLD.departamento_id;
END//
DELIMITER ;

-- ========================================
-- DADOS INICIAIS (EXEMPLO)
-- ========================================

-- Inserir servidor de exemplo
INSERT INTO `servidores` 
  (`nome`, `endereco`, `tipo`, `descricao`, `autenticacao_tipo`, `porta`, `ativo`, `status`)
VALUES 
  ('Servidor Hospitalar', '192.168.50.11', 'smb', 'Servidor principal de arquivos da instituição hospitalar', 'ntlm', 445, 1, 'offline');

-- ========================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ========================================

-- Índice composto para busca por servidor + departamento
CREATE INDEX `idx_servidor_departamento` ON `arquivos_mapeados` (`departamento_id`, `tipo_arquivo`);

-- Índice para busca por data de modificação
CREATE INDEX `idx_data_modificacao` ON `arquivos_mapeados` (`data_modificacao`);

-- Índice para busca de arquivos importantes
CREATE INDEX `idx_importante` ON `arquivos_mapeados` (`importante`, `tipo_arquivo`);

-- ========================================
-- COMENTÁRIOS FINAIS
-- ========================================

-- Este schema foi projetado para:
-- 1. Armazenar metadados completos de arquivos de servidores de rede
-- 2. Suportar múltiplos servidores e departamentos
-- 3. Permitir buscas rápidas e eficientes
-- 4. Manter histórico de operações
-- 5. Sistema de alertas e monitoramento
-- 6. Integração com Obsidian para catalogação

-- Otimizações implementadas:
-- - Índices estratégicos para queries comuns
-- - Views para consultas frequentes
-- - Triggers para manter estatísticas atualizadas
-- - Procedures para manutenção
-- - Foreign keys com CASCADE para integridade

-- Uso de memória estimado:
-- - Servidor: ~1KB por registro
-- - Departamento: ~2KB por registro
-- - Arquivo: ~5KB por registro (com conteúdo indexado)
-- - Para 50.000 arquivos: ~250MB + índices (~100MB) = ~350MB total

-- Performance esperada:
-- - Inserção: ~1000 arquivos/segundo
-- - Busca por nome: <10ms
-- - Busca full-text: <50ms
-- - Estatísticas: <100ms

-- FIM DO SCHEMA
