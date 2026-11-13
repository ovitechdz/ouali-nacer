# Phase 6 — stabilization progress

Branch: `wip/phase-6` · Started 2026-11-12 · No merge, no push, no deploy.

## Checkpoints

### CP-1 — CI blocked by harness files (fixed)

`npm run ci` failed at `format:check`: Prettier scanned the agent-harness layer
(`.dsh/`, `harness/`, `AGENTS.md`) and reported 22 files. These are git-excluded setup files,
not application source.

- Fix: `.prettierignore` now excludes `.dsh`, `harness`, `memory`, `AGENTS.md`.
- Second failure: ESLint scanned `harness/*.mjs` (53 `no-undef` / unused-var errors).
  Fix: `eslint.config.js` ignores `.dsh`, `harness`, `memory`.
- Evidence: `npx prettier --check .` → "All matched files use Prettier code style!";
  `npx eslint . --max-warnings=0` → exit 0.

### CP-2 — interactions.test.tsx diagnosis (render-bound, not setup-bound)

- Baseline: 103.8 s for 13 tests (tests 67.9 s, environment 14.8 s, collect 12.4 s).
  Slowest: team page 9.7 s; journal 3.1 s; proof 2.4 s; sync 1.6 s.
- Cause 1 (removed): `buildDemoDocument()` was rebuilt in every `beforeEach`. The demo document is
  deterministic, so it is now built once in `beforeAll` and `structuredClone`d per test.
  Result: 87.9 s total, setup 3.38 s → 1.82 s.
- Cause 2 (accepted): remaining cost is jsdom + React rendering full pages with router, i18n and
  long lists; the team page renders every member and runs 8 interactions.
- Fix: per-file `vi.setConfig({ testTimeout: 30_000 })` with a comment explaining why; the global
  config stays at 20 s. No assertion weakened, no test skipped, no worker hack.
- Test timeout was already 20 s, not 5 s (the 5 s figure came from an older config). The 3.7 s
  average is documented, not hidden.

### CP-3 — npm audit triage

See `NPM-AUDIT.md`: 17 advisories (2 critical, 13 moderate, 2 low), **all dev-only**;
`npm audit --omit=dev` → 0. No `npm audit fix --force` used; the only fixes available require
vitest 5 / TypeScript-ESLint majors and are deferred.

### CP-4 — team-page consent

Recorded in `DECISION-LOG.md` (D-00xx) per the project owner's confirmation, scope limited to the
fields already in the archive; page content unchanged.

### CP-5 — documentation reconciliation

Governance source of truth is the audit workspace
`C:\Users\ASUS\ovitech-audit\docs\rebuild\` (see `GOVERNANCE.md`). Route counts reconciled in
`ROUTE-COUNTS.md`; `DESIGN-TOOLING.md` gsap statement corrected. Roadmap gate count corrected to 14.

## Verification status

| Gate | Result |
| --- | --- |
| format | pass |
| lint | pass |
| typecheck | pass |
| tests | 13/13 in the profiled file; full suite in CI |
| build | pass (vite) |
| audits (bundle, precache, origins) | pass |
