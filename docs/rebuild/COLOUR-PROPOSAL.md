# Colour proposal — pre-Phase 5

**Status:** proposal only. **No design token was changed and no source file was
touched.** This document records what the style site renders, how it maps to the
approved tokens, and the smallest option that satisfies WCAG AA.

**Measured:** 2026-11-08 against the authenticated style site
`https://ovitech-mvp-4ip1.arcada.app` on `/`, `/dashboard`, `/cheptel`,
`/dossier`, `/cameras`, `/sante` and `/equipe` (FR and AR). Values are computed
styles normalised from `oklch()`/`oklab()` to sRGB through a 1×1 canvas, then
cross-checked against `designlang` 13.4.0. The approved values are read from
`src/styles/tokens.css`.

## 1. Token comparison

| Token | Current value | Measured on the style site | Where it is used there | Recommendation |
|---|---|---|---|---|
| `--color-surface` | `#0b1220` | `#0b1220` | Page, body, app root, main background | **Keep.** Exact match. |
| `--color-surface-2` | `#111827` | `#111827` | Cards, tiles, header base; header renders `#101827` because `.glass` is `#111827d9` (85 %) + 12 px backdrop blur | **Keep.** Exact match; the header tint is derived, not a separate token. |
| `--color-surface-3` | `#1a2332` | `#1a2332` | Raised/secondary buttons, table surfaces, dense controls | **Keep.** Exact match. |
| `--color-border` | `#243044` | `#243044` | Card, header and table borders | **Keep.** Exact match. |
| `--color-accent-strong` (solid primary) | `#059669` (Tailwind v3 emerald-600) | `#009966` (Tailwind v4 emerald-600) | Solid CTAs: “Se connecter”, “Démarrer démo”, “Exporter stats”, “Ajouter un animal”, “Télécharger dossier PDF”, “Ajouter”, “Ajouter un membre” | Keep the fill; use `--color-accent-contrast` `#04120c` for the label (5.24:1 on `#009966`, 5.08:1 on `#059669`). See §4. |
| `--color-accent` (text/dot/icon green) | `#10b981` (Tailwind v3 emerald-500) | `#00d492` (Tailwind v4 emerald-400) | 8×8 px status dot, `text-emerald-400` labels/icons, camera icon-only buttons; **never** a solid button fill | Both pass AA/AAA on both dark surfaces. Keep `#10b981` (7.38:1 / 6.99:1) or set `#00d492` for exact site fidelity (9.66:1 / 9.15:1). See §4. |
| Header surface (no token) | — | `#101827` measured; `.glass` = `#111827d9` + 12 px blur | Sticky top bar on every internal page | No token needed. If exact reproduction is required, add `--color-surface-header: #101827`; otherwise document the 85 % surface-2 + blur recipe. |
| `--color-fg` on the header | `#e5e7eb` | `#e5e7eb` | Header text and navigation | **Keep.** 14.35:1 on `#101827`. |

## 2. Tailwind provenance

The style site is built with **Tailwind CSS v4**, whose default palette is
declared in OKLCH. The approved tokens use the older **v3 hex** palette.

| Role | Site value (v4, OKLCH source) | v3 hex equivalent |
|---|---|---|
| Solid primary / emerald-600 | `oklch(59.6% .145 163.225)` → **`#009966`** | `#059669` |
| Text/dot/icon green / emerald-400 | `oklch(76.5% .177 163.223)` → **`#00d492`** | `#34d399` |
| emerald-500 | `oklch(69.6% .17 162.48)` | `#10b981` |
| emerald-700 | `oklch(50.8% .118 165.612)` → `#007a55` | `#047857` |

So `#009966` and `#00d492` are **not arbitrary brand values**; they are the v4
emerald-600 and emerald-400 steps. `#059669` and `#10b981` are the v3 hex
equivalents already adopted in `tokens.css`. The differences are small but real:
`#009966` is slightly more saturated/less blue than `#059669`, and `#00d492` is
brighter than `#10b981`.

## 3. WCAG contrast

Ratios use WCAG 2.x relative luminance on sRGB hex values. Thresholds:
**4.5:1** normal text, **3:1** large text (≥24 px, or ≥18.66 px bold) and UI
components.

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `#ffffff` | `#009966` (v4 solid primary) | **3.65:1** | Fails AA normal text; passes 3:1 large text/UI |
| `#ffffff` | `#059669` (v3 solid primary) | **3.77:1** | Fails AA normal text; passes 3:1 large text/UI |
| `#ffffff` | `#10b981` (v3 accent) | **2.54:1** | Fails both AA text and 3:1 UI |
| `#ffffff` | `#00d492` (v4 accent) | **1.94:1** | Fails both AA text and 3:1 UI |
| `#04120c` (`--color-accent-contrast`) | `#009966` | **5.24:1** | Passes AA normal text |
| `#04120c` | `#059669` | **5.08:1** | Passes AA normal text |
| `#ffffff` | `#047857` (v3 emerald-700) | **5.48:1** | Passes AA normal text |
| `#ffffff` | `#007a55` (v4 emerald-700) | **5.36:1** | Passes AA normal text |
| `#00d492` | `#0b1220` | **9.66:1** | Passes AAA normal text |
| `#00d492` | `#111827` | **9.15:1** | Passes AAA normal text |
| `#10b981` | `#0b1220` | **7.38:1** | Passes AAA normal text |
| `#10b981` | `#111827` | **6.99:1** | Passes AAA normal text |
| `#e5e7eb` | `#101827` (header) | **14.35:1** | Passes AAA normal text |
| `#009966` fill | `#0b1220` page | **5.13:1** | Passes 3:1 UI component boundary |
| `#059669` fill | `#0b1220` page | **4.97:1** | Passes 3:1 UI component boundary |

The solid primary buttons use 14–16 px semibold labels. That is **not** WCAG
“large text”, so the white-on-green pairs at 3.65:1 and 3.77:1 **fail AA for
normal text**. They do pass the 3:1 large-text/UI threshold, and the fill itself
is distinguishable from the page.

## 4. Recommendation (smallest change, fidelity preserved)

1. **Primary button fill: no token change.** Keep the site’s `#009966` (or the
   current `#059669`) as the fill. Change the **label colour** from white to the
   existing `--color-accent-contrast` `#04120c`. That is a component-usage
   change, not a token edit, and yields 5.24:1 (`#009966`) or 5.08:1
   (`#059669`) — AA normal text. The fill stays visually faithful to the site.
2. **If white labels are mandatory,** the smallest fill change is to the
   emerald-700 step: `#007a55` (v4, 5.36:1) or `#047857` (v3, 5.48:1). This is
   one palette step darker and visibly less faithful than option 1; use only if
   the white label is a hard brand requirement.
3. **Accent text/dot/icon: no change required.** `#10b981` already passes AAA on
   both surfaces. For exact site fidelity, the one-line option is
   `--color-accent: #00d492` (also AAA, 9.66:1 / 9.15:1). It is a token change,
   so it is not proposed for this phase; record it as a Phase 5 visual decision.
4. **Header:** no accessibility issue. Add `--color-surface-header: #101827`
   only if pixel-exact reproduction matters; otherwise express it as
   `#111827` at 85 % opacity plus `backdrop-filter: blur(12px)`.

**Bottom line:** no token edit is needed to reach AA while keeping the site’s
primary fill. Use the darker foreground on solid green buttons. The only
outstanding visual choice is whether to swap `--color-accent` from `#10b981` to
`#00d492` for exact v4 fidelity; both are AA-compliant on the approved dark
surfaces.
