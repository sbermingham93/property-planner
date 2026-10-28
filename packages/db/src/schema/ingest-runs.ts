import { bigint, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** One execution of an ingest job, so every loaded row can be traced and gaps spotted. */
export const ingestRuns = pgTable("ingest_runs", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  source: text("source").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  recordsSeen: integer("records_seen").notNull().default(0),
  recordsLoaded: integer("records_loaded").notNull().default(0),
  recordsRejected: integer("records_rejected").notNull().default(0),
  error: text("error"),
});

export type IngestRun = typeof ingestRuns.$inferSelect;
export type NewIngestRun = typeof ingestRuns.$inferInsert;
