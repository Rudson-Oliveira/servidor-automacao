import { int, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Schema para Web Push Notifications
 * Armazena subscriptions de usuários para envio de notificações push
 */

export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Subscription object completo do browser
  endpoint: text("endpoint").notNull(),
  keys: json("keys").notNull(), // { p256dh, auth }
  
  // Metadados
  userAgent: text("user_agent"),
  deviceName: varchar("device_name", { length: 255 }),
  
  // Preferências de notificação
  enabledEvents: json("enabled_events").notNull(), // array de tipos de eventos
  
  // Status
  isActive: int("is_active").default(1).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
