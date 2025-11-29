import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from "prom-client";
import { getDb } from "../db";
import { telemetryMetrics, telemetryAnomalies, telemetryPredictions } from "../../drizzle/schema";
import { desc, gte } from "drizzle-orm";

/**
 * Exportador de Métricas para Prometheus
 * 
 * Funcionalidades:
 * - Expõe métricas no formato Prometheus (/metrics)
 * - Coleta métricas padrão do Node.js
 * - Métricas customizadas do sistema
 * - Integração com telemetria existente
 * - Suporte para Grafana dashboards
 */

// Criar registry do Prometheus
export const prometheusRegistry = new Registry();

// Coletar métricas padrão do Node.js (CPU, memória, event loop, etc)
collectDefaultMetrics({
  register: prometheusRegistry,
  prefix: "servidor_automacao_",
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ========================================
// MÉTRICAS CUSTOMIZADAS
// ========================================

// Contador de requisições HTTP
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total de requisições HTTP recebidas",
  labelNames: ["method", "path", "status"],
  registers: [prometheusRegistry],
});

// Duração de requisições HTTP
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duração das requisições HTTP em segundos",
  labelNames: ["method", "path", "status"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [prometheusRegistry],
});

// Métricas de telemetria
export const telemetryCpuUsage = new Gauge({
  name: "telemetry_cpu_usage_percent",
  help: "Uso de CPU em porcentagem",
  registers: [prometheusRegistry],
});

export const telemetryMemoryUsage = new Gauge({
  name: "telemetry_memory_usage_mb",
  help: "Uso de memória em MB",
  registers: [prometheusRegistry],
});

export const telemetryDiskUsage = new Gauge({
  name: "telemetry_disk_usage_percent",
  help: "Uso de disco em porcentagem",
  registers: [prometheusRegistry],
});

export const telemetryNetworkIn = new Gauge({
  name: "telemetry_network_in_mbps",
  help: "Tráfego de rede de entrada em Mbps",
  registers: [prometheusRegistry],
});

export const telemetryNetworkOut = new Gauge({
  name: "telemetry_network_out_mbps",
  help: "Tráfego de rede de saída em Mbps",
  registers: [prometheusRegistry],
});

// Anomalias detectadas
export const anomaliesDetected = new Counter({
  name: "anomalies_detected_total",
  help: "Total de anomalias detectadas",
  labelNames: ["metric_name", "severity"],
  registers: [prometheusRegistry],
});

// Predições realizadas
export const predictionsTotal = new Counter({
  name: "predictions_total",
  help: "Total de predições realizadas",
  labelNames: ["metric_name", "is_anomaly"],
  registers: [prometheusRegistry],
});

// Acurácia das predições
export const predictionAccuracy = new Gauge({
  name: "prediction_accuracy_percent",
  help: "Acurácia das predições em porcentagem",
  labelNames: ["metric_name"],
  registers: [prometheusRegistry],
});

// Alertas enviados
export const alertsSent = new Counter({
  name: "alerts_sent_total",
  help: "Total de alertas enviados",
  labelNames: ["type", "severity", "channel"],
  registers: [prometheusRegistry],
});

// Erros do sistema
export const systemErrors = new Counter({
  name: "system_errors_total",
  help: "Total de erros do sistema",
  labelNames: ["type", "component"],
  registers: [prometheusRegistry],
});

// Tarefas executadas
export const tasksExecuted = new Counter({
  name: "tasks_executed_total",
  help: "Total de tarefas executadas",
  labelNames: ["status", "type"],
  registers: [prometheusRegistry],
});

// Duração de tarefas
export const taskDuration = new Histogram({
  name: "task_duration_seconds",
  help: "Duração de execução de tarefas em segundos",
  labelNames: ["type"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [prometheusRegistry],
});

// ========================================
// FUNÇÕES DE ATUALIZAÇÃO
// ========================================

/**
 * Atualiza métricas de telemetria a partir do banco de dados
 */
export async function updateTelemetryMetrics(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar métricas mais recentes (últimos 5 minutos)
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000);

    const metrics = await db
      .select()
      .from(telemetryMetrics)
      .where(gte(telemetryMetrics.timestamp, cutoffTime))
      .orderBy(desc(telemetryMetrics.timestamp))
      .limit(100);

    // Agrupar por métrica e pegar valor mais recente
    const latestMetrics = new Map<string, number>();

    for (const metric of metrics) {
      if (!latestMetrics.has(metric.metricName)) {
        latestMetrics.set(metric.metricName, metric.value);
      }
    }

    // Atualizar gauges
    if (latestMetrics.has("cpu_usage")) {
      telemetryCpuUsage.set(latestMetrics.get("cpu_usage")!);
    }

    if (latestMetrics.has("memory_usage")) {
      telemetryMemoryUsage.set(latestMetrics.get("memory_usage")!);
    }

    if (latestMetrics.has("disk_usage")) {
      telemetryDiskUsage.set(latestMetrics.get("disk_usage")!);
    }

    if (latestMetrics.has("network_in")) {
      telemetryNetworkIn.set(latestMetrics.get("network_in")!);
    }

    if (latestMetrics.has("network_out")) {
      telemetryNetworkOut.set(latestMetrics.get("network_out")!);
    }
  } catch (error) {
    console.error("[Prometheus] Erro ao atualizar métricas de telemetria:", error);
  }
}

/**
 * Atualiza contadores de anomalias
 */
export async function updateAnomalyMetrics(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // Última hora

    const anomalies = await db
      .select()
      .from(telemetryAnomalies)
      .where(gte(telemetryAnomalies.detectedAt, cutoffTime));

    // Resetar contador (para evitar acumulação infinita)
    prometheusRegistry.removeSingleMetric("anomalies_detected_total");

    const newAnomaliesCounter = new Counter({
      name: "anomalies_detected_total",
      help: "Total de anomalias detectadas",
      labelNames: ["metric_name", "severity"],
      registers: [prometheusRegistry],
    });

    // Contar anomalias por métrica e severidade
    for (const anomaly of anomalies) {
      newAnomaliesCounter.inc({
        metric_name: anomaly.metricName,
        severity: anomaly.severity,
      });
    }
  } catch (error) {
    console.error("[Prometheus] Erro ao atualizar métricas de anomalias:", error);
  }
}

/**
 * Atualiza métricas de predições
 */
export async function updatePredictionMetrics(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // Última hora

    const predictions = await db
      .select()
      .from(telemetryPredictions)
      .where(gte(telemetryPredictions.predictedAt, cutoffTime));

    // Calcular acurácia por métrica
    const accuracyByMetric = new Map<string, { correct: number; total: number }>();

    for (const pred of predictions) {
      if (pred.actualValue !== null) {
        const key = pred.metricName;
        const stats = accuracyByMetric.get(key) || { correct: 0, total: 0 };

        stats.total++;
        const error = Math.abs(pred.predictedValue - pred.actualValue) / pred.predictedValue;
        if (error < 0.1) stats.correct++;

        accuracyByMetric.set(key, stats);
      }
    }

    // Atualizar gauge de acurácia
    for (const [metricName, stats] of accuracyByMetric.entries()) {
      const accuracy = (stats.correct / stats.total) * 100;
      predictionAccuracy.set({ metric_name: metricName }, accuracy);
    }
  } catch (error) {
    console.error("[Prometheus] Erro ao atualizar métricas de predições:", error);
  }
}

/**
 * Atualiza todas as métricas customizadas
 */
export async function updateAllMetrics(): Promise<void> {
  await Promise.all([
    updateTelemetryMetrics(),
    updateAnomalyMetrics(),
    updatePredictionMetrics(),
  ]);
}

/**
 * Inicia coleta periódica de métricas
 */
export function startMetricsCollection(intervalSeconds: number = 30): NodeJS.Timeout {
  console.log(`[Prometheus] Iniciando coleta de métricas a cada ${intervalSeconds}s`);

  return setInterval(async () => {
    await updateAllMetrics();
  }, intervalSeconds * 1000);
}

/**
 * Retorna métricas no formato Prometheus
 */
export async function getMetrics(): Promise<string> {
  // Atualizar métricas antes de exportar
  await updateAllMetrics();

  return await prometheusRegistry.metrics();
}

/**
 * Middleware Express para registrar requisições HTTP
 */
export function prometheusMiddleware(req: any, res: any, next: any) {
  const start = Date.now();

  // Interceptar resposta
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = (Date.now() - start) / 1000;

    // Registrar métricas
    httpRequestsTotal.inc({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path: req.route?.path || req.path,
        status: res.statusCode,
      },
      duration
    );

    return originalSend.call(this, data);
  };

  next();
}
