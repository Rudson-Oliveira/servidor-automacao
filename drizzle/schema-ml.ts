import { mysqlTable, int, varchar, decimal, timestamp } from "drizzle-orm/mysql-core";

/**
 * Schema para Machine Learning Preditivo
 * 
 * Tabela:
 * - ml_predictions: Predições de séries temporais (CPU, memória, etc)
 */

export const mlPredictions = mysqlTable("ml_predictions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação da métrica
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  component: varchar("component", { length: 200 }).notNull().default("system"),
  
  // Predição
  predictedValue: decimal("predicted_value", { precision: 10, scale: 2 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(), // 0-1
  
  // Detecção de anomalia
  isAnomaly: int("is_anomaly").notNull().default(0), // 0 ou 1 (boolean)
  threshold: decimal("threshold", { precision: 10, scale: 2 }),
  
  // Timestamps
  predictedAt: timestamp("predicted_at").notNull(), // Quando a predição foi feita
  predictedFor: timestamp("predicted_for").notNull(), // Para qual momento foi previsto
  
  // Validação (preenchido depois)
  actualValue: decimal("actual_value", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MlPrediction = typeof mlPredictions.$inferSelect;
export type InsertMlPrediction = typeof mlPredictions.$inferInsert;
