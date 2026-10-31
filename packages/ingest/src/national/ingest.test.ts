import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { applications, ingestRuns } from "@property-progress/db";
import type { Database } from "@property-progress/db";
import { createTestDb } from "@property-progress/db/testing";

import { findCouncil } from "../councils.ts";
import { loadPilotCouncils } from "../load-councils.ts";
import { createLogger } from "../logger.ts";
import fixture from "./__fixtures__/pilot-sample.json" with { type: "json" };
import { ingestCouncil } from "./ingest.ts";

const wicklow = findCouncil("wicklow");
if (!wicklow) throw new Error("Wicklow missing from the pilot councils");

const wicklowFeatures = fixture.features.filter(
  (feature) => feature.attributes.PlanningAuthority === "Wicklow County Council",
);
const silent = createLogger("silent");

function serving(body: unknown, status = 200): typeof fetch {
  return () => Promise.resolve(Response.json(body, { status }));
}

let db: Database;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await loadPilotCouncils(db);
});

afterAll(async () => {
  await close();
});

describe("ingestCouncil", () => {
  it("loads the council and records a finished run", async () => {
    const malformed = { attributes: { OBJECTID: 999 } };
    const fetchFn = serving({ features: [...wicklowFeatures, malformed] });

    const counts = await ingestCouncil(
      db,
      wicklow,
      { receivedFrom: "2012-01-01", fetchFn },
      silent,
    );

    expect(counts).toEqual({
      recordsSeen: wicklowFeatures.length + 1,
      recordsLoaded: wicklowFeatures.length,
      recordsRejected: 1,
    });
    expect(await db.$count(applications)).toBe(wicklowFeatures.length);

    const [run] = await db.select().from(ingestRuns);
    expect(run?.source).toBe("national:wicklow");
    expect(run?.finishedAt).not.toBeNull();
    expect(run?.error).toBeNull();
  });

  it("records the error and rethrows when the service fails", async () => {
    const fetchFn = serving({}, 503);

    await expect(
      ingestCouncil(db, wicklow, { receivedFrom: "2012-01-01", fetchFn }, silent),
    ).rejects.toThrow("HTTP 503");

    const runs = await db.select().from(ingestRuns);
    expect(runs.at(-1)?.error).toMatch(/HTTP 503/);
  });
});
