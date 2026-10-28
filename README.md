# Property Progress

Analysis of the Irish planning permission system: which areas do well or badly, why appeals succeed or fail, and eventually an advisor that estimates how long a proposal will take and its chances of approval.

See `CLAUDE.md` for conventions and `docs/adr/` for design decisions.

## Getting started

Requirements: Node 24 (see `.nvmrc`), pnpm 12, Docker.

```bash
npm install -g pnpm@12.16.1
```

```bash
pnpm install
```

```bash
cp .env.example .env
```

```bash
pnpm db:up
```

```bash
pnpm check
```

## Project layout

| Path              | Purpose                                |
| ----------------- | -------------------------------------- |
| `packages/ingest` | Fetch and parse external planning data |
| `docs/adr`        | Architecture decision records          |
| `.github`         | CI workflow and pull request template  |
