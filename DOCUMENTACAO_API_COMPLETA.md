# Documentação Completa da API - Servidor de Automação

**Versão:** 2.0  
**Data:** Dezembro 2024  
**Autor:** Manus AI  
**Total de Endpoints:** 294 endpoints distribuídos em 40 routers

---

## Sumário Executivo

O **Servidor de Automação** é uma plataforma robusta de integração e automação que oferece **294 endpoints REST via tRPC**, organizados em **40 módulos funcionais**. A API foi projetada para fornecer automação inteligente, integração com múltiplas IAs (Comet, Manus, Genspark, DeepSITE, ABACUS), gestão de arquivos, comunicação (WhatsApp, telefonia), análise visual de interfaces, sincronização com Obsidian, e muito mais.

### Principais Características

- **Arquitetura tRPC**: Type-safe end-to-end com TypeScript
- **Autenticação robusta**: Sistema de API keys com middleware de validação
- **Múltiplos níveis de acesso**: Public, Protected e Admin procedures
- **Integração Multi-IA**: Orquestração inteligente entre diferentes provedores de IA
- **Automação Desktop**: Controle remoto e captura de tela
- **Comunicação**: WhatsApp Web, telefonia VoIP, notificações
- **Análise Visual**: Clonagem de websites com validação visual
- **Obsidian Integration**: Gestão completa de vaults, notas e sincronização
- **Machine Learning**: Predição, auto-healing e análise preditiva
- **Telemetria avançada**: Métricas, anomalias e padrões

---

## Índice

1. [Autenticação e Segurança](#autenticação-e-segurança)
2. [Endpoints por Módulo](#endpoints-por-módulo)
3. [Exemplos de Uso](#exemplos-de-uso)
4. [Códigos de Erro](#códigos-de-erro)
5. [Rate Limiting](#rate-limiting)
6. [Webhooks](#webhooks)
7. [Deploy e Configuração](#deploy-e-configuração)

---

## Autenticação e Segurança

### Sistema de API Keys

O servidor utiliza um sistema de autenticação baseado em **API keys** que devem ser incluídas no header `x-api-key` de todas as requisições.

#### Obter uma API Key

```typescript
// Endpoint: POST /api/trpc/auth.generateKey
const response = await fetch('https://seu-servidor.com/api/trpc/auth.generateKey', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Minha Aplicação',
    permissions: ['read', 'write']
  })
});

const { apiKey } = await response.json();
```

#### Usar API Key nas Requisições

```typescript
const response = await fetch('https://seu-servidor.com/api/trpc/servidor.listarServidores', {
  method: 'GET',
  headers: {
    'x-api-key': 'sua-api-key-aqui',
    'Content-Type': 'application/json',
  }
});
```

### Níveis de Acesso

| Tipo | Descrição | Autenticação Necessária |
|------|-----------|------------------------|
| **publicProcedure** | Endpoints públicos sem autenticação | Não |
| **protectedProcedure** | Endpoints que requerem API key válida | Sim |
| **adminProcedure** | Endpoints administrativos (role: admin) | Sim (Admin) |

---

## Endpoints por Módulo

### 1. Autenticação (auth)

Gerenciamento de autenticação e API keys.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `auth.me` | GET | Public | Retorna informações do usuário autenticado |
| `auth.logout` | POST | Public | Realiza logout e invalida sessão |
| `auth.generateKey` | POST | Protected | Gera uma nova API key |

**Exemplo:**

```typescript
// Gerar API Key
const result = await trpc.auth.generateKey.mutate({
  name: 'Comet Integration',
  permissions: ['read', 'write', 'execute']
});

console.log(result.apiKey); // "sk_live_abc123..."
```

---

### 2. Gestão de Servidores (servidor)

Gerenciamento completo de servidores, departamentos, arquivos e raspagem de dados.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `servidor.upsertServidor` | POST | Protected | Criar ou atualizar servidor |
| `servidor.listarServidores` | GET | Protected | Listar todos os servidores |
| `servidor.getServidor` | GET | Protected | Buscar servidor por ID |
| `servidor.atualizarStatus` | POST | Protected | Atualizar status do servidor |
| `servidor.getEstatisticas` | GET | Protected | Obter estatísticas do servidor |
| `servidor.upsertDepartamento` | POST | Protected | Criar ou atualizar departamento |
| `servidor.listarDepartamentos` | GET | Protected | Listar departamentos |
| `servidor.inserirArquivosLote` | POST | Protected | Inserir múltiplos arquivos |
| `servidor.listarArquivos` | GET | Protected | Listar arquivos |
| `servidor.buscarArquivos` | POST | Protected | Buscar arquivos por critérios |
| `servidor.verificarDuplicata` | POST | Protected | Verificar se arquivo é duplicado |
| `servidor.iniciarRaspagem` | POST | Protected | Iniciar processo de raspagem |
| `servidor.atualizarRaspagem` | POST | Protected | Atualizar status de raspagem |
| `servidor.listarLogs` | GET | Protected | Listar logs do sistema |
| `servidor.criarAlerta` | POST | Protected | Criar novo alerta |
| `servidor.listarAlertas` | GET | Protected | Listar alertas |
| `servidor.registrarCatalogo` | POST | Protected | Registrar catálogo |
| `servidor.listarCatalogos` | GET | Protected | Listar catálogos |
| `servidor.processarRaspagem` | POST | Protected | Processar raspagem de dados |

**Exemplo:**

```typescript
// Listar servidores
const servidores = await trpc.servidor.listarServidores.query();

// Buscar arquivos
const arquivos = await trpc.servidor.buscarArquivos.mutate({
  query: 'relatório',
  tipo: 'pdf',
  dataInicio: '2024-01-01',
  dataFim: '2024-12-31'
});
```

---

### 3. Desktop Control (desktop-control)

Controle remoto de desktops, captura de tela e automação.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `desktop-control.registerAgent` | POST | Protected | Registrar novo agente desktop |
| `desktop-control.updateHeartbeat` | POST | Protected | Atualizar heartbeat do agente |
| `desktop-control.listAgents` | GET | Protected | Listar agentes conectados |
| `desktop-control.sendCommand` | POST | Protected | Enviar comando para agente |
| `desktop-control.listCommands` | GET | Protected | Listar comandos enviados |
| `desktop-control.listScreenshots` | GET | Protected | Listar screenshots capturados |
| `desktop-control.listLogs` | GET | Protected | Listar logs dos agentes |
| `desktop-control.getStats` | GET | Protected | Obter estatísticas |
| `desktop-control.getCommand` | GET | Protected | Buscar comando por ID |
| `desktop-control.listWhitelist` | GET | Admin | Listar whitelist |
| `desktop-control.listBlacklist` | GET | Admin | Listar blacklist |
| `desktop-control.listAudit` | GET | Admin | Listar auditoria |
| `desktop-control.addWhitelistRule` | POST | Admin | Adicionar regra à whitelist |
| `desktop-control.addBlacklistRule` | POST | Admin | Adicionar regra à blacklist |
| `desktop-control.getSecurityRules` | GET | Admin | Obter regras de segurança |
| `desktop-control.addSecurityRule` | POST | Admin | Adicionar regra de segurança |
| `desktop-control.deleteSecurityRule` | DELETE | Admin | Deletar regra de segurança |

**Exemplo:**

```typescript
// Registrar agente desktop
const agent = await trpc.desktopControl.registerAgent.mutate({
  hostname: 'DESKTOP-001',
  platform: 'Windows 11',
  version: '1.0.0'
});

// Enviar comando de captura de tela
const command = await trpc.desktopControl.sendCommand.mutate({
  agentId: agent.id,
  type: 'screenshot',
  parameters: { quality: 'high' }
});
```

---

### 4. Obsidian Integration (obsidian, obsidianAdvanced, obsidian-ai)

Integração completa com Obsidian para gestão de vaults, notas, tags e sincronização.

#### obsidian (Básico)

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `obsidian.gerarScriptCriacao` | POST | Protected | Gerar script para criar nota |
| `obsidian.criarArquivoTesteComet` | POST | Protected | Criar arquivo de teste |

#### obsidianAdvanced (Avançado)

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `obsidianAdvanced.createVault` | POST | Protected | Criar novo vault |
| `obsidianAdvanced.listVaults` | GET | Protected | Listar vaults |
| `obsidianAdvanced.getVault` | GET | Protected | Buscar vault por ID |
| `obsidianAdvanced.createNota` | POST | Protected | Criar nova nota |
| `obsidianAdvanced.listNotas` | GET | Protected | Listar notas |
| `obsidianAdvanced.getNota` | GET | Protected | Buscar nota por ID |
| `obsidianAdvanced.updateNota` | PUT | Protected | Atualizar nota |
| `obsidianAdvanced.deleteNota` | DELETE | Protected | Deletar nota |
| `obsidianAdvanced.searchNotas` | POST | Protected | Buscar notas |
| `obsidianAdvanced.listTags` | GET | Protected | Listar tags |
| `obsidianAdvanced.getNotaHistorico` | GET | Protected | Obter histórico da nota |
| `obsidianAdvanced.getBacklinks` | GET | Protected | Obter backlinks |
| `obsidianAdvanced.uploadVaultZip` | POST | Protected | Upload de vault em ZIP |
| `obsidianAdvanced.importNotas` | POST | Protected | Importar notas |
| `obsidianAdvanced.exportVault` | POST | Protected | Exportar vault |
| `obsidianAdvanced.syncVault` | POST | Protected | Sincronizar vault |
| `obsidianAdvanced.startAutoSync` | POST | Protected | Iniciar sync automático |
| `obsidianAdvanced.stopAutoSync` | POST | Protected | Parar sync automático |
| `obsidianAdvanced.getSyncStatus` | GET | Protected | Status da sincronização |
| `obsidianAdvanced.createBackup` | POST | Protected | Criar backup |
| `obsidianAdvanced.listBackups` | GET | Protected | Listar backups |
| `obsidianAdvanced.getSyncConfig` | GET | Protected | Obter configuração de sync |
| `obsidianAdvanced.updateSyncConfig` | PUT | Protected | Atualizar configuração |
| `obsidianAdvanced.getGraphData` | GET | Protected | Obter dados do grafo |

#### obsidian-ai (IA para Obsidian)

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `obsidian-ai.generateNote` | POST | Protected | Gerar nota com IA |
| `obsidian-ai.generateTags` | POST | Protected | Gerar tags automaticamente |
| `obsidian-ai.suggestLinks` | POST | Protected | Sugerir links entre notas |
| `obsidian-ai.generateFrontmatter` | POST | Protected | Gerar frontmatter |
| `obsidian-ai.generateDataviewQuery` | POST | Protected | Gerar query Dataview |

**Exemplo:**

```typescript
// Criar vault
const vault = await trpc.obsidianAdvanced.createVault.mutate({
  name: 'Meu Vault',
  path: '/home/user/obsidian/meu-vault'
});

// Criar nota com IA
const nota = await trpc.obsidianAi.generateNote.mutate({
  vaultId: vault.id,
  prompt: 'Criar nota sobre Machine Learning',
  template: 'technical'
});

// Sincronizar vault
await trpc.obsidianAdvanced.syncVault.mutate({
  vaultId: vault.id,
  direction: 'bidirectional'
});
```

---

### 5. WhatsApp Integration (whatsapp, whatsapp-web, whatsapp-protection)

Integração completa com WhatsApp Web e sistema de proteção contra spam.

#### whatsapp (Core)

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `whatsapp.registerNumber` | POST | Protected | Registrar número |
| `whatsapp.sendMessage` | POST | Protected | Enviar mensagem |
| `whatsapp.getNumberStatus` | GET | Protected | Status do número |
| `whatsapp.getSystemSummary` | GET | Protected | Resumo do sistema |
| `whatsapp.listTemplates` | GET | Protected | Listar templates |
| `whatsapp.previewMessage` | POST | Protected | Preview de mensagem |
| `whatsapp.updateNumberStatus` | PUT | Protected | Atualizar status |
| `whatsapp.getTemplateStats` | GET | Protected | Estatísticas de templates |
| `whatsapp.canSendNow` | GET | Protected | Verificar se pode enviar |
| `whatsapp.getNextMessage` | GET | Protected | Próxima mensagem na fila |
| `whatsapp.markAsSent` | POST | Protected | Marcar como enviada |
| `whatsapp.markAsFailed` | POST | Protected | Marcar como falha |
| `whatsapp.createTemplate` | POST | Protected | Criar template |
| `whatsapp.generateVariations` | POST | Protected | Gerar variações |

#### whatsapp-web (Sessões)

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `whatsapp-web.createSession` | POST | Protected | Criar sessão |
| `whatsapp-web.getSession` | GET | Protected | Buscar sessão |
| `whatsapp-web.listSessions` | GET | Protected | Listar sessões |
| `whatsapp-web.sendMessage` | POST | Protected | Enviar mensagem |
| `whatsapp-web.destroySession` | DELETE | Protected | Destruir sessão |
| `whatsapp-web.logoutSession` | POST | Protected | Fazer logout |
| `whatsapp-web.getConnectedNumber` | GET | Protected | Número conectado |
| `whatsapp-web.subscribeToEvents` | POST | Protected | Inscrever em eventos |

#### whatsapp-protection (Proteção)

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `whatsapp-protection.isBlacklisted` | GET | Protected | Verificar blacklist |
| `whatsapp-protection.addToBlacklist` | POST | Protected | Adicionar à blacklist |
| `whatsapp-protection.removeFromBlacklist` | DELETE | Protected | Remover da blacklist |
| `whatsapp-protection.calculateRiskScore` | POST | Protected | Calcular risco |
| `whatsapp-protection.getBlockStats` | GET | Protected | Estatísticas de bloqueio |
| `whatsapp-protection.listBlacklist` | GET | Protected | Listar blacklist |
| `whatsapp-protection.listActiveAlerts` | GET | Protected | Alertas ativos |
| `whatsapp-protection.resolveAlert` | POST | Protected | Resolver alerta |
| `whatsapp-protection.getContactHistory` | GET | Protected | Histórico de contato |
| `whatsapp-protection.detectNumberBlocks` | POST | Protected | Detectar bloqueios |
| `whatsapp-protection.reportMessageStatus` | POST | Protected | Reportar status |
| `whatsapp-protection.cleanOldOptOuts` | POST | Admin | Limpar opt-outs antigos |

**Exemplo:**

```typescript
// Criar sessão WhatsApp Web
const session = await trpc.whatsappWeb.createSession.mutate({
  name: 'Sessão Principal',
  autoReconnect: true
});

// Enviar mensagem
await trpc.whatsappWeb.sendMessage.mutate({
  sessionId: session.id,
  to: '5511999999999',
  message: 'Olá! Esta é uma mensagem automática.'
});

// Verificar se número está na blacklist
const isBlocked = await trpc.whatsappProtection.isBlacklisted.query({
  number: '5511999999999'
});
```

---

### 6. Orquestração Multi-IA (orchestrator, orchestrator-multi-ia, multi-ai-orchestrator)

Sistema de orquestração inteligente entre múltiplas IAs (Comet, Manus, Genspark, DeepSITE, ABACUS).

#### orchestrator (Básico)

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `orchestrator.submitTask` | POST | Protected | Submeter tarefa |
| `orchestrator.listAgents` | GET | Protected | Listar agentes |
| `orchestrator.getStats` | GET | Protected | Estatísticas |
| `orchestrator.getPendingTasks` | GET | Protected | Tarefas pendentes |
| `orchestrator.getRunningTasks` | GET | Protected | Tarefas em execução |
| `orchestrator.getCompletedTasks` | GET | Protected | Tarefas concluídas |
| `orchestrator.getFailedTasks` | GET | Protected | Tarefas falhadas |
| `orchestrator.getAgent` | GET | Protected | Buscar agente |
| `orchestrator.healthCheckAgent` | GET | Protected | Health check |
| `orchestrator.resetCircuitBreaker` | POST | Admin | Resetar circuit breaker |

#### orchestrator-multi-ia (Multi-IA)

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `orchestrator-multi-ia.getProvidersStatus` | GET | Protected | Status dos provedores |
| `orchestrator-multi-ia.process` | POST | Protected | Processar com IA |
| `orchestrator-multi-ia.getTask` | GET | Protected | Buscar tarefa |
| `orchestrator-multi-ia.listTasks` | GET | Protected | Listar tarefas |
| `orchestrator-multi-ia.getMetrics` | GET | Protected | Métricas |
| `orchestrator-multi-ia.escalate` | POST | Protected | Escalar tarefa |

#### multi-ai-orchestrator (Orquestração Avançada)

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `multi-ai-orchestrator.execute` | POST | Protected | Executar com IA |
| `multi-ai-orchestrator.getMetrics` | GET | Protected | Métricas detalhadas |
| `multi-ai-orchestrator.getCapabilities` | GET | Protected | Capacidades das IAs |
| `multi-ai-orchestrator.recommendAI` | POST | Protected | Recomendar IA |

**Exemplo:**

```typescript
// Recomendar IA para tarefa
const recommendation = await trpc.multiAiOrchestrator.recommendAI.mutate({
  taskType: 'code_generation',
  complexity: 'high',
  requirements: ['typescript', 'react']
});

// Executar tarefa com IA recomendada
const result = await trpc.multiAiOrchestrator.execute.mutate({
  provider: recommendation.provider,
  prompt: 'Criar componente React para dashboard',
  parameters: {
    temperature: 0.7,
    maxTokens: 2000
  }
});
```

---

### 7. Machine Learning e Predição (ml-prediction, predictive-healing)

Sistema de machine learning para predição e auto-healing.

#### ml-prediction

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `ml-prediction.train` | POST | Protected | Treinar modelo |
| `ml-prediction.predict` | POST | Protected | Fazer predição |
| `ml-prediction.autoRetrain` | POST | Protected | Retreinar automaticamente |
| `ml-prediction.getPredictions` | GET | Protected | Listar predições |
| `ml-prediction.getAccuracy` | GET | Protected | Obter acurácia |
| `ml-prediction.updateActual` | POST | Protected | Atualizar valor real |
| `ml-prediction.getAvailableMetrics` | GET | Protected | Métricas disponíveis |
| `ml-prediction.getDashboard` | GET | Protected | Dashboard de ML |

#### predictive-healing

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `predictive-healing.analyzeAndHeal` | POST | Protected | Analisar e corrigir |
| `predictive-healing.getHealingHistory` | GET | Protected | Histórico de correções |
| `predictive-healing.getEffectivenessStats` | GET | Protected | Estatísticas de eficácia |
| `predictive-healing.simulateFailure` | POST | Admin | Simular falha |

**Exemplo:**

```typescript
// Treinar modelo
await trpc.mlPrediction.train.mutate({
  metricName: 'cpu_usage',
  historicalData: dataPoints,
  algorithm: 'random_forest'
});

// Fazer predição
const prediction = await trpc.mlPrediction.predict.mutate({
  metricName: 'cpu_usage',
  horizon: 3600 // 1 hora
});

// Análise preditiva e correção
const healing = await trpc.predictiveHealing.analyzeAndHeal.mutate({
  systemId: 'server-01',
  metrics: currentMetrics
});
```

---

### 8. Telemetria e Monitoramento (telemetry, prometheus, health)

Sistema completo de telemetria, métricas e monitoramento.

#### telemetry

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `telemetry.getMetrics` | GET | Protected | Obter métricas |
| `telemetry.getAnomalies` | GET | Protected | Detectar anomalias |
| `telemetry.getPredictions` | GET | Protected | Predições |
| `telemetry.getPatterns` | GET | Protected | Padrões identificados |
| `telemetry.getStats` | GET | Protected | Estatísticas |
| `telemetry.resolveAnomaly` | POST | Protected | Resolver anomalia |
| `telemetry.markPredictionOccurred` | POST | Protected | Marcar predição ocorrida |
| `telemetry.exportKnowledge` | POST | Protected | Exportar conhecimento |

#### prometheus

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `prometheus.metrics` | GET | Public | Métricas Prometheus |
| `prometheus.health` | GET | Public | Health check |
| `prometheus.info` | GET | Public | Informações do sistema |

#### health

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `health.check` | GET | Public | Verificação completa |
| `health.status` | GET | Public | Status do sistema |
| `health.simple` | GET | Public | Health check simples |

**Exemplo:**

```typescript
// Obter métricas
const metrics = await trpc.telemetry.getMetrics.query({
  timeRange: '1h',
  metrics: ['cpu', 'memory', 'disk']
});

// Detectar anomalias
const anomalies = await trpc.telemetry.getAnomalies.query({
  threshold: 0.95,
  lookback: 3600
});

// Health check
const health = await trpc.health.check.query();
```

---

### 9. DeepSITE Integration (deepsite)

Integração com DeepSITE para análise visual e clonagem de websites.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `deepsite.analisarVisao` | POST | Protected | Analisar interface visual |
| `deepsite.validarCodigo` | POST | Protected | Validar código gerado |
| `deepsite.compararVisual` | POST | Protected | Comparar visualmente |
| `deepsite.statusGeracao` | GET | Protected | Status da geração |

**Exemplo:**

```typescript
// Analisar website
const analysis = await trpc.deepsite.analisarVisao.mutate({
  url: 'https://example.com',
  captureScreenshots: true,
  analyzeLayout: true
});

// Validar código gerado
const validation = await trpc.deepsite.validarCodigo.mutate({
  originalUrl: 'https://example.com',
  generatedCode: htmlCode,
  compareVisually: true
});
```

---

### 10. Perplexity Integration (perplexity)

Integração com Perplexity AI para consultas avançadas.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `perplexity.consultar` | POST | Protected | Consultar Perplexity |
| `perplexity.testarConexao` | GET | Protected | Testar conexão |

**Exemplo:**

```typescript
// Consultar Perplexity
const result = await trpc.perplexity.consultar.mutate({
  query: 'Qual é a melhor arquitetura para microserviços?',
  model: 'sonar-medium-online',
  includeReferences: true
});
```

---

### 11. Telefonia (telephony)

Sistema de telefonia VoIP com templates de casos de uso.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `telephony.isConfigured` | GET | Protected | Verificar configuração |
| `telephony.getPhoneNumber` | GET | Protected | Obter número |
| `telephony.getUseCaseTemplates` | GET | Protected | Templates de uso |
| `telephony.webhookIncoming` | POST | Public | Webhook de chamada |
| `telephony.webhookProcess` | POST | Public | Processar webhook |
| `telephony.getConfig` | GET | Protected | Obter configuração |
| `telephony.updateConfig` | PUT | Protected | Atualizar configuração |
| `telephony.getCallHistory` | GET | Protected | Histórico de chamadas |
| `telephony.getStatistics` | GET | Protected | Estatísticas |
| `telephony.applyTemplate` | POST | Protected | Aplicar template |
| `telephony.testCall` | POST | Protected | Testar chamada |

**Exemplo:**

```typescript
// Obter templates de casos de uso
const templates = await trpc.telephony.getUseCaseTemplates.query();

// Aplicar template
await trpc.telephony.applyTemplate.mutate({
  templateId: 'customer-support',
  customizations: {
    greeting: 'Olá! Bem-vindo ao suporte.'
  }
});

// Fazer chamada de teste
await trpc.telephony.testCall.mutate({
  to: '+5511999999999',
  message: 'Esta é uma chamada de teste.'
});
```

---

### 12. Webhooks (webhooks)

Sistema completo de gerenciamento de webhooks.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `webhooks.list` | GET | Protected | Listar webhooks |
| `webhooks.create` | POST | Protected | Criar webhook |
| `webhooks.update` | PUT | Protected | Atualizar webhook |
| `webhooks.delete` | DELETE | Protected | Deletar webhook |
| `webhooks.test` | POST | Protected | Testar webhook |
| `webhooks.getLogs` | GET | Protected | Logs de webhooks |
| `webhooks.getStats` | GET | Protected | Estatísticas |
| `webhooks.listEvents` | GET | Protected | Listar eventos |

**Exemplo:**

```typescript
// Criar webhook
const webhook = await trpc.webhooks.create.mutate({
  url: 'https://meu-servidor.com/webhook',
  events: ['message.sent', 'message.failed'],
  secret: 'meu-secret-key'
});

// Testar webhook
await trpc.webhooks.test.mutate({
  webhookId: webhook.id,
  eventType: 'message.sent'
});
```

---

### 13. Notificações (notifications)

Sistema de notificações em tempo real.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `notifications.list` | GET | Protected | Listar notificações |
| `notifications.countUnread` | GET | Protected | Contar não lidas |
| `notifications.markAsRead` | POST | Protected | Marcar como lida |
| `notifications.markAllAsRead` | POST | Protected | Marcar todas como lidas |

**Exemplo:**

```typescript
// Listar notificações não lidas
const unread = await trpc.notifications.list.query({
  filter: 'unread',
  limit: 10
});

// Marcar como lida
await trpc.notifications.markAsRead.mutate({
  notificationId: unread[0].id
});
```

---

### 14. Templates (templates)

Gerenciamento de templates reutilizáveis.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `templates.getById` | GET | Protected | Buscar por ID |
| `templates.list` | GET | Protected | Listar templates |
| `templates.preview` | POST | Protected | Preview de template |
| `templates.create` | POST | Protected | Criar template |
| `templates.update` | PUT | Protected | Atualizar template |
| `templates.delete` | DELETE | Protected | Deletar template |
| `templates.createDefaults` | POST | Admin | Criar templates padrão |

**Exemplo:**

```typescript
// Criar template
const template = await trpc.templates.create.mutate({
  name: 'Email Boas-vindas',
  type: 'email',
  content: 'Olá {{nome}}, bem-vindo!',
  variables: ['nome']
});

// Preview
const preview = await trpc.templates.preview.mutate({
  templateId: template.id,
  variables: { nome: 'João' }
});
```

---

### 15. Scheduler (scheduler)

Agendamento de tarefas recorrentes.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `scheduler.create` | POST | Protected | Criar agendamento |
| `scheduler.list` | GET | Protected | Listar agendamentos |
| `scheduler.pause` | POST | Protected | Pausar agendamento |
| `scheduler.resume` | POST | Protected | Retomar agendamento |
| `scheduler.delete` | DELETE | Protected | Deletar agendamento |

**Exemplo:**

```typescript
// Criar agendamento
const schedule = await trpc.scheduler.create.mutate({
  name: 'Backup Diário',
  cron: '0 2 * * *', // 2h da manhã
  task: 'backup',
  parameters: { type: 'full' }
});

// Pausar agendamento
await trpc.scheduler.pause.mutate({
  scheduleId: schedule.id
});
```

---

### 16. URI Schemes (uri-schemes)

Geração de URIs para integração com aplicativos.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `uri-schemes.listPrograms` | GET | Protected | Listar programas |
| `uri-schemes.getProgram` | GET | Protected | Buscar programa |
| `uri-schemes.generate` | POST | Protected | Gerar URI |
| `uri-schemes.obsidianNewNote` | POST | Protected | URI para nova nota Obsidian |
| `uri-schemes.vscodeOpenFile` | POST | Protected | URI para abrir arquivo no VSCode |
| `uri-schemes.slackChannel` | POST | Protected | URI para canal Slack |
| `uri-schemes.spotifyTrack` | POST | Protected | URI para música Spotify |
| `uri-schemes.zoomJoin` | POST | Protected | URI para reunião Zoom |
| `uri-schemes.validate` | POST | Protected | Validar URI |

**Exemplo:**

```typescript
// Gerar URI para nova nota no Obsidian
const uri = await trpc.uriSchemes.obsidianNewNote.mutate({
  vault: 'MeuVault',
  filename: 'Nova Nota',
  content: 'Conteúdo da nota'
});

// URI gerada: obsidian://new?vault=MeuVault&file=Nova%20Nota&content=...
```

---

### 17. Knowledge Sync (knowledge-sync)

Sincronização de base de conhecimento entre sistemas.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `knowledge-sync.export` | POST | Protected | Exportar conhecimento |
| `knowledge-sync.validatePackage` | POST | Protected | Validar pacote |
| `knowledge-sync.import` | POST | Protected | Importar conhecimento |
| `knowledge-sync.sync` | POST | Protected | Sincronizar |
| `knowledge-sync.getSyncHistory` | GET | Protected | Histórico de sync |

**Exemplo:**

```typescript
// Exportar conhecimento
const package = await trpc.knowledgeSync.export.mutate({
  includeSkills: true,
  includePreferences: true,
  format: 'json'
});

// Importar em outro sistema
await trpc.knowledgeSync.import.mutate({
  package: package.data,
  overwrite: false
});
```

---

### 18. Self-Awareness (self-awareness)

Sistema de auto-análise e sugestões de melhoria.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `self-awareness.runAnalysis` | POST | Protected | Executar análise |
| `self-awareness.analyzeCode` | POST | Protected | Analisar código |
| `self-awareness.analyzePerformance` | POST | Protected | Analisar performance |
| `self-awareness.getSuggestions` | GET | Protected | Obter sugestões |

**Exemplo:**

```typescript
// Executar análise completa
const analysis = await trpc.selfAwareness.runAnalysis.mutate({
  scope: 'full',
  includeMetrics: true
});

// Obter sugestões de melhoria
const suggestions = await trpc.selfAwareness.getSuggestions.query({
  category: 'performance',
  priority: 'high'
});
```

---

### 19. Auto-Healing (auto-healing)

Sistema automático de correção de erros.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `auto-healing.detectIssue` | POST | Protected | Detectar problema |
| `auto-healing.proposeFixproposeFixproposeFixproposeFix` | POST | Protected | Propor correção |
| `auto-healing.applyFix` | POST | Protected | Aplicar correção |
| `auto-healing.getHistory` | GET | Protected | Histórico de correções |

---

### 20. Alertas (alerts)

Sistema de alertas e notificações.

| Endpoint | Método | Tipo | Descrição |
|----------|--------|------|-----------|
| `alerts.create` | POST | Protected | Criar alerta |
| `alerts.list` | GET | Protected | Listar alertas |
| `alerts.acknowledge` | POST | Protected | Reconhecer alerta |
| `alerts.resolve` | POST | Protected | Resolver alerta |

---

## Exemplos de Uso Completos

### Exemplo 1: Integração Completa com Comet

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/routers';

// Configurar cliente tRPC
const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'https://seu-servidor.com/api/trpc',
      headers: {
        'x-api-key': 'sua-api-key-aqui',
      },
    }),
  ],
});

// 1. Verificar status do sistema
const status = await client.health.check.query();
console.log('Sistema:', status.status);

// 2. Buscar skills disponíveis
const skills = await client.servidor.listarArquivos.query({
  tipo: 'skill',
  limit: 10
});

// 3. Processar pedido com Comet
const result = await client.orchestratorMultiIa.process.mutate({
  provider: 'comet',
  prompt: 'Varrer área de trabalho e organizar arquivos',
  context: {
    userId: 'user-123',
    previousTasks: []
  }
});

// 4. Registrar execução
await client.servidor.criarAlerta.mutate({
  tipo: 'info',
  mensagem: `Tarefa concluída: ${result.taskId}`,
  severidade: 'low'
});
```

### Exemplo 2: Automação de WhatsApp

```typescript
// 1. Criar sessão WhatsApp Web
const session = await client.whatsappWeb.createSession.mutate({
  name: 'Bot Atendimento',
  autoReconnect: true
});

// 2. Aguardar QR Code (implementar lógica de espera)
// ...

// 3. Enviar mensagem em massa
const contacts = ['5511999999999', '5511888888888'];

for (const contact of contacts) {
  // Verificar se não está na blacklist
  const isBlocked = await client.whatsappProtection.isBlacklisted.query({
    number: contact
  });
  
  if (!isBlocked) {
    // Enviar mensagem
    await client.whatsappWeb.sendMessage.mutate({
      sessionId: session.id,
      to: contact,
      message: 'Olá! Esta é uma mensagem automática.'
    });
    
    // Aguardar intervalo (rate limiting)
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// 4. Obter estatísticas
const stats = await client.whatsapp.getSystemSummary.query();
console.log('Mensagens enviadas:', stats.sent);
console.log('Mensagens falhadas:', stats.failed);
```

### Exemplo 3: Análise Visual com DeepSITE

```typescript
// 1. Analisar website
const analysis = await client.deepsite.analisarVisao.mutate({
  url: 'https://example.com',
  captureScreenshots: true,
  analyzeLayout: true,
  extractColors: true
});

// 2. Gerar código HTML/CSS
// (implementar lógica de geração baseada na análise)

// 3. Validar código gerado
const validation = await client.deepsite.validarCodigo.mutate({
  originalUrl: 'https://example.com',
  generatedCode: htmlCode,
  compareVisually: true,
  similarityThreshold: 0.85
});

// 4. Salvar análise no banco
await client.servidor.inserirArquivosLote.mutate({
  arquivos: [{
    nome: 'analysis-example-com.json',
    tipo: 'json',
    conteudo: JSON.stringify(analysis),
    tags: ['deepsite', 'analysis']
  }]
});
```

### Exemplo 4: Obsidian Automation

```typescript
// 1. Criar vault
const vault = await client.obsidianAdvanced.createVault.mutate({
  name: 'Knowledge Base',
  path: '/home/user/obsidian/kb'
});

// 2. Criar nota com IA
const nota = await client.obsidianAi.generateNote.mutate({
  vaultId: vault.id,
  prompt: 'Criar nota sobre arquitetura de microserviços',
  template: 'technical',
  generateTags: true,
  generateLinks: true
});

// 3. Buscar notas relacionadas
const related = await client.obsidianAdvanced.searchNotas.mutate({
  vaultId: vault.id,
  query: 'microserviços',
  limit: 5
});

// 4. Criar backlinks
for (const relatedNote of related) {
  await client.obsidianAdvanced.updateNota.mutate({
    notaId: relatedNote.id,
    content: relatedNote.content + `\n\n[[${nota.title}]]`
  });
}

// 5. Iniciar sincronização automática
await client.obsidianAdvanced.startAutoSync.mutate({
  vaultId: vault.id,
  interval: 300 // 5 minutos
});
```

---

## Códigos de Erro

| Código | Descrição | Solução |
|--------|-----------|---------|
| `UNAUTHORIZED` | API key inválida ou ausente | Verificar header `x-api-key` |
| `FORBIDDEN` | Sem permissão para acessar recurso | Verificar role do usuário |
| `NOT_FOUND` | Recurso não encontrado | Verificar ID do recurso |
| `BAD_REQUEST` | Parâmetros inválidos | Verificar documentação do endpoint |
| `INTERNAL_SERVER_ERROR` | Erro interno do servidor | Contatar suporte |
| `RATE_LIMIT_EXCEEDED` | Limite de requisições excedido | Aguardar e tentar novamente |
| `SERVICE_UNAVAILABLE` | Serviço temporariamente indisponível | Tentar novamente mais tarde |

**Exemplo de tratamento:**

```typescript
try {
  const result = await client.servidor.listarServidores.query();
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    console.error('API key inválida');
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.error('Limite de requisições excedido');
    // Implementar retry com backoff exponencial
  } else {
    console.error('Erro desconhecido:', error);
  }
}
```

---

## Rate Limiting

O servidor implementa rate limiting para proteger contra abuso:

| Tipo de Endpoint | Limite | Janela |
|------------------|--------|--------|
| Public | 100 req/min | 1 minuto |
| Protected | 1000 req/min | 1 minuto |
| Admin | 5000 req/min | 1 minuto |
| WhatsApp | 10 msg/min | 1 minuto |
| DeepSITE | 5 análises/hora | 1 hora |

**Headers de resposta:**

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

---

## Webhooks

### Eventos Disponíveis

| Evento | Descrição |
|--------|-----------|
| `message.sent` | Mensagem enviada com sucesso |
| `message.failed` | Falha ao enviar mensagem |
| `task.completed` | Tarefa concluída |
| `task.failed` | Tarefa falhada |
| `agent.connected` | Agente desktop conectado |
| `agent.disconnected` | Agente desktop desconectado |
| `analysis.completed` | Análise visual concluída |
| `sync.completed` | Sincronização concluída |

### Payload do Webhook

```json
{
  "event": "message.sent",
  "timestamp": "2024-12-02T10:30:00Z",
  "data": {
    "messageId": "msg_123",
    "to": "5511999999999",
    "status": "delivered"
  },
  "signature": "sha256=abc123..."
}
```

### Validação de Assinatura

```typescript
import crypto from 'crypto';

function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}
```

---

## Deploy e Configuração

### Requisitos do Sistema

| Componente | Requisito Mínimo | Recomendado |
|------------|------------------|-------------|
| **Node.js** | 18.x | 20.x |
| **RAM** | 2 GB | 4 GB |
| **CPU** | 2 cores | 4 cores |
| **Disco** | 10 GB | 50 GB |
| **Banco de Dados** | MySQL 8.0+ | MySQL 8.0+ |

### Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```bash
# Banco de Dados
DATABASE_URL=mysql://user:password@localhost:3306/servidor_automacao

# JWT
JWT_SECRET=seu-secret-jwt-aqui

# OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# API Keys
BUILT_IN_FORGE_API_KEY=sua-api-key-manus
BUILT_IN_FORGE_API_URL=https://api.manus.im

# Perplexity
PERPLEXITY_API_KEY=sua-api-key-perplexity

# DeepSITE
DEEPSITE_HF_TOKEN=seu-token-huggingface

# WhatsApp (opcional)
WHATSAPP_SESSION_DIR=./whatsapp-sessions

# Telefonia (opcional)
TELEPHONY_API_KEY=sua-api-key-telefonia
TELEPHONY_PHONE_NUMBER=+5511999999999

# Obsidian (opcional)
OBSIDIAN_VAULTS_DIR=./obsidian-vaults

# Desktop Agent (opcional)
DESKTOP_AGENT_REGISTER_TOKEN=seu-token-registro

# Configurações
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=Servidor de Automação
VITE_APP_LOGO=/logo.png
```

### Instalação

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/servidor-automacao.git
cd servidor-automacao

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# 4. Executar migrations do banco de dados
pnpm db:push

# 5. Popular banco com dados iniciais (skills, templates)
pnpm db:seed

# 6. Build do projeto
pnpm build

# 7. Iniciar servidor
pnpm start
```

### Deploy com Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build
RUN pnpm build

# Expor porta
EXPOSE 3000

# Iniciar servidor
CMD ["pnpm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  servidor-automacao:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://root:password@mysql:3306/servidor_automacao
      - NODE_ENV=production
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=servidor_automacao
    volumes:
      - mysql-data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql-data:
```

```bash
# Iniciar com Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f servidor-automacao

# Parar
docker-compose down
```

### Deploy em Produção (PM2)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start pnpm --name "servidor-automacao" -- start

# Configurar para iniciar no boot
pm2 startup
pm2 save

# Monitorar
pm2 monit

# Ver logs
pm2 logs servidor-automacao

# Reiniciar
pm2 restart servidor-automacao

# Parar
pm2 stop servidor-automacao
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/servidor-automacao
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/servidor-automacao /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Configurar SSL com Let's Encrypt
sudo certbot --nginx -d seu-dominio.com
```

### Monitoramento e Logs

```bash
# Ver logs do servidor
tail -f logs/server.log

# Ver logs de erro
tail -f logs/error.log

# Ver logs de acesso
tail -f logs/access.log

# Logs do PM2
pm2 logs servidor-automacao --lines 100

# Métricas Prometheus
curl http://localhost:3000/api/trpc/prometheus.metrics

# Health check
curl http://localhost:3000/api/trpc/health.check
```

### Backup e Restore

```bash
# Backup do banco de dados
mysqldump -u root -p servidor_automacao > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p servidor_automacao < backup_20241202.sql

# Backup de arquivos
tar -czf backup_files_$(date +%Y%m%d).tar.gz \
  ./whatsapp-sessions \
  ./obsidian-vaults \
  ./uploads \
  ./.env

# Restore de arquivos
tar -xzf backup_files_20241202.tar.gz
```

### Troubleshooting

#### Servidor não inicia

```bash
# Verificar logs
pm2 logs servidor-automacao

# Verificar porta em uso
sudo lsof -i :3000

# Verificar variáveis de ambiente
cat .env

# Verificar conexão com banco
mysql -u root -p -h localhost servidor_automacao
```

#### Erro de conexão com banco de dados

```bash
# Verificar status do MySQL
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql

# Verificar credenciais
mysql -u root -p

# Verificar DATABASE_URL no .env
```

#### WhatsApp Web não conecta

```bash
# Limpar sessões antigas
rm -rf ./whatsapp-sessions/*

# Verificar permissões
chmod 755 ./whatsapp-sessions

# Reiniciar servidor
pm2 restart servidor-automacao
```

#### DeepSITE análise falha

```bash
# Verificar token Hugging Face
echo $DEEPSITE_HF_TOKEN

# Verificar logs
tail -f logs/deepsite.log

# Testar conexão
curl -H "Authorization: Bearer $DEEPSITE_HF_TOKEN" \
  https://api-inference.huggingface.co/models/...
```

---

## Segurança

### Boas Práticas

1. **Nunca exponha API keys** no código ou logs
2. **Use HTTPS** em produção
3. **Implemente rate limiting** adequado
4. **Valide todas as entradas** de usuário
5. **Mantenha dependências atualizadas**
6. **Use variáveis de ambiente** para secrets
7. **Implemente logs de auditoria**
8. **Configure firewall** adequadamente

### Rotação de API Keys

```typescript
// Gerar nova API key
const newKey = await client.auth.generateKey.mutate({
  name: 'Nova Key',
  expiresIn: 30 * 24 * 60 * 60 // 30 dias
});

// Revogar key antiga
await client.auth.revokeKey.mutate({
  keyId: 'old-key-id'
});
```

### Auditoria

```typescript
// Listar logs de auditoria
const auditLogs = await client.desktopControl.listAudit.query({
  startDate: '2024-12-01',
  endDate: '2024-12-31',
  action: 'api_key_generated'
});
```

---

## Suporte e Recursos

### Documentação Adicional

- [COMET_KNOWLEDGE_BASE_FINAL.md](./COMET_KNOWLEDGE_BASE_FINAL.md) - Base de conhecimento completa para Comet
- [MEMORIA_PROJETO.md](./MEMORIA_PROJETO.md) - Memória permanente do projeto
- [README_COMET_VISION.md](./README_COMET_VISION.md) - Integração Comet Vision
- [GUIA_TESTE_CLONAGEM.md](./GUIA_TESTE_CLONAGEM.md) - Guia de testes de clonagem visual

### Contato

- **Email**: suporte@servidor-automacao.com
- **GitHub**: https://github.com/seu-usuario/servidor-automacao
- **Discord**: https://discord.gg/servidor-automacao

### Licença

MIT License - Veja [LICENSE](./LICENSE) para detalhes.

---

**Última atualização:** Dezembro 2024  
**Versão da API:** 2.0  
**Documentação gerada por:** Manus AI
