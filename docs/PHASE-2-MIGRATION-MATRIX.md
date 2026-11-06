# Phase 2 — Migration Matrix

**Status:** proposed, awaiting Approval Gate 2
**Reference:** `ovitechdz/ovitech.saas-` @ `f99cd02` (281 tracked files)
**Purpose:** decide, for every meaningful unit of the reference, whether the
rebuild **REUSES**, **REFACTORS**, **REBUILDS**, **REJECTS** or **DEFERS** it.

---

## 1. How to read this matrix

| Decision | Meaning | What it permits |
|---|---|---|
| **REUSE** | Copy the file with only mechanical changes (imports, paths, names) | Logic and structure preserved verbatim |
| **REFACTOR** | Keep the behaviour and most of the logic, but change boundaries, signatures or module shape | Logic preserved, structure rewritten |
| **REBUILD** | Write new code from the documented behaviour; the reference file is a specification, not a source | Behaviour preserved, implementation new |
| **REJECT** | Do not carry the unit into the rebuild | Nothing copied; the capability is removed |
| **DEFER** | Out of the MVP, but an extension point is designed so it can be added later | Interface defined, no implementation |

**Governing rule (D-0015):** no file is copied blindly. The reference is a
behavioural specification. Reuse is allowed only where the file is already
free of platform coupling, French literals and fake claims.

**Licence note:** the reference declares no licence. Reuse is authorised by the
owner's ownership confirmation at Gate 0. Files marked REUSE must still be
reviewed for third-party code.

---

## 2. Summary

| Area | Files | REUSE | REFACTOR | REBUILD | REJECT | DEFER |
|---|---:|---:|---:|---:|---:|---:|
| Domain logic (`src/lib`) | 18 | 3 | 8 | 4 | 0 | 3 |
| Store (`src/lib/store`) | 9 | 0 | 4 | 3 | 2 | 0 |
| Storage / backup | 5 | 0 | 3 | 1 | 1 | 0 |
| i18n | 7 | 0 | 3 | 3 | 1 | 0 |
| PDF | 5 | 0 | 0 | 0 | 2 | 3 |
| PWA / platform | 6 | 0 | 1 | 3 | 2 | 0 |
| Auth / server | 18 | 0 | 0 | 0 | 15 | 3 |
| Components | 28 | 4 | 12 | 7 | 5 | 0 |
| Routes | 27 | 0 | 10 | 12 | 4 | 1 |
| Tests | 27 | 6 | 6 | 2 | 13 | 0 |
| **Total (approx., excl. styles/assets)** | **~150** | **13** | **47** | **35** | **45** | **10** |

---

## 3. Domain logic — `src/lib`

These are the parity-critical modules. They are pure or nearly pure, and they
are the reason the reference is worth rebuilding.

| File | Decision | Notes |
|---|---|---|
| `nutrition-engine.ts` | **REFACTOR** | Keep DDNE equations, thresholds, branch order and refusal contract exactly. Change: inject `Clock`; return `MessageDescriptor` instead of French strings; receive `EngineDefinition` as data; export `ENGINE_ID`/`ENGINE_VERSION`. Add exhaustive tests. |
| `health.ts` | **REFACTOR** | Keep 5 signals and 3 levels. Change: one shared `SCAN_STALE_DAYS`; structured `expectedLambingAt`; message keys. |
| `kpis.ts` | **REFACTOR** | Keep formulas. Change: staleness constant imported from health; no seeded history in production; explicit zero/empty handling. |
| `ration.ts` | **REFACTOR** | Keep per-pen aggregation and costing. Change: pure function over `FarmDocument` instead of store access; blocked-lot reasons as keys. |
| `feed-stock.ts` | **REFACTOR** | Keep deduction and coverage. Change: explicit transactional contract with the repository; property tests for non-negative stock. |
| `feed.ts` | **REFACTOR** | Keep feed-lot helpers. Change: types aligned to `FeedLot`; no store import. |
| `validation.ts` | **REUSE** | Zod schemas are already pure and correct. Extend with new-entity schemas and export shared bounds. |
| `format.ts` | **REFACTOR** | Keep formatters but make locale a parameter and use `Intl` with `ar-DZ`; isolate LTR tokens. |
| `numeric.ts` | **REUSE** | Small numeric helpers; verify no locale assumption. |
| `cn.ts` | **REUSE** | `clsx` + `tailwind-merge`; unchanged. |
| `golden-path.ts` (logic) | **REFACTOR** | Keep the 5 checks; drive from `AuditEvent` rather than `syncStatus`. |
| `engine-cases.ts` | **REFACTOR** | Keep TC-01…TC-07; make fixtures explicit; run in CI against the domain. |
| `evidence.ts` / `evidence-types.ts` | **REFACTOR** | Keep snapshot shape; add `engineVersion`, counts, disclaimer as keys, signature field reserved. |
| `constitution.ts` | **REBUILD** | Content and constants are presentation; restructure as a content module with no runtime logic. |
| `types.ts` | **REBUILD** | New `FarmDocument` per `PHASE-2-DATA-MODEL.md`; ULIDs; `operator`; no `syncStatus`. |
| `seed.ts` | **REJECT** | Replaced by `src/data/seed/` fixtures, development-only, import-guarded (ADR-008). |
| `store/*` | → see §4 | |
| `presentation.ts`, `project-references.ts`, `team.ts`, `contact.ts` | **REBUILD** | Content modules; keep the information, strip hard-coded assumptions and any claim that is not evidenced. |
| `team-photos.ts` | **REFACTOR** | Keep local upload; add size/type validation and quota handling. |
| `dossier-pdf.ts`, `indicateurs-pdf.ts`, `journal-pdf.ts`, `rapport-pdf.ts`, `pdf-engine.ts` | **DEFER** | Replaced by print-CSS (ADR-010). Optional automated PDF in Phase 7. |
| `multiplayer/*` | **REJECT** | Not part of the MVP; no P2P, no collaboration claims. |
| `preview-host-bridge.ts`, `preview-embedder-origin.ts` | **REJECT** | Host-platform coupling. |
| `health-check.server.ts` | **REJECT** | No server. |
| `db.ts`, `db-transaction.ts`, `app-data/*`, `test-db.ts` | **REJECT** | Postgres/PGlite server path; not in the SPA. |

### 3.1 Domain decisions that must not drift

| Behaviour | Constraint |
|---|---|
| Refusal contract | Missing weight, BCS or feed context ⇒ `ration: null` + non-empty `missingInputs`. Never invent. |
| Maintenance energy | `0.40 × W^0.75` MJ |
| Growth | `ADG × 23` MJ |
| Lactation | `1.1 kg × 5` MJ |
| DMI ceiling | 3.8 % of live weight (growing), 3.2 % (adult) |
| Confidence | `haute` / `moyenne` / `insuffisante` with documented thresholds |
| Engine identity | `DDNE-REF-1.0` frozen per release, stored on every recommendation |

---

## 4. Store — `src/lib/store`

| File | Decision | Notes |
|---|---|---|
| `core.ts` | **REFACTOR** | Keep Zustand; add explicit hydration status, repository port, `BroadcastChannel`; remove persist middleware in favour of the repository. |
| `seed-state.ts` | **REBUILD** | Becomes empty-document factory + development seed loader; no implicit seeded production. |
| `animals.ts` | **REFACTOR** | Keep actions; remove outbox writes; append audit events; add status lifecycle (sold/dead). |
| `engine.ts` | **REBUILD** | Approve/serve redesigned around the authority model (D-101). Idempotent serve. Explicit error results instead of silent no-ops. |
| `feed.ts` | **REFACTOR** | Keep actions; add authority checks; audit events. |
| `health.ts` | **REFACTOR** | Keep actions; cap retention with export prompt. |
| `signoffs.ts` | **REFACTOR** | Keep local sign-off; add engine version and protocol hash. |
| `sync.ts` | **REJECT** | Fake sync (D-102). Replaced by `/donnees` backup page. |
| `trim.ts` | **REJECT** | Silent deletion. Replaced by the retention policy that prompts an export. |
| `uid.ts` | **REBUILD** | ULID generator behind the `IdGenerator` port. |
| `index.ts` | **REBUILD** | New public surface; selectors only, no cross-slice reach-through. |

**Store invariants** (from `PHASE-2-ARCHITECTURE.md` §5) are enforced by tests,
not by convention.

---

## 5. Storage and backup

| File | Decision | Notes |
|---|---|---|
| `indexed-db-storage.ts` | **REFACTOR** | Keep DB name/idea; new schema version 3, single `state` store, transactional writes, explicit errors. |
| `backup.ts` | **REFACTOR** | Keep JSON + SHA-256 + validation; add `schemaVersion`, migration chain, optional AES-GCM encryption, diff preview. |
| `app-data/client.server.ts` | **REJECT** | Server client. |
| `app-data/index.ts` | **REJECT** | Server data layer. |
| `store.persist` middleware usage | **REJECT** | Replaced by explicit repository calls. |

**Compatibility promise:** v1 backups from the reference are importable through
`m001`. This is tested with a real exported fixture.

---

## 6. Internationalisation

| File / asset | Decision | Notes |
|---|---|---|
| `i18n/core.ts` | **REFACTOR** | Keep lazy-bundle idea; invert default to `ar`; fallback `ar`; typed keys. |
| `i18n/provider.tsx` | **REFACTOR** | Keep provider; set `lang`/`dir` on `<html>`; persist preference; no reload flash. |
| `i18n/hooks.ts` | **REUSE** | Thin hooks; adjust namespace typing. |
| `i18n/resolve.ts` | **REUSE** | Tree resolution helper. |
| `i18n/locales/fr.json` | **REFACTOR** | Source for FR; keys renamed to semantic namespaces; French copy reviewed. |
| `i18n/locales/en.json` | **REFACTOR** | Same. |
| `i18n/locales/ar.json` | **REBUILD** | Arabic is now the reference copy: rewrite leaks (`hintPesees`), remove mixed fragments, retone. 1,082 keys are the starting inventory, not a target. |
| `i18n` key parity script | **REFACTOR** | Keep the check; make it bidirectional and blocking. |

Translation workflow, glossary and lint rules:
`PHASE-2-ARABIC-RTL-STRATEGY.md` §6–§7.

---

## 7. PDF and print

| File | Decision | Notes |
|---|---|---|
| `pdf-engine.ts` | **REJECT** | pdfmake + font embedding; poor bidi control, large bundle. |
| `dossier-pdf.ts` | **DEFER** | Rebuilt as print-HTML in Phase 7; automated PDF optional. |
| `indicateurs-pdf.ts` | **DEFER** | Same. |
| `journal-pdf.ts` | **DEFER** | Same. |
| `rapport-pdf.ts` | **DEFER** | Same. |
| `/ration` print CSS | **REFACTOR** | Keep and extend to all reports. |
| Amiri / Fraunces / Manrope font usage | **REJECT** | L-1 rejected. Replaced by the style-site stack: Inter (Latin) + Cairo (Arabic), self-hosted WOFF2, used through CSS. |

Deviation **DEV-07** (visual PDF difference) is recorded and must be approved
at Gate 2 (question A-3).

---

## 8. PWA and platform

| File | Decision | Notes |
|---|---|---|
| `public/sw.js` | **REBUILD** | Hand-written SW with `PRECACHE = []`. Replaced by `vite-plugin-pwa` injectManifest with a generated precache list. |
| `src/lib/register-sw.ts` | **REFACTOR** | Keep registration; add update detection and activation prompt. |
| `public/manifest` under `/__grok/*` | **REJECT** | Own `manifest.webmanifest` + icons. |
| `install-button.tsx` | **REFACTOR** | Keep `beforeinstallprompt` + iOS instructions; own copy and icons. |
| `preview-host-bridge.tsx` | **REJECT** | Host coupling. |
| `__root.tsx` Google Fonts links | **REJECT** | Self-hosted subsets only. |
| `styles.css` tokens | **REJECT** (reference palette) | The rebuild adopts the style-site token layer instead: surface `#0b1220`, surface-2 `#111827`, surface-3 `#1a2332`, border `#243044`, accent `#10b981`, radius 8/12/16/24 px, 4 px spacing base. See `design-extract-style/EXTRACTION-REPORT.md` and `PHASE-2-ARCHITECTURE.md` §12. |
| Style-site token layer | **REUSE** | `--font-sans`, `--font-arabic`, colour/shape tokens extracted from the compiled CSS; ported to `src/styles/tokens.css` with self-hosted fonts. |
| `error-component.tsx` | **REFACTOR** | Keep shape; add recovery actions (export, retry, reset). |
| `og/site.json` | **REBUILD** | Own social metadata; no external tracker. |

---

## 9. Auth and server

Everything in this group is **REJECT** for the MVP, because the reference never
wires it (D-103) and the MVP is single-user local-first (D-0017).

| File | Decision |
|---|---|
| `auth/server.ts`, `auth/client.ts`, `auth/provider.tsx` | REJECT |
| `auth/gates.tsx`, `auth/use-current-user.ts` | REJECT |
| `auth/farm-auth.server.ts`, `auth/farm-membership.ts`, `auth/isolation.server.ts` | REJECT |
| `auth/middleware.ts`, `auth/preview.ts`, `auth/popup.server.ts` | REJECT |
| `auth/providers.ts`, `auth/email-password.ts`, `auth/pglite-dialect.ts` | REJECT |
| `auth/gate-identity*.ts`, `auth/verify.server.ts` | REJECT |
| `app-data/login.ts` | REJECT |
| `server/` (server functions, `animals.post.ts`, migrations) | REJECT |
| `db.ts`, `db-transaction.ts` | REJECT |
| Future sync endpoint (`/sync/batch`) | **DEFER** — contract documented in `PHASE-2-ACCESS-AND-SYNC.md` §5.3, not built |

**Preserved concept, not code:** the `farm_id` + `mutation_id` +
`sync_idempotency` pattern is documented for a future backend. No files are
copied.

**Security consequence:** no auth surface to attack; `connect-src 'self'`;
no cookies, no sessions, no OAuth redirects.

---

## 10. Components

| Component | Decision | Notes |
|---|---|---|
| `ui/button.tsx` | **REUSE** | Variants work; add `disabledReason` and logical spacing. |
| `ui/card.tsx` | **REUSE** | Simple; keep. |
| `ui/badge.tsx` | **REUSE** | Keep tones; add simulation tone. |
| `ui/input.tsx` | **REUSE** | Keep; add `dir` prop and error wiring. |
| `ui/spinner.tsx` | **REUSE** | Keep. |
| `app-shell.tsx` | **REBUILD** | Same geometry, but: no sync badge, no network toggle (or demo-only), operator menu, `/etat` link, logical properties, AR-first labels. |
| `brand-mark.tsx` | **REFACTOR** | Own asset; keep proportions. |
| `lang-toggle.tsx` | **REFACTOR** | AR-first order; no reload; accessible names. |
| `charts/stat-gauge.tsx` | **REFACTOR** | Keep SVG gauge; add reduced-motion and label. |
| `charts/donut.tsx` | **REFACTOR** | Same. |
| `charts/count-up.tsx` | **REFACTOR** | Respect reduced motion; no animation on first paint for a11y. |
| `charts/flow-arrows.tsx` | **REFACTOR** | Keep dashed flow; mirror correctly. |
| `charts/entrance.tsx` | **REJECT** | Source of the `opacity: 0` defect (K-17). Replaced by CSS with tested visibility. |
| `charts/ease.ts` | **REJECT** | Only used by framer-motion. |
| `reveal.tsx` | **REJECT** | Same class of risk as `Entrance`. |
| `project-charts.tsx` | **REBUILD** | Replace Recharts with small SVG components; keep visual language; label methodology. |
| `rec-card.tsx` | **REBUILD** | New states (approved/served/blocked), message keys, disabled-with-reason, evidence disclosure. |
| `health-status.tsx` | **REFACTOR** | Keep badges; signals as keys. |
| `golden-path.tsx` | **REFACTOR** | Drive from audit events; no sync-node claim. |
| `sync-chip.tsx` | **REJECT** | No sync. |
| `engine-cases-panel.tsx` | **REFACTOR** | Keep table; add CI-run results. |
| `proof-replay.tsx` | **REFACTOR** | Keep scripted replay; label as demo explicitly and never as live proof. |
| `ecosysteme-device.tsx` | **REFACTOR** | Keep layout; simulation badge mandatory. |
| `team-section.tsx` | **REFACTOR** | Keep; privacy note; local photo validation. |
| `time-text.tsx` | **REFACTOR** | `Intl.RelativeTimeFormat` with `ar-DZ`; no hard-coded French. |
| `install-button.tsx` | **REFACTOR** | §8. |

Component-level requirement: no component may import from `fs`, `server`,
`pg`, `better-auth`, `pdfmake`, `recharts` or `framer-motion` — enforced by
lint.

---

## 11. Routes

| Route | File | Class | Decision | Notes |
|---|---|---|---|---|
| `/` | `index.tsx` | B + D | **REBUILD** | Keep blocks and order; recompose from shared components; remove role fake-gate, replace with operator-aware actions. |
| `/scan` | `scan.tsx` | C | **REFACTOR** | Keep state machine and presets; label simulation; add enrolment validation; no outbox. |
| `/journee` | `journee.tsx` | B | **REFACTOR** | Keep queue structure; unify staleness threshold; AR-first copy. |
| `/troupeau` | `troupeau.tsx` + `troupeau.index.tsx` | B | **REFACTOR** | Keep search/filters/cards/pen mode; add status lifecycle; virtualise list if > 500. |
| `/troupeau/$id` | `troupeau.$id.tsx` | B | **REFACTOR** | Keep dossier sections; structured gestation; authority-aware actions. |
| `/sante` | `sante.tsx` | A + B | **REFACTOR** | Keep triage cards; shared signals; vet flag. |
| `/nutrition` | `nutrition.tsx` | A + B | **REBUILD** | Keep content and cards; new rec-card states; no confidence claims beyond the model. |
| `/ration` | `ration.tsx` | A + B | **REFACTOR** | Keep sheet and print; fix approve/serve; blocked-lot reasons. |
| `/fourrage` | `fourrage.tsx` | B + C | **REFACTOR** | Keep stock UI; label hybrid/hydroponics as concepts. |
| `/energie` | `energie.tsx` | C | **REFACTOR** | Keep gauges/chart; simulation disclaimer mandatory. |
| `/indicateurs` | `indicateurs.tsx` | A + C + D | **REFACTOR** | Keep KPIs and dictionary; label reference series; fix hidden blocks. |
| `/journal` | `journal.tsx` | B | **REFACTOR** | Keep counters; add filters/export; no sync CTA. |
| `/sync` | `sync.tsx` | C/E | **REJECT route, REBUILD as `/donnees`** | Backup/restore/storage/retention. |
| `/preuve` | `preuve.tsx` | B + C | **REFACTOR** | Keep checks; replay labelled demo; evidence download regenerated. |
| `/verification` | `verification.tsx` | A/B | **REFACTOR** | Keep TC cases and sign-off; local-record disclaimer. |
| `/ecosysteme` | `ecosysteme*.tsx` | C | **REFACTOR** | Keep hub and device pages; simulation badge on every page. |
| `/vision` | `vision.tsx` | D | **REBUILD** | Content parity, new layout primitives, charts rebuilt as SVG, no external claims. |
| `/investisseurs` | `investisseurs.tsx` | D | **REBUILD** | Content parity; figures marked as owner-supplied projections; PDF via print. |
| `/label` | `label.tsx` | D | **REBUILD** | Self-assessment retained; explicit "not a certification" statement; no external badge. |
| `/team` | `team.tsx` | B/D | **REBUILD** | Replaced by the style-site `/equipe` page reproduced as-is: stats strip, department filters, member cards (initials avatar, role, department, bio, e-mail, WhatsApp), add-member modal. Source archive: `team-page-source/`. D-0025. |
| `/etat` | — | new | **REBUILD** | Capability status page generated from `capabilities.ts` (S-4). |
| `/404`, `/offline` | — | new | **REBUILD** | DEV-13. |
| `__root.tsx` | root | — | **REBUILD** | SPA root, providers, error boundary, no server imports, no Google Fonts. |
| `/login` | — | E | **REJECT** | Does not exist in the reference and will not exist here. |

Route naming, URL shape and deep links are preserved so screenshots, bookmarks
and the visual baseline remain comparable. The single exception is `/sync` →
`/donnees`, which is a recorded deviation.

---

## 12. Tests

| Reference test | Decision | Notes |
|---|---|---|
| `app-data.test.ts` | REJECT | Server data layer. |
| `db-transaction.test.ts` | REJECT | Postgres. |
| `farm-membership.test.ts` | REJECT | No tenancy. |
| `gate-identity.test.ts` | REJECT | No auth. |
| `security-headers.test.ts` | **REFACTOR** | Keep intent; rewrite for the static `_headers` file. |
| `health-check.test.ts` | REJECT | Server health. |
| `backup.test.ts` | **REFACTOR** | Reuse cases; extend for v2/encryption. |
| `feed-stock.test.ts` | **REUSE** | Port directly; add property tests. |
| `health.test.ts` | **REFACTOR** | Port; unify threshold; add boundary cases. |
| `ration.test.ts` | **REFACTOR** | Port; blocked-lot cases. |
| `format.test.ts` | **REFACTOR** | Port; AR locale cases. |
| `golden-path.test.ts` | **REFACTOR** | Port; audit-event inputs. |
| `engine-cases.test.ts` | **REUSE** | Port; keep as domain fixtures. |
| `indexed-db-storage.test.ts` | **REFACTOR** | New schema; contract test for the repository port. |
| `store.test.ts` | **REFACTOR** | Split per slice; authority tests added. |
| `sync-apply.test.ts` | REJECT | No sync. |
| `scripts/**/*.test.mjs` (10 files) | **REUSE** | Port the useful ones: i18n parity, secrets, auth invariant (retarget to "no auth imports"). |

**Net new test layers:** component (~90), E2E (~16 specs), visual (~120
baselines), accessibility, precache audit, bundle budget, property-based
invariants. See `PHASE-2-QUALITY-STRATEGY.md`.

---

## 13. Configuration and tooling

| Item | Decision | Notes |
|---|---|---|
| `package.json` name `app-builder-workspace` | **REJECT** | New name `ovitech`, private. |
| Vite config + `@vitejs/plugin-react` | **REFACTOR** | SPA build, PWA plugin, aliases, budget plugin. |
| TanStack Start config / Nitro | **REJECT** | No SSR (ADR-001). |
| `@tanstack/router-plugin` | **REUSE** | File-based routes in client mode. |
| Tailwind v4 + `@tailwindcss/vite` | **REUSE** | Keep the token-first approach. |
| ESLint config | **REFACTOR** | Add boundary rules, `no-restricted-imports`, no `Date.now` in domain. |
| Prettier config | **REUSE** | Keep. |
| `scripts/with-app-env.mjs` | **REJECT** | Server env wrapper not needed. |
| `scripts/migrate.mjs` | **REJECT** | DB migrations replaced by document migrations. |
| `scripts/postbuild-precache.mjs` | **REJECT** | Replaced by `vite-plugin-pwa`. |
| `scripts/check-i18n.mjs` | **REFACTOR** | Bidirectional parity + Latin leak. |
| `scripts/check-secrets.mjs` | **REUSE** | Keep; extend patterns. |
| `scripts/check-auth-invariant.mjs` | **REFACTOR** | Becomes "no auth imports" + "no sync strings". |
| `docs/*.md` (reference audit files) | **REJECT as source** | The rebuild keeps its own `docs/`; the audit set lives in `ovitech-audit`. |
| `.env.example` / env reads | **REFACTOR** | Only `VITE_DEMO_MODE` (dev) and build metadata; no secrets. |
| Git hooks / CI | **REBUILD** | 16 blocking gates (§4 of quality strategy). |

---

## 14. Deviations implied by this matrix

| # | Deviation | Matrix source | Gate 2 question |
|---|---|---|---|
| DEV-01 | Operator profile replaces fixed `field` role | §4 `engine.ts`, §11 `/` | A-4 / S-1 |
| DEV-02 | `/sync` → `/donnees`, no sync UI | §4, §11 | S-2 |
| DEV-03 | No auth code at all | §9 | A-4 |
| DEV-04 | Domain messages as keys | §3, §6 | A-4 / L-4 |
| DEV-05 | One staleness constant | §3 | D-4 |
| DEV-06 | Injected clock | §3, §4 | A-1 |
| DEV-07 | Print-CSS PDFs | §7 | A-3 |
| DEV-08 | No Recharts | §10 | A-2 |
| DEV-09 | No framer-motion entrance | §10 | A-1 |
| DEV-10 | Self-hosted fonts (Inter + Cairo) | §8 | D-0022 |
| DEV-11 | Own manifest/icons | §8 | H-3 |
| DEV-12 | Reference KPI series labelled demo | §3 | D-5 |
| DEV-13 | `/404` + `/offline` routes | §11 | A-1 |
| DEV-14 | Retention prompts instead of silent trim | §4 | D-4 |
| DEV-15 | Empty production start (no seed) | §3, §4 | D-5 |
| DEV-16 | `/etat` capability page added | §11 | S-4 |
| DEV-17 | Vertical sidebar instead of the style-site top bar; right in RTL | §12.4 | D-0024 |
| DEV-18 | Style-site palette + Inter/Cairo replace the reference palette and Fraunces/Manrope | §12 | D-0022 |
| DEV-19 | `/team` rebuilt from the style-site `/equipe` page as-is | §11 | D-0025 |
| DEV-20 | Inter/Cairo self-hosted instead of Google Fonts | §8 | Offline |

---

## 15. Migration sequence (how the matrix is applied)

Order matters: each step must be verifiable before the next.

1. **Scaffold** — repo, strict TS, lint boundaries, CI skeleton, tokens, fonts.
2. **Port pure domain** — nutrition, health, kpis, ration, feed, validation,
   authority. Tests pass before any UI exists.
3. **Repository + migrations** — port, IndexedDB adapter, memory adapter,
   backup codec, contract tests.
4. **i18n boot** — AR default, typed keys, parity script, glossary skeleton.
5. **Shell** — layout, navigation, operator menu, `/etat` stub.
6. **Operational routes** — `/journee`, `/scan`, `/troupeau`, `/sante`.
7. **Nutrition flow** — `/nutrition`, `/ration`, approve/serve, stock.
8. **Autonomy + pilotage** — `/fourrage`, `/energie`, `/indicateurs`,
   `/journal`, `/preuve`, `/verification`.
9. **Data page** — `/donnees` backup/restore.
10. **Ecosystem + dossier** — `/ecosysteme*`, `/vision`, `/investisseurs`,
    `/label`, `/team`.
11. **PWA + offline** — precache, update flow, offline routes.
12. **Hardening** — a11y, budgets, visual baselines, deviation report.

No step may begin by copying route files wholesale; each route is composed from
the ported domain and the shared component kit.

---

## 16. What is explicitly *not* migrated

- Any server function, database client, auth provider or session code.
- The outbox, sync statuses, conflict simulation or "synchronisé" language.
- Postgres/PGlite schema and migrations.
- Grok/Vercel preview bridges, manifest paths and env reads.
- Google Fonts loading.
- pdfmake and the four PDF builders.
- Recharts, framer-motion and the `Entrance`/`Reveal` wrappers.
- `seed.ts` as a production default.
- Silent trimming of events.
- The `field`-only default role.
- Marketing claims that are not evidenced (market size, impact, label
  certification) — these become labelled, owner-supplied content.

---

## 17. Open questions for Gate 2

| # | Question | Default |
|---|---|---|
| M-1 | Accept REUSE for the 13 low-risk files (validation, numeric, cn, ui primitives, engine-case fixtures, secret scan)? | Yes |
| M-2 | Accept that no route file is copied wholesale, only its behaviour? | Yes |
| M-3 | Accept the rejection of all auth/server/db code? | Yes |
| M-4 | Accept `/sync` → `/donnees` as the only URL change? | Yes |
| M-5 | Accept the migration sequence in §15 as the Phase 3–9 order? | Yes |
| M-6 | Accept that reference PDF builders are deferred, not ported? | Yes |
