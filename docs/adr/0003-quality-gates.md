# 0003. Enforced quality gates

- Status: accepted
- Date: 2026-10-28

## Context

We want professional, consistent code from the first commit, including code written with AI assistance. Conventions that are only written down drift.

## Decision

Standards are enforced by tools that block a merge:

- TypeScript strict mode plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- ESLint `strictTypeChecked` and `stylisticTypeChecked` with zero warnings allowed; Prettier formatting.
- Vitest tests; parsers tested against saved real responses.
- Pre-commit hook (lint-staged), commit-msg hook (commitlint, Conventional Commits), and pre-push hook (`pnpm check`, the same checks as CI).
- GitHub Actions CI runs all of the above plus secret scanning (gitleaks) on every PR.
- Exact dependency versions, a lockfile, and Renovate for upgrades.
- `main` is protected: PRs only, CI green and one review required.

## Consequences

Slightly more friction per change, in exchange for a codebase that stays consistent as it grows. Branch protection must be configured on GitHub once the repository is pushed.
