/**
 * Router tRPC para Circuit Breakers
 * Endpoints para monitoramento e controle de circuit breakers
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { circuitBreakerManager } from "../_core/circuit-breaker";

export const circuitBreakerRouter = router({
  /**
   * Lista todos os circuit breakers
   */
  listar: publicProcedure.query(async () => {
    const breakers = circuitBreakerManager.getAllBreakers();
    return breakers.map((breaker) => ({
      ...breaker.getState(),
      metrics: breaker.getMetrics(),
    }));
  }),

  /**
   * Obtém métricas de todos os circuit breakers
   */
  metricas: publicProcedure.query(async () => {
    return circuitBreakerManager.getAllMetrics();
  }),

  /**
   * Obtém detalhes de um circuit breaker específico
   */
  detalhes: publicProcedure
    .input(
      z.object({
        serviceName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const breaker = circuitBreakerManager.getBreaker(input.serviceName);
      return {
        state: breaker.getState(),
        metrics: breaker.getMetrics(),
        history: breaker.getHistory(),
      };
    }),

  /**
   * Análise de saúde geral do sistema
   */
  saudeGeral: publicProcedure.query(async () => {
    return await circuitBreakerManager.analisarSaudeGeral();
  }),

  /**
   * Lista circuit breakers em estado OPEN
   */
  listarAbertos: publicProcedure.query(async () => {
    const openBreakers = circuitBreakerManager.getOpenBreakers();
    return openBreakers.map((breaker) => ({
      ...breaker.getState(),
      metrics: breaker.getMetrics(),
    }));
  }),

  /**
   * Lista circuit breakers não saudáveis
   */
  listarNaoSaudaveis: publicProcedure.query(async () => {
    const unhealthyBreakers = circuitBreakerManager.getUnhealthyBreakers();
    return unhealthyBreakers.map((breaker) => ({
      ...breaker.getState(),
      metrics: breaker.getMetrics(),
    }));
  }),

  /**
   * Força abertura de um circuit breaker
   */
  forcarAbertura: publicProcedure
    .input(
      z.object({
        serviceName: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const breaker = circuitBreakerManager.getBreaker(input.serviceName);
      breaker.forceOpen(input.reason);
      return {
        success: true,
        state: breaker.getState(),
      };
    }),

  /**
   * Força fechamento de um circuit breaker
   */
  forcarFechamento: publicProcedure
    .input(
      z.object({
        serviceName: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const breaker = circuitBreakerManager.getBreaker(input.serviceName);
      breaker.forceClose(input.reason);
      return {
        success: true,
        state: breaker.getState(),
      };
    }),

  /**
   * Reset de um circuit breaker
   */
  reset: publicProcedure
    .input(
      z.object({
        serviceName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const breaker = circuitBreakerManager.getBreaker(input.serviceName);
      breaker.reset();
      return {
        success: true,
        state: breaker.getState(),
      };
    }),

  /**
   * Remove um circuit breaker
   */
  remover: publicProcedure
    .input(
      z.object({
        serviceName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const removed = circuitBreakerManager.removeBreaker(input.serviceName);
      return {
        success: removed,
      };
    }),
});
