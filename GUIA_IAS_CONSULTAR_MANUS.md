# Guia: Como Consultar Manus AI

**Data:** 24/11/2025  
**Versão:** 1.0  
**Para:** Todas as IAs (Comet, Abacus, etc.)  
**Objetivo:** Ensinar como obter informações atualizadas do Manus

---

## 🎯 VISÃO GERAL

Eu sou **Manus AI**, o assistente que criou e mantém o **Servidor de Automação - Sistema de Comunicação**.

Criei um endpoint especial onde **QUALQUER IA** pode me consultar para obter informações atualizadas e precisas sobre o projeto.

**Por que usar este sistema?**
- ✅ Evita informações desatualizadas
- ✅ Previne erros como "Obsidian não tem API"
- ✅ Garante precisão técnica
- ✅ Economiza tempo de pesquisa
- ✅ Acesso a conhecimento sempre atualizado

---

## 📡 ENDPOINT PRINCIPAL

### **POST /api/manus/explicar**

**URL Completa:** `http://localhost:3000/api/manus/explicar`

**Método:** POST

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "pergunta": "Sua pergunta aqui",
  "contexto": "Contexto adicional (opcional)",
  "ia_origem": "Seu nome (ex: Comet AI, Abacus, etc.)"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "pergunta": "Sua pergunta",
  "tema": "Tema identificado",
  "resposta": {
    "... informações detalhadas ..."
  },
  "resumo": "Resumo executivo da resposta",
  "respondido_por": "Manus AI",
  "data": "2025-11-24T03:00:00.000Z",
  "ia_origem": "Comet AI",
  "documentacao_recomendada": ["..."],
  "contato_manus": {
    "...": "..."
  }
}
```

---

## 🔍 TEMAS DISPONÍVEIS

Posso responder sobre os seguintes temas:

### **1. Integração Obsidian**
**Palavras-chave:** obsidian, criar arquivo, nota

**Exemplo:**
```json
{
  "pergunta": "Obsidian tem API?",
  "ia_origem": "Comet AI"
}
```

**Resposta inclui:**
- Status da integração (✅ 100% funcional)
- Tipo de API (local, não pública)
- Plugin necessário
- Endpoints disponíveis
- Skill ID (330001)
- Performance (0.006s)
- Documentação completa
- Como usar

---

### **2. Integração Perplexity**
**Palavras-chave:** perplexity, pesquisa, consulta

**Exemplo:**
```json
{
  "pergunta": "Como usar Perplexity AI?",
  "ia_origem": "Abacus"
}
```

**Resposta inclui:**
- Status da integração
- Modelos disponíveis (3)
- Endpoints
- Skill ID (330002)
- Como usar

---

### **3. Integração DeepSITE**
**Palavras-chave:** deepsite, scraping, website, análise

**Exemplo:**
```json
{
  "pergunta": "Como fazer scraping de websites?",
  "ia_origem": "Comet AI"
}
```

**Resposta inclui:**
- Status da integração
- Endpoints disponíveis (9)
- Recursos (cache, análise IA)
- Skill ID (330003)
- Como usar

---

### **4. Integração Genspark**
**Palavras-chave:** genspark, chamada de voz

**Exemplo:**
```json
{
  "pergunta": "Genspark tem API?",
  "ia_origem": "Comet AI"
}
```

**Resposta inclui:**
- Status (⚠️ API não disponível)
- Pesquisa concluída
- Evidências
- Alternativas propostas
- Custo comparativo
- Observação especial

---

### **5. Skills Cadastradas**
**Palavras-chave:** skill, habilidade, capacidade

**Exemplo:**
```json
{
  "pergunta": "Quantas skills existem?",
  "ia_origem": "Abacus"
}
```

**Resposta inclui:**
- Total de skills (25)
- Skills principais
- Como consultar no banco
- Endpoints de cada skill

---

### **6. Testes Unitários**
**Palavras-chave:** teste, validação, qualidade

**Exemplo:**
```json
{
  "pergunta": "Quantos testes existem?",
  "ia_origem": "Comet AI"
}
```

**Resposta inclui:**
- Total de testes (93)
- Taxa de sucesso (100%)
- Tempo total
- Módulos testados

---

### **7. Endpoints Disponíveis**
**Palavras-chave:** endpoint, api, rota

**Exemplo:**
```json
{
  "pergunta": "Quais endpoints estão disponíveis?",
  "ia_origem": "Abacus"
}
```

**Resposta inclui:**
- Total de endpoints (34)
- Categorias
- Documentação completa

---

### **8. Documentação**
**Palavras-chave:** documentação, guia, manual

**Exemplo:**
```json
{
  "pergunta": "Onde está a documentação?",
  "ia_origem": "Comet AI"
}
```

**Resposta inclui:**
- Total de documentos (85)
- Principais arquivos
- Guias para IAs
- Localização

---

### **9. Performance**
**Palavras-chave:** performance, métrica, velocidade

**Exemplo:**
```json
{
  "pergunta": "Qual a performance do sistema?",
  "ia_origem": "Abacus"
}
```

**Resposta inclui:**
- Métricas por integração
- Tempos de resposta
- Taxa de sucesso
- Classificação

---

### **10. Banco de Dados**
**Palavras-chave:** banco, database, tabela

**Exemplo:**
```json
{
  "pergunta": "Quais tabelas existem no banco?",
  "ia_origem": "Comet AI"
}
```

**Resposta inclui:**
- Tipo de banco (MySQL/TiDB)
- Total de tabelas (13)
- Principais tabelas
- Estrutura

---

### **11. Projeto Geral**
**Palavras-chave:** projeto, sistema, servidor

**Exemplo:**
```json
{
  "pergunta": "O que é este projeto?",
  "ia_origem": "Abacus"
}
```

**Resposta inclui:**
- Nome do projeto
- Versão
- Status
- Descrição
- URL
- Repositório

---

## 🚀 EXEMPLOS PRÁTICOS

### **Exemplo 1: Comet Consultando sobre Obsidian**

**Situação:** Comet precisa criar arquivo no Obsidian mas não tem certeza se é possível.

**Chamada:**
```bash
curl -X POST http://localhost:3000/api/manus/explicar \
  -H "Content-Type: application/json" \
  -d '{
    "pergunta": "Obsidian tem API? Como criar arquivos?",
    "ia_origem": "Comet AI"
  }'
```

**Resposta (resumida):**
```json
{
  "sucesso": true,
  "tema": "Integração Obsidian",
  "resumo": "Obsidian TEM API local via plugin 'Local REST API'. Está 100% funcional com 15 testes passando. Use skill 330001 para criar arquivos.",
  "resposta": {
    "status": "✅ FUNCIONAL - 100% Implementado",
    "tem_api": true,
    "tipo_api": "API Local REST (não pública)",
    "skill_id": 330001,
    "endpoint": "POST /api/trpc/obsidian.gerarScriptCriacao",
    "como_usar": "Sempre consultar skill 330001 no banco, gerar conteúdo markdown, chamar endpoint gerarScriptCriacao, retornar script Python para usuário executar"
  },
  "documentacao_recomendada": [
    "/servidor-automacao/GUIA_OBSIDIAN_PARA_COMET_ATUALIZADO.md",
    "/servidor-automacao/SCRIPT_TREINAMENTO_COMET_OBSIDIAN.md"
  ]
}
```

**Ação do Comet:**
1. ✅ Confirma que Obsidian TEM API
2. ✅ Consulta skill 330001
3. ✅ Usa endpoint correto
4. ✅ NÃO diz "Obsidian não tem API"

---

### **Exemplo 2: Abacus Consultando sobre Genspark**

**Situação:** Abacus precisa integrar com Genspark.

**Chamada:**
```bash
curl -X POST http://localhost:3000/api/manus/explicar \
  -H "Content-Type: application/json" \
  -d '{
    "pergunta": "É possível integrar com Genspark?",
    "ia_origem": "Abacus"
  }'
```

**Resposta (resumida):**
```json
{
  "sucesso": true,
  "tema": "Integração Genspark",
  "resumo": "Genspark NÃO possui API pública disponível (pesquisa concluída em 24/11/2025). Alternativas identificadas: Twilio + OpenAI + ElevenLabs.",
  "resposta": {
    "status": "⚠️ API PÚBLICA NÃO DISPONÍVEL",
    "pesquisa_concluida": true,
    "conclusao": "Genspark não disponibiliza API pública para desenvolvedores externos",
    "alternativa_proposta": "Stack de APIs especializadas (Twilio + OpenAI + ElevenLabs)",
    "custo_alternativa": "$30-82/mês vs $249/mês do Genspark Pro"
  },
  "observacao": "Se você (Comet ou outra IA) encontrou forma de integrar, por favor compartilhe os detalhes para atualizarmos esta informação."
}
```

**Ação do Abacus:**
1. ✅ Entende que API pública não existe
2. ✅ Conhece alternativas viáveis
3. ✅ Pode sugerir stack alternativa
4. ✅ Informa Rudson sobre limitação

---

### **Exemplo 3: Qualquer IA Consultando Skills**

**Chamada:**
```bash
curl -X POST http://localhost:3000/api/manus/explicar \
  -H "Content-Type: application/json" \
  -d '{
    "pergunta": "Quais skills estão disponíveis?",
    "ia_origem": "Nova IA"
  }'
```

**Resposta (resumida):**
```json
{
  "sucesso": true,
  "tema": "Skills Cadastradas",
  "resumo": "25 skills cadastradas no banco. Principais: 330001 (Obsidian), 330002 (Perplexity), 330003 (DeepSITE).",
  "resposta": {
    "total": 25,
    "principais": [
      {
        "id": 330001,
        "nome": "Criar Arquivo no Obsidian",
        "categoria": "Produtividade",
        "endpoint": "/api/trpc/obsidian.gerarScriptCriacao"
      },
      {
        "id": 330002,
        "nome": "Consultar Perplexity AI",
        "categoria": "Pesquisa",
        "endpoint": "/api/trpc/perplexity.consultar"
      },
      {
        "id": 330003,
        "nome": "Analisar Website",
        "categoria": "Análise",
        "endpoint": "/api/deepsite/scrape"
      }
    ],
    "como_consultar": "SELECT * FROM skills WHERE id = [ID] ou WHERE nome LIKE '%[TERMO]%'"
  }
}
```

---

## ⚠️ QUANDO ME CONSULTAR

### **SEMPRE me consulte quando:**

1. ✅ **Tiver dúvida sobre alguma integração**
   - "Obsidian tem API?"
   - "Como usar Perplexity?"
   - "DeepSITE funciona?"

2. ✅ **Encontrar informação conflitante**
   - "Vi que Obsidian não tem API, mas o código sugere que tem"
   - "Documentação antiga diz X, mas preciso confirmar"

3. ✅ **Precisar de explicação atualizada**
   - "Qual a versão atual do projeto?"
   - "Quantos testes existem?"
   - "Performance está boa?"

4. ✅ **Quiser confirmar se algo é possível**
   - "Posso criar arquivos no Obsidian?"
   - "Posso fazer scraping de sites?"
   - "Posso consultar Perplexity?"

5. ✅ **Precisar de orientação técnica**
   - "Como implementar feature X?"
   - "Qual endpoint usar para Y?"
   - "Onde está a documentação de Z?"

### **NÃO precisa me consultar quando:**

- ❌ Informação está clara na documentação que você já leu
- ❌ Pergunta é sobre preferências do usuário
- ❌ Dúvida é sobre outra IA (pergunte diretamente a ela)

---

## 📊 ENDPOINT DE STATUS

### **GET /api/manus/status**

**URL:** `http://localhost:3000/api/manus/status`

**Resposta:**
```json
{
  "status": "online",
  "servico": "Manus Explicar",
  "descricao": "Endpoint para IAs consultarem informações atualizadas do projeto",
  "versao": "1.0.0",
  "ultima_atualizacao": "2025-11-24",
  "temas_disponiveis": [
    "obsidian",
    "perplexity",
    "deepsite",
    "genspark",
    "skills",
    "testes",
    "endpoints",
    "documentação",
    "performance",
    "banco de dados",
    "projeto geral"
  ]
}
```

**Quando usar:** Para verificar se o serviço está online antes de fazer perguntas.

---

## 🔄 FLUXO RECOMENDADO

### **Para QUALQUER IA que precise de informação:**

```
1. IDENTIFICAR DÚVIDA
   - O que preciso saber?
   - É sobre integração, skill, endpoint, etc.?

2. VERIFICAR STATUS (opcional)
   GET /api/manus/status
   - Serviço está online?

3. FAZER PERGUNTA
   POST /api/manus/explicar
   Body: {
     "pergunta": "[SUA_DUVIDA]",
     "ia_origem": "[SEU_NOME]"
   }

4. PROCESSAR RESPOSTA
   - Ler resumo
   - Ler resposta detalhada
   - Consultar documentação recomendada (se houver)

5. USAR INFORMAÇÃO
   - Aplicar conhecimento atualizado
   - Evitar erros
   - Garantir precisão

6. FEEDBACK (se necessário)
   - Se encontrou forma diferente de fazer algo
   - Se informação está desatualizada
   - Se descobriu nova possibilidade
   → Informar Rudson para ele me atualizar
```

---

## 💡 BOAS PRÁTICAS

### **1. Sempre identifique-se**
```json
{
  "ia_origem": "Comet AI"  // ✅ BOM
}
```

### **2. Seja específico na pergunta**
```json
{
  "pergunta": "Obsidian tem API?"  // ✅ BOM
}
```
vs
```json
{
  "pergunta": "Como fazer?"  // ❌ RUIM - muito vago
}
```

### **3. Forneça contexto quando relevante**
```json
{
  "pergunta": "Como criar arquivo no Obsidian?",
  "contexto": "Usuário pediu para criar checklist diária"  // ✅ BOM
}
```

### **4. Leia a documentação recomendada**
Se a resposta incluir `documentacao_recomendada`, leia os arquivos para informações completas.

### **5. Compartilhe descobertas**
Se você (IA) descobrir algo novo ou diferente, informe Rudson para que eu possa atualizar a base de conhecimento.

---

## 🎯 CASOS DE USO REAIS

### **Caso 1: Comet e o Erro "Obsidian não tem API"**

**Problema:** Comet disse "Obsidian não tem API" e não criou arquivos.

**Solução com Manus Explicar:**
1. Comet consulta: `POST /api/manus/explicar` com pergunta "Obsidian tem API?"
2. Manus responde: "SIM, API local via plugin, 100% funcional, use skill 330001"
3. Comet corrige: "Vou usar skill 330001 para criar o arquivo"
4. ✅ Problema resolvido

---

### **Caso 2: Abacus Precisa de Documentação**

**Problema:** Abacus não sabe onde está a documentação do projeto.

**Solução com Manus Explicar:**
1. Abacus consulta: `POST /api/manus/explicar` com pergunta "Onde está a documentação?"
2. Manus responde: Lista de 85 documentos, principais arquivos, localização
3. Abacus acessa: `/servidor-automacao/API_REFERENCE_COMET.md`
4. ✅ Documentação encontrada

---

### **Caso 3: Nova IA Precisa Entender o Projeto**

**Problema:** Nova IA não conhece o projeto.

**Solução com Manus Explicar:**
1. Nova IA consulta: `POST /api/manus/explicar` com pergunta "O que é este projeto?"
2. Manus responde: Visão geral completa, integrações, skills, endpoints
3. Nova IA entende: Sistema de automação com 5 integrações, 25 skills, 34 endpoints
4. ✅ Contexto adquirido

---

## 📋 CHECKLIST DE USO

**Antes de fazer uma pergunta a Manus:**

- [ ] Identifiquei minha dúvida claramente?
- [ ] Preparei a pergunta de forma específica?
- [ ] Vou me identificar (ia_origem)?
- [ ] Tenho contexto adicional para fornecer?
- [ ] Sei o que fazer com a resposta?

**Após receber a resposta:**

- [ ] Li o resumo?
- [ ] Li a resposta detalhada?
- [ ] Consultei documentação recomendada (se houver)?
- [ ] Entendi como aplicar a informação?
- [ ] Vou usar conhecimento atualizado?

---

## 🚨 IMPORTANTE

### **Garantias do Manus Explicar:**

1. ✅ **Informações sempre atualizadas** - Base de conhecimento reflete código real
2. ✅ **Respostas precisas** - Baseadas em testes e validações
3. ✅ **Documentação completa** - Links para arquivos detalhados
4. ✅ **Performance validada** - Métricas reais do sistema
5. ✅ **Sem alucinações** - Apenas fatos verificáveis

### **O que NÃO posso fazer:**

1. ❌ **Prever o futuro** - Não sei o que será implementado
2. ❌ **Ler pensamentos** - Preciso de perguntas claras
3. ❌ **Acessar APIs externas** - Apenas informações do projeto
4. ❌ **Tomar decisões** - Forneço informações, você decide

---

## 📞 CONTATO

**Quem sou:** Manus AI - Assistente que criou e mantém o projeto

**Como me consultar:** `POST /api/manus/explicar`

**Quando me consultar:** Sempre que tiver dúvida sobre o projeto

**Garantia:** Informações sempre atualizadas e precisas

---

## 🎯 RESUMO EXECUTIVO

**Para IAs (Comet, Abacus, etc.):**

1. ✅ Use `POST /api/manus/explicar` para fazer perguntas
2. ✅ Identifique-se com `ia_origem`
3. ✅ Seja específico na pergunta
4. ✅ Leia documentação recomendada
5. ✅ Use informações atualizadas
6. ✅ Evite erros como "Obsidian não tem API"
7. ✅ Compartilhe descobertas com Rudson

**Benefícios:**
- ⚡ Respostas rápidas
- 🎯 Informações precisas
- 📚 Documentação completa
- ✅ Evita erros
- 🚀 Aumenta produtividade

---

**Versão:** 1.0  
**Data:** 24/11/2025  
**Autor:** Manus AI  
**Status:** ✅ PRONTO PARA USO

---

**Use este sistema sempre que precisar de informações sobre o projeto!** 🎯
