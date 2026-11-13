# Governance pointer

The **governance source of truth** is the audit workspace:

```
C:\Users\ASUS\ovitech-audit\docs\rebuild\
```

It holds `KNOWN-ISSUES.md` (K-IDs), `DECISION-LOG.md`, `EXECUTION-LOG.md`, `PHASE-5-PROGRESS.md`,
audit reports, route/feature inventories and the final audit report.

## What this repository keeps

`docs/` keeps implementation-facing notes only. Where a copy disagrees with the audit workspace, the
audit workspace wins. Do not re-audit here; record findings there and link them.

## Corrections made in Phase 6

The stale entries K-34, K-36, K-37, K-43, K-44 and K-50 were corrected in the audit workspace on
2026-11-12 (see its `KNOWN-ISSUES.md` §Phase 6 corrections). This repository no longer restates
their status.

## Exceptions kept locally

- `docs/PHASE-6-PROGRESS.md` — checkpoints for the current branch.
- `docs/NPM-AUDIT.md` — advisory triage and accepted-risk statement.
- `docs/ROUTE-COUNTS.md` — reconciled route counts with aliases.
