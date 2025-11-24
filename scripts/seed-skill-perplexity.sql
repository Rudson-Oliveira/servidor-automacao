-- Skill: Consultar Perplexity AI
-- Descrição: Realizar pesquisas e consultas usando Perplexity AI com citações e fontes verificadas

INSERT INTO skills (
  id,
  nome,
  descricao,
  categoria,
  endpoint,
  metodo,
  parametros,
  exemplo_uso,
  documentacao,
  tags,
  ativa,
  versao
) VALUES (
  330002,
  'Consultar Perplexity AI',
  'Realizar pesquisas e consultas usando Perplexity AI, uma IA de busca que fornece respostas contextualizadas com fontes verificadas e citações acadêmicas.',
  'pesquisa',
  '/api/trpc/perplexity.consultar',
  'POST',
  JSON_OBJECT(
    'query', 'string (obrigatório) - Pergunta ou consulta a ser feita',
    'apiKey', 'string (obrigatório) - API key do Perplexity',
    'model', 'string (opcional) - Modelo a usar (padrão: llama-3.1-sonar-small-128k-online)',
    'temperature', 'number (opcional) - Temperatura (0-2, padrão: 0.2)',
    'maxTokens', 'number (opcional) - Máximo de tokens (1-4000, padrão: 1000)'
  ),
  JSON_OBJECT(
    'query', 'Quais são as últimas descobertas sobre inteligência artificial em 2025?',
    'apiKey', 'pplx-xxxxxxxxxxxxxxxxxxxxx',
    'model', 'llama-3.1-sonar-large-128k-online',
    'temperature', 0.2,
    'maxTokens', 2000
  ),
  '# Consultar Perplexity AI

## Descrição Completa

Perplexity AI é uma ferramenta de pesquisa avançada que combina busca na web com inteligência artificial para fornecer respostas precisas e contextualizadas. Diferente de chatbots tradicionais, Perplexity sempre cita suas fontes e fornece links verificados.

## Casos de Uso

1. **Pesquisa Acadêmica**: Obter informações com citações verificadas
2. **Análise de Mercado**: Pesquisar tendências e dados atualizados
3. **Fact-Checking**: Verificar informações com fontes confiáveis
4. **Pesquisa Técnica**: Encontrar soluções e documentação
5. **Análise de Notícias**: Obter resumos com múltiplas fontes

## Modelos Disponíveis

### llama-3.1-sonar-small-128k-online (Padrão)
- **Velocidade**: Rápida
- **Custo**: Baixo
- **Uso**: Consultas simples e rápidas
- **Contexto**: 128k tokens

### llama-3.1-sonar-large-128k-online
- **Velocidade**: Média
- **Custo**: Médio
- **Uso**: Consultas complexas
- **Contexto**: 128k tokens
- **Qualidade**: Alta

### llama-3.1-sonar-huge-128k-online
- **Velocidade**: Lenta
- **Custo**: Alto
- **Uso**: Pesquisas muito complexas
- **Contexto**: 128k tokens
- **Qualidade**: Máxima

## Parâmetros

### query (obrigatório)
- **Tipo**: string
- **Descrição**: Pergunta ou consulta a ser feita
- **Limite**: 1-4000 caracteres
- **Exemplo**: "Quais são as melhores práticas de segurança em APIs REST?"

### apiKey (obrigatório)
- **Tipo**: string
- **Descrição**: Chave de API do Perplexity
- **Formato**: pplx-xxxxxxxxxxxxxxxxxxxxx
- **Onde obter**: https://www.perplexity.ai/settings/api

### model (opcional)
- **Tipo**: string
- **Padrão**: llama-3.1-sonar-small-128k-online
- **Opções**:
  - llama-3.1-sonar-small-128k-online
  - llama-3.1-sonar-large-128k-online
  - llama-3.1-sonar-huge-128k-online

### temperature (opcional)
- **Tipo**: number
- **Padrão**: 0.2
- **Intervalo**: 0-2
- **Descrição**:
  - 0-0.3: Respostas mais precisas e factuais
  - 0.4-0.7: Equilíbrio entre criatividade e precisão
  - 0.8-2: Respostas mais criativas e variadas

### maxTokens (opcional)
- **Tipo**: number
- **Padrão**: 1000
- **Intervalo**: 1-4000
- **Descrição**: Limite de tokens na resposta

## Formato da Resposta

```json
{
  "sucesso": true,
  "resposta": "Texto da resposta com informações detalhadas...",
  "citacoes": [
    "https://fonte1.com/artigo",
    "https://fonte2.com/pesquisa"
  ],
  "metadata": {
    "modelo": "llama-3.1-sonar-large-128k-online",
    "tokensUsados": 1250,
    "temperature": 0.2,
    "timestamp": "2025-11-23T20:00:00.000Z"
  }
}
```

## Exemplos Práticos

### Exemplo 1: Pesquisa Simples
```json
{
  "query": "O que é TypeScript?",
  "apiKey": "pplx-xxxxxxxxxxxxxxxxxxxxx"
}
```

### Exemplo 2: Pesquisa Acadêmica
```json
{
  "query": "Quais são os últimos avanços em computação quântica publicados em 2025?",
  "apiKey": "pplx-xxxxxxxxxxxxxxxxxxxxx",
  "model": "llama-3.1-sonar-large-128k-online",
  "temperature": 0.1,
  "maxTokens": 2000
}
```

### Exemplo 3: Análise de Mercado
```json
{
  "query": "Quais são as tendências de IA generativa no mercado brasileiro em 2025?",
  "apiKey": "pplx-xxxxxxxxxxxxxxxxxxxxx",
  "model": "llama-3.1-sonar-large-128k-online",
  "temperature": 0.3,
  "maxTokens": 1500
}
```

### Exemplo 4: Pesquisa Técnica
```json
{
  "query": "Como implementar autenticação JWT em Node.js com TypeScript?",
  "apiKey": "pplx-xxxxxxxxxxxxxxxxxxxxx",
  "model": "llama-3.1-sonar-small-128k-online",
  "temperature": 0.2,
  "maxTokens": 1000
}
```

## Boas Práticas

### 1. Seja Específico
❌ Ruim: "Me fale sobre IA"
✅ Bom: "Quais são as principais diferenças entre GPT-4 e Claude 3 em termos de capacidades de raciocínio?"

### 2. Use Contexto
❌ Ruim: "Como fazer isso?"
✅ Bom: "Como implementar autenticação OAuth 2.0 em uma API REST usando Express.js?"

### 3. Peça Fontes
✅ Sempre: "Cite as fontes e estudos mais recentes"
✅ Sempre: "Forneça links para documentação oficial"

### 4. Escolha o Modelo Certo
- **Consultas rápidas**: small
- **Pesquisas complexas**: large
- **Análises profundas**: huge

### 5. Ajuste a Temperature
- **Pesquisa factual**: 0.1-0.2
- **Análise equilibrada**: 0.3-0.5
- **Brainstorming**: 0.6-0.8

## Tratamento de Erros

### Erro: API Key Inválida
```json
{
  "error": "Invalid API key"
}
```
**Solução**: Verificar API key em https://www.perplexity.ai/settings/api

### Erro: Query Muito Longa
```json
{
  "error": "Query too long (max 4000 characters)"
}
```
**Solução**: Reduzir tamanho da query ou dividir em múltiplas consultas

### Erro: Limite de Tokens Excedido
```json
{
  "error": "Max tokens exceeded"
}
```
**Solução**: Reduzir maxTokens ou usar modelo com maior capacidade

### Erro: Rate Limit
```json
{
  "error": "Rate limit exceeded"
}
```
**Solução**: Aguardar alguns segundos antes de nova requisição

## Custos e Limites

### Plano Free
- **Requisições**: 5/dia
- **Tokens**: 1000/requisição
- **Modelos**: small apenas

### Plano Standard
- **Requisições**: 300/dia
- **Tokens**: 4000/requisição
- **Modelos**: small, large

### Plano Pro
- **Requisições**: Ilimitadas
- **Tokens**: 4000/requisição
- **Modelos**: small, large, huge

## Integração com Comet

### Fluxo Recomendado

1. **Consultar Skill**:
```sql
SELECT * FROM skills WHERE nome = ''Consultar Perplexity AI'';
```

2. **Preparar Payload**:
```json
{
  "json": {
    "query": "Sua pergunta aqui",
    "apiKey": "pplx-xxxxxxxxxxxxxxxxxxxxx",
    "model": "llama-3.1-sonar-large-128k-online"
  }
}
```

3. **Fazer Requisição**:
```
POST http://localhost:3000/api/trpc/perplexity.consultar
Content-Type: application/json
```

4. **Processar Resposta**:
```python
result = response.json()["result"]["data"]["json"]
resposta = result["resposta"]
citacoes = result["citacoes"]
```

## FAQ

**P: Qual modelo devo usar?**
R: Para consultas rápidas use small, para pesquisas complexas use large, para análises profundas use huge.

**P: Como obter API key?**
R: Acesse https://www.perplexity.ai/settings/api e gere uma nova chave.

**P: Perplexity tem acesso à internet em tempo real?**
R: Sim! Todos os modelos "online" buscam informações atualizadas na web.

**P: As citações são confiáveis?**
R: Sim, Perplexity verifica e cita apenas fontes confiáveis.

**P: Posso usar para pesquisa acadêmica?**
R: Sim, mas sempre verifique as fontes citadas antes de usar em trabalhos acadêmicos.

---

**Documentação Oficial**: https://docs.perplexity.ai/
**Suporte**: https://www.perplexity.ai/support
**Versão**: 1.0',
  'perplexity,pesquisa,busca,citacoes,fontes,ia,llm,online',
  TRUE,
  '1.0'
) ON DUPLICATE KEY UPDATE
  descricao = VALUES(descricao),
  parametros = VALUES(parametros),
  exemplo_uso = VALUES(exemplo_uso),
  documentacao = VALUES(documentacao),
  tags = VALUES(tags),
  versao = VALUES(versao);
