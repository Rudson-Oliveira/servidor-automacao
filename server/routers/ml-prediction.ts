import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { mlPredictions, telemetryMetrics } from "../../drizzle/schema";
import { desc, eq, gte, and } from "drizzle-orm";
import {
  trainModel,
  predict,
  autoRetrain,
  updatePredictionWithActual,
} from "../services/ml-prediction-service";

/**
 * Router de Machine Learning Preditivo
 * 
 * Endpoints:
 * - ml.train - Treinar modelo
 * - ml.predict - Fazer predição
 * - ml.autoRetrain - Retreinar automaticamente
 * - ml.getPredictions - Buscar predições
 * - ml.getAccuracy - Calcular acurácia
 * - ml.updateActual - Atualizar valor real
 */

export const mlPredictionRouter = router({
  // Treinar modelo com dados históricos
  train: protectedProcedure
    .input(
      z.object({
        metricName: z.string(),
        component: z.string().default("system"),
      })
    )
    .mutation(async ({ input }) => {
      const metrics = await trainModel(input.metricName, input.component);

      return {
        success: true,
        metrics,
        message: `Modelo treinado com sucesso! Acurácia: ${(metrics.accuracy * 100).toFixed(2)}%`,
      };
    }),

  // Fazer predição
  predict: protectedProcedure
    .input(
      z.object({
        metricName: z.string(),
        component: z.string().default("system"),
      })
    )
    .mutation(async ({ input }) => {
      const predictions = await predict(input.metricName, input.component);

      return {
        success: true,
        predictions,
      };
    }),

  // Retreinar automaticamente se necessário
  autoRetrain: protectedProcedure
    .input(
      z.object({
        metricName: z.string(),
        component: z.string().default("system"),
      })
    )
    .mutation(async ({ input }) => {
      const retrained = await autoRetrain(input.metricName, input.component);

      return {
        success: true,
        retrained,
        message: retrained
          ? "Modelo retreinado devido à baixa acurácia"
          : "Modelo mantido (acurácia satisfatória)",
      };
    }),

  // Buscar predições recentes
  getPredictions: protectedProcedure
    .input(
      z.object({
        metricName: z.string().optional(),
        component: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        hoursAgo: z.number().min(1).max(168).default(24), // Até 7 dias
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      const cutoffTime = new Date(Date.now() - input.hoursAgo * 60 * 60 * 1000);

      const conditions = [gte(mlPredictions.predictedAt, cutoffTime)];
      
      if (input.metricName) {
        conditions.push(eq(mlPredictions.metricName, input.metricName));
      }
      
      if (input.component) {
        conditions.push(eq(mlPredictions.component, input.component));
      }

      const predictions = await db
        .select()
        .from(mlPredictions)
        .where(and(...conditions))
        .orderBy(desc(mlPredictions.predictedAt))
        .limit(input.limit);

      return predictions;
    }),

  // Calcular acurácia do modelo
  getAccuracy: protectedProcedure
    .input(
      z.object({
        metricName: z.string(),
        component: z.string().default("system"),
        hoursAgo: z.number().min(1).max(168).default(24),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      const cutoffTime = new Date(Date.now() - input.hoursAgo * 60 * 60 * 1000);

      const predictions = await db
        .select()
        .from(mlPredictions)
        .where(
          gte(mlPredictions.predictedAt, cutoffTime)
        )
        .limit(1000);

      if (predictions.length === 0) {
        return {
          accuracy: 0,
          total: 0,
          correct: 0,
          avgError: 0,
          message: "Nenhuma predição encontrada",
        };
      }

      // Calcular métricas
      let correct = 0;
      let total = 0;
      let totalError = 0;

      for (const pred of predictions) {
        if (pred.actualValue !== null) {
          total++;
          const predicted = parseFloat(pred.predictedValue);
          const actual = parseFloat(pred.actualValue);
          const error = Math.abs(predicted - actual) / predicted;
          totalError += error;

          if (error < 0.1) correct++; // 10% de erro aceitável
        }
      }

      const accuracy = total > 0 ? correct / total : 0;
      const avgError = total > 0 ? totalError / total : 0;

      return {
        accuracy,
        total,
        correct,
        avgError,
        message: `Acurácia: ${(accuracy * 100).toFixed(2)}% (${correct}/${total} predições corretas)`,
      };
    }),

  // Atualizar predição com valor real
  updateActual: protectedProcedure
    .input(
      z.object({
        predictionId: z.number(),
        actualValue: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await updatePredictionWithActual(input.predictionId, input.actualValue);

      return {
        success: true,
        message: "Valor real atualizado",
      };
    }),

  // Buscar métricas disponíveis para treinamento
  getAvailableMetrics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database não disponível");

    // Buscar métricas únicas
    const metrics = await db
      .select({
        metricName: telemetryMetrics.name,
        component: telemetryMetrics.type,
      })
      .from(telemetryMetrics)
      .groupBy(telemetryMetrics.name, telemetryMetrics.type);

    // Contar pontos de dados para cada métrica
    const metricsWithCounts = await Promise.all(
      metrics.map(async (metric) => {
        const count = await db
          .select()
          .from(telemetryMetrics)
          .where(
            eq(telemetryMetrics.name, metric.metricName)
          )
          .limit(1000);

        return {
          ...metric,
          dataPoints: count.length,
          canTrain: count.length >= 25, // Mínimo para treinamento
        };
      })
    );

    return metricsWithCounts;
  }),

  // Dashboard de ML (métricas agregadas)
  getDashboard: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database não disponível");

    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Predições nas últimas 24h
    const recentPredictions = await db
      .select()
      .from(mlPredictions)
      .where(gte(mlPredictions.predictedAt, cutoffTime));

    // Anomalias detectadas
    const anomalies = recentPredictions.filter((p) => p.isAnomaly);

    // Calcular acurácia geral
    let correct = 0;
    let total = 0;

    for (const pred of recentPredictions) {
      if (pred.actualValue !== null) {
        total++;
        const predicted = parseFloat(pred.predictedValue);
        const actual = parseFloat(pred.actualValue);
        const error = Math.abs(predicted - actual) / predicted;
        if (error < 0.1) correct++;
      }
    }

    const accuracy = total > 0 ? correct / total : 0;

    // Confiança média
    const avgConfidence =
      recentPredictions.reduce((sum, p) => sum + parseFloat(p.confidence), 0) / recentPredictions.length || 0;

    return {
      totalPredictions: recentPredictions.length,
      anomaliesDetected: anomalies.length,
      accuracy: (accuracy * 100).toFixed(2) + "%",
      avgConfidence: (avgConfidence * 100).toFixed(2) + "%",
      predictionsWithActual: total,
      correctPredictions: correct,
    };
  }),
});
