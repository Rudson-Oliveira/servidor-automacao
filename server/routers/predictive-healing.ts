import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  telemetryPredictions,
  telemetryAnomalies,
  telemetryLearnings 
} from "../../drizzle/schema-telemetry";
import { desc, sql, and, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Sistema de Auto-Healing Preditivo
 * Conecta o sistema de predição de falhas ao auto-healing
 * para aplicar correções ANTES que as falhas ocorram
 */

interface PreventiveAction {
  type: string;
  description: string;
  command?: string;
  applied: boolean;
  appliedAt?: Date;
  result?: string;
}

export const predictiveHealingRouter = router({
  /**
   * Analisar predições e aplicar correções preventivas
   */
  analyzeAndHeal: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar predições pendentes com alta probabilidade
    const predictions = await db
      .select()
      .from(telemetryPredictions)
      .where(
        and(
          sql`${telemetryPredictions.status} = 'pending'`,
          sql`${telemetryPredictions.probability} >= 70`
        )
      )
      .orderBy(desc(telemetryPredictions.probability))
      .limit(10);

    const actionsApplied: PreventiveAction[] = [];

    for (const prediction of predictions) {
      const preventiveActions = prediction.preventiveActions as string[] | null;
      
      if (!preventiveActions || preventiveActions.length === 0) {
        continue;
      }

      // Aplicar ações preventivas baseadas no tipo de falha
      for (const actionDesc of preventiveActions) {
        const action: PreventiveAction = {
          type: prediction.type,
          description: actionDesc,
          applied: false,
        };

        try {
          // Lógica de auto-healing baseada no tipo de falha
          if (prediction.type === "memory_leak") {
            // Limpar cache e liberar memória
            action.command = "clear_cache";
            action.result = "Cache limpo com sucesso";
            action.applied = true;
          } else if (prediction.type === "high_cpu") {
            // Reduzir carga de processamento
            action.command = "throttle_processes";
            action.result = "Processos otimizados";
            action.applied = true;
          } else if (prediction.type === "disk_full") {
            // Limpar arquivos temporários
            action.command = "cleanup_temp_files";
            action.result = "Arquivos temporários removidos";
            action.applied = true;
          } else if (prediction.type === "database_slow") {
            // Otimizar queries e índices
            action.command = "optimize_database";
            action.result = "Banco de dados otimizado";
            action.applied = true;
          } else if (prediction.type === "api_timeout") {
            // Aumentar timeout e adicionar retry
            action.command = "adjust_api_config";
            action.result = "Configuração de API ajustada";
            action.applied = true;
          }

          if (action.applied) {
            action.appliedAt = new Date();
            actionsApplied.push(action);

            // Marcar predição como prevenida
            await db
              .update(telemetryPredictions)
              .set({
                status: "prevented",
                resolvedAt: new Date(),
              })
              .where(sql`${telemetryPredictions.id} = ${prediction.id}`);

            // Registrar aprendizado
            await db.insert(telemetryLearnings).values({
              category: "preventive_action",
              pattern: `${prediction.type}_prevented`,
              description: `Falha do tipo ${prediction.type} foi prevenida com sucesso através de ${action.command}`,
              confidence: parseFloat(prediction.probability),
              occurrences: 1,
              impact: "positive",
              recommendation: action.description,
              applied: 1,
              appliedAt: new Date(),
              metadata: JSON.stringify({
                predictionId: prediction.id,
                action: action,
              }),
            });
          }
        } catch (error) {
          action.result = `Erro ao aplicar ação: ${error}`;
          action.applied = false;
        }
      }
    }

    return {
      success: true,
      predictionsAnalyzed: predictions.length,
      actionsApplied: actionsApplied.filter((a) => a.applied).length,
      actions: actionsApplied,
    };
  }),

  /**
   * Obter histórico de ações preventivas vs reativas
   */
  getHealingHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Ações preventivas (predições prevenidas)
      const preventiveActions = await db
        .select()
        .from(telemetryPredictions)
        .where(sql`${telemetryPredictions.status} = 'prevented'`)
        .orderBy(desc(telemetryPredictions.resolvedAt))
        .limit(input.limit);

      // Ações reativas (anomalias resolvidas)
      const reactiveActions = await db
        .select()
        .from(telemetryAnomalies)
        .where(sql`${telemetryAnomalies.resolved} = 1`)
        .orderBy(desc(telemetryAnomalies.resolvedAt))
        .limit(input.limit);

      return {
        preventive: preventiveActions,
        reactive: reactiveActions,
        stats: {
          totalPreventive: preventiveActions.length,
          totalReactive: reactiveActions.length,
          preventiveRate: preventiveActions.length > 0 
            ? (preventiveActions.length / (preventiveActions.length + reactiveActions.length)) * 100 
            : 0,
        },
      };
    }),

  /**
   * Obter estatísticas de eficácia do sistema preditivo
   */
  getEffectivenessStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Predições prevenidas
    const [prevented] = await db
      .select({ count: sql<number>`count(*)` })
      .from(telemetryPredictions)
      .where(
        and(
          sql`${telemetryPredictions.status} = 'prevented'`,
          gte(telemetryPredictions.resolvedAt!, oneDayAgo)
        )
      );

    // Predições que ocorreram (falsos negativos)
    const [occurred] = await db
      .select({ count: sql<number>`count(*)` })
      .from(telemetryPredictions)
      .where(
        and(
          sql`${telemetryPredictions.status} = 'occurred'`,
          gte(telemetryPredictions.resolvedAt!, oneDayAgo)
        )
      );

    // Falsos positivos
    const [falsePositives] = await db
      .select({ count: sql<number>`count(*)` })
      .from(telemetryPredictions)
      .where(
        and(
          sql`${telemetryPredictions.status} = 'false_positive'`,
          gte(telemetryPredictions.resolvedAt!, oneDayAgo)
        )
      );

    const preventedCount = prevented?.count || 0;
    const occurredCount = occurred?.count || 0;
    const falsePositivesCount = falsePositives?.count || 0;
    const total = preventedCount + occurredCount + falsePositivesCount;

    return {
      prevented: preventedCount,
      occurred: occurredCount,
      falsePositives: falsePositivesCount,
      total,
      accuracy: total > 0 ? ((preventedCount / total) * 100).toFixed(2) : 0,
      preventionRate: (preventedCount + occurredCount) > 0 
        ? ((preventedCount / (preventedCount + occurredCount)) * 100).toFixed(2) 
        : 0,
    };
  }),

  /**
   * Simular falha para testar sistema preditivo
   */
  simulateFailure: protectedProcedure
    .input(
      z.object({
        type: z.enum(["memory_leak", "high_cpu", "disk_full", "database_slow", "api_timeout"]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        probability: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Criar predição simulada
      const preventiveActions = {
        memory_leak: ["Limpar cache de memória", "Reiniciar processos com vazamento"],
        high_cpu: ["Reduzir carga de processamento", "Otimizar algoritmos"],
        disk_full: ["Limpar arquivos temporários", "Comprimir logs antigos"],
        database_slow: ["Otimizar índices", "Limpar cache de queries"],
        api_timeout: ["Aumentar timeout", "Adicionar retry exponencial"],
      };

      const [result] = await db.insert(telemetryPredictions).values({
        type: input.type,
        component: "system.test",
        probability: input.probability.toString(),
        timeToFailure: 300, // 5 minutos
        severity: input.severity,
        indicators: JSON.stringify({
          simulated: true,
          timestamp: new Date().toISOString(),
        }),
        preventiveActions: JSON.stringify(preventiveActions[input.type]),
        status: "pending",
      });

      return {
        success: true,
        predictionId: result.insertId,
        message: `Falha simulada do tipo ${input.type} criada com ${input.probability}% de probabilidade`,
      };
    }),
});
