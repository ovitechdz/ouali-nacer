# Phase 2 â€” Rebuild Roadmap (Phases 3â€“9)

**Status:** proposed, awaiting Approval Gate 2
**Supersedes:** `REBUILD-EXECUTION-PLAN.md` Â§1 phase descriptions for Phases 3â€“9
(the gate structure and the "no stage may be skipped" rule are unchanged)
**Estimate basis:** one senior full-stack developer, part-time review, no
parallel team. Ranges are effort, not calendar promises.

---

## 1. Why the phase content changed

The Phase 0 plan assumed the reference's data and sync layer could be carried
over. Phase 1 proved otherwise:

- the server/sync/auth half is unwired (D-102, D-103) and is rejected;
- the real value is the deterministic domain, which must exist and be tested
  **before** the UI can render honest numbers;
- Arabic-first typography and RTL are foundational, not a late translation
  step;
- offline correctness depends on the precache and the repository, not on a sync
  queue.

So the order becomes: **foundation â†’ domain/data â†’ UI â†’ business completion â†’
offline/hardening â†’ release â†’ certification.** The original Phase 6 ("data &
sync") is dissolved: data moves earlier, sync is removed.

---

## 2. Phase map

| Phase | Name | Gate | Effort (dev-days) |
|---|---|---|---|
| 3 | Clean foundation | Verification report | 6â€“9 |
| 4 | Domain core and data layer | Domain acceptance | 10â€“14 |
| 5 | Shell, design system and UI reconstruction | Visual parity report | 18â€“26 |
| 6 | Business modules and offline | Offline suite + module acceptance | 14â€“20 |
| 7 | Security, performance and QA | QA certification | 8â€“12 |
| 8 | Hosting and release | Release approval | 4â€“6 |
| 9 | Parity certification and handover | Final sign-off | 5â€“8 |
| **Total** | | | **65â€“95** |

These ranges exclude: hardware integration, a real backend, expert nutrition
review, content authoring for `/vision` `/investisseurs` `/label`, and
translation of those pages by a human writer. Each is listed as an external
dependency in Â§10.

---

## 3. Phase 3 â€” Clean foundation

**Goal:** an empty but real project that builds, lints, type-checks and tests
in CI, with the design tokens, fonts and i18n bootstrap in place. No product
behaviour yet.

### Work

1. Create `C:\Users\ASUS\ovitech-rebuild`, `git init`, remote
   `ovitechdz/ouali-nacer` (no push without explicit authorisation).
2. Vite + React 19 + TypeScript strict + TanStack Router (client mode).
3. ESLint boundary rules, Prettier, EditorConfig, `.nvmrc`, `engines`.
4. Tailwind v4 token layer from the style site
   (`design-extract-style/EXTRACTION-REPORT.md`): surface `#0b1220`, accent
   `#10b981`, border `#243044`, radii 8/12/16/24 px, 4 px spacing base, plus
   `--color-warn`, Arabic stack and logical-property helpers.
5. Self-hosted font subsets (**Inter + Cairo**) with OFL licence files and a
   "no Google Fonts" build check (D-0022/D-0023).
6. i18n boot: AR default, typed keys, FR/EN lazy, parity script.
7. Ports: `Clock`, `IdGenerator`, `FarmRepository`, `BackupCodec`, `PdfRenderer`,
   `AiProvider` â€” interfaces only, plus a memory adapter.
8. CI skeleton with gates 1â€“11 from `PHASE-2-QUALITY-STRATEGY.md` Â§4.
9. `docs/` seeded with the audit set, decisions and glossary.
10. `README.md` with an honest scope statement and the capability classes.

### Acceptance criteria

- [ ] `npm ci && npm run build` produces a static `dist/` with no server runtime.
- [ ] `npm run typecheck`, `lint`, `test` pass on an empty app.
- [ ] Bundle budget script runs and reports a baseline.
- [ ] The app renders an AR/RTL placeholder shell at 420 / 768 / 1024 / 1440.
- [ ] No network origin other than `self` in the built app.
- [ ] No Google Fonts, no Vercel, no Grok, no auth dependency in the tree.
- [ ] `git log` starts from a single initial commit; nothing copied wholesale
      from the reference.

---

## 4. Phase 4 â€” Domain core and data layer

**Goal:** the deterministic product exists and is proven before any screen
depends on it.

### Work

1. Port (REFACTOR) `nutrition`, `health`, `kpis`, `ration`, `feed`,
   `validation`, `authority`, `messages`.
2. Test them to the coverage floors (domain â‰¥ 95 %).
3. Implement `FarmDocument`, ULIDs, migrations `m001â€¦m005`, validation.
4. IndexedDB adapter + memory adapter; repository contract test suite.
5. Backup codec v2: checksum, schema gate, diff preview, optional encryption.
6. Retention policy with export prompts (no silent deletion).
7. Empty-document onboarding model (no seed in production).
8. Development seed fixtures behind the demo flag.
9. A tiny CLI/test harness that runs the full domain flow headlessly
   (register â†’ weigh â†’ run engine â†’ approve â†’ serve â†’ debit) so the flow is
   proven without UI.

### Acceptance criteria

- [ ] Every A-row in `FEATURE-TRUTH-MATRIX.md` has a passing unit test.
- [ ] The refusal contract is tested for all three missing inputs.
- [ ] The approve/serve authority matrix is tested cell by cell.
- [ ] Serve is idempotent; stock never negative (property test).
- [ ] v1 reference backup imports and migrates; v2 round-trips byte-stable.
- [ ] A newer schema is rejected without partial writes.
- [ ] Migrations are idempotent and fixture-tested.
- [ ] Domain modules import nothing outside `domain/` (lint-enforced).
- [ ] No `Date.now()`, no French literal, no `fetch` in `domain/` or
      `application/`.

---

## 5. Phase 5 â€” Shell, design system and UI reconstruction

**Goal:** visual parity at the page level, Arabic-first, with the real domain
wired in.

### Work

1. App shell: 256/64 px sidebar, 64 px header, five-slot mobile bar with raised
   SCAN, drawer, skip link, operator menu, `/etat` link.
2. Component kit: button, card, badge, input, dialog, table, toast, empty
   state, evidence disclosure, stat, queue, fact, animal card, rec card.
3. Charts as small SVG components (gauge, donut, counter, line, area, flow).
4. CSS entrance transitions replacing `Entrance`/`Reveal`, with a visibility
   test (DEV-09).
5. Routes, in the order from `PHASE-2-MIGRATION-MATRIX.md` Â§15:
   `/`, `/journee`, `/scan`, `/troupeau`, `/troupeau/$id`, `/sante`,
   `/nutrition`, `/ration`.
6. Bidi isolation for every code, unit and formula.
7. Empty, loading, error and blocked states for every page.
8. Visual baselines at 420/768/1024/1440 in AR and FR for completed routes.

### Acceptance criteria

- [ ] Page geometry matches the captured reference within the agreed visual
      tolerance for the routes in scope.
- [ ] No physical `left/right` spacing in application CSS.
- [ ] No element in main content computes to `opacity: 0` after a scroll pass.
- [ ] Every identifier and measurement is inside `bdi[dir="ltr"]` in AR.
- [ ] Keyboard-only navigation reaches every action.
- [ ] axe-core: zero serious or critical violations on completed routes.
- [ ] The full operational flow works through the UI, including approveâ†’serve.
- [ ] AR visual suite green; FR smoke green.

---

## 6. Phase 6 â€” Business modules and offline

**Goal:** finish the remaining capabilities and make the product genuinely
offline-capable.

### Work

1. `/fourrage`, `/energie`, `/indicateurs`, `/journal`, `/preuve`,
   `/verification`, `/donnees`.
2. `/ecosysteme` + four device pages with mandatory simulation labels.
3. `/vision`, `/investisseurs`, `/label`, `/team` content parity, charts
   rebuilt, disclaimers preserved.
4. `/etat` capability registry page.
5. PWA: `vite-plugin-pwa` injectManifest, full precache, update prompt,
   offline route, install button, own manifest/icons.
6. Offline test matrix from `PWA-OFFLINE-AUDIT.md` Â§7.
7. Print CSS for the ration sheet and reports (DEV-07).
8. Cross-tab consistency via `BroadcastChannel`.
9. Quota handling and blocking recovery panel.

### Acceptance criteria

- [ ] Load once, go offline, reload: every route renders with data.
- [ ] Precache audit covers every route chunk; a missing route fails CI.
- [ ] Update flow: waiting SW â†’ prompt â†’ activate â†’ no data loss.
- [ ] Install prompt works on Chromium; iOS instructions shown on Safari.
- [ ] Every class-C capability displays its simulation label in an E2E test.
- [ ] `/etat` matches `capabilities.ts` and cannot be edited by data.
- [ ] Print output for the ration sheet and one report is correct in AR and FR.
- [ ] No network request leaves the origin in any E2E run.
- [ ] Storage-quota simulation surfaces the recovery panel, not a silent fail.

---

## 7. Phase 7 â€” Security, performance and QA

**Goal:** measurable quality, with no new features added.

### Work

1. Security pass: CSP validation, header verification, dependency audit,
   secret scan, import hardening fixtures, `dangerouslySetInnerHTML` ban.
2. Accessibility pass: full keyboard walk, screen-reader spot check (NVDA or
   VoiceOver), contrast audit on the navy palette, reduced-motion audit.
3. Performance: budgets, LCP/INP/CLS, IndexedDB write benchmark, lazy routes,
   font subsetting review.
4. Test completion: E-01â€¦E-16 green, visual baselines curated, property tests
   extended.
5. Error handling: route error boundaries, persistence failure panel, local
   error log ring buffer.
6. Arabic QA: full manual pass, Latin-leak allow-list review, glossary update.
7. Honesty QA: claim audit across all pages, `/etat` verified, disclaimers
   visible.
8. Optional: 6-digit local PIN (S-5) â€” only if approved.

### Acceptance criteria

- [ ] All 14 CI gates blocking and green.
- [ ] Lighthouse: PWA installable + offline; a11y â‰¥ 95; performance â‰¥ 90 on
      the agreed device profile.
- [ ] Budgets met or amended by ADR.
- [ ] No high/critical dependency advisories.
- [ ] No secret, no external origin, no `eval`.
- [ ] Arabic manual checklist signed.
- [ ] Honesty checklist signed; no unearned claim remains.
- [ ] Defect regression register complete (11 tests).

---

## 8. Phase 8 â€” Hosting and release

**Goal:** a real, reversible deployment of static assets only.

### Work

1. Cloudflare Pages project (primary), `_headers`, `_redirects`, domain, TLS.
2. Hetzner + Caddy fallback documented and rehearsed once.
3. Build pipeline: reproducible build, release manifest, artifact archive.
4. Uptime monitoring on `/` and `/manifest.webmanifest`.
5. Rollback rehearsal: promote previous deployment, verify data survives
   (it is local, so only code changes).
6. Release notes template with deviation list and known issues.
7. Publish v0.1.0 tag in `ouali-nacer` **after explicit authorisation**.

### Acceptance criteria

- [ ] Production URL serves the app over HTTPS with correct headers.
- [ ] Deep link `/troupeau/an-2401` resolves after a hard refresh.
- [ ] Service worker installs, precaches and updates correctly in production.
- [ ] Rollback to the previous deployment verified.
- [ ] No analytics, no third-party script, no cookie.
- [ ] Release manifest includes commit, engine version, schema version, locales.
- [ ] Monitoring alerts tested once.

---

## 9. Phase 9 â€” Parity certification and handover

**Goal:** prove parity honestly and hand over.

### Work

1. Side-by-side parity review against the 41 captures and the truth matrix.
2. Deviation register DEV-01â€¦DEV-16 confirmed and signed.
3. Capability report: every one of the 77 rows mapped to
   implemented / changed / removed / deferred, with evidence.
4. Technical debt register and known-issues delta.
5. Handover pack: architecture, data model, operations runbook, backup/restore
   instructions, font licences, dependency inventory.
6. Certification statement: what is verified, what is not, and what would be
   required to claim more.

### Acceptance criteria

- [ ] Every A/B/C row has a matching implementation and test evidence.
- [ ] Every E row is either implemented or absent from the build.
- [ ] Every F row has a regression test.
- [ ] Every deviation is listed with a reason and a screenshot where visual.
- [ ] No claim in the app exceeds the evidence in the report.
- [ ] Handover pack reviewed by the owner.
- [ ] Final sign-off recorded in `DECISION-LOG.md`.

---

## 10. External dependencies and out-of-scope items

| Item | Needed by | Owner | Impact if unavailable |
|---|---|---|---|
| Nutrition expert review of DDNE formulas | Phase 9 claim | Owner | Cannot claim scientific validity; keep "reference formulas" wording |
| Human Arabic review of content pages | Phase 6/9 | Owner | Content pages ship with reviewed AR only if provided; otherwise marked "draft" |
| Figures for `/investisseurs` and `/label` | Phase 6 | Owner | Placeholders labelled "owner-supplied projection" |
| Domain name + DNS | Phase 8 | Owner | Release blocked |
| Hardware (RFID reader, scale) | post-MVP | Owner | Simulation labels remain |
| Real backend (if ever) | post-MVP | Owner | No sync; `/donnees` remains the transport |

Not in scope for any phase: mobile store apps, multi-tenant SaaS, hardware
control, AI inference, payments, telemetry.

---

## 11. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Visual parity slips because reference captures hide content (`opacity: 0`) | High | Medium | Re-capture reference sections in Phase 5 where needed; treat intended design, not the bug, as target |
| R-02 | Arabic shaping/typography takes longer than planned | Medium | High | Font spike in Phase 3; fallback to Noto Naskh Arabic; print test early |
| R-03 | Domain port introduces a silent behaviour change | Medium | High | Characterisation tests written against the reference before refactor; formula values asserted |
| R-04 | Print-CSS PDFs rejected as a visual deviation | Medium | Medium | Prove with a sample in Phase 6; keep a Phase 7 automated-PDF option |
| R-05 | Scope creep toward auth/sync | Medium | Medium | D-0017 is explicit; any change requires a new decision |
| R-06 | Content pages have no verified figures | High | Low | Label as projections; never present as audited |
| R-07 | Bundle budget missed after adding features | Medium | Low | Lazy routes, SVG charts, no chart lib; budget check in CI |
| R-08 | IndexedDB data loss on browser clear | Medium | High | Export reminders, `storage.persist()`, encrypted backups |
| R-09 | CI flakiness in visual tests | Medium | Low | Deterministic clock, reduced motion, tolerance tuning, retries only for infra |
| R-10 | Owner unavailable for gate approvals | Low | High | Each gate lists a default; work stops, no silent continuation |

---

## 12. Gate structure

Every phase ends with a written verification report and an explicit approval
request. No phase begins on a verbal "continue".

| Gate | Evidence required | Default if unanswered |
|---|---|---|
| Phase 3 | Build + 14 CI gates green, shell screenshot | Stop |
| Phase 4 | Domain coverage report, flow harness output, migration fixtures | Stop |
| Phase 5 | Visual diff report AR/FR at 4 widths, a11y report | Stop |
| Phase 6 | Offline suite, simulation-label proofs, print samples | Stop |
| Phase 7 | QA certification bundle | Stop |
| Phase 8 | Release manifest, rollback proof | Stop |
| Phase 9 | Parity report + deviation register + handover pack | Stop |

---

## 13. Definition of "done" for the whole project

The project is done when, and only when:

1. Every A/B/C capability is implemented and tested.
2. Every simulated surface is labelled in the UI and listed in `/etat`.
3. Every deviation is documented and approved.
4. Arabic is the default, typeset, and tested.
5. The app works offline after first load.
6. No auth, sync or AI claim exists without implementation.
7. The release is deployed, monitored and reversible.
8. The owner has signed the parity and honesty reports.

Anything less is a milestone, not completion.
