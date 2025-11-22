import { boolean, int, json, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Tabela de auditoria para detecção de alucinações
 * Registra todas as execuções e valida se dados reportados são reais
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  input: text("input"),
  output: text("output"),
  validationScore: int("validation_score").notNull(), // 0-100
  isHallucination: boolean("is_hallucination").default(false).notNull(),
  realDataVerified: boolean("real_data_verified").default(false).notNull(),
  discrepancies: json("discrepancies").$type<string[]>(),
  executionTimeMs: int("execution_time_ms").notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
