# Phase 5b — taste, motion and headroom

Branch: `phase-5b` from `main@7fdbe51`. No merge, no push, no deploy.

## Team protocol (from AGENTS.md / TEAM.md)

| Batch | Maker | Checker(s) |
| --- | --- | --- |
| 1 headroom | frontend-engineer | performance-engineer |
| 2 taste | design-system-lead | ux-designer, a11y-i18n-engineer |
| 3 transitions | motion-engineer | performance-engineer, a11y-i18n-engineer |
| 4 GSAP | motion-engineer | performance-engineer, a11y-i18n-engineer |
| 5 React Bits | motion-engineer + design-system-lead | performance-engineer, security-engineer |
| 6 verification | qa-automation | a11y-i18n-engineer, design-system-lead |

## Batch 1 — headroom (INCOMPLETE)

Target: entry 173.9 kB gzip → ≤150 kB without behaviour change.

What was measured (temporary tooling, nothing added to the repo):

- `vite build --sourcemap` to `%TEMP%\dist-analyze`: entry `index-*.js` 573.6 kB raw / 173.9 kB gzip.
- `npx source-map-explorer` **failed** (source map column `Infinity` — esbuild map quirk).
- `npx vite-bundle-visualizer --template raw-data` produced a JSON whose per-node sizes are all `0`
  (it needs `--sourcemap`, and that path fails for the same map quirk). No reliable per-module ranking
  was obtained.
- Marker check inside the built entry: `ZodError` present, `i18next` present, `lucide` present,
  `createRoot` present, `gsap` string present.

Findings that change the plan:

1. **GSAP is already applied** — `src/motion/use-gsap-reveal.ts` dynamically imports `gsap` and is used
   by `HomePage.tsx:22`, `HerdPage.tsx:19`, `EnergyPage.tsx:8`, `KpiPage.tsx:13`. K-71 ("gsap imported
   by nothing") is **stale** and must be corrected before Batch 4 is planned; Batch 4 is partly done.
2. Entry still carries `zod`, `i18next` and `lucide-react` code. A real reduction needs one of:
   deferring service/schema initialisation behind the first route, or splitting the icon set — both
   touch behaviour-sensitive boot code and need the full test matrix, not a blind edit.

Not done in this session: no module moved, no budget number achieved. No code change was made for
Batch 1, therefore nothing was committed beyond this log.

## Batches 2–6

**Not started.** Quota was nearly exhausted after the Batch 1 analysis. No taste review, no transition
work, no additional GSAP choreography, no React Bits component, no screenshots, no axe-core, no merge.

## Next session entry point

1. Re-run the analysis with a working tool (rollup-plugin-visualizer inside a temporary config, or
   `vite build --mode analyze` with a temp config file) to get a per-module ranking.
2. Correct K-71 in `KNOWN-ISSUES.md` (gsap is already used by four routes) and rescope Batch 4 to
   "extend + enforce the 60 kB lazy gate" rather than "apply GSAP".
3. Then resume Batch 1 with the deferral candidates above.
