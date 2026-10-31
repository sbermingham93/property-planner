import { getTableColumns, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

/**
 * The `set` clause for an upsert: each listed column takes the value from the
 * row that was being inserted (Postgres's `excluded` row).
 */
export function setFromExcluded<TTable extends PgTable>(
  table: TTable,
  columnKeys: (keyof TTable["_"]["columns"] & string)[],
): Record<string, SQL> {
  const columns = getTableColumns(table);
  return Object.fromEntries(
    columnKeys.map((key) => {
      const column = columns[key];
      if (!column) throw new Error(`Unknown column "${key}"`);
      return [key, sql.raw(`excluded."${column.name}"`)];
    }),
  );
}
