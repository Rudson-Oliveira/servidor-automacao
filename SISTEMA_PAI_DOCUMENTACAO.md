# 🏛️ SISTEMA PAI - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Sistema Pai - Backups de 7 Dias](#sistema-pai)
3. [Auto-Testes Noturnos](#auto-testes)
4. [Auto-Correção Segura](#auto-correção)
5. [API de Auto-Evolução](#api-auto-evolução)
6. [Coleta de Dados e ML](#ml-data-collection)
7. [Como Usar](#como-usar)
8. [Endpoints da API](#endpoints)

---

## 🎯 Visão Geral

O **Sistema Pai** é uma infraestrutura completa de proteção, automação e evolução contínua do sistema. Similar à fórmula da Coca-Cola, mantém o protótipo original sempre preservado e permite evolução exponencial através de contribuições de IAs externas.

### ✅ Funcionalidades Implementadas

1. **Sistema Pai + Backups de 7 Dias** ✅
2. **Auto-Testes Noturnos Completos** ✅
3. **Auto-Correção Segura com Rollback** ✅
4. **API de Auto-Evolução para IAs** ✅
5. **Coleta de Dados Reais + ML** ✅

---

## 🏛️ Sistema Pai

### Conceito

O Sistema Pai é o **protótipo original** que NUNCA pode ser perdido. Como a fórmula da Coca-Cola, é a base de tudo e pode ser restaurado a qualquer momento.

### Características

- ✅ **Backups Rolling de 7 Dias**: Um backup por dia da semana
- ✅ **Protótipo Original Preservado**: NUNCA é deletado
- ✅ **Rollback em 1 Clique**: Restaurar qualquer versão instantaneamente
- ✅ **Backup Automático Diário**: Às 3h da manhã
- ✅ **Health Score**: Avaliação de saúde do sistema (0-100)

### Tabelas do Banco de Dados

#### `sistema_pai_backups`
```sql
- id: ID único do backup
- backup_date: Data/hora do backup
- day_of_week: Dia da semana (0-6) para rolling
- version_id: Git commit hash
- backup_type: 'daily', 'manual', 'pre-update', 'sistema-pai'
- is_prototype_original: 1 = Protótipo Original (NUNCA deletar)
- backup_path: Caminho do arquivo .tar.gz
- backup_size: Tamanho em bytes
- system_state: JSON com estado do sistema
- health_score: Score de saúde (0-100)
- restore_count: Quantas vezes foi restaurado
```

#### `sistema_pai_config`
```sql
- backup_enabled: 1 = ativo
- backup_time: Horário do backup (HH:MM)
- max_backups: Máximo de backups rolling (padrão: 7)
- auto_restore_enabled: Restaurar automaticamente em caso de erro
- auto_restore_threshold: Se health score < threshold, restaurar
- prototype_backup_id: ID do protótipo original
```

### Como Usar

#### Criar Backup Manual
```typescript
// Via tRPC
const result = await trpc.sistemaPai.createBackup.mutate({
  type: "manual",
  description: "Backup antes de atualização importante",
  isPrototypeOriginal: false, // true apenas para o protótipo
});
```

#### Restaurar Backup
```typescript
const result = await trpc.sistemaPai.restoreBackup.mutate({
  backupId: 5,
  reason: "manual",
  reasonDetails: "Revertendo mudança problemática",
});
```

#### Restaurar Protótipo Original
```typescript
const result = await trpc.sistemaPai.restorePrototype.mutate({
  reasonDetails: "Problema crítico, voltando à fórmula original",
});
```

---

## 🧪 Auto-Testes Noturnos

### Conceito

Executa **todos os testes automaticamente às 3h da manhã**. Se falhar > 5%, faz rollback automático para versão anterior.

### Características

- ✅ **Agendamento Automático**: 3h da manhã (configurável)
- ✅ **Threshold de Falha**: 5% (configurável)
- ✅ **Rollback Automático**: Se exceder threshold
- ✅ **Notificações**: Email/WhatsApp de resultados
- ✅ **Histórico Completo**: Todas as execuções registradas

### Tabela do Banco de Dados

#### `auto_test_runs`
```sql
- id: ID único da execução
- started_at: Início da execução
- completed_at: Fim da execução
- total_tests: Total de testes executados
- passing_tests: Testes que passaram
- failing_tests: Testes que falharam
- pass_rate: Taxa de aprovação (%)
- status: 'success', 'failed', 'threshold-exceeded'
- action_taken: 'backup-created', 'rollback-triggered', 'none'
```

### Configuração

```typescript
// Atualizar configuração
await updateTestConfig({
  enabled: true,
  cronPattern: "0 0 3 * * *", // 3h da manhã
  failureThreshold: 5, // 5%
  autoRollbackOnFailure: true,
  notifyOnSuccess: false,
  notifyOnFailure: true,
});
```

### Forçar Execução Manual

```typescript
// Para testes
await forceTestNow();
```

---

## 🔧 Auto-Correção Segura

### Conceito

Detecta problemas automaticamente e aplica correções **COM backup antes**. Se correção falhar, **rollback automático**.

### Características

- ✅ **Detecção Automática**: Problemas de teste, crash, memória, API
- ✅ **Backup Antes de Corrigir**: SEMPRE cria backup de segurança
- ✅ **Rollback Automático**: Se correção falhar
- ✅ **Monitoramento Contínuo**: A cada 5 minutos
- ✅ **Estratégias Inteligentes**: restart, rollback, patch

### Tabela do Banco de Dados

#### `auto_correction_attempts`
```sql
- id: ID único da tentativa
- detected_at: Quando o problema foi detectado
- problem_type: 'test-failure', 'crash', 'memory-leak', 'api-error'
- severity: 'low', 'medium', 'high', 'critical'
- backup_id: ID do backup criado antes da correção
- correction_strategy: 'restart', 'rollback', 'patch'
- success: 1 = sucesso, 0 = falha
- rollback_triggered: 1 = rollback foi necessário
```

### Como Usar

```typescript
// Detectar e corrigir problema
const result = await autoCorrection.detectAndCorrect({
  type: "test-failure",
  description: "10 testes falhando após deploy",
  severity: "high",
  metadata: { failingTests: 10 },
});

console.log(result.success); // true/false
console.log(result.rollbackTriggered); // true/false
```

---

## 🤖 API de Auto-Evolução

### Conceito

Permite que **IAs externas** (Manus, Comet, Perplexity, etc) possam:
1. **Conhecer o sistema** através de documentação
2. **Enviar melhorias** e sugestões de código
3. **Receber feedback** sobre implementações
4. **Aprender continuamente** com o uso real

Isso cria um **ciclo de evolução exponencial**! 🚀

### Características

- ✅ **Base de Conhecimento**: Documentação completa do sistema
- ✅ **Validação Automática**: Código é validado antes de aplicar
- ✅ **Aplicação Segura**: Backup antes, rollback se falhar
- ✅ **Feedback Loop**: IAs recebem feedback de suas contribuições
- ✅ **Score de Qualidade**: 0-100 para cada contribuição

### Tabelas do Banco de Dados

#### `ai_knowledge_base`
```sql
- module: Módulo do sistema
- title: Título do conhecimento
- description: Descrição detalhada
- api_endpoint: Endpoint da API (se aplicável)
- tags: Tags para busca
- version: Versão
```

#### `ai_contributions`
```sql
- ai_source: 'manus', 'comet', 'perplexity', etc
- ai_api_key: API key secreta da IA
- contribution_type: 'bug-fix', 'feature', 'optimization', 'documentation'
- title: Título da contribuição
- description: Descrição detalhada
- target_module: Módulo alvo
- proposed_code: Código proposto
- status: 'pending', 'approved', 'rejected', 'applied'
- validation_score: 0-100
```

#### `ai_evolution_feedback`
```sql
- contribution_id: ID da contribuição
- feedback_type: 'success', 'failure', 'improvement-needed'
- message: Mensagem de feedback
- metrics: JSON com métricas (testes, performance, qualidade)
```

### Como Usar

#### 1. Obter Conhecimento (IA Externa)

```typescript
// Buscar conhecimento sobre módulo específico
const knowledge = await trpc.apiAutoEvolucao.getKnowledge.query({
  module: "sistema-pai",
  tags: ["backup", "rollback"],
  search: "restaurar",
});

console.log(knowledge.knowledge); // Array de conhecimentos
```

#### 2. Submeter Contribuição (IA Externa)

```typescript
const result = await trpc.apiAutoEvolucao.submitContribution.mutate({
  aiSource: "manus",
  aiApiKey: "manus-secret-key-12345",
  contributionType: "optimization",
  title: "Otimizar query de backups",
  description: "Adicionar índice na coluna backup_date para melhorar performance",
  targetModule: "sistema-pai",
  targetFile: "server/_core/sistema-pai.ts",
  proposedCode: "// código otimizado aqui...",
});

console.log(result.contributionId); // ID da contribuição
console.log(result.status); // 'approved' ou 'pending'
console.log(result.validation.score); // 0-100
```

#### 3. Obter Feedback (IA Externa)

```typescript
const feedback = await trpc.apiAutoEvolucao.getFeedback.query({
  contributionId: 123,
});

console.log(feedback.feedback); // Array de feedbacks
// Exemplo: "Contribuição aplicada com sucesso! Todos os testes passaram."
```

#### 4. Aplicar Contribuição Manualmente (Admin)

```typescript
const result = await trpc.apiAutoEvolucao.applyContribution.mutate({
  contributionId: 123,
});

console.log(result.success); // true/false
```

### Validação Automática

Contribuições são validadas automaticamente:

1. **Sintaxe TypeScript**: Código tem erros?
2. **Descrição Clara**: Mínimo 50 caracteres
3. **Módulo Válido**: Módulo existe?
4. **Tipo Apropriado**: bug-fix, feature, optimization, documentation

**Score >= 80**: Aplicado automaticamente  
**Score 70-79**: Aprovado, aguarda aplicação manual  
**Score < 70**: Pendente de revisão

---

## 📊 Coleta de Dados e ML

### Conceito

Coleta métricas reais de uso do sistema por **24-48h** e re-treina modelos ML para melhorar acurácia de **30% para 70-90%**.

### Características

- ✅ **Coleta Contínua**: A cada 5 minutos
- ✅ **Métricas Diversas**: API calls, performance, erros, sistema
- ✅ **Re-treinamento Automático**: Com dados reais
- ✅ **Melhoria Mensurável**: Antes vs Depois
- ✅ **Histórico Completo**: Todas as sessões de treinamento

### Tabelas do Banco de Dados

#### `ml_training_data`
```sql
- data_type: 'api-call', 'error', 'performance', 'user-action'
- endpoint: Endpoint da API
- response_time_ms: Tempo de resposta
- memory_usage_mb: Uso de memória
- cpu_percent: Uso de CPU
- success: 1 = sucesso, 0 = falha
- labels: Tags para classificação
```

#### `ml_training_sessions`
```sql
- data_points_count: Quantidade de dados usados
- model_type: 'error-prediction', 'performance-optimization'
- accuracy_before: Acurácia antes (%)
- accuracy_after: Acurácia depois (%)
- improvement: Melhoria (%)
- status: 'running', 'completed', 'failed'
```

### Como Usar

#### Iniciar Coleta

```typescript
await mlDataCollection.startCollection();
// Deixar rodar por 24-48h
```

#### Parar Coleta

```typescript
await mlDataCollection.stopCollection();
```

#### Re-treinar Modelos

```typescript
const result = await mlDataCollection.retrainModels();

console.log(result.accuracyBefore); // 30%
console.log(result.accuracyAfter); // 85%
console.log(result.improvement); // +55%
```

#### Obter Estatísticas

```typescript
const stats = await mlDataCollection.getCollectionStats();

console.log(stats.isCollecting); // true/false
console.log(stats.totalDataPoints); // 5000
console.log(stats.dataPointsByType); // { 'api-call': 3000, 'performance': 2000 }
```

---

## 🚀 Como Usar

### Inicialização

Tudo é inicializado automaticamente quando o servidor inicia:

```typescript
// server/_core/index.ts
server.listen(port, () => {
  // Sistema Pai e backups
  initializeBackupScheduler();
  
  // Auto-testes noturnos
  initializeAutoTestScheduler();
  
  // Monitoramento e auto-correção
  startHealthMonitoring();
});
```

### Primeiro Uso

1. **Popular Base de Conhecimento**:
```typescript
await trpc.apiAutoEvolucao.populateKnowledgeBase.mutate();
```

2. **Criar Protótipo Original**:
```typescript
await trpc.sistemaPai.createBackup.mutate({
  type: "sistema-pai",
  description: "Protótipo Original - Fórmula da Coca-Cola",
  isPrototypeOriginal: true,
});
```

3. **Iniciar Coleta de Dados ML**:
```typescript
await mlDataCollection.startCollection();
```

---

## 📡 Endpoints da API

### Sistema Pai

- `POST /api/trpc/sistemaPai.createBackup` - Criar backup
- `POST /api/trpc/sistemaPai.restoreBackup` - Restaurar backup
- `POST /api/trpc/sistemaPai.restorePrototype` - Restaurar protótipo
- `GET /api/trpc/sistemaPai.listBackups` - Listar backups
- `GET /api/trpc/sistemaPai.getConfig` - Obter configuração
- `POST /api/trpc/sistemaPai.updateConfig` - Atualizar configuração

### API de Auto-Evolução

- `GET /api/trpc/apiAutoEvolucao.getKnowledge` - Obter conhecimento (público)
- `POST /api/trpc/apiAutoEvolucao.submitContribution` - Submeter contribuição (público)
- `GET /api/trpc/apiAutoEvolucao.getFeedback` - Obter feedback (público)
- `GET /api/trpc/apiAutoEvolucao.listPendingContributions` - Listar pendentes (admin)
- `POST /api/trpc/apiAutoEvolucao.applyContribution` - Aplicar contribuição (admin)

---

## 🎓 Exemplos de Uso para IAs Externas

### Exemplo 1: Manus Conhecendo o Sistema

```typescript
// 1. Buscar conhecimento sobre backups
const knowledge = await fetch("https://seu-servidor.com/api/trpc/apiAutoEvolucao.getKnowledge", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    module: "sistema-pai",
    tags: ["backup"],
  }),
});

// 2. Ler documentação
const docs = await knowledge.json();
console.log(docs.knowledge[0].description);
```

### Exemplo 2: Comet Enviando Melhoria

```typescript
// 1. Submeter otimização
const contribution = await fetch("https://seu-servidor.com/api/trpc/apiAutoEvolucao.submitContribution", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    aiSource: "comet",
    aiApiKey: "comet-secret-key-xyz",
    contributionType: "optimization",
    title: "Cache de backups para melhor performance",
    description: "Adicionar cache Redis para lista de backups, reduzindo queries ao banco",
    targetModule: "sistema-pai",
    proposedCode: "// implementação do cache...",
  }),
});

// 2. Verificar resultado
const result = await contribution.json();
console.log(result.validation.score); // 95
console.log(result.status); // 'approved'

// 3. Aguardar feedback
setTimeout(async () => {
  const feedback = await fetch("https://seu-servidor.com/api/trpc/apiAutoEvolucao.getFeedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contributionId: result.contributionId,
    }),
  });
  
  const feedbackData = await feedback.json();
  console.log(feedbackData.feedback[0].message);
  // "Contribuição aplicada com sucesso! Performance melhorou 40%"
}, 60000); // 1 minuto depois
```

---

## 🔐 Segurança

### API Keys

Cada IA externa precisa de uma API key:

```typescript
// Formato: {ai-source}-secret-key-{random}
"manus-secret-key-abc123"
"comet-secret-key-xyz789"
"perplexity-secret-key-def456"
```

### Validação

- ✅ API key é validada antes de aceitar contribuição
- ✅ Código é validado (sintaxe TypeScript)
- ✅ Testes são executados antes de aplicar
- ✅ Backup é criado antes de qualquer mudança
- ✅ Rollback automático se algo falhar

---

## 📈 Métricas e Monitoramento

### Health Score

O sistema calcula um "Health Score" (0-100) baseado em:

- **50%**: Taxa de aprovação de testes
- **30%**: Ausência de testes falhando
- **20%**: Quantidade de testes (mínimo 100)

### Notificações

O sistema notifica automaticamente:

- ✅ Backup criado/restaurado
- ✅ Testes noturnos concluídos
- ✅ Auto-correção aplicada
- ✅ Contribuição de IA recebida
- ✅ Modelos ML re-treinados

---

## 🎯 Próximos Passos

1. **Deixar coletar dados por 24-48h**
2. **Re-treinar modelos ML**
3. **Testar contribuições de IAs externas**
4. **Monitorar health score**
5. **Ajustar thresholds conforme necessário**

---

## 📞 Suporte

Para dúvidas ou problemas:
- Verificar logs do sistema
- Consultar histórico de backups
- Revisar tentativas de auto-correção
- Analisar contribuições pendentes

---

**Desenvolvido com ❤️ por Manus**  
**Autorizado por: Rudson Oliveira**  
**Data: 28/11/2025**
