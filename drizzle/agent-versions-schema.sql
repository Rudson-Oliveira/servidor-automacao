-- Schema para Sistema de Versionamento do Desktop Agent

-- Tabela de versões do agent
CREATE TABLE IF NOT EXISTS agent_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE COMMENT 'Versão semântica (ex: 1.2.3)',
  release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de lançamento',
  changelog TEXT COMMENT 'Descrição das mudanças',
  download_url VARCHAR(500) COMMENT 'URL de download do agent.py',
  installer_url VARCHAR(500) COMMENT 'URL de download do instalador',
  exe_url VARCHAR(500) COMMENT 'URL de download do .exe',
  file_hash VARCHAR(64) COMMENT 'SHA-256 hash para validação de integridade',
  file_size INT COMMENT 'Tamanho do arquivo em bytes',
  is_stable BOOLEAN DEFAULT TRUE COMMENT 'Se é versão estável ou beta',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Se está disponível para download',
  min_python_version VARCHAR(10) DEFAULT '3.11' COMMENT 'Versão mínima do Python',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_version (version),
  INDEX idx_release_date (release_date),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de plugins/módulos extensíveis
CREATE TABLE IF NOT EXISTS agent_plugins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Nome único do plugin',
  display_name VARCHAR(200) COMMENT 'Nome amigável',
  description TEXT COMMENT 'Descrição do que o plugin faz',
  version VARCHAR(20) NOT NULL COMMENT 'Versão do plugin',
  author VARCHAR(100) COMMENT 'Autor do plugin',
  plugin_code TEXT COMMENT 'Código Python do plugin',
  dependencies JSON COMMENT 'Dependências Python necessárias',
  command_types JSON COMMENT 'Tipos de comando que o plugin adiciona',
  is_enabled BOOLEAN DEFAULT TRUE COMMENT 'Se o plugin está ativo',
  install_count INT DEFAULT 0 COMMENT 'Quantos agents instalaram',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de telemetria dos agents
CREATE TABLE IF NOT EXISTS agent_telemetry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id VARCHAR(100) NOT NULL COMMENT 'ID do desktop agent',
  version VARCHAR(20) COMMENT 'Versão atual do agent',
  platform VARCHAR(50) COMMENT 'Sistema operacional',
  device_name VARCHAR(200) COMMENT 'Nome do dispositivo',
  cpu_usage DECIMAL(5,2) COMMENT 'Uso de CPU em %',
  memory_usage DECIMAL(5,2) COMMENT 'Uso de memória em %',
  uptime_seconds INT COMMENT 'Tempo ligado em segundos',
  last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Último ping',
  error_count INT DEFAULT 0 COMMENT 'Número de erros desde último boot',
  command_count INT DEFAULT 0 COMMENT 'Comandos executados desde último boot',
  plugins_installed JSON COMMENT 'Lista de plugins instalados',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agent_id (agent_id),
  INDEX idx_version (version),
  INDEX idx_last_heartbeat (last_heartbeat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de histórico de atualizações
CREATE TABLE IF NOT EXISTS agent_update_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id VARCHAR(100) NOT NULL COMMENT 'ID do desktop agent',
  from_version VARCHAR(20) COMMENT 'Versão anterior',
  to_version VARCHAR(20) NOT NULL COMMENT 'Versão atualizada',
  update_status ENUM('pending', 'downloading', 'installing', 'success', 'failed', 'rolled_back') DEFAULT 'pending',
  error_message TEXT COMMENT 'Mensagem de erro se falhou',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL COMMENT 'Quando a atualização terminou',
  INDEX idx_agent_id (agent_id),
  INDEX idx_status (update_status),
  INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir versão inicial
INSERT INTO agent_versions (version, changelog, is_stable, is_active) VALUES
('1.0.0', 'Versão inicial do Desktop Agent com suporte a comandos shell e screenshot', TRUE, TRUE);

-- Inserir plugins padrão
INSERT INTO agent_plugins (name, display_name, description, version, author, command_types, is_enabled) VALUES
('core_shell', 'Shell Commands', 'Executa comandos shell no sistema operacional', '1.0.0', 'Sistema', '["shell"]', TRUE),
('core_screenshot', 'Screenshot Capture', 'Captura screenshots da tela', '1.0.0', 'Sistema', '["screenshot"]', TRUE),
('core_file_ops', 'File Operations', 'Operações de arquivo (ler, escrever, copiar, mover)', '1.0.0', 'Sistema', '["read_file", "write_file", "copy_file", "move_file"]', TRUE);
