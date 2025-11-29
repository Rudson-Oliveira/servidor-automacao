import { publicProcedure, router } from "../_core/trpc";
import { getMetrics, startMetricsCollection } from "../services/prometheus-exporter";

/**
 * Router de Prometheus
 * 
 * Endpoints:
 * - prometheus.metrics - Retorna métricas no formato Prometheus
 * - prometheus.health - Health check para Prometheus
 */

// Iniciar coleta de métricas (a cada 30 segundos)
let metricsCollectionInterval: NodeJS.Timeout | null = null;

export function initPrometheusCollection() {
  if (!metricsCollectionInterval) {
    metricsCollectionInterval = startMetricsCollection(30);
    console.log("[Prometheus] Coleta de métricas iniciada");
  }
}

export const prometheusRouter = router({
  // Endpoint /metrics para Prometheus scraping
  metrics: publicProcedure.query(async () => {
    const metrics = await getMetrics();
    return {
      contentType: "text/plain; version=0.0.4",
      body: metrics,
    };
  }),

  // Health check
  health: publicProcedure.query(() => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }),

  // Informações sobre scraping
  info: publicProcedure.query(() => {
    return {
      scrapeInterval: "30s",
      metricsEndpoint: "/api/trpc/prometheus.metrics",
      prometheusConfig: {
        job_name: "servidor-automacao",
        scrape_interval: "30s",
        metrics_path: "/api/trpc/prometheus.metrics",
        static_configs: [
          {
            targets: ["localhost:3000"],
          },
        ],
      },
    };
  }),
});
