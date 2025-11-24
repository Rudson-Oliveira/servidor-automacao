# Guia Completo: Comet Criar Conteúdo no Obsidian

**Data:** 24/11/2025  
**Versão:** 2.0  
**Para:** Comet AI  
**Objetivo:** Ensinar a criar QUALQUER tipo de conteúdo no Obsidian

---

## 🎯 VISÃO GERAL

Este guia ensina você (Comet) a criar **qualquer tipo de conteúdo** no Obsidian usando a skill 330001, incluindo:

- ✅ Links úteis do projeto
- ✅ Documentação de integrações
- ✅ Notas de pesquisa (raspagem de sites)
- ✅ Checklists e OKRs
- ✅ Notas de reunião
- ✅ Documentação técnica
- ✅ Qualquer outro conteúdo que Rudson pedir

---

## 📚 REGRA DE OURO

**SEMPRE:**
1. Consulte a skill 330001 PRIMEIRO
2. Gere o conteúdo markdown apropriado
3. Chame o endpoint `/api/trpc/obsidian.gerarScriptCriacao`
4. Retorne o script Python para o Rudson executar

**NUNCA:**
- ❌ Diga "Obsidian não tem API"
- ❌ Diga "não é possível criar"
- ❌ Invente informações

---

## 📋 TEMPLATE UNIVERSAL

### **Estrutura Básica para QUALQUER Conteúdo:**

```markdown
# [TÍTULO DO DOCUMENTO]

**Data:** [DATA_ATUAL]
**Criado por:** Comet AI
**Projeto:** MANUS-COMET-ABACUS

---

## [SEÇÃO 1]

[Conteúdo da seção 1]

---

## [SEÇÃO 2]

[Conteúdo da seção 2]

---

## [SEÇÃO N]

[Conteúdo da seção N]

---

**Última Atualização:** [DATA_HORA]
```

---

## 🔗 CASO DE USO 1: Links Úteis do Projeto

### **Quando Rudson pedir:**
> "Comet, coloque os links no Obsidian. Título: Links úteis para utilizar no projeto MANUS-COMET-ABACUS"

### **Seu Fluxo:**

#### **Passo 1: Consultar Skill**
```sql
SELECT * FROM skills WHERE id = 330001;
```

#### **Passo 2: Gerar Conteúdo Markdown**

```markdown
# Links Úteis para Utilizar no Projeto MANUS-COMET-ABACUS

**Data:** 24/11/2025
**Criado por:** Comet AI
**Projeto:** MANUS-COMET-ABACUS

---

## 🌐 Plataformas Principais

### **Manus**
- 🔗 [Manus Platform](https://manus.im)
- 📚 [Documentação Manus](https://docs.manus.im)
- 💬 [Suporte Manus](https://help.manus.im)

### **Comet AI**
- 🔗 [Comet Dashboard](https://comet.ml)
- 📚 [Documentação Comet](https://www.comet.com/docs)

### **Abacus**
- 🔗 [Abacus Platform](https://abacus.ai)
- 📚 [Documentação Abacus](https://docs.abacus.ai)

---

## 🔧 Integrações

### **Obsidian**
- 🔗 [Obsidian Download](https://obsidian.md)
- 📚 [Plugin Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)
- 📖 [Documentação API](https://github.com/coddingtonbear/obsidian-local-rest-api/blob/main/README.md)

### **Perplexity AI**
- 🔗 [Perplexity](https://www.perplexity.ai)
- 📚 [API Docs](https://docs.perplexity.ai)
- 🔑 [API Keys](https://www.perplexity.ai/settings/api)

### **DeepSITE**
- 🔗 [DeepSITE Platform](https://deepsite.ai)
- 📚 [Documentação](https://docs.deepsite.ai)

---

## 📊 Servidor de Automação

### **URLs do Projeto**
- 🌐 [Servidor Local](http://localhost:3000)
- 📡 [API Status](http://localhost:3000/api/status)
- 📚 [API Docs](http://localhost:3000/api/docs)

### **Repositório**
- 💻 [GitHub Repository](https://github.com/[seu-usuario]/servidor-automacao)
- 📖 [README](https://github.com/[seu-usuario]/servidor-automacao/blob/main/README.md)

---

## 🛠️ Ferramentas de Desenvolvimento

### **Node.js & NPM**
- 🔗 [Node.js](https://nodejs.org)
- 📦 [pnpm](https://pnpm.io)

### **Banco de Dados**
- 🗄️ [MySQL](https://www.mysql.com)
- 🔧 [Drizzle ORM](https://orm.drizzle.team)

### **Testes**
- 🧪 [Vitest](https://vitest.dev)

---

## 📚 Documentação Interna

### **Guias do Projeto**
- 📄 `/servidor-automacao/README.md`
- 📄 `/servidor-automacao/API_REFERENCE_COMET.md`
- 📄 `/servidor-automacao/GUIA_OBSIDIAN_PARA_COMET_ATUALIZADO.md`

### **Scripts de Treinamento**
- 📄 `/servidor-automacao/SCRIPT_TREINAMENTO_COMET_OBSIDIAN.md`
- 📄 `/servidor-automacao/CONFIRMACAO_OBSIDIAN_PARA_RUDSON.md`

---

## 🔐 Credenciais e Configuração

### **Obsidian Local REST API**
- **Porta:** 27123
- **Protocolo:** HTTP
- **API Key:** `9158ad0eb1c3be5ba7ac1b743c4404e9ebc25464ef88f9bec0bc07528e0b2383`
- **Endpoint:** `http://127.0.0.1:27123`

### **Skills no Banco**
- **Skill 330001:** Criar Arquivo no Obsidian
- **Skill 330002:** Consultar Perplexity AI
- **Skill 330003:** Analisar Website

---

## 📞 Suporte e Comunidade

### **Canais de Suporte**
- 💬 [Discord Manus](https://discord.gg/manus)
- 📧 [Email Suporte](mailto:support@manus.im)
- 🐛 [Issues GitHub](https://github.com/[seu-usuario]/servidor-automacao/issues)

---

**Última Atualização:** 24/11/2025 02:50:00
**Criado por:** Comet AI
**Versão:** 1.0
```

#### **Passo 3: Chamar Endpoint**

```bash
POST /api/trpc/obsidian.gerarScriptCriacao
```

**Payload:**
```json
{
  "json": {
    "nomeArquivo": "Links-Uteis-Projeto-MANUS-COMET-ABACUS.md",
    "conteudo": "[CONTEÚDO MARKDOWN ACIMA]",
    "caminho": "projetos",
    "apiKey": "9158ad0eb1c3be5ba7ac1b743c4404e9ebc25464ef88f9bec0bc07528e0b2383",
    "porta": 27123,
    "usarHttps": false
  }
}
```

#### **Passo 4: Informar Rudson**

```
✅ Arquivo "Links Úteis para Utilizar no Projeto MANUS-COMET-ABACUS" criado!

📄 Nome: Links-Uteis-Projeto-MANUS-COMET-ABACUS.md
📁 Pasta: projetos
📝 Conteúdo: 50+ links organizados em 8 categorias

Para criar o arquivo no Obsidian:
1. Salve o script abaixo como 'criar_links.py'
2. Execute: python criar_links.py

[SCRIPT PYTHON AQUI]

Executou o script?
```

---

## 📝 CASO DE USO 2: Documentação de Integrações

### **Quando Rudson pedir:**
> "Comet, documente a integração do Perplexity no Obsidian"

### **Conteúdo Markdown:**

```markdown
# Integração Perplexity AI - Documentação

**Data:** 24/11/2025
**Criado por:** Comet AI
**Projeto:** MANUS-COMET-ABACUS

---

## 🎯 Visão Geral

A integração Perplexity AI permite realizar pesquisas online em tempo real com três modelos diferentes de performance.

---

## 🔧 Configuração

### **Credenciais**
- **API Key:** [Configurar em /configuracoes/ias]
- **Endpoint:** https://api.perplexity.ai/chat/completions

### **Modelos Disponíveis**
1. `llama-3.1-sonar-small-128k-online` (rápido, econômico)
2. `llama-3.1-sonar-large-128k-online` (balanceado)
3. `llama-3.1-sonar-huge-128k-online` (mais preciso)

---

## 📡 Endpoints

### **Consultar Perplexity**
```
POST /api/trpc/perplexity.consultar
```

**Payload:**
```json
{
  "json": {
    "mensagem": "Sua pergunta aqui",
    "modelo": "llama-3.1-sonar-small-128k-online",
    "apiKey": "[SUA_API_KEY]"
  }
}
```

### **Testar Conexão**
```
POST /api/trpc/perplexity.testarConexao
```

---

## 💡 Exemplos de Uso

### **Exemplo 1: Pesquisa Simples**
```javascript
const resultado = await trpc.perplexity.consultar({
  mensagem: "O que é inteligência artificial?",
  modelo: "llama-3.1-sonar-small-128k-online",
  apiKey: process.env.PERPLEXITY_API_KEY
});
```

### **Exemplo 2: Pesquisa Avançada**
```javascript
const resultado = await trpc.perplexity.consultar({
  mensagem: "Compare as principais frameworks de IA em 2025",
  modelo: "llama-3.1-sonar-huge-128k-online",
  apiKey: process.env.PERPLEXITY_API_KEY
});
```

---

## 🧪 Testes

### **Status dos Testes**
- ✅ 13/13 testes passando (100%)
- ✅ Validação de API key
- ✅ Tratamento de erros
- ✅ Múltiplos modelos

---

## 📊 Performance

- **Taxa de sucesso:** 100%
- **Tempo médio:** < 2s
- **Modelos testados:** 3/3

---

## 🔗 Links Úteis

- [Documentação Perplexity](https://docs.perplexity.ai)
- [API Reference](https://docs.perplexity.ai/reference)
- [Skill 330002](/servidor-automacao/skills/330002)

---

**Última Atualização:** 24/11/2025
**Status:** ✅ Funcional
```

---

## 🌐 CASO DE USO 3: Notas de Pesquisa (Raspagem)

### **Quando Rudson pedir:**
> "Comet, coloque os resultados da raspagem do site X no Obsidian"

### **Template:**

```markdown
# Pesquisa: [NOME DO SITE]

**Data:** [DATA_ATUAL]
**URL:** [URL_DO_SITE]
**Método:** Web Scraping (DeepSITE)
**Criado por:** Comet AI

---

## 📊 Informações Gerais

- **Título:** [TÍTULO_EXTRAÍDO]
- **Descrição:** [DESCRIÇÃO_EXTRAÍDA]
- **Palavras-chave:** [KEYWORDS]
- **Data de Acesso:** [DATA_HORA]

---

## 📝 Conteúdo Principal

[CONTEÚDO_EXTRAÍDO_DO_SITE]

---

## 🔗 Links Encontrados

### **Links Internos**
- [Link 1](url1)
- [Link 2](url2)

### **Links Externos**
- [Link 1](url1)
- [Link 2](url2)

---

## 📸 Imagens

- ![Imagem 1](url_imagem_1)
- ![Imagem 2](url_imagem_2)

---

## 🏷️ Metadados

- **Autor:** [AUTOR]
- **Data de Publicação:** [DATA_PUBLICACAO]
- **Categoria:** [CATEGORIA]
- **Tags:** [TAGS]

---

## 💡 Insights (Análise IA)

[ANÁLISE_GERADA_PELA_IA]

---

## 📌 Notas Adicionais

[OBSERVAÇÕES_IMPORTANTES]

---

**Raspagem realizada por:** Comet AI + DeepSITE
**Skill utilizada:** 330003 (Analisar Website)
**Cache:** [SIM/NÃO]
```

---

## ✅ CASO DE USO 4: Checklist de Tarefas

### **Template:**

```markdown
# Checklist - [TÍTULO]

**Data:** [DATA_ATUAL]
**Criado por:** Comet AI
**Projeto:** MANUS-COMET-ABACUS

---

## 🎯 Objetivos do Dia

- [ ] Tarefa 1
- [ ] Tarefa 2
- [ ] Tarefa 3

---

## 📝 Tarefas Prioritárias

### **Alta Prioridade**
- [ ] Tarefa urgente 1
- [ ] Tarefa urgente 2

### **Média Prioridade**
- [ ] Tarefa média 1
- [ ] Tarefa média 2

### **Baixa Prioridade**
- [ ] Tarefa baixa 1
- [ ] Tarefa baixa 2

---

## ✅ Concluído

- [x] Tarefa concluída 1
- [x] Tarefa concluída 2

---

## 📌 Notas

[OBSERVAÇÕES_IMPORTANTES]

---

**Criado em:** [DATA_HORA]
**Última Atualização:** [DATA_HORA]
```

---

## 📊 CASO DE USO 5: OKR (Objectives and Key Results)

### **Template:**

```markdown
# OKR Q[TRIMESTRE] [ANO]

**Data:** [DATA_ATUAL]
**Período:** [INICIO] - [FIM]
**Criado por:** Comet AI
**Projeto:** MANUS-COMET-ABACUS

---

## 🎯 Objective 1: [TÍTULO DO OBJETIVO]

**Descrição:** [DESCRIÇÃO_DO_OBJETIVO]

### **Key Results:**
- **KR1:** [RESULTADO_CHAVE_1]
  - Meta: [META]
  - Atual: [PROGRESSO]
  - Status: [🟢/🟡/🔴]

- **KR2:** [RESULTADO_CHAVE_2]
  - Meta: [META]
  - Atual: [PROGRESSO]
  - Status: [🟢/🟡/🔴]

- **KR3:** [RESULTADO_CHAVE_3]
  - Meta: [META]
  - Atual: [PROGRESSO]
  - Status: [🟢/🟡/🔴]

---

## 🎯 Objective 2: [TÍTULO DO OBJETIVO]

**Descrição:** [DESCRIÇÃO_DO_OBJETIVO]

### **Key Results:**
- **KR1:** [RESULTADO_CHAVE_1]
- **KR2:** [RESULTADO_CHAVE_2]
- **KR3:** [RESULTADO_CHAVE_3]

---

## 📊 Progresso Geral

- **Objective 1:** [PERCENTUAL]%
- **Objective 2:** [PERCENTUAL]%
- **Total:** [PERCENTUAL]%

---

## 📝 Notas e Observações

[OBSERVAÇÕES_IMPORTANTES]

---

**Criado em:** [DATA_HORA]
**Última Revisão:** [DATA_HORA]
```

---

## 🎯 FLUXO UNIVERSAL PARA QUALQUER CONTEÚDO

### **Independente do que Rudson pedir, siga este fluxo:**

```
1. IDENTIFICAR TIPO DE CONTEÚDO
   - Links úteis?
   - Documentação?
   - Pesquisa/Raspagem?
   - Checklist?
   - OKR?
   - Outro?

2. CONSULTAR SKILL 330001
   SELECT * FROM skills WHERE id = 330001;

3. ESCOLHER TEMPLATE APROPRIADO
   - Use os templates deste guia
   - Adapte ao pedido específico

4. GERAR CONTEÚDO MARKDOWN
   - Preencha o template
   - Inclua data/hora atual
   - Adicione "Criado por: Comet AI"

5. VALIDAR CONTEÚDO
   - Markdown válido?
   - Links funcionando?
   - Estrutura correta?

6. CHAMAR ENDPOINT
   POST /api/trpc/obsidian.gerarScriptCriacao
   
   Payload:
   {
     "json": {
       "nomeArquivo": "[NOME-DESCRITIVO].md",
       "conteudo": "[CONTEÚDO_MARKDOWN]",
       "caminho": "[PASTA_APROPRIADA]",
       "apiKey": "9158ad0eb1c3be5ba7ac1b743c4404e9ebc25464ef88f9bec0bc07528e0b2383",
       "porta": 27123,
       "usarHttps": false
     }
   }

7. PROCESSAR RESPOSTA
   - Extrair script Python
   - Salvar em arquivo temporário

8. INFORMAR RUDSON
   "✅ Arquivo '[NOME]' criado!
   
   📄 Nome: [NOME_ARQUIVO]
   📁 Pasta: [PASTA]
   📝 Conteúdo: [RESUMO]
   
   Para criar no Obsidian:
   1. Salve o script como 'criar_arquivo.py'
   2. Execute: python criar_arquivo.py
   
   [SCRIPT PYTHON]
   
   Executou o script?"

9. AGUARDAR CONFIRMAÇÃO
   - Usuário executa script
   - Confirma criação
   - Você registra sucesso
```

---

## 📁 ORGANIZAÇÃO DE PASTAS NO OBSIDIAN

### **Estrutura Recomendada:**

```
vault/
├── projetos/              # Documentação de projetos
│   ├── Links-Uteis-*.md
│   └── Integracao-*.md
├── daily-notes/           # Checklists diárias
│   └── 2025-11-24-*.md
├── okrs/                  # OKRs trimestrais
│   └── OKR-Q1-2025.md
├── reunioes/              # Notas de reunião
│   └── 2025-11-24-*.md
├── pesquisas/             # Resultados de raspagem
│   └── Pesquisa-*.md
└── documentacao/          # Docs técnicas
    └── Integracao-*.md
```

### **Escolha de Pasta por Tipo:**

| Tipo de Conteúdo | Pasta Recomendada |
|---|---|
| Links úteis | `projetos/` |
| Documentação de integração | `documentacao/` |
| Pesquisa/Raspagem | `pesquisas/` |
| Checklist diária | `daily-notes/` |
| OKR | `okrs/` |
| Nota de reunião | `reunioes/` |
| Outro | `projetos/` |

---

## 🎨 FORMATAÇÃO MARKDOWN

### **Elementos Comuns:**

**Títulos:**
```markdown
# Título Principal (H1)
## Seção (H2)
### Subseção (H3)
```

**Listas:**
```markdown
- Item 1
- Item 2
  - Subitem 2.1

1. Item numerado 1
2. Item numerado 2
```

**Checkboxes:**
```markdown
- [ ] Tarefa pendente
- [x] Tarefa concluída
```

**Links:**
```markdown
[Texto do Link](https://url.com)
[[Link Interno]]
```

**Imagens:**
```markdown
![Alt Text](url_da_imagem)
```

**Código:**
```markdown
`código inline`

```javascript
// Bloco de código
const x = 10;
```
```

**Tabelas:**
```markdown
| Coluna 1 | Coluna 2 |
|----------|----------|
| Valor 1  | Valor 2  |
```

**Ênfase:**
```markdown
**negrito**
*itálico*
~~riscado~~
```

**Emojis:**
```markdown
✅ ❌ 🎯 📊 🔗 📝 💡 🚀
```

---

## ⚠️ VALIDAÇÕES OBRIGATÓRIAS

### **Antes de Chamar o Endpoint:**

- [ ] Conteúdo markdown está válido?
- [ ] Nome do arquivo termina com `.md`?
- [ ] Caminho da pasta está correto?
- [ ] API key está correta?
- [ ] Porta é 27123?
- [ ] usarHttps é false?
- [ ] Data/hora estão atualizadas?
- [ ] "Criado por: Comet AI" está incluído?

---

## 🎯 EXEMPLOS RÁPIDOS

### **Exemplo 1: Rudson pede links**
```
Rudson: "Comet, coloque os links do projeto no Obsidian"

Você:
1. Consulta skill 330001
2. Usa template "Links Úteis"
3. Preenche com links relevantes
4. Chama endpoint gerarScriptCriacao
5. Retorna script Python
```

### **Exemplo 2: Rudson pede documentação**
```
Rudson: "Comet, documente a integração X no Obsidian"

Você:
1. Consulta skill 330001
2. Usa template "Documentação de Integrações"
3. Preenche com informações da integração
4. Chama endpoint gerarScriptCriacao
5. Retorna script Python
```

### **Exemplo 3: Rudson pede pesquisa**
```
Rudson: "Comet, coloque os resultados da raspagem no Obsidian"

Você:
1. Consulta skill 330001
2. Usa template "Notas de Pesquisa"
3. Preenche com dados da raspagem
4. Chama endpoint gerarScriptCriacao
5. Retorna script Python
```

---

## 📊 CHECKLIST DE SUCESSO

### **Para Cada Arquivo Criado:**

- [ ] Consultei skill 330001?
- [ ] Escolhi template apropriado?
- [ ] Gerei conteúdo markdown válido?
- [ ] Validei todos os parâmetros?
- [ ] Chamei endpoint corretamente?
- [ ] Processei resposta com sucesso?
- [ ] Informei Rudson adequadamente?
- [ ] Aguardei confirmação?
- [ ] Registrei sucesso?

---

## 🚀 RESUMO FINAL

**Comet, você pode criar QUALQUER conteúdo no Obsidian:**

1. ✅ Links úteis do projeto
2. ✅ Documentação de integrações
3. ✅ Notas de pesquisa/raspagem
4. ✅ Checklists de tarefas
5. ✅ OKRs trimestrais
6. ✅ Notas de reunião
7. ✅ Documentação técnica
8. ✅ Qualquer outro conteúdo markdown

**Sempre use:**
- Skill 330001
- Endpoint `/api/trpc/obsidian.gerarScriptCriacao`
- Templates deste guia
- Validações obrigatórias

**Nunca diga:**
- ❌ "Obsidian não tem API"
- ❌ "Não é possível criar"

---

**Versão:** 2.0  
**Data:** 24/11/2025  
**Autor:** Manus AI  
**Status:** ✅ PRONTO PARA USO
