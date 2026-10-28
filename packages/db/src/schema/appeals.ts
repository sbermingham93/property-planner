import { bigint, date, index, pgTable, text } from "drizzle-orm/pg-core";

import { applications } from "./applications.ts";
import { timestamps } from "./timestamps.ts";

/**
 * An appeal to An Coimisiún Pleanála. An application can have several.
 * The normalised outcome is added once its mapping is designed.
 */
export const appeals = pgTable(
  "appeals",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    caseNumber: text("case_number").notNull().unique(),
    statusRaw: text("status_raw"),
    decisionRaw: text("decision_raw"),
    submittedDate: date("submitted_date", { mode: "string" }),
    decisionDate: date("decision_date", { mode: "string" }),
    ...timestamps,
  },
  (table) => [index("appeals_application_id_idx").on(table.applicationId)],
);

export type Appeal = typeof appeals.$inferSelect;
export type NewAppeal = typeof appeals.$inferInsert;
