# npm audit triage — Phase 6 (2026-11-12)

Command: `npm audit` on `wip/phase-6`. Totals: **17** (2 critical, 13 moderate, 2 low).
`npm audit --omit=dev` → **0** (no production dependency is affected).

## Classification

| Package | Severity | Type | Path | Advisory | Reachable in this client-only app? | Action |
| --- | --- | --- | --- | --- | --- | --- |
| `tinypool` | critical | dev (via vitest) | `node_modules/tinypool` | prototype-pollution gadget → RCE in worker options | No — test runner only, never imported by `src/` | accepted; fixed only by vitest 5 |
| `vitest` | critical | dev (direct) | via `@vitest/mocker`, `tinypool` | path traversal / arbitrary file read in mocker; RCE gadget | No — test tooling | accepted; `npm audit fix` wants vitest@5 (breaking) |
| `@vitest/mocker` | moderate | dev | via vitest | redirect-mock path traversal | No | covered by vitest major |
| `@vitest/coverage-v8` | moderate | dev (direct) | via `test-exclude`, `vitest` | inherits vitest/glob advisories | No | covered by vitest major |
| `vite-plugin-pwa` | moderate | dev (direct) | via `workbox-build` | inherits glob/minimatch chain | Build time only; not shipped | accepted |
| `workbox-build` | moderate | dev | via `@rollup/plugin-node-resolve`, `glob` | inherits | Build time only | accepted |
| `test-exclude` | moderate | dev | via `glob`, `minimatch` | glob DoS | Test tooling | accepted |
| `glob` | moderate | dev | via `minimatch` | AbortSignal bypass | Test/build tooling | accepted |
| `minimatch` | moderate | dev | transitive | ReDoS via globparts | Tooling | accepted |
| `@typescript-eslint/*` (5 entries) | moderate | dev | parser/plugin/utils/type-utils/typescript-estree | ReDoS in `minimatch` used by the type-aware matcher | Lint only | accepted |
| `typescript-eslint` | moderate | dev (direct) | umbrella | inherits | Lint only | accepted |
| `deepmerge` | low | dev | via `@rollup/plugin-node-resolve` | prototype poisoning | Build tooling | accepted |
| `@rollup/plugin-node-resolve` | low | dev | transitive | inherits deepmerge | Build tooling | accepted |

## Why nothing was upgraded

- The two criticals are test-runner internals. The fix path is **vitest 5**, a major upgrade of the
  test stack (config, coverage provider, reporters). Doing that inside a stabilization branch would
  violate "no new features / no risky changes"; it belongs to a dedicated dependency batch.
- The `@typescript-eslint` moderates come from `minimatch` via the type-aware lint config; bumping
  the ESLint stack is also a major.
- `vite-plugin-pwa`/`workbox-build` advisories are in the build-time graph; the generated service
  worker is audited separately by `audit:precache`.

## Risk statement (accepted)

All 17 advisories are **development-only**. They cannot be reached from the shipped bundle: the
production dependencies (`react`, `react-dom`, `@tanstack/react-router`, `zustand`, `zod`, `gsap`,
`i18next`, `react-i18next`, `clsx`, `lucide-react`, `tailwind-merge`) have no advisories. Exploiting
them requires running the test/lint/build tooling against attacker-controlled input, which is not a
production surface. Revisit in the dependency-upgrade phase; track as a known issue.

Commands used: `npm audit`, `npm audit --omit=dev`, `npm audit fix --dry-run` (no changes applied),
never `npm audit fix --force`.
