# Visual Reference Catalog — Phase 1

**Reference:** `ovitechdz/ovitech.saas-` @ `f99cd02227cd9d6b5325cda21f94b89108b62d26`
**Visual workspace:** `C:\Users\ASUS\ovitech-visual` (isolated copy, reference `.git` excluded)
**Dev server:** `npm run dev` → `http://localhost:8080`
**Captured:** 2026-11-03
**Screenshots:** `docs/rebuild/visuals/` (41 files, listed in §9)

## 1. Brand and visual direction

OVITECH is presented as an **agritech operations console**, not a consumer app.

- **Mood:** dark, engraved, premium; navy depths with gold rules and a green
  "living" accent.
- **Metaphor:** a printed technical dossier rendered as software — serif
  display type, monospaced identifiers, hairline gold dividers, uppercase
  tracked kickers.
- **Density:** medium. Cards carry one idea each; tables are compact but airy.
- **Colour meaning:** gold = brand/authority/primary action; green = living
  system/confirmation; red = refusal/danger; everything else is navy/ink.

The logo used in the shell is `public/ovitech-logo.jpeg` (a square raster mark:
green shield with gold "OVITECH AGRITECH" wordmark).

## 2. Design tokens

Source of truth: `src/styles.css` (`@theme`, Tailwind v4).

### 2.1 Palette

| Token | Hex | Role in UI |
|---|---|---|
| `navy-950` | `#0a1220` | page background |
| `navy-900` | `#0e1826` | surfaces, sidebar, cards |
| `navy-800` | `#142234` | inputs, secondary surfaces, elevated blocks |
| `navy-700` | `#1c2e44` | borders, grid lines, dividers |
| `gold-300` | `#e7c46b` | focus ring, highlight |
| `gold-500` | `#c9a227` | primary buttons, kickers, active chips |
| `gold-600` | `#aa8823` | hover |
| `gold-700` | `#8a6d1f` | chart frames |
| `green-400` | `#33c285` | accent, chart line, live signal |
| `green-500` | `#1f8f5f` | success/leaf, "ok" badges |
| `green-600` | `#17704e` | darker leaf |
| `green-700` | `#12573a` | darkest leaf |
| `ink-100` | `#f4f1e6` | primary text (warm off-white) |
| `ink-300` | `#c9d2de` | muted text |
| `ink-500` | `#8a96a8` | subtle text, axis labels |
| `danger` | `#b0473e` | errors, refusals |
| `warn` | `#c9a227` | warnings (aliased to gold) |

Semantic aliases: `background`, `foreground`, `card`, `primary`, `primary-foreground`,
`secondary`, `accent`, `destructive`, `ring`, `input`, `border`, `border-strong`,
`muted`, `subtle`, `gold`, `gold-fg`, `leaf`, `leaf-fg`, `ok`, `warn`, `danger`.

**Observation:** `warn` and `gold` are the same value, so warning and brand
accents are visually indistinguishable. The rebuild should separate them.

### 2.2 Typography

| Token | Stack | Observed usage |
|---|---|---|
| `font-display` | Fraunces → ui-serif → Georgia | `h1`–`h3`, big numbers, section titles |
| `font-sans` | Manrope → ui-sans-serif | body, labels, buttons |
| `font-mono` | IBM Plex Mono → ui-monospace | RFID/codes, evidence, formulas, KPI ids |

Scale observed in captures:

| Element | Size / treatment |
|---|---|
| Page `h1` | `text-4xl` (36 px), Fraunces, tight tracking (`-0.035em`), line-height 1.08 |
| Kicker | `text-xs`, uppercase, `tracking-[0.22em]`, gold |
| Section `h2` | `text-2xl`, Fraunces |
| Card title | `text-lg`/`text-base`, Fraunces or Manrope semibold |
| Body / lead | `text-muted`, `line-height 1.7`, max-width ~`max-w-2xl` |
| Micro-label | `text-xs` uppercase, `tracking-[0.18em]` or `0.22em` |
| Numeric | `.tabular` + `font-variant-numeric: tabular-nums` |
| Code / evidence | `text-xs` mono, muted |

Fonts are loaded from **Google Fonts** in `__root.tsx` (Fraunces, IBM Plex Mono,
Manrope). This is a network dependency that breaks strict offline-first.

**Arabic typography gap:** no Arabic webfont is loaded. In the AR capture the
Arabic headings fall back to a system serif/sans that does not match Fraunces,
and Latin identifiers (`OV-2403`, `RFID`, `kg`) dominate inline. The rebuild
must ship Arabic-capable display and text faces and set `font-feature-settings`
for Arabic.

### 2.3 Shape, depth, motion

| Token | Value |
|---|---|
| `radius-xs / sm / md / lg / xl` | 4 / 6 / 8 / 12 / 16 px |
| `radius` (default) | 8 px |
| `shadow-panel` | `0 24px 48px -20px rgb(0 0 0 / .7), 0 6px 16px -8px rgb(0 0 0 / .5)` |
| `shadow-card` | panel + `0 28px 64px -30px rgb(201 162 39 / .24)` (gold halo) |
| `ease-smooth-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |

Background is not flat: two radial gradients sit behind the app —
green at top-left (`rgb(31 143 95 / .10)`) and gold at top-right
(`rgb(201 162 39 / .08)`).

Motion: framer-motion entrances (opacity + 14 px rise, 550 ms), CSS scan rings,
count-up numbers, gauge sweeps. `prefers-reduced-motion` collapses animation
durations globally in CSS.

### 2.4 Surfaces observed

| Surface | Background | Border | Radius | Shadow |
|---|---|---|---|---|
| Card | `navy-900` | `navy-700` 1 px | 8 px | `shadow-card` |
| Elevated card | `navy-900` / `bg-bg-elevated` | `navy-700` | 8 px | card |
| Proof card | `gold/5` tint | `gold/25` | 8 px | card |
| Input | `navy-800` | `border` | 8 px | inset ring |
| Primary button | `gold-500` | none | 6 px | subtle |
| Outline button | transparent | `border` | 6 px | none |
| Badge | tone/15 tint | tone/30 | full | none |
| Filter chip | `navy-800` / gold when active | `navy-700` | full | none |

## 3. App shell

Source: `src/components/app-shell.tsx`.

### 3.1 Desktop (≥ 1024 px)

```
┌──────────────┬──────────────────────────────────────────────────────────┐
│ brand        │ [collapse]            FR EN ع   Réseau  3 à sync  ...    │ 64 px
│ ------------ ├──────────────────────────────────────────────────────────┤
│ ▸ Troupeau   │                                                          │
│ ▸ Nutrition  │   page container: mx-auto max-w-{3xl|4xl|5xl|6xl}        │
│ ▸ Autonomie  │   kicker + h1 + lead                                     │
│ ▸ Pilotage   │   cards / tables / charts                                │
│ ▸ Écosystème │                                                          │
│ ▸ Dossier    │                                                          │
│ 256 / 64 px  │                                                          │
└──────────────┴──────────────────────────────────────────────────────────┘
```

- Sidebar: `w-64` expanded, `w-16` collapsed; collapse state persisted in
  `localStorage["ovitech-nav-collapsed"]`.
- Group headers are buttons with a chevron; leaves are icon + label rows.
- Active leaf: gold icon/label plus a 2 px gold rule on the inline-start edge.
- Header: mobile menu (hidden on desktop), collapse button, spacer, then
  `LangToggle` (FR / EN / ع), network badge (`Réseau` green / `Hors ligne`),
  pending badge (`3 à sync` gold), a manual network toggle button
  (`Couper le réseau` / `Rétablir`), and `Installer`.
- Header and sidebar are `print:hidden`.

### 3.2 Mobile (< 1024 px)

- No sidebar; header keeps menu button, language, network and install.
- Bottom navigation with five slots: `COMMANDE`, `JOURNÉE`, raised circular
  `SCAN` FAB (green ring, gold glyph), `TROUPEAU`, `SYNC`.
- Bottom bar is fixed, safe-area aware, with active item in gold.
- Menu opens a drawer with the same six groups.

### 3.3 Shell chrome details

- Skip link `Aller au contenu` → `#contenu`, visible on focus.
- Body copy sits on `navy-950` with the radial tint; cards are slightly lighter.
- No top-level page title bar; each page draws its own header.

## 4. Page composition patterns

### 4.1 Standard page header

```
KEBAB-CASE KICKER (gold, xs, 0.22em)
Page title (Fraunces, 4xl)
Lead paragraph (muted, max-w-2xl)
optional freshness line (xs, subtle)
```

Every route follows this, with the right-aligned action button on
`troupeau`, `indicateurs`, `journal`, `label`, `ration`.

### 4.2 Stat row

Four-up grid in `Card p-4`: uppercase 11 px label, 24–30 px tabular number,
12 px hint. Used on `/`, `/journee`, `/ration`, `/journal`, `/sync`,
`/indicateurs`, `/ecosysteme`.

### 4.3 Filter chips

Rounded-full pills. Inactive: navy-800 with border; active: gold fill with
navy-950 text. Used on `/troupeau`, `/sante`, `/nutrition`.

### 4.4 Lists

Rows separated by `border-b border-border`, 12–14 px vertical padding, code in
gold mono, secondary metadata in muted, status chip or action button on the far
end. No zebra striping.

### 4.5 Tables

Header row: 11 px uppercase muted, `border-b`. Body: 13–14 px, muted text with
ink-100 for key values. First column often gold mono code. Wrapped in
`overflow-x-auto` on narrow screens.

### 4.6 Cards with disclosure

Evidence blocks use `<details>` with a gold `▸ Preuve / évidence` summary and
mono list inside. This is the recurring "show your work" pattern.

### 4.7 Empty states

A short muted sentence inside the card — no illustration, no CTA. Examples:
"Rien à servir pour l'instant.", "Aucun incident ouvert.", "Aucune
recommandation pour ce filtre."

### 4.8 Print

`/ration` is print-optimised: controls carry `no-print`, shell chrome is
`print:hidden`. Other reports are downloaded as PDF (pdfmake + Amiri).

## 5. Screen-by-screen catalog

Screenshots are `visuals/<route>-1440.png` and `visuals/<route>-420.png`
unless noted. Widths are CSS pixels; the capture viewport is 2600 px tall, so a
page longer than that is clipped at the bottom.

### 5.1 `/` — Commande (home)

- Hero: gold kicker `SMART AGRITECH ECOSYSTEM`, demo pill
  `Données de démonstration`, 2-line Fraunces headline, lead, two CTAs
  (gold "Scanner un animal →", outline "Journée terrain").
- Flow strip `BOUCLE MVP`: five circular nodes connected by a dashed gold line
  (RFID individuel → Saisie Offline First → Nutrition Engine →
  Synchronisation visible → Indicateurs). Reached nodes are green.
- Quick dashboard card with four radial gauges (identification, energy
  autonomy, forage cover, battery) on a glass surface.
- Proof card (gold tint) with two actions; MVP loop checklist card (5 rows,
  green check or numbered circle, `4/5` in title).
- Four KPI stats, then the role-dependent queue (3 cards for `field`), then four
  pillar cards with icons, then "Dernière recommandation" + "Journal terrain"
  side by side, then a herd preview table.
- **Capture anomaly:** the "quick dashboard" and MVP-loop blocks render at
  `opacity: 0` in captures (see §8).

### 5.2 `/journee` — Daily worklist

- Header `OPÉRATEUR TERRAIN / Journée`.
- Four stats: À scanner 12, Sans poids 1, À servir 0, File sync 3.
- Queue cards: "Rations à distribuer 0", "À identifier aujourd'hui 12"
  (rows with code, stage · pen, last scan, `Scanner` button), "Données
  manquantes 1", "Alertes de suivi 2" (NEC / Refus chips), "Journal du matin".
- Count badge is a gold pill; section icons are gold line icons.

### 5.3 `/scan` — RFID scan

- Narrow `max-w-3xl` column, header `GOLDEN PATH · MVP-F01 / Scan RFID`.
- Large centered card: pulsing gold rings around an RFID glyph, mono input
  (`E280-1160-0001` placeholder `E280-1160-0001 ou 2401`), gold `Scanner`
  button.
- Preset chips: `OV-2401`, `OV-2410 (sans poids)`, `RFID 0003`, `Inconnu`,
  `Illisible`.
- Gold `Scan simulé` badge with explanatory line.
- Result states add an animal summary card, measurement form and engine CTA.

### 5.4 `/troupeau` — Herd

- Header `CONNECTED LIVESTOCK INTELLIGENCE / Troupeau`, gold `Rapport PDF`.
- Search input + segmented `Cartes / Par parcs`.
- Two chip rows: stage filters, then pen filters.
- Card grid 2-up on mobile, 3–4-up desktop. Each card: gold mono code, RFID
  mono muted, stage chip top-right, 2×2 facts (Poids, NEC, Âge, GMO), health
  badge (`À surveiller` gold / `Alerte` red), footer `Pen · scan <date>`.
- Pen grouping mode renders per-pen sections with subtotals.

### 5.5 `/troupeau/$id` — Animal dossier

- Identity header with gold code, RFID mono, stage/pen chips, status.
- Facts grid (poids, NEC, âge, GMO, gestation), weight line chart, capture
  form, health-event form, pen transfer, recommendation history, event log.
- Hydration state shows plain centered text.

### 5.6 `/sante` — Health triage

- Three counter cards (alerte / suivi / ok), filter chips, then animal health
  cards with signal badges (`poids`, `NEC`, `scan`, `gestation`, `refus`) and a
  `Revue vétérinaire` flag.

### 5.7 `/nutrition` — Engine

- Header `DATA-DRIVEN NUTRITION ENGINE / Moteur nutritionnel`, lead stating
  "règles déterministes, preuves affichées. Ce n'est pas un modèle
  d'apprentissage."
- "Modèle de référence" card with the five formulas in mono.
- "Calcul par parc" card: pen select + gold `Calculer le parc`; then a row of
  `Calculer OV-xxxx` outline buttons.
- Filter chips with live counts: Toutes 4, Émises, Refus 1, À revoir 2,
  À servir 0.
- Recommendation cards: code + confidence chip (`haute` green,
  `insuffisante` red) + sync chip (`Synchronisé`, `En attente`, `Local`),
  engine version, timestamp, five mono metrics (Fourrage, Concentré, CMV, ME,
  MAT), notes, evidence disclosure, and a footer line naming the reviewer.
- Refusal card uses a red `Refus — poids vif (kg)` line and "Le moteur refuse
  d'inventer une ration sans identité nutritionnelle complète."

### 5.8 `/ration` — Ration sheet

- Six-stat header, print button, per-pen groups with totals, rows with
  status badges (`à revoir`, `prête`, `servie`, `bloquée`), serve/approve
  actions, blocked-lot warnings.

### 5.9 `/fourrage`

- Stock cards, availability toggles, adjust-stock inputs, cover-day gauge,
  per-lot cost, per-pen recalculation.

### 5.10 `/energie`

- Autonomy gauge, solar/load/surplus stats, battery meter, four load-priority
  rows, 14-day solar-vs-load area chart, explicit demo disclaimer.

### 5.11 `/indicateurs`

- Four radial gauges (100 % identification, 75 % data-driven, 1535 j forage,
  0.10 kg/j GMO), one counter card, two line charts (GMO observed, identity
  coverage), and the 8-row KPI dictionary table with mono formulas and
  TBD targets.
- Demo disclaimer sits under the header: "Aucun impact économique mesuré
  (Q-09) · ces chiffres ne sont pas une preuve Label."
- **Capture anomaly:** three of the four counter cards and both chart bodies
  render blank in captures (see §8).

### 5.12 `/journal`

- Header `MVP-F09 · TC-06 / Journal d'erreurs`.
- Three counters (incidents 0, refus moteur 1, identités 0).
- "Incidents de parcours" card with empty sentence, "Refus du moteur" card
  listing OV-2410 / `poids vif (kg)` / `insuffisante` in red.
- Two actions: `Ouvrir la synchro`, `Dossier de preuve`.

### 5.13 `/sync`

- Local queue counters, simulated `Synchroniser` action, failure arming
  switch, conflict mark/resolve controls, backup export/import, demo reset.

### 5.14 `/preuve`

- 8–10 pass/fail checks, scripted replay controls, evidence download.

### 5.15 `/verification`

- TC-01…TC-07 results, run-all action, sign-off form, sign-off list.

### 5.16 `/ecosysteme` and device pages

- Hub: concept card with simulation badge, four stats, four device cards
  (Caméras, Portails, Balance, IoT), four pillar links.
- Device pages share `DevicePage`: header with icon and simulation notice,
  three stat cards, then a body that is usually just the notice. `/iot` adds a
  per-pen climate table and a hydroponics snapshot.
- Visual language: same cards, but noticeably thinner content than the
  operational pages.

### 5.17 `/vision`

- Long presentation page: hero, four pillars, eight founding decisions
  (FD-01…FD-08), label roadmap, four charts, team section, equation block,
  out-of-MVP list.
- Charts are Recharts bars/pie on navy, gold/green series.

### 5.18 `/investisseurs`

- Long dossier: five ecosystem layers, capability/claim matrix, market and
  impact figures, references, contact card, PDF download.
- Density is highest here; text-heavy cards and wide tables.

### 5.19 `/label`

- Self-assessment matrix (pass/partial/fail), MVP feature list, business
  objectives, open P0 list, live counts, signatures, evidence download.

### 5.20 `/team`

- Four member cards with photo or initials, role, contact actions, local
  photo upload; contact dialog.

## 6. Arabic / RTL observations

Evidence: `visuals/home-ar-rtl-790.jpeg` (in-app browser, 790 px, `dir="rtl"`).

What works:

- `document.documentElement.dir` flips to `rtl`; the shell, header order, nav
  and cards mirror correctly.
- Nav labels, page titles, leads, chips and stats are translated.
- Dates localise the month (`28 أوت`).
- Charts and gauges keep LTR orientation, which is acceptable for numeric axes.

What breaks or degrades:

1. **No Arabic webfont.** Headings fall back to a system face; the engraved
   serif identity disappears. Latin words inside Arabic runs (`OVITECH`,
   `RFID`, `MVP`) use Fraunces/Manrope and create a visible style clash.
2. **Mixed-direction strings.** `100 % RFID`, `kg 0.10`, `0.10 kg`, `1535 j`,
   `OV-2403` reorder unpredictably inside RTL text without `dir="ltr"`
   isolation on the numeric spans.
3. **Untranslated fragments.** `app.home.hintPesees` in `ar.json` is
   `" weighs… <arabic>"`, so the UI prints `weighsات فردية`. 219 of 1,082
   Arabic values contain Latin runs; most are legitimate brand/technical terms,
   but this one is a genuine leak.
4. **Physical spacing.** Many components use `pr-4`, `left/right`, and
   `ml/mr`; the mirrored layout shows inconsistent gutters around table
   headers and icon rows.
5. **Engine strings stay French.** Recommendation notes, refusal reasons and
   missing-input labels are hard-coded French inside the domain layer, so AR
   cards contain French sentences (see `DOMAIN-FUNCTIONALITY-AUDIT.md` §2.3).
6. **PDFs** use Amiri and `rtl: true`, which is the only place Arabic shaping
   is deliberate.

## 7. Responsive behaviour observed

| Breakpoint | Behaviour |
|---|---|
| `< 1024 px` | sidebar replaced by drawer + bottom nav with raised SCAN FAB |
| `< 768 px` | page grids collapse to 1 column; stat rows become 2 columns; tables scroll horizontally |
| `≥ 768 px` | 2-column card grids, 4-column stat rows |
| `≥ 1024 px` | sidebar visible, content max-widths apply |
| `≥ 1280 px` | wider `max-w-6xl` pages; no further layout change |

Charts use `ResponsiveContainer` and reflow; radial gauges keep a fixed size
and wrap.

## 8. Capture anomalies (must be verified in Phase 2/4)

Several `Entrance`-wrapped blocks are captured at `opacity: 0`, producing large
empty bands:

- `/` — quick dashboard gauge card and the MVP-loop checklist card.
- `/indicateurs` — three of four counter cards, and both chart bodies.

Verified by DOM inspection: the wrappers exist with the correct height and
text, computed `opacity: "0"`. The blocks with `delay={0}` render; blocks with
`delay={100}`/`delay={120}` stay hidden. This reproduces in the real in-app
Chromium as well as headless Chrome, so it is **not only a screenshot
artifact**.

`Entrance` is `m.div` with `initial={{opacity:0,y:14}}`,
`whileInView={{opacity:1,y:0}}`, `viewport={{once:true, amount:0.12}}`,
`transition={{duration:.55, delay}}`.

Hypothesis: a post-hydration store re-render resets the in-view animation
state while the delayed transition is pending, and the observer does not re-fire
because the element never left the viewport. Phase 2 must decide whether to
keep framer-motion, replace `whileInView` with CSS, or remove entrance
animation entirely — and must add a visual regression test that fails on
`opacity: 0` content.

## 9. Screenshot index

All files are in `docs/rebuild/visuals/`.

| File | Route | Width | Notes |
|---|---|---:|---|
| `home-1440.png` / `home-420.png` | `/` | 1440 / 420 | two Entrance blocks hidden |
| `home-ar-rtl-790.jpeg` | `/` | 790 | Arabic RTL, in-app browser |
| `journee-1440.png` / `journee-420.png` | `/journee` | | full queue |
| `scan-1440.png` / `scan-420.png` | `/scan` | | idle state |
| `troupeau-1440.png` / `troupeau-420.png` | `/troupeau` | | card mode |
| `troupeau-an-2401-1440.png` / `-420.png` | `/troupeau/an-2401` | | dossier |
| `sante` | — | — | not captured (derived from troupeau/health cards) |
| `nutrition-1440.png` / `nutrition-420.png` | `/nutrition` | | 4 recs incl. refusal |
| `ration-1440.png` / `ration-420.png` | `/ration` | | per-pen sheet |
| `fourrage-1440.png` / `fourrage-420.png` | `/fourrage` | | stock |
| `energie-1440.png` / `energie-420.png` | `/energie` | | gauges + area chart |
| `indicateurs-1440.png` / `indicateurs-420.png` | `/indicateurs` | | anomaly |
| `journal-1440.png` / `journal-420.png` | `/journal` | | 1 refusal |
| `sync-1440.png` / `sync-420.png` | `/sync` | | queue + backup |
| `preuve-1440.png` / `preuve-420.png` | `/preuve` | | checklist |
| `verification-1440.png` / `verification-420.png` | `/verification` | | TC cases |
| `ecosysteme-1440.png` / `ecosysteme-420.png` | `/ecosysteme` | | hub |
| `ecosysteme-iot-1440.png` / `ecosysteme-iot-420.png` | `/ecosysteme/iot` | | climate + hydro |
| `vision-1440.png` / `vision-420.png` | `/vision` | | presentation |
| `investisseurs-1440.png` / `investisseurs-420.png` | `/investisseurs` | | dossier |
| `label-1440.png` / `label-420.png` | `/label` | | matrix |
| `team-1440.png` / `team-420.png` | `/team` | | members |

Missing captures: `/sante`, `/ecosysteme/cameras`, `/ecosysteme/portails`,
`/ecosysteme/balance`, `/login` (does not exist), error boundary.
They are described from source and can be captured in Phase 4 if needed.

## 10. Rebuild visual requirements

1. **Reproduce the token set exactly** (names and values), then add
   `--color-warn` as a distinct hue and a full light-theme mapping or an
   explicit dark-only statement.
2. **Self-host all fonts**, including Arabic-capable display/text faces; remove
   Google Fonts.
3. **Keep the shell geometry**: 256/64 px sidebar, 64 px header, 5-slot mobile
   bar with raised SCAN.
4. **Keep the page header grammar**: gold tracked kicker, Fraunces `h1`, muted
   lead, max-width container per page class.
5. **Keep the card/table/chip system** but extract `Stat`, `FilterChip`,
   `Queue`, `Fact`, `AnimalCard` into shared components.
6. **Fix RTL properly**: logical properties (`ms/me/ps/pe/start/end`), `dir`
   isolation on identifiers and numbers, Arabic font stack, and a visual
   regression suite at 420/768/1024/1440 in AR and FR.
7. **Remove entrance animations that can strand content at `opacity: 0`**, or
   gate them behind a tested, reduced-motion-safe implementation.
8. **Label every simulated surface** with the same `Scan simulé` /
   `Données de démonstration` badge treatment.
9. **Keep print styles** for the ration sheet and add print parity for the
   reports that are currently PDF-only.
10. **Ship screenshots as design fixtures**: the 41 captures in
    `docs/rebuild/visuals/` are the visual baseline for Phase 4 acceptance.
