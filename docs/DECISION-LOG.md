# Decision Log

Entries are append-only. Each decision records evidence and consequence.

## D-0001 — Canonical source repository

**Date:** 2026-11-02
**Decision:** Use `https://github.com/ovitechdz/ovitech.saas-` at `main@f99cd02227cd9d6b5325cda21f94b89108b62d26` as the only reference.
**Evidence:** `git ls-remote --symref` returned `refs/heads/main` and `f99cd02…`; GitHub API confirms owner `ovitechdz`, public repository, default branch `main`.
**Consequence:** All Phase 1 inventories must cite this commit.

## D-0002 — Reject the stale local clone as source

**Date:** 2026-11-02
**Decision:** Do not use `C:\Users\ASUS\OVITECH_Sauvegardes\ovitech.saas-` for migration.
**Evidence:** Its remote is `nacerouali464-sketch/ovitech.saas-`, HEAD `ded6ab6` (2026-09-12), and it contains `.grok/` and `.vercel/`; the official HEAD does not.
**Consequence:** It may be inspected only as historical evidence.

## D-0003 — No Vercel

**Date:** 2026-11-02
**Decision:** The target will have no Vercel configuration, deploy script, runtime dependency, or preview deployment.
**Evidence:** User constraint; reference homepage uses Vercel and root contains Vercel audit files.
**Consequence:** Hosting comparison is deferred to Phase 2, with VPS/container candidates.

## D-0004 — No mandatory AI provider

**Date:** 2026-11-02
**Decision:** The application must start, log in, manage the herd, run DDNE, record health/reproduction, and sync without any AI API key.
**Evidence:** User constraint; reference README mentions Grok plugin and optional AI surfaces.
**Consequence:** Any future AI must sit behind an optional, replaceable provider interface.

## D-0005 — Phase 0 documents live in the audit workspace

**Date:** 2026-11-02
**Decision:** Write Phase 0 documents to `C:\Users\ASUS\ovitech-audit\docs\rebuild`.
**Evidence:** The user prohibited creating the new project before Approval Gate 0.
**Consequence:** These documents are governance artifacts, not application source.

## D-0006 — Do not reuse the pre-existing prototype automatically

**Date:** 2026-11-02
**Decision:** `C:\Users\ASUS\ovitech-clean` is quarantined from the governed rebuild until the user decides its fate.
**Evidence:** It has no Git history, was created before this governance process, and cannot be certified against the reference.
**Consequence:** It must not be extended or presented as the approved target.

## D-0007 — Reference is read-only

**Date:** 2026-11-02
**Decision:** All reference access is read-only; pushes are disabled locally.
**Evidence:** User constraint C1.
**Consequence:** Any needed refresh uses `git fetch` only; destructive Git commands require explicit approval.

## D-0008 — No license assumption

**Date:** 2026-11-02
**Decision:** Do not copy or adapt reference code until ownership/permission is confirmed.
**Evidence:** GitHub API reports `license: null`.
**Consequence:** Approval Gate 0 includes a legal/ownership question.

## D-0009 — Approval Gate 0 granted

**Date:** 2026-11-03
**Decision:** The user approved Phase 0 and authorized Phase 1 reverse engineering.
**Evidence:** User message confirming ownership and answers to all eight Gate 0 questions.
**Consequence:** Phase 1 may begin; no application code and no target project yet.

## D-0010 — Target repository and path

**Date:** 2026-11-03
**Decision:** New independent repository is `https://github.com/ovitechdz/ouali-nacer.git`; local target is `C:\Users\ASUS\ovitech-rebuild`.
**Evidence:** User instruction.
**Consequence:** The target is not the reference repo and not `ovitech-clean`. No push until explicitly authorized.

## D-0011 — Full parity scope

**Date:** 2026-11-03
**Decision:** The rebuild targets full functional and visual parity, Arabic-first with structural FR/EN.
**Evidence:** User answer at Gate 0.
**Consequence:** Phase 1 must inventory every page and feature, not just core MVP paths.

## D-0012 — `ovitech-clean` stays untouched

**Date:** 2026-11-03
**Decision:** Keep `C:\Users\ASUS\ovitech-clean` as-is during Phase 1.
**Evidence:** User answer at Gate 0.
**Consequence:** It remains non-authoritative and excluded from certification.

## D-0013 — Hosting and AI decisions confirmed

**Date:** 2026-11-03
**Decision:** Hosting decision deferred to Phase 2 (Vercel excluded); deterministic rules engine is the core, external AI optional and replaceable.
**Evidence:** User answers at Gate 0.
**Consequence:** Phase 2 must produce an infrastructure comparison and an AI-independence design.

## D-0014 — Phase 1 evidence set complete

**Date:** 2026-11-03
**Decision:** Phase 1 reverse engineering is complete and submitted for Approval Gate 1.
**Evidence:** Ten documents in `C:\Users\ASUS\ovitech-audit\docs\rebuild\` plus 41 visual captures; reference clone clean at `f99cd02` with push disabled; secret scan clean on 281 files; no application code written.
**Consequence:** Phase 2 is blocked until the user approves the evidence and answers decisions G1-1…G1-10 in `PHASE-1-FEATURE-INVENTORY.md` §6. No target project may be created before that approval.

## D-0015 — Reference remains the only source of behaviour

**Date:** 2026-11-03
**Decision:** Where the audit found a defect (D-101…D-116), the rebuild reproduces the intended behaviour, not the defect, and records the deviation.
**Evidence:** `DOMAIN-FUNCTIONALITY-AUDIT.md` §14 and `FEATURE-TRUTH-MATRIX.md` §11.
**Consequence:** Parity claims must list every intentional deviation; unreachable or simulated behaviour may not be copied silently.

## D-0016 — Approval Gate 1 granted

**Date:** 2026-11-03
**Decision:** The user approved the Phase 1 evidence and authorized Phase 2 (architecture and migration strategy) with all recommended defaults.
**Evidence:** User answer at Approval Gate 1: "Approve with recommended defaults".
**Consequence:** Phase 2 may begin. Application code and the target project remain forbidden until Approval Gate 2.

## D-0017 — Access, authority and sync posture

**Date:** 2026-11-03
**Decision:** The rebuild is **single-user local-first** for the MVP: no authentication, no tenant switching, no server dependency. Approval authority is an explicit local **operator profile** switch (`field` / `production`), recorded on every approval. Sync is **out of the MVP**; backup/restore is the only data transport. A real sync module requires a separate approval and a backend.
**Evidence:** Gate 1 decisions G1-1, G1-2, G1-3; defects D-101, D-102, D-103.
**Consequence:** The rebuild must not ship auth screens, dead gates, an outbox, or "synchronisé" claims. It must not display a server status it cannot verify.

## D-0018 — Arabic-first language and typography

**Date:** 2026-11-03
**Decision:** Arabic is the default locale and the only eagerly bundled one. FR and EN are lazy-loaded. Arabic display/text faces are self-hosted alongside the Latin faces. Domain messages (engine notes, refusals, health signals) become i18n keys, not French literals.
**Evidence:** Gate 1 decisions G1-4, G1-5; defects D-104, K-16, K-19.
**Consequence:** No Google Fonts, no French literals in domain modules, no untranslated AR values, and RTL is verified by automated visual tests.

## D-0019 — Visual, content and simulation policy

**Date:** 2026-11-03
**Decision:** Entrance animation is replaced by CSS. Every simulated surface keeps a visible label. `/vision`, `/investisseurs` and `/label` are reproduced as presentation with their disclaimers. Seed data is development-only. Parity covers A/B/C rows; E rows are finished or removed; F rows are fixed and listed as deviations.
**Evidence:** Gate 1 decisions G1-6…G1-10; `FEATURE-TRUTH-MATRIX.md` §11; `VISUAL-REFERENCE-CATALOG.md` §8.
**Consequence:** A capability-status page is required, and the production build must fail if seed data or demo banners are included.

## D-0020 — Truth-class legend normalised

**Date:** 2026-11-03
**Decision:** The A–F legend delivered in `FEATURE-TRUTH-MATRIX.md` supersedes the earlier draft legend in `REBUILD-EXECUTION-PLAN.md` §3.3.
**Evidence:** Phase 1 matrix uses A = real deterministic, B = functional local, C = simulated/labelled, D = presentation, E = scaffold/unwired, F = broken.
**Consequence:** All later documents use the delivered legend; the execution plan is updated to avoid two competing definitions.

## D-0021 — Phase 2 architecture set submitted for Gate 2

**Date:** 2026-11-03
**Decision:** The Phase 2 deliverables are complete and submitted for Approval Gate 2: architecture, data model, access/sync, Arabic/RTL, hosting, quality, migration matrix, roadmap and summary.
**Evidence:** Nine documents in `C:\Users\ASUS\ovitech-audit\docs\rebuild\` prefixed `PHASE-2-`; target project still absent; no application code written; reference clean at `f99cd02` with push disabled.
**Consequence:** Phase 3 remains blocked until the user answers the Gate 2 questions in `PHASE-2-SUMMARY.md` §7 (A, D, S, L, H, Q, M). Creating `C:\Users\ASUS\ovitech-rebuild` is the first write action and requires that approval.

## D-0022 — Approval Gate 2 granted, L-1 rejected

**Date:** 2026-11-05
**Decision:** The user approved Phase 2 with **all recommended defaults except L-1**. L-1 is rejected: Amiri, IBM Plex Sans Arabic, Fraunces and Manrope are not adopted. Fonts, colours, radii and spacing must be taken from the style site `https://ovitech-mvp-4ip1.arcada.app`. The logo does **not** follow the style site and stays as in the original reference. The user also directed that Phase 3 must not start yet.
**Evidence:** User message at Gate 2; `design-extract-style/EXTRACTION-REPORT.md`.
**Consequence:** Phase 2 is approved and closed. Typography and the visual token layer are re-derived from the style site. Phase 3 stays blocked until the preparation phase is presented and explicitly authorized.

## D-0023 — Style-site design tokens and font stack adopted

**Date:** 2026-11-05
**Decision:** The rebuild adopts the style site's live token layer: **Inter** (Latin) and **Cairo** (Arabic), weights 400/500/600/700/800, **self-hosted WOFF2**; surfaces `#0b1220` / `#111827` / `#1a2332`; border `#243044`; accent `#10b981`; radii 8/12/16/24 px; 4 px spacing base; container 72rem; Arabic line-height 1.7 with zero letter-spacing. Cairo was verified in-app to cover Arabic (U+0600-06FF etc.) and to render (canvas metrics differ from every fallback), so no third Arabic family is introduced.
**Evidence:** `style-site.css`, `live-tokens-fr.json`, `live-tokens-ar.json`, `google-fonts.css`, `font-probe-ar.json`, `ARABIC-FONT-VERIFICATION.md`.
**Consequence:** The reference's navy/gold palette and Fraunces/Manrope are retired for visual purposes (behaviour and shell geometry still come from the reference). Google Fonts is a build-time source only; the runtime must not call it.

## D-0024 — Navigation shell is a sidebar

**Date:** 2026-11-05
**Decision:** The module list is a **vertical sidebar**: fixed on desktop, a Drawer on mobile, positioned on the **right in RTL** (inline-start). The style site's horizontal top navigation is not reproduced.
**Evidence:** User directive at Gate 2; reference shell measured at 256 px sidebar, 69 px header, right edge in RTL; style site has a top bar.
**Consequence:** The shell is built from the reference geometry with style-site tokens. Focus trapping, Escape handling and scroll lock are required on the Drawer.

## D-0025 — Team page taken from the style site as-is

**Date:** 2026-11-05
**Decision:** `/equipe` of the style site is reproduced **as-is** — stats strip, department filters, member cards with initials avatars, bio, e-mail and WhatsApp action, the add-member tile and modal, and the member detail modal. It replaces the reference `/team` page.
**Evidence:** `team-page-source/` (HTML, text, member JSON, screenshots, modals, CSS, logo); `team-page-source/README.md`.
**Consequence:** The page is rebuilt with logical properties and i18n keys; the style site's French-only strings, physical `.text-left` classes and hard-coded demo members are not copied. Contact data is user-editable and must not be logged.

## D-0026 — Preparation phase complete, results presented

**Date:** 2026-11-05
**Decision:** The read-only preparation phase is complete: Playwright CLI installed, designlang run, screenshots captured for the style site and the functional reference, the team page archived, tokens and fonts extracted and verified, and Phase 2 documents amended. Results are presented to the user; **Phase 3 is still not authorized**.
**Evidence:** `design-extract-style/EXTRACTION-REPORT.md`, `design-extract-style/ARABIC-FONT-VERIFICATION.md`, `team-page-source/README.md`, updated Phase 2 and governance documents.
**Consequence:** No repository, dependency, application file, secret or deployment was created. `C:\Users\ASUS\ovitech-rebuild` remains absent; the reference remains clean at `f99cd02` with its push URL disabled.

<!-- This file is the approved Phase 0-2 snapshot. D-0027..D-0031 live in the
     authoritative audit workspace. D-0032 is copied here deliberately with the
     design-tooling commit. -->

## D-0032 - Design tooling installed, Phase 5 still not started

**Date:** 2026-11-07
**Decision:** Install the requested design/QA tooling as **development-only**
assets, without adding any npm dependency to `package.json`. The installed set:

| Tool | Version | Source | Notes |
|---|---|---|---|
| `skills` CLI | 1.7.6 | `npx skills` | Installer for the agent skills. |
| `design-taste-frontend` (tasteskill) | 2.5.1 | `Leonxlnx/taste-skill` | Lock hash `974e1bb8...326ec7`. Installer flagged **Critical Risk (Gen) / Med Risk (Snyk)**; review before use. |
| `impeccable` | skill 4.8.0, engine 0.1.18 (windows-x64) | `npx impeccable install` | Installed into `.agents` and `.github`; the 19.5 MB `impeccable.exe` is duplicated in both trees. |
| `transitions-dev` | unversioned snapshot | `Jakubantalik/transitions.dev` | Lock hash `b8f0f695...3aa7c5`. |
| `transitions-polish` | unversioned snapshot | `Jakubantalik/transitions.dev` | Lock hash `e456d8cc...15a785`. |
| `transitions-ui-generation` | not installed | `Jakubantalik/transitions.dev` | Installer skipped it: YAML parse error (`Nested mappings are not allowed in compact mappings`). Only two of the three transitions skills are present. |
| `@playwright/cli` | 0.1.23 | npm global | `playwright-cli install --skills` added `.claude/skills/playwright-cli` and `.playwright-cli/` to `.gitignore`. |
| `designlang` | 13.4.0 | `npx designlang` | Used for the second token extraction. |
| Node / npm used | 24.21.0 / 11.19.0 | environment | Recorded for reproducibility. |

The skill and tool directories (`.agents`, `.claude`, `.codex`,
`.github/skills`, `.github/agents`, `.github/hooks`, `.playwright`,
`.playwright-cli`) are excluded from Prettier, ESLint, TypeScript, Vitest and
Tailwind source scanning. `npm run ci` remains green: 254 tests, entry JS
130.98 kB gzip (Vite) / 127.7 kB gzip (audit, level 9), CSS 24.97 kB raw /
5.78 kB gzip. No runtime code, dependency or bundle changed.

`/impeccable init` wrote `PRODUCT.md` from the approved Phase 1/2 documents and
`src/styles/tokens.css`; inferred fields (persona labels, WCAG 2.2 AA) are
marked as inferred.

The style-site team page was archived read-only to
`docs/rebuild/team-page-source/` (FR/AR, 1440/420 screenshots, HTML, text,
compiled CSS, Google Fonts CSS + WOFF2, logo, manifest, computed styles). It
was not converted.

`designlang` was run and compared in
`docs/rebuild/design-extract-style/COMPARISON-WITH-TOKENS.md`. No token was
edited. GSAP and React Bits were **not** installed; they remain blocked pending
a measured entry-JS budget under 180 kB gzip and explicit approval.

**Reproduction.** Node `24.21.0`, npm `11.19.0`. The tool trees are gitignored;
reinstall them with the commands below, then verify against `skills-lock.json`
and `scripts/engine-checksums.txt`. Do not re-run them as part of the build.

```powershell
npx skills@1.7.6 add Leonxlnx/taste-skill
npx impeccable install
npx skills@1.7.6 add Jakubantalik/transitions.dev
npm install -g @playwright/cli@0.1.23
playwright-cli install --skills
npx designlang@13.4.0 --version    # used ad hoc for the extraction; not installed
npx skills list                    # expected: 5 skills
```

Expected versions: `design-taste-frontend` 2.5.1; `impeccable` skill 4.8.0
with engine 0.1.18; `transitions-dev` and `transitions-polish` snapshots;
`@playwright/cli` 0.1.23; `designlang` 13.4.0; `skills` CLI 1.7.6.
`transitions-ui-generation` is still skipped by its installer (YAML parse
error). Full manifest and the read-only security findings:
`docs/DESIGN-TOOLING.md`.

**Evidence:** `skills-lock.json`; `.prettierignore`; `eslint.config.js`;
`tsconfig.json`; `vitest.config.ts`; `src/styles/base.css`; `PRODUCT.md`;
`docs/DESIGN-TOOLING.md`; `docs/rebuild/team-page-source/`;
`docs/rebuild/design-extract-style/`; `npm run ci` green.
**Consequence:** The tooling configuration is committed separately as
`chore: design tooling config` (no push). It does not alter the application
runtime, the approved token layer or D-0030/D-0031. **Phase 5 has not started.**
The duplicated 19.5 MB impeccable binary and the ~78 MB total skill tree are a
repository-weight and supply-chain consideration; they stay on disk but out of
git. The Critical Risk flag on `design-taste-frontend` remains open for review.

## D-0033 - Tooling hooks disabled; colour proposal, no token change

**Date:** 2026-11-08
**Decision:** Automatic skill hooks are disabled without deleting any skill
file. The `design-taste-frontend` `Stop` block is removed from the
`SKILL.md` frontmatter (six lines), `.codex/hooks.json` is reduced to
`{"hooks": {}}`, and `.github/hooks/impeccable.json` to
`{"version": 1, "hooks": {}}`. Quality gates are run manually. User-scope
`DO_NOT_TRACK=1` and `IMPECCABLE_NO_TELEMETRY=1` are set.
`impeccable generate-image`, `impeccable live`, runtime asset downloads, and
copying external-origin skill templates/assets into `src/` or `public/` are
forbidden. The colour proposal is recorded in
`docs/rebuild/COLOUR-PROPOSAL.md`; no design token is changed.
**Evidence:** `.agents/skills/design-taste-frontend/SKILL.md`;
`.codex/hooks.json`; `.github/hooks/impeccable.json`;
`docs/DESIGN-TOOLING.md`; `docs/rebuild/COLOUR-PROPOSAL.md`; authenticated
computed styles for `/`, `/dashboard`, `/cheptel`, `/dossier`, `/cameras`,
`/sante`, `/equipe` (FR and AR).
**Consequence:** No automatic gate or detector runs on stop/edit; the skill
trees stay on disk and gitignored, so a reinstall can restore hooks and needs
the reproduction steps in `docs/DESIGN-TOOLING.md`. The style site's solid
primary is `#009966` (Tailwind v4 emerald-600), not `#00d492`; `#00d492` is
only the v4 emerald-400 text/dot/icon accent. White labels on `#009966` and
`#059669` are 3.65:1 and 3.77:1 and fail AA normal text; the existing
`--color-accent-contrast` `#04120c` gives 5.24:1 and 5.08:1 with no token
change. Phase 5 remains unauthorised.

## D-0034 - GSAP agent skills installed; gsap dependency not installed

**Date:** 2026-11-08
**Decision:** Install the official `greensock/gsap-skills` package (eight
skills: `gsap-core`, `gsap-frameworks`, `gsap-performance`, `gsap-plugins`,
`gsap-react`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-utils`) as
gitignored agent documentation with
`npx skills add https://github.com/greensock/gsap-skills --skill '*' --agent codex github-copilot opencode -y`.
Do **not** run `npm install gsap` and do not add a GSAP dependency in this
phase. A read-only review found no hooks, shell execution, runtime network
requests, reads outside the project or hidden instructions; the skills contain
only `SKILL.md`.
**Evidence:** `.agents/skills/gsap-*/SKILL.md`; `skills-lock.json`; source
commit `aed9cfd3277740755f6bfc1155c7aa645403b760`; `docs/DESIGN-TOOLING.md`.
Licence: `gsap@3.15.1` declares the Standard "No Charge" GSAP License in
`package.json:66` and `README.md:90-93` (no standalone `LICENSE` file is
published). The canonical text at `https://gsap.com/standard-license`
(effective 2025-04-30) permits commercial use, including ScrollTrigger and
SplitText, subject to no competing visual animation builder, no reverse
engineering for a competitive product, and retention of proprietary notices.
**Consequence:** The skills are authoring/reference aids only. GSAP code or a
dependency remains a Phase 5 decision and must be measured against the bundle
budget before adoption. The skills are gitignored and add no runtime surface.

## D-0035 - Design tokens aligned with the style site, AA-safe

**Date:** 2026-11-08
**Decision:** Apply the accepted colour proposal before Phase 5.
`--color-accent-strong` becomes `#009966` (Tailwind v4 emerald-600) and is
the fill of every solid primary button, with the existing
`--color-accent-contrast` `#04120c` as the label. `--color-accent` becomes
`#00d492` (v4 emerald-400) for dots, labels and icons. Add
`--color-surface-header: #111827d9` for the translucent header and
`--color-surface-header-solid: #101827` as the fallback. The header uses the
solid fallback for now: the 12 px backdrop blur is deferred because no low-end
phone profile has demonstrated smooth scrolling (K-61). No other token changes.
Add `src/styles/tokens.test.ts`, which parses `tokens.css` and fails CI when a
button text/fill pair or an accent-on-surface pair drops below 4.5:1 (normal
text) or 3:1 (large text/UI).
**Evidence:** `src/styles/tokens.css`; `src/app/shell/Header.tsx`;
`src/components/ui/button.tsx`; `src/pages/NotFoundPage.tsx`;
`src/styles/tokens.test.ts`; `docs/rebuild/COLOUR-PROPOSAL.md`;
`PRODUCT.md`.
**Consequence:** Solid CTAs keep the site fill with AA labels (5.24:1);
`#00d492` is only the accent text/dot/icon colour (9.66:1 / 9.15:1). The
contrast test makes a future palette regression a CI failure. Phase 5 is still
not started.

## D-0036 - Team page contact details publish with member consent (2026-11-12)

**Decision:** The project owner confirmed that every team member consents to publishing their
contact details on the public team page (`/equipe`, alias `/team`). Scope: **exactly the fields
already present in the team-page archive** - email and WhatsApp link in the scheme-less `wa.me`
form - for the members already in the archive. **No phone numbers** are published for archived
members, and no new field is added now.

**Consequence:** `src/pages/TeamPage.tsx` and the archive data stay byte-for-byte unchanged; this
entry is the record of consent, not a content change.

**Re-confirmation rule:** consent must be obtained again, in writing, before (a) adding any new
member to the page, or (b) adding any new contact field for an existing member. A member may
withdraw consent at any time; removal then takes priority over the published record.

**Confirmed by:** project owner (Nacer), 2026-11-12.

## D-0041 - Screenshots must prove their locale (2026-11-13)

**Decision:** A screenshot is only evidence if the capture proves the locale it claims. `scripts/capture-screenshots.mjs` now writes the requested language into `localStorage` before the first navigation, asserts `documentElement.lang` and `dir` before every shutter, refuses frames with a hidden `[data-reveal]`/`[data-enter]` block, freezes the clock (the demo seed derives its timestamps from `new Date()`), waits for `document.fonts.ready` and every `<img>` decode, and hashes each PNG into `manifest.json`; `--verify` re-hashes the files and fails when the ar and fr shots of the same page and width are byte-identical.

**Evidence:** `scripts/capture-screenshots.mjs`; `docs/KNOWN-ISSUES.md` K-74; `ovitech-audit/docs/rebuild/VISUAL-PARITY-REPORT.md` §1b; seven pairs recaptured 2026-11-13 in `ovitech-audit/docs/rebuild/phase-5b-fixes/2026-11-13/recapture/`; negative control (a copied ar file verified as fr) exits 1; two identical capture runs produce 16/16 identical hashes.

**Consequence:** The Phase 5 parity verdict no longer rests on seven pairs that were one locale captured twice; the correction is recorded rather than quietly overwritten. Any future capture inherits the assertion, and an identical ar/fr pair is a hard failure.

## D-0042 - One KPI grid rule for the four editable pages (2026-11-13)

**Decision:** Mobile KPI grids follow one rule, `grid-cols-2 sm:grid-cols-4`, imported as `KPI_GRID` from `src/components/ui/stat.tsx` and used by home, nutrition, ration and indicateurs. Home re-narrows at `lg` (`lg:grid-cols-2`) because its grid lives in the ~470 px hero column; nutrition widens at `lg` (`lg:grid-cols-5`) so the fifth metric is not orphaned. `src/pages/TeamPage.tsx` is **not** changed: its `grid-cols-2 md:grid-cols-4` is part of the frozen team page.

**Evidence:** Review finding P1 "mobile KPI grid split" (`docs/TASTE-REVIEW.md`); `design-taste-frontend` §4 ("one system") and §5 checklist ("equal edges", "every visual renders at 390"); measured at 360/420 on all four pages, both locales: 2 cards per row, 158-188 px wide, `pageOverflow=0`, no clipped number, unit or label; before/after in `phase-5b-fixes/2026-11-13/{before-a,after-a}`.

**Consequence:** Nutrition, ration and indicateurs no longer stack 1-up on a phone. The `equipe` grid stays frozen for the reason above, so it is the only page whose rule is `md`-based; that is a documented exception, not drift.

## D-0043 - The audit journal is a labelled card list below `sm` (2026-11-13)

**Decision:** Below `sm`, each audit event renders as a card: a date header, the severity, and a `<dl>` of type, entity and summary, so every value keeps its label for assistive tech. From `sm` up the five-column table is unchanged. Only one branch is in the DOM tree of the accessibility layer at a time (`display: none`), so nothing is announced twice.

**Evidence:** Review finding "journal 5-column table at 386 px with 61 px rows"; before/after at 360/420/1440 in `phase-5b-fixes/2026-11-13/{before-b,after-b}` (1440 pixel-identical, 420/360 differ only below the filter row); `README`-level a11y rule in `harness/AGENTS.md` (accessibility is a merge gate).

**Consequence:** The journal row semantics are now "label: value" pairs on a phone. The table branch is duplicated in JSX on purpose: a `display: block` table loses its table semantics in several screen readers.

## D-0044 - French and English read the clock on 24 hours, dates keep the year (2026-11-13)

**Decision:** `formatDateTime` pins `hourCycle: 'h23'` for `fr` and `en` and always includes the year; Arabic keeps its day period (ص/م) and the `ar-DZ-u-nu-latn` Latin digits the tabular columns align on. `formatNumber` is untouched.

**Evidence:** Review finding "fr-DZ resolves to hourCycle h12 causing Latin PM plus missing year in formatDateTime"; the journal rendered `14 août, 10:00 PM`; `src/lib/format.test.ts` asserts fr/en/ar against fixed instants with `TZ=Africa/Algiers` pinned in `vitest.config.ts`; all 20 call sites are JSX text - no formatted string is persisted, hashed or exported.

**Consequence:** A February entry can no longer read like today's, and a 22:00 schedule is no longer `10:00 PM`. Arabic output is unchanged by design.

## D-0045 - Animal codes are 24 px touch targets (2026-11-13)

**Decision:** `AnimalCodeLink` wraps the animal code with `inline-flex min-h-6`, 6 px inline padding and a matching negative inline margin, so the hit area is at least 24 px without shifting the column. Used by the herd table, the health history and the nutrition cards.

**Evidence:** Review finding "animal-code links 55-63x17px"; measured 66x24 (ar) and 71x24 (fr) at 1440, row height still 59 px; before/after in `phase-5b-fixes/2026-11-13/{before-d,after-d}`.

**Consequence:** The most-tapped control in the herd table meets the 24 px minimum while table density is unchanged.

## D-0046 - Amber belongs to the demo banner only (2026-11-13)

**Decision:** Amber (`warn`) is reserved for the global demo banner and for genuine states (not connected, low stock, blocked, refused, alerts). Page-level development pills - `app.phase`, `common.simulation`, `common.demonstration`, `scan.demoNote` - are neutral. Internal phase numbers are removed from user-facing copy: `app.phase`, `footer.phase` and `status.engineValue` read `en développement` / `قيد التطوير` / `in development` from the catalogue. The Simulation and Demonstration labels stay, only their tone changes.

**Evidence:** Review finding "amber notice stacking"; before/after at 360/420/1440 for `etat`, `scan`, `label`, `ecosysteme`, `cameras` in `phase-5b-fixes/2026-11-13/{before-e,after-e}`; `npm run check:i18n` green (1001 keys per locale, 0 Latin leaks in ar).

**Consequence:** The one banner that must never be missed is the only amber chrome on a page. The remaining `phase 4/6` wording in `offline`, `notFound`, `sync` and `export` copy is listed in `HANDOFF.md` P2, not silently rewritten.

## D-0047 - A failed chunk offers a reload, not a dead retry (2026-11-14)

**Decision:** When the deferred services chunk cannot be fetched, `FarmGate` shows a dedicated message and a "reload the page" action instead of the retry button. The store records `errorKind: 'chunk' | 'storage'`; a storage failure keeps the in-place retry, which does work.

**Evidence:** `scripts/verify-services-chunk-abort.mjs` aborts `services-*.js` on the built `dist` (Playwright `route.abort`) on a cold load and on a later load with `Network.clearBrowserCache`; the pre-fix run showed the error state but two retry clicks produced **no second chunk request** and no recovery, while a manual reload recovered. After the fix the same script passes 14/14 checks and both scenarios recover to onboarding. Screenshots in `phase-5b-fixes/2026-11-13/chunk-abort/`.

**Consequence:** "Retry" is now honest: a browser-cached import rejection cannot be retried, so the gate asks for the one action that works. No blank screen in either scenario; no uncaught page error.
