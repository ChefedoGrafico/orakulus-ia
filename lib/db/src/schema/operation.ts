import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const operationSettingsTable = pgTable("operation_settings", {
  id: serial("id").primaryKey(),
  asset: text("asset").notNull(),
  direction: text("direction").notNull(),
  entryTime: text("entry_time").notNull(),
  flowStrength: text("flow_strength").notNull(),
  confirmations: text("confirmations").array().notNull().default([]),
  status: text("status").notNull(),
  estimatedProbability: integer("estimated_probability").notNull(),
  result: text("result").notNull().default(""),
  peopleWatching: integer("people_watching").notNull().default(0),
  studentsPresent: integer("students_present").notNull().default(0),
  feedbacksReceived: integer("feedbacks_received").notNull().default(0),
  communityResults: integer("community_results").notNull().default(0),
  whatsappLink: text("whatsapp_link").notNull(),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const operationHistoryTable = pgTable("operation_history", {
  id: serial("id").primaryKey(),
  asset: text("asset").notNull(),
  direction: text("direction").notNull(),
  entryTime: text("entry_time").notNull(),
  result: text("result").notNull(),
  estimatedProbability: integer("estimated_probability").notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type OperationSettingsRow = typeof operationSettingsTable.$inferSelect;
export type InsertOperationSettings =
  typeof operationSettingsTable.$inferInsert;

export type OperationHistoryRow = typeof operationHistoryTable.$inferSelect;
export type InsertOperationHistory =
  typeof operationHistoryTable.$inferInsert;
