# 0001. TypeScript and Postgres as the core stack

- Status: accepted
- Date: 2026-10-28

## Context

The product will grow from analysis (council scorecards, appeal reasons) into a web app and an advisor for applicants. Ingest, the app and the advisor all need the same data.

## Decision

TypeScript on Node for ingest, scrapers, the API and the web app. Postgres with PostGIS as the single database from day one, so the dashboard, models and advisor read the same tables and no migration is needed later.

Python is used only for the Phase 3 prediction models (survival analysis for time to decision, calibrated gradient boosting for approval odds), where its libraries are much stronger. It runs as an isolated job that reads from and writes predictions back to Postgres.

## Consequences

One language for most of the codebase. DuckDB-style local analysis is not available, but the data volume (about 600,000 applications nationally) is small for Postgres. Revisit the Python piece if the models turn out simple enough to run in TypeScript.
