-- Tabela de IAs disponíveis (providers)
CREATE TABLE IF NOT EXISTS ai_providers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  type ENUM('orchestrator', 'reasoning', 'vision', 'search', 'general') NOT NULL,
  api_endpoint VARCHAR(255),
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  priority INT DEFAULT 0,
  cost_per_1k_input_tokens DECIMAL(10,4) DEFAULT 0,
  cost_per_1k_output_tokens DECIMAL(10,4) DEFAULT 0,
  max_context_tokens INT DEFAULT 4096,
  supports_streaming BOOLEAN DEFAULT FALSE,
  supports_tools BOOLEAN DEFAULT FALSE,
  capabilities JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de execuções de tarefas
CREATE TABLE IF NOT EXISTS ai_task_executions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id VARCHAR(100) NOT NULL UNIQUE,
  user_id INT,
  initial_provider_id INT NOT NULL,
  current_provider_id INT NOT NULL,
  escalation_count INT DEFAULT 0,
  status ENUM('pending', 'processing', 'completed', 'failed', 'escalated') DEFAULT 'pending',
  task_type VARCHAR(50),
  complexity_score DECIMAL(5,2),
  input_text TEXT,
  output_text TEXT,
  confidence_score DECIMAL(5,2),
  execution_time_ms INT,
  input_tokens INT,
  output_tokens INT,
  total_cost DECIMAL(10,4),
  error_message TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (initial_provider_id) REFERENCES ai_providers(id),
  FOREIGN KEY (current_provider_id) REFERENCES ai_providers(id),
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de regras de escalação
CREATE TABLE IF NOT EXISTS ai_escalation_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rule_name VARCHAR(100) NOT NULL,
  description TEXT,
  from_provider_id INT,
  to_provider_id INT NOT NULL,
  trigger_type ENUM('confidence_low', 'error', 'complexity_high', 'timeout', 'manual') NOT NULL,
  trigger_threshold DECIMAL(5,2),
  priority INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  conditions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (from_provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE,
  FOREIGN KEY (to_provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE,
  INDEX idx_active (active),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de histórico de escalações
CREATE TABLE IF NOT EXISTS ai_escalation_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_execution_id INT NOT NULL,
  from_provider_id INT NOT NULL,
  to_provider_id INT NOT NULL,
  rule_id INT,
  reason TEXT,
  previous_confidence DECIMAL(5,2),
  previous_output TEXT,
  escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_execution_id) REFERENCES ai_task_executions(id) ON DELETE CASCADE,
  FOREIGN KEY (from_provider_id) REFERENCES ai_providers(id),
  FOREIGN KEY (to_provider_id) REFERENCES ai_providers(id),
  FOREIGN KEY (rule_id) REFERENCES ai_escalation_rules(id) ON DELETE SET NULL,
  INDEX idx_task_execution_id (task_execution_id),
  INDEX idx_escalated_at (escalated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de métricas de performance por provider
CREATE TABLE IF NOT EXISTS ai_provider_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provider_id INT NOT NULL,
  date DATE NOT NULL,
  total_requests INT DEFAULT 0,
  successful_requests INT DEFAULT 0,
  failed_requests INT DEFAULT 0,
  escalated_requests INT DEFAULT 0,
  avg_confidence_score DECIMAL(5,2),
  avg_execution_time_ms INT,
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  total_cost DECIMAL(10,2),
  FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider_date (provider_id, date),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir providers iniciais
INSERT INTO ai_providers (name, display_name, type, status, priority, cost_per_1k_input_tokens, cost_per_1k_output_tokens, max_context_tokens, supports_streaming, supports_tools, capabilities) VALUES
('comet', 'COMET (Orquestrador)', 'orchestrator', 'active', 100, 0, 0, 128000, true, true, '{"skills": true, "file_search": true, "automation": true}'),
('manus_llm', 'Manus LLM (Built-in)', 'general', 'active', 90, 0, 0, 128000, true, true, '{"chat": true, "code_generation": true, "analysis": true}'),
('claude_haiku', 'Claude Haiku', 'reasoning', 'active', 70, 0.25, 1.25, 200000, true, true, '{"fast": true, "efficient": true, "tools": true}'),
('claude_sonnet', 'Claude Sonnet 4.5', 'reasoning', 'active', 80, 3.00, 15.00, 200000, true, true, '{"balanced": true, "advanced_reasoning": true, "tools": true, "vision": true}'),
('claude_opus', 'Claude Opus 4.1', 'reasoning', 'active', 85, 15.00, 75.00, 200000, true, true, '{"maximum_capability": true, "complex_reasoning": true, "tools": true, "vision": true}'),
('comet_vision', 'Comet Vision Analyzer', 'vision', 'active', 95, 0, 0, 32000, false, false, '{"website_cloning": true, "visual_analysis": true, "code_validation": true}');

-- Inserir regras de escalação iniciais
INSERT INTO ai_escalation_rules (rule_name, description, from_provider_id, to_provider_id, trigger_type, trigger_threshold, priority, conditions) VALUES
('Baixa Confiança COMET → Claude Haiku', 'Escala para Claude Haiku quando COMET tem baixa confiança', 1, 3, 'confidence_low', 70.00, 10, '{"min_attempts": 1}'),
('Erro COMET → Claude Haiku', 'Escala para Claude Haiku após erro do COMET', 1, 3, 'error', NULL, 20, '{"error_types": ["timeout", "invalid_response"]}'),
('Alta Complexidade → Claude Sonnet', 'Escala diretamente para Claude Sonnet em tarefas complexas', 1, 4, 'complexity_high', 80.00, 30, '{"task_types": ["code_complex", "analysis_deep", "reasoning_advanced"]}'),
('Baixa Confiança Haiku → Sonnet', 'Escala de Haiku para Sonnet quando necessário', 3, 4, 'confidence_low', 60.00, 15, '{"min_attempts": 1}'),
('Tarefa Visual → Comet Vision', 'Escala para Comet Vision em tarefas visuais', 1, 6, 'complexity_high', NULL, 50, '{"task_types": ["website_clone", "visual_analysis", "frontend_validation"]}'),
('Máxima Complexidade → Opus', 'Último recurso: Claude Opus para tarefas extremamente complexas', 4, 5, 'confidence_low', 50.00, 5, '{"min_attempts": 2, "critical": true}');

-- Criar índices adicionais para performance
CREATE INDEX idx_provider_status ON ai_providers(status, priority);
CREATE INDEX idx_task_provider_status ON ai_task_executions(current_provider_id, status);
CREATE INDEX idx_escalation_reason ON ai_escalation_history(reason(100));
