import {
  bigint,
  date,
  doublePrecision,
  geometry,
  index,
  integer,
  pgTable,
  text,
  unique,
} from "drizzle-orm/pg-core";

import { councils } from "./councils.ts";
import { applicationType, decision } from "./enums.ts";
import { timestamps } from "./timestamps.ts";

/** One planning application to a council. Field meanings: docs/data-dictionary.md. */
export const applications = pgTable(
  "applications",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    councilSlug: text("council_slug")
      .notNull()
      .references(() => councils.slug),
    applicationNumber: text("application_number").notNull(),
    siteId: text("site_id"),

    description: text("description"),
    address: text("address"),
    eircode: text("eircode"),
    location: geometry("location", { type: "point", mode: "xy", srid: 4326 }),

    applicationTypeRaw: text("application_type_raw"),
    applicationType: applicationType("application_type"),
    statusRaw: text("status_raw"),
    decisionRaw: text("decision_raw"),
    decision: decision("decision"),
    landUseCodeRaw: text("land_use_code_raw"),
    oneOffHouseRaw: text("one_off_house_raw"),
    oneOffKpiRaw: text("one_off_kpi_raw"),

    residentialUnits: integer("residential_units"),
    // Units (m² or hectares) not yet verified; see docs/data-dictionary.md.
    floorArea: doublePrecision("floor_area"),
    siteArea: doublePrecision("site_area"),

    receivedDate: date("received_date", { mode: "string" }),
    decisionDueDate: date("decision_due_date", { mode: "string" }),
    decisionDate: date("decision_date", { mode: "string" }),
    grantDate: date("grant_date", { mode: "string" }),
    withdrawnDate: date("withdrawn_date", { mode: "string" }),
    expiryDate: date("expiry_date", { mode: "string" }),
    furtherInfoRequestedDate: date("further_info_requested_date", { mode: "string" }),
    furtherInfoReceivedDate: date("further_info_received_date", { mode: "string" }),

    councilFileUrl: text("council_file_url"),
    sourceObjectId: integer("source_object_id"),
    sourceUpdatedDate: date("source_updated_date", { mode: "string" }),
    ...timestamps,
  },
  (table) => [
    unique("applications_council_number_unique").on(table.councilSlug, table.applicationNumber),
    index("applications_received_date_idx").on(table.receivedDate),
    index("applications_site_id_idx").on(table.siteId),
    index("applications_location_idx").using("gist", table.location),
  ],
);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
