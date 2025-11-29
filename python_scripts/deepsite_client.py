#!/usr/bin/env python3
"""
Cliente DeepSite Avançado para Geração de Interfaces Web
Integra com múltiplos modelos de IA e modos de otimização
"""

import os
import json
import logging
import requests
from typing import Dict, List, Optional, Any, Literal
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class DeepSiteModel(Enum):
    """Modelos de IA disponíveis no DeepSite"""
    DEEPSEEK_V3 = "deepseek-v3"
    NOVITA_AI = "novita-ai"
    NEBIUS_AI = "nebius-ai"
    SAMBANOVA = "sambanova"
    HYPERBOLIC = "hyperbolic"
    TOGETHER_AI = "together-ai"
    FIREWORKS_AI = "fireworks-ai"


class DeepSiteMode(Enum):
    """Modos de operação do DeepSite"""
    AUTO = "auto"  # Smart - balanceado
    FASTEST = "fastest"  # Speed - mais rápido
    CHEAPEST = "cheapest"  # Cost - mais barato


class DeepSiteAction(Enum):
    """Ações disponíveis no DeepSite"""
    GENERATE = "generate"  # Gerar novo site
    ENHANCE = "enhance"  # Melhorar código existente
    REDESIGN = "redesign"  # Redesenhar completamente
    PREVIEW = "preview"  # Preview em tempo real


@dataclass
class DeepSiteConfig:
    """Configuração para geração com DeepSite"""
    model: DeepSiteModel = DeepSiteModel.DEEPSEEK_V3
    mode: DeepSiteMode = DeepSiteMode.AUTO
    action: DeepSiteAction = DeepSiteAction.GENERATE
    enable_seo: bool = True
    enable_responsive: bool = True
    single_file: bool = True
    deploy_huggingface: bool = False
    huggingface_token: Optional[str] = None


@dataclass
class DeepSiteResult:
    """Resultado da geração com DeepSite"""
    success: bool
    html_code: Optional[str]
    preview_url: Optional[str]
    deploy_url: Optional[str]
    model_used: str
    generation_time_ms: int
    tokens_used: Dict[str, int]
    cost: float
    error: Optional[str] = None
    metadata: Optional[Dict] = None


class DeepSiteClient:
    """Cliente para integração com DeepSite"""
    
    def __init__(self, api_base: Optional[str] = None):
        """
        Inicializa cliente DeepSite
        
        Args:
            api_base: URL base da API (padrão: usar Hugging Face Space)
        """
        self.api_base = api_base or "https://enzostvs-deepsite.hf.space"
        self.session = requests.Session()
        self.logger = logging.getLogger("DeepSiteClient")
    
    def generate_website(
        self,
        prompt: str,
        config: Optional[DeepSiteConfig] = None,
        context: Optional[Dict] = None
    ) -> DeepSiteResult:
        """
        Gera website usando DeepSite
        
        Args:
            prompt: Descrição do site a ser gerado
            config: Configuração de geração
            context: Contexto adicional
        
        Returns:
            DeepSiteResult com HTML gerado e metadados
        """
        if config is None:
            config = DeepSiteConfig()
        
        self.logger.info(f"🌐 Gerando website com DeepSite...")
        self.logger.info(f"   Modelo: {config.model.value}")
        self.logger.info(f"   Modo: {config.mode.value}")
        self.logger.info(f"   Ação: {config.action.value}")
        
        try:
            import time
            start_time = time.time()
            
            # Preparar payload
            payload = {
                "prompt": prompt,
                "model": config.model.value,
                "mode": config.mode.value,
                "action": config.action.value,
                "options": {
                    "seo": config.enable_seo,
                    "responsive": config.enable_responsive,
                    "single_file": config.single_file
                }
            }
            
            if context:
                payload["context"] = context
            
            # Como DeepSite não tem API oficial, vamos simular a geração
            # usando nosso próprio sistema baseado em Claude
            result = self._simulate_deepsite_generation(prompt, config, context)
            
            generation_time = int((time.time() - start_time) * 1000)
            result.generation_time_ms = generation_time
            
            self.logger.info(f"✅ Website gerado em {generation_time}ms")
            
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao gerar website: {e}")
            return DeepSiteResult(
                success=False,
                html_code=None,
                preview_url=None,
                deploy_url=None,
                model_used=config.model.value,
                generation_time_ms=0,
                tokens_used={},
                cost=0.0,
                error=str(e)
            )
    
    def _simulate_deepsite_generation(
        self,
        prompt: str,
        config: DeepSiteConfig,
        context: Optional[Dict]
    ) -> DeepSiteResult:
        """
        Simula geração do DeepSite usando Claude
        (até termos acesso à API oficial)
        """
        from anthropic import Anthropic
        
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY não configurada")
        
        client = Anthropic(api_key=api_key)
        
        # Criar prompt otimizado para geração de HTML
        system_prompt = self._build_generation_prompt(config)
        
        # Selecionar modelo Claude baseado no modo
        claude_model = self._select_claude_model(config.mode)
        
        # Gerar HTML
        response = client.messages.create(
            model=claude_model,
            max_tokens=8000,
            messages=[
                {
                    "role": "user",
                    "content": f"{system_prompt}\n\nPROMPT DO USUÁRIO:\n{prompt}"
                }
            ]
        )
        
        html_code = response.content[0].text
        
        # Extrair apenas o HTML se vier com explicações
        html_code = self._extract_html(html_code)
        
        # Calcular custo aproximado
        cost = self._calculate_cost(
            response.usage.input_tokens,
            response.usage.output_tokens,
            claude_model
        )
        
        return DeepSiteResult(
            success=True,
            html_code=html_code,
            preview_url=None,  # Seria gerado pelo servidor
            deploy_url=None,
            model_used=f"{config.model.value} (simulated with {claude_model})",
            generation_time_ms=0,  # Será preenchido pelo caller
            tokens_used={
                "input": response.usage.input_tokens,
                "output": response.usage.output_tokens
            },
            cost=cost,
            metadata={
                "mode": config.mode.value,
                "seo_enabled": config.enable_seo,
                "responsive": config.enable_responsive
            }
        )
    
    def _build_generation_prompt(self, config: DeepSiteConfig) -> str:
        """Constrói prompt otimizado para geração"""
        
        base_prompt = """Você é um expert em desenvolvimento web front-end. Sua tarefa é gerar um arquivo HTML completo, responsivo e moderno.

REQUISITOS OBRIGATÓRIOS:
1. HTML5 válido e semântico
2. CSS inline ou em <style> no <head>
3. JavaScript inline se necessário
4. Design responsivo (mobile-first)
5. Cores e tipografia modernas
6. Sem dependências externas (tudo inline)
7. Código limpo e bem comentado"""

        if config.enable_seo:
            base_prompt += """
8. Meta tags SEO completas (title, description, keywords, og:tags)
9. Estrutura semântica para SEO (h1, h2, nav, main, footer)"""

        if config.enable_responsive:
            base_prompt += """
10. Media queries para mobile, tablet e desktop
11. Viewport meta tag configurada
12. Imagens responsivas"""

        if config.action == DeepSiteAction.ENHANCE:
            base_prompt += """

AÇÃO: ENHANCE
- Melhorar o código fornecido mantendo a estrutura
- Otimizar performance
- Adicionar animações sutis
- Melhorar acessibilidade"""

        elif config.action == DeepSiteAction.REDESIGN:
            base_prompt += """

AÇÃO: REDESIGN
- Redesenhar completamente mantendo o conteúdo
- Aplicar design system moderno
- Usar cores e tipografia atuais
- Adicionar micro-interações"""

        base_prompt += """

FORMATO DE SAÍDA:
- Retorne APENAS o código HTML completo
- Não inclua explicações ou markdown
- Comece com <!DOCTYPE html>
- Termine com </html>"""

        return base_prompt
    
    def _select_claude_model(self, mode: DeepSiteMode) -> str:
        """Seleciona modelo Claude baseado no modo"""
        if mode == DeepSiteMode.FASTEST:
            return "claude-3-5-haiku-20241022"
        elif mode == DeepSiteMode.CHEAPEST:
            return "claude-3-5-haiku-20241022"
        else:  # AUTO
            return "claude-3-5-sonnet-20241022"
    
    def _extract_html(self, text: str) -> str:
        """Extrai código HTML do texto"""
        # Remover markdown code blocks se presente
        if "```html" in text:
            start = text.find("```html") + 7
            end = text.find("```", start)
            if end > start:
                text = text[start:end].strip()
        elif "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            if end > start:
                text = text[start:end].strip()
        
        # Garantir que começa com <!DOCTYPE html>
        if not text.strip().startswith("<!DOCTYPE"):
            if text.strip().startswith("<html"):
                text = "<!DOCTYPE html>\n" + text
        
        return text.strip()
    
    def _calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """Calcula custo aproximado"""
        # Preços por 1M tokens
        prices = {
            "claude-3-5-haiku-20241022": {"input": 0.25, "output": 1.25},
            "claude-3-5-sonnet-20241022": {"input": 3.00, "output": 15.00},
        }
        
        price = prices.get(model, prices["claude-3-5-haiku-20241022"])
        
        input_cost = (input_tokens / 1_000_000) * price["input"]
        output_cost = (output_tokens / 1_000_000) * price["output"]
        
        return round(input_cost + output_cost, 4)
    
    def enhance_code(self, html_code: str, instructions: str = "") -> DeepSiteResult:
        """
        Melhora código HTML existente
        
        Args:
            html_code: Código HTML a ser melhorado
            instructions: Instruções específicas de melhoria
        
        Returns:
            DeepSiteResult com código melhorado
        """
        config = DeepSiteConfig(action=DeepSiteAction.ENHANCE)
        
        prompt = f"""Melhore o seguinte código HTML:

{html_code}

Instruções adicionais: {instructions if instructions else "Otimize performance, acessibilidade e design"}"""
        
        return self.generate_website(prompt, config)
    
    def redesign(self, html_code: str, style_guide: str = "") -> DeepSiteResult:
        """
        Redesenha completamente um site mantendo o conteúdo
        
        Args:
            html_code: Código HTML a ser redesenhado
            style_guide: Guia de estilo para o novo design
        
        Returns:
            DeepSiteResult com novo design
        """
        config = DeepSiteConfig(action=DeepSiteAction.REDESIGN)
        
        prompt = f"""Redesenhe completamente o seguinte site mantendo o conteúdo:

{html_code}

Estilo desejado: {style_guide if style_guide else "Moderno, minimalista, com cores vibrantes"}"""
        
        return self.generate_website(prompt, config)
    
    def generate_dashboard(
        self,
        title: str,
        features: List[str],
        data_structure: Optional[Dict] = None
    ) -> DeepSiteResult:
        """
        Gera dashboard administrativo
        
        Args:
            title: Título do dashboard
            features: Lista de features/seções
            data_structure: Estrutura de dados a ser exibida
        
        Returns:
            DeepSiteResult com dashboard HTML
        """
        config = DeepSiteConfig(
            mode=DeepSiteMode.AUTO,
            enable_seo=True,
            enable_responsive=True
        )
        
        features_text = "\n".join([f"- {f}" for f in features])
        
        prompt = f"""Crie um dashboard administrativo moderno e responsivo:

TÍTULO: {title}

FEATURES/SEÇÕES:
{features_text}

REQUISITOS:
- Design moderno com sidebar
- Cards para métricas principais
- Tabelas responsivas para dados
- Gráficos (usar Chart.js via CDN)
- Tema escuro/claro toggle
- Navegação intuitiva
- Ícones (usar Font Awesome via CDN)

ESTRUTURA DE DADOS:
{json.dumps(data_structure, indent=2) if data_structure else "Usar dados de exemplo"}

IMPORTANTE:
- Incluir Chart.js e Font Awesome via CDN
- Dados de exemplo realistas
- Animações sutis
- Responsivo mobile-first"""
        
        return self.generate_website(prompt, config)
    
    def deploy_to_huggingface(
        self,
        html_code: str,
        space_name: str,
        hf_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Deploy para Hugging Face Spaces
        
        Args:
            html_code: Código HTML a ser deployado
            space_name: Nome do space
            hf_token: Token do Hugging Face
        
        Returns:
            Dict com URL e status do deploy
        """
        if not hf_token:
            hf_token = os.getenv('HUGGINGFACE_TOKEN')
        
        if not hf_token:
            return {
                "success": False,
                "error": "HUGGINGFACE_TOKEN não configurado"
            }
        
        self.logger.info(f"🚀 Deploying para Hugging Face Space: {space_name}")
        
        # TODO: Implementar deploy real via API do Hugging Face
        # Por enquanto, retornar simulação
        
        return {
            "success": True,
            "space_url": f"https://huggingface.co/spaces/{space_name}",
            "message": "Deploy simulado (implementar API real)"
        }


# Singleton global
_deepsite_client_instance = None

def get_deepsite_client() -> DeepSiteClient:
    """Retorna instância singleton do cliente"""
    global _deepsite_client_instance
    
    if _deepsite_client_instance is None:
        _deepsite_client_instance = DeepSiteClient()
    
    return _deepsite_client_instance


if __name__ == "__main__":
    # Teste
    client = get_deepsite_client()
    
    print("\n🧪 Testando geração de dashboard...")
    
    result = client.generate_dashboard(
        title="Sistema de Orquestração Multi-IA",
        features=[
            "Status de IAs em tempo real",
            "Métricas de performance",
            "Histórico de escalações",
            "Logs de auditoria",
            "Custos e uso de tokens"
        ],
        data_structure={
            "providers": ["COMET", "Claude", "Manus LLM", "Comet Vision"],
            "metrics": {
                "total_tasks": 1250,
                "success_rate": 94.5,
                "avg_response_time": 1200
            }
        }
    )
    
    if result.success:
        print(f"✅ Dashboard gerado!")
        print(f"   Modelo: {result.model_used}")
        print(f"   Tokens: {result.tokens_used}")
        print(f"   Custo: ${result.cost:.4f}")
        print(f"   Tamanho: {len(result.html_code)} caracteres")
        
        # Salvar para teste
        output_file = "/tmp/orchestrator_dashboard.html"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(result.html_code)
        print(f"   Salvo em: {output_file}")
    else:
        print(f"❌ Erro: {result.error}")
