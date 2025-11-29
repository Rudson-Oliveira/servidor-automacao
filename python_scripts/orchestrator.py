#!/usr/bin/env python3
"""
Sistema de Orquestração Multi-IA - COMET Líder
Gerencia decisões de roteamento e escalação entre diferentes IAs
"""

import os
import json
import time
import uuid
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from enum import Enum
import mysql.connector
from mysql.connector import Error
import anthropic
from datetime import datetime
from audit_logger import get_audit_logger, AuditLevel, AuditCategory
from agents import get_agent_registry

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ProviderType(Enum):
    """Tipos de providers disponíveis"""
    ORCHESTRATOR = "orchestrator"
    REASONING = "reasoning"
    VISION = "vision"
    SEARCH = "search"
    GENERAL = "general"


class TaskStatus(Enum):
    """Status de execução de tarefas"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ESCALATED = "escalated"


class TriggerType(Enum):
    """Tipos de triggers para escalação"""
    CONFIDENCE_LOW = "confidence_low"
    ERROR = "error"
    COMPLEXITY_HIGH = "complexity_high"
    TIMEOUT = "timeout"
    MANUAL = "manual"


@dataclass
class AIProvider:
    """Representa um provider de IA"""
    id: int
    name: str
    display_name: str
    type: str
    api_endpoint: Optional[str]
    status: str
    priority: int
    cost_per_1k_input_tokens: float
    cost_per_1k_output_tokens: float
    max_context_tokens: int
    supports_streaming: bool
    supports_tools: bool
    capabilities: Dict


@dataclass
class TaskExecution:
    """Representa uma execução de tarefa"""
    task_id: str
    user_id: Optional[int]
    initial_provider_id: int
    current_provider_id: int
    escalation_count: int
    status: str
    task_type: Optional[str]
    complexity_score: Optional[float]
    input_text: str
    output_text: Optional[str]
    confidence_score: Optional[float]
    execution_time_ms: Optional[int]
    input_tokens: Optional[int]
    output_tokens: Optional[int]
    total_cost: Optional[float]
    error_message: Optional[str]
    metadata: Optional[Dict]


@dataclass
class EscalationRule:
    """Representa uma regra de escalação"""
    id: int
    rule_name: str
    description: Optional[str]
    from_provider_id: Optional[int]
    to_provider_id: int
    trigger_type: str
    trigger_threshold: Optional[float]
    priority: int
    active: bool
    conditions: Optional[Dict]


class DatabaseManager:
    """Gerencia conexões e operações com o banco de dados"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.connection = None
        self._parse_database_url()
    
    def _parse_database_url(self):
        """Parse DATABASE_URL para extrair credenciais"""
        # Formato: mysql://user:password@host:port/database
        import re
        pattern = r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)'
        match = re.match(pattern, self.database_url)
        if match:
            self.user, self.password, self.host, self.port, self.database = match.groups()
            self.port = int(self.port)
        else:
            raise ValueError("Invalid DATABASE_URL format")
    
    def connect(self):
        """Estabelece conexão com o banco"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database
            )
            logger.info("✅ Conexão com banco de dados estabelecida")
        except Error as e:
            logger.error(f"❌ Erro ao conectar ao banco: {e}")
            raise
    
    def disconnect(self):
        """Fecha conexão com o banco"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("Conexão com banco de dados fechada")
    
    def execute_query(self, query: str, params: tuple = None, fetch: bool = True):
        """Executa query no banco"""
        cursor = self.connection.cursor(dictionary=True)
        try:
            cursor.execute(query, params or ())
            if fetch:
                result = cursor.fetchall()
                return result
            else:
                self.connection.commit()
                return cursor.lastrowid
        except Error as e:
            logger.error(f"❌ Erro ao executar query: {e}")
            logger.error(f"Query: {query}")
            logger.error(f"Params: {params}")
            raise
        finally:
            cursor.close()
    
    def get_provider_by_name(self, name: str) -> Optional[AIProvider]:
        """Busca provider por nome"""
        query = "SELECT * FROM ai_providers WHERE name = %s AND status = 'active'"
        result = self.execute_query(query, (name,))
        if result:
            row = result[0]
            return AIProvider(
                id=row['id'],
                name=row['name'],
                display_name=row['display_name'],
                type=row['type'],
                api_endpoint=row['api_endpoint'],
                status=row['status'],
                priority=row['priority'],
                cost_per_1k_input_tokens=float(row['cost_per_1k_input_tokens']),
                cost_per_1k_output_tokens=float(row['cost_per_1k_output_tokens']),
                max_context_tokens=row['max_context_tokens'],
                supports_streaming=bool(row['supports_streaming']),
                supports_tools=bool(row['supports_tools']),
                capabilities=json.loads(row['capabilities']) if row['capabilities'] else {}
            )
        return None
    
    def get_escalation_rules(self, from_provider_id: int, trigger_type: str) -> List[EscalationRule]:
        """Busca regras de escalação aplicáveis"""
        query = """
            SELECT * FROM ai_escalation_rules 
            WHERE (from_provider_id = %s OR from_provider_id IS NULL)
            AND trigger_type = %s 
            AND active = TRUE
            ORDER BY priority DESC
        """
        results = self.execute_query(query, (from_provider_id, trigger_type))
        rules = []
        for row in results:
            rules.append(EscalationRule(
                id=row['id'],
                rule_name=row['rule_name'],
                description=row['description'],
                from_provider_id=row['from_provider_id'],
                to_provider_id=row['to_provider_id'],
                trigger_type=row['trigger_type'],
                trigger_threshold=float(row['trigger_threshold']) if row['trigger_threshold'] else None,
                priority=row['priority'],
                active=bool(row['active']),
                conditions=json.loads(row['conditions']) if row['conditions'] else {}
            ))
        return rules
    
    def create_task_execution(self, task: TaskExecution) -> int:
        """Cria nova execução de tarefa"""
        query = """
            INSERT INTO ai_task_executions 
            (task_id, user_id, initial_provider_id, current_provider_id, escalation_count,
             status, task_type, complexity_score, input_text, metadata, started_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            task.task_id, task.user_id, task.initial_provider_id, task.current_provider_id,
            task.escalation_count, task.status, task.task_type, task.complexity_score,
            task.input_text, json.dumps(task.metadata) if task.metadata else None,
            datetime.now()
        )
        return self.execute_query(query, params, fetch=False)
    
    def update_task_execution(self, task_id: str, updates: Dict):
        """Atualiza execução de tarefa"""
        set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
        query = f"UPDATE ai_task_executions SET {set_clause} WHERE task_id = %s"
        params = tuple(updates.values()) + (task_id,)
        self.execute_query(query, params, fetch=False)
    
    def log_escalation(self, task_execution_id: int, from_provider_id: int, 
                       to_provider_id: int, rule_id: Optional[int], reason: str,
                       previous_confidence: Optional[float], previous_output: Optional[str]):
        """Registra escalação no histórico"""
        query = """
            INSERT INTO ai_escalation_history
            (task_execution_id, from_provider_id, to_provider_id, rule_id, reason,
             previous_confidence, previous_output)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = (task_execution_id, from_provider_id, to_provider_id, rule_id,
                  reason, previous_confidence, previous_output)
        self.execute_query(query, params, fetch=False)


class ComplexityAnalyzer:
    """Analisa complexidade de tarefas"""
    
    @staticmethod
    def analyze(input_text: str, context: Optional[Dict] = None) -> Tuple[float, str]:
        """
        Analisa complexidade da tarefa
        Retorna: (score 0-100, task_type)
        """
        text_lower = input_text.lower()
        
        # Detectar tipo de tarefa
        task_type = "general"
        complexity = 30.0  # Base
        
        # Tarefas visuais/websites
        if any(word in text_lower for word in ['site', 'website', 'clonar', 'interface', 'visual', 'frontend']):
            task_type = "visual_analysis"
            complexity = 85.0
        
        # Código complexo
        elif any(word in text_lower for word in ['refatorar', 'otimizar', 'arquitetura', 'design pattern']):
            task_type = "code_complex"
            complexity = 80.0
        
        # Análise profunda
        elif any(word in text_lower for word in ['analisar profundamente', 'análise detalhada', 'investigar']):
            task_type = "analysis_deep"
            complexity = 75.0
        
        # Raciocínio avançado
        elif any(word in text_lower for word in ['resolver', 'calcular', 'provar', 'demonstrar', 'deduzir']):
            task_type = "reasoning_advanced"
            complexity = 70.0
        
        # Código simples
        elif any(word in text_lower for word in ['código', 'script', 'função', 'implementar']):
            task_type = "code_simple"
            complexity = 50.0
        
        # Busca de arquivos
        elif any(word in text_lower for word in ['buscar', 'encontrar', 'localizar', 'arquivo']):
            task_type = "file_search"
            complexity = 20.0
        
        # Chat/conversa
        elif any(word in text_lower for word in ['oi', 'olá', 'como', 'o que', 'explique']):
            task_type = "chat"
            complexity = 15.0
        
        # Ajustar por tamanho do texto
        if len(input_text) > 1000:
            complexity += 10
        elif len(input_text) > 2000:
            complexity += 20
        
        # Limitar entre 0-100
        complexity = max(0, min(100, complexity))
        
        logger.info(f"📊 Complexidade analisada: {complexity:.1f} | Tipo: {task_type}")
        return complexity, task_type


class ClaudeClient:
    """Cliente para API do Claude"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("⚠️ ANTHROPIC_API_KEY não configurada")
    
    def generate(self, prompt: str, model: str = "claude-3-5-haiku-20241022", 
                 max_tokens: int = 4096) -> Tuple[str, int, int]:
        """
        Gera resposta usando Claude
        Retorna: (resposta, input_tokens, output_tokens)
        """
        if not self.client:
            raise ValueError("Claude API não configurada")
        
        try:
            message = self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            response_text = message.content[0].text
            input_tokens = message.usage.input_tokens
            output_tokens = message.usage.output_tokens
            
            logger.info(f"✅ Claude respondeu: {input_tokens} in, {output_tokens} out tokens")
            return response_text, input_tokens, output_tokens
            
        except Exception as e:
            logger.error(f"❌ Erro ao chamar Claude: {e}")
            raise


class AIOrchestrator:
    """Orquestrador principal do sistema multi-IA"""
    
    def __init__(self, database_url: str):
        self.db = DatabaseManager(database_url)
        self.db.connect()
        self.claude_client = ClaudeClient()
        self.complexity_analyzer = ComplexityAnalyzer()
        self.audit_logger = get_audit_logger(database_url)
        self.agent_registry = get_agent_registry()
    
    def __del__(self):
        """Cleanup ao destruir objeto"""
        if hasattr(self, 'db'):
            self.db.disconnect()
    
    def process_task(self, input_text: str, user_id: Optional[int] = None,
                     context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Processa tarefa com orquestração inteligente
        
        Args:
            input_text: Texto da tarefa
            user_id: ID do usuário (opcional)
            context: Contexto adicional (opcional)
        
        Returns:
            Dict com resultado da execução
        """
        task_id = str(uuid.uuid4())
        start_time = time.time()
        
        logger.info(f"🚀 Iniciando processamento da tarefa {task_id}")
        logger.info(f"📝 Input: {input_text[:100]}...")
        
        # 1. Analisar complexidade
        complexity, task_type = self.complexity_analyzer.analyze(input_text, context)
        
        # Log de auditoria: submissão
        self.audit_logger.log_task_submission(
            task_id, user_id, input_text, complexity, task_type
        )
        
        # 2. Selecionar provider inicial
        initial_provider = self._select_initial_provider(complexity, task_type)
        
        # Log de auditoria: seleção de provider
        self.audit_logger.log_provider_selection(
            task_id, initial_provider.id, initial_provider.display_name,
            f"Complexidade: {complexity:.1f}, Tipo: {task_type}"
        )
        
        # 3. Criar registro de execução
        task = TaskExecution(
            task_id=task_id,
            user_id=user_id,
            initial_provider_id=initial_provider.id,
            current_provider_id=initial_provider.id,
            escalation_count=0,
            status=TaskStatus.PROCESSING.value,
            task_type=task_type,
            complexity_score=complexity,
            input_text=input_text,
            output_text=None,
            confidence_score=None,
            execution_time_ms=None,
            input_tokens=None,
            output_tokens=None,
            total_cost=None,
            error_message=None,
            metadata=context
        )
        
        execution_id = self.db.create_task_execution(task)
        
        # 4. Executar com provider selecionado
        try:
            result = self._execute_with_provider(initial_provider, input_text, task_id)
            
            # 5. Avaliar resultado
            confidence = self._evaluate_confidence(result, complexity)
            
            # 6. Decidir se escala
            if confidence < 70 and task.escalation_count < 3:
                logger.warning(f"⚠️ Confiança baixa ({confidence:.1f}), escalando...")
                result = self._escalate_task(task, initial_provider, result, confidence, TriggerType.CONFIDENCE_LOW)
            
            # 7. Calcular métricas finais
            execution_time = int((time.time() - start_time) * 1000)
            total_cost = self._calculate_cost(initial_provider, result.get('input_tokens', 0), 
                                              result.get('output_tokens', 0))
            
            # 8. Atualizar banco
            self.db.update_task_execution(task_id, {
                'status': TaskStatus.COMPLETED.value,
                'output_text': result['output'],
                'confidence_score': confidence,
                'execution_time_ms': execution_time,
                'input_tokens': result.get('input_tokens', 0),
                'output_tokens': result.get('output_tokens', 0),
                'total_cost': total_cost,
                'completed_at': datetime.now()
            })
            
            logger.info(f"✅ Tarefa {task_id} concluída com sucesso!")
            
            return {
                'success': True,
                'task_id': task_id,
                'output': result['output'],
                'provider': initial_provider.display_name,
                'confidence': confidence,
                'execution_time_ms': execution_time,
                'cost': total_cost,
                'escalated': task.escalation_count > 0
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao processar tarefa {task_id}: {e}")
            
            # Tentar escalar em caso de erro
            if task.escalation_count < 3:
                try:
                    result = self._escalate_task(task, initial_provider, None, None, TriggerType.ERROR)
                    execution_time = int((time.time() - start_time) * 1000)
                    
                    self.db.update_task_execution(task_id, {
                        'status': TaskStatus.COMPLETED.value,
                        'output_text': result['output'],
                        'execution_time_ms': execution_time,
                        'completed_at': datetime.now()
                    })
                    
                    return {
                        'success': True,
                        'task_id': task_id,
                        'output': result['output'],
                        'provider': result.get('provider', 'Unknown'),
                        'escalated': True,
                        'recovered_from_error': True
                    }
                except Exception as escalation_error:
                    logger.error(f"❌ Falha na escalação: {escalation_error}")
            
            # Registrar falha
            self.db.update_task_execution(task_id, {
                'status': TaskStatus.FAILED.value,
                'error_message': str(e),
                'completed_at': datetime.now()
            })
            
            return {
                'success': False,
                'task_id': task_id,
                'error': str(e),
                'provider': initial_provider.display_name
            }
    
    def _select_initial_provider(self, complexity: float, task_type: str) -> AIProvider:
        """Seleciona provider inicial baseado em complexidade e tipo"""
        
        # Tarefas visuais → Comet Vision
        if task_type in ['visual_analysis', 'website_clone', 'frontend_validation']:
            provider = self.db.get_provider_by_name('comet_vision')
            if provider:
                logger.info(f"🎯 Selecionado: {provider.display_name} (tarefa visual)")
                return provider
        
        # Alta complexidade → Claude Sonnet
        if complexity >= 80:
            provider = self.db.get_provider_by_name('claude_sonnet')
            if provider and provider.api_endpoint:
                logger.info(f"🎯 Selecionado: {provider.display_name} (alta complexidade)")
                return provider
        
        # Complexidade média → Claude Haiku
        if complexity >= 60:
            provider = self.db.get_provider_by_name('claude_haiku')
            if provider and provider.api_endpoint:
                logger.info(f"🎯 Selecionado: {provider.display_name} (complexidade média)")
                return provider
        
        # Padrão → COMET/Manus LLM
        provider = self.db.get_provider_by_name('comet')
        if not provider:
            provider = self.db.get_provider_by_name('manus_llm')
        
        logger.info(f"🎯 Selecionado: {provider.display_name} (padrão)")
        return provider
    
    def _execute_with_provider(self, provider: AIProvider, input_text: str, 
                                task_id: str) -> Dict[str, Any]:
        """Executa tarefa com provider específico"""
        
        logger.info(f"⚙️ Executando com {provider.display_name}...")
        
        # Claude API
        if provider.name.startswith('claude_'):
            model_map = {
                'claude_haiku': 'claude-3-5-haiku-20241022',
                'claude_sonnet': 'claude-3-5-sonnet-20241022',
                'claude_opus': 'claude-opus-4-20250514'
            }
            model = model_map.get(provider.name, 'claude-3-5-haiku-20241022')
            
            output, input_tokens, output_tokens = self.claude_client.generate(
                input_text, model=model
            )
            
            return {
                'output': output,
                'input_tokens': input_tokens,
                'output_tokens': output_tokens,
                'provider': provider.display_name
            }
        
        # Manus LLM / COMET (usar API interna)
        elif provider.name in ['manus_llm', 'comet']:
            # Aqui você integraria com a API interna do Manus
            # Por enquanto, simulação
            return {
                'output': f"[Simulação {provider.display_name}] Processando: {input_text[:50]}...",
                'input_tokens': len(input_text) // 4,
                'output_tokens': 100,
                'provider': provider.display_name
            }
        
        # Comet Vision
        elif provider.name == 'comet_vision':
            # Integrar com endpoints existentes
            return {
                'output': f"[Comet Vision] Análise visual iniciada para: {input_text[:50]}...",
                'input_tokens': 0,
                'output_tokens': 0,
                'provider': provider.display_name
            }
        
        else:
            raise ValueError(f"Provider não suportado: {provider.name}")
    
    def _evaluate_confidence(self, result: Dict, complexity: float) -> float:
        """Avalia confiança do resultado"""
        
        output = result.get('output', '')
        
        # Base de confiança
        confidence = 80.0
        
        # Penalizar respostas muito curtas
        if len(output) < 50:
            confidence -= 20
        
        # Penalizar se contém palavras de incerteza
        uncertainty_words = ['talvez', 'não tenho certeza', 'não sei', 'possivelmente']
        if any(word in output.lower() for word in uncertainty_words):
            confidence -= 15
        
        # Ajustar por complexidade
        if complexity > 70:
            confidence -= 10
        
        # Limitar entre 0-100
        confidence = max(0, min(100, confidence))
        
        logger.info(f"📊 Confiança avaliada: {confidence:.1f}")
        return confidence
    
    def _escalate_task(self, task: TaskExecution, current_provider: AIProvider,
                       previous_result: Optional[Dict], previous_confidence: Optional[float],
                       trigger_type: TriggerType) -> Dict[str, Any]:
        """Escala tarefa para provider mais capaz"""
        
        logger.warning(f"⬆️ Escalando tarefa {task.task_id} (trigger: {trigger_type.value})")
        
        # Buscar regras de escalação
        rules = self.db.get_escalation_rules(current_provider.id, trigger_type.value)
        
        if not rules:
            logger.error("❌ Nenhuma regra de escalação encontrada")
            raise ValueError("Não foi possível escalar a tarefa")
        
        # Selecionar melhor regra
        best_rule = rules[0]
        target_provider = self.db.get_provider_by_name(
            self._get_provider_name_by_id(best_rule.to_provider_id)
        )
        
        if not target_provider:
            raise ValueError(f"Provider de escalação não encontrado: {best_rule.to_provider_id}")
        
        logger.info(f"🎯 Escalando para: {target_provider.display_name}")
        
        # Registrar escalação
        execution_id = self.db.execute_query(
            "SELECT id FROM ai_task_executions WHERE task_id = %s",
            (task.task_id,)
        )[0]['id']
        
        self.db.log_escalation(
            execution_id,
            current_provider.id,
            target_provider.id,
            best_rule.id,
            f"Escalação automática: {trigger_type.value}",
            previous_confidence,
            previous_result.get('output') if previous_result else None
        )
        
        # Atualizar task
        task.escalation_count += 1
        task.current_provider_id = target_provider.id
        self.db.update_task_execution(task.task_id, {
            'current_provider_id': target_provider.id,
            'escalation_count': task.escalation_count,
            'status': TaskStatus.ESCALATED.value
        })
        
        # Executar com novo provider
        result = self._execute_with_provider(target_provider, task.input_text, task.task_id)
        result['escalated_from'] = current_provider.display_name
        result['escalated_to'] = target_provider.display_name
        
        return result
    
    def _get_provider_name_by_id(self, provider_id: int) -> str:
        """Busca nome do provider por ID"""
        result = self.db.execute_query(
            "SELECT name FROM ai_providers WHERE id = %s",
            (provider_id,)
        )
        return result[0]['name'] if result else None
    
    def _calculate_cost(self, provider: AIProvider, input_tokens: int, 
                        output_tokens: int) -> float:
        """Calcula custo da execução"""
        input_cost = (input_tokens / 1000) * provider.cost_per_1k_input_tokens
        output_cost = (output_tokens / 1000) * provider.cost_per_1k_output_tokens
        return round(input_cost + output_cost, 4)


def main():
    """Função principal para testes"""
    import sys
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL não configurada")
        sys.exit(1)
    
    orchestrator = AIOrchestrator(database_url)
    
    # Teste simples
    result = orchestrator.process_task(
        "Olá, como você está?",
        user_id=1
    )
    
    print("\n" + "="*60)
    print("RESULTADO:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print("="*60)


if __name__ == "__main__":
    main()
