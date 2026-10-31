import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { appeals, applications } from "@property-progress/db";
import type { Database } from "@property-progress/db";
import { createTestDb } from "@property-progress/db/testing";

import { loadPilotCouncils } from "../load-councils.ts";
import fixture from "./__fixtures__/pilot-sample.json" with { type: "json" };
import { latestPerApplication, loadApplications } from "./load.ts";
import { nationalFeatureSchema } from "./schema.ts";

const wicklow = fixture.features
  .map((feature) => nationalFeatureSchema.parse(feature))
  .filter((app) => app.councilName === "Wicklow County Council");

let db: Database;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await loadPilotCouncils(db);
});

afterAll(async () => {
  await close();
});

beforeEach(async () => {
  await db.delete(applications);
});

describe("loadApplications", () => {
  it("stores applications and links their appeals", async () => {
    const result = await loadApplications(db, "wicklow", wicklow);

    const [saved] = await db
      .select()
      .from(applications)
      .where(eq(applications.applicationNumber, "2660216"));
    const [appeal] = await db
      .select()
      .from(appeals)
      .where(eq(appeals.caseNumber, "PL-501405-WW-26"));

    expect(result).toEqual({ applications: wicklow.length, appeals: 2 });
    expect(saved?.councilSlug).toBe("wicklow");
    expect(saved?.location?.x).toBeCloseTo(-6.3635, 3);
    expect(appeal?.applicationId).toBe(saved?.id);
  });

  it("updates rather than duplicates when loaded again", async () => {
    await loadApplications(db, "wicklow", wicklow);
    const changed = wicklow.map((app) => ({ ...app, decisionRaw: "GRANT PERMISSION" }));

    await loadApplications(db, "wicklow", changed);

    const rows = await db.select().from(applications);
    expect(rows).toHaveLength(wicklow.length);
    expect(rows.every((row) => row.decisionRaw === "GRANT PERMISSION")).toBe(true);
  });

  it("does nothing for an empty page", async () => {
    expect(await loadApplications(db, "wicklow", [])).toEqual({ applications: 0, appeals: 0 });
  });
});

describe("latestPerApplication", () => {
  it("keeps the most recently added record when an application repeats", () => {
    const [app] = wicklow;
    if (!app) throw new Error("Fixture has no Wicklow applications");
    const older = { ...app, sourceObjectId: 1, decisionRaw: "OLD" };
    const newer = { ...app, sourceObjectId: 2, decisionRaw: "NEW" };

    expect(latestPerApplication([newer, older])).toEqual([newer]);
  });
});
