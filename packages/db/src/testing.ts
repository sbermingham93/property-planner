import { PGlite } from "@electric-sql/pglite";
import { postgis } from "@electric-sql/pglite-postgis";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import type { Database } from "./client.ts";
import * as schema from "./schema/index.ts";

const MIGRATIONS_FOLDER = new URL("../migrations", import.meta.url).pathname;

/**
 * A real Postgres with PostGIS, running in-process and migrated to the latest
 * schema. Starting it takes several seconds, so share one per test file.
 */
export async function createTestDb(): Promise<{ db: Database; close: () => Promise<void> }> {
  const client = new PGlite({ extensions: { postgis } });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return { db, close: () => client.close() };
}
