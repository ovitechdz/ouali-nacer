# Phase 2 — Arabic-First and RTL Strategy

**Status:** approved at Gate 2; typography amended by D-0022/D-0023
**Decision:** D-0018 — Arabic is the default and only eagerly bundled locale;
D-0022 supersedes L-1 (font stack taken from the style site)
**Evidence:** `VISUAL-REFERENCE-CATALOG.md` §6; defects D-104, K-16, K-19, K-20;
`design-extract-style/EXTRACTION-REPORT.md`;
`design-extract-style/ARABIC-FONT-VERIFICATION.md`

---

## 1. Definition of "Arabic-first"

Arabic-first means the product is **designed in Arabic**, not translated into
it:

1. Arabic is the default locale on first run and the bundled locale.
2. Arabic typography uses the style site's Arabic face (Cairo) with its own
   line-height rule, and no letter-spacing.
3. Layout is built with logical properties from the first component.
4. Domain messages are authored as keys, and the Arabic copy is the reference
   copy for tone and length.
5. Every screen is reviewed in Arabic before it is accepted in French or
   English.
6. Automated tests fail on missing keys, Latin leaks, and RTL layout breaks.

French and English remain fully supported, but they are derived from the
Arabic source of meaning, not the other way round.

---

## 2. Locale policy

| Item | Decision |
|---|---|
| Default locale | `ar` |
| Bundled locale | `ar` (synchronous) |
| Lazy locales | `fr`, `en` |
| Fallback | `ar` (not `fr`) |
| Direction | `rtl` for `ar`, `ltr` for `fr`/`en` |
| Regional locale | `ar-DZ` for dates, numbers and currency |
| Calendar | Gregorian (Algeria) |
| Numbering system | Latin digits (`latn`) for all data, codes and measurements |
| Currency | Algerian dinar, `DZD`, displayed as `1 250 د.ج` |
| Units | kg, g, MJ, %, °C, L — Latin symbols, isolated LTR |
| Date format | `28 أوت 2026` (day month year), time `14:05` |
| First day of week | Monday (Algeria) |

**Why Latin digits:** identifiers (`OV-2401`, RFID), weights, prices and chart
axes are technical data. Mixing Arabic-Indic digits with Latin identifiers
creates bidi ambiguity. Arabic-Indic digits remain available as a preference,
off by default.

---

## 3. Typography

### 3.1 Font stack — taken from the style site (supersedes rejected L-1)

The user rejected the earlier Amiri / IBM Plex Sans Arabic / Fraunces / Manrope
proposal (L-1). The stack below is the **live stack of
`https://ovitech-mvp-4ip1.arcada.app`**, read from the compiled CSS
(`assets/index-DGhN7NLy.css`) and from computed styles in the running app.

| Role | Family (style site) | Weights | License | Source |
|---|---|---|---|---|
| Latin UI / body | **Inter** | 400 500 600 700 800 | OFL | `--font-sans` |
| Arabic UI / body | **Cairo** | 400 500 600 700 800 | OFL | `--font-arabic` |
| Identifiers / code | system mono stack (no download) | — | system | `--font-mono` |

Exact declarations in the style site:

```css
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
             "Liberation Mono", "Courier New", monospace;
--font-arabic: "Cairo", "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif;

html.lang-ar, html.lang-ar body, html.lang-ar #root {
  font-family: var(--font-arabic);
  letter-spacing: 0;
  line-height: 1.7;
}
```

- **Cairo is a genuine Arabic family** with Latin coverage. Verified in-app:
  the Arabic page renders with `font-family: Cairo` and a canvas width probe
  returns 313.6 px for `فريق العمل` at 32 px, against 353–374 px for every
  fallback (Segoe UI, Tahoma, Arial, sans-serif) — Cairo is actually used, not
  silently substituted. Arabic subset faces (per weight) are downloaded and
  report `loaded`. Evidence: `ARABIC-FONT-VERIFICATION.md`.
- No complementary Arabic font is required. **Inter and Cairo together are the
  approved pairing**, subject to the user's confirmation in the presentation of
  this preparation phase.
- No display serif is introduced: the style site has none, so headings use
  Inter (Latin) / Cairo (Arabic) at weight 700, matching the measured 24 px /
  32 px H1.
- `font-mono` remains a system stack for `<bdi>` identifiers, engine versions
  and formulas; it never renders Arabic prose.

### 3.2 Loading

- **Self-hosted WOFF2**, no Google Fonts, no external request. The style site
  loads Inter and Cairo from `fonts.googleapis.com`; the rebuild must download
  those WOFF2 files at build time, commit them and self-host them.
- Weights: Inter 400/500/600/700 (800 optional), Cairo 400/500/600/700 (800
  optional). Arabic and Latin subsets are separate `@font-face` blocks with
  `unicode-range`.
- `font-display: swap` for both families.
- Preload only: Inter 400 (Latin) and Cairo 400 (Arabic).
- Budget: ≤ 60 KB per family for the critical weights; 800 weights lazy.
- CI verifies zero references to `fonts.googleapis.com` or `fonts.gstatic.com`
  in built CSS/HTML.

### 3.3 Type scale (measured from the style site)

The style site uses a compact, product-UI scale — **not** the reference's
editorial 36 px serif headings. Measured values:

| Element | Latin (Inter) | Arabic (Cairo) |
|---|---|---|
| Page h1 | 24 px / 32 px / 700 | 24 px / 32.6 px / 700 |
| Card title h3 | 14 px / 20 px / 700 | 14 px / 20 px / 700 |
| Body | 16 px / 24 px (1.5) | 16 px / **27.2 px (1.7)** |
| Small / label | 12–14 px | 12–14 px |
| Kicker | 12 px uppercase, 0.05em max | 12–13 px, **no uppercase, no tracking** |
| Numeric | tabular where aligned | tabular, Latin digits |

CSS adopted from the style site:

```css
[lang="ar"] {
  letter-spacing: 0;      /* tracking breaks connected script */
  line-height: 1.7;
  font-family: var(--font-arabic);
}
[lang="ar"] h1, [lang="ar"] h2, [lang="ar"] h3 {
  font-family: var(--font-arabic);
  line-height: 1.35;      /* headings stay tighter than body */
}
```

Uppercase transforms are disabled for Arabic (`text-transform: none`), because
Arabic has no letter case and `uppercase` can change glyph shaping in some
engines. The Latin scale keeps the style site's `tracking-wide` (0.025em) for
small labels only.

---

## 4. Layout and direction

### 4.1 Rules

1. **Logical properties only.** `margin-inline-start`, `padding-inline`,
   `inset-inline-start`, `border-inline-start`, `text-align: start`.
2. **No physical properties** in application CSS: ban `left`, `right`,
   `margin-left`, `margin-right`, `padding-left`, `padding-right`, `text-align:
   left/right` outside a small allow-list (charts, decorative).
3. **No directional icons without meaning.** Chevrons and arrows flip with
   `dir`; play/pause, clocks and logos do not. Use a `directional` prop.
4. **Flex/grid order** stays logical; do not hard-code `flex-direction: row`
   assumptions for reading order.
5. **Scrollbars and overflow** use `overflow-inline`.
6. **Fixed shell**: the module list is a **sidebar**, not the style site's top
   navigation. It is fixed on desktop and a Drawer on mobile, and sits on the
   **inline-start edge** — i.e. the **right in RTL**, the left in FR/EN. The
   mobile scan action stays centred.
7. **Navigation order** follows the reference module list, laid out vertically;
   the horizontal top bar of the style site is not reproduced.
8. **Wrap direction**: the sidebar is *fixed*, never `position: sticky` inside
   the content column, so the RTL mirroring cannot depend on flex `order`.

Enforcement:

- Stylelint rules `csstools/use-logical` and a custom ban list.
- ESLint forbids `left/right` Tailwind classes in `src/**` except
  `*-0`/`*-auto` cases reviewed in PR.
- A CI script greps the built CSS for `margin-left|margin-right|padding-left|
  padding-right` and fails on new occurrences.

### 4.2 Bidi isolation

Every non-Arabic token is isolated:

```tsx
<bdi dir="ltr" className="font-mono">OV-2401</bdi>
<bdi dir="ltr">48.2 kg</bdi>
<bdi dir="ltr">DDNE-REF-1.0</bdi>
```

Rules:

- Codes, RFIDs, engine versions, formulas, file names, URLs, e-mails and
  phone numbers → always `<bdi dir="ltr">`.
- Numbers with units inside Arabic sentences → `<bdi dir="ltr">`.
- Dates → formatted by `Intl`, not concatenated.
- No string concatenation of direction-sensitive fragments.
- `unicode-bidi: isolate` on `.ltr-token`; never `bidi-override` on prose.

### 4.3 Icons and imagery

| Element | RTL behaviour |
|---|---|
| Chevron / arrow | mirror |
| Back / next | mirror |
| Search, bell, settings | do not mirror |
| Logo / brand mark | do not mirror |
| Charts (axes, legends) | keep LTR numeric axes; mirror only the reading order of legend text |
| Progress / gauges | keep clockwise sweep (universal) |
| Timeline | read right-to-left: start at the inline-start edge |

---

## 5. Components

| Component | Arabic-first requirement |
|---|---|
| Page header | kicker without tracking/uppercase; h1 at 1.35 line-height |
| Buttons | icon placement uses `gap` and logical order; no fixed widths |
| Inputs | `dir="auto"` for free text; `dir="ltr"` for RFID/weight inputs |
| Tables | numeric columns `dir="ltr"`; header `text-align: start`; no zebra |
| Badges | short Arabic labels; no truncation below 3 words |
| Charts | axis labels via `Intl`; tooltips block-direction aware |
| Toasts | top-center; Arabic text wraps at 320 px |
| Forms | labels above fields; error text below; no inline-only errors |
| Empty states | Arabic sentence + optional action, no illustration text |
| Print | RTL page setup, Arabic fonts embedded, mirrored tables |

---

## 6. Message architecture

### 6.1 Key design

```
herd.title
herd.count_one / herd.count_other
engine.refusal.missingWeight
engine.note.lowBcs
health.signal.scan
audit.approved
errors.import.checksum
```

Rules:

- Keys are semantic, not English sentences.
- No full sentences in code; no French literals in `domain/`.
- Domain returns `{ key, params }`; only the UI calls `t()`.
- Plurals use i18next `_one`/`_other` (Arabic has dual/plural categories;
  i18next supports `_zero/_one/_two/_few/_many/_other`).
- Interpolation values are typed.
- No HTML inside translations except an explicit `<Trans>` allow-list.

### 6.2 Arabic copy rules

- Use MSA, not dialect, for UI; keep Algerian terminology for local objects
  (e.g., «العلف», «الحظيرة», «الولادة»).
- Keep the reference's domain vocabulary where it is correct, and document
  changes in a glossary (`docs/i18n/GLOSSARY.md`).
- Numbers and units stay Latin and isolated.
- Avoid gendered imperatives where a neutral form exists.
- No machine-translated marketing copy on `/vision`, `/investisseurs`,
  `/label`; those pages require human review.

### 6.3 Glossary (initial)

| FR | AR | Notes |
|---|---|---|
| troupeau | القطيع | |
| parc / enclos | الحظيرة | pen |
| ration | الحصة الغذائية | |
| fourrage | العلف الخشن | forage |
| concentré | العلف المركز | concentrate |
| NEC (note d'état corporel) | درجة حالة الجسم | BCS |
| GMQ (gain moyen quotidien) | متوسط الزيادة اليومية | ADG |
| sevrage | الفطام | |
| gestation | الحمل | |
| lactation | الإرضاع | |
| approbation | المصادقة | |
| distribution | التوزيع | serve |
| sauvegarde | نسخة احتياطية | backup |

---

## 7. Translation workflow

1. **Arabic is authored first** for every new string.
2. French and English are added in the same PR; CI fails on missing keys in
   any locale.
3. A **pseudo-locale** (`ar-XB`) wraps strings in markers and lengthens them
   by 30 % to catch truncation.
4. **Latin-leak lint**: for `ar`, flag values containing `[A-Za-z]{3,}` unless
   the key is in an allow-list (brand names, units, identifiers).
5. **Length lint**: warn when Arabic is > 140 % of the French length in a
   constrained component.
6. **Screenshot diff** for AR and FR at 420/768/1024/1440 on every PR that
   touches UI.
7. Human review checklist for tone and terminology before Phase 9.

---

## 8. PDF and print

### ADR-010 — Print-CSS first for Arabic correctness

- Reports are print-optimised HTML at A4, with `@page` margins and running
  headers.
- Arabic shaping is handled by the browser, which is the most reliable
  shaping engine available offline.
- Fonts are the same self-hosted subsets; no separate PDF font embedding.
- `window.print()` → "Save as PDF" is the user path.
- Automated PDF generation for tests uses headless Chromium in CI and
  compares extracted text and rendered pages.

Why not pdfmake: its bidi/shaping support is limited, the bundle is large, and
the reference already shows mixed-direction artefacts. This is a visual
deviation (DEV-07) recorded at Gate 2.

---

## 9. Test matrix

| Test | AR | FR | EN |
|---|---|---|---|
| Key parity | required | required | required |
| Missing-key scan | required | required | required |
| Latin-leak allow-list | required | n/a | n/a |
| Logical-property lint | required | required | required |
| Screenshot 420/768/1024/1440 | required | required | smoke |
| Bidi token snapshots | required | smoke | smoke |
| Print A4 snapshot | required | required | smoke |
| Font-loading offline | required | required | required |
| Numeric formatting | required | required | required |
| RTL drag/scroll behaviour | required | n/a | n/a |

---

## 10. Acceptance criteria

1. Fresh install opens in Arabic, RTL, with no French flash.
2. No Google Fonts or any external font request.
3. No `letter-spacing` applied to Arabic text.
4. No physical `left/right` spacing in application CSS.
5. Every identifier and measurement is bidi-isolated in AR.
6. The Latin-leak lint passes with a documented allow-list.
7. All screens render at 320 px width without horizontal scroll.
8. Print output for the ration sheet and one report is correct in AR.
9. The AR bundle is the only eagerly loaded locale; FR/EN are separate chunks.
10. A screen reader reads Arabic pages with `lang="ar"` and correct direction.

---

## 11. Open questions for Gate 2

| # | Question | Default |
|---|---|---|
| L-1 | ~~Accept Amiri + IBM Plex Sans Arabic + Fraunces + Manrope?~~ **REJECTED** — superseded by D-0022: use the style site's Inter + Cairo (self-hosted) | No |
| L-2 | Accept Latin digits for data by default? | Yes |
| L-3 | Accept print-CSS instead of pdfmake? | Yes |
| L-4 | Accept the Arabic-first authoring workflow? | Yes |
| L-5 | Accept `ar-DZ` formatting with Gregorian calendar? | Yes |
