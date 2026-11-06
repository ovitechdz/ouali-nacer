# Phase 2 — Summary and Approval Gate 2

**Status:** approved at Gate 2 on 2026-11-05 — all defaults except L-1.
L-1 is superseded by the style-site directive (D-0022…D-0025), implemented in
the preparation phase described in `NEXT-ACTIONS.md`.
**Reference:** `ovitechdz/ovitech.saas-` @ `f99cd02227cd9d6b5325cda21f94b89108b62d26`
**Target:** `ovitechdz/ouali-nacer` → `C:\Users\ASUS\ovitech-rebuild` (not created)
**Constraint honoured:** no application code was written, no dependency was
installed, no repository was created, nothing was deployed, the reference is
untouched.

---

## 1. What Phase 2 decided

Phase 2 turned the Phase 1 evidence into a buildable, testable plan. Eight
documents:

| Document | Answers |
|---|---|
| `PHASE-2-ARCHITECTURE.md` | Runtime, layers, state, persistence, i18n, PDF, PWA, security, budgets, dependencies, 14 deviations |
| `PHASE-2-DATA-MODEL.md` | Entities, ULIDs, IndexedDB, migrations, backup v2, retention, invariants |
| `PHASE-2-ACCESS-AND-SYNC.md` | Operator model, authority matrix, recommendation lifecycle, no-sync posture, `/etat` |
| `PHASE-2-ARABIC-RTL-STRATEGY.md` | Fonts, type scale, bidi, logical properties, glossary, translation workflow, print |
| `PHASE-2-HOSTING-DECISION.md` | Cloudflare Pages primary, Hetzner + Caddy fallback, headers, release, monitoring |
| `PHASE-2-QUALITY-STRATEGY.md` | Test pyramid, evidence rule, 16 CI gates, a11y, budgets, regression register |
| `PHASE-2-MIGRATION-MATRIX.md` | Per-file REUSE / REFACTOR / REBUILD / REJECT / DEFER for ~150 units |
| `PHASE-2-ROADMAP.md` | Phases 3–9, acceptance criteria, effort ranges, risks |

---

## 2. The ten decisions in one page

1. **Client-only SPA.** Vite + React 19 + TanStack Router, no SSR, no Nitro,
   no server functions. Static output, fully precacheable.
2. **No auth, no sync.** Single operator profile with an explicit authority
   switch. Backup/restore is the only data transport. `/sync` becomes
   `/donnees`.
3. **One document, one farm.** ULID ids, versioned IndexedDB, numbered
   migrations, backup v2 with checksum and optional AES-GCM encryption.
4. **Arabic-first, style-site look.** AR default and only eager locale; the
   font stack, colours, radii and spacing come from the style site
   (`Inter` + `Cairo`, self-hosted); logical properties only; bidi isolation
   for every identifier. The sidebar is fixed on desktop, a Drawer on mobile,
   and on the right in RTL.
5. **Deterministic domain core.** DDNE formulas preserved; clock injected;
   messages as keys; engine version frozen per recommendation.
6. **Print-CSS reports.** No pdfmake; browser shaping for Arabic; automated
   PDF deferred to Phase 7.
7. **No Recharts, no framer-motion.** Small SVG charts; CSS entrance with a
   test that fails on hidden content.
8. **Cloudflare Pages** with Hetzner + Caddy as a documented fallback. Strict
   CSP, no analytics, no third-party origin.
9. **Verification is a deliverable.** Evidence rule per truth class, 16
   blocking CI gates, visual + offline + Arabic suites, defect regression
   register.
10. **Honest capability page.** `/etat` is generated from a registry and is
    the product's own truth matrix.

---

## 3. Deviations the rebuild will carry

These are intentional. They exist because reproducing the reference *exactly*
would reproduce defects, dead code or false claims.

| # | Reference | Rebuild | Reason |
|---|---|---|---|
| DEV-01 | Role fixed to `field`, approve unreachable | Operator profile + authority switch | D-101 |
| DEV-02 | `syncAll()` flips statuses; no real sync | No sync UI; `/donnees` backup page | D-102 |
| DEV-03 | Dead auth scaffold, no `/login` | No auth at all | D-103 |
| DEV-04 | French domain strings | Message keys, AR default | D-104 |
| DEV-05 | 1-day vs 3-day stale scan | One constant | D-105 |
| DEV-06 | `Date.now()` mixed with seed clock | Injected clock | D-106 |
| DEV-07 | pdfmake + Amiri | Print-CSS | Arabic shaping, bundle |
| DEV-08 | Recharts | SVG charts | Bundle budget |
| DEV-09 | framer-motion `Entrance` | CSS transitions | `opacity: 0` defect |
| DEV-10 | Google Fonts | Self-hosted subsets | Offline |
| DEV-11 | `/__grok/*` manifest/icons | Own manifest/icons | Platform independence |
| DEV-12 | Seeded KPI series shown as real | Labelled reference series | Claim discipline |
| DEV-13 | No 404/offline route | `/404`, `/offline` | UX completeness |
| DEV-14 | Silent trim at 400 events | Export prompt, no silent deletion | Data safety |
| DEV-15 | Always starts seeded | Empty production start, dev-only seed | Honest data |
| DEV-16 | No capability page | `/etat` | Truth matrix |
| DEV-17 | Style site: horizontal top bar | Vertical sidebar; fixed desktop, Drawer mobile, right in RTL | D-0024 |
| DEV-18 | Reference navy/gold + Fraunces/Manrope | Style-site palette + Inter/Cairo | D-0022 |
| DEV-19 | Reference `/team` | Style-site `/equipe` reproduced as-is | D-0025 |
| DEV-20 | Google Fonts at runtime (style site) | Self-hosted Inter + Cairo | Offline |

Each will appear in the Phase 9 parity report with a screenshot or test
reference.

---

## 4. What the migration matrix means in practice

| Decision | Count (approx.) | Examples |
|---|---:|---|
| REUSE | 13 | validation schemas, numeric/cn helpers, UI primitives, engine-case fixtures, secret scan |
| REFACTOR | 47 | nutrition, health, KPIs, ration, feed, repository, most routes and components |
| REBUILD | 35 | types, store engine, shell, `/nutrition`, `/vision`, `/investisseurs`, `/label`, `/etat`, SW |
| REJECT | 45 | all auth/server/db, sync, outbox, trim, pdfmake, Recharts, framer-motion, Grok bridge |
| DEFER | 10 | PDF builders, future sync contract, optional PIN |

No route is copied wholesale. The reference is a specification; the rebuild is
new code with characterised behaviour.

---

## 5. Effort

| Phase | Effort (dev-days) |
|---|---|
| 3 — Clean foundation | 6–9 |
| 4 — Domain core and data layer | 10–14 |
| 5 — Shell, design system, UI reconstruction | 18–26 |
| 6 — Business modules and offline | 14–20 |
| 7 — Security, performance, QA | 8–12 |
| 8 — Hosting and release | 4–6 |
| 9 — Parity certification and handover | 5–8 |
| **Total** | **65–95** |

Excludes hardware, real backend, expert nutrition review and human content
authoring — each listed as an external dependency in `PHASE-2-ROADMAP.md` §10.

---

## 6. Readiness for Phase 3

Phase 3 can start immediately after approval, and cannot start before, because
it creates the repository at `C:\Users\ASUS\ovitech-rebuild` — the first
write action of the project.

Phase 3 prerequisites are all satisfied or trivially satisfiable:

| Prerequisite | State |
|---|---|
| Approved reference behaviour | Phase 1 + Gate 1 |
| Architecture and data model | This phase |
| Migration decisions per file | This phase |
| Test and CI strategy | This phase |
| Font licences (OFL) | Identified; files to be fetched in Phase 3 |
| Node/npm versions | Present (24.21.0 / 11.19.0) |
| GitHub access to `ouali-nacer` | Ownership confirmed; push requires explicit authorisation |
| Domain name / DNS | **Not needed until Phase 8** |
| Docker | **Not needed** (static hosting) |

---

## 7. Open questions — consolidated

All defaults are recommended. Answering "accept all defaults" closes Gate 2.

### 7.1 Architecture (A)

| # | Question | Default |
|---|---|---|
| A-1 | Client-only SPA on Vite + React 19 + TanStack Router, no SSR? | Yes |
| A-2 | Drop Recharts for hand-built SVG charts? | Yes |
| A-3 | Print-CSS PDF pipeline instead of pdfmake/Amiri embedding? | Yes |
| A-4 | No auth and no sync in the MVP? | Yes (D-0017) |
| A-5 | Accept the dependency exclusions (TanStack Start, better-auth, pg, PGlite, pdfmake, recharts, framer-motion, react-query, react-table)? | Yes |
| A-6 | Accept the performance budgets (180 KB initial, 120 KB route, 120 KB Arabic fonts)? | Yes |

### 7.2 Data (D)

| # | Question | Default |
|---|---|---|
| D-1 | ULIDs + single-document IndexedDB store? | Yes |
| D-2 | Import reference v1 backups through the migration chain? | Yes |
| D-3 | Optional passphrase encryption (AES-GCM) for exports? | Yes |
| D-4 | No silent deletion; retention prompts an export? | Yes |
| D-5 | Empty production start (no seed data)? | Yes |

### 7.3 Access and sync (S)

| # | Question | Default |
|---|---|---|
| S-1 | Single operator with an explicit `field`/`production` switch? | Yes |
| S-2 | "No sync, backup only", with `/sync` → `/donnees`? | Yes |
| S-3 | Restricted actions disabled with a reason, not hidden? | Yes |
| S-4 | `/etat` capability page as a required route? | Yes |
| S-5 | Optional PIN lock deferred to Phase 7? | Yes |

### 7.4 Language and RTL (L)

| # | Question | Default |
|---|---|---|
| L-1 | ~~Amiri + IBM Plex Sans Arabic + Fraunces + Manrope, self-hosted?~~ **REJECTED.** Adopt the style-site stack: Inter + Cairo, self-hosted. | No |
| L-2 | Latin digits for all data, codes and measurements? | Yes |
| L-3 | Print-CSS reports instead of a PDF engine? | Yes |
| L-4 | Arabic-first authoring workflow (AR written first, FR/EN derived)? | Yes |
| L-5 | `ar-DZ` formatting, Gregorian calendar, DZD? | Yes |

### 7.5 Hosting (H)

| # | Question | Default |
|---|---|---|
| H-1 | Cloudflare Pages as primary host? | Yes |
| H-2 | Hetzner + Caddy as documented fallback? | Yes |
| H-3 | Root-domain hosting with the proposed headers/CSP? | Yes |
| H-4 | Zero analytics; uptime-only monitoring? | Yes |

### 7.6 Quality (Q)

| # | Question | Default |
|---|---|---|
| Q-1 | Evidence rule: truth class determines required tests? | Yes |
| Q-2 | ~160 initial visual baselines (4 widths × 2 locales)? | Yes |
| Q-3 | `?e2e=1` deterministic hook (fixed clock, reduced motion)? | Yes |
| Q-4 | Property-based testing with `fast-check`? | Yes |
| Q-5 | 16 blocking CI gates? | Yes |
| Q-6 | Manual Arabic + honesty passes as release gates? | Yes |

### 7.7 Migration (M)

| # | Question | Default |
|---|---|---|
| M-1 | REUSE the 13 low-risk files? | Yes |
| M-2 | No route copied wholesale — behaviour only? | Yes |
| M-3 | Reject all auth/server/db code? | Yes |
| M-4 | `/sync` → `/donnees` as the only URL change? | Yes |
| M-5 | Accept the Phase 3–9 sequence? | Yes |
| M-6 | Reference PDF builders deferred, not ported? | Yes |

---

## 8. What is explicitly not approved by Gate 2

Gate 2 approves **the plan**. It does not authorise:

- creating the repository or writing phase-3 code (that is Gate 3);
- pushing to `ovitechdz/ouali-nacer`;
- deployment or purchase of a domain;
- installing or upgrading system software;
- any change to the reference repository;
- any claim of production readiness, scientific validity, security
  certification, or Startup Algeria certification.

---

## 9. Gate 2 checklist

| Item | State |
|---|---|
| Architecture defined | Done |
| Data model and migrations defined | Done |
| Access and authority model defined | Done |
| Sync posture decided | Done |
| Arabic/RTL strategy defined | Done |
| Hosting decided, Vercel excluded | Done |
| Quality and CI strategy defined | Done |
| Per-file migration matrix defined | Done |
| Phase 3–9 roadmap with acceptance criteria | Done |
| Deviations listed | Done (DEV-01…DEV-16) |
| No application code written | Confirmed |
| Target repo not created | Confirmed |
| Reference untouched | Confirmed |

**Gate 2 is open. Phase 3 is blocked until approval.**

---

## 10. Honest limitations of this plan

- Effort ranges are estimates by one developer, not a commitment.
- The DDNE formulas are reproduced as reference formulas; they are **not**
  validated against published nutrition standards. That requires an expert.
- Visual parity is defined against 41 screenshots, some of which hide content
  because of the reference's own animation defect. Where a capture is
  unreliable, the intended design and the source code take precedence, and the
  choice will be recorded.
- Print-CSS PDFs will not be byte-identical to the reference PDFs. This is a
  deliberate visual deviation (DEV-07).
- The rebuild cannot prove multi-user correctness, sync durability or hardware
  integration, because none of them exist in scope.
- Content pages (`/vision`, `/investisseurs`, `/label`) depend on owner-supplied
  figures and a human Arabic review; until then they ship marked accordingly.
