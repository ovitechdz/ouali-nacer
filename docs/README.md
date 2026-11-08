# OVITECH — Documentation Index

These documents are the **approved Phase 0–2 audit set**, copied into the
rebuild on 2026-11-06 so the implementation and its rationale travel together.
They remain read-only snapshots; corrections are made in the audit workspace
(`C:\Users\ASUS\ovitech-audit\docs\rebuild`) and copied here deliberately.

`FINAL-AUDIT-REPORT.md` was deliberately **not** copied: it audits a different
PHP/React deployment and its ownership is unresolved.

## Core

| Document | Purpose |
|---|---|
| `REPOSITORY-IDENTITY.md` | Reference repository, baseline commit and provenance |
| `SOURCE-PROTECTION-PLAN.md` | Read-only rules for the reference |
| `REBUILD-EXECUTION-PLAN.md` | Phase plan and gates |
| `DECISION-LOG.md` | D-0001…D-0035, including Gate 2, the style-site directives and tooling hardening |
| `PHASE-2-SUMMARY.md` | Approved architecture summary |
| `PHASE-2-ARCHITECTURE.md` | Layers, ports, state, persistence, security, tokens |
| `PHASE-2-DATA-MODEL.md` | Entities and invariants |
| `PHASE-2-ARABIC-RTL-STRATEGY.md` | Arabic typography, bidi and logical properties |
| `PHASE-2-QUALITY-STRATEGY.md` | 16 CI gates, accessibility and budgets |
| `PHASE-2-MIGRATION-MATRIX.md` | Reference → rebuild mapping and deviations |
| `PHASE-2-ROADMAP.md` | Phases 3–9 |
| `PHASE-2-ACCESS-AND-SYNC.md` | Local-first access model, no sync in the MVP |
| `PHASE-2-HOSTING-DECISION.md` | Static hosting decision |
| `FEATURE-TRUTH-MATRIX.md` | Capability classes A–F |
| `DOMAIN-FUNCTIONALITY-AUDIT.md` | Nutrition, health, KPI and ration logic |
| `COMPONENT-INVENTORY.md` | Reference component map |
| `DATA-AND-API-INVENTORY.md` | Reference storage and API surface |
| `ROUTES-AND-PAGES.md` | Reference routes |
| `PWA-OFFLINE-AUDIT.md` | Offline defects and test matrix |
| `SECURITY-AUDIT.md` | Reference security findings |
| `VISUAL-REFERENCE-CATALOG.md` | Reference visual catalogue |
| `PHASE-0-ENVIRONMENT-AUDIT.md` | Environment baseline |
| `PHASE-1-FEATURE-INVENTORY.md` | Functional inventory |
| `KNOWN-ISSUES.md` | Open risks K-1…K-61 |

## Design evidence

| Document | Purpose |
|---|---|
| `design/EXTRACTION-REPORT.md` | Authoritative style-site tokens and font stack |
| `design/ARABIC-FONT-VERIFICATION.md` | Cairo coverage proof and self-hosting plan |
| `design/TEAM-PAGE-SOURCE.md` | `/equipe` anatomy, RTL findings and rebuild mapping |
| `rebuild/COLOUR-PROPOSAL.md` | Authenticated colour measurements, Tailwind v3/v4 provenance and WCAG ratios (proposal only) |

## Glossary

See `GLOSSARY.md` for domain and architecture vocabulary.
