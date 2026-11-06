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
