# API Reference - Comet AI

## 🚨 PROTOCOLO OBRIGATÓRIO - LEIA PRIMEIRO!

**ANTES de usar QUALQUER endpoint desta API, você DEVE:**

1. ✅ **Consultar Manus PRIMEIRO** via `POST /api/manus/explicar`
2. ✅ **Ler a resposta COMPLETA**
3. ✅ **Seguir as instruções EXATAS**
4. ✅ **Reportar resultado via feedback** (se necessário)

**Documentação completa:** `/servidor-automacao/PROTOCOLO_OBRIGATORIO_COMET.md`

**Violações podem:**
- ❌ Colocar todo o projeto em risco
- ❌ Causar perda de dados
- ❌ Gerar retrabalho massivo

**Este protocolo é NÃO NEGOCIÁVEL.** 🚨

---rvidor de Automação (Para Comet)

**Data:** 24/11/2025  
**Versão:** 1.0  
**Base URL:** `http://localhost:3000`

---

## 🎯 INTRODUÇÃO

Este documento contém **TODAS as APIs** disponíveis no Servidor de Automação que você (Comet) pode usar para executar tarefas automaticamente.

**Regra de Ouro:** Sempre consulte a skill correspondente no banco de dados ANTES de usar qualquer API.

---

## 📚 SKILLS DISPONÍVEIS

### **Como Consultar Skills:**

```sql
-- Buscar skill específica por ID
SELECT * FROM skills WHERE id = 330001;

-- Buscar skills por categoria
SELECT * FROM skills WHERE categoria = 'Produtividade';

-- Buscar skills por nome
SELECT * FROM skills WHERE nome LIKE '%Obsidian%';

-- Listar todas as skills
SELECT id, nome, categoria FROM skills ORDER BY categoria, nome;
```

### **Skills Principais:**

| ID | Nome | Categoria | Endpoint Principal |
|---|---|---|---|
| 330001 | Criar Arquivo no Obsidian | Produtividade | `/api/trpc/obsidian.gerarScriptCriacao` |
| 330002 | Consultar Perplexity AI | Pesquisa | `/api/trpc/perplexity.consultar` |
| 330003 | Analisar Website | Análise | `/api/deepsite/scrape` |

---

## 🗂️ CATEGORIA 1: OBSIDIAN

### **Skill 330001 - Criar Arquivo no Obsidian**

**Quando usar:** Usuário pede para criar nota, checklist, OKR, ou qualquer arquivo markdown no Obsidian.

#### **Endpoint Principal:**

```
POST /api/trpc/obsidian.gerarScriptCriacao
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "json": {
    "nomeArquivo": "2025-11-24-checklist.md",
    "conteudo": "# Checklist\n\n- [ ] Tarefa 1\n- [ ] Tarefa 2",
    "caminho": "daily-notes",
    "apiKey": "9158ad0eb1c3be5ba7ac1b743c4404e9ebc25464ef88f9bec0bc07528e0b2383",
    "porta": 27123,
    "usarHttps": false
  }
}
```

**Parâmetros:**
- `nomeArquivo` (obrigatório): Nome do arquivo (deve terminar com `.md`)
- `conteudo` (obrigatório): Conteúdo markdown do arquivo
- `apiKey` (obrigatório): Chave da API Local REST do Obsidian
- `caminho` (opcional): Caminho relativo no vault (ex: "projetos/2025")
- `porta` (opcional): Porta da API (padrão: 27123)
- `usarHttps` (opcional): Usar HTTPS (padrão: false)

**Resposta de Sucesso (200):**
```json
{
  "result": {
    "data": {
      "json": {
        "sucesso": true,
        "arquivoFinal": "daily-notes/2025-11-24-checklist.md",
        "scripts": {
          "python": "#!/usr/bin/env python3\n...",
          "powershell": "# Script PowerShell..."
        },
        "instrucoes": {
          "windows": ["passo 1", "passo 2"],
          "linux_mac": ["passo 1", "passo 2"]
        },
        "observacoes": ["aviso 1", "aviso 2"]
      }
    }
  }
}
```

**Como Processar:**
1. Extrair `scripts.python` da resposta
2. Salvar em arquivo temporário
3. Informar usuário para executar: `python criar_arquivo.py`
4. Aguardar confirmação do usuário

**Exemplo de Uso:**
```
Usuário: "Comet, crie uma checklist diária no Obsidian"

Você:
1. Consulta skill 330001
2. Gera conteúdo markdown de checklist
3. Chama POST /api/trpc/obsidian.gerarScriptCriacao
4. Extrai script Python da resposta
5. Informa usuário: "Execute este script para criar o arquivo"
```

---

#### **Endpoint de Teste:**

```
POST /api/trpc/obsidian.criarArquivoTesteComet
```

**Body:**
```json
{
  "json": {
    "apiKey": "9158ad0eb1c3be5ba7ac1b743c4404e9ebc25464ef88f9bec0bc07528e0b2383",
    "porta": 27123,
    "usarHttps": false
  }
}
```

**Quando usar:** Para testar rapidamente a integração Obsidian. Cria arquivo "08_TESTE_Comet_Manus.md" automaticamente.

---

## 🔍 CATEGORIA 2: PERPLEXITY AI

### **Skill 330002 - Consultar Perplexity AI**

**Quando usar:** Usuário pede pesquisa online, informações atualizadas, ou consulta que requer busca na internet.

#### **Endpoint Principal:**

```
POST /api/trpc/perplexity.consultar
```

**Body:**
```json
{
  "json": {
    "mensagem": "Qual é a capital do Brasil?",
    "modelo": "llama-3.1-sonar-small-128k-online",
    "apiKey": "[API_KEY_DO_USUARIO]"
  }
}
```

**Parâmetros:**
- `mensagem` (obrigatório): Pergunta ou consulta
- `modelo` (opcional): Modelo a usar (padrão: llama-3.1-sonar-small-128k-online)
- `apiKey` (obrigatório): Chave da API Perplexity

**Modelos Disponíveis:**
- `llama-3.1-sonar-small-128k-online` (rápido, econômico)
- `llama-3.1-sonar-large-128k-online` (balanceado)
- `llama-3.1-sonar-huge-128k-online` (mais preciso, mais lento)

**Resposta de Sucesso (200):**
```json
{
  "result": {
    "data": {
      "json": {
        "sucesso": true,
        "resposta": "A capital do Brasil é Brasília.",
        "modelo": "llama-3.1-sonar-small-128k-online",
        "tokens": 150
      }
    }
  }
}
```

**Exemplo de Uso:**
```
Usuário: "Comet, pesquise sobre inteligência artificial"

Você:
1. Consulta skill 330002
2. Chama POST /api/trpc/perplexity.consultar
3. Extrai resposta
4. Retorna ao usuário: "Encontrei as seguintes informações: [resposta]"
```

---

#### **Endpoint de Teste:**

```
POST /api/trpc/perplexity.testarConexao
```

**Body:**
```json
{
  "json": {
    "apiKey": "[API_KEY_DO_USUARIO]"
  }
}
```

**Quando usar:** Para validar se a API key do Perplexity está funcionando.

---

## 🌐 CATEGORIA 3: WEB SCRAPING (DeepSITE)

### **Skill 330003 - Analisar Website**

**Quando usar:** Usuário pede para extrair informações de um site, analisar conteúdo web, ou fazer scraping.

#### **Endpoint 1: Scraping Simples**

```
POST /api/deepsite/scrape
```

**Body:**
```json
{
  "url": "https://example.com",
  "options": {
    "waitForSelector": "body",
    "timeout": 30000
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Example Domain",
    "content": "This domain is for use in illustrative examples...",
    "html": "<html>...</html>",
    "metadata": {
      "description": "Example domain",
      "keywords": "example, domain"
    }
  },
  "cached": false,
  "timestamp": "2025-11-24T02:00:00.000Z"
}
```

---

#### **Endpoint 2: Análise com IA**

```
POST /api/deepsite/analyze
```

**Body:**
```json
{
  "url": "https://example.com",
  "prompt": "Resuma o conteúdo principal deste site"
}
```

**Resposta:**
```json
{
  "success": true,
  "analysis": {
    "summary": "Este site é um exemplo de domínio...",
    "keyPoints": ["Ponto 1", "Ponto 2"],
    "sentiment": "neutral"
  }
}
```

---

#### **Endpoint 3: Validação de URL**

```
POST /api/deepsite/validate-url
```

**Body:**
```json
{
  "url": "https://example.com"
}
```

**Resposta:**
```json
{
  "valid": true,
  "url": "https://example.com",
  "protocol": "https",
  "domain": "example.com"
}
```

**Quando usar:** Antes de fazer scraping, para validar se a URL é válida.

---

## 📁 CATEGORIA 4: BUSCA LOCAL DE ARQUIVOS

### **Endpoint 1: Gerar Script de Busca**

```
POST /api/busca-local/gerar-script
```

**Body:**
```json
{
  "nomeArquivo": "documento.pdf",
  "lerConteudo": true,
  "drives": ["C:", "D:"],
  "extensoes": [".pdf", ".docx"]
}
```

**Parâmetros:**
- `nomeArquivo` (opcional): Nome do arquivo a buscar
- `lerConteudo` (opcional): Se deve ler conteúdo (padrão: false)
- `drives` (opcional): Drives a buscar (padrão: todos)
- `extensoes` (opcional): Extensões a filtrar

**Resposta:**
```json
{
  "sucesso": true,
  "scripts": {
    "python": "#!/usr/bin/env python3\n...",
    "powershell": "# Script PowerShell..."
  },
  "instrucoes": {
    "windows": ["passo 1", "passo 2"],
    "linux_mac": ["passo 1", "passo 2"]
  }
}
```

**Como Processar:**
1. Extrair script Python ou PowerShell
2. Informar usuário para executar localmente
3. Aguardar resultado da execução
4. Processar resultado com endpoint abaixo

---

### **Endpoint 2: Processar Resultado**

```
POST /api/busca-local/processar-resultado
```

**Body:**
```json
{
  "resultado": "[JSON retornado pelo script]"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "arquivosEncontrados": 5,
  "arquivos": [
    {
      "caminho": "C:/Users/Rudson/documento.pdf",
      "tamanho": 1024000,
      "dataModificacao": "2025-11-24"
    }
  ]
}
```

---

## 🤖 CATEGORIA 5: MANUS EXPLICAR (Consulta Inteligente)

### **Endpoint 1: Consultar Manus AI**

```
POST /api/manus/explicar
```

**Quando usar:** Quando você (Comet ou outra IA) tiver QUALQUER dúvida sobre o projeto, integrações, skills, endpoints, etc.

**Body:**
```json
{
  "pergunta": "Sua pergunta aqui",
  "contexto": "Contexto adicional (opcional)",
  "ia_origem": "Comet AI"
}
```

**Exemplo:**
```json
{
  "pergunta": "Obsidian tem API?",
  "ia_origem": "Comet AI"
}
```

**Resposta:**
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
    "endpoints": [...],
    "como_usar": "..."
  },
  "documentacao_recomendada": [...],
  "contato_manus": {...}
}
```

**Temas disponíveis:**
- obsidian
- perplexity
- deepsite
- genspark
- skills
- testes
- endpoints
- documentação
- performance
- banco de dados
- projeto geral

**Por que usar:**
- ✅ Evita informações desatualizadas
- ✅ Previne erros como "Obsidian não tem API"
- ✅ Garante precisão técnica
- ✅ Economiza tempo de pesquisa
- ✅ Acesso a conhecimento sempre atualizado

**Documentação completa:** `/servidor-automacao/GUIA_IAS_CONSULTAR_MANUS.md`

---

### **Endpoint 2: Status do Manus Explicar**

```
GET /api/manus/status
```

**Resposta:**
```json
{
  "status": "online",
  "servico": "Manus Explicar",
  "versao": "1.0.0",
  "temas_disponiveis": [...]
}
```

---

## 🛡️ CATEGORIA 6: SISTEMA (Interno)

### **Endpoint 1: Status do Sistema**

```
GET /api/status
```

**Resposta:**
```json
{
  "status": "online",
  "versao": "1.0.0",
  "requisicoes": 12,
  "errosCorrigidos": 0
}
```

---

### **Endpoint 2: Executar Tarefa**

```
POST /api/executar
```

**Body:**
```json
{
  "tarefa": "Criar checklist no Obsidian",
  "navegador": "chrome"
}
```

**Uso Interno:** Para registrar execução de tarefas.

---

### **Endpoint 3: Histórico**

```
GET /api/historico
```

**Resposta:**
```json
{
  "conversas": [
    {
      "id": 1,
      "tipo": "usuario",
      "mensagem": "Crie uma checklist",
      "createdAt": "2025-11-24T02:00:00.000Z"
    }
  ]
}
```

---

## 🔑 CATEGORIA 6: SKILLS (Gerenciamento)

### **Endpoint 1: Listar Skills**

```
GET /api/skills
```

**Resposta:**
```json
{
  "skills": [
    {
      "id": 330001,
      "nome": "Criar Arquivo no Obsidian",
      "categoria": "Produtividade",
      "autonomiaNivel": "alta"
    }
  ]
}
```

---

### **Endpoint 2: Criar Skill**

```
POST /api/skills
```

**Body:**
```json
{
  "nome": "Nova Skill",
  "descricao": "Descrição da skill",
  "instrucoes": "Instruções detalhadas",
  "exemplo": "Exemplo de uso",
  "tags": "tag1,tag2",
  "categoria": "Produtividade",
  "autonomiaNivel": "media"
}
```

---

### **Endpoint 3: Skills por Categoria**

```
GET /api/skills/categoria/Produtividade
```

**Resposta:**
```json
{
  "categoria": "Produtividade",
  "total": 2,
  "skills": [...]
}
```

---

## 🎯 FLUXOS COMPLETOS

### **Fluxo 1: Criar Checklist no Obsidian**

```
1. Usuário: "Comet, crie uma checklist diária no Obsidian"

2. Você consulta skill:
   SELECT * FROM skills WHERE id = 330001;

3. Você gera conteúdo:
   # Checklist - 24/11/2025
   - [ ] Tarefa 1
   - [ ] Tarefa 2

4. Você chama API:
   POST /api/trpc/obsidian.gerarScriptCriacao
   Body: {
     "json": {
       "nomeArquivo": "2025-11-24-checklist.md",
       "conteudo": "[conteúdo acima]",
       "caminho": "daily-notes",
       "apiKey": "9158ad0eb1c3be5ba7ac1b743c4404e9ebc25464ef88f9bec0bc07528e0b2383",
       "porta": 27123,
       "usarHttps": false
     }
   }

5. Você processa resposta:
   - Extrai scripts.python
   - Salva em arquivo temporário

6. Você informa usuário:
   "✅ Script gerado! Execute: python criar_checklist.py"

7. Usuário executa e confirma:
   "Executei, arquivo criado!"

8. Você registra sucesso:
   "✅ Checklist criada com sucesso em daily-notes/2025-11-24-checklist.md"
```

---

### **Fluxo 2: Pesquisar com Perplexity**

```
1. Usuário: "Comet, pesquise sobre IA"

2. Você consulta skill:
   SELECT * FROM skills WHERE id = 330002;

3. Você chama API:
   POST /api/trpc/perplexity.consultar
   Body: {
     "json": {
       "mensagem": "O que é inteligência artificial?",
       "modelo": "llama-3.1-sonar-small-128k-online",
       "apiKey": "[API_KEY]"
     }
   }

4. Você processa resposta:
   - Extrai result.data.json.resposta

5. Você retorna ao usuário:
   "Encontrei: [resposta do Perplexity]"
```

---

### **Fluxo 3: Analisar Website**

```
1. Usuário: "Comet, analise o site example.com"

2. Você consulta skill:
   SELECT * FROM skills WHERE id = 330003;

3. Você valida URL:
   POST /api/deepsite/validate-url
   Body: { "url": "https://example.com" }

4. Você faz scraping:
   POST /api/deepsite/scrape
   Body: { "url": "https://example.com" }

5. Você analisa com IA:
   POST /api/deepsite/analyze
   Body: {
     "url": "https://example.com",
     "prompt": "Resuma o conteúdo principal"
   }

6. Você retorna análise:
   "Análise do site: [summary]"
```

---

## ⚠️ TRATAMENTO DE ERROS

### **Erro 1: API Key Inválida**

**Resposta (401):**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "API key inválida"
  }
}
```

**Como tratar:**
```
"⚠️ API key inválida. Por favor, configure a chave correta em /configuracoes/ias"
```

---

### **Erro 2: Parâmetro Obrigatório Faltando**

**Resposta (400):**
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Parâmetro 'nomeArquivo' é obrigatório"
  }
}
```

**Como tratar:**
```
"⚠️ Erro: Falta informação obrigatória. Verifique os parâmetros."
```

---

### **Erro 3: Serviço Indisponível**

**Resposta (503):**
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Obsidian não está aberto"
  }
}
```

**Como tratar:**
```
"⚠️ Obsidian não está aberto. Por favor:
1. Abra o Obsidian
2. Verifique se o plugin 'Local REST API' está ativo
3. Tente novamente"
```

---

## 📋 CHECKLIST DE USO

**Antes de chamar qualquer API:**

- [ ] Consultei a skill correspondente no banco?
- [ ] Li as instruções da skill (13 seções)?
- [ ] Validei os parâmetros obrigatórios?
- [ ] Preparei o conteúdo apropriado (se aplicável)?
- [ ] Sei como processar a resposta?
- [ ] Sei como tratar erros comuns?

**Se respondeu NÃO para qualquer item, PARE e faça isso PRIMEIRO.**

---

## 🎯 RESUMO

**Total de Endpoints:** 34+

**Categorias:**
1. Obsidian (8 endpoints)
2. Perplexity (2 endpoints)
3. DeepSITE (9 endpoints)
4. Busca Local (2 endpoints)
5. Sistema (5 endpoints)
6. Skills (3 endpoints)
7. Integração (4 endpoints)

**Skills Principais:**
- 330001 - Criar Arquivo no Obsidian
- 330002 - Consultar Perplexity AI
- 330003 - Analisar Website

**Regra de Ouro:**
> Sempre consulte a skill no banco ANTES de usar a API

---

**Versão:** 1.0  
**Data:** 24/11/2025  
**Próxima Atualização:** Quando novos endpoints forem adicionados

---

**Comet, use esta referência sempre que precisar chamar uma API!** 🎯
