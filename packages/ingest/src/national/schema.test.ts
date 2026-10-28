import { describe, expect, it } from "vitest";

import fixture from "./__fixtures__/pilot-sample.json" with { type: "json" };
import { nationalFeatureSchema, nationalQueryResponseSchema } from "./schema.ts";

const features = nationalQueryResponseSchema.parse(fixture).features;

function parseFixture(applicationNumber: string) {
  const parsed = features.map((feature) => nationalFeatureSchema.parse(feature));
  const match = parsed.find((app) => app.applicationNumber === applicationNumber);
  if (!match) throw new Error(`Fixture has no application ${applicationNumber}`);
  return match;
}

describe("nationalFeatureSchema", () => {
  it("parses every real record in the fixture", () => {
    for (const feature of features) {
      expect(nationalFeatureSchema.safeParse(feature).success).toBe(true);
    }
  });

  it("trims padded application numbers", () => {
    expect(parseFixture("F26A/0716E").applicationNumber).toBe("F26A/0716E");
  });

  it("converts epoch milliseconds to calendar dates", () => {
    expect(parseFixture("2660216").receivedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("groups appeal fields, or returns null when there is no appeal", () => {
    expect(parseFixture("2660216").appeal?.caseNumber).toBe("PL-501405-WW-26");
    expect(parseFixture("20261048").appeal).toBeNull();
  });

  it("treats empty strings as missing", () => {
    expect(parseFixture("D26A/0793/WEB").decisionRaw).toBeNull();
  });

  it("maps geometry to longitude and latitude", () => {
    const { location } = parseFixture("2660216");
    expect(location?.lng).toBeCloseTo(-6.3635, 3);
    expect(location?.lat).toBeCloseTo(52.8441, 3);
  });

  it("drops applicant personal data", () => {
    const withApplicant = structuredClone(features[0]) as {
      attributes: Record<string, unknown>;
    };
    withApplicant.attributes["ApplicantForename"] = "Jane";
    withApplicant.attributes["ApplicantSurname"] = "Doe";
    withApplicant.attributes["ApplicantAddress"] = "1 Main Street";

    const serialised = JSON.stringify(nationalFeatureSchema.parse(withApplicant));

    expect(serialised).not.toContain("Jane");
    expect(serialised).not.toContain("Doe");
    expect(serialised).not.toContain("1 Main Street");
  });

  it("rejects a record without an application number", () => {
    const missing = structuredClone(features[0]) as { attributes: Record<string, unknown> };
    missing.attributes["ApplicationNumber"] = "  ";

    expect(nationalFeatureSchema.safeParse(missing).success).toBe(false);
  });

  it("treats n/a placeholders as missing", () => {
    const placeholder = structuredClone(features[0]) as { attributes: Record<string, unknown> };
    placeholder.attributes["Decision"] = "n/a";

    expect(nationalFeatureSchema.parse(placeholder).decisionRaw).toBeNull();
  });
});
