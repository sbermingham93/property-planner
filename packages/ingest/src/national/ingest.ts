import type { Database } from "@property-progress/db";

import type { Council } from "../councils.ts";
import { finishIngestRun, startIngestRun } from "../ingest-runs.ts";
import type { RunCounts } from "../ingest-runs.ts";
import type { Logger } from "../logger.ts";
import { fetchApplicationPages } from "./fetch.ts";
import { loadApplications } from "./load.ts";

export interface IngestOptions {
  receivedFrom: string;
  delayMs?: number;
  fetchFn?: typeof fetch;
}

/** Fetches one council's applications from the national dataset and loads them, recording the run. */
export async function ingestCouncil(
  db: Database,
  council: Council,
  options: IngestOptions,
  logger: Logger,
): Promise<RunCounts> {
  const log = logger.child({ council: council.slug });
  const runId = await startIngestRun(db, `national:${council.slug}`);
  const counts: RunCounts = { recordsSeen: 0, recordsLoaded: 0, recordsRejected: 0 };

  try {
    const pages = fetchApplicationPages({
      councilDatasetName: council.datasetName,
      receivedFrom: options.receivedFrom,
      delayMs: options.delayMs,
      fetchFn: options.fetchFn,
    });

    for await (const page of pages) {
      for (const record of page.rejected) log.warn(record, "Rejected record");

      const loaded = await loadApplications(db, council.slug, page.applications);
      counts.recordsSeen += page.applications.length + page.rejected.length;
      counts.recordsRejected += page.rejected.length;
      counts.recordsLoaded += loaded.applications;
      log.info({ ...counts, appealsInPage: loaded.appeals }, "Loaded page");
    }

    await finishIngestRun(db, runId, counts);
    log.info(counts, "Finished");
    return counts;
  } catch (error) {
    await finishIngestRun(db, runId, counts, error);
    throw error;
  }
}
