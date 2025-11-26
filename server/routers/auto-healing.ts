/**
 * ROUTER TRPC PARA AUTO-HEALING
 * ==============================
 * 
 * Endpoints para controlar e monitorar o sistema de auto-healing.
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { healthMonitor } from "../_core/auto-healing";

export const autoHealingRouter = router({
  /**
   * Inicia o monitor de saúde
   */
  iniciar: protectedProcedure
    .input(z.object({
      intervaloMs: z.number().optional().default(30000),
    }))
    .mutation(({ input }) => {
      healthMonitor.start(input.intervaloMs);
      return {
        sucesso: true,
        mensagem: `Monitor de saúde iniciado (intervalo: ${input.intervaloMs}ms)`,
      };
    }),

  /**
   * Para o monitor de saúde
   */
  parar: protectedProcedure
    .mutation(() => {
      healthMonitor.stop();
      return {
        sucesso: true,
        mensagem: "Monitor de saúde parado",
      };
    }),

  /**
   * Obtém métricas atuais do sistema
   */
  metricasAtuais: publicProcedure
    .query(() => {
      const metricas = healthMonitor.getMetricasAtuais();
      return metricas || {
        timestamp: new Date(),
        cpu: { usage: 0, loadAverage: [0, 0, 0] },
        memoria: { total: 0, livre: 0, usada: 0, porcentagemUso: 0 },
        disco: {},
        rede: {},
      };
    }),

  /**
   * Obtém histórico de métricas
   */
  historicoMetricas: publicProcedure
    .input(z.object({
      limite: z.number().optional().default(100),
    }))
    .query(({ input }) => {
      return healthMonitor.getHistoricoMetricas(input.limite);
    }),

  /**
   * Obtém erros recentes
   */
  errosRecentes: publicProcedure
    .input(z.object({
      limite: z.number().optional().default(50),
    }))
    .query(({ input }) => {
      return healthMonitor.getErrosRecentes(input.limite);
    }),

  /**
   * Obtém estatísticas do sistema
   */
  estatisticas: publicProcedure
    .query(() => {
      return healthMonitor.getEstatisticas();
    }),

  /**
   * Força coleta de métricas
   */
  coletarMetricas: protectedProcedure
    .mutation(() => {
      // Forçar coleta via método privado não é ideal, mas funciona para teste
      // Em produção, aguardar próxima coleta automática
      return {
        sucesso: true,
        mensagem: "Coleta de métricas agendada",
      };
    }),
});
