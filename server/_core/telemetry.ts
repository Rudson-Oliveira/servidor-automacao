/**
 * 🧬 SISTEMA DE TELEMETRIA AVANÇADA
 * 
 * Sistema de auto-conhecimento que coleta métricas detalhadas
 * sobre performance, uso, erros e comportamento do sistema.
 * 
 * Baseado em práticas de observabilidade moderna e SRE (Site Reliability Engineering)
 */

import { getDb } from "../db";
import { telemetryEvents, telemetryMetrics } from "../../drizzle/schema";

// ========================================
// TIPOS E INTERFACES
// ========================================

export type MetricType = 
  | "counter"      // Contador incremental (ex: total de requisições)
  | "gauge"        // Valor atual (ex: memória em uso)
  | "histogram"    // Distribuição de valores (ex: tempo de resposta)
  | "summary";     // Estatísticas agregadas

export type EventSeverity = "debug" | "info" | "warning" | "error" | "critical";

export interface TelemetryEvent {
  name: string;
  severity: EventSeverity;
  category: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface TelemetryMetric {
  name: string;
  type: MetricType;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

// ========================================
// COLETOR DE MÉTRICAS
// ========================================

class TelemetryCollector {
  private metricsBuffer: TelemetryMetric[] = [];
  private eventsBuffer: TelemetryEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Flush automático a cada 30 segundos
    this.startAutoFlush();
  }

  /**
   * Registra uma métrica
   */
  recordMetric(metric: TelemetryMetric): void {
    this.metricsBuffer.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });

    // Flush se buffer estiver cheio (>100 métricas)
    if (this.metricsBuffer.length > 100) {
      this.flush();
    }
  }

  /**
   * Registra um evento
   */
  recordEvent(event: TelemetryEvent): void {
    this.eventsBuffer.push({
      ...event,
      timestamp: event.timestamp || new Date(),
    });

    // Log imediato para eventos críticos
    if (event.severity === "critical" || event.severity === "error") {
      console.error(`[TELEMETRY] ${event.severity.toUpperCase()}: ${event.name}`, event.metadata);
    }

    // Flush se buffer estiver cheio (>50 eventos)
    if (this.eventsBuffer.length > 50) {
      this.flush();
    }
  }

  /**
   * Inicia flush automático periódico
   */
  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // 30 segundos
  }

  /**
   * Salva métricas e eventos no banco de dados
   */
  async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0 && this.eventsBuffer.length === 0) {
      return;
    }

    const db = await getDb();
    if (!db) {
      console.warn("[TELEMETRY] Database not available, skipping flush");
      return;
    }

    try {
      // Salvar métricas
      if (this.metricsBuffer.length > 0) {
        await db.insert(telemetryMetrics).values(
          this.metricsBuffer.map(m => ({
            name: m.name,
            type: m.type,
            value: m.value,
            unit: m.unit || null,
            tags: m.tags ? JSON.stringify(m.tags) : null,
            timestamp: m.timestamp!,
          }))
        );
        console.log(`[TELEMETRY] Flushed ${this.metricsBuffer.length} metrics`);
        this.metricsBuffer = [];
      }

      // Salvar eventos
      if (this.eventsBuffer.length > 0) {
        await db.insert(telemetryEvents).values(
          this.eventsBuffer.map(e => ({
            name: e.name,
            severity: e.severity,
            category: e.category,
            metadata: e.metadata ? JSON.stringify(e.metadata) : null,
            timestamp: e.timestamp!,
          }))
        );
        console.log(`[TELEMETRY] Flushed ${this.eventsBuffer.length} events`);
        this.eventsBuffer = [];
      }
    } catch (error) {
      console.error("[TELEMETRY] Error flushing data:", error);
    }
  }

  /**
   * Para o coletor e faz flush final
   */
  async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

// ========================================
// INSTÂNCIA SINGLETON
// ========================================

export const telemetry = new TelemetryCollector();

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Registra contador (incrementa)
 */
export function incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
  telemetry.recordMetric({
    name,
    type: "counter",
    value,
    tags,
  });
}

/**
 * Registra gauge (valor atual)
 */
export function recordGauge(name: string, value: number, unit?: string, tags?: Record<string, string>): void {
  telemetry.recordMetric({
    name,
    type: "gauge",
    value,
    unit,
    tags,
  });
}

/**
 * Registra histograma (distribuição)
 */
export function recordHistogram(name: string, value: number, unit?: string, tags?: Record<string, string>): void {
  telemetry.recordMetric({
    name,
    type: "histogram",
    value,
    unit,
    tags,
  });
}

/**
 * Registra evento
 */
export function recordEvent(
  name: string,
  severity: EventSeverity,
  category: string,
  metadata?: Record<string, any>
): void {
  telemetry.recordEvent({
    name,
    severity,
    category,
    metadata,
  });
}

/**
 * Mede tempo de execução de uma função
 */
export async function measureExecutionTime<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    recordHistogram(`${name}.duration`, duration, "ms", tags);
    recordEvent(`${name}.success`, "info", "performance", { duration });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    recordHistogram(`${name}.duration`, duration, "ms", { ...tags, status: "error" });
    recordEvent(`${name}.error`, "error", "performance", { 
      duration,
      error: error instanceof Error ? error.message : String(error),
    });
    
    throw error;
  }
}

/**
 * Monitora uso de memória
 */
export function recordMemoryUsage(): void {
  const usage = process.memoryUsage();
  
  recordGauge("system.memory.heap_used", usage.heapUsed, "bytes");
  recordGauge("system.memory.heap_total", usage.heapTotal, "bytes");
  recordGauge("system.memory.rss", usage.rss, "bytes");
  recordGauge("system.memory.external", usage.external, "bytes");
}

/**
 * Monitora CPU
 */
export function recordCPUUsage(): void {
  const usage = process.cpuUsage();
  
  recordGauge("system.cpu.user", usage.user, "microseconds");
  recordGauge("system.cpu.system", usage.system, "microseconds");
}

// ========================================
// MONITORAMENTO AUTOMÁTICO
// ========================================

// Monitorar memória a cada 60 segundos
setInterval(() => {
  recordMemoryUsage();
  recordCPUUsage();
}, 60000);

// Flush ao desligar o processo
process.on("SIGTERM", async () => {
  await telemetry.stop();
});

process.on("SIGINT", async () => {
  await telemetry.stop();
});

console.log("[TELEMETRY] Sistema de telemetria inicializado");
