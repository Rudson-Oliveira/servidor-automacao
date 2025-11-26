/**
 * Sistema de Retry com Backoff Exponencial
 * Implementa tentativas inteligentes de recuperação com delays crescentes
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTimeMs: number;
}

/**
 * Executa função com retry e backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 6,
    initialDelayMs = 1000,
    maxDelayMs = 32000,
    backoffMultiplier = 2,
    onRetry,
    shouldRetry = () => true,
  } = options;

  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      
      return {
        success: true,
        result,
        attempts: attempt,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Verificar se deve tentar novamente
      if (!shouldRetry(lastError)) {
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalTimeMs: Date.now() - startTime,
        };
      }

      // Se foi última tentativa, retornar erro
      if (attempt === maxAttempts) {
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalTimeMs: Date.now() - startTime,
        };
      }

      // Calcular delay com backoff exponencial
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );

      // Callback de retry
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      console.log(
        `[Retry] Tentativa ${attempt}/${maxAttempts} falhou. ` +
        `Aguardando ${delay}ms antes de tentar novamente. ` +
        `Erro: ${lastError.message}`
      );

      // Aguardar antes de próxima tentativa
      await sleep(delay);
    }
  }

  // Nunca deve chegar aqui, mas TypeScript exige
  return {
    success: false,
    error: lastError || new Error('Falha desconhecida'),
    attempts: maxAttempts,
    totalTimeMs: Date.now() - startTime,
  };
}

/**
 * Helper para aguardar um tempo
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Classe para gerenciar retries de serviços específicos
 */
export class ServiceRetryManager {
  private retryHistory: Map<string, RetryAttempt[]> = new Map();

  /**
   * Executa operação com retry para um serviço específico
   */
  async executeWithRetry<T>(
    serviceName: string,
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<RetryResult<T>> {
    const result = await retryWithBackoff(operation, {
      ...options,
      onRetry: (attempt, error) => {
        this.recordAttempt(serviceName, attempt, error);
        if (options?.onRetry) {
          options.onRetry(attempt, error);
        }
      },
    });

    // Registrar resultado final
    this.recordResult(serviceName, result);

    return result;
  }

  /**
   * Registra tentativa de retry
   */
  private recordAttempt(serviceName: string, attempt: number, error: Error): void {
    if (!this.retryHistory.has(serviceName)) {
      this.retryHistory.set(serviceName, []);
    }

    const history = this.retryHistory.get(serviceName)!;
    history.push({
      timestamp: Date.now(),
      attempt,
      error: error.message,
      success: false,
    });

    // Manter apenas últimas 50 tentativas
    if (history.length > 50) {
      history.shift();
    }
  }

  /**
   * Registra resultado final
   */
  private recordResult<T>(serviceName: string, result: RetryResult<T>): void {
    if (!this.retryHistory.has(serviceName)) {
      this.retryHistory.set(serviceName, []);
    }

    const history = this.retryHistory.get(serviceName)!;
    history.push({
      timestamp: Date.now(),
      attempt: result.attempts,
      error: result.error?.message || '',
      success: result.success,
    });

    // Manter apenas últimas 50 tentativas
    if (history.length > 50) {
      history.shift();
    }
  }

  /**
   * Obtém histórico de retries de um serviço
   */
  getHistory(serviceName: string): RetryAttempt[] {
    return this.retryHistory.get(serviceName) || [];
  }

  /**
   * Obtém estatísticas de retries
   */
  getStats(serviceName: string): RetryStats {
    const history = this.getHistory(serviceName);
    
    if (history.length === 0) {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        successRate: 0,
        averageAttempts: 0,
      };
    }

    const successful = history.filter(h => h.success).length;
    const failed = history.filter(h => !h.success).length;
    const totalAttempts = history.reduce((sum, h) => sum + h.attempt, 0);

    return {
      totalAttempts: history.length,
      successfulAttempts: successful,
      failedAttempts: failed,
      successRate: (successful / history.length) * 100,
      averageAttempts: totalAttempts / history.length,
    };
  }

  /**
   * Limpa histórico de um serviço
   */
  clearHistory(serviceName: string): void {
    this.retryHistory.delete(serviceName);
  }
}

interface RetryAttempt {
  timestamp: number;
  attempt: number;
  error: string;
  success: boolean;
}

interface RetryStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  averageAttempts: number;
}

// Instância singleton
export const retryManager = new ServiceRetryManager();
