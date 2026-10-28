# 0004. Drizzle for the database schema; zod at external boundaries

- Status: accepted
- Date: 2026-10-28

## Context

We need typed table definitions and versioned migrations for Postgres, and we need to validate data from sources we do not control (ArcGIS responses, scraped pages, LLM output), whose shapes differ from our tables.

## Decision

- **Drizzle ORM** (`packages/db`) defines every table, enum and index. Migrations are generated with drizzle-kit and committed. Row types come from the table definitions (`$inferSelect`, `$inferInsert`).
- **zod** validates and cleans each external source at the boundary (`packages/ingest/<source>/schema.ts`).
- A plain mapping function per source turns parsed records into table rows, typed against Drizzle's insert types so a forgotten column fails compilation.
- Pin the stable 0.45 / drizzle-kit 0.31 line, not the 1.0 release candidate.

## Consequences

Each concern has one home: tables in Drizzle, source quirks in zod, the join between them in a small mapper. Generated migrations may be hand-edited when drizzle-kit falls short; each edit is commented at the top of the file (currently: enabling PostGIS, and the SRID that drizzle-kit 0.31 drops). Revisit the 1.0 upgrade once it is released as stable.
