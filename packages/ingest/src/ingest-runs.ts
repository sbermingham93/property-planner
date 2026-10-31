import { eq, sql } from "drizzle-orm";

import { ingestRuns } from "@property-progress/db";
import type { Database } from "@property-progress/db";

export interface RunCounts {
  recordsSeen: number;
  recordsLoaded: number;
  recordsRejected: number;
}

export async function startIngestRun(db: Database, source: string): Promise<number> {
  const [run] = await db.insert(ingestRuns).values({ source }).returning({ id: ingestRuns.id });
  if (!run) throw new Error(`Could not record the start of an ingest run for ${source}`);
  return run.id;
}

export async function finishIngestRun(
  db: Database,
  runId: number,
  counts: RunCounts,
  error?: unknown,
): Promise<void> {
  await db
    .update(ingestRuns)
    .set({
      ...counts,
      finishedAt: sql`now()`,
      error: error === undefined ? null : describeError(error),
    })
    .where(eq(ingestRuns.id, runId));
}

function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return JSON.stringify(error);
}
