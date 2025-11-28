/**
 * 🔮 SISTEMA PREDITIVO DE FALHAS
 * 
 * Sistema de antecipação de problemas que:
 * - Detecta anomalias em tempo real
 * - Prevê falhas antes que aconteçam
 * - Sugere ações preventivas
 * - Aprende com padrões históricos
 * 
 * Baseado em técnicas de SRE (Site Reliability Engineering) e ML
 */

import { getDb } from "../db";
import { telemetryMetrics, telemetryAnomalies, telemetryPredictions, telemetryLearnings } from "../../drizzle/schema";
import { desc, eq, and, gte, sql } from "drizzle-orm";

// ========================================
// DETECTOR DE ANOMALIAS
// ========================================

interface AnomalyDetectionResult {
  isAnomaly: boolean;
  severity: "low" | "medium" | "high" | "critical";
  deviation: number;
  expectedValue: number;
  actualValue: number;
  description: string;
}

/**
 * Detecta anomalias usando método estatístico (Z-Score)
 * Z-Score > 2 = anomalia moderada
 * Z-Score > 3 = anomalia severa
 */
export async function detectAnomaly(
  metricName: string,
  currentValue: number,
  windowMinutes: number = 60
): Promise<AnomalyDetectionResult | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Buscar dados históricos da última hora
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    const historicalData = await db
      .select()
      .from(telemetryMetrics)
      .where(
        and(
          eq(telemetryMetrics.name, metricName),
          gte(telemetryMetrics.timestamp, windowStart)
        )
      )
      .orderBy(desc(telemetryMetrics.timestamp))
      .limit(100);

    if (historicalData.length < 10) {
      // Dados insuficientes para análise
      return null;
    }

    // Calcular média e desvio padrão
    const values = historicalData.map(d => Number(d.value));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Calcular Z-Score
    const zScore = stdDev === 0 ? 0 : Math.abs((currentValue - mean) / stdDev);
    const deviation = stdDev === 0 ? 0 : ((currentValue - mean) / mean) * 100;

    // Determinar se é anomalia
    let isAnomaly = false;
    let severity: "low" | "medium" | "high" | "critical" = "low";
    let description = "";

    if (zScore > 3) {
      isAnomaly = true;
      severity = "critical";
      description = `Anomalia crítica detectada: valor ${currentValue.toFixed(2)} está ${zScore.toFixed(1)}σ acima da média (${mean.toFixed(2)})`;
    } else if (zScore > 2.5) {
      isAnomaly = true;
      severity = "high";
      description = `Anomalia severa detectada: valor ${currentValue.toFixed(2)} está ${zScore.toFixed(1)}σ acima da média (${mean.toFixed(2)})`;
    } else if (zScore > 2) {
      isAnomaly = true;
      severity = "medium";
      description = `Anomalia moderada detectada: valor ${currentValue.toFixed(2)} está ${zScore.toFixed(1)}σ acima da média (${mean.toFixed(2)})`;
    }

    if (isAnomaly) {
      // Registrar anomalia no banco
      await db.insert(telemetryAnomalies).values({
        type: "statistical_outlier",
        metric: metricName,
        severity,
        description,
        expectedValue: mean.toString(),
        actualValue: currentValue.toString(),
        deviation: deviation.toString(),
        detectedAt: new Date(),
      });

      console.warn(`[ANOMALY] ${description}`);
    }

    return {
      isAnomaly,
      severity,
      deviation,
      expectedValue: mean,
      actualValue: currentValue,
      description,
    };
  } catch (error) {
    console.error("[ANOMALY] Error detecting anomaly:", error);
    return null;
  }
}

// ========================================
// PREDITOR DE FALHAS
// ========================================

interface FailurePrediction {
  type: string;
  component: string;
  probability: number;
  timeToFailure: number | null;
  severity: "low" | "medium" | "high" | "critical";
  indicators: Record<string, any>;
  preventiveActions: string[];
}

/**
 * Prevê falhas baseado em tendências e padrões
 */
export async function predictFailure(
  component: string,
  metrics: Record<string, number>
): Promise<FailurePrediction | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const predictions: FailurePrediction[] = [];

    // REGRA 1: Memória crescendo constantemente (memory leak)
    if (metrics["system.memory.heap_used"]) {
      const memoryTrend = await analyzeMemoryTrend();
      if (memoryTrend && memoryTrend.isIncreasing && memoryTrend.growthRate > 5) {
        // Crescimento > 5% por hora
        const timeToOOM = calculateTimeToOOM(
          metrics["system.memory.heap_used"],
          metrics["system.memory.heap_total"] || 4 * 1024 * 1024 * 1024, // 4GB default
          memoryTrend.growthRate
        );

        predictions.push({
          type: "memory_leak",
          component: "system.memory",
          probability: Math.min(memoryTrend.growthRate * 10, 95),
          timeToFailure: timeToOOM,
          severity: timeToOOM < 3600 ? "critical" : timeToOOM < 7200 ? "high" : "medium",
          indicators: {
            currentUsage: metrics["system.memory.heap_used"],
            growthRate: memoryTrend.growthRate,
            trend: "increasing",
          },
          preventiveActions: [
            "Executar garbage collection manual",
            "Reiniciar processo antes do OOM",
            "Investigar memory leaks no código",
            "Aumentar limite de memória",
          ],
        });
      }
    }

    // REGRA 2: Taxa de erro crescente
    if (metrics["errors.rate"]) {
      if (metrics["errors.rate"] > 10) {
        // > 10 erros/min
        predictions.push({
          type: "high_error_rate",
          component: "application",
          probability: Math.min(metrics["errors.rate"] * 5, 90),
          timeToFailure: null,
          severity: metrics["errors.rate"] > 50 ? "critical" : "high",
          indicators: {
            errorRate: metrics["errors.rate"],
            threshold: 10,
          },
          preventiveActions: [
            "Investigar logs de erro imediatamente",
            "Verificar dependências externas",
            "Considerar rollback se deploy recente",
            "Ativar circuit breaker",
          ],
        });
      }
    }

    // REGRA 3: Latência crescente (degradação de performance)
    if (metrics["api.response_time.p95"]) {
      if (metrics["api.response_time.p95"] > 5000) {
        // > 5s no P95
        predictions.push({
          type: "performance_degradation",
          component: "api",
          probability: 75,
          timeToFailure: null,
          severity: metrics["api.response_time.p95"] > 10000 ? "critical" : "high",
          indicators: {
            p95Latency: metrics["api.response_time.p95"],
            threshold: 5000,
          },
          preventiveActions: [
            "Verificar queries lentas no banco",
            "Analisar chamadas a APIs externas",
            "Aumentar recursos (CPU/RAM)",
            "Ativar cache agressivo",
          ],
        });
      }
    }

    // REGRA 4: Disco cheio iminente
    if (metrics["system.disk.usage_percent"]) {
      if (metrics["system.disk.usage_percent"] > 85) {
        const timeToFull = calculateTimeToFullDisk(metrics["system.disk.usage_percent"]);
        
        predictions.push({
          type: "disk_full",
          component: "system.disk",
          probability: metrics["system.disk.usage_percent"] - 50, // 85% = 35% prob, 95% = 45% prob
          timeToFailure: timeToFull,
          severity: metrics["system.disk.usage_percent"] > 95 ? "critical" : "high",
          indicators: {
            diskUsage: metrics["system.disk.usage_percent"],
            threshold: 85,
          },
          preventiveActions: [
            "Limpar logs antigos",
            "Remover arquivos temporários",
            "Arquivar dados históricos",
            "Aumentar capacidade de disco",
          ],
        });
      }
    }

    // Salvar predições no banco
    for (const prediction of predictions) {
      await db.insert(telemetryPredictions).values({
        type: prediction.type,
        component: prediction.component,
        probability: prediction.probability.toString(),
        timeToFailure: prediction.timeToFailure,
        severity: prediction.severity,
        indicators: JSON.stringify(prediction.indicators),
        preventiveActions: JSON.stringify(prediction.preventiveActions),
        status: "pending",
      });

      console.warn(
        `[PREDICTION] ${prediction.type} em ${prediction.component}: ${prediction.probability.toFixed(0)}% de probabilidade`,
        prediction.timeToFailure ? `(${Math.floor(prediction.timeToFailure / 60)}min até falha)` : ""
      );
    }

    return predictions.length > 0 ? predictions[0] : null;
  } catch (error) {
    console.error("[PREDICTION] Error predicting failure:", error);
    return null;
  }
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

async function analyzeMemoryTrend(): Promise<{ isIncreasing: boolean; growthRate: number } | null> {
  const db = await getDb();
  if (!db) return null;

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const memoryData = await db
    .select()
    .from(telemetryMetrics)
    .where(
      and(
        eq(telemetryMetrics.name, "system.memory.heap_used"),
        gte(telemetryMetrics.timestamp, last24h)
      )
    )
    .orderBy(telemetryMetrics.timestamp)
    .limit(100);

  if (memoryData.length < 10) return null;

  // Regressão linear simples
  const values = memoryData.map((d, i) => ({ x: i, y: Number(d.value) }));
  const n = values.length;
  const sumX = values.reduce((sum, p) => sum + p.x, 0);
  const sumY = values.reduce((sum, p) => sum + p.y, 0);
  const sumXY = values.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = values.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgValue = sumY / n;
  const growthRate = (slope / avgValue) * 100; // % por medição

  return {
    isIncreasing: slope > 0,
    growthRate: Math.abs(growthRate),
  };
}

function calculateTimeToOOM(currentUsage: number, maxMemory: number, growthRatePercent: number): number {
  // Tempo em segundos até Out Of Memory
  const remainingMemory = maxMemory - currentUsage;
  const growthPerSecond = (currentUsage * growthRatePercent) / (100 * 3600); // por segundo
  return Math.floor(remainingMemory / growthPerSecond);
}

function calculateTimeToFullDisk(currentPercent: number): number {
  // Estimativa simplificada: assume crescimento linear
  const remainingPercent = 100 - currentPercent;
  const assumedGrowthPerHour = 2; // 2% por hora (conservador)
  return Math.floor((remainingPercent / assumedGrowthPerHour) * 3600);
}

// ========================================
// SISTEMA DE APRENDIZADO
// ========================================

/**
 * Registra um padrão aprendido
 */
export async function recordLearning(
  category: string,
  pattern: string,
  description: string,
  confidence: number,
  impact: "positive" | "neutral" | "negative",
  recommendation?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Verificar se padrão já existe
    const existing = await db
      .select()
      .from(telemetryLearnings)
      .where(
        and(
          eq(telemetryLearnings.category, category),
          eq(telemetryLearnings.pattern, pattern)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Atualizar ocorrências e confiança
      const learning = existing[0]!;
      const newOccurrences = learning.occurrences + 1;
      const newConfidence = Math.min(Number(learning.confidence) + 5, 100); // Aumenta confiança

      await db
        .update(telemetryLearnings)
        .set({
          occurrences: newOccurrences,
          confidence: newConfidence.toString(),
        })
        .where(eq(telemetryLearnings.id, learning.id));

      console.log(`[LEARNING] Padrão reforçado: ${pattern} (${newOccurrences}x, ${newConfidence}% confiança)`);
    } else {
      // Criar novo aprendizado
      await db.insert(telemetryLearnings).values({
        category,
        pattern,
        description,
        confidence: confidence.toString(),
        impact,
        recommendation: recommendation || null,
      });

      console.log(`[LEARNING] Novo padrão aprendido: ${pattern} (${confidence}% confiança)`);
    }
  } catch (error) {
    console.error("[LEARNING] Error recording learning:", error);
  }
}

console.log("[PREDICTIVE] Sistema preditivo de falhas inicializado");
