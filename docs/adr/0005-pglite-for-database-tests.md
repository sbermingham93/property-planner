# 0005. PGlite for database tests

- Status: accepted
- Date: 2026-10-28

## Context

Database code must be tested against a real Postgres with PostGIS, not mocks. Requiring Docker for every test run adds setup for each contributor and a service container in CI.

## Decision

Tests use PGlite (Postgres compiled to WebAssembly) with its PostGIS extension, created through `createTestDb()` in `@property-progress/db/testing`. It applies the same Drizzle migrations as production. Production and local development use a real Postgres server (`docker-compose.yml`).

## Consequences

`pnpm test` needs no external services, locally or in CI. Each test database takes a few seconds to start, so test files share one. PGlite is single-connection, so concurrency behaviour (locks, parallel writers) is not covered; add tests against a real server if that becomes important.
