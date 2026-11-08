# Known Issues and Limitations

**Updated:** 2026-11-08
**Scope:** governance + reference findings. Product defects live in
`DOMAIN-FUNCTIONALITY-AUDIT.md` (D-101…D-116); this file tracks process,
environment and open questions.

## Blocking / high severity

| ID | Issue | Evidence | Impact | Owner |
|---|---|---|---|---|
| K-01 | Reference repository has no license | GitHub API `license: null` | Legal reuse depends on the user's ownership confirmation | User — confirmed ownership at Gate 0 |
| K-02 | Only local clone with the old name is a different remote | `nacerouali464-sketch` @ `ded6ab6` | Risk of building from the wrong source | Resolved: official clone used |
| K-03 | `ovitech-clean` prototype is outside governance | No `.git`, 7,281 files, pre-Phase 0 | Risk of certifying the wrong artifact | Keep untouched |
| K-04 | Reference is a demonstrator, not a production system | README, audits, simulated devices | "Production ready" cannot be assumed | Team |
| K-15 | Approve → serve workflow unreachable (D-101) | `seed-state.ts`, `engine.ts:151`, `rec-card.tsx:77` | Core nutritional loop cannot complete in a fresh session | Resolved in design: operator authority model (DEV-01) |

## Medium severity

| ID | Issue | Evidence | Impact | Mitigation |
|---|---|---|---|---|
| K-05 | Docker is not installed | `docker` missing | Blocks container deployment in Phase 8 | Install later |
| K-06 | GitHub CLI is not installed | `gh` missing | Manual PR/release workflows | Optional |
| K-07 | Reference root is cluttered with historical audit files | 281 files | Confusing source of truth | Ignore non-code reports |
| K-09 | Vercel/Grok traces exist in reference ecosystem | Homepage, README, `/__grok/*`, `server/middleware/grok-pwa.ts` | Accidental coupling | Excluded by decision D-0003/D-0004 |
| K-10 | Arabic UTF-8 handling on Windows | Prior shell-replacement incidents | Text corruption | Use editor tools, never PowerShell replacement on AR files |
| K-16 | No Arabic webfont in the reference | `__root.tsx` loads only Latin faces | AR typography falls back to system fonts | **Resolved:** Cairo self-hosted; verified Arabic coverage (D-0023) |
| K-17 | Entrance blocks stay at `opacity: 0` | DOM inspection on `/` and `/indicateurs`; reproduced in real Chromium | Hidden dashboard and chart content | Replace animation (G1-6) |
| K-18 | Sync is simulated (D-102) | `store/sync.ts` flips statuses only | No real durability or multi-device story | Resolved in design: sync removed from MVP (DEV-02) |
| K-19 | AR locale leaks untranslated fragments | `ar.json` `hintPesees` = `" weighs… <arabic>"` | Visible defect in Arabic UI | Fix during i18n migration |
| K-20 | 219 of 1,082 AR values contain Latin runs | Flattened `ar.json` scan | Most are legitimate brand terms; some are mixed-direction defects | Audit each during AR-first build |
| K-24 | Reference PDFs use pdfmake + embedded Amiri | `pdf-engine.ts` | The rebuild's print-CSS output will not be byte-identical | Accepted deviation DEV-07, pending A-3 |
| K-25 | Some visual captures hide content (`opacity: 0`) | `HOME` and `/indicateurs` captures | The visual baseline is incomplete for those blocks | Intended design + source take precedence; re-capture in Phase 5 |
| K-26 | Content pages depend on unverified figures | `/investisseurs`, `/label` | Cannot be presented as audited evidence | Label as owner-supplied projections |
| K-27 | No Arabic human review arranged yet | - | Content-page Arabic may be machine-quality | Required before Phase 9 certification |
| K-28 | The style site is behind a `/login` gate | Live site, 2026-11-05 | Extraction depends on demo access; the gate could change | Archive is complete; re-capture only if the site changes |
| K-29 | The style site's team page is not localised | `equipe-ar.html` | Title, names, roles, bios and badges stay French in AR | Rebuild through i18n keys (team-page-source README §5) |
| K-30 | The style site uses physical `text-left` classes and hard-coded demo members | `equipe.html` | Copying classes would break RTL and ship demo data | Use logical utilities; seed dev-only (D-0019) |
| K-31 | Team page publishes personal e-mails and phone numbers | `equipe-members.json` | Privacy exposure if copied blindly | User-editable fields; no logging/analytics; owner review before ship |
| K-32 | Member detail modal captured only at 420 px | `equipe-member-detail-420.png` | Desktop layout of that modal is not archived | Re-capture in Phase 5; the DOM shows it is the same panel |
| K-33 | `designlang` sampled a narrow viewport and invented palette values | `EXTRACTION-REPORT.md` §4 | Automated tokens alone are unsafe | Live computed styles are authoritative |

## Low severity

| ID | Issue | Evidence |
|---|---|---|
| K-11 | Repository package name is `app-builder-workspace` | Reference `package.json` |
| K-12 | Machine timezone is UTC−11:00 | Windows clock; use ISO timestamps |
| K-13 | npm may block lifecycle scripts | npm 11 behavior observed earlier |
| K-21 | Visual copy `C:\Users\ASUS\ovitech-visual` holds 450 packages | Created for screenshots | Disposable after Gate 1 |
| K-22 | `/sante` and three device pages were not screenshot-captured | Time-boxed capture | Described from source; capture in Phase 4 if needed |
| K-23 | Long pages may be clipped in captures | 2600 px capture viewport | Re-capture per section if needed |

## Resolved during Phase 1

| ID | Issue | Resolution |
|---|---|---|
| K-08 | No content-level secret scan | `node scripts/check-secrets.mjs` → 281 files, no banned secrets; independent regex scan clean |
| K-14 | No official local clone existed | `C:\Users\ASUS\ovitech-reference` at `f99cd02`, push disabled, clean tree |

## Resolved during Phase 2 (design decisions)

| Question | Resolution |
|---|---|
| Access model | Single-user local-first, no auth (D-0017) |
| Authority/approval model | Explicit operator profile with `field`/`production` switch |
| Sync posture | No sync in the MVP; backup/restore is the transport |
| Hosting provider | Cloudflare Pages primary, Hetzner + Caddy fallback (pending H-1/H-2) |
| Database engine | IndexedDB, single `FarmDocument`, numbered migrations |
| Arabic fonts and RTL | **Inter + Cairo** (style site), self-hosted; logical properties only; sidebar right in RTL (D-0022…D-0024) |
| PDF generation | Client print-CSS pipeline; automated PDF deferred |
| FR/EN parity | Fully supported, lazy-loaded; AR is the authored source |
| Seed data | Development-only, import-guarded; production starts empty |

## Still open after Gate 2

- DDNE equation validation by a nutrition expert (external, Phase 9).
- Figures on `/investisseurs` and `/label` (owner-supplied).
- Production domain and DNS (Phase 8).
- Optional local PIN lock (Phase 7, S-5).
- Whether an automated PDF generator is needed after print-CSS (Phase 7).
- Any backend or sync feature (post-MVP, new decision required).
- Confirmation that Cairo stays the single Arabic family (recommended).
- Team contact-data policy and owner review of published details (Phase 5).
- Phase 3 authorization (not yet given).

## Unrelated artefact found in this folder

`FINAL-AUDIT-REPORT.md` (dated 2026-11-04) audits a **different** deployment:
`https://www.promarcket.com/ovitech/hasni/site`, described as a PHP/React
application. It is **not** the rebuild described in this plan (the target
`C:\Users\ASUS\ovitech-rebuild` does not exist), and its findings are not used
as evidence here. It is preserved untouched; the user should confirm whether it
belongs to another project or should be moved out of `docs/rebuild/`.

## Claim discipline

- No statement about feature completeness, production readiness, performance,
  security, or scientific validity is certified by this audit.
- Simulated capabilities must keep their labels in the rebuild.
- Presentation pages are content, not evidence.
- Reference screenshots reflect the demonstrator with seed data on 2026-11-03.
- Style-site and functional-reference captures were taken on 2026-11-05; the
  style site is a demo build with seeded data and a public login gate.

## Design tooling hardening (2026-11-08)

| ID | Issue | Evidence | Impact | Mitigation |
|---|---|---|---|---|
| K-52 | Automatic skill hooks could run on stop/edit | `SKILL.md` frontmatter; `.codex/hooks.json`; `.github/hooks/impeccable.json` | Unreviewed execution in the agent environment | Removed/emptied without deleting skill files; reproduction in `DESIGN-TOOLING.md` |
| K-53 | White text on solid green CTAs fails AA normal text | `COLOUR-PROPOSAL.md`: 3.65:1 on `#009966`, 3.77:1 on `#059669` | Accessibility gap for 14-16 px labels | Use existing `--color-accent-contrast` `#04120c` (5.24:1 / 5.08:1); no token change |
| K-54 | Header `#101827` is not a named token | `.glass` = `#111827d9` + 12 px blur | Ad-hoc surface value can drift | Documented; add `--color-surface-header` only if exact reproduction is required |
| K-55 | `OPENAI_API_KEY` is absent from process, user and machine scope | environment name check, 2026-11-08 | Optional image fallback cannot run here | Intended: `impeccable generate-image` is forbidden |
| K-56 | `designlang --cookie-file` cannot authenticate a localStorage-only app | `designlang src/utils-cookies.js:42-44` | Internal captures silently measure `/login` | Use computed styles through an authenticated browser/proxy; verify the page heading before trusting output |
| K-57 | Skill trees are third-party and pinned only by lock/checksum | `skills-lock.json`; `engine-checksums.txt` | A reinstall can restore hooks and drift versions | Re-apply the hardening steps and verify hashes after every reinstall |

## GSAP skills and licence review (2026-11-08)

| ID | Issue | Evidence | Impact | Mitigation |
|---|---|---|---|---|
| K-58 | GSAP skills are third-party documents with no version field | `skills-lock.json`; source commit `aed9cfd`; `gsap-*/SKILL.md:1-5` | An update can change guidance silently | Record the source commit and hashes; re-run the read-only review after any update |
| K-59 | The published `gsap` npm package ships no standalone licence file | `gsap@3.15.1` tarball: `/LICENSE` and `/LICENSE.txt` 404; repo root has no licence file | Licence provenance depends on package metadata and a website | Cite `package.json:66`, `README.md:90-93` and the canonical URL; recorded in `DESIGN-TOOLING.md` |
| K-60 | `gsap-frameworks` references examples the installer did not copy | `gsap-frameworks/SKILL.md:23,94` | Following the paths fails; no runnable sample locally | Use the inlined prose; do not fetch the missing examples |

## Design tokens and header blur (2026-11-08)

| ID | Issue | Evidence | Impact | Mitigation |
|---|---|---|---|---|
| K-61 | The sticky header uses the solid `#101827` fallback because the 12 px backdrop blur has not been proven smooth on a low-end phone | `Header.tsx`; `tokens.css`; D-0035 | Slightly less translucent than the style site on capable devices | Keep the solid fallback; measure scroll frames under CPU/network throttling on a low-end profile before enabling `--color-surface-header` + `backdrop-filter: blur(12px)` |
