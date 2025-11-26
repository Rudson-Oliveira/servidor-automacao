/**
 * CIRCUIT BREAKER INTELIGENTE
 * ============================
 * 
 * Implementa o padrão Circuit Breaker para isolar automaticamente
 * serviços com falhas recorrentes e prevenir cascata de falhas.
 * 
 * Estados:
 * - CLOSED: Serviço funcionando normalmente
 * - OPEN: Serviço isolado devido a falhas recorrentes
 * - HALF_OPEN: Testando se serviço se recuperou
 * 
 * Autor: Sistema de Automação
 * Data: 2025-01-26
 */

import { getDb } from "../db";
import { invokeLLM } from "./llm";

// ============================================================================
// TIPOS E ENUMS
// ============================================================================

export enum CircuitState {
  CLOSED = "CLOSED",       // Funcionando normalmente
  OPEN = "OPEN",           // Isolado (falhas recorrentes)
  HALF_OPEN = "HALF_OPEN", // Testando recuperação
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Número de falhas para abrir (padrão: 5)
  successThreshold: number;      // Sucessos em half-open para fechar (padrão: 2)
  timeout: number;               // Tempo em OPEN antes de tentar half-open (ms, padrão: 60000)
  volumeThreshold: number;       // Mínimo de chamadas para avaliar (padrão: 10)
  errorThresholdPercentage: number; // % de erro para abrir (padrão: 50)
}

export interface CircuitBreakerState {
  serviceName: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  nextAttemptTime: Date | null;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
  openedAt: Date | null;
  halfOpenedAt: Date | null;
  closedAt: Date | null;
}

export interface CircuitBreakerMetrics {
  serviceName: string;
  state: CircuitState;
  failureRate: number;
  successRate: number;
  totalCalls: number;
  timeInCurrentState: number; // ms
  lastTransition: Date | null;
  isHealthy: boolean;
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export class CircuitBreaker {
  private serviceName: string;
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private stateHistory: { state: CircuitState; timestamp: Date; reason: string }[] = [];

  constructor(serviceName: string, config?: Partial<CircuitBreakerConfig>) {
    this.serviceName = serviceName;
    this.config = {
      failureThreshold: config?.failureThreshold || 5,
      successThreshold: config?.successThreshold || 2,
      timeout: config?.timeout || 60000, // 1 minuto
      volumeThreshold: config?.volumeThreshold || 10,
      errorThresholdPercentage: config?.errorThresholdPercentage || 50,
    };

    this.state = {
      serviceName,
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      nextAttemptTime: null,
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      openedAt: null,
      halfOpenedAt: null,
      closedAt: new Date(),
    };

    this.addToHistory(CircuitState.CLOSED, "Inicialização");
  }

  /**
   * Executa uma função protegida pelo circuit breaker
   */
  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    // Verificar se pode executar
    if (!this.canExecute()) {
      console.log(`[Circuit Breaker] ${this.serviceName} está OPEN, usando fallback`);
      
      if (fallback) {
        return await fallback();
      }
      
      throw new Error(`Circuit breaker OPEN para ${this.serviceName}`);
    }

    this.state.totalCalls++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Verifica se pode executar a função
   */
  private canExecute(): boolean {
    switch (this.state.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Verificar se é hora de tentar half-open
        if (this.state.nextAttemptTime && new Date() >= this.state.nextAttemptTime) {
          this.transitionTo(CircuitState.HALF_OPEN, "Timeout expirado, tentando reconexão");
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  /**
   * Chamado quando execução é bem-sucedida
   */
  private onSuccess(): void {
    this.state.successCount++;
    this.state.totalSuccesses++;
    this.state.lastSuccessTime = new Date();

    switch (this.state.state) {
      case CircuitState.HALF_OPEN:
        // Se atingiu threshold de sucessos, fechar circuit
        if (this.state.successCount >= this.config.successThreshold) {
          this.transitionTo(CircuitState.CLOSED, `${this.state.successCount} sucessos consecutivos`);
        }
        break;

      case CircuitState.CLOSED:
        // Reset failure count em caso de sucesso
        this.state.failureCount = 0;
        break;
    }
  }

  /**
   * Chamado quando execução falha
   */
  private onFailure(error: unknown): void {
    this.state.failureCount++;
    this.state.totalFailures++;
    this.state.lastFailureTime = new Date();

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    switch (this.state.state) {
      case CircuitState.HALF_OPEN:
        // Qualquer falha em half-open volta para open
        this.transitionTo(CircuitState.OPEN, `Falha durante teste de reconexão: ${errorMessage}`);
        break;

      case CircuitState.CLOSED:
        // Verificar se deve abrir circuit
        if (this.shouldOpen()) {
          this.transitionTo(CircuitState.OPEN, `Threshold de falhas atingido: ${this.state.failureCount}/${this.config.failureThreshold}`);
        }
        break;
    }
  }

  /**
   * Verifica se deve abrir o circuit breaker
   */
  private shouldOpen(): boolean {
    // Verificar threshold absoluto de falhas
    if (this.state.failureCount >= this.config.failureThreshold) {
      return true;
    }

    // Verificar threshold percentual de erros
    if (this.state.totalCalls >= this.config.volumeThreshold) {
      const errorRate = (this.state.totalFailures / this.state.totalCalls) * 100;
      if (errorRate >= this.config.errorThresholdPercentage) {
        return true;
      }
    }

    return false;
  }

  /**
   * Transição entre estados
   */
  private transitionTo(newState: CircuitState, reason: string): void {
    const oldState = this.state.state;
    this.state.state = newState;

    // Reset contadores
    this.state.failureCount = 0;
    this.state.successCount = 0;

    // Atualizar timestamps
    const now = new Date();
    switch (newState) {
      case CircuitState.OPEN:
        this.state.openedAt = now;
        this.state.nextAttemptTime = new Date(now.getTime() + this.config.timeout);
        break;

      case CircuitState.HALF_OPEN:
        this.state.halfOpenedAt = now;
        this.state.nextAttemptTime = null;
        break;

      case CircuitState.CLOSED:
        this.state.closedAt = now;
        this.state.nextAttemptTime = null;
        break;
    }

    this.addToHistory(newState, reason);

    console.log(`[Circuit Breaker] ${this.serviceName}: ${oldState} → ${newState} (${reason})`);
  }

  /**
   * Adiciona transição ao histórico
   */
  private addToHistory(state: CircuitState, reason: string): void {
    this.stateHistory.push({
      state,
      timestamp: new Date(),
      reason,
    });

    // Manter apenas últimas 100 transições
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): CircuitBreakerMetrics {
    const failureRate = this.state.totalCalls > 0 
      ? (this.state.totalFailures / this.state.totalCalls) * 100 
      : 0;

    const successRate = this.state.totalCalls > 0 
      ? (this.state.totalSuccesses / this.state.totalCalls) * 100 
      : 0;

    let timeInCurrentState = 0;
    const lastTransition = this.stateHistory[this.stateHistory.length - 1];
    if (lastTransition) {
      timeInCurrentState = new Date().getTime() - lastTransition.timestamp.getTime();
    }

    return {
      serviceName: this.serviceName,
      state: this.state.state,
      failureRate,
      successRate,
      totalCalls: this.state.totalCalls,
      timeInCurrentState,
      lastTransition: lastTransition?.timestamp || null,
      isHealthy: this.state.state === CircuitState.CLOSED && failureRate < 10,
    };
  }

  /**
   * Obtém estado atual
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Obtém histórico de transições
   */
  getHistory(): { state: CircuitState; timestamp: Date; reason: string }[] {
    return [...this.stateHistory];
  }

  /**
   * Força abertura do circuit breaker
   */
  forceOpen(reason: string): void {
    this.transitionTo(CircuitState.OPEN, `Forçado: ${reason}`);
  }

  /**
   * Força fechamento do circuit breaker
   */
  forceClose(reason: string): void {
    this.transitionTo(CircuitState.CLOSED, `Forçado: ${reason}`);
  }

  /**
   * Reset completo do circuit breaker
   */
  reset(): void {
    this.state.failureCount = 0;
    this.state.successCount = 0;
    this.state.totalCalls = 0;
    this.state.totalFailures = 0;
    this.state.totalSuccesses = 0;
    this.transitionTo(CircuitState.CLOSED, "Reset manual");
  }
}

// ============================================================================
// GERENCIADOR DE CIRCUIT BREAKERS
// ============================================================================

export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000,
    volumeThreshold: 10,
    errorThresholdPercentage: 50,
  };

  /**
   * Obtém ou cria circuit breaker para um serviço
   */
  getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(serviceName);

    if (!breaker) {
      breaker = new CircuitBreaker(serviceName, { ...this.defaultConfig, ...config });
      this.breakers.set(serviceName, breaker);
      console.log(`[Circuit Breaker Manager] Criado circuit breaker para: ${serviceName}`);
    }

    return breaker;
  }

  /**
   * Lista todos os circuit breakers
   */
  getAllBreakers(): CircuitBreaker[] {
    return Array.from(this.breakers.values());
  }

  /**
   * Obtém métricas de todos os circuit breakers
   */
  getAllMetrics(): CircuitBreakerMetrics[] {
    return this.getAllBreakers().map((breaker) => breaker.getMetrics());
  }

  /**
   * Obtém circuit breakers em estado OPEN
   */
  getOpenBreakers(): CircuitBreaker[] {
    return this.getAllBreakers().filter((breaker) => breaker.getState().state === CircuitState.OPEN);
  }

  /**
   * Obtém circuit breakers não saudáveis
   */
  getUnhealthyBreakers(): CircuitBreaker[] {
    return this.getAllBreakers().filter((breaker) => !breaker.getMetrics().isHealthy);
  }

  /**
   * Remove circuit breaker
   */
  removeBreaker(serviceName: string): boolean {
    return this.breakers.delete(serviceName);
  }

  /**
   * Analisa saúde geral do sistema
   */
  async analisarSaudeGeral(): Promise<{
    totalBreakers: number;
    healthy: number;
    unhealthy: number;
    open: number;
    halfOpen: number;
    closed: number;
    recomendacoes: string[];
  }> {
    const allMetrics = this.getAllMetrics();

    const stats = {
      totalBreakers: allMetrics.length,
      healthy: allMetrics.filter((m) => m.isHealthy).length,
      unhealthy: allMetrics.filter((m) => !m.isHealthy).length,
      open: allMetrics.filter((m) => m.state === CircuitState.OPEN).length,
      halfOpen: allMetrics.filter((m) => m.state === CircuitState.HALF_OPEN).length,
      closed: allMetrics.filter((m) => m.state === CircuitState.CLOSED).length,
      recomendacoes: [] as string[],
    };

    // Gerar recomendações
    if (stats.open > 0) {
      stats.recomendacoes.push(`⚠️ ${stats.open} serviço(s) isolado(s). Investigar causa raiz.`);
    }

    if (stats.unhealthy > stats.totalBreakers / 2) {
      stats.recomendacoes.push(`🚨 Mais de 50% dos serviços não estão saudáveis. Verificar infraestrutura.`);
    }

    const openBreakers = this.getOpenBreakers();
    for (const breaker of openBreakers) {
      const state = breaker.getState();
      stats.recomendacoes.push(`🔴 ${state.serviceName}: Isolado há ${this.formatDuration(Date.now() - (state.openedAt?.getTime() || 0))}`);
    }

    return stats;
  }

  /**
   * Formata duração em formato legível
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

// ============================================================================
// EXPORTAR INSTÂNCIA SINGLETON
// ============================================================================

export const circuitBreakerManager = new CircuitBreakerManager();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Executa função com circuit breaker
 */
export async function executeWithCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  fallback?: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = circuitBreakerManager.getBreaker(serviceName, config);
  return await breaker.execute(fn, fallback);
}

/**
 * Decorator para métodos que devem usar circuit breaker
 */
export function WithCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const breaker = circuitBreakerManager.getBreaker(serviceName, config);
      return await breaker.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
