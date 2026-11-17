# Phase 2 — Target Architecture

**Status:** proposed, awaiting Approval Gate 2
**Reference:** `ovitechdz/ovitech.saas-` @ `f99cd02`
**Constraints:** Arabic-first · offline-first · no Vercel · no mandatory AI ·
single-user local-first for the MVP (D-0017) · no application code yet

---

## 1. Architectural goals

| # | Goal | Measure |
|---|---|---|
| G1 | Work with no network after first load | Every route and asset precached; full workflow offline |
| G2 | Arabic-first, not Arabic-added | AR is default, bundled, typeset, and tested |
| G3 | Deterministic domain core | Pure modules, no React, no I/O, no network, no i18n literals |
| G4 | Data durability | Versioned IndexedDB, migrations, verified backup/restore |
| G5 | Honest capability claims | Every simulated surface labelled; capability-status page |
| G6 | Small, auditable dependency surface | Budgeted bundle; no platform coupling |
| G7 | Replaceable edges | Storage, PDF, AI and (future) sync behind ports |
| G8 | Testable by construction | Domain ≥ 90 % lines; E2E on critical flows |

### Non-goals for the MVP

- Multi-user, multi-farm, tenancy, RBAC.
- Server-side rendering or SEO.
- Real-time sync, background sync, conflict resolution against a server.
- Hardware integration (RFID reader, scale, cameras, gates, inverters).
- Mobile store apps.
- AI inference as a required feature.

These are deliberately deferred, not forgotten. Each has a port or a documented
extension point so it can be added without rewriting the core.

---

## 2. Runtime decision

### ADR-001 — Client-only SPA on Vite + React 19 + TanStack Router

**Decision:** The MVP ships as a static, client-rendered SPA. No SSR, no
Nitro, no server functions, no Node runtime in production.

**Why:**

1. The product is a local-first farm console. SSR adds hydration risk, server
   state, and an attack surface with no user benefit.
2. The reference's server half is unwired (D-102, D-103); it exists only as a
   scaffold. Removing it eliminates the half-state.
3. Static output is trivially cacheable, precacheable, and host-portable.
4. Arabic-first typography and font loading are simpler without SSR.
5. Every route can be precached, which fixes `PRECACHE = []` (P-01).

**Consequences:**

- First paint depends on JS; mitigated by a small critical shell, inline
  critical CSS, and a static loading state in `index.html`.
- No server-side redirects or cookies; hosting config handles SPA fallback.
- PDFs, backups and any future AI call run on the client.
- If sync/auth are approved later, a separate service is added — the SPA does
  not become a monolith again.

**Rejected alternatives:**

| Option | Why rejected |
|---|---|
| Keep TanStack Start + SSR | Carries the unused server/auth surface, complicates offline and fonts, no product benefit |
| Next.js | Heavier, React Server Components not needed, ecosystem lock-in |
| Astro + islands | Presentation pages would benefit, but the console is one interactive app |
| Electron/Tauri | Desktop packaging is out of scope; PWA covers installability |

### ADR-002 — Router

TanStack Router in **client mode**, file-based routes, typed links, route-level
code splitting. Same route tree and URLs as the reference so links, bookmarks
and screenshots remain comparable.

---

## 3. Layered architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  app/          shell, providers, router, error boundary             │
├────────────────────────────────────────────────────────────────────┤
│  routes/       pages — composition + interaction only               │
├────────────────────────────────────────────────────────────────────┤
│  components/   ui primitives · domain components · charts            │
├────────────────────────────────────────────────────────────────────┤
│  application/  use-cases: run-engine, approve, serve, capture,       │
│                export-backup, import-backup, sign-off                │
├────────────────────────────────────────────────────────────────────┤
│  domain/       pure rules: nutrition, health, kpis, ration, feed,    │
│                validation, messages (keys + params)                  │
├────────────────────────────────────────────────────────────────────┤
│  ports/        interfaces: FarmRepository, BackupCodec, PdfRenderer, │
│                Clock, IdGenerator, AiProvider (optional)             │
├────────────────────────────────────────────────────────────────────┤
│  adapters/     IndexedDbRepository, WebCryptoBackup, PrintPdf,       │
│                SystemClock, UlidGenerator                            │
└────────────────────────────────────────────────────────────────────┘
```

### Dependency rule

`routes → application → domain` and `adapters → ports`. **The domain may import
nothing but the standard library and its own modules.** Enforced by an ESLint
`no-restricted-imports` rule per directory and a CI check.

```
domain/      → (nothing)
application/ → domain, ports
adapters/    → ports, domain
routes/      → application, domain, components
components/  → domain types, ui
ports/       → domain types
```

### Why this shape

The reference already separates pure rules (`nutrition-engine`, `health`,
`kpis`, `ration`, `feed-stock`) from the store and the UI. That boundary is the
most valuable thing in the codebase. The rebuild keeps it, formalises it, and
removes the two leaks: hard-coded French strings and `Date.now()` inside rules.

---

## 4. Directory structure

```
ovitech-rebuild/
├─ public/
│  ├─ icons/                  # 192, 512, maskable, apple-touch
│  ├─ fonts/                  # self-hosted WOFF2 (AR + Latin)
│  ├─ manifest.webmanifest
│  └─ offline.html
├─ src/
│  ├─ app/
│  │  ├─ router.tsx
│  │  ├─ providers.tsx
│  │  ├─ shell/               # sidebar, header, mobile nav
│  │  └─ error-boundary.tsx
│  ├─ routes/                 # same URLs as reference
│  ├─ components/
│  │  ├─ ui/                  # button, card, badge, input, dialog…
│  │  ├─ charts/              # gauge, count-up, donut, line, area
│  │  └─ domain/              # rec-card, health-badge, animal-card…
│  ├─ application/
│  │  ├─ engine.ts
│  │  ├─ ration.ts
│  │  ├─ capture.ts
│  │  ├─ backup.ts
│  │  └─ signoff.ts
│  ├─ domain/
│  │  ├─ nutrition.ts
│  │  ├─ health.ts
│  │  ├─ kpis.ts
│  │  ├─ ration.ts
│  │  ├─ feed.ts
│  │  ├─ validation.ts
│  │  ├─ messages.ts          # typed message keys + params
│  │  └─ types.ts
│  ├─ ports/
│  │  ├─ repository.ts
│  │  ├─ clock.ts
│  │  ├─ ids.ts
│  │  ├─ pdf.ts
│  │  └─ ai.ts                # optional, no default implementation
│  ├─ adapters/
│  │  ├─ indexeddb-repository.ts
│  │  ├─ memory-repository.ts # tests
│  │  ├─ system-clock.ts
│  │  ├─ ulid.ts
│  │  └─ print-pdf.ts
│  ├─ i18n/
│  │  ├─ index.ts
│  │  ├─ types.ts             # generated key union
│  │  └─ locales/{ar,fr,en}.json
│  ├─ lib/                    # cn, format, bidi, numeric
│  ├─ styles/
│  └─ workers/pdf.worker.ts
├─ tests/
│  ├─ unit/                   # domain + application
│  ├─ component/
│  ├─ e2e/                    # Playwright
│  └─ visual/                 # screenshot baselines
├─ scripts/                   # build checks, fonts, precache audit
├─ docs/                      # architecture and glossary; governance lives outside this repository
└─ .github/workflows/         # CI
```

---

## 5. State management

| Concern | Decision |
|---|---|
| Store | Zustand 5, one store, slices by capability |
| Persistence | Repository port → IndexedDB adapter |
| Selectors | Narrow selectors; no whole-store subscriptions in routes |
| Derived data | Pure selectors in `domain/kpis`,`domain/ration` memoised by input |
| Hydration | Explicit `status: "loading" \| "ready" \| "error"` in the store; the shell gates rendering until ready |
| Reset | `resetToSeed()` only in development; hard-disabled in production |
| Cross-tab | `BroadcastChannel` on write; other tabs re-read the repository |

### Slices

`animals`, `health`, `feed`, `engine`, `signoff`, `settings`, `session`.
No `sync` slice in the MVP (D-0017).

`session` holds the local operator profile (name, authority, optional farm
label) and is persisted like any other local preference.

### State invariants (enforced by tests)

1. A ration can only be served if `approvedBy` is set, stock covers it, and it
   is not already served.
2. Serving debits stock exactly once (idempotent by recommendation id).
3. Every mutation appends exactly one audit event.
4. Deleting an animal is a status change, never a hard delete.
5. Approval records operator id, display name and timestamp.

---

## 6. Persistence

### ADR-003 — IndexedDB behind a repository port

- Database `ovitech`, version 3, object stores: `state`, `outbox` (reserved,
  unused in MVP), `meta`, `photos`.
- One `FarmDocument` per database holding the full domain state plus
  `schemaVersion`.
- Writes are transactional; a failed write surfaces a blocking banner, not a
  toast that disappears.
- Migrations are a numbered registry (`m001_initial`, `m002_…`), each pure and
  tested with fixtures. The reference's field-by-field fallback is kept as a
  recovery strategy, not as the primary migration path.
- `localStorage` is used only for UI preferences (language, nav state).
- Quota: check `navigator.storage.estimate()` before import; warn at 80 %.

### ADR-004 — Backup format v2

```json
{
  "format": "ovitech-backup",
  "version": 2,
  "schemaVersion": 3,
  "engineVersion": "DDNE-REF-1.0",
  "exportedAt": "ISO-8601",
  "app": { "name": "OVITECH", "build": "2026.x.y" },
  "checksum": "sha256:…",
  "encryption": null,
  "state": { "…": "…" }
}
```

- `version: 2` adds `schemaVersion`, `app`, optional encryption, and a
  per-entity count manifest.
- Import validates structure, schema version, size caps, checksum, and then
  runs the migration chain to the current schema.
- Optional passphrase encryption: AES-256-GCM, key from PBKDF2-SHA-256
  (≥ 600,000 iterations, random 128-bit salt), all via WebCrypto.
- Restore remains **full replacement** with an explicit diff preview
  (animals/recs/events counts) before commit.
- Outbox is not part of the backup in the MVP; there is none.

---

## 7. Domain design

### 7.1 Nutrition

The DDNE rules are preserved exactly, with three changes:

1. **Clock injection.** Age is computed from an injected `Clock`, not
   `Date.now()`. The demo uses a fixed clock; production uses the system clock.
2. **Message keys.** Notes and refusal reasons become
   `{ key: "engine.note.lowBcs", params: { bcs } }`. The UI translates.
3. **Versioned coefficients.** `EngineDefinition` is a data object
   (`id`, `version`, coefficients, stage targets). A recommendation stores the
   engine version, and the definition is frozen per release so historical
   recommendations remain explicable.

The refusal contract is a test invariant: missing weight, BCS or feed context
must produce `ration: null` with machine-readable `missingInputs`.

### 7.2 Health

Rules preserved; two corrections:

- One staleness constant (`SCAN_STALE_DAYS`) shared by KPIs and health.
- Gestation is parsed from a **structured field** (`expectedLambingAt`) with
  the legacy free-text parser kept only for imported backups.

### 7.3 KPIs and ration

Formulas preserved. KPI history is no longer seeded as fake history in
production: it is either computed from events/weights or displayed as
"reference series (demo)" with a label. The MVP keeps a documented reference
series behind the demo flag only.

### 7.4 Validation

Zod schemas at every boundary (forms, backup import, repository read):
weight `0 < kg ≤ 1000`, BCS `1–5`, RFID/code uniqueness, notes ≤ 500 chars,
import caps. Shared by UI and tests.

---

## 8. Internationalisation

### ADR-005 — Arabic-first i18next with typed keys

- AR is bundled synchronously; FR and EN are lazy chunks.
- Default `lng: "ar"`, fallback `ar` (not `fr`).
- Flat-key namespaces: `common`, `nav`, `dashboard`, `herd`, `health`,
  `nutrition`, `feed`, `energy`, `kpis`, `audit`, `sync`, `settings`,
  `presentation`, `errors`.
- Message keys are generated into a TypeScript union; `t("…")` is type-checked.
- No string concatenation in the UI; plurals use i18next `_one/_other`.
- Domain returns message descriptors, never sentences.
- `Intl.*` with `ar-DZ` and Latin digits for technical values; dates use the
  Gregorian calendar with Arabic month names.
- Locale metadata lives in one file: `{ code, dir, label, numberSystem }`.

Full typography, bidi and QA detail: `PHASE-2-ARABIC-RTL-STRATEGY.md` in the audit workspace.

---

## 9. PDF and printing

### ADR-006 — HTML print pipeline first, engine later

The reference generates PDFs with pdfmake + Amiri. That gives poor bidi control
and a large bundle. The rebuild uses:

1. **Primary:** print-optimised HTML/CSS for every report, triggered by
   `window.print()` (user chooses "Save as PDF"). Native shaping, correct RTL,
   no extra dependency, works offline.
2. **Secondary (Phase 7):** an automated PDF generator for archival and
   testing. Candidate: headless Chromium via Playwright in CI, or a WASM
   renderer with HarfBuzz shaping. Decision deferred with an ADR.

This is a **visual deviation** from the reference (PDF look differs). It is
recorded in the deviations register and must be approved at Gate 2.

---

## 10. PWA and offline

| Concern | Decision |
|---|---|
| Build integration | `vite-plugin-pwa` in `injectManifest` mode |
| Precache | App shell, every route chunk, fonts, icons, offline page |
| Navigation | Network-first with cache fallback to the precached shell |
| Assets | Cache-first, immutable, content-hashed |
| API | None in MVP; any future `/api/*` is network-only |
| Update | Detect waiting SW, show "update available", activate on confirm |
| Connectivity | `navigator.onLine` + periodic heartbeat; manual override only in demo mode |
| Install | Own manifest/icons, `beforeinstallprompt`, iOS instructions |
| Storage pressure | `navigator.storage.estimate()`, warn and prompt export |

The offline test matrix from `PWA-OFFLINE-AUDIT.md` §7 becomes the Phase 6
acceptance suite.

---

## 11. Security model (local-first)

| Area | Decision |
|---|---|
| Auth | None in the MVP; no auth screens, no dead gates |
| Local lock | Optional 6-digit PIN gate in Phase 7 (UX lock, not encryption) |
| Data at rest | Plaintext IndexedDB by default; documented; encrypted export available |
| Transport | Static hosting over HTTPS; HSTS at the host |
| CSP | `script-src 'self'`; `style-src 'self' 'unsafe-inline'` (documented); `img-src 'self' data:`; `font-src 'self'`; `connect-src 'self'`; `frame-ancestors 'none'` |
| Headers | HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP |
| Supply chain | Lockfile, `npm audit` in CI, dependency allow-list review, no postinstall scripts |
| Secrets | None in the client; `.env.example` only; build fails on secret patterns |
| AI | No network call unless the user configures a provider; explicit consent per request |

`style-src 'unsafe-inline'` is required by Radix inline styles and Tailwind
runtime values. This is a documented, reviewed exception, not an oversight.

---

## 12. Visual system and design tokens (from the style site)

**Source of truth:** `https://ovitech-mvp-4ip1.arcada.app`, compiled CSS
`assets/index-DGhN7NLy.css` plus computed styles in the running app. The
functional reference still defines **what** each page does and the **shell
geometry**; the style site defines **how it looks** (colour, radius, spacing,
type). The reference's navy/gold/ink palette and Fraunces/Manrope type are
**not** adopted. Full evidence: `design-extract-style/EXTRACTION-REPORT.md`.

### 12.1 Colour tokens

| Token | Value | Usage |
|---|---|---|
| `--color-surface` | `#0b1220` | page background |
| `--color-surface-2` | `#111827` | cards, inputs, header base |
| `--color-surface-3` | `#1a2332` | raised control / hover surface |
| `--color-border` | `#243044` | 1 px borders, dividers, table rules |
| `--color-accent` | `#10b981` | primary buttons, active nav, focus rings |
| `--color-emerald-400` | `oklch(76.5% .177 163.2)` | success text on dark |
| `--color-amber-400` | `oklch(82.8% .189 84.4)` | warning, "surveillance" |
| `--color-red-400` | `oklch(70.4% .191 22.2)` | danger, "critique" |
| `--color-cyan-400` | `oklch(78.9% .154 211.5)` | info / cameras |
| `--color-gray-200/400/500` | Tailwind v4 values | primary / muted / subtle text |
| Foreground | `#e5e7eb` body, `#ffffff` headings | text |

Dark-only. There is no light theme in the style site; the rebuild states
dark-only explicitly instead of shipping an untested light mapping.

### 12.2 Shape, spacing, elevation

| Token | Value | Notes |
|---|---|---|
| `--radius-lg` | `8px` | small controls, chips |
| `--radius-xl` | `12px` | buttons, inputs |
| `--radius-2xl` | `16px` | cards, panels, modals |
| `--radius-3xl` | `24px` | hero media, oversized panels |
| `--spacing` | `4px` | Tailwind v4 base (designlang's 2 px reading was wrong) |
| Card padding | `20px` (`p-5`) | measured |
| Control height | `42px` | inputs and primary buttons measured |
| Container | `72rem` (`--container-6xl`) | max content width |
| Shadow | emerald-tinted `shadow-lg` on primary CTA only | no card shadows |
| Blur | `8/12/24 px` | sticky header backdrop blur |

### 12.3 Typography

Inter (Latin) + Cairo (Arabic), self-hosted. Full stack, weights, scale and
RTL rules: `PHASE-2-ARABIC-RTL-STRATEGY.md` §3 in the audit workspace.

### 12.4 Shell and navigation

- The style site uses a horizontal top navigation; the rebuild uses the
  reference's **module list as a vertical sidebar** as instructed.
- Desktop ≥ 1024 px: fixed sidebar, 256 px, inline-start edge (right in RTL).
- Mobile: sidebar becomes a Drawer opened from the header menu button; the
  Drawer enters from the inline-start edge and traps focus.
- Header: sticky, 64 px content height (69 px measured with border), backdrop
  blur over `surface-2/85`.
- The **logo is not taken from the style site**; it stays the reference logo,
  and it is never mirrored.

### 12.5 Team page

The `/equipe` page of the style site is reproduced **as-is**: statistics strip,
department filter chips, member cards (initials avatar, role, department badge,
bio, e-mail, WhatsApp action), and the "Add member" modal. Source archive and
field map: `team-page-source/README.md`. The reference's `/team` page is
superseded by this design.

---

## 13. Performance budgets

| Metric | Budget |
|---|---|
| Initial JS (shell + home) | ≤ 180 KB gzip |
| Any route chunk | ≤ 120 KB gzip |
| Fonts (Inter + Cairo, critical weights, WOFF2) | ≤ 120 KB total |
| LCP (mid-tier Android, 4G) | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.05 |
| Lighthouse PWA | installable, offline-capable |
| Lighthouse a11y | ≥ 95 |

Recharts (~100 KB gz) is **not** in the MVP dependency set. The reference
already has hand-built SVG gauges, donuts and counters; line and area charts
are implemented as small SVG components with the same visual language. If a
chart library is later required, it is lazy-loaded per route.

---

## 14. Observability and error handling

- A single React error boundary per route group with a retry action.
- A local error log ring buffer (max 200) exposed in the journal page —
  no telemetry, no external reporting.
- Persistence failures block the UI with a recovery panel (export, retry,
  reset).
- No analytics, no third-party scripts. If product analytics are ever wanted,
  they must be self-hosted and consented.

---

## 15. AI boundary

- `AiProvider` is a port with **no default implementation**.
- The deterministic rules assistant (engine explanations, health summaries,
  "what changed" narratives) is generated from domain data and message keys.
- If a provider is configured, requests are explicit, user-initiated,
  cancellable, and never include identifiers without consent.
- The app must pass a "no network" test with no provider configured.

---

## 16. Dependency policy

**Runtime (proposed):** react, react-dom, @tanstack/react-router,
zustand, zod, i18next, react-i18next, lucide-react, clsx, tailwind-merge,
sonner, radix primitives actually used.

**Build:** vite, @vitejs/plugin-react, typescript, tailwindcss,
@tailwindcss/vite, vite-plugin-pwa, eslint, prettier, vitest,
@testing-library/react, playwright.

**Excluded:** TanStack Start, Nitro, better-auth, pg, PGlite, pdfmake,
recharts, framer-motion, @tanstack/react-query, @tanstack/react-table,
react-hook-form, all unused Radix packages.

Every addition requires a written justification in the PR and a bundle-impact
check.

---

## 17. Deviations from the reference (recorded)

| # | Reference behaviour | Rebuild behaviour | Reason |
|---|---|---|---|
| DEV-01 | Role fixed to `field`, approve unreachable | Operator profile with explicit switch | D-101 |
| DEV-02 | `syncAll()` flips statuses | No sync UI; backup is the transport | D-102 |
| DEV-03 | Auth scaffold, no `/login` | No auth in MVP | D-103 |
| DEV-04 | French engine strings | Message keys, AR default | D-104 |
| DEV-05 | 1-day vs 3-day stale scan | One constant | D-105 |
| DEV-06 | `Date.now()` vs seed clock | Injected clock | D-106 |
| DEV-07 | pdfmake + embedded Amiri | Print CSS pipeline with Inter/Cairo | Arabic shaping; font stack from style site |
| DEV-08 | Recharts | Small SVG charts | Bundle budget |
| DEV-09 | framer-motion entrance | CSS transitions | Opacity-0 defect |
| DEV-10 | Google Fonts | Self-hosted subsets | Offline |
| DEV-11 | `/__grok/*` manifest/icons | Own manifest/icons | Platform independence |
| DEV-12 | Seeded KPI history shown as real | Labelled reference series | Claim discipline |
| DEV-13 | No `/login`, no 404 route | `/404` and `/offline` routes | UX completeness |
| DEV-14 | Health events untrimmed | Capped and archived | Storage safety |
| DEV-15 | Seed data present | Empty production start (seed only in development) | D-0019 |
| DEV-16 | No capability status page | `/etat` capability page added | S-4 |
| DEV-17 | Horizontal top navigation (style site) | Vertical sidebar, fixed on desktop, Drawer on mobile, right in RTL | User directive, D-0024 |
| DEV-18 | Navy/gold palette, Fraunces + Manrope (reference) | Style-site palette and Inter + Cairo | L-1 rejected, D-0022 |
| DEV-19 | Reference `/team` page | Style-site `/equipe` page reproduced as-is | User directive, D-0025 |
| DEV-20 | Google Fonts at runtime (style site) | Self-hosted Inter + Cairo WOFF2 | Offline-first |

---

## 18. Phase 3 readiness criteria

Phase 3 may start when:

1. Gate 2 is approved.
2. The repo is created empty, with no application code copied from the
   reference.
3. TypeScript strict, ESLint boundaries, Prettier and CI are configured.
4. The token layer and font subsets are in place.
5. i18n boots with AR as default and a verified key parity check.
6. The repository port has a memory adapter and a passing contract test.
7. The shell renders in AR/RTL at 420/768/1024/1440 with no layout break.
8. A build produces a static bundle with no server runtime.

---

## 19. Open questions for Gate 2

**Gate 2 resolution (2026-11-05):** all defaults approved except **L-1**.
D-0022 records the rejection of Amiri / IBM Plex Sans Arabic / Fraunces /
Manrope and adopts the style-site stack (Inter + Cairo). Questions A-1…A-6
below are therefore answered "Yes" and closed; they are kept for traceability.

| # | Question | Default | Status |
|---|---|---|---|
| A-1 | Accept the client-only SPA decision? | Yes | approved |
| A-2 | Accept dropping Recharts for SVG charts? | Yes | approved |
| A-3 | Accept the print-CSS PDF pipeline as a visual deviation? | Yes | approved |
| A-4 | Accept no auth and no sync in the MVP? | Yes (D-0017) | approved |
| A-5 | Accept the dependency exclusions in §15? | Yes |
| A-6 | Accept the performance budgets in §12? | Yes |
