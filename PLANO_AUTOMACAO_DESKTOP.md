# 🤖 PLANO DE IMPLEMENTAÇÃO - AUTOMAÇÃO DESKTOP (Vercept-like)

## 📋 ANÁLISE DO VERCEPT/VY

### O que é o Vercept/Vy?
**Assistente AI desktop** que executa tarefas diretamente no computador do usuário através de:
- Controle de aplicativos nativos (browser, terminal, Slack, etc)
- Automação de workflows complexos
- Zero configuração (não precisa conectar APIs manualmente)
- Execução local (privacidade e segurança)

### Casos de Uso Principais:
1. **Developer**: Interagir com APIs via terminal, scraping de links
2. **Productivity**: Preparar reuniões, configurar Slack, criar planilhas
3. **Research**: Pesquisar pessoas em redes sociais, resumir reviews
4. **Life**: Planejar viagens, buscar voos, reservar camping
5. **Education**: Gerar flashcards Anki automaticamente

---

## 🎯 OBJETIVO DO PROJETO

Implementar **sistema de automação desktop** no "Servidor de Automação" que permita:

1. ✅ **Controlar navegador** (abrir sites, preencher formulários, clicar, extrair dados)
2. ✅ **Executar comandos** no sistema operacional
3. ✅ **Automatizar workflows** complexos com múltiplos passos
4. ✅ **Agendar tarefas** para execução automática
5. ✅ **Interface web** para criar e gerenciar automações
6. ✅ **Logs e monitoramento** de execuções

---

## 🏗️ ARQUITETURA PROPOSTA

### Componentes Principais:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND WEB                          │
│  - Interface para criar workflows                        │
│  - Editor visual de automações                           │
│  - Dashboard de monitoramento                            │
│  - Logs em tempo real                                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (tRPC)                         │
│  - API de workflows                                      │
│  - Agendador de tarefas                                  │
│  - Gerenciador de execuções                              │
│  - Sistema de logs                                       │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              AUTOMATION ENGINE                           │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Browser Agent  │  │  System Agent   │              │
│  │  (Playwright)   │  │  (Shell/CLI)    │              │
│  └─────────────────┘  └─────────────────┘              │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   AI Agent      │  │  Scheduler      │              │
│  │   (LLM)         │  │  (node-cron)    │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   BANCO DE DADOS                         │
│  - automation_workflows                                  │
│  - automation_executions                                 │
│  - automation_logs                                       │
│  - automation_schedules                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 BANCO DE DADOS - SCHEMA

### 1. `automation_workflows`
```sql
CREATE TABLE automation_workflows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo ENUM('browser', 'system', 'hybrid', 'ai') NOT NULL,
  steps JSON NOT NULL, -- Array de passos da automação
  ativo TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(ativo)
);
```

### 2. `automation_executions`
```sql
CREATE TABLE automation_executions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflow_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') NOT NULL,
  input_data JSON,
  output_data JSON,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(workflow_id),
  INDEX(user_id),
  INDEX(status),
  INDEX(created_at)
);
```

### 3. `automation_logs`
```sql
CREATE TABLE automation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  execution_id INT NOT NULL,
  step_index INT NOT NULL,
  level ENUM('info', 'warning', 'error', 'debug') NOT NULL,
  message TEXT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(execution_id),
  INDEX(level)
);
```

### 4. `automation_schedules`
```sql
CREATE TABLE automation_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflow_id INT NOT NULL,
  user_id INT NOT NULL,
  cron_expression VARCHAR(100) NOT NULL,
  ativo TINYINT DEFAULT 1,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX(workflow_id),
  INDEX(ativo),
  INDEX(next_run)
);
```

---

## 🔧 TECNOLOGIAS E BIBLIOTECAS

### Backend:
- ✅ **Playwright** (já integrado via MCP) - Automação de navegador
- ✅ **node-cron** - Agendamento de tarefas
- ✅ **child_process** - Execução de comandos do sistema
- ✅ **LLM integration** (já existe) - Interpretação de linguagem natural
- ⚠️ **Bull/BullMQ** (opcional) - Fila de jobs para execuções pesadas

### Frontend:
- ✅ **React Flow** ou **React Flow Chart** - Editor visual de workflows
- ✅ **Monaco Editor** - Editor de código para scripts
- ✅ **Lucide Icons** - Ícones para UI
- ✅ **Shadcn/ui** - Componentes UI

---

## 📝 TIPOS DE AUTOMAÇÃO

### 1. **Browser Automation** (Playwright MCP)
```typescript
{
  type: "browser",
  steps: [
    { action: "navigate", url: "https://example.com" },
    { action: "fill", selector: "#email", value: "user@example.com" },
    { action: "click", selector: "button[type=submit]" },
    { action: "screenshot", path: "/tmp/screenshot.png" },
    { action: "extract", selector: ".result", variable: "result" }
  ]
}
```

### 2. **System Automation** (Shell Commands)
```typescript
{
  type: "system",
  steps: [
    { action: "exec", command: "ls -la", cwd: "/home/user" },
    { action: "exec", command: "git pull", cwd: "/home/user/project" },
    { action: "exec", command: "npm install" }
  ]
}
```

### 3. **AI-Powered Automation** (LLM)
```typescript
{
  type: "ai",
  steps: [
    { action: "llm", prompt: "Extrair emails deste texto: {{input}}", variable: "emails" },
    { action: "llm", prompt: "Resumir em 3 frases: {{text}}", variable: "summary" }
  ]
}
```

### 4. **Hybrid Automation** (Combinação)
```typescript
{
  type: "hybrid",
  steps: [
    { action: "navigate", url: "https://news.ycombinator.com" },
    { action: "extract", selector: ".titleline > a", variable: "titles" },
    { action: "llm", prompt: "Quais desses títulos são sobre IA? {{titles}}", variable: "ai_news" },
    { action: "exec", command: "echo '{{ai_news}}' > /tmp/ai_news.txt" }
  ]
}
```

---

## 🎨 INTERFACE DO USUÁRIO

### Páginas:

1. **`/automacao/workflows`** - Lista de workflows
   - Cards com nome, descrição, última execução
   - Botões: Executar, Editar, Agendar, Deletar
   - Filtros: Tipo, Status, Data

2. **`/automacao/workflow/novo`** - Criar workflow
   - Editor visual (drag & drop de steps)
   - Editor de código (JSON/YAML)
   - Preview de execução
   - Testar workflow

3. **`/automacao/workflow/:id`** - Detalhes do workflow
   - Informações gerais
   - Histórico de execuções
   - Logs detalhados
   - Editar steps

4. **`/automacao/execucoes`** - Histórico de execuções
   - Tabela com todas as execuções
   - Filtros: Status, Workflow, Data
   - Ver logs detalhados

5. **`/automacao/agendamentos`** - Agendamentos
   - Lista de workflows agendados
   - Cron expression editor
   - Próxima execução
   - Ativar/desativar

---

## 🚀 PLANO DE IMPLEMENTAÇÃO - FASES

### **FASE 1: Fundação (2-3 horas)**
- [ ] Criar schema do banco de dados (4 tabelas)
- [ ] Criar arquivo `drizzle/schema-automation.ts`
- [ ] Executar `pnpm db:push` para criar tabelas
- [ ] Criar arquivo `server/db-automation.ts` com helpers CRUD
- [ ] Criar testes básicos para helpers

### **FASE 2: Backend - Workflow Engine (3-4 horas)**
- [ ] Criar `server/services/automationEngine.ts`
- [ ] Implementar executor de steps (browser, system, ai, hybrid)
- [ ] Implementar sistema de logs
- [ ] Criar `server/routers/automation.ts` com endpoints:
  - `createWorkflow`, `listWorkflows`, `getWorkflow`
  - `updateWorkflow`, `deleteWorkflow`
  - `executeWorkflow`, `getExecution`, `listExecutions`
  - `getExecutionLogs`
- [ ] Criar testes unitários (20+ testes)

### **FASE 3: Backend - Agendador (1-2 horas)**
- [ ] Implementar `server/services/automationScheduler.ts`
- [ ] Integrar com node-cron
- [ ] Criar endpoints de agendamento:
  - `createSchedule`, `listSchedules`, `updateSchedule`, `deleteSchedule`
- [ ] Criar testes de agendamento

### **FASE 4: Frontend - Lista e Execução (2-3 horas)**
- [ ] Criar página `/automacao/workflows`
- [ ] Criar componente `WorkflowCard`
- [ ] Implementar botão "Executar Agora"
- [ ] Criar modal de confirmação
- [ ] Mostrar status de execução em tempo real

### **FASE 5: Frontend - Editor de Workflows (3-4 horas)**
- [ ] Criar página `/automacao/workflow/novo`
- [ ] Implementar editor visual (React Flow ou form-based)
- [ ] Criar componentes para cada tipo de step:
  - `BrowserStepEditor`
  - `SystemStepEditor`
  - `AIStepEditor`
- [ ] Implementar validação de workflow
- [ ] Adicionar botão "Testar Workflow"

### **FASE 6: Frontend - Logs e Monitoramento (1-2 horas)**
- [ ] Criar página `/automacao/execucoes`
- [ ] Criar tabela de execuções com filtros
- [ ] Criar componente `ExecutionLogs` (logs em tempo real)
- [ ] Adicionar indicadores visuais (success, error, running)

### **FASE 7: Frontend - Agendamentos (1-2 horas)**
- [ ] Criar página `/automacao/agendamentos`
- [ ] Criar componente `CronExpressionEditor`
- [ ] Implementar toggle ativar/desativar
- [ ] Mostrar próxima execução

### **FASE 8: Integrações Avançadas (2-3 horas)**
- [ ] Integrar com Playwright MCP (já existe)
- [ ] Criar templates de workflows prontos:
  - "Monitorar site e notificar mudanças"
  - "Backup automático de arquivos"
  - "Scraping de dados periódico"
  - "Enviar relatório por email"
- [ ] Adicionar variáveis de ambiente para workflows

### **FASE 9: Segurança e Permissões (1 hora)**
- [ ] Validar permissões em todos os endpoints
- [ ] Adicionar rate limiting para execuções
- [ ] Implementar sandbox para execução de comandos
- [ ] Adicionar logs de auditoria

### **FASE 10: Testes e Documentação (1-2 horas)**
- [ ] Executar bateria completa de testes
- [ ] Criar documentação de uso
- [ ] Criar exemplos de workflows
- [ ] Salvar checkpoint final

---

## ⚠️ CONSIDERAÇÕES DE SEGURANÇA

### Riscos:
1. **Execução de comandos arbitrários** - Usuário pode executar comandos perigosos
2. **Acesso a dados sensíveis** - Workflows podem acessar arquivos do sistema
3. **Consumo de recursos** - Workflows podem travar o servidor

### Mitigações:
1. ✅ **Sandbox de execução** - Limitar comandos permitidos
2. ✅ **Timeout de execução** - Matar processos que demoram muito
3. ✅ **Rate limiting** - Limitar número de execuções por usuário
4. ✅ **Validação de permissões** - Verificar `userId` em todos os endpoints
5. ✅ **Logs de auditoria** - Registrar todas as ações
6. ✅ **Whitelist de comandos** - Apenas comandos seguros (opcional)

---

## 📈 ESTIMATIVA DE TEMPO

| Fase | Tempo Estimado | Complexidade |
|------|----------------|--------------|
| Fase 1: Fundação | 2-3h | Baixa |
| Fase 2: Workflow Engine | 3-4h | Alta |
| Fase 3: Agendador | 1-2h | Média |
| Fase 4: Frontend Lista | 2-3h | Média |
| Fase 5: Frontend Editor | 3-4h | Alta |
| Fase 6: Frontend Logs | 1-2h | Baixa |
| Fase 7: Frontend Agendamentos | 1-2h | Baixa |
| Fase 8: Integrações | 2-3h | Média |
| Fase 9: Segurança | 1h | Média |
| Fase 10: Testes | 1-2h | Baixa |
| **TOTAL** | **18-26 horas** | - |

---

## 🎯 PRIORIZAÇÃO

### **MVP (Mínimo Viável) - 8-10 horas:**
- Fase 1: Fundação ✅
- Fase 2: Workflow Engine ✅
- Fase 4: Frontend Lista ✅
- Fase 6: Frontend Logs ✅

### **Versão Completa - 18-26 horas:**
- Todas as fases

---

## 📚 EXEMPLOS DE WORKFLOWS

### Exemplo 1: Monitorar Preço de Produto
```json
{
  "nome": "Monitorar Preço Amazon",
  "tipo": "hybrid",
  "steps": [
    {
      "action": "navigate",
      "url": "https://amazon.com/dp/B08N5WRWNW"
    },
    {
      "action": "extract",
      "selector": ".a-price-whole",
      "variable": "preco"
    },
    {
      "action": "condition",
      "if": "{{preco}} < 500",
      "then": [
        {
          "action": "notification",
          "title": "Preço baixou!",
          "message": "Produto agora custa ${{preco}}"
        }
      ]
    }
  ]
}
```

### Exemplo 2: Backup Automático
```json
{
  "nome": "Backup Diário",
  "tipo": "system",
  "steps": [
    {
      "action": "exec",
      "command": "tar -czf /backups/backup-$(date +%Y%m%d).tar.gz /home/user/documents"
    },
    {
      "action": "exec",
      "command": "find /backups -mtime +30 -delete"
    }
  ]
}
```

### Exemplo 3: Pesquisa Automática
```json
{
  "nome": "Pesquisar Vagas LinkedIn",
  "tipo": "hybrid",
  "steps": [
    {
      "action": "navigate",
      "url": "https://linkedin.com/jobs/search/?keywords=nodejs"
    },
    {
      "action": "extract",
      "selector": ".job-card-container",
      "variable": "vagas"
    },
    {
      "action": "llm",
      "prompt": "Resumir as 5 vagas mais relevantes: {{vagas}}",
      "variable": "resumo"
    },
    {
      "action": "notification",
      "title": "Novas vagas encontradas",
      "message": "{{resumo}}"
    }
  ]
}
```

---

## ✅ CHECKLIST ANTES DE COMEÇAR

- [ ] Confirmar que Playwright MCP está funcionando
- [ ] Confirmar que sistema de notificações está funcionando
- [ ] Confirmar que node-cron está instalado
- [ ] Confirmar que há espaço no banco de dados
- [ ] Confirmar que usuário quer MVP ou versão completa
- [ ] Confirmar casos de uso prioritários

---

## 🤔 PERGUNTAS PARA O USUÁRIO

1. **Escopo:** Quer implementar o MVP (8-10h) ou a versão completa (18-26h)?
2. **Casos de uso:** Quais automações específicas você precisa? (ex: monitorar sites, backups, scraping)
3. **Prioridade:** Qual funcionalidade é mais urgente? (browser, system, ai, agendamento)
4. **Segurança:** Quer sandbox rigoroso (mais seguro, menos flexível) ou execução livre (menos seguro, mais flexível)?
5. **Interface:** Prefere editor visual (drag & drop) ou editor de código (JSON/YAML)?

---

## 📌 PRÓXIMOS PASSOS

1. ✅ Usuário revisar este plano
2. ✅ Usuário responder perguntas acima
3. ✅ Ajustar plano baseado nas respostas
4. ✅ Começar implementação pela Fase 1
