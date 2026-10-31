import { describe, expect, it } from "vitest";

import { buildPageUrl } from "./query.ts";

const url = buildPageUrl({
  councilDatasetName: "Wicklow County Council",
  receivedFrom: "2012-01-01",
  offset: 4000,
  pageSize: 2000,
});

describe("buildPageUrl", () => {
  it("filters by council and received date", () => {
    expect(url.searchParams.get("where")).toBe(
      "PlanningAuthority = 'Wicklow County Council' AND ReceivedDate >= DATE '2012-01-01'",
    );
  });

  it("pages in a stable order", () => {
    expect(url.searchParams.get("orderByFields")).toBe("OBJECTID");
    expect(url.searchParams.get("resultOffset")).toBe("4000");
    expect(url.searchParams.get("resultRecordCount")).toBe("2000");
  });

  it("asks for longitude and latitude", () => {
    expect(url.searchParams.get("outSR")).toBe("4326");
  });

  it("never requests applicant personal data", () => {
    expect(url.searchParams.get("outFields")).not.toMatch(/Applicant/);
  });

  it("escapes quotes in council names", () => {
    const quoted = buildPageUrl({
      councilDatasetName: "O'Brien Council",
      receivedFrom: "2012-01-01",
      offset: 0,
      pageSize: 10,
    });

    expect(quoted.searchParams.get("where")).toContain("'O''Brien Council'");
  });
});
