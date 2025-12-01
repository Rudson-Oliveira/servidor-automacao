# 🎓 Documentação de Ensino para LLMs - Servidor de Automação

**Autor**: Manus AI  
**Data**: 01/Dezembro/2025  
**Versão**: 1.0.0  
**Objetivo**: Ensinar LLMs a implementar melhorias em sistemas complexos através de exemplos práticos

---

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Stress Testing](#stress-testing)
3. [Monitoramento com Prometheus](#monitoramento-com-prometheus)
4. [Testes E2E](#testes-e2e)
5. [Padrões de Arquitetura](#padrões-de-arquitetura)
6. [Boas Práticas](#boas-práticas)
7. [Troubleshooting](#troubleshooting)
8. [Referências](#referências)

---

## 🎯 Visão Geral

Este documento ensina LLMs (Large Language Models) a implementar **melhorias críticas** em sistemas de produção, utilizando como exemplo o **Servidor de Automação**. O objetivo é demonstrar **metodologias práticas** para stress testing, monitoramento e testes automatizados.

### Contexto do Sistema

O **Servidor de Automação** é uma aplicação Node.js/TypeScript que integra múltiplos serviços:

- **Backend**: Express + tRPC + WebSocket
- **Banco de Dados**: MySQL/TiDB com Drizzle ORM
- **Cache**: Redis
- **Integrações**: Obsidian, WhatsApp Web, Multi-LLM (Claude, Gemini, Perplexity)
- **Desktop Agents**: WebSocket bidirectional para controle remoto

### Desafios Enfrentados

1. **Escalabilidade**: Como validar que o sistema suporta 10+ agents simultâneos?
2. **Observabilidade**: Como monitorar métricas em tempo real?
3. **Qualidade**: Como garantir que novas features não quebram funcionalidades existentes?

---

## 🔥 Stress Testing

### Objetivo

Validar que o sistema **escala horizontalmente** e identifica **gargalos de performance** antes de chegar em produção.

### Metodologia

#### 1. Definir Requisitos de Performance

Antes de escrever qualquer código, defina **métricas claras**:

```
- Throughput: 100 requisições/minuto por worker
- Latência P95: < 200ms
- Taxa de sucesso: > 95%
- Agents simultâneos: 10+
```

#### 2. Escolher Ferramenta Adequada

Para **APIs REST**, use bibliotecas assíncronas:

```python
import aiohttp  # Python
import asyncio

# OU

import { default as axios } from 'axios';  // Node.js
```

Para **WebSocket**, use bibliotecas nativas:

```python
import websockets  # Python

# OU

import WebSocket from 'ws';  // Node.js
```

#### 3. Implementar Script de Stress Test

**Estrutura Recomendada**:

```python
# stress-test-api.py

import asyncio
import aiohttp
import time
import statistics
from typing import List, Dict

# ==================== CONFIGURAÇÃO ====================

BASE_URL = "https://api.example.com"
NUM_WORKERS = 10
REQUESTS_PER_MINUTE = 100
TEST_DURATION_SECONDS = 60

# ==================== CLASSES ====================

class WorkerMetrics:
    """Métricas de performance de um worker"""
    
    def __init__(self, worker_id: int):
        self.worker_id = worker_id
        self.requests_sent = 0
        self.requests_success = 0
        self.requests_failed = 0
        self.response_times: List[float] = []
        self.errors: List[str] = []
    
    def add_response_time(self, duration: float):
        self.response_times.append(duration)
    
    def get_stats(self) -> Dict:
        if not self.response_times:
            return {"avg": 0, "p95": 0, "p99": 0}
        
        sorted_times = sorted(self.response_times)
        p95_index = int(len(sorted_times) * 0.95)
        p99_index = int(len(sorted_times) * 0.99)
        
        return {
            "avg": statistics.mean(self.response_times),
            "p95": sorted_times[p95_index],
            "p99": sorted_times[p99_index]
        }

# ==================== WORKER ====================

class StressTestWorker:
    """Worker de stress test"""
    
    def __init__(self, worker_id: int, metrics: WorkerMetrics):
        self.worker_id = worker_id
        self.metrics = metrics
        self.session = None
    
    async def make_request(self, endpoint: str):
        """Faz requisição HTTP"""
        start_time = time.time()
        
        try:
            async with self.session.get(f"{BASE_URL}{endpoint}") as response:
                await response.text()
                status = response.status
            
            duration = time.time() - start_time
            self.metrics.requests_sent += 1
            self.metrics.add_response_time(duration)
            
            if 200 <= status < 300:
                self.metrics.requests_success += 1
            else:
                self.metrics.requests_failed += 1
        except Exception as e:
            self.metrics.requests_failed += 1
            self.metrics.errors.append(str(e))
    
    async def run(self, duration: int):
        """Executa teste por X segundos"""
        timeout = aiohttp.ClientTimeout(total=10)
        self.session = aiohttp.ClientSession(timeout=timeout)
        
        interval = 60.0 / REQUESTS_PER_MINUTE
        end_time = time.time() + duration
        
        while time.time() < end_time:
            await self.make_request("/api/status")
            await asyncio.sleep(interval)
        
        await self.session.close()

# ==================== MAIN ====================

async def run_stress_test():
    """Executa stress test completo"""
    workers = []
    metrics_list = []
    
    # Criar workers
    for i in range(1, NUM_WORKERS + 1):
        metrics = WorkerMetrics(i)
        worker = StressTestWorker(i, metrics)
        workers.append(worker)
        metrics_list.append(metrics)
    
    # Executar em paralelo
    start_time = time.time()
    tasks = [worker.run(TEST_DURATION_SECONDS) for worker in workers]
    await asyncio.gather(*tasks)
    total_duration = time.time() - start_time
    
    # Agregar resultados
    total_requests = sum(m.requests_sent for m in metrics_list)
    total_success = sum(m.requests_success for m in metrics_list)
    throughput = total_requests / total_duration
    
    print(f"Total de requisições: {total_requests}")
    print(f"Taxa de sucesso: {total_success/total_requests*100:.2f}%")
    print(f"Throughput: {throughput:.2f} req/s")
    
    # Identificar gargalos
    all_times = []
    for m in metrics_list:
        all_times.extend(m.response_times)
    
    avg_latency = statistics.mean(all_times) * 1000
    if avg_latency > 200:
        print(f"⚠️  GARGALO: Latência média alta ({avg_latency:.2f}ms)")

if __name__ == "__main__":
    asyncio.run(run_stress_test())
```

#### 4. Analisar Resultados

**Métricas Chave**:

| Métrica | Valor Ideal | Valor Crítico |
|---------|-------------|---------------|
| **Throughput** | > 90% do esperado | < 50% do esperado |
| **Latência P95** | < 200ms | > 1000ms |
| **Taxa de Sucesso** | > 95% | < 80% |
| **Taxa de Erro** | < 5% | > 20% |

**Exemplo de Resultado Excelente**:

```
Total de requisições: 970
Taxa de sucesso: 100%
Latência média: 23.8ms
P95: 41.6ms | P99: 139.8ms
Throughput: 16 req/s

✅ NENHUM GARGALO DETECTADO
```

### Lições Aprendidas

1. **Sempre teste com carga realista**: 10 workers simultâneos é um bom ponto de partida
2. **Meça P95/P99, não apenas média**: Outliers importam
3. **Salve relatórios em JSON**: Facilita análise histórica
4. **Teste APIs REST antes de WebSocket**: Mais simples de debugar

---

## 📊 Monitoramento com Prometheus

### Objetivo

Coletar **métricas em tempo real** e configurar **alertas automáticos** para problemas críticos.

### Metodologia

#### 1. Instalar Biblioteca de Métricas

```bash
pnpm add prom-client
```

#### 2. Criar Endpoint de Métricas

```typescript
// server/routes/metrics.ts

import { Router } from "express";
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from "prom-client";

const router = Router();

// Coletar métricas padrão (CPU, memória, event loop)
collectDefaultMetrics({ prefix: 'nodejs_' });

// ==================== MÉTRICAS CUSTOMIZADAS ====================

// Contador de requisições HTTP
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP recebidas',
  labelNames: ['method', 'route', 'status']
});

// Histograma de duração de requisições
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

// Gauge de conexões WebSocket ativas
export const websocketActiveConnections = new Gauge({
  name: 'websocket_active_connections',
  help: 'Número de conexões WebSocket ativas'
});

// ==================== MIDDLEWARE ====================

export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route,
      status: res.statusCode
    }, duration);
  });
  
  next();
}

// ==================== ENDPOINT ====================

router.get("/", async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;
```

#### 3. Registrar Middleware

```typescript
// server/_core/index.ts

import metricsRouter, { metricsMiddleware } from "../routes/metrics";

app.use(metricsMiddleware);  // Coletar métricas de todas as requisições
app.use("/api/metrics", metricsRouter);
```

#### 4. Configurar Prometheus

```yaml
# prometheus.yml

global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'servidor-automacao'
    scrape_interval: 10s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
```

#### 5. Criar Regras de Alerta

```yaml
# alerts.yml

groups:
  - name: servidor_automacao_alerts
    interval: 30s
    rules:
      # CPU alta
      - alert: HighCPUUsage
        expr: 100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "CPU alta"
          description: "Uso de CPU está em {{ $value }}% (> 80%)"
      
      # Memória alta
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Memória alta"
          description: "Uso de memória está em {{ $value }}% (> 90%)"
      
      # Latência alta
      - alert: HighAPILatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "Latência alta na API"
          description: "P95 da latência está em {{ $value }}s (> 1s)"
```

#### 6. Criar Dashboard Web

Para ambientes sem Grafana, crie um **dashboard HTML simples**:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard de Métricas</title>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: #e2e8f0; }
        .card { background: #1e293b; padding: 20px; border-radius: 12px; }
        .card-value { font-size: 2.5rem; color: #60a5fa; }
    </style>
</head>
<body>
    <div class="card">
        <div>Requisições/Segundo</div>
        <div class="card-value" id="requestsPerSecond">0</div>
    </div>
    
    <script>
        async function updateMetrics() {
            const response = await fetch('/api/metrics');
            const text = await response.text();
            
            // Parse Prometheus format
            const metrics = parsePrometheusMetrics(text);
            
            // Update UI
            document.getElementById('requestsPerSecond').textContent = 
                calculateRequestsPerSecond(metrics);
        }
        
        setInterval(updateMetrics, 5000);  // Atualizar a cada 5s
    </script>
</body>
</html>
```

### Lições Aprendidas

1. **Sempre use histogramas para latência**: Médias escondem outliers
2. **Configure alertas antes do deploy**: Não espere problemas acontecerem
3. **Use labels para filtrar métricas**: `{method="POST", status="500"}`
4. **Crie dashboards simples primeiro**: Grafana pode vir depois

---

## 🧪 Testes E2E

### Objetivo

Garantir que **todas as integrações funcionam** e que **novas features não quebram** funcionalidades existentes.

### Metodologia

#### 1. Estruturar Testes com Vitest

```typescript
// server/auth.logout.test.ts

import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";

describe("auth.logout", () => {
  it("deve limpar cookie de sessão", async () => {
    const clearedCookies = [];
    
    const ctx = {
      user: { id: 1, email: "test@example.com" },
      req: { protocol: "https", headers: {} },
      res: {
        clearCookie: (name, options) => {
          clearedCookies.push({ name, options });
        }
      }
    };
    
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0].name).toBe(COOKIE_NAME);
    expect(clearedCookies[0].options).toMatchObject({
      maxAge: -1,
      secure: true,
      httpOnly: true
    });
  });
});
```

#### 2. Mockar Dependências Externas

**Problema**: Testes não devem depender de banco de dados real.

**Solução**: Usar mocks.

```typescript
import { vi } from 'vitest';

// Mock do banco de dados
vi.mock('../db', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 1, email: "test@example.com" }])
        })
      })
    })
  }))
}));
```

#### 3. Testar Integrações Críticas

**WebSocket**:

```typescript
import WebSocket from 'ws';

describe("WebSocket Connection", () => {
  it("deve autenticar com token válido", async () => {
    const ws = new WebSocket('ws://localhost:3000/desktop-agent', {
      headers: { Authorization: 'Bearer valid-token' }
    });
    
    await new Promise((resolve) => {
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'auth_success') {
          expect(msg.agentId).toBeDefined();
          resolve();
        }
      });
    });
    
    ws.close();
  });
});
```

**API REST**:

```typescript
import request from 'supertest';
import { app } from '../server';

describe("Status API", () => {
  it("deve retornar status do sistema", async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);
    
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('uptime');
  });
});
```

#### 4. Executar Testes em CI/CD

```yaml
# .github/workflows/test.yml

name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Lições Aprendidas

1. **Sempre mocke dependências externas**: Testes devem ser isolados
2. **Separe testes unitários de integração**: Use pastas diferentes
3. **Configure timeout adequado**: WebSocket pode demorar
4. **Use TestContainers para testes de DB**: Evita estado compartilhado

---

## 🏗️ Padrões de Arquitetura

### Separação de Responsabilidades

**Estrutura Recomendada**:

```
server/
  _core/           → Infraestrutura (OAuth, context, env)
  routes/          → Endpoints REST
  routers/         → tRPC procedures
  services/        → Lógica de negócio
  db*.ts           → Queries isoladas
```

**Exemplo**:

```typescript
// ❌ RUIM: Lógica de negócio no controller
router.post("/create-agent", async (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  const agent = await db.insert(desktopAgents).values({
    userId: req.user.id,
    token,
    deviceName: req.body.deviceName
  });
  res.json({ agent });
});

// ✅ BOM: Lógica isolada em serviço
router.post("/create-agent", async (req, res) => {
  const agent = await createAgent(req.user.id, req.body.deviceName);
  res.json({ agent });
});

// server/db-desktop-control.ts
export async function createAgent(userId: number, deviceName: string) {
  const token = crypto.randomBytes(32).toString("hex");
  return await db.insert(desktopAgents).values({
    userId,
    token,
    deviceName,
    status: "offline"
  });
}
```

### Validação com Zod

**Sempre valide entrada do usuário**:

```typescript
import { z } from 'zod';

const CreateAgentSchema = z.object({
  deviceName: z.string().min(1).max(255),
  platform: z.enum(["windows", "macos", "linux"]).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional()
});

router.post("/create-agent", async (req, res) => {
  try {
    const data = CreateAgentSchema.parse(req.body);
    const agent = await createAgent(req.user.id, data.deviceName);
    res.json({ agent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    throw error;
  }
});
```

### Error Handling

**Use hierarquia de erros**:

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, "VALIDATION_ERROR");
  }
}

class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message, "NOT_FOUND");
  }
}

// Middleware de erro
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    });
  }
  
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
```

---

## ✅ Boas Práticas

### 1. Sempre Use TypeScript Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 2. Configure Linter

```json
// .eslintrc.json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### 3. Use Conventional Commits

```
feat: adicionar endpoint de métricas Prometheus
fix: corrigir timeout em WebSocket
docs: atualizar README com instruções de deploy
test: adicionar testes para auth.logout
```

### 4. Documente Código Complexo

```typescript
/**
 * Autentica um Desktop Agent pelo token
 * 
 * @param ws - WebSocket connection
 * @param message - Mensagem de autenticação contendo token
 * @param req - HTTP request original (para obter IP)
 * 
 * @throws {Error} Se o token for inválido
 * 
 * @example
 * await handleAuth(ws, { type: 'auth', token: 'abc123' }, req);
 */
private async handleAuth(ws, message, req) {
  // ...
}
```

### 5. Use Variáveis de Ambiente

```typescript
// ❌ RUIM: Hardcoded
const API_KEY = "sk-1234567890";

// ✅ BOM: Variável de ambiente
const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  throw new Error("OPENAI_API_KEY não configurada");
}
```

---

## 🔧 Troubleshooting

### Problema 1: Testes Falhando com Erro de Banco

**Sintoma**:

```
Failed query: insert into `desktop_agents` ...
```

**Causa**: Testes dependem de banco de dados real.

**Solução**: Mockar banco de dados.

```typescript
import { vi } from 'vitest';

vi.mock('../db', () => ({
  getDb: vi.fn(() => mockDb)
}));
```

---

### Problema 2: WebSocket Rejeita Conexões

**Sintoma**:

```
server rejected WebSocket connection: HTTP 200
```

**Causa**: Gateway não está fazendo upgrade para WebSocket.

**Solução**: Verificar headers.

```typescript
// Adicionar header explicitamente
const headers = {
  'Upgrade': 'websocket',
  'Connection': 'Upgrade'
};
```

---

### Problema 3: Métricas Não Aparecem

**Sintoma**: Endpoint `/api/metrics` retorna vazio.

**Causa**: Middleware não está registrado.

**Solução**: Registrar antes das rotas.

```typescript
app.use(metricsMiddleware);  // ANTES das rotas
app.use("/api", router);
```

---

## 📚 Referências

Este documento foi criado com base em práticas reais de implementação do **Servidor de Automação**. Para mais informações, consulte:

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🎓 Conclusão

Este documento demonstrou **metodologias práticas** para implementar melhorias críticas em sistemas de produção. As principais lições são:

1. **Stress Testing**: Sempre valide escalabilidade antes do deploy
2. **Monitoramento**: Configure alertas automáticos para problemas críticos
3. **Testes E2E**: Garanta que integrações funcionam
4. **Arquitetura**: Separe responsabilidades e use padrões consistentes
5. **Boas Práticas**: TypeScript strict, linter, conventional commits

**Próximos Passos**:

- Implementar Circuit Breaker para APIs externas
- Adicionar distributed tracing (Jaeger)
- Configurar CI/CD com GitHub Actions
- Aumentar cobertura de testes para > 80%

---

**Autor**: Manus AI  
**Data**: 01/Dezembro/2025  
**Versão**: 1.0.0
