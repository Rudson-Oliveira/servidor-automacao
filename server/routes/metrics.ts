/**
 * Prometheus Metrics Endpoint
 * Expõe métricas do servidor em formato Prometheus
 */

import { Router, Request, Response } from "express";
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from "prom-client";

const router = Router();

// ==================== CONFIGURAÇÃO ====================

// Coletar métricas padrão do Node.js (CPU, memória, event loop, etc)
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

// Contador de desconexões WebSocket
export const websocketDisconnections = new Counter({
  name: 'websocket_disconnections_total',
  help: 'Total de desconexões WebSocket',
  labelNames: ['reason']
});

// Contador de comandos executados
export const commandsExecuted = new Counter({
  name: 'commands_executed_total',
  help: 'Total de comandos executados pelos Desktop Agents',
  labelNames: ['agent_id', 'command_type', 'status']
});

// Histograma de tempo de execução de comandos
export const commandExecutionDuration = new Histogram({
  name: 'command_execution_duration_seconds',
  help: 'Tempo de execução de comandos em segundos',
  labelNames: ['command_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120]
});

// Gauge de agents online
export const agentsOnline = new Gauge({
  name: 'agents_online',
  help: 'Número de Desktop Agents online'
});

// Contador de mensagens LLM
export const llmMessagesTotal = new Counter({
  name: 'llm_messages_total',
  help: 'Total de mensagens enviadas para LLMs',
  labelNames: ['provider', 'model', 'status']
});

// Histograma de latência de LLM
export const llmLatency = new Histogram({
  name: 'llm_latency_seconds',
  help: 'Latência de requisições para LLMs em segundos',
  labelNames: ['provider', 'model'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30, 60]
});

// Contador de tokens consumidos
export const llmTokensConsumed = new Counter({
  name: 'llm_tokens_consumed_total',
  help: 'Total de tokens consumidos de LLMs',
  labelNames: ['provider', 'model', 'type'] // type: input, output
});

// Gauge de pool de conexões do banco
export const dbConnectionPoolActive = new Gauge({
  name: 'db_connection_pool_active',
  help: 'Conexões ativas no pool do banco de dados'
});

export const dbConnectionPoolMax = new Gauge({
  name: 'db_connection_pool_max',
  help: 'Máximo de conexões no pool do banco de dados'
});

// Histograma de duração de queries
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duração de queries do banco em segundos',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2]
});

// Contador de erros
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total de erros no sistema',
  labelNames: ['type', 'component']
});

// ==================== MIDDLEWARE ====================

/**
 * Middleware para coletar métricas de requisições HTTP
 */
export function metricsMiddleware(req: Request, res: Response, next: Function) {
  const start = Date.now();
  
  // Hook no evento 'finish' da resposta
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

// ==================== ENDPOINTS ====================

/**
 * GET /api/metrics
 * Endpoint principal de métricas (formato Prometheus)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error("[Metrics] Erro ao gerar métricas:", error);
    res.status(500).end();
  }
});

/**
 * GET /api/metrics/agents
 * Métricas específicas de Desktop Agents
 */
router.get("/agents", async (req: Request, res: Response) => {
  try {
    // Importar dinamicamente para evitar dependência circular
    const { getDesktopAgentServer } = await import("../services/desktopAgentServer");
    const server = getDesktopAgentServer();
    
    if (!server) {
      return res.status(503).json({
        error: "Desktop Agent Server não inicializado"
      });
    }
    
    // Atualizar gauge de conexões ativas
    const activeCount = server.getActiveConnectionsCount();
    websocketActiveConnections.set(activeCount);
    
    // Retornar métricas em formato JSON (para debug)
    res.json({
      active_connections: activeCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[Metrics] Erro ao coletar métricas de agents:", error);
    res.status(500).json({
      error: "Erro ao coletar métricas"
    });
  }
});

/**
 * GET /api/metrics/health
 * Health check simples
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
