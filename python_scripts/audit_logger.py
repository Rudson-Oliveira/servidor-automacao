#!/usr/bin/env python3
"""
Sistema de Auditoria e Logging para Orquestração Multi-IA
Registra todas as ações, decisões e resultados do sistema
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum
import mysql.connector
from mysql.connector import Error


class AuditLevel(Enum):
    """Níveis de auditoria"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AuditCategory(Enum):
    """Categorias de eventos de auditoria"""
    TASK_SUBMISSION = "task_submission"
    TASK_EXECUTION = "task_execution"
    TASK_COMPLETION = "task_completion"
    ESCALATION = "escalation"
    PROVIDER_SELECTION = "provider_selection"
    CONFIDENCE_EVALUATION = "confidence_evaluation"
    ERROR = "error"
    COST_CALCULATION = "cost_calculation"
    PERFORMANCE = "performance"
    SECURITY = "security"


class AuditLogger:
    """Logger de auditoria com persistência em banco de dados"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.connection = None
        self._parse_database_url()
        self._setup_logger()
        self._ensure_audit_table()
    
    def _parse_database_url(self):
        """Parse DATABASE_URL"""
        import re
        pattern = r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)'
        match = re.match(pattern, self.database_url)
        if match:
            self.user, self.password, self.host, self.port, self.database = match.groups()
            self.port = int(self.port)
        else:
            raise ValueError("Invalid DATABASE_URL format")
    
    def _setup_logger(self):
        """Configura logger Python padrão"""
        self.logger = logging.getLogger('AuditLogger')
        self.logger.setLevel(logging.DEBUG)
        
        # Handler para arquivo
        fh = logging.FileHandler('/tmp/orchestrator_audit.log')
        fh.setLevel(logging.DEBUG)
        
        # Handler para console
        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        
        # Formato
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        fh.setFormatter(formatter)
        ch.setFormatter(formatter)
        
        self.logger.addHandler(fh)
        self.logger.addHandler(ch)
    
    def _ensure_audit_table(self):
        """Garante que tabela de auditoria existe"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database
            )
            
            cursor = self.connection.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ai_audit_logs (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    level VARCHAR(20) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    task_id VARCHAR(100),
                    user_id INT,
                    provider_id INT,
                    action VARCHAR(255) NOT NULL,
                    details JSON,
                    metadata JSON,
                    INDEX idx_task_id (task_id),
                    INDEX idx_timestamp (timestamp),
                    INDEX idx_category (category),
                    INDEX idx_level (level)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            self.connection.commit()
            cursor.close()
            
            self.logger.info("✅ Tabela de auditoria verificada/criada")
            
        except Error as e:
            self.logger.error(f"❌ Erro ao criar tabela de auditoria: {e}")
    
    def log(self, level: AuditLevel, category: AuditCategory, action: str,
            task_id: Optional[str] = None, user_id: Optional[int] = None,
            provider_id: Optional[int] = None, details: Optional[Dict] = None,
            metadata: Optional[Dict] = None):
        """
        Registra evento de auditoria
        
        Args:
            level: Nível de severidade
            category: Categoria do evento
            action: Descrição da ação
            task_id: ID da tarefa (opcional)
            user_id: ID do usuário (opcional)
            provider_id: ID do provider (opcional)
            details: Detalhes adicionais (opcional)
            metadata: Metadados (opcional)
        """
        # Log no arquivo/console
        log_msg = f"[{category.value.upper()}] {action}"
        if task_id:
            log_msg += f" | Task: {task_id}"
        
        if level == AuditLevel.DEBUG:
            self.logger.debug(log_msg)
        elif level == AuditLevel.INFO:
            self.logger.info(log_msg)
        elif level == AuditLevel.WARNING:
            self.logger.warning(log_msg)
        elif level == AuditLevel.ERROR:
            self.logger.error(log_msg)
        elif level == AuditLevel.CRITICAL:
            self.logger.critical(log_msg)
        
        # Persistir no banco
        try:
            if not self.connection or not self.connection.is_connected():
                self.connection = mysql.connector.connect(
                    host=self.host,
                    port=self.port,
                    user=self.user,
                    password=self.password,
                    database=self.database
                )
            
            cursor = self.connection.cursor()
            query = """
                INSERT INTO ai_audit_logs 
                (level, category, task_id, user_id, provider_id, action, details, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                level.value,
                category.value,
                task_id,
                user_id,
                provider_id,
                action,
                json.dumps(details) if details else None,
                json.dumps(metadata) if metadata else None
            )
            cursor.execute(query, params)
            self.connection.commit()
            cursor.close()
            
        except Error as e:
            self.logger.error(f"❌ Erro ao persistir log de auditoria: {e}")
    
    def log_task_submission(self, task_id: str, user_id: Optional[int],
                            input_text: str, complexity: float, task_type: str):
        """Log de submissão de tarefa"""
        self.log(
            AuditLevel.INFO,
            AuditCategory.TASK_SUBMISSION,
            f"Tarefa submetida: {task_type}",
            task_id=task_id,
            user_id=user_id,
            details={
                'input_length': len(input_text),
                'complexity': complexity,
                'task_type': task_type
            }
        )
    
    def log_provider_selection(self, task_id: str, provider_id: int,
                                provider_name: str, reason: str):
        """Log de seleção de provider"""
        self.log(
            AuditLevel.INFO,
            AuditCategory.PROVIDER_SELECTION,
            f"Provider selecionado: {provider_name}",
            task_id=task_id,
            provider_id=provider_id,
            details={'reason': reason}
        )
    
    def log_task_execution(self, task_id: str, provider_id: int,
                           execution_time_ms: int, tokens_used: Dict):
        """Log de execução de tarefa"""
        self.log(
            AuditLevel.INFO,
            AuditCategory.TASK_EXECUTION,
            f"Tarefa executada em {execution_time_ms}ms",
            task_id=task_id,
            provider_id=provider_id,
            details={
                'execution_time_ms': execution_time_ms,
                'input_tokens': tokens_used.get('input', 0),
                'output_tokens': tokens_used.get('output', 0)
            }
        )
    
    def log_confidence_evaluation(self, task_id: str, confidence: float,
                                   factors: Dict):
        """Log de avaliação de confiança"""
        self.log(
            AuditLevel.INFO,
            AuditCategory.CONFIDENCE_EVALUATION,
            f"Confiança avaliada: {confidence:.1f}%",
            task_id=task_id,
            details={
                'confidence': confidence,
                'factors': factors
            }
        )
    
    def log_escalation(self, task_id: str, from_provider_id: int,
                       to_provider_id: int, reason: str, trigger: str):
        """Log de escalação"""
        self.log(
            AuditLevel.WARNING,
            AuditCategory.ESCALATION,
            f"Tarefa escalada: {reason}",
            task_id=task_id,
            provider_id=to_provider_id,
            details={
                'from_provider_id': from_provider_id,
                'to_provider_id': to_provider_id,
                'trigger': trigger,
                'reason': reason
            }
        )
    
    def log_task_completion(self, task_id: str, status: str,
                            total_time_ms: int, total_cost: float):
        """Log de conclusão de tarefa"""
        self.log(
            AuditLevel.INFO,
            AuditCategory.TASK_COMPLETION,
            f"Tarefa concluída: {status}",
            task_id=task_id,
            details={
                'status': status,
                'total_time_ms': total_time_ms,
                'total_cost': total_cost
            }
        )
    
    def log_error(self, task_id: Optional[str], error_type: str,
                  error_message: str, stack_trace: Optional[str] = None):
        """Log de erro"""
        self.log(
            AuditLevel.ERROR,
            AuditCategory.ERROR,
            f"Erro: {error_type}",
            task_id=task_id,
            details={
                'error_type': error_type,
                'error_message': error_message,
                'stack_trace': stack_trace
            }
        )
    
    def log_cost_calculation(self, task_id: str, provider_id: int,
                             input_tokens: int, output_tokens: int, cost: float):
        """Log de cálculo de custo"""
        self.log(
            AuditLevel.DEBUG,
            AuditCategory.COST_CALCULATION,
            f"Custo calculado: ${cost:.4f}",
            task_id=task_id,
            provider_id=provider_id,
            details={
                'input_tokens': input_tokens,
                'output_tokens': output_tokens,
                'cost': cost
            }
        )
    
    def log_performance(self, task_id: str, metric_name: str, value: Any):
        """Log de métrica de performance"""
        self.log(
            AuditLevel.DEBUG,
            AuditCategory.PERFORMANCE,
            f"Métrica: {metric_name} = {value}",
            task_id=task_id,
            details={
                'metric_name': metric_name,
                'value': value
            }
        )
    
    def get_task_audit_trail(self, task_id: str) -> list:
        """Busca trilha de auditoria completa de uma tarefa"""
        try:
            if not self.connection or not self.connection.is_connected():
                self.connection = mysql.connector.connect(
                    host=self.host,
                    port=self.port,
                    user=self.user,
                    password=self.password,
                    database=self.database
                )
            
            cursor = self.connection.cursor(dictionary=True)
            query = """
                SELECT * FROM ai_audit_logs 
                WHERE task_id = %s 
                ORDER BY timestamp ASC
            """
            cursor.execute(query, (task_id,))
            results = cursor.fetchall()
            cursor.close()
            
            # Parse JSON fields
            for row in results:
                if row.get('details'):
                    row['details'] = json.loads(row['details'])
                if row.get('metadata'):
                    row['metadata'] = json.loads(row['metadata'])
            
            return results
            
        except Error as e:
            self.logger.error(f"❌ Erro ao buscar trilha de auditoria: {e}")
            return []
    
    def get_statistics(self, days: int = 7) -> Dict:
        """Busca estatísticas de auditoria"""
        try:
            if not self.connection or not self.connection.is_connected():
                self.connection = mysql.connector.connect(
                    host=self.host,
                    port=self.port,
                    user=self.user,
                    password=self.password,
                    database=self.database
                )
            
            cursor = self.connection.cursor(dictionary=True)
            
            # Total de eventos por categoria
            query = """
                SELECT category, COUNT(*) as count
                FROM ai_audit_logs
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
                GROUP BY category
            """
            cursor.execute(query, (days,))
            by_category = cursor.fetchall()
            
            # Total de eventos por nível
            query = """
                SELECT level, COUNT(*) as count
                FROM ai_audit_logs
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
                GROUP BY level
            """
            cursor.execute(query, (days,))
            by_level = cursor.fetchall()
            
            # Escalações
            query = """
                SELECT COUNT(*) as count
                FROM ai_audit_logs
                WHERE category = 'escalation'
                AND timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
            """
            cursor.execute(query, (days,))
            escalations = cursor.fetchone()['count']
            
            # Erros
            query = """
                SELECT COUNT(*) as count
                FROM ai_audit_logs
                WHERE level IN ('error', 'critical')
                AND timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
            """
            cursor.execute(query, (days,))
            errors = cursor.fetchone()['count']
            
            cursor.close()
            
            return {
                'by_category': by_category,
                'by_level': by_level,
                'total_escalations': escalations,
                'total_errors': errors,
                'period_days': days
            }
            
        except Error as e:
            self.logger.error(f"❌ Erro ao buscar estatísticas: {e}")
            return {}
    
    def close(self):
        """Fecha conexão com banco"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            self.logger.info("Conexão de auditoria fechada")


# Singleton global
_audit_logger_instance = None

def get_audit_logger(database_url: Optional[str] = None) -> AuditLogger:
    """Retorna instância singleton do audit logger"""
    global _audit_logger_instance
    
    if _audit_logger_instance is None:
        if not database_url:
            database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL não configurada")
        _audit_logger_instance = AuditLogger(database_url)
    
    return _audit_logger_instance


if __name__ == "__main__":
    # Teste
    logger = get_audit_logger()
    
    logger.log_task_submission(
        task_id="test-123",
        user_id=1,
        input_text="Teste de auditoria",
        complexity=50.0,
        task_type="test"
    )
    
    logger.log_provider_selection(
        task_id="test-123",
        provider_id=1,
        provider_name="COMET",
        reason="Complexidade baixa"
    )
    
    print("\n📊 Estatísticas:")
    stats = logger.get_statistics(days=7)
    print(json.dumps(stats, indent=2, ensure_ascii=False))
    
    print("\n📋 Trilha de auditoria:")
    trail = logger.get_task_audit_trail("test-123")
    for event in trail:
        print(f"  [{event['timestamp']}] {event['category']}: {event['action']}")
    
    logger.close()
