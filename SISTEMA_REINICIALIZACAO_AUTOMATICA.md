# 🔄 Sistema de Reinicialização Automática de Serviços

## 📋 Visão Geral

Sistema completo de reinicialização automática implementado com 3 camadas de proteção:

1. **Integração PM2** - Gerenciamento robusto de processos
2. **Health Checks Inteligentes** - Detecção precoce de problemas
3. **Retry com Backoff Exponencial** - Recuperação inteligente

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Auto-Healing System                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Health Check │→ │  Diagnóstico │→ │ Auto-Correção│     │
│  │  (30s loop)  │  │     (LLM)    │  │  (Retry)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ↓                  ↓                  ↓             │
│  ┌──────────────────────────────────────────────────┐      │
│  │          Retry Handler (Backoff Exponencial)     │      │
│  │          Tentativas: 2s, 4s, 8s (máx 3x)        │      │
│  └──────────────────────────────────────────────────┘      │
│         ↓                                                   │
│  ┌──────────────────────────────────────────────────┐      │
│  │              PM2 Process Manager                  │      │
│  │         Auto-restart, Logs, Monitoring           │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Instalação e Configuração

### 1. Instalar PM2 Globalmente

```bash
npm install -g pm2
```

### 2. Iniciar Servidor com PM2

```bash
cd /home/ubuntu/servidor-automacao
pm2 start ecosystem.config.js
```

### 3. Configurar PM2 para Iniciar no Boot

```bash
pm2 startup
pm2 save
```

### 4. Verificar Status

```bash
pm2 list
pm2 logs servidor-automacao
pm2 monit
```

## 📁 Arquivos Criados

### 1. `ecosystem.config.js` (Configuração PM2)

**Funcionalidades:**
- Auto-restart em caso de crash
- Máximo de 10 reinicializações
- Restart se memória > 500MB
- Logs persistentes em `./logs/`
- Backoff exponencial (100ms base)
- Cron restart diário (3h da manhã)

**Configurações Principais:**
```javascript
{
  autorestart: true,
  max_restarts: 10,
  max_memory_restart: '500M',
  exp_backoff_restart_delay: 100,
  cron_restart: '0 3 * * *',
}
```

### 2. `server/_core/health-checks.ts` (Health Checks)

**Funcionalidades:**
- Verifica banco de dados (query simples)
- Monitora uso de memória (threshold: 75%, 90%)
- Monitora uso de CPU (threshold: 60%, 80%)
- Monitora espaço em disco (threshold: 80%, 90%)
- Verificações a cada 30 segundos

**Estados:**
- `healthy` - Tudo funcionando normalmente
- `degraded` - Problemas não críticos detectados
- `unhealthy` - Problemas críticos que requerem ação

**Endpoints:**
```typescript
GET /api/trpc/health.check   // Executa verificação completa
GET /api/trpc/health.status  // Retorna último resultado (cache)
GET /api/trpc/health.simple  // Endpoint simples (load balancers)
```

### 3. `server/_core/retry-handler.ts` (Retry com Backoff)

**Funcionalidades:**
- Backoff exponencial configurável
- Máximo de tentativas configurável
- Callback em cada tentativa
- Histórico de tentativas
- Estatísticas de sucesso/falha

**Configuração Padrão:**
```typescript
{
  maxAttempts: 6,
  initialDelayMs: 1000,
  maxDelayMs: 32000,
  backoffMultiplier: 2,
}
```

**Delays:**
- Tentativa 1: 1s
- Tentativa 2: 2s
- Tentativa 3: 4s
- Tentativa 4: 8s
- Tentativa 5: 16s
- Tentativa 6: 32s (máximo)

### 4. `server/_core/auto-healing.ts` (Modificado)

**Novas Funcionalidades:**
- Integração com health checks
- Reinicialização via PM2 com retry
- Fallback inteligente se PM2 não disponível
- Logs detalhados de tentativas

**Fluxo de Reinicialização:**
1. Detecta problema (memória crítica, CPU alta, etc)
2. Diagnostica com IA (LLM)
3. Decide ação (reinicialização)
4. Executa com retry (3 tentativas: 2s, 4s, 8s)
5. Registra resultado

## 🎯 Casos de Uso

### 1. Memória Crítica (>90%)

**Detecção:**
```
[Health Checks] Sistema unhealthy: memory
[Auto-Healing] Memória crítica detectada: 92.5%
```

**Ação:**
1. Executa garbage collection
2. Limpa cache (métricas antigas, erros antigos)
3. Se persistir, reinicia serviço

### 2. Serviço Travado

**Detecção:**
```
[Health Checks] Sistema unhealthy: database
[Auto-Healing] Banco de dados não responsivo
```

**Ação:**
1. Tenta reconectar (retry 3x)
2. Se falhar, reinicia serviço completo
3. Notifica administrador

### 3. CPU Alta (>80%)

**Detecção:**
```
[Health Checks] Sistema degraded: cpu
[Auto-Healing] CPU alta detectada: 85.3%
```

**Ação:**
1. Monitora por 2 minutos
2. Se persistir, identifica processos pesados
3. Considera reinicialização

## 📊 Monitoramento

### Comandos PM2

```bash
# Ver status de todos os processos
pm2 list

# Ver logs em tempo real
pm2 logs servidor-automacao

# Ver logs de erro
pm2 logs servidor-automacao --err

# Ver monitoramento (CPU, RAM)
pm2 monit

# Ver informações detalhadas
pm2 show servidor-automacao

# Reiniciar manualmente
pm2 restart servidor-automacao

# Parar serviço
pm2 stop servidor-automacao

# Deletar do PM2
pm2 delete servidor-automacao
```

### Endpoints de Health Check

```bash
# Verificação completa (executa agora)
curl http://localhost:3000/api/trpc/health.check

# Status em cache (rápido)
curl http://localhost:3000/api/trpc/health.status

# Simples (para load balancers)
curl http://localhost:3000/api/trpc/health.simple
```

### Logs de Auto-Healing

```bash
# Ver logs do PM2
tail -f logs/pm2-out.log
tail -f logs/pm2-error.log

# Logs do sistema (stdout)
pm2 logs servidor-automacao --lines 100
```

## 🔧 Configuração Avançada

### Ajustar Intervalo de Health Checks

Em `server/_core/auto-healing.ts`:

```typescript
// Padrão: 30 segundos
healthChecker.startPeriodicChecks(30000);

// Mais agressivo: 10 segundos
healthChecker.startPeriodicChecks(10000);

// Mais leve: 60 segundos
healthChecker.startPeriodicChecks(60000);
```

### Ajustar Thresholds de Memória/CPU

Em `server/_core/health-checks.ts`:

```typescript
// Memória
if (percentUsed > 90) {  // Crítico
  status = 'unhealthy';
} else if (percentUsed > 75) {  // Atenção
  status = 'degraded';
}

// CPU
if (cpuPercent > 80) {  // Crítico
  status = 'unhealthy';
} else if (cpuPercent > 60) {  // Atenção
  status = 'degraded';
}
```

### Ajustar Retry Attempts

Em `server/_core/auto-healing.ts`:

```typescript
const result = await retryManager.executeWithRetry(
  'pm2-restart',
  async () => { ... },
  {
    maxAttempts: 5,        // Aumentar tentativas
    initialDelayMs: 1000,  // Delay inicial menor
    backoffMultiplier: 3,  // Crescimento mais rápido
  }
);
```

## 🚨 Troubleshooting

### PM2 não instalado

**Erro:**
```
PM2 não disponível: Command 'which pm2' exited with code 1
```

**Solução:**
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### Servidor não gerenciado por PM2

**Erro:**
```
Servidor não gerenciado por PM2 - reinicialização manual necessária
```

**Solução:**
```bash
# Parar servidor atual (Ctrl+C)
# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
```

### Reinicializações Excessivas

**Sintoma:**
```
[PM2] App [servidor-automacao] has reached max restarts (10)
```

**Solução:**
```bash
# Ver logs de erro
pm2 logs servidor-automacao --err

# Corrigir problema raiz
# Resetar contador
pm2 reset servidor-automacao
```

### Health Checks Falhando

**Sintoma:**
```
[Health Checks] Sistema unhealthy: database
```

**Diagnóstico:**
```bash
# Verificar conexão com banco
mysql -h <host> -u <user> -p

# Ver logs do servidor
pm2 logs servidor-automacao

# Testar endpoint manualmente
curl http://localhost:3000/api/trpc/health.check
```

## 📈 Métricas e Estatísticas

### Estatísticas de Retry

```typescript
import { retryManager } from './server/_core/retry-handler';

// Obter estatísticas de um serviço
const stats = retryManager.getStats('pm2-restart');

console.log(stats);
// {
//   totalAttempts: 15,
//   successfulAttempts: 12,
//   failedAttempts: 3,
//   successRate: 80,
//   averageAttempts: 1.8
// }
```

### Histórico de Health Checks

```typescript
import { healthChecker } from './server/_core/health-checks';

// Obter último resultado
const lastCheck = healthChecker.getLastCheck();

console.log(lastCheck);
// {
//   overall: 'healthy',
//   checks: [
//     { component: 'database', status: 'healthy', responseTime: 45 },
//     { component: 'memory', status: 'healthy', responseTime: 2 },
//     { component: 'cpu', status: 'healthy', responseTime: 1 },
//     { component: 'disk', status: 'healthy', responseTime: 12 }
//   ],
//   uptime: 3600,
//   timestamp: '2025-01-26T12:00:00.000Z'
// }
```

## 🎓 Boas Práticas

### 1. Sempre Usar PM2 em Produção

✅ **Correto:**
```bash
pm2 start ecosystem.config.js
pm2 save
```

❌ **Evitar:**
```bash
npm run dev  # Sem auto-restart
node server/index.js  # Sem gerenciamento
```

### 2. Monitorar Logs Regularmente

```bash
# Ver logs em tempo real
pm2 logs servidor-automacao --lines 50

# Configurar alertas (opcional)
pm2 install pm2-logrotate
```

### 3. Configurar Alertas

```bash
# Instalar módulo de notificações
pm2 install pm2-slack
pm2 set pm2-slack:slack_url https://hooks.slack.com/...
```

### 4. Backup de Configuração

```bash
# Salvar configuração atual
pm2 save

# Exportar para arquivo
pm2 dump
```

## 🔮 Próximas Melhorias

- [ ] Integração com Slack/Discord para notificações
- [ ] Dashboard visual de health checks em `/health`
- [ ] Métricas históricas (gráficos de CPU/RAM)
- [ ] Circuit breaker re-implementado (com limites de recursos)
- [ ] Predição de falhas com machine learning
- [ ] Auto-scaling horizontal (múltiplas instâncias)

## 📚 Referências

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Health Check Patterns](https://microservices.io/patterns/observability/health-check-api.html)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---

**Status:** ✅ Sistema completo e funcional
**Versão:** 1.0.0
**Data:** 26/11/2025
