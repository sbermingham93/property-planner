# 0002. Pin TypeScript 6 until typescript-eslint supports 7

- Status: accepted
- Date: 2026-10-28

## Context

TypeScript 7 (the native compiler) is the latest release, but typescript-eslint 8.72 supports TypeScript `>=4.8.4 <6.1.0`. Type-aware lint rules (floating promises, unsafe `any`) are a core part of our quality gate.

## Decision

Pin TypeScript 6.0.x. Keep tsconfig options compatible with TypeScript 7 so the upgrade is a version bump.

## Consequences

Slower type checking than TypeScript 7. Upgrade when typescript-eslint supports it; Renovate will raise the PR.
