/**
 * Mock Telefonica/Genspark API
 * Simula respostas de IA sem consumir APIs reais
 */

export interface TelefonicaRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
}

export interface TelefonicaResponse {
  success: boolean;
  response?: string;
  tokensUsed?: number;
  error?: string;
  mock: boolean;
}

class TelefonicaMock {
  private requestCount = 0;

  /**
   * Simula requisição para Telefonica/Genspark
   */
  async generateResponse(request: TelefonicaRequest): Promise<TelefonicaResponse> {
    this.requestCount++;

    // Simular delay de processamento
    await this.delay(500 + Math.random() * 1500);

    // Simular erro ocasional (2% de chance)
    if (Math.random() < 0.02) {
      return {
        success: false,
        error: 'Erro simulado de timeout',
        mock: true,
      };
    }

    // Gerar resposta mockada baseada no prompt
    const response = this.generateMockResponse(request.prompt, request.context);
    const tokensUsed = Math.floor(response.length / 4); // Aproximação

    console.log(`[Telefonica Mock] Requisição ${this.requestCount}: ${request.prompt.substring(0, 50)}...`);

    return {
      success: true,
      response,
      tokensUsed,
      mock: true,
    };
  }

  /**
   * Gera resposta mockada inteligente
   */
  private generateMockResponse(prompt: string, context?: string): string {
    const promptLower = prompt.toLowerCase();

    // Respostas contextuais baseadas em palavras-chave
    if (promptLower.includes('código') || promptLower.includes('programar')) {
      return this.generateCodeResponse();
    }

    if (promptLower.includes('resumo') || promptLower.includes('resumir')) {
      return this.generateSummaryResponse();
    }

    if (promptLower.includes('análise') || promptLower.includes('analisar')) {
      return this.generateAnalysisResponse();
    }

    if (promptLower.includes('lista') || promptLower.includes('listar')) {
      return this.generateListResponse();
    }

    if (promptLower.includes('explicar') || promptLower.includes('como')) {
      return this.generateExplanationResponse();
    }

    // Resposta genérica
    return this.generateGenericResponse(prompt, context);
  }

  private generateCodeResponse(): string {
    return `\`\`\`python
# Código de exemplo gerado pelo mock
def exemplo_funcao(parametro):
    """Função de exemplo"""
    resultado = parametro * 2
    return resultado

# Uso
valor = exemplo_funcao(42)
print(f"Resultado: {valor}")
\`\`\`

**Explicação:**
Esta é uma função simples que demonstra o conceito solicitado. Em um ambiente real, você pode expandir com validações e tratamento de erros.`;
  }

  private generateSummaryResponse(): string {
    return `**Resumo Executivo:**

1. **Ponto Principal:** Análise completa do contexto fornecido
2. **Insights Chave:**
   - Identificação de padrões relevantes
   - Recomendações baseadas em dados
   - Próximos passos sugeridos

3. **Conclusão:** Implementação gradual com monitoramento contínuo

*Nota: Este é um resumo simulado gerado pelo ambiente de desenvolvimento.*`;
  }

  private generateAnalysisResponse(): string {
    return `**Análise Detalhada:**

**Aspectos Positivos:**
- Estrutura bem definida
- Escalabilidade adequada
- Boas práticas aplicadas

**Pontos de Atenção:**
- Possível otimização de performance
- Considerar casos extremos
- Documentação pode ser expandida

**Recomendações:**
1. Implementar testes automatizados
2. Adicionar monitoramento
3. Revisar periodicamente

*Análise gerada em ambiente de desenvolvimento mock.*`;
  }

  private generateListResponse(): string {
    return `**Lista de Itens:**

1. **Primeiro Item**
   - Descrição detalhada
   - Relevância: Alta
   
2. **Segundo Item**
   - Contexto adicional
   - Relevância: Média

3. **Terceiro Item**
   - Informações complementares
   - Relevância: Alta

4. **Quarto Item**
   - Detalhes finais
   - Relevância: Baixa

*Lista gerada pelo sistema mock para desenvolvimento.*`;
  }

  private generateExplanationResponse(): string {
    return `**Explicação Detalhada:**

O conceito solicitado funciona da seguinte forma:

**1. Fundamentos:**
O processo começa com a identificação do problema e análise dos requisitos.

**2. Implementação:**
A solução é desenvolvida seguindo padrões estabelecidos e boas práticas.

**3. Validação:**
Testes são executados para garantir funcionamento correto.

**4. Otimização:**
Ajustes finais são aplicados baseados em métricas de performance.

**Exemplo Prático:**
Em um cenário real, você aplicaria estes conceitos adaptando às necessidades específicas do projeto.

*Explicação gerada pelo ambiente de desenvolvimento.*`;
  }

  private generateGenericResponse(prompt: string, context?: string): string {
    const hasContext = context && context.length > 0;

    return `**Resposta Gerada (Mock):**

Entendi sua solicitação: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"

${hasContext ? `**Contexto Considerado:**\nAnalisei o contexto fornecido e identifiquei os pontos principais.\n` : ''}

**Resposta:**
Esta é uma resposta simulada gerada pelo ambiente de desenvolvimento. Em produção, esta requisição seria processada pela API real da Telefonica/Genspark.

**Próximos Passos:**
1. Validar a resposta
2. Aplicar ao contexto específico
3. Iterar conforme necessário

*Ambiente: Desenvolvimento Mock | Tokens Simulados: ${Math.floor(Math.random() * 500) + 100}*`;
  }

  /**
   * Obter estatísticas de uso (apenas para testes)
   */
  getStats(): { requestCount: number } {
    return { requestCount: this.requestCount };
  }

  /**
   * Resetar contador
   */
  reset(): void {
    this.requestCount = 0;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const telefonicaMock = new TelefonicaMock();
