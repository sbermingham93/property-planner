import { z } from "zod";

import { MAX_PAGE_SIZE, buildPageUrl } from "./query.ts";
import { nationalFeatureSchema, nationalQueryResponseSchema } from "./schema.ts";
import type { NationalApplication } from "./schema.ts";

export interface RejectedRecord {
  /** The source OBJECTID when it could be read, for tracing back to the dataset. */
  sourceObjectId: number | null;
  issues: string[];
}

export interface Page {
  applications: NationalApplication[];
  rejected: RejectedRecord[];
}

export interface FetchOptions {
  councilDatasetName: string;
  receivedFrom: string;
  pageSize?: number | undefined;
  /** Pause between requests, to be polite to the public service. */
  delayMs?: number | undefined;
  fetchFn?: typeof fetch | undefined;
}

export class NationalServiceError extends Error {
  readonly url: string;

  constructor(message: string, url: string) {
    super(`${message} (${url})`);
    this.name = "NationalServiceError";
    this.url = url;
  }
}

const USER_AGENT =
  "property-progress/0.0 (planning research; https://github.com/sbermingham93/property-planner)";

const arcgisErrorSchema = z.object({
  error: z.object({ code: z.number(), message: z.string() }),
});

/** Yields one page of parsed applications at a time until the council's results run out. */
export async function* fetchApplicationPages(options: FetchOptions): AsyncGenerator<Page> {
  const pageSize = options.pageSize ?? MAX_PAGE_SIZE;
  const fetchFn = options.fetchFn ?? fetch;

  for (let offset = 0; ; offset += pageSize) {
    if (offset > 0 && options.delayMs) await sleep(options.delayMs);

    const url = buildPageUrl({
      councilDatasetName: options.councilDatasetName,
      receivedFrom: options.receivedFrom,
      offset,
      pageSize,
    });
    const body = await getJson(url, fetchFn);
    const response = nationalQueryResponseSchema.parse(body);

    yield parseFeatures(response.features);

    if (!response.exceededTransferLimit) return;
  }
}

async function getJson(url: URL, fetchFn: typeof fetch): Promise<unknown> {
  const response = await fetchFn(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new NationalServiceError(`HTTP ${String(response.status)}`, url.toString());
  }

  // ArcGIS reports query errors as HTTP 200 with an `error` body.
  const body: unknown = await response.json();
  const arcgisError = arcgisErrorSchema.safeParse(body);
  if (arcgisError.success) {
    const { code, message } = arcgisError.data.error;
    throw new NationalServiceError(`ArcGIS error ${String(code)}: ${message}`, url.toString());
  }
  return body;
}

function parseFeatures(features: unknown[]): Page {
  const page: Page = { applications: [], rejected: [] };

  for (const feature of features) {
    const result = nationalFeatureSchema.safeParse(feature);
    if (result.success) {
      page.applications.push(result.data);
    } else {
      page.rejected.push({
        sourceObjectId: readObjectId(feature),
        issues: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
    }
  }
  return page;
}

const objectIdSchema = z.object({ attributes: z.object({ OBJECTID: z.number() }) });

function readObjectId(feature: unknown): number | null {
  const result = objectIdSchema.safeParse(feature);
  return result.success ? result.data.attributes.OBJECTID : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
