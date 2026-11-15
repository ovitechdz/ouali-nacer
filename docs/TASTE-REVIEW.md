# Phase 5b · Batch 2 — Taste review (read-only)

Status: **review complete, no page modified, waiting for approval.**
Scope: 24 screens × {420, 1440} × {ar, fr} = 96 captures and 96 DOM measurements.
Date: 2026-11-13 · branch `phase-5b` · HEAD `0c4ed6b`.

---

## 0. Offline proof (requested before the review)

Build → serve `dist` → load once → go offline → first store action.

| Step | Result |
| --- | --- |
| `npm run build` | 62 precache entries (1690.69 KiB), `services-BPAdanm4.js` in the manifest |
| Serve + first load | SW active, scope `/`, 58 entries in `workbox-precache-v2` |
| Reload (control) | `navigator.serviceWorker.controller === true` |
| Offline reload | onboarding renders, zero network errors, `transferSize 0` + `workerStart 388 ms` for the services chunk |
| First store action offline | onboarding submit → farm created → shell (`header`) rendered |

**Verdict: the deferred services chunk is precached and the first store action works offline.**

## 1. Method

- Headless Chromium against `vite preview` for the offline proof, `vite dev` for captures
  (`--host 127.0.0.1`; Vite 7 binds `localhost` to IPv6 only, which the local proxy answers 502).
- Per screen: screenshot + DOM measurement of overflow, `dir`/`lang`, font stacks, radii, interfaces
  under 24 px, text under 12 px, Arabic/Latin character counts.
- Evidence: `C:\Users\ASUS\ovitech-audit\docs\rebuild\phase-5b-taste\<page>-<width>-<locale>.png`.
  Raw measurements: `%TEMP%\opencode\taste-audit.json`.

### Evidence defect found in the archived set (fixed by this review)

`docs/rebuild/phase-5-verification` cannot be used as review evidence: **7 pairs of screenshots are
byte-identical across locales**, i.e. the `ar` file *is* the `fr` file:

```
journal-420, journal-1440, nutrition-420, nutrition-1440,
sante-420, sante-1440, troupeau-420
```

A visual verdict based on those files silently reviews one locale twice. All findings below come from
the fresh 96-shot set instead. Recommend marking the archived folder as unreliable in the audit log so
no later batch cites it.

## 2. What is already solid (verified, not impressions)

- **0 px horizontal overflow** on all 96 combinations; `dir`/`lang` correct everywhere (`rtl`+`ar`,
  `ltr`+`fr`).
- **One radius scale** (8 / 12 / 16 / 24 px + full pills) and **one shadow token** across the app.
- **Font pairing is deliberate and self-hosted**: Inter for Latin, Cairo for Arabic
  (`src/styles/fonts.css`), no external origin.
- Mirroring is correct: header order, chips, table headers, arrows and search icon all flip between
  `ar` and `fr`; filter chips wrap to two rows at 420 without clipping; stat cards keep equal heights.

## 3. Findings, prioritised

Each finding states **page · evidence · fix within existing tokens**. "Existing tokens" = the
utilities already in use (`text-xs`, `text-sm`, `text-[11px]`, `rounded-xl`, `border-border`,
`bg-surface-2`, `text-fg-muted`, `variant="secondary"` …). No token value changes are proposed.

### P1 — fix before the next content batch

**P1-1 · Two different mobile KPI layouts in one product**
`nutrition` (6 cards), `ration` (4), `indicateurs` (8) render **one card per row** (388 px wide,
86–106 px tall → **596 / 430 / 848 px** of vertical space before any real content). `home` and
`equipe` render the same information **two per row** (167–188 px wide, 90–106 px, 1838 px band for the
whole home grid, 192 px for the equipe KPI band).
*Fix:* put nutrition / ration / indicateurs KPI blocks on `grid-cols-2 sm:grid-cols-4` like `home` and
`equipe`. `StatCard` already works at 167 px, so this is a wrapper-class change only; it recovers
≈300 px of first screen on `nutrition` and ≈1000 px on `indicateurs` at 420.

**P1-2 · The audit table is a 5-column grid squeezed into 386 px at 420**
`journal` · ar/fr 420: columns are 111 / 51 / 107 / 52 / 65 px, and rows grow to **61 px** because
"تسجيل الحيوان" + "OV-2401" wrap onto two lines. Body text is 11–12 px.
*Fix:* below `sm`, render each event as a stacked block — date + type on line 1 (`text-xs`,
`text-fg-muted`), subject on line 2 (`text-sm`, `text-fg-strong`), severity as the existing badge —
and keep the `<table>` from `md` up. Same shape applies to any 5-column table that lands in this breakpoint.

**P1-3 · French timestamps fall back to a 12-hour clock with a Latin "PM"; the year is dropped**
`journal` · fr 1440 shows `15 août, 07:33 AM`; `ar` correctly shows `15 أغسطس 07:31 ص`.
Cause: `formatDateTime` uses `fr-DZ`, and Chromium's ICU resolves **`fr-DZ` to hour cycle `h12`**
(measured: `resolvedOptions().hourCycle === 'h12'`; `fr-FR`/`en-GB` resolve to `h23`). Because
`year` is not requested, an 18-month-old audit entry reads "15 août" with no year at all.
*Fix in `src/lib/format.ts`:* keep `hourCycle` default for `ar`, pass `hourCycle: 'h23'` for
`fr`/`en` (or format dates with `fr-FR` while keeping `fr-DZ` for numbers); add `year: 'numeric'` for
journal / health / nutrition history rows. One function, affects every timestamp in the app.

**P1-4 · Animal-code links are 17 px tall (WCAG 2.2 AA 2.5.8 asks for 24 px)**
`nutrition` 420 + 1440 (fr), `troupeau` 1440 (fr), `sante` 1440 (fr): the `<Link>` around
`OV-24xx` measures **55–63 × 17 px**. It is `text-sm font-bold` with no vertical padding.
*Fix:* add `inline-flex min-h-6 items-center` (or `py-1`) to that link. Rows are already 44–61 px
tall, so nothing reflows; hit area reaches 24 px without touching type size.

**P1-5 · Demonstration status is repeated in the same amber as real warnings**
Every page carries the global amber banner ("Mode démonstration — …"), and `scan` adds a second amber
pill ("القراءة يدوية في هذا العرض التجريبي"), while `vision` and `etat` add a third style of amber pill
("المرحلة 5 — إعادة النطاق"). Amber is the only warning hue in the system, so a build-phase label and a
demo note compete with genuine warnings (health alerts, low stock).
*Fix:* the banner stays the single demo statement; drop the per-page demo pills; move the phase label
to `etat` only (or make it plain `text-fg-subtle` metadata in the eyebrow). Reserve warn/amber for state.

### P2 — fix in the same batch if the diff stays small

**P2-1 · Peer metrics get four arbitrary tints**
`equipe` 420 + 1440: Membres (green), Départements (blue), Sur site (teal), Disponibles (purple) — four
hues for four metrics of equal rank, none of them a state. Every other page reserves colour for
accent/warn/danger.
*Fix:* `tone="neutral"` for peer metrics; keep `accent`/`warn`/`danger` for state cards (`indicateurs`
health alerts already use them correctly).

**P2-2 · One primary CTA per member card**
`equipe` 420 + 1440: five full-width saturated green "Contacter sur WhatsApp" buttons plus the page
primary "Ajouter un membre" — six primaries on one screen, and the loudest element is a per-row action.
*Fix:* `variant="secondary"` (or `outline`) for the per-member action; keep one primary per screen.

**P2-3 · Text below 12 px is used for content, not only for labels**
**684 instances under 12 px** at ar/420: 204 at 10 px (43 distinct strings) and 480 at 11 px.
10 px is the drawer group label and the mono RFID line (`font-mono text-[10px] text-fg-subtle`) in
herd/nutrition rows; 11 px is the `StatCard` label (uppercase + tracking, acceptable), table headers,
captions, email lines.
*Fix:* raise the mono RFID/meta line and the drawer group labels to `text-[11px]` (already in the
codebase); keep uppercase tracked labels at 11 px; make table body cells `text-xs` at 420 so the
`journal`/`troupeau` tables are not read at 11 px.

**P2-4 · Empty states are a bare sentence**
`scan` 420 "آخر القراءات" → "لا قراءات في هذه الجلسة." with no icon, no explanation, no next step.
*Fix:* reuse the `Card` + one muted icon + one sentence + one `variant="ghost"` action; the pattern
already exists elsewhere in `components/ui/feedback.tsx`.

**P2-5 · Card inside card inside card**
`vision` 420 "أربع ركائز": a `rounded-2xl` card holding four bordered `rounded-xl` sub-cards, each with
its own padding — three borders and two radii inside a 372 px column.
*Fix:* inner items become `border-t border-border pt-3` rows inside the existing card; drop the inner
radius and one level of padding.

### P3 — polish, only if the batch has room

**P3-1 · Header farm line truncates at 420 in both locales**
"مزرعة العرض — سيدي بلع…" / "…Ferme — Sidi Bel Abb…". The page `h1` already names the screen; the
truncated line adds noise above it.
*Fix:* hide the header subtitle below `sm` (`hidden sm:block`); keep `middleTruncate` for wide viewports.

**P3-2 · Chart axis ticks are the faintest text on screen**
`indicateurs` 1440: y-axis ticks (5 / 4 / 3) at ~10 px in a gray clearly weaker than body muted;
the plot is readable only because the line is bright.
*Fix:* `text-fg-muted` for tick labels and fewer ticks (3 instead of 5); no new token.

## 4. Deliberate patterns — not defects

- **Team page**: Arabic chrome around frozen French archive content (615 Arabic chars / 138 Latin
  words). Archive parity, unchanged by decision.
- **Inter + Cairo**: deliberate Latin/Arabic pairing, both self-hosted.
- **Latin digits**: `numberSystem: 'latn'` is configured on purpose in `src/i18n/config.ts`.
- **Demo banner**: required while there is no live mode; only its repetition (P1-5) is a defect.
- **10 px uppercase drawer labels**: the tracking is correct; only the size floor is worth raising.

## 5. Proposed Batch 3 scope (after approval)

1. P1-1 mobile KPI grid (nutrition, ration, indicateurs) — wrapper classes only.
2. P1-3 `format.ts` hour cycle + year — one file, all timestamps.
3. P1-4 code-link hit area — three call sites.
4. P1-2 journal stacked rows below `sm`.
5. P1-5 amber notice consolidation (banner only).
6. P2-1/P2-2 equipe tint + CTA demotion.
7. P2-3 text floor, P2-4 empty states, P2-5 vision nesting — one commit each if time allows.

Nothing in this list changes a token, a route, copy in the frozen team page, or the 15 CI gates.

---

## 6. Batch 3 — motion (2026-11-14)

Owner-approved scope: **transitions-dev + transitions-polish, motion only**. No dependency, no design
token (colour, spacing, radius, type), no font, no i18n key, no route, no schema change. Team page
untouched; it keeps hover-only styling.

### 6.1 What shipped

| Commit | Change | Why |
| --- | --- | --- |
| `72dbaef` | One CSS page entrance (`.ov-page-enter`: opacity 0 → 1, `translateY(6px)` → 0, 250 ms) on Energy, KPI, the five ecosystem pages, Vision, Label and Status | These ten routes only had the shell fade. The travel is vertical, so Arabic RTL and French LTR read the same direction; only opacity and transform animate |
| `81d3ce0` | Every existing transition on one scale: `--duration-quick` 150 ms for colour/border/opacity, `--duration-fast` 250 ms for transform, the existing `--ease-out` as the only easing; 26 class strings in 20 files; the three older entrance animations (160/200/220 ms) now use the same tokens | Hover, focus and page motion had six durations and two implied easings |
| `c6fb235` | `scripts/verify-motion.mjs` (`npm run verify:motion`) + reduced-motion completeness | Proof, not assertion: 585 checks in a real browser |

**One interpretation to confirm:** Energy and KPI were the only two listed routes that still used the
GSAP reveal (`useGsapReveal`). The owner asked for a CSS-only entrance and "no GSAP for this tier", so
both pages dropped the hook and their `data-reveal` markers; keeping both would have animated every
section twice. Home and herd keep their GSAP reveal untouched (not in the approved list, and worth a
P3 decision of their own).

**Token note:** the only additions to `tokens.css` are two *durations*. They are not design tokens in
the colour/spacing/radius sense; they exist so the polish request ("one shared set of durations and
easings defined once") has exactly one definition. `--ease-out` already existed and is now the single
easing for every transition and entrance.

### 6.2 Evidence

- `phase-5b-motion/2026-11-14/`: 126 PNG frames — for each of the ten routes × {420, 1440} × {ar, fr},
  the entrance at 0 ms, 125 ms and settled, plus a reduced-motion frame per locale — and
  `manifest.json` with all 585 checks.
- The ar and fr shots of every route and width hash differently (checked, not assumed).
- Entrance: `animation-name: ov-page-in`, duration 250 ms, starts at opacity ≤ 0.05, settles at
  opacity 1 with no transform; `translateX` is 0 in both locales at the mid-frame, `translateY` is
  between 0 and 6 px.
- No layout shift: the page root's `offsetTop`/`offsetWidth`/`offsetHeight` are identical at the start,
  mid and settled frames, and on a client-side route change; measured CLS on first paint is < 0.01 on
  all 40 route/width/locale combinations, and route-change CLS never exceeds the same navigations with
  motion turned off (control run). The residual route-change shift is pre-existing and *larger* with
  motion off — the footer moves while the Suspense skeleton is replaced.
- Reduced motion: entrance reports `animation-name: none`, the document has zero animations, and
  probes confirm `animate-pulse` and `animate-spin` are off as well.
- Transitions: 34 elements on `/journee` all use 150 ms, one easing (`cubic-bezier(0, 0, 0.2, 1)`) and
  no layout property; probes confirm both arbitrary utilities compile, and the tokens report
  150 ms / 250 ms.
- Budget: entry **132.8 kB gzip / 180** (delta **0.0**), lazy 167.0 kB across 48 chunks, CSS 9.8 kB
  (+0.2 kB), fonts 110.3 kB / 120.

### 6.3 Still open (unchanged)

P2-1 (text under 12 px, 684 instances) remains first in the P2 queue and is **not started**; the owner
asked to wait for approval after this report. P2-2/P2-3/P2-4/P2-5 and P3-1/P3-2/P3-3/P3-4 are
unchanged. New P3 candidate: home and herd still load GSAP for their reveal.


## 7. P2-1 - text under 12 px (2026-11-15)

### 7.1 What shipped

44 sub-12 px utilities in 25 files became 12 px: 33 x `text-[11px]` and 11 x `text-[10px]`, zero left in
`src/`. No token changed; `text-xs` is the existing 12 px step. Uppercase micro-labels (page kicker, table
header, stat caption, sidebar group, farm-gate kicker, animal detail labels) share `.ov-micro` - 12 px,
weight 600, `0.06em` tracking (was 0.06-0.16em) and `letter-spacing: 0` in Arabic. Density was solved with
layout, not type: `leading-none` on pills and badges, wrapping, `min-w-0`. Nothing was truncated, hidden or
dropped; the header farm name keeps its full text and `title`, only the visual ellipsis grows.

Two findings beyond the size change, both fixed in the same families:

- **Chart axis text could not be fixed with CSS.** The chart scales its viewBox to the card, so a 10 px
  label rendered at **4.5 px** in the 286 px card at 360. `LineChart` now measures its own width and sizes
  the ticks in viewBox units: **12.02 / 12.01 / 12.04 px rendered** at 360 / 420 / 1440, padding scaled with
  the text.
- **The Arabic chart read backwards.** The x-label row ran right-to-left while the plot stayed
  left-to-right, so the same line meant "rising" in French and "falling" in Arabic. The row is now
  `dir="ltr"` to follow the line: `15 أكتوبر 2026` sits at the left in both locales (DOM-verified, 37 px).
  Mirroring the plot itself for RTL is a separate decision, not a text-size change.

### 7.2 Evidence

`phase-5b-text/2026-11-15/`: 144 before frames (24 routes x 360/420/1440 x ar/fr) and 192 per-family after
frames (`1-chrome` 24, `2-badges` 30, `3-tables` 30, `4-micro-labels` 30, `5-charts-mono` 24 + 6 chart
close-ups, `6-rows-notes` 36 + 6 animal-detail + 6 farm-gate). Every set passes the integrity check
(lang and dir asserted, no byte-identical ar/fr pair).

- Rendered text under 12 px: **2,912 instances -> 0**; SVG icon internals that inherited a size:
  **984 -> 0** (nothing inherits a sub-12 px size any more). Measured over 24 routes x {420,1440} x {ar,fr},
  identical between locales before and after, so the change is structural.
- Layout probe (page overflow, clipped own text, overlapping siblings) on every family page: **0 page
  overflow, 0 overlapping text** in all 24 + 30 + 30 + 36 + 24 combinations measured. The only clipped box
  is the pre-existing header farm-name ellipsis (`title` + full accessible text kept).
- `check:text-size` fails on a `text-[9px]` probe file with file and line and returns ok on the clean tree
  (159 source files); 8 unit tests cover 10 px, 0.7 rem, 8 pt, 9 pt, 12 px, `text-xs`, an allowlisted
  exception, a stale entry and an entry with no reason.
- Budget unchanged: entry 132.8 kB / 180, lazy 167.1 kB across 48 chunks, CSS 9.8 kB.

### 7.3 Arabic verdict at 12 px (Cairo) - no larger minimum needed

Frames read at 360 (the densest case) in both locales: `troupeau-360-ar` (RFID + chips + status), `ration-360-ar`
(table header row), `nutrition-360-fr` (badges + count pill), `vision-360-ar` (kicker + step badges),
`journal-360-fr` (date + severity), `indicateurs-360-ar` (chart ticks), `equipe-360-ar` (department pill,
contact line), `animal-360-ar` (identity labels), `farm-gate-360-ar`. Cairo at 12 px holds the Arabic
letterforms, the dots and the descenders; `.ov-micro` drops tracking to 0 so the cursive joins are not spaced
apart, and no label collides or clips. **12 px is therefore the floor for both scripts and no
`TYPE-SCALE-PROPOSAL.md` is opened.**

### 7.4 Gate

`npm run check:text-size` is gate 15 in `npm run ci` (after `check:domain`); the allowlist starts empty and a
stale entry fails. Documented gate count moved 14 -> 15 in `AGENTS.md`, this file and the audit `HANDOFF.md`.