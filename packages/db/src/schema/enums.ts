import { pgEnum } from "drizzle-orm/pg-core";

// Normalised values agreed in docs/data-dictionary.md. Raw source values are
// stored alongside, so these mappings can be corrected and re-run.

export const applicationType = pgEnum("application_type", [
  "permission",
  "outline",
  "retention",
  "permission_and_retention",
  "extension_of_duration",
  "section_5_exemption",
  "other",
]);

export const decision = pgEnum("decision", [
  "grant",
  "grant_with_conditions",
  "refuse",
  "split",
  "invalid",
  "withdrawn",
  "pending",
]);
