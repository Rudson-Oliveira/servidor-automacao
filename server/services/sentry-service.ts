import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

/**
 * Serviço de Integração com Sentry
 * 
 * Funcionalidades:
 * - Tracking automático de erros
 * - Performance monitoring
 * - Breadcrumbs de contexto
 * - Source maps para debugging
 * - Alertas customizados
 * - Integração com sistema de notificações
 */

let sentryInitialized = false;

/**
 * Inicializa Sentry
 */
export function initSentry(dsn?: string) {
  if (sentryInitialized) {
    console.log("[Sentry] Já inicializado");
    return;
  }

  const sentryDsn = dsn || process.env.SENTRY_DSN;

  if (!sentryDsn) {
    console.warn("[Sentry] DSN não configurado. Tracking de erros desabilitado.");
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || "development",
    
    // Performance Monitoring
    tracesSampleRate: 1.0, // 100% das transações
    
    // Profiling
    profilesSampleRate: 1.0,
    integrations: [
      new ProfilingIntegration(),
    ],

    // Release tracking
    release: process.env.npm_package_version || "1.0.0",

    // Configurações avançadas
    beforeSend(event, hint) {
      // Filtrar erros sensíveis
      if (event.exception) {
        const error = hint.originalException;
        
        // Não enviar erros de autenticação
        if (error instanceof Error && error.message.includes("Unauthorized")) {
          return null;
        }

        // Adicionar contexto customizado
        event.contexts = {
          ...event.contexts,
          servidor: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
          },
        };
      }

      return event;
    },

    // Breadcrumbs
    beforeBreadcrumb(breadcrumb, hint) {
      // Filtrar breadcrumbs de console.log
      if (breadcrumb.category === "console") {
        return null;
      }

      return breadcrumb;
    },
  });

  sentryInitialized = true;
  console.log("[Sentry] Inicializado com sucesso");
}

/**
 * Captura exceção manualmente
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!sentryInitialized) return;

  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Captura mensagem de log
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (!sentryInitialized) return;

  Sentry.captureMessage(message, level);
}

/**
 * Adiciona breadcrumb (rastro de contexto)
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: "info" | "warning" | "error" = "info",
  data?: Record<string, any>
) {
  if (!sentryInitialized) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Define usuário atual (para tracking)
 */
export function setUser(user: { id: number; email?: string; username?: string }) {
  if (!sentryInitialized) return;

  Sentry.setUser({
    id: String(user.id),
    email: user.email,
    username: user.username,
  });
}

/**
 * Remove usuário (logout)
 */
export function clearUser() {
  if (!sentryInitialized) return;

  Sentry.setUser(null);
}

/**
 * Define tags customizadas
 */
export function setTag(key: string, value: string) {
  if (!sentryInitialized) return;

  Sentry.setTag(key, value);
}

/**
 * Define contexto customizado
 */
export function setContext(name: string, context: Record<string, any>) {
  if (!sentryInitialized) return;

  Sentry.setContext(name, context);
}

/**
 * Inicia transação de performance
 */
export function startTransaction(name: string, op: string) {
  if (!sentryInitialized) return null;

  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Middleware Express para Sentry
 */
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler();
}

export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler();
}

/**
 * Wrapper para funções assíncronas com tracking de erro
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name?: string
): T {
  return (async (...args: any[]) => {
    const transaction = startTransaction(name || fn.name, "function");

    try {
      const result = await fn(...args);
      transaction?.setStatus("ok");
      return result;
    } catch (error) {
      transaction?.setStatus("internal_error");
      captureException(error as Error, {
        function: name || fn.name,
        args: JSON.stringify(args),
      });
      throw error;
    } finally {
      transaction?.finish();
    }
  }) as T;
}

/**
 * Captura erro de query do banco de dados
 */
export function captureDatabaseError(error: Error, query: string, params?: any) {
  if (!sentryInitialized) return;

  Sentry.captureException(error, {
    contexts: {
      database: {
        query,
        params: JSON.stringify(params),
      },
    },
    tags: {
      errorType: "database",
    },
  });
}

/**
 * Captura erro de API externa
 */
export function captureAPIError(error: Error, endpoint: string, method: string, statusCode?: number) {
  if (!sentryInitialized) return;

  Sentry.captureException(error, {
    contexts: {
      api: {
        endpoint,
        method,
        statusCode,
      },
    },
    tags: {
      errorType: "api",
    },
  });
}

/**
 * Captura erro de ML/predição
 */
export function captureMLError(error: Error, modelName: string, operation: string) {
  if (!sentryInitialized) return;

  Sentry.captureException(error, {
    contexts: {
      ml: {
        modelName,
        operation,
      },
    },
    tags: {
      errorType: "ml",
    },
  });
}

/**
 * Flush de eventos pendentes (útil antes de shutdown)
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  if (!sentryInitialized) return true;

  return await Sentry.flush(timeout);
}

/**
 * Fecha Sentry (cleanup)
 */
export async function closeSentry(): Promise<void> {
  if (!sentryInitialized) return;

  await Sentry.close();
  sentryInitialized = false;
  console.log("[Sentry] Encerrado");
}
