import { describe, expect, it } from "vitest";

import fixture from "./__fixtures__/pilot-sample.json" with { type: "json" };
import { nationalFeatureSchema, nationalQueryResponseSchema } from "./schema.ts";
import { toAppealRow, toApplicationRow } from "./to-rows.ts";

const applications = nationalQueryResponseSchema
  .parse(fixture)
  .features.map((feature) => nationalFeatureSchema.parse(feature));

function fixtureApplication(applicationNumber: string) {
  const match = applications.find((app) => app.applicationNumber === applicationNumber);
  if (!match) throw new Error(`Fixture has no application ${applicationNumber}`);
  return match;
}

describe("toApplicationRow", () => {
  it("maps a parsed application onto the applications table", () => {
    const app = fixtureApplication("2660216");
    const row = toApplicationRow(app, "wicklow");

    expect(row.councilSlug).toBe("wicklow");
    expect(row.applicationNumber).toBe("2660216");
    expect(row.receivedDate).toBe(app.receivedDate);
    expect(row.decisionRaw).toBe(app.decisionRaw);
  });

  it("stores location as PostGIS x (longitude) and y (latitude)", () => {
    const row = toApplicationRow(fixtureApplication("2660216"), "wicklow");

    expect(row.location?.x).toBeCloseTo(-6.3635, 3);
    expect(row.location?.y).toBeCloseTo(52.8441, 3);
  });
});

describe("toAppealRow", () => {
  it("maps the appeal when there is one", () => {
    expect(toAppealRow(fixtureApplication("2660216"))?.caseNumber).toBe("PL-501405-WW-26");
  });

  it("returns null when there is no appeal", () => {
    expect(toAppealRow(fixtureApplication("20261048"))).toBeNull();
  });
});
