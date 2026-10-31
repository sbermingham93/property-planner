import { councils, setFromExcluded } from "@property-progress/db";
import type { Database } from "@property-progress/db";

import { PILOT_COUNCILS } from "./councils.ts";

/** Makes sure every pilot council exists, so applications can reference it. */
export async function loadPilotCouncils(db: Database): Promise<void> {
  await db
    .insert(councils)
    .values([...PILOT_COUNCILS])
    .onConflictDoUpdate({
      target: councils.slug,
      set: setFromExcluded(councils, ["datasetName", "county"]),
    });
}
