# Property Progress

Analysis of the Irish planning permission system: where applications stall, why appeals succeed or fail, and (later) an advisor that estimates timing and approval odds for a proposal. Pilot scope: Wicklow, Wexford, Dublin City, Dún Laoghaire-Rathdown, Fingal, South Dublin.

## Stack

- TypeScript (strict) on Node 24, pnpm workspaces. Run `.ts` directly with Node's type stripping; no build step yet.
- Postgres + PostGIS (`docker-compose.yml`), tables defined with Drizzle ORM. Python only for the Phase 3 prediction models, under `models/`.
- Decisions and their reasons live in `docs/adr/`. Read them before changing anything they cover; add one for any new significant choice.

## Layout

- `packages/ingest`: fetching and parsing external sources (national dataset, appeals board, council websites).
- `packages/db`: Drizzle tables (`src/schema/`), client, and generated migrations (`migrations/`).
- `apps/web`: dashboard and API (not yet created).

## Commands

- `pnpm check`: format check, lint, typecheck, tests. The same checks CI runs; a pre-push hook runs it and blocks the push on failure.
- `pnpm format`: fix formatting. `pnpm db:up` / `pnpm db:down`: local Postgres.
- `pnpm --filter @property-progress/ingest ingest:national [--council <slug>]... [--since YYYY-MM-DD]`: load the national dataset into `DATABASE_URL` (all pilot councils by default).

## Code principles

Code should be clean, easy to understand, and easy to extend.

- **Readable first.** Names say what something is; comments say why, never what. Prefer explicit, boring code over clever code.
- **Small and single-purpose.** One concern per module and per function. If a function needs a comment to explain its sections, split it.
- **Pure core, I/O at the edges.** Parsing, cleaning, mapping and derived metrics are pure functions, tested without a network or database. Fetching and database writes live in thin outer layers.
- **Extend by adding, not editing.** Each data source is a self-contained module under `packages/ingest/src/<source>/` following the same shape: `schema.ts` (zod, validates the source), `to-rows.ts` (maps to Drizzle rows), then fetch and load. Adding a council or source means adding a module, not changing others.
- **One home per concern.** Tables, enums and indexes live in Drizzle (`packages/db/src/schema/`); source quirks live in that source's zod schema; never duplicate a table's shape by hand.
- **No speculative abstraction.** Extract shared code on the second real use, not in anticipation.

## Rules

- No `any`, no non-null assertions (`!`), no `@ts-ignore`. If unavoidable, `@ts-expect-error` with a reason.
- Everything from outside the process (HTTP responses, scraped HTML, PDFs, LLM output, env vars) is `unknown` until parsed with a zod schema at the boundary. Never cast it.
- Imports use explicit `.ts` extensions and `import type` for types.
- Errors: throw `Error` subclasses with context (source, id, URL); never swallow. No `console.log`; use the logger once it exists (`console.warn`/`console.error` meanwhile).
- Tests next to the code as `*.test.ts`. Parsers and scrapers are tested against saved real responses in `__fixtures__/`, never live sites. Database code is tested against a real Postgres, not mocks: `createTestDb()` from `@property-progress/db/testing` gives an in-process Postgres with PostGIS (PGlite), migrated to the latest schema; share one per test file.
- Schema changes only through Drizzle: edit `packages/db/src/schema/`, run `pnpm --filter @property-progress/db db:generate`, commit the migration. Any hand edit to generated SQL is explained in a comment at the top of that file.

## Data handling

- Drop applicant names and personal addresses on ingest; the analysis never needs them.
- Raw downloads go under `data/` (gitignored) or object storage, never into git.
- Scrapers: respect robots.txt, rate-limit, identify with a User-Agent, cache responses.
- Secrets only via environment variables; document each in `.env.example`.

## Workflow

- Branch from `main`, one concern per PR, Conventional Commits (`feat:`, `fix:`, `chore:`...), enforced by commitlint.
- CI must be green and the PR reviewed before merge.
