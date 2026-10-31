import { describe, expect, it } from "vitest";

import fixture from "./__fixtures__/pilot-sample.json" with { type: "json" };
import { NationalServiceError, fetchApplicationPages } from "./fetch.ts";
import type { Page } from "./fetch.ts";

/** A stand-in for `fetch` that serves canned bodies in order and records requested URLs. */
function fakeFetch(bodies: unknown[], status = 200) {
  const requested: URL[] = [];
  const fetchFn = (input: string | URL | Request): Promise<Response> => {
    requested.push(new URL(input instanceof Request ? input.url : input));
    const body = bodies[requested.length - 1];
    return Promise.resolve(Response.json(body, { status }));
  };
  return { fetchFn, requested };
}

async function collect(pages: AsyncIterable<Page>): Promise<Page[]> {
  const collected: Page[] = [];
  for await (const page of pages) collected.push(page);
  return collected;
}

const options = { councilDatasetName: "Wicklow County Council", receivedFrom: "2012-01-01" };
const [first, second, ...rest] = fixture.features;

describe("fetchApplicationPages", () => {
  it("follows pages until the service stops reporting more", async () => {
    const { fetchFn, requested } = fakeFetch([
      { features: [first, second], exceededTransferLimit: true },
      { features: rest, exceededTransferLimit: false },
    ]);

    const pages = await collect(fetchApplicationPages({ ...options, pageSize: 2, fetchFn }));

    expect(pages.flatMap((page) => page.applications)).toHaveLength(fixture.features.length);
    expect(requested.map((url) => url.searchParams.get("resultOffset"))).toEqual(["0", "2"]);
  });

  it("reports malformed records without failing the page", async () => {
    const malformed = { attributes: { OBJECTID: 999, ApplicationNumber: null } };
    const { fetchFn } = fakeFetch([{ features: [first, malformed] }]);

    const [page] = await collect(fetchApplicationPages({ ...options, fetchFn }));

    expect(page?.applications).toHaveLength(1);
    expect(page?.rejected).toEqual([expect.objectContaining({ sourceObjectId: 999 }) as unknown]);
  });

  it("throws on an ArcGIS error body", async () => {
    const { fetchFn } = fakeFetch([{ error: { code: 400, message: "Invalid query" } }]);

    await expect(collect(fetchApplicationPages({ ...options, fetchFn }))).rejects.toThrow(
      NationalServiceError,
    );
  });

  it("throws on an HTTP error", async () => {
    const { fetchFn } = fakeFetch([{}], 503);

    await expect(collect(fetchApplicationPages({ ...options, fetchFn }))).rejects.toThrow(
      "HTTP 503",
    );
  });
});
