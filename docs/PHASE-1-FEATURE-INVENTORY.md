# Phase 1 — Master Feature Inventory

**Reference:** `ovitechdz/ovitech.saas-` @ `f99cd02227cd9d6b5325cda21f94b89108b62d26`
**Audit window:** 2026-11-02 → 2026-11-03
**Mode:** read-only source inspection + isolated runtime capture
**Status:** approved at **Approval Gate 1** (2026-11-03, D-0016)

This document is the index and executive summary of the Phase 1 evidence set.
It does not repeat the detail of the nine specialist documents; it states what
was found, what it means for the rebuild, and what must be decided before
Phase 2.

---

## 1. Evidence base

| Artifact | Purpose |
|---|---|
| `ROUTES-AND-PAGES.md` | 27 route files, navigation model, page-by-page inventory |
| `COMPONENT-INVENTORY.md` | 16 top-level components, 7 chart components, 5 UI primitives, tokens |
| `DATA-AND-API-INVENTORY.md` | domain model, store slices, persistence, backup, server API, schema, i18n, PDFs |
| `DOMAIN-FUNCTIONALITY-AUDIT.md` | what the product actually computes, defect register D-101…D-116 |
| `FEATURE-TRUTH-MATRIX.md` | 77 capabilities classified A–F with ship rules |
| `PWA-OFFLINE-AUDIT.md` | service worker, manifest, storage, offline gaps P-01…P-12 |
| `SECURITY-AUDIT.md` | secret scan evidence, auth/tenant findings S-01…S-13 |
| `VISUAL-REFERENCE-CATALOG.md` | tokens, shell geometry, 20 screens, RTL analysis, 41 screenshots |
| `visuals/` | desktop 1440 px + mobile 420 px captures for 20 routes, plus AR/RTL |

Supporting evidence:

- Official clone `C:\Users\ASUS\ovitech-reference`, checked out at `f99cd02`,
  `git status` clean, push URL `DISABLED_READ_ONLY`.
- Secret scan `node scripts/check-secrets.mjs` → `ok — 281 tracked files
  scanned, no banned secrets detected`.
- Isolated visual copy `C:\Users\ASUS\ovitech-visual` with dependencies
  installed, used only for screenshots.

---

## 2. What the reference actually is

A **single-farm, local-first demonstrator** built as a modern SPA/SSR app:

| Layer | Technology |
|---|---|
| Framework | TanStack Start 1.168 + TanStack Router 1.170 |
| UI | React 19.2, Tailwind CSS 4.3, Radix primitives, lucide icons |
| State | Zustand 5 (7 slices) + IndexedDB persistence |
| Charts | Recharts 2 (plus hand-built SVG gauges/counters) |
| Motion | framer-motion 12 |
| i18n | i18next 26 + react-i18next, FR/EN/AR |
| Validation | Zod 4 |
| PDF | pdfmake 0.3 client-side (Roboto + Amiri) |
| Backend (scaffold) | TanStack server functions, Better Auth 1.6, pg + PGlite |
| PWA | hand-written `public/sw.js`, dynamic manifest under `/__grok/*` |

281 tracked files, 27 test files (10 script tests, 17 `src/lib` tests), no
component or route tests.

**No AI/ML model is used anywhere.** The nutrition engine is deterministic
arithmetic. Grok appears only as an auth/deployment platform, not as inference.

---

## 3. Headline findings

### 3.1 The real product core is small, deterministic and good

1. Nutrition engine DDNE-REF-0.9: maintenance `0.40 × W^0.75`, growth
   `ADG × 23 MJ`, lactation `1.1 kg × 5 MJ`, BCS adjustment, DMI ceiling
   `3.8 % / 3.2 % PV`, concentrate share by stage, CP and water/mineral
   outputs, plus full evidence strings.
2. Refusal contract: no weight, no BCS, or no feed context → `ration: null`
   with explicit `missingInputs`. The engine never invents a ration.
3. Health triage: weight loss ≥ 6 %, BCS < 2.0 / < 2.5, scan older than 3
   days, lambing within 10 days, latest engine refusal.
4. Ration sheet: per-pen aggregation, cheapest-lot costing, stock coverage
   check, atomic batch serve.
5. Backup/restore: canonical JSON, SHA-256, structural and size validation,
   full replacement.
6. Local audit trail and client-side PDF reports (FR and AR).

These are the parity-critical behaviours and they are testable.

### 3.2 Five defects block a faithful "working product" claim

| ID | Defect | Effect |
|---|---|---|
| **D-101** | Default role is `field`; no UI calls `setRole`; approve is `production`-only | **The approve → serve workflow is unreachable in a fresh session.** No ration can be served through the UI. |
| **D-102** | `syncAll()` only flips statuses; outbox is never drained; server endpoint never called | Sync is a **UI demonstration**, not synchronization. |
| **D-103** | No `/login` route; auth gates never imported; `VITE_AUTH_ENABLED` defaults to `false` | Auth is dead code in the shipped app. |
| **D-104** | Engine notes, refusal reasons and missing-input labels are hard-coded French | Arabic-first is impossible without moving domain strings to i18n. |
| **D-106** | Pages mix `Date.now()` with a seed clock fixed at `2026-08-28` | The demo degrades over real time; scan staleness and ADG drift. |

### 3.3 The rest is honestly labelled simulation

RFID, cameras, gates, scale, IoT climate, hydroponics, energy and sync are
simulated and carry "simulation" / "démonstration" labels. This is acceptable
**only if the labels survive the rebuild**. `FEATURE-TRUTH-MATRIX.md` classifies
all 77 capabilities so no simulation can be silently promoted.

### 3.4 Visual identity is strong and reproducible

Dark navy / gold / green, Fraunces display + Manrope body + IBM Plex Mono
identifiers, gold tracked kickers, glass cards with a gold halo, radial gauges,
dashed flow strip, five-slot mobile bar with a raised SCAN button. Twenty
routes were captured at 1440 px and 420 px; tokens and geometry are documented
in `VISUAL-REFERENCE-CATALOG.md`.

### 3.5 Arabic exists but is not Arabic-first

- 1,082 keys in each of FR/EN/AR, identical key sets.
- FR is the bundled default; AR/EN are lazy chunks.
- Document direction flips to RTL correctly.
- **No Arabic webfont** → system fallback, brand typography is lost.
- Mixed-direction identifiers and units reorder inside RTL.
- At least one untranslated fragment leaks (`hintPesees` → `weighsات`).
- Domain strings stay French regardless of locale.
- PDFs are the only place Arabic shaping is deliberate (Amiri + `rtl`).

### 3.6 Two different definitions of a stale scan

`kpis.ts` uses **1 day**; `health.ts` uses **3 days**. The daily worklist and
the health page therefore disagree about the same animal.

### 3.7 Content pages are presentation, not certification

`/vision`, `/investisseurs` and `/label` are narrative and self-assessment.
They must be reproduced as content, never presented as audited evidence or an
external certification.

---

## 4. Numbers

| Metric | Value |
|---|---:|
| Tracked files | 281 |
| Route files | 27 (24 pages, 2 layouts, 1 root) |
| Page routes reachable from nav | 20 |
| Top-level components | 16 |
| Chart components | 7 |
| UI primitives | 5 |
| Store slices | 7 |
| Persisted state keys | 14 |
| i18n keys per locale | 1,082 |
| Test files | 27 |
| Capabilities classified | 77 |
| Screenshots captured | 41 |
| Documented defects | 16 (D-101…D-116) |
| Security findings | 13 (S-01…S-13) |
| PWA findings | 12 (P-01…P-12) |
| Visual findings | 1 systemic (entrance animation) + 6 RTL |

### Capability truth distribution

| Class | Count | Meaning |
|---|---:|---|
| A — real deterministic logic | 12 | reproduce with tests |
| B — functional local feature | 21 | reproduce |
| C — simulated, labelled | 18 | reproduce **with label** |
| D — presentation only | 7 | reproduce as content |
| E — scaffold / unwired | 12 | finish or remove |
| F — broken / contradictory | 5 | fix before parity claim |
| Not claimed | 2 | keep out |

---

## 5. Architecture implications

1. **The local-first core is worth keeping**: Zustand + IndexedDB + pure domain
   modules is a clean shape for an offline farm console. The rebuild should
   keep the boundaries (pure engines, slice actions, persisted `FarmData`) and
   add schema validation at the boundary.
2. **The server scaffold is half a system.** Either implement a real outbox
   drain against the existing idempotent endpoint, or remove the server path
   and state "local only" explicitly. Do not ship the current half-state.
3. **Auth must be one coherent mode.** A single-user local mode with no auth
   claims is legitimate and smaller; a multi-user mode needs `/login`, a
   session gate, a role model and a farm switcher.
4. **The role model must be explicit and testable.** Replace the unset
   `field|production` toggle with an authority model that the UI can actually
   change (operator selection) and that tests can exercise.
5. **Domain strings belong in i18n.** Engine notes, refusals, missing inputs
   and health signals must be message keys with AR as the default locale.
6. **Swap platform coupling.** Remove Grok auth/middleware/manifest/icons,
   Vercel env reads, and Google Fonts. Ship own manifest, icons and fonts.
7. **Precache at build time.** The current SW has `PRECACHE = []`, so uncached
   routes fail offline.
8. **Add the missing test layers**: routes, RTL, Arabic PDF, service worker,
   and a visual regression suite.

---

## 6. Decisions required at Approval Gate 1

These determine the shape of Phase 2. Recommended defaults are marked.

| # | Decision | Options | Recommendation |
|---|---|---|---|
| G1-1 | **Access model** | (a) single-user local-first, no auth claims; (b) full multi-user with login, roles, farm switching; (c) local-first now, multi-user later behind a flag | **(a) for the rebuild MVP**, with the code structured so (b) can be added; document explicitly |
| G1-2 | **Role / approval model** | (a) explicit operator switch in the UI; (b) remove approval gate and serve directly; (c) signed approval with audit | **(a)** — preserves the audit story and fixes D-101 |
| G1-3 | **Sync** | (a) real outbox drain to the server endpoint; (b) local-only, no sync claims | **(b) for MVP**, (a) in Phase 6 if a backend is approved |
| G1-4 | **Arabic typography** | (a) self-host an Arabic display + text pair and keep Latin faces for identifiers; (b) use one bilingual family | **(a)** — preserves the engraved identity |
| G1-5 | **Default locale** | AR (product requirement) with FR/EN available | **AR default**, FR/EN lazily loaded |
| G1-6 | **Entrance animation** | (a) fix framer-motion visibility; (b) replace with CSS transitions; (c) remove | **(b)** — deterministic and testable |
| G1-7 | **Simulation labelling** | Keep every "simulé / démonstration" badge and add a capability-status page | **Keep + centralise** |
| G1-8 | **Content pages** | Reproduce `/vision`, `/investisseurs`, `/label` verbatim as presentation, or defer | **Reproduce structure and disclaimers; defer figure updates to the owner** |
| G1-9 | **Demo data** | Seed dataset for development only, never in production build | **Separate seed module excluded from production** |
| G1-10 | **Scope confirmation** | Full visual + functional parity vs. clean MVP with documented reductions | **Parity for A/B/C rows; explicit reductions for E/F** |

Until G1-1…G1-3 are answered, Phase 2 cannot choose the data architecture.

---

## 7. Gate 1 checklist

| Item | Required | State |
|---|---|---|
| Reference cloned read-only at approved commit | Yes | **Done** — `f99cd02`, clean tree |
| Push URL disabled | Yes | **Done** — `DISABLED_READ_ONLY` |
| Secret scan | Yes | **Done** — 281 files, no secrets |
| Route/page inventory | Yes | **Done** |
| Component inventory | Yes | **Done** |
| Data/API inventory | Yes | **Done** |
| Domain functionality audit | Yes | **Done** |
| PWA/offline audit | Yes | **Done** |
| Security audit | Yes | **Done** |
| Visual reference catalog | Yes | **Done** — 41 screenshots |
| Feature truth matrix (A–F) | Yes | **Done** — 77 capabilities |
| Master feature inventory | Yes | **Done** — this document |
| No application code written | Yes | **Confirmed** — `ovitech-rebuild` does not exist |

---

## 8. Explicit non-claims

To prevent the audit itself from becoming a marketing artifact:

- This audit did **not** verify DDNE formulas against published nutrition
  standards. They are documented as reference formulas pending expert review.
- It did **not** run a penetration test or a load test.
- It did **not** verify the reference in a production deployment.
- It did **not** confirm any market, impact or financial figure on
  `/investisseurs`.
- It did **not** certify the Startup Algeria label self-assessment.
- Screenshots reflect the demonstrator with seed data on 2026-11-03.

---

## 9. Next phase (after approval)

Phase 2 will produce, with no application code:

1. Target architecture (runtime, routing, state, storage, i18n, PDF, PWA).
2. Hosting decision (Vercel excluded) and environment model.
3. Data model and migration/versioning strategy.
4. Access and authority model.
5. Sync posture (local-only or queued) and conflict policy.
6. Arabic-first typography and RTL strategy.
7. Visual regression and test strategy.
8. Phase 3 scaffolding plan with acceptance criteria.

It stops at **Approval Gate 2**.
