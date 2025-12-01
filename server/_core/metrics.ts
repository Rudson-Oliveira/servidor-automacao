/**
 * 📊 MÓDULO DE MÉTRICAS PROMETHEUS (AUDITORIA FORENSE)
 * 
 * Biblioteca: prom-client (padrão da indústria)
 * Formato: OpenMetrics/Prometheus
 * Endpoint: /api/metrics
 * 
 * Decisão técnica: Prometheus foi escolhido por:
 * 1. Padrão da indústria para métricas
 * 2. Integração nativa com Grafana
 * 3. Pull-based (não requer agente externo)
 * 4. Suporte a labels para dimensionalidade
 * 
 * Métricas críticas implementadas:
 * 1. websocket_connections_total - Total de conexões WebSocket
 * 2. websocket_messages_total - Total de mensagens enviadas/recebidas
 * 3. desktop_agents_connected - Número de agents conectados
 * 4. command_execution_duration_seconds - Duração de execução de comandos
 * 5. command_execution_total - Total de comandos executados
 * 6. http_requests_total - Total de requisições HTTP
 * 7. http_request_duration_seconds - Duração de requisições HTTP
 * 8. database_queries_total - Total de queries no banco
 * 9. database_query_duration_seconds - Duração de queries
 * 10. system_memory_usage_bytes - Uso de memória do sistema
 * 
 * Data de implementação: 2025-12-01
 * Auditor: Manus AI
 */

import { register, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

// Coletar métricas padrão do Node.js (CPU, memória, event loop, etc)
collectDefaultMetrics({ register });

// ==================== MÉTRICAS WEBSOCKET ====================

export const websocketConnectionsTotal = new Counter({
  name: 'websocket_connections_total',
  help: 'Total number of WebSocket connections established',
  labelNames: ['status'], // 'connected', 'disconnected', 'failed'
  registers: [register],
});

export const websocketMessagesTotal = new Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages sent/received',
  labelNames: ['direction', 'type'], // direction: 'sent'|'received', type: 'command'|'heartbeat'|'response'
  registers: [register],
});

export const desktopAgentsConnected = new Gauge({
  name: 'desktop_agents_connected',
  help: 'Current number of connected desktop agents',
  registers: [register],
});

// ==================== MÉTRICAS DE COMANDOS ====================

export const commandExecutionDuration = new Histogram({
  name: 'command_execution_duration_seconds',
  help: 'Duration of command execution in seconds',
  labelNames: ['command_type', 'status'], // command_type: 'shell'|'screenshot'|'obsidian', status: 'success'|'failure'
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30], // Buckets em segundos
  registers: [register],
});

export const commandExecutionTotal = new Counter({
  name: 'command_execution_total',
  help: 'Total number of commands executed',
  labelNames: ['command_type', 'status'],
  registers: [register],
});

// ==================== MÉTRICAS HTTP ====================

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// ==================== MÉTRICAS DE BANCO DE DADOS ====================

export const databaseQueriesTotal = new Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'], // operation: 'select'|'insert'|'update'|'delete'
  registers: [register],
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// ==================== MÉTRICAS DE SISTEMA ====================

export const systemMemoryUsage = new Gauge({
  name: 'system_memory_usage_bytes',
  help: 'System memory usage in bytes',
  labelNames: ['type'], // 'rss', 'heapTotal', 'heapUsed', 'external'
  registers: [register],
});

// ==================== MÉTRICAS DE AUTO-HEALING ====================

export const autoHealingTriggersTotal = new Counter({
  name: 'auto_healing_triggers_total',
  help: 'Total number of auto-healing triggers',
  labelNames: ['reason', 'action'], // reason: 'high_memory'|'missing_dependency', action: 'restart'|'cleanup'
  registers: [register],
});

// ==================== FUNÇÕES HELPER ====================

/**
 * Atualiza métricas de memória do sistema
 */
export function updateMemoryMetrics() {
  const memUsage = process.memoryUsage();
  systemMemoryUsage.set({ type: 'rss' }, memUsage.rss);
  systemMemoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
  systemMemoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
  systemMemoryUsage.set({ type: 'external' }, memUsage.external);
}

/**
 * Registra execução de comando com timing
 */
export function recordCommandExecution(
  commandType: string,
  status: 'success' | 'failure',
  durationSeconds: number
) {
  commandExecutionTotal.inc({ command_type: commandType, status });
  commandExecutionDuration.observe({ command_type: commandType, status }, durationSeconds);
}

/**
 * Registra requisição HTTP com timing
 */
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  durationSeconds: number
) {
  httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
  httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, durationSeconds);
}

/**
 * Registra query de banco de dados com timing
 */
export function recordDatabaseQuery(
  operation: string,
  table: string,
  status: 'success' | 'failure',
  durationSeconds: number
) {
  databaseQueriesTotal.inc({ operation, table, status });
  databaseQueryDuration.observe({ operation, table }, durationSeconds);
}

/**
 * Exporta todas as métricas em formato Prometheus
 */
export async function getMetrics(): Promise<string> {
  updateMemoryMetrics();
  return register.metrics();
}

/**
 * Reseta todas as métricas (útil para testes)
 */
export function resetMetrics() {
  register.resetMetrics();
}

// Exportar registry para uso externo
export { register };

// Atualizar métricas de memória a cada 10 segundos
setInterval(updateMemoryMetrics, 10000);
