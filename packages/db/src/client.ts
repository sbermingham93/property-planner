import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index.ts";

/** Any Drizzle Postgres database using our schema: the real server or the in-process test one. */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export function createDb(databaseUrl: string) {
  const client = postgres(databaseUrl);
  return { db: drizzle(client, { schema }), close: () => client.end() };
}
