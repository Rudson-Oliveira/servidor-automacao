/**
 * Schema de Telemetria e Auto-Conhecimento
 * Tabelas para armazenar métricas, eventos e aprendizados do sistema
 */

import { int, mysqlTable, text, varchar, timestamp, decimal, mysqlEnum, json } from "drizzle-orm/mysql-core";

/**
 * Métricas de performance e uso do sistema
 */
export const telemetryMetrics = mysqlTable("telemetry_metrics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(), // Nome da métrica (ex: "api.response_time")
  type: mysqlEnum("type", ["counter", "gauge", "histogram", "summary"]).notNull(),
  value: decimal("value", { precision: 20, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 50 }), // Unidade (ms, bytes, requests, etc)
  tags: json("tags"), // Tags para filtrar (ex: {endpoint: "/api/status", method: "GET"})
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Eventos do sistema (logs estruturados)
 */
export const telemetryEvents = mysqlTable("telemetry_events", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(), // Nome do evento (ex: "database.connection.failed")
  severity: mysqlEnum("severity", ["debug", "info", "warning", "error", "critical"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Categoria (performance, security, business, etc)
  metadata: json("metadata"), // Dados adicionais do evento
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Anomalias detectadas automaticamente
 */
export const telemetryAnomalies = mysqlTable("telemetry_anomalies", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 100 }).notNull(), // Tipo de anomalia (spike, drop, outlier, etc)
  metric: varchar("metric", { length: 200 }).notNull(), // Métrica afetada
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  description: text("description"),
  expectedValue: decimal("expected_value", { precision: 20, scale: 4 }),
  actualValue: decimal("actual_value", { precision: 20, scale: 4 }).notNull(),
  deviation: decimal("deviation", { precision: 10, scale: 2 }), // Desvio em %
  resolved: int("resolved").default(0).notNull(), // 0 = aberta, 1 = resolvida
  resolvedAt: timestamp("resolved_at"),
  detectedAt: timestamp("detected_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Aprendizados do sistema (padrões identificados)
 */
export const telemetryLearnings = mysqlTable("telemetry_learnings", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(), // performance, usage, errors, etc
  pattern: varchar("pattern", { length: 200 }).notNull(), // Padrão identificado
  description: text("description").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100%
  occurrences: int("occurrences").default(1).notNull(), // Quantas vezes foi observado
  impact: mysqlEnum("impact", ["positive", "neutral", "negative"]).notNull(),
  recommendation: text("recommendation"), // Ação recomendada
  applied: int("applied").default(0).notNull(), // 0 = não aplicado, 1 = aplicado
  appliedAt: timestamp("applied_at"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * Predições de falhas (sistema preditivo)
 */
export const telemetryPredictions = mysqlTable("telemetry_predictions", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 100 }).notNull(), // Tipo de falha prevista
  component: varchar("component", { length: 200 }).notNull(), // Componente afetado
  probability: decimal("probability", { precision: 5, scale: 2 }).notNull(), // 0-100%
  timeToFailure: int("time_to_failure"), // Tempo estimado até falha (segundos)
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  indicators: json("indicators"), // Indicadores que levaram à predição
  preventiveActions: json("preventive_actions"), // Ações preventivas sugeridas
  status: mysqlEnum("status", ["pending", "prevented", "occurred", "false_positive"]).default("pending").notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TelemetryMetric = typeof telemetryMetrics.$inferSelect;
export type TelemetryEvent = typeof telemetryEvents.$inferSelect;
export type TelemetryAnomaly = typeof telemetryAnomalies.$inferSelect;
export type TelemetryLearning = typeof telemetryLearnings.$inferSelect;
export type TelemetryPrediction = typeof telemetryPredictions.$inferSelect;
