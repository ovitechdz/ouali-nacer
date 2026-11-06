# Style-Site Extraction Report

**Target:** `https://ovitech-mvp-4ip1.arcada.app`
**Date:** 2026-11-05
**Purpose:** capture the visual language (fonts, colours, radii, spacing) that
the rebuild must adopt, per the Gate 2 decision that replaced L-1.

**Status:** complete. No value in this report is invented; every token below is
quoted from the compiled CSS or read from computed styles in the running app.
Where the automated extractor (`designlang`) disagreed with the running app,
the running app wins and the discrepancy is recorded in §4.

---

## 1. Provenance and method

| Step | Tool | Output |
|---|---|---|
| Automated extraction | `npx designlang` (see `docs/rebuild/design-extract-style/`) | ~35 artefacts, score 97/100 |
| Compiled CSS | `assets/index-DGhN7NLy.css` (85,696 bytes) | `style-site.css` |
| Live computed styles | Playwright CLI 0.1.23, Chrome 156 headless | `live-tokens-fr.json`, `live-tokens-ar.json` |
| Font probe | canvas metrics + `document.fonts` | `font-probe-ar.json` |
| Google Fonts CSS | fetched with a desktop UA | `google-fonts.css` |
| Colour values | computed `color` from CSS variables | `color-values.json` |
| Screenshots | Playwright CLI, full page | `screenshots/` (44 style-site) |

Session notes:

- The app is a Vite/React SPA titled **“Ovitech v3.0 — MVP Démonstration”**.
- It is gated by `/login`. The login page prints **public demo credentials**;
  a demo account was used only to read the authenticated design. Credentials
  are deliberately not reproduced in this report.
- Four locales are exposed in the header: FR, AR (DZ), EN, ES. AR switches
  `lang=ar`, `dir=rtl`, and applies the Cairo stack.
- The app has **no sidebar**: its modules are a horizontal top bar. The rebuild
  keeps the modules but renders them as a vertical sidebar (D-0024).

---

## 2. Fonts (authoritative)

Declarations in `style-site.css`:

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

Loaded from Google Fonts:

```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cairo:wght@400;500;600;700;800&display=swap
```

| Family | Role | Weights | Licence | Arabic coverage |
|---|---|---|---|---|
| **Inter** | Latin UI/body | 400 500 600 700 800 | OFL | none |
| **Cairo** | Arabic UI/body | 400 500 600 700 800 | OFL | **yes** (U+0600–06FF, U+0750–077F, presentation forms, …) |
| system mono | identifiers | — | system | n/a |

Measured application:

- FR: `font-family: Inter, ui-sans-serif, system-ui, sans-serif`,
  body 16 px / 24 px (1.5).
- AR: `font-family: Cairo, "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif`,
  body 16 px / **27.2 px (1.7)**, `letter-spacing: 0`.
- H1: 24 px / 32 px / 700 in both locales (Cairo renders 32.6 px because of
  Cairo's own metrics).

See `ARABIC-FONT-VERIFICATION.md` for the glyph-coverage proof.

**Rebuild rule:** download and self-host Inter + Cairo WOFF2; never call
Google Fonts at runtime. The reference stack (Fraunces, Manrope, Amiri) is
rejected.

---

## 3. Tokens

### 3.1 Colour

| Token | Value | Hex | Usage |
|---|---|---|---|
| `--color-surface` | `rgb(11,18,32)` | `#0b1220` | page background |
| `--color-surface-2` | `rgb(17,24,39)` | `#111827` | cards, inputs, header base |
| `--color-surface-3` | `rgb(26,35,50)` | `#1a2332` | raised control |
| `--color-border` | `rgb(36,48,68)` | `#243044` | borders and rules |
| `--color-accent` | `rgb(16,185,129)` | `#10b981` | primary actions, active nav |
| body text | `#e5e7eb` | — | body copy |
| headings | `#ffffff` | — | h1–h3 |

Tailwind v4 palette values in use (CSS `oklch()`, resolved by the browser):

| Token | oklch | Approx. role |
|---|---|---|
| `--color-emerald-400` | `oklch(76.5% .177 163.2)` | success text |
| `--color-emerald-500` | `oklch(69.6% .170 162.5)` | accent family |
| `--color-emerald-600` | `oklch(59.6% .145 163.2)` | primary button |
| `--color-amber-400` | `oklch(82.8% .189 84.4)` | warning |
| `--color-red-400` | `oklch(70.4% .191 22.2)` | danger |
| `--color-cyan-400` | `oklch(78.9% .154 211.5)` | info/cameras |
| `--color-blue-400` | `oklch(70.7% .165 254.6)` | info |
| `--color-purple-400` | `oklch(71.4% .203 305.5)` | team/department accent |
| `--color-gray-200/300/400/500` | Tailwind v4 | text hierarchy |

Theme colour declared in the document: `#10b981`.

### 3.2 Shape

| Token | Value | Where measured |
|---|---|---|
| `--radius-lg` | `8px` | chips |
| `--radius-xl` | `12px` | buttons, inputs, search |
| `--radius-2xl` | `16px` | cards, panels, modals |
| `--radius-3xl` | `24px` | large media panels |

### 3.3 Spacing and layout

| Token | Value | Notes |
|---|---|---|
| `--spacing` | `4px` | Tailwind v4 default scale |
| Card padding | `20px` | `p-5` measured on member cards |
| Control height | `42px` | search input measured; buttons 36–40 px |
| Container | `72rem` | `--container-6xl` |
| Header | 128–135 px total (two rows on desktop) | top bar + module row |
| Section gap | 16–24 px | `gap-4` / `gap-6` |

### 3.4 Type scale

| Token | Value | Line height |
|---|---|---|
| `--text-xs` | `12px` | 16px |
| `--text-sm` | `14px` | 20px |
| `--text-base` | `16px` | 24px (Latin) / 27.2px (Arabic) |
| `--text-lg` | `18px` | 28px |
| `--text-xl` | `20px` | 28px |
| `--text-2xl` | `24px` | 32px |
| `--text-3xl` | `30px` | 36px |
| `--text-4xl` | `36px` | 40px |
| `--text-5xl` | `48px` | 1 |
| `--text-6xl` | `60px` | 1 |

Weights: 400 / 500 / 600 / 700 / 800. Tracking: `-0.025em` tight,
`0.025em` wide, `0.05em` wider. Leading: tight 1.25, snug 1.375, relaxed 1.625.

### 3.5 Effects

- Shadows: only the emerald-tinted `shadow-lg` under primary CTAs; cards have
  no shadow, only a 1 px `--color-border`.
- Blur: 8/12/24 px, used for the sticky header and modal backdrop.
- Motion: `--ease-out cubic-bezier(0,0,.2,1)`, default duration 150 ms.
- Focus: `ring-2 ring-accent/50`.

---

## 4. Where `designlang` disagreed with the app

`designlang` is useful for the inventory but is not authoritative. Recorded
discrepancies:

| Item | designlang | Live app | Resolution |
|---|---|---|---|
| Spacing base | 2 px | **4 px** (`--spacing: .25rem`) | use 4 px |
| Fonts | Inter only | **Inter + Cairo** | use both |
| Primary colour | `#1dd075` | accent `#10b981`; primary button `emerald-600` | use `#10b981` |
| Radii | 12 / 24 px | 8 / 12 / 16 / 24 px in use | use the full set |
| Content column | 420 px | container `72rem`, measured 1,200 px+ | 420 px was a narrow probe; ignore |
| Palette | secondary `#005122`, accent `#003028` | not present as UI tokens | ignore; likely sampled from the logo image |

---

## 5. Screenshot index

`docs/rebuild/design-extract-style/screenshots/`

- `style-<route>-1440.png` — 18 routes, desktop 1440 × 1000, full page.
- `style-<route>-420.png` — the same 18 routes, mobile 420 × 900.
- `style-ar-{home,dashboard,cheptel,equipe}-{1440,420}.png` — Arabic RTL.
- `functional/ref-<route>-{1440,420}.png` — the functional reference
  `https://ovitech-saas.vercel.app/`, 24 routes.
- `functional/ref-ar-{home,team}-{1440,420}.png` — functional reference in AR.

Routes captured for the style site: `/`, `/dossier`, `/dashboard`, `/cameras`,
`/cheptel`, `/reproduction`, `/sante`, `/nutrition`, `/hydroponie`, `/iot`,
`/energie`, `/finance`, `/esg`, `/alertes`, `/equipe`, `/contact`, `/roadmap`,
`/architecture`.

Routes captured for the functional reference: `/`, `/journee`, `/scan`,
`/troupeau`, `/troupeau/an-2401`, `/sante`, `/nutrition`, `/ration`,
`/fourrage`, `/energie`, `/indicateurs`, `/journal`, `/sync`, `/preuve`,
`/verification`, `/ecosysteme`, `/ecosysteme/iot`, `/ecosysteme/cameras`,
`/ecosysteme/portails`, `/ecosysteme/balance`, `/vision`, `/investisseurs`,
`/label`, `/team`.

---

## 6. Reproduction commands

```powershell
cd C:\Users\ASUS\ovitech-audit
npx designlang https://ovitech-mvp-4ip1.arcada.app --out docs/rebuild/design-extract-style
playwright-cli --raw open https://ovitech-mvp-4ip1.arcada.app
# log in with the demo credentials printed on /login, then reuse _cap.ps1
```

The extraction scripts are kept at the audit root: `_cap.ps1`, `_cap-ar.ps1`,
`_tokens.js`, `_fontprobe.js`, `_colors.js`.
