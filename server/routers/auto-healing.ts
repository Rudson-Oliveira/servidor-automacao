import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { autoHealing } from '../_core/auto-healing';

/**
 * Router tRPC para Auto-Healing
 */
export const autoHealingRouter = router({
  // Obter métricas atuais
  getCurrentMetrics: publicProcedure.query(() => {
    return autoHealing.getCurrentMetrics();
  }),

  // Obter histórico de métricas
  getMetricsHistory: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => {
      return autoHealing.getMetricsHistory(input.limit);
    }),

  // Obter erros registrados
  getErrors: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => {
      return autoHealing.getErrors(input.limit);
    }),

  // Obter estatísticas gerais
  getStats: publicProcedure.query(() => {
    return autoHealing.getStats();
  }),

  // Registrar erro manualmente
  registerError: publicProcedure
    .input(
      z.object({
        message: z.string(),
        stack: z.string().optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      })
    )
    .mutation(({ input }) => {
      autoHealing.registerError(input);
      return { success: true };
    }),

  // Parar monitoramento
  stopMonitoring: publicProcedure.mutation(() => {
    autoHealing.stopMonitoring();
    return { success: true };
  }),

  // Iniciar monitoramento
  startMonitoring: publicProcedure
    .input(z.object({ intervalMs: z.number().optional() }))
    .mutation(({ input }) => {
      autoHealing.startMonitoring(input.intervalMs);
      return { success: true };
    }),
});
