# Phase 2 — Quality, Test and Verification Strategy

**Status:** proposed, awaiting Approval Gate 2
**Reference baseline:** `f99cd02` (27 test files, no component or route tests)
**Applies to:** Phases 3–9

---

## 1. Why this document exists

The reference has 27 test files, all of them unit-level: 10 script tests and
17 `src/lib` tests. There is **no** component test, **no** route test, **no**
end-to-end test, **no** offline test, **no** visual test, and no test that ever
reaches the approve → serve path. That is why a blocker like D-101 could ship
in a project whose README claims a working MVP.

The rebuild treats verification as a first-class deliverable. A feature is
"done" only when its class (A–F) has a matching level of evidence.

---

## 2. Evidence rule

| Truth class | Minimum evidence to ship |
|---|---|
| **A** — deterministic domain | Unit tests, including refusal paths and boundary values; mutation-tested formula constants |
| **B** — functional local | Unit + component test + at least one E2E happy path |
| **C** — simulated | E2E test that asserts the simulation label is visible and the flow completes offline |
| **D** — presentation | Content snapshot test + disclaimer presence test; no behaviour claims |
| **E** — scaffold | Either not in the build, or has a test proving it works end-to-end |
| **F** — fixed defect | A **regression test that fails on the reference behaviour** |

No row may be marked complete without its evidence link in the parity report.

---

## 3. Test pyramid

```
                    ┌──────────────────────┐
                    │  Manual / exploratory │  release gate, AR-only pass
                    ├──────────────────────┤
                    │  E2E + offline (Playwright)      ~25 specs
                    ├──────────────────────┤
                    │  Visual regression (Playwright snapshots)  ~40 shots
                    ├──────────────────────┤
                    │  Component (RTL + Testing Library)   ~90 tests
                    ├──────────────────────┤
                    │  Unit: domain + application (Vitest) ~350 tests
                    └──────────────────────┘
```

### 3.1 Unit — domain and application

Framework: **Vitest** (no jsdom needed for domain tests; `node` environment).

Targets:

| Module | Must cover |
|---|---|
| `domain/nutrition` | maintenance, growth, lactation, BCS adjustment, DMI ceiling, concentrate share, CP, water, mineral; every stage branch |
| `domain/health` | 5 signal types, 3 levels, boundaries (exactly 6 % loss, BCS 2.0, exactly 3 days), vet flag |
| `domain/kpis` | identification %, data-driven %, mean weight/ADG, cost, cover days, zero/empty herd |
| `domain/ration` | per-pen aggregation, cheapest-lot costing, blocked lots, stock shortfall |
| `domain/feed` | deduction, coverage, availability, negative-stock guard |
| `domain/authority` | **every cell** of the matrix in `PHASE-2-ACCESS-AND-SYNC.md` §3.2 |
| `domain/validation` | every Zod schema: lower bound, upper bound, NaN, Infinity, empty |
| `domain/messages` | every message key exists in AR/FR/EN, params match |
| `application/engine` | run, approve, serve, idempotency, refusal |
| `application/backup` | round-trip, checksum, version rejection, size caps, encryption |
| `application/migrations` | each `m00x` fixture → expected document; idempotency |

Rules:

- Deterministic: injected `Clock`, injected id generator, no `Date.now()`.
- No snapshot tests for logic — explicit assertions only.
- Every formula constant asserted by value **and** by equation, so a change to
  either fails loudly.
- Coverage gates: `domain/**` ≥ 95 % lines, `application/**` ≥ 90 %,
  global ≥ 85 %. Coverage is a floor, not a goal.

### 3.2 Component — React Testing Library

Environment: `jsdom`, `@testing-library/react`, `@testing-library/user-event`.

Must cover:

- Every UI primitive: button variants, disabled + reason, input error state,
  dialog focus trap, toast, table empty state.
- Domain components: `RecCard` (all five states: emitted / approved / served /
  refused / blocked), `AnimalCard`, `HealthBadge`, `StatGauge`, `Queue`,
  `Fact`, `EvidenceDisclosure`.
- The **disabled-with-reason** pattern: a `field` operator sees approve
  disabled *and* a readable explanation, not a hidden control.
- Print components render the print-only tree.

Accessibility assertions run in every component test:

- exactly one `h1` per page component;
- form controls have accessible names;
- no `div` with `onClick` and no role;
- no positive `tabindex`.

### 3.3 E2E — Playwright

Runs against `vite preview` (production build), not the dev server.

Critical journeys (each one is a spec):

| ID | Journey |
|---|---|
| E-01 | Fresh install (empty) → onboarding → create farm → empty states everywhere |
| E-02 | Register animal → capture weight → run engine → recommendation appears |
| E-03 | Refusal path: animal without weight → engine refuses → journal shows refusal |
| E-04 | **Approve and serve** (the D-101 regression): field blocked with reason → switch to production → approve → switch back → serve → stock debited once |
| E-05 | Serve twice → second attempt blocked with message, stock unchanged |
| E-06 | Scan unknown RFID → enrolment form → animal created |
| E-07 | Pen transfer → audit event → animal appears under new pen |
| E-08 | Health triage: inject weight loss → alert appears → health event recorded |
| E-09 | Ration sheet: per-pen grouping, blocked lot, print preview |
| E-10 | Backup export → wipe → import → identical KPI values |
| E-11 | Import invalid checksum / newer schema → rejected, data unchanged |
| E-12 | Offline: load once, go offline, reload → full workflow still works |
| E-13 | Update flow: new SW waiting → prompt → activate → no data loss |
| E-14 | Language: AR default → switch FR → switch EN → reload persistence |
| E-15 | `/etat` capability page matches the registry, cannot be edited |
| E-16 | Reset (dev only) — absent in production build |

Selectors: `getByRole`/`getByLabel` first, `data-testid` only where no
accessible name exists. No CSS-class selectors.

### 3.4 Visual regression

Same Playwright runner, `toHaveScreenshot`, deterministic mode:

- Freeze the clock and disable animations via `?e2e=1` (a build-time-safe test
  hook that sets `prefers-reduced-motion` and a fixed clock).
- Mask only genuinely non-deterministic regions (none expected).
- Capture at **420 / 768 / 1024 / 1440** for **AR and FR** on all 20+ pages
  = ~160 baselines initially, then a curated subset (one per layout family).
- Tolerance: `maxDiffPixelRatio: 0.002` for AR/FR; any diff above 0 must be
  reviewed and the baseline committed intentionally.

**Explicit regression for the reference defect:** a test that asserts no
element in the main content has computed `opacity: 0` after a full scroll
pass. It must fail if `Entrance`-style hidden content returns.

### 3.5 Offline and PWA tests

- Build the app, serve `dist/`, load every route online, then `context.setOffline(true)`
  and reload every route → all render with data.
- Assert the service worker precache manifest includes every route chunk
  (`scripts/audit-precache.mjs` cross-checks the router tree against the
  manifest and fails on a missing route).
- Assert no request goes to any origin other than `self` during E2E (network
  log assertion). This is the "no Google Fonts / no telemetry" gate.
- Simulate quota exhaustion → blocking recovery panel, not a silent failure.

### 3.6 Arabic and RTL tests

| Test | Method |
|---|---|
| Key parity | Script: flatten all locales, assert identical key sets; fail on extras too |
| Missing key | `i18next` in `debug` mode during tests; any raw key in DOM fails |
| Latin leak | Script with an allow-list of brand/unit tokens; fails on new leaks |
| Logical properties | Stylelint + built-CSS grep for `margin-left|margin-right|padding-left|padding-right` |
| Bidi isolation | Component test: identifiers render inside `bdi[dir="ltr"]` |
| RTL screenshots | Visual suite, AR at 4 widths |
| Arabic print | Render report to PDF via headless Chromium, extract text, assert Arabic strings present and correctly ordered |
| Font offline | Block all network, assert `document.fonts.check()` for Arabic faces |

---

## 4. CI gates

Every pull request runs, in order, and **fails closed**:

| # | Gate | Command | Blocking |
|---|---|---|---|
| 1 | Format | `npm run format:check` | yes |
| 2 | Lint + boundaries | `npm run lint` | yes |
| 3 | Typecheck | `npm run typecheck` | yes |
| 4 | Unit + component | `npm run test` | yes |
| 5 | Coverage | included above | yes |
| 6 | i18n parity + Latin leak | `npm run check:i18n` | yes |
| 7 | Logical-property audit | `npm run check:rtl` | yes |
| 8 | Secret scan | `npm run check:secrets` | yes |
| 9 | Forbidden imports (`server`, `pg`, `better-auth`, `pdfmake`, `recharts`, `framer-motion`) | `npm run check:deps` | yes |
| 10 | Seed-in-production guard | `npm run check:seed` | yes |
| 11 | Build | `npm run build` | yes |
| 12 | Bundle budgets | `npm run audit:bundle` | yes |
| 13 | E2E | `npm run test:e2e` | yes |
| 14 | Visual regression | `npm run test:visual` | yes on UI paths |
| 15 | Precache completeness | `scripts/audit-precache.mjs` | yes |
| 16 | Dependency audit | `npm audit --omit=dev --audit-level=high` | yes |

Release gate adds: Lighthouse PWA + a11y ≥ 95, manual AR pass, and a signed
parity report.

---

## 5. Accessibility

Target: **WCAG 2.2 AA** for the console, verified by axe-core in component
tests and Playwright, plus manual checks.

| Area | Requirement |
|---|---|
| Contrast | ≥ 4.5:1 body, ≥ 3:1 large text and UI borders on the style-site surfaces |
| Focus | Visible 2 px gold ring, never removed, `:focus-visible` |
| Keyboard | Every action reachable; dialogs trap and restore focus; no keyboard traps |
| Landmarks | `banner`, `navigation`, `main`, `contentinfo`; skip link first in tab order |
| Headings | One `h1`, no skipped levels |
| Forms | Label + description + error linked by `aria-describedby` |
| Live regions | Toasts announced politely; blocking errors assertively |
| Motion | `prefers-reduced-motion` removes all entrance/sweep animation |
| Touch | ≥ 44 × 44 px targets on mobile |
| Language | `lang="ar"` + `dir="rtl"` on `html`, `lang` on Latin runs |
| Charts | `role="img"` + text summary; data available in a table |

The reference fails several of these (unnamed icon buttons, chart-only data,
`opacity: 0` content). Each failure is listed as a deviation and fixed.

---

## 6. Performance budgets and how they are measured

| Metric | Budget | Measurement |
|---|---|---|
| Initial JS (shell + home), gzip | ≤ 180 KB | `rollup-plugin-visualizer` + size-limit |
| Any route chunk, gzip | ≤ 120 KB | build report |
| CSS, gzip | ≤ 40 KB | build report |
| Arabic critical fonts | ≤ 120 KB | build report |
| LCP (4× CPU throttle, Fast 3G) | ≤ 2.5 s | Playwright + CDP |
| INP | ≤ 200 ms | field proxy: interaction traces in E2E |
| CLS | ≤ 0.05 | Playwright |
| Cold start to interactive (local) | ≤ 1.5 s | benchmark script |
| IndexedDB write (full document, 5k records) | ≤ 50 ms | benchmark script |

Budgets are enforced in CI; a PR that exceeds a budget must either shrink or
amend the budget with an ADR.

---

## 7. Security verification

| Check | Method | Frequency |
|---|---|---|
| No secrets in repo or build | regex + entropy scan, allow-list | every PR |
| No external origins at runtime | Playwright request log | every PR |
| CSP enforced | Playwright asserts no `securitypolicyviolation` | every PR |
| No `eval` / `new Function` | lint rule + bundle grep | every PR |
| Dependency audit | `npm audit` high+ | every PR |
| Lockfile integrity | `npm ci` only in CI | every PR |
| Import restrictions | ESLint boundary rules | every PR |
| Backup import hardening | fuzz-ish fixtures (oversized, malformed, zip-bomb-like) | every PR |
| XSS surface | no `dangerouslySetInnerHTML`; lint-banned | every PR |

No penetration test is claimed. If one is required, it is a separate
engagement recorded in `KNOWN-ISSUES.md`.

---

## 8. Data-integrity tests

These are the invariants from `PHASE-2-DATA-MODEL.md` §12, each with a named
test:

1. `unique-code-rfid` — case-insensitive duplicates rejected.
2. `orphan-records` — no weight/health/rec without an animal.
3. `future-dates` — birth and event dates bounded.
4. `refusal-contract` — `ration == null` ⇒ `missingInputs.length > 0`.
5. `emitted-completeness` — `ration != null` ⇒ all inputs finite.
6. `serve-requires-approval` — throws/no-ops without `approvedBy`.
7. `serve-idempotent` — `stocksDeducted` false → true exactly once.
8. `stock-non-negative` — property-based test over random serve sequences.
9. `audit-per-mutation` — exactly one audit event per command.
10. `backup-round-trip` — byte-stable except `exportedAt`.
11. `migration-idempotent` — applying twice equals applying once.
12. `no-silent-deletion` — retention caps prompt instead of dropping.

Property-based testing (`fast-check`) is used for #8 and for the nutrition
domain (monotonicity: more weight never lowers maintenance energy).

---

## 9. Manual verification protocol

Automation cannot judge Arabic tone, print aesthetics, or whether a claim is
honest. Each release therefore includes:

**Arabic review pass** (every release)

1. Walk all routes in AR at 420 px and 1440 px.
2. Check every number/unit/identifier for bidi correctness.
3. Read every refusal, error and empty state aloud — is it natural Arabic?
4. Confirm no French or English sentence appears outside a proper noun.
5. Confirm every simulated surface carries its label.
6. Print the ration sheet and one report; check shaping and margins.

**Honesty pass** (every release)

1. Compare `/etat` against `capabilities.ts` and the truth matrix.
2. Confirm no "synchronisé", "certifié", "IA", "prédiction" claim exists
   without evidence.
3. Confirm presentation-page disclaimers are visible, not buried.

**Parity pass** (Phase 9)

1. Open the reference captures side by side with the rebuild.
2. For every deviation DEV-01…DEV-14, confirm it is intentional and listed.
3. Sign the parity report.

---

## 10. Defect regression register

Each fixed reference defect gets a permanent regression test:

| Defect | Regression test |
|---|---|
| D-101 approve unreachable | E-04 + `authority.spec.ts` matrix |
| D-102 fake sync | build grep: no sync UI; E-12 offline proof |
| D-103 dead auth | build grep: no auth imports; route table has no `/login` |
| D-104 French domain strings | `messages.spec.ts`: no French literal in `domain/` |
| D-105 two staleness values | `staleness.spec.ts`: one constant used by both modules |
| D-106 `Date.now()` in rules | lint rule banning `Date.now` in `domain/` + `application/` |
| Entrance `opacity: 0` | visual test asserting no hidden main content |
| `PRECACHE = []` | precache audit script |
| Google Fonts | request-log assertion |
| Mixed-direction AR | bidi component tests + AR visual suite |
| Untranslated AR leak | Latin-leak lint with allow-list |

---

## 11. Test data

- **Fixtures**, not seeds: small JSON files per scenario
  (`empty`, `minimal`, `full`, `refusals`, `mixed-pens`, `stale-scans`).
- The reference 12-animal dataset is used **only** for visual parity and is
  labelled demo.
- No real farm data, no personal data, no production identifiers in tests.
- Factories (`makeAnimal(overrides)`) keep tests readable and explicit.

---

## 12. Tooling decisions

| Concern | Choice | Why |
|---|---|---|
| Unit/component | Vitest + jsdom | Same transform pipeline as Vite; fast |
| Component helpers | Testing Library | Accessible queries by default |
| E2E / visual | Playwright | Offline control, request log, PDF capture, multi-browser |
| Property tests | fast-check | Data invariants |
| Accessibility | axe-core + manual | Automated baseline only |
| Coverage | v8 provider | Native, accurate |
| Bundle | size-limit + visualizer | Budget enforcement |
| Style linting | Stylelint + `csstools/use-logical` | RTL enforcement |

Excluded: Jest (slower, extra transform config), Cypress (no real network/offline
control at the same level), any cloud visual-testing service (offline and cost).

---

## 13. Definition of Done (per feature)

A feature is done when:

1. It has a truth class and the matching evidence from §2.
2. Its tests are in the same PR, not a follow-up.
3. AR copy is authored, FR/EN added, key parity green.
4. It works offline in the E2E build.
5. It has no physical CSS direction properties.
6. It is keyboard-reachable and has an accessible name.
7. It is in `/etat` if it is a capability.
8. Its simulation label (if class C) is visible in the E2E test.
9. It respects the bundle budget.
10. Its deviations (if any) are recorded.

---

## 14. Release certification

A release is certified only when all of the following are attached to the
release manifest:

- CI run link with all 16 gates green.
- E2E report (all specs, no retries).
- Visual diff report (AR + FR).
- Coverage summary.
- Bundle budget report.
- Precache audit result.
- Arabic manual review checklist, signed.
- Parity report listing every deviation.
- Known-issues delta.

The manifest records: commit SHA, build time, engine version, schema version,
locale set, and the capability registry hash.

---

## 15. Open questions for Gate 2

| # | Question | Default |
|---|---|---|
| Q-1 | Accept the evidence rule (class → required tests) in §2? | Yes |
| Q-2 | Accept 160 initial visual baselines across 4 widths × 2 locales? | Yes |
| Q-3 | Accept the `?e2e=1` deterministic hook (fixed clock, reduced motion)? | Yes |
| Q-4 | Accept property-based testing with `fast-check`? | Yes |
| Q-5 | Accept the 16 blocking CI gates in §4? | Yes |
| Q-6 | Accept manual Arabic + honesty passes as release gates? | Yes |
