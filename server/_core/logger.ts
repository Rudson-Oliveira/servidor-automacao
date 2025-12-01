/**
 * 🔍 MÓDULO DE LOGGING ESTRUTURADO (AUDITORIA FORENSE)
 * 
 * Biblioteca: Pino (escolhida por performance - 5x mais rápido que Winston)
 * Formato: JSON estruturado para análise forense
 * Níveis: fatal, error, warn, info, debug, trace
 * 
 * Decisão técnica: Pino foi escolhido por:
 * 1. Performance superior (5-10x mais rápido que Winston)
 * 2. JSON nativo (sem overhead de serialização)
 * 3. Child loggers para contexto
 * 4. Suporte a pretty-print em desenvolvimento
 * 
 * Data de implementação: 2025-12-01
 * Auditor: Manus AI
 */

import pino from 'pino';
import { ENV } from './env';

// Configuração de transporte (pretty-print em dev, JSON em prod)
const transport = ENV.isDevelopment
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

// Logger principal
export const logger = pino({
  level: ENV.isDevelopment ? 'debug' : 'info',
  transport,
  base: {
    env: ENV.isDevelopment ? 'development' : 'production',
    service: 'servidor-automacao',
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

// Child loggers para diferentes módulos
export const loggers = {
  websocket: logger.child({ module: 'websocket' }),
  desktop: logger.child({ module: 'desktop-agent' }),
  auth: logger.child({ module: 'auth' }),
  api: logger.child({ module: 'api' }),
  db: logger.child({ module: 'database' }),
  healing: logger.child({ module: 'auto-healing' }),
  metrics: logger.child({ module: 'metrics' }),
  security: logger.child({ module: 'security' }),
};

// Função helper para logging de erros com stack trace
export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error({
    err: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  }, 'Error occurred');
}

// Função helper para logging de requisições HTTP
export function logRequest(req: {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}) {
  loggers.api.info({
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
  }, 'HTTP Request');
}

// Função helper para logging de WebSocket
export function logWebSocket(event: string, data: Record<string, unknown>) {
  loggers.websocket.info({
    event,
    ...data,
  }, `WebSocket: ${event}`);
}

// Função helper para logging de métricas
export function logMetric(name: string, value: number, labels?: Record<string, string>) {
  loggers.metrics.debug({
    metric: name,
    value,
    labels,
  }, `Metric: ${name}`);
}

// Função helper para logging de auditoria (imutável)
export function logAudit(action: string, details: Record<string, unknown>) {
  logger.info({
    audit: true,
    action,
    timestamp: new Date().toISOString(),
    ...details,
  }, `AUDIT: ${action}`);
}

// Exportar logger padrão
export default logger;
