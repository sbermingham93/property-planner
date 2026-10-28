import { describe, expect, it } from "vitest";

import { PILOT_COUNCILS, findCouncil } from "./councils.ts";

describe("PILOT_COUNCILS", () => {
  it("has unique slugs and dataset names", () => {
    const slugs = PILOT_COUNCILS.map((council) => council.slug);
    const names = PILOT_COUNCILS.map((council) => council.datasetName);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("findCouncil", () => {
  it("returns the council for a known slug", () => {
    expect(findCouncil("wicklow")?.datasetName).toBe("Wicklow County Council");
  });

  it("returns undefined for an unknown slug", () => {
    expect(findCouncil("atlantis")).toBeUndefined();
  });
});
