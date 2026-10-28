import { pgTable, text } from "drizzle-orm/pg-core";

export const councils = pgTable("councils", {
  slug: text("slug").primaryKey(),
  /** Exactly as it appears in the national dataset's `PlanningAuthority` field. */
  datasetName: text("dataset_name").notNull().unique(),
  county: text("county").notNull(),
});

export type Council = typeof councils.$inferSelect;
export type NewCouncil = typeof councils.$inferInsert;
