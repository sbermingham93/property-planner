import { sql } from "drizzle-orm";

import { appeals, applications, setFromExcluded } from "@property-progress/db";
import type { Database } from "@property-progress/db";

import type { NationalApplication } from "./schema.ts";
import { toAppealRow, toApplicationRow } from "./to-rows.ts";
import type { NationalApplicationRow } from "./to-rows.ts";

export interface LoadResult {
  applications: number;
  appeals: number;
}

/** Keeps Postgres well under its 65,535 bind-parameter limit per statement. */
const ROWS_PER_STATEMENT = 1000;

const KEY_COLUMNS = new Set(["councilSlug", "applicationNumber"]);

/**
 * Inserts or updates one council's applications and their appeals. Safe to
 * re-run: rows are matched on council and application number, and on appeal
 * case number.
 */
export async function loadApplications(
  db: Database,
  councilSlug: string,
  parsed: NationalApplication[],
): Promise<LoadResult> {
  const latest = latestPerApplication(parsed);
  if (latest.length === 0) return { applications: 0, appeals: 0 };

  return db.transaction(async (tx) => {
    const ids = new Map<string, number>();
    for (const chunk of chunks(latest, ROWS_PER_STATEMENT)) {
      const saved = await upsertApplications(
        tx,
        chunk.map((app) => toApplicationRow(app, councilSlug)),
      );
      for (const { id, applicationNumber } of saved) ids.set(applicationNumber, id);
    }

    const appealRows = latestPerAppeal(latest).flatMap((app) => {
      const appeal = toAppealRow(app);
      const applicationId = ids.get(app.applicationNumber);
      return appeal && applicationId !== undefined ? [{ ...appeal, applicationId }] : [];
    });
    for (const chunk of chunks(appealRows, ROWS_PER_STATEMENT)) {
      await tx
        .insert(appeals)
        .values(chunk)
        .onConflictDoUpdate({
          target: appeals.caseNumber,
          set: {
            ...setFromExcluded(appeals, [
              "applicationId",
              "statusRaw",
              "decisionRaw",
              "submittedDate",
              "decisionDate",
            ]),
            updatedAt: sql`now()`,
          },
        });
    }

    return { applications: latest.length, appeals: appealRows.length };
  });
}

function upsertApplications(db: Database, rows: NationalApplicationRow[]) {
  // Every column the mapper fills, except the key, is refreshed from the source.
  const firstRow = rows[0] ?? {};
  const columnsToUpdate = Object.keys(firstRow).filter(
    (key) => !KEY_COLUMNS.has(key),
  ) as (keyof NationalApplicationRow)[];

  return db
    .insert(applications)
    .values(rows)
    .onConflictDoUpdate({
      target: [applications.councilSlug, applications.applicationNumber],
      set: { ...setFromExcluded(applications, columnsToUpdate), updatedAt: sql`now()` },
    })
    .returning({ id: applications.id, applicationNumber: applications.applicationNumber });
}

/**
 * The dataset can list an application more than once; keep the most recently
 * added record. One statement cannot upsert the same key twice.
 */
export function latestPerApplication(apps: NationalApplication[]): NationalApplication[] {
  return latestBy(apps, (app) => app.applicationNumber);
}

function latestPerAppeal(apps: NationalApplication[]): NationalApplication[] {
  return latestBy(
    apps.filter((app) => app.appeal),
    (app) => app.appeal?.caseNumber ?? "",
  );
}

function latestBy(
  apps: NationalApplication[],
  key: (app: NationalApplication) => string,
): NationalApplication[] {
  const byKey = new Map<string, NationalApplication>();
  for (const app of apps) {
    const existing = byKey.get(key(app));
    if (!existing || app.sourceObjectId > existing.sourceObjectId) byKey.set(key(app), app);
  }
  return [...byKey.values()];
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    result.push(items.slice(start, start + size));
  }
  return result;
}
