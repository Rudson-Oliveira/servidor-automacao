import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  telemetryMetrics, 
  telemetryAnomalies, 
  telemetryPredictions, 
  telemetryLearnings 
} from "../../drizzle/schema-telemetry";
import { desc, sql, and, gte } from "drizzle-orm";

export const telemetryRouter = router({
  /**
   * Obter métricas recentes do sistema
   */
  getMetrics: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const metrics = await db
        .select()
        .from(telemetryMetrics)
        .orderBy(desc(telemetryMetrics.timestamp))
        .limit(input.limit);

      return metrics;
    }),

  /**
   * Obter anomalias detectadas
   */
  getAnomalies: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(20),
        resolved: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select()
        .from(telemetryAnomalies)
        .orderBy(desc(telemetryAnomalies.detectedAt));

      if (input.resolved !== undefined) {
        query = query.where(
          sql`${telemetryAnomalies.resolved} = ${input.resolved}`
        );
      }

      const anomalies = await query.limit(input.limit);

      return anomalies;
    }),

  /**
   * Obter predições de falhas
   */
  getPredictions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
        occurred: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select()
        .from(telemetryPredictions)
        .orderBy(desc(telemetryPredictions.createdAt));

      if (input.occurred !== undefined) {
        query = query.where(
          sql`${telemetryPredictions.status} = ${input.occurred ? 'occurred' : 'pending'}`
        );
      }

      const predictions = await query.limit(input.limit);

      return predictions;
    }),

  /**
   * Obter padrões aprendidos
   */
  getPatterns: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const patterns = await db
        .select()
        .from(telemetryLearnings)
        .orderBy(desc(telemetryLearnings.occurrences))
        .limit(input.limit);

      return patterns;
    }),

  /**
   * Obter estatísticas gerais
   */
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Total de métricas nas últimas 24 horas
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [metricsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(telemetryMetrics)
      .where(gte(telemetryMetrics.timestamp, oneDayAgo));

    const [anomaliesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(telemetryAnomalies)
      .where(
        and(
          gte(telemetryAnomalies.detectedAt, oneDayAgo),
          sql`${telemetryAnomalies.resolved} = 0`
        )
      );

    const [predictionsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(telemetryPredictions)
      .where(
        and(
          gte(telemetryPredictions.createdAt, oneDayAgo),
          sql`${telemetryPredictions.status} = 'pending'`
        )
      );

    const [patternsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(telemetryLearnings);

    return {
      totalMetrics: metricsCount?.count || 0,
      totalAnomalies: anomaliesCount?.count || 0,
      totalPredictions: predictionsCount?.count || 0,
      totalPatterns: patternsCount?.count || 0,
    };
  }),

  /**
   * Marcar anomalia como resolvida
   */
  resolveAnomaly: protectedProcedure
    .input(
      z.object({
        anomalyId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(telemetryAnomalies)
        .set({ 
          resolved: true,
          resolvedAt: new Date(),
        })
        .where(sql`${telemetryAnomalies.id} = ${input.anomalyId}`);

      return { success: true };
    }),

  /**
   * Marcar predição como ocorrida
   */
  markPredictionOccurred: protectedProcedure
    .input(
      z.object({
        predictionId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(telemetryPredictions)
        .set({ 
          occurred: true,
          occurredAt: new Date(),
        })
        .where(sql`${telemetryPredictions.id} = ${input.predictionId}`);

      return { success: true };
    }),

  /**
   * Exportar conhecimento (métricas, anomalias, padrões)
   */
  exportKnowledge: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Últimas 100 métricas
    const metrics = await db
      .select()
      .from(telemetryMetrics)
      .orderBy(desc(telemetryMetrics.timestamp))
      .limit(100);

      // Anomalias não resolvidas
    const anomalies = await db
      .select()
      .from(telemetryAnomalies)
      .where(sql`${telemetryAnomalies.resolved} = 0`)
      .orderBy(desc(telemetryAnomalies.detectedAt))
      .limit(50);

      // Predições ativas
    const predictions = await db
      .select()
      .from(telemetryPredictions)
      .where(sql`${telemetryPredictions.status} = 'pending'`)
      .orderBy(desc(telemetryPredictions.createdAt))
      .limit(50);

    // Todos os padrões
    const patterns = await db
      .select()
      .from(telemetryLearnings)
      .orderBy(desc(telemetryLearnings.occurrences));

    return {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      metrics,
      anomalies,
      predictions,
      patterns,
    };
  }),
});
