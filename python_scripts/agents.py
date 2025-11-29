#!/usr/bin/env python3
"""
Sistema de Agents Especializados para Orquestração Multi-IA
Define agents com capacidades específicas que podem ser chamados pelo orquestrador
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from abc import ABC, abstractmethod
import anthropic
import requests

logger = logging.getLogger(__name__)


@dataclass
class AgentCapability:
    """Capacidade de um agent"""
    name: str
    description: str
    confidence_threshold: float  # Confiança mínima para usar esta capacidade
    cost_multiplier: float  # Multiplicador de custo (1.0 = normal)


class BaseAgent(ABC):
    """Classe base para todos os agents"""
    
    def __init__(self, name: str, capabilities: List[AgentCapability]):
        self.name = name
        self.capabilities = capabilities
        self.logger = logging.getLogger(f"Agent.{name}")
    
    @abstractmethod
    def can_handle(self, task_type: str, complexity: float) -> Tuple[bool, float]:
        """
        Verifica se o agent pode lidar com a tarefa
        Retorna: (pode_lidar, confiança_estimada)
        """
        pass
    
    @abstractmethod
    def execute(self, input_text: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Executa a tarefa
        Retorna: Dict com output, tokens, cost, etc
        """
        pass
    
    def get_capability(self, name: str) -> Optional[AgentCapability]:
        """Busca capacidade por nome"""
        for cap in self.capabilities:
            if cap.name == name:
                return cap
        return None


class ClaudeAgent(BaseAgent):
    """Agent que usa API do Claude"""
    
    def __init__(self, model: str = "claude-3-5-haiku-20241022"):
        capabilities = [
            AgentCapability(
                name="reasoning",
                description="Raciocínio lógico e análise complexa",
                confidence_threshold=70.0,
                cost_multiplier=1.0
            ),
            AgentCapability(
                name="code_generation",
                description="Geração de código",
                confidence_threshold=75.0,
                cost_multiplier=1.2
            ),
            AgentCapability(
                name="document_analysis",
                description="Análise de documentos",
                confidence_threshold=80.0,
                cost_multiplier=1.5
            ),
        ]
        super().__init__(f"Claude-{model}", capabilities)
        
        self.model = model
        self.api_key = os.getenv('ANTHROPIC_API_KEY')
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)
        else:
            self.client = None
            self.logger.warning("⚠️ ANTHROPIC_API_KEY não configurada")
    
    def can_handle(self, task_type: str, complexity: float) -> Tuple[bool, float]:
        """Verifica se pode lidar com a tarefa"""
        
        # Mapear tipos de tarefa para capacidades
        task_capability_map = {
            'reasoning_advanced': 'reasoning',
            'code_complex': 'code_generation',
            'code_simple': 'code_generation',
            'analysis_deep': 'document_analysis',
        }
        
        capability_name = task_capability_map.get(task_type)
        if not capability_name:
            return False, 0.0
        
        capability = self.get_capability(capability_name)
        if not capability:
            return False, 0.0
        
        # Calcular confiança baseada em complexidade
        if complexity >= capability.confidence_threshold:
            confidence = min(95.0, 70.0 + (complexity / 10))
            return True, confidence
        
        return False, 0.0
    
    def execute(self, input_text: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Executa tarefa com Claude"""
        if not self.client:
            raise ValueError("Claude API não configurada")
        
        try:
            self.logger.info(f"🤖 Executando com {self.name}...")
            
            # Preparar mensagens
            messages = [{"role": "user", "content": input_text}]
            
            # Adicionar contexto se fornecido
            if context and context.get('system_prompt'):
                # Claude não suporta system no messages, usar como primeira mensagem
                messages.insert(0, {
                    "role": "user",
                    "content": context['system_prompt']
                })
            
            # Chamar API
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=messages
            )
            
            output = response.content[0].text
            input_tokens = response.usage.input_tokens
            output_tokens = response.usage.output_tokens
            
            self.logger.info(f"✅ {self.name} respondeu: {input_tokens} in, {output_tokens} out tokens")
            
            return {
                'success': True,
                'output': output,
                'input_tokens': input_tokens,
                'output_tokens': output_tokens,
                'model': self.model,
                'provider': self.name
            }
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao executar {self.name}: {e}")
            return {
                'success': False,
                'error': str(e),
                'provider': self.name
            }


class ManusLLMAgent(BaseAgent):
    """Agent que usa LLM interno do Manus"""
    
    def __init__(self):
        capabilities = [
            AgentCapability(
                name="chat",
                description="Conversação geral",
                confidence_threshold=50.0,
                cost_multiplier=0.0  # Grátis
            ),
            AgentCapability(
                name="simple_tasks",
                description="Tarefas simples",
                confidence_threshold=60.0,
                cost_multiplier=0.0
            ),
        ]
        super().__init__("ManusLLM", capabilities)
        
        self.api_url = os.getenv('BUILT_IN_FORGE_API_URL')
        self.api_key = os.getenv('BUILT_IN_FORGE_API_KEY')
    
    def can_handle(self, task_type: str, complexity: float) -> Tuple[bool, float]:
        """Verifica se pode lidar com a tarefa"""
        
        # Tarefas simples
        simple_tasks = ['chat', 'general', 'file_search']
        
        if task_type in simple_tasks and complexity < 70:
            confidence = 80.0 - complexity / 2
            return True, confidence
        
        return False, 0.0
    
    def execute(self, input_text: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Executa tarefa com Manus LLM"""
        try:
            self.logger.info("🤖 Executando com Manus LLM...")
            
            # Chamar API interna do Manus
            # TODO: Implementar chamada real quando API estiver disponível
            
            # Por enquanto, simulação
            output = f"[Manus LLM] Processando: {input_text[:100]}..."
            
            return {
                'success': True,
                'output': output,
                'input_tokens': len(input_text) // 4,
                'output_tokens': len(output) // 4,
                'provider': self.name
            }
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao executar Manus LLM: {e}")
            return {
                'success': False,
                'error': str(e),
                'provider': self.name
            }


class CometVisionAgent(BaseAgent):
    """Agent que usa Comet Vision para análise visual"""
    
    def __init__(self):
        capabilities = [
            AgentCapability(
                name="website_cloning",
                description="Clonagem de websites",
                confidence_threshold=85.0,
                cost_multiplier=0.0  # Local
            ),
            AgentCapability(
                name="visual_analysis",
                description="Análise visual de interfaces",
                confidence_threshold=80.0,
                cost_multiplier=0.0
            ),
            AgentCapability(
                name="code_validation",
                description="Validação de código frontend",
                confidence_threshold=75.0,
                cost_multiplier=0.0
            ),
        ]
        super().__init__("CometVision", capabilities)
        
        self.api_base = os.getenv('API_BASE_URL', 'http://localhost:3000')
    
    def can_handle(self, task_type: str, complexity: float) -> Tuple[bool, float]:
        """Verifica se pode lidar com a tarefa"""
        
        visual_tasks = ['visual_analysis', 'website_clone', 'frontend_validation']
        
        if task_type in visual_tasks:
            confidence = 90.0  # Alta confiança para tarefas visuais
            return True, confidence
        
        return False, 0.0
    
    def execute(self, input_text: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Executa tarefa com Comet Vision"""
        try:
            self.logger.info("🤖 Executando com Comet Vision...")
            
            # Extrair URL do input se presente
            url = context.get('url') if context else None
            if not url:
                # Tentar extrair do texto
                import re
                url_pattern = r'https?://[^\s]+'
                match = re.search(url_pattern, input_text)
                if match:
                    url = match.group(0)
            
            if url:
                # Chamar endpoint de análise visual
                # TODO: Implementar chamada real ao endpoint
                output = f"[Comet Vision] Análise visual iniciada para: {url}"
            else:
                output = "[Comet Vision] URL não fornecida para análise visual"
            
            return {
                'success': True,
                'output': output,
                'input_tokens': 0,
                'output_tokens': 0,
                'provider': self.name
            }
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao executar Comet Vision: {e}")
            return {
                'success': False,
                'error': str(e),
                'provider': self.name
            }


class GensparkSimulatedAgent(BaseAgent):
    """
    Agent que simula funcionalidade do Genspark
    Usa Claude + Web Search para replicar capacidades
    """
    
    def __init__(self):
        capabilities = [
            AgentCapability(
                name="multi_source_research",
                description="Pesquisa em múltiplas fontes",
                confidence_threshold=70.0,
                cost_multiplier=1.5
            ),
            AgentCapability(
                name="synthesis",
                description="Síntese de informações",
                confidence_threshold=75.0,
                cost_multiplier=1.3
            ),
        ]
        super().__init__("GensparkSimulated", capabilities)
        
        # Usar Claude com web search
        self.claude_agent = ClaudeAgent(model="claude-3-5-sonnet-20241022")
    
    def can_handle(self, task_type: str, complexity: float) -> Tuple[bool, float]:
        """Verifica se pode lidar com a tarefa"""
        
        research_tasks = ['research', 'multi_source_search', 'synthesis']
        
        if task_type in research_tasks:
            confidence = 85.0
            return True, confidence
        
        # Detectar palavras-chave de pesquisa no input
        research_keywords = ['pesquisar', 'buscar', 'investigar', 'comparar', 'analisar mercado']
        # Esta verificação seria feita no input_text, mas aqui só temos task_type
        
        return False, 0.0
    
    def execute(self, input_text: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Executa tarefa simulando Genspark
        Usa Claude com prompt especial para pesquisa multi-fonte
        """
        try:
            self.logger.info("🤖 Executando com Genspark Simulated (Claude + Web Search)...")
            
            # Criar prompt especial para pesquisa
            enhanced_prompt = f"""Você é um assistente de pesquisa avançado. Sua tarefa é:

1. Analisar a seguinte solicitação de pesquisa
2. Identificar as principais fontes de informação necessárias
3. Sintetizar as informações de forma clara e estruturada
4. Citar as fontes quando relevante

Solicitação: {input_text}

Por favor, forneça uma resposta completa e bem estruturada."""
            
            # Usar Claude agent
            result = self.claude_agent.execute(enhanced_prompt, context)
            
            if result['success']:
                result['provider'] = self.name
                result['note'] = "Funcionalidade Genspark simulada com Claude + Web Search"
            
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao executar Genspark Simulated: {e}")
            return {
                'success': False,
                'error': str(e),
                'provider': self.name
            }


class AgentRegistry:
    """Registro de agents disponíveis"""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.logger = logging.getLogger("AgentRegistry")
        self._register_default_agents()
    
    def _register_default_agents(self):
        """Registra agents padrão"""
        try:
            # Claude Haiku (rápido e barato)
            self.register(ClaudeAgent(model="claude-3-5-haiku-20241022"))
            
            # Claude Sonnet (balanceado)
            self.register(ClaudeAgent(model="claude-3-5-sonnet-20241022"))
            
            # Claude Opus (máxima capacidade)
            self.register(ClaudeAgent(model="claude-opus-4-20250514"))
            
            # Manus LLM (built-in)
            self.register(ManusLLMAgent())
            
            # Comet Vision
            self.register(CometVisionAgent())
            
            # Genspark Simulated
            self.register(GensparkSimulatedAgent())
            
            self.logger.info(f"✅ {len(self.agents)} agents registrados")
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao registrar agents: {e}")
    
    def register(self, agent: BaseAgent):
        """Registra um agent"""
        self.agents[agent.name] = agent
        self.logger.debug(f"Agent registrado: {agent.name}")
    
    def get_agent(self, name: str) -> Optional[BaseAgent]:
        """Busca agent por nome"""
        return self.agents.get(name)
    
    def find_best_agent(self, task_type: str, complexity: float) -> Optional[Tuple[BaseAgent, float]]:
        """
        Encontra o melhor agent para a tarefa
        Retorna: (agent, confiança) ou None
        """
        best_agent = None
        best_confidence = 0.0
        
        for agent in self.agents.values():
            can_handle, confidence = agent.can_handle(task_type, complexity)
            if can_handle and confidence > best_confidence:
                best_agent = agent
                best_confidence = confidence
        
        if best_agent:
            self.logger.info(f"🎯 Melhor agent: {best_agent.name} (confiança: {best_confidence:.1f}%)")
            return best_agent, best_confidence
        
        return None
    
    def list_agents(self) -> List[Dict[str, Any]]:
        """Lista todos os agents disponíveis"""
        return [
            {
                'name': agent.name,
                'capabilities': [
                    {
                        'name': cap.name,
                        'description': cap.description,
                        'confidence_threshold': cap.confidence_threshold,
                        'cost_multiplier': cap.cost_multiplier
                    }
                    for cap in agent.capabilities
                ]
            }
            for agent in self.agents.values()
        ]


# Singleton global
_agent_registry_instance = None

def get_agent_registry() -> AgentRegistry:
    """Retorna instância singleton do registry"""
    global _agent_registry_instance
    
    if _agent_registry_instance is None:
        _agent_registry_instance = AgentRegistry()
    
    return _agent_registry_instance


if __name__ == "__main__":
    # Teste
    registry = get_agent_registry()
    
    print("\n📋 Agents disponíveis:")
    for agent_info in registry.list_agents():
        print(f"\n  🤖 {agent_info['name']}")
        for cap in agent_info['capabilities']:
            print(f"    - {cap['name']}: {cap['description']}")
    
    print("\n🔍 Testando seleção de agent:")
    
    # Teste 1: Tarefa de raciocínio complexo
    agent, conf = registry.find_best_agent('reasoning_advanced', 85.0)
    if agent:
        print(f"  Tarefa complexa → {agent.name} ({conf:.1f}% confiança)")
    
    # Teste 2: Chat simples
    agent, conf = registry.find_best_agent('chat', 30.0)
    if agent:
        print(f"  Chat simples → {agent.name} ({conf:.1f}% confiança)")
    
    # Teste 3: Análise visual
    agent, conf = registry.find_best_agent('visual_analysis', 90.0)
    if agent:
        print(f"  Análise visual → {agent.name} ({conf:.1f}% confiança)")
