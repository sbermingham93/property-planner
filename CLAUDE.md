# Property Progress

Analysis of the Irish planning permission system: where applications stall, why appeals succeed or fail, and (later) an advisor that estimates timing and approval odds for a proposal. Pilot scope: Wicklow, Wexford, Dublin City, Dún Laoghaire-Rathdown, Fingal, South Dublin.

## Stack

- TypeScript (strict) on Node 24, pnpm workspaces. Run `.ts` directly with Node's type stripping; no build step yet.
- Postgres + PostGIS (`docker-compose.yml`). Python only for the Phase 3 prediction models, under `models/`.
- Decisions and their reasons live in `docs/adr/`. Read them before changing anything they cover; add one for any new significant choice.

## Layout

- `packages/ingest`: fetching and parsing external sources (national dataset, appeals board, council websites).
- `packages/db`: schema and migrations (not yet created).
- `apps/web`: dashboard and API (not yet created).

## Commands

- `pnpm check`: format check, lint, typecheck, tests. Must pass before any commit or PR.
- `pnpm format`: fix formatting. `pnpm db:up` / `pnpm db:down`: local Postgres.

## Rules

- No `any`, no non-null assertions (`!`), no `@ts-ignore`. If unavoidable, `@ts-expect-error` with a reason.
- Everything from outside the process (HTTP responses, scraped HTML, PDFs, LLM output, env vars) is `unknown` until parsed with a zod schema at the boundary. Never cast it.
- Imports use explicit `.ts` extensions and `import type` for types.
- Errors: throw `Error` subclasses with context (source, id, URL); never swallow. No `console.log`; use the logger once it exists (`console.warn`/`console.error` meanwhile).
- Tests next to the code as `*.test.ts`. Parsers and scrapers are tested against saved real responses in `__fixtures__/`, never live sites. Database code is tested against a real Postgres, not mocks.
- Schema changes only through versioned migrations.

## Data handling

- Drop applicant names and personal addresses on ingest; the analysis never needs them.
- Raw downloads go under `data/` (gitignored) or object storage, never into git.
- Scrapers: respect robots.txt, rate-limit, identify with a User-Agent, cache responses.
- Secrets only via environment variables; document each in `.env.example`.

## Workflow

- Branch from `main`, one concern per PR, Conventional Commits (`feat:`, `fix:`, `chore:`...), enforced by commitlint.
- CI must be green and the PR reviewed before merge.
