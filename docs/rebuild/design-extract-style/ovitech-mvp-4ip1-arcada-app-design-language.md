# Design Language: Ovitech v3.0 — MVP Démonstration

> Extracted from `https://ovitech-mvp-4ip1.arcada.app` on November 7, 2026
> 96 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#00d492` | rgb(0, 212, 146) | hsl(161, 100%, 42%) | 4 |
| Secondary | `#009966` | rgb(0, 153, 102) | hsl(160, 100%, 30%) | 2 |
| Accent | `#00786f` | rgb(0, 120, 111) | hsl(176, 100%, 24%) | 1 |

### Tonal Ramps

Generated in OKLCH from each role colour, so the steps are perceptually even. The site's own colour keeps its position in the ladder.

| Role | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| primary | `#b6ffe1` | `#a3ffd3` | `#86f3c0` | **`#00d492`** | `#00be80` | `#009f61` | `#00874e` | `#006e3b` | `#005b2e` | `#004a23` | `#002b10` |
| secondary | `#c6ffe4` | `#b5fdd7` | `#9ceec4` | `#77d7a8` | `#45b885` | **`#009966`** | `#008253` | `#006a40` | `#005733` | `#004727` | `#002813` |
| accent | `#cdfffb` | `#bdf8ef` | `#a6e8df` | `#85d1c7` | `#59b1a7` | `#32938a` | **`#00786f`** | `#01655d` | `#00534c` | `#00433e` | `#002622` |
| neutral | `#f0f6ff` | `#e4eaf6` | `#d3d9e7` | `#b9c0d0` | `#98a0b0` | `#7a8293` | **`#6a7282`** | `#505764` | `#414753` | `#343943` | `#1b1f26` |

### Semantic Pairs

| Role | Background | Foreground | Contrast | Level |
|------|------------|------------|----------|-------|
| `surface.page` | `#0b1220` | `#ffffff` | 18.72:1 | AAA |
| `surface.raised` | `#070d18` | `#ffffff` | 19.45:1 | AAA |
| `action.primary` | `#00d492` | `#000000` | 10.83:1 | AAA * |
| `action.secondary` | `#009966` | `#000000` | 5.75:1 | AA * |
| `action.accent` | `#00786f` | `#ffffff` | 5.36:1 | AA |

\* No colour the site already uses for text reaches 4.5:1 on that surface — the foreground shown is black or white, substituted in.

### Dominance

Share of painted background area — what the page looks like, as opposed to what it declares most often.

- `#0b1220` — 92%
- `#00786f` — 4%
- `#009966` — 3%
- `#ffffff` — 1%
- `#002c22` — 0%

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#e5e7eb` | hsl(220, 13%, 91%) | 100 |
| `#6a7282` | hsl(220, 10%, 46%) | 29 |
| `#ffffff` | hsl(0, 0%, 100%) | 22 |
| `#4a5565` | hsl(216, 15%, 34%) | 18 |
| `#99a1af` | hsl(218, 12%, 64%) | 12 |

### Background Colors

Used on large-area elements: `#0b1220`, `#070d18`, `#009966`, `#00786f`, `#0f172a`

### Text Colors

Text color palette: `#ffffff`, `#6a7282`, `#99a1af`, `#4a5565`, `#5ee9b5`, `#00d492`, `#e5e7eb`

### Gradients

```css
background-image: linear-gradient(to right bottom, rgb(7, 13, 24) 0%, oklab(0.183114 -0.00355966 -0.0306859 / 0.95) 50%, oklab(0.220017 -0.0288864 0.00207976 / 0.9) 100%);
```

```css
background-image: linear-gradient(to right, oklch(0.596 0.145 163.225) 0%, oklch(0.704 0.14 182.503) 50%, oklch(0.765 0.177 163.223) 100%);
```

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#e5e7eb` | text, border | 100 |
| `#6a7282` | text, border | 29 |
| `#ffffff` | text, border, background | 22 |
| `#4a5565` | text, border | 18 |
| `#99a1af` | text, border | 12 |
| `#0b1220` | background | 8 |
| `#5ee9b5` | text, border | 7 |
| `#00d492` | text, border | 4 |
| `#009966` | background | 2 |
| `#00786f` | background | 1 |
| `#002c22` | background | 1 |
| `#006045` | border | 1 |

## Typography

### Font Families

- **Inter** — used for all (18 elements)

### Type System

- **Scale ratio** — 1.125 (major second), anchored at 11px · 100% of sizes sit on the ladder
- **Measure** — ~36 characters per line (narrow, medium confidence from 3 samples)
- **Fluid type** — none; sizes are fixed per breakpoint

### Named Scale

| Role | Size | Weight | Line Height | Tracking |
|------|------|--------|-------------|----------|
| `h1` | 24px / 1.5rem | 400 | 32px | normal |
| `title-1` | 16px / 1rem | 400 | 24px | normal |
| `title-2` | 14px / 0.875rem | 700 | 20px | -0.35px |
| `body` | 12px / 0.75rem | 500 | 16px | normal |
| `body-sm` | 11px / 0.6875rem | 400 | 16.5px | normal |
| `micro` | 10px / 0.625rem | 400 | 15px | normal |

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 24px | 1.5rem | 400 | 32px | normal | span, h1 |
| 16px | 1rem | 400 | 24px | normal | html, head, meta, link |
| 14px | 0.875rem | 700 | 20px | -0.35px | div, p, input, button |
| 12px | 0.75rem | 500 | 16px | normal | label, span, p, button |
| 11px | 0.6875rem | 400 | 16.5px | normal | div, svg, path, button |
| 10px | 0.625rem | 400 | 15px | normal | div, p, svg, path |

### Heading Scale

```css
h1 { font-size: 24px; font-weight: 400; line-height: 32px; }
```

### Body Text

```css
body { font-size: 12px; font-weight: 500; line-height: 16px; }
```

### Font Weights in Use

`400` (85x), `600` (5x), `500` (4x), `700` (2x)

## Spacing

**Base unit:** 4px

| Token | Value | Rem |
|-------|-------|-----|
| spacing-4 | 4px | 0.25rem |
| spacing-8 | 8px | 0.5rem |
| spacing-12 | 12px | 0.75rem |
| spacing-16 | 16px | 1rem |
| spacing-20 | 20px | 1.25rem |
| spacing-24 | 24px | 1.5rem |
| spacing-28 | 28px | 1.75rem |
| spacing-32 | 32px | 2rem |
| spacing-40 | 40px | 2.5rem |
| spacing-64 | 64px | 4rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| lg | 12px | 4 |
| xl | 24px | 1 |

## Elevation

2 levels from 2 raw shadows · neutral tint

**xs** — blur 15px, y 10px, used 1× · 6 layers · tinted (hue 165°)
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.378 -0.0755699 0.0147714 / 0.4) 0px 10px 15px -3px, oklab(0.378 -0.0755699 0.0147714 / 0.4) 0px 4px 6px -4px;
```

**sm** — blur 50px, y 25px, used 1× · 5 layers
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0 0 0 / 0.5) 0px 25px 50px -12px;
```

## CSS Custom Properties

### Colors

```css
--color-cyan-300: oklch(86.5% .127 207.078);
--color-amber-400: oklch(82.8% .189 84.429);
--tw-ring-shadow: 0 0 #0000;
--color-indigo-400: oklch(67.3% .182 276.935);
--color-indigo-300: oklch(78.5% .115 274.713);
--color-cyan-400: oklch(78.9% .154 211.53);
--color-emerald-300: oklch(84.5% .143 164.978);
--color-yellow-600: oklch(68.1% .162 75.834);
--color-pink-500: oklch(65.6% .241 354.308);
--color-violet-600: oklch(54.1% .281 293.009);
--color-red-900: oklch(39.6% .141 25.723);
--color-teal-400: oklch(77.7% .152 181.912);
--color-surface-3: #1a2332;
--color-pink-950: oklch(28.4% .109 3.907);
--color-blue-700: oklch(48.8% .243 264.376);
--color-amber-600: oklch(66.6% .179 58.318);
--color-pink-400: oklch(71.8% .202 349.761);
--color-purple-800: oklch(43.8% .218 303.724);
--tw-inset-ring-shadow: 0 0 #0000;
--color-emerald-700: oklch(50.8% .118 165.612);
--color-indigo-800: oklch(39.8% .195 277.366);
--color-cyan-700: oklch(52% .105 223.128);
--color-blue-300: oklch(80.9% .105 251.813);
--color-gray-300: oklch(87.2% .01 258.338);
--color-yellow-400: oklch(85.2% .199 91.936);
--color-purple-900: oklch(38.1% .176 304.987);
--color-slate-300: oklch(86.9% .022 252.894);
--color-violet-900: oklch(38% .189 293.745);
--color-amber-300: oklch(87.9% .169 91.605);
--color-gray-500: oklch(55.1% .027 264.364);
--color-pink-800: oklch(45.9% .187 3.815);
--color-emerald-600: oklch(59.6% .145 163.225);
--color-violet-400: oklch(70.2% .183 293.541);
--color-pink-900: oklch(40.8% .153 2.432);
--tw-ring-offset-color: #fff;
--color-red-400: oklch(70.4% .191 22.216);
--color-white: #fff;
--color-sky-600: oklch(58.8% .158 241.966);
--color-gray-400: oklch(70.7% .022 261.325);
--color-accent: #10b981;
--color-blue-400: oklch(70.7% .165 254.624);
--color-emerald-100: oklch(95% .052 163.051);
--color-red-800: oklch(44.4% .177 26.899);
--color-red-500: oklch(63.7% .237 25.331);
--color-rose-400: oklch(71.2% .194 13.428);
--color-emerald-200: oklch(90.5% .093 164.15);
--tw-ring-offset-width: 0px;
--color-purple-950: oklch(29.1% .149 302.717);
--color-purple-600: oklch(55.8% .288 302.321);
--color-indigo-600: oklch(51.1% .262 276.966);
--color-amber-800: oklch(47.3% .137 46.201);
--color-fuchsia-600: oklch(59.1% .293 322.896);
--color-sky-700: oklch(50% .134 242.749);
--color-blue-800: oklch(42.4% .199 265.638);
--color-cyan-800: oklch(45% .085 224.283);
--color-violet-700: oklch(49.1% .27 292.581);
--tw-ring-offset-shadow: 0 0 #0000;
--color-blue-100: oklch(93.2% .032 255.585);
--color-gray-800: oklch(27.8% .033 256.848);
--color-orange-700: oklch(55.3% .195 38.402);
--color-surface-2: #111827;
--color-teal-700: oklch(51.1% .096 186.391);
--color-red-300: oklch(80.8% .114 19.571);
--color-indigo-950: oklch(25.7% .09 281.288);
--color-emerald-900: oklch(37.8% .077 168.94);
--color-sky-400: oklch(74.6% .16 232.661);
--color-emerald-950: oklch(26.2% .051 172.552);
--color-amber-500: oklch(76.9% .188 70.08);
--color-orange-400: oklch(75% .183 55.934);
--color-red-700: oklch(50.5% .213 27.518);
--color-rose-600: oklch(58.6% .253 17.585);
--color-green-400: oklch(79.2% .209 151.711);
--color-emerald-500: oklch(69.6% .17 162.48);
--color-blue-500: oklch(62.3% .214 259.815);
--color-gray-900: oklch(21% .034 264.665);
--color-pink-700: oklch(52.5% .223 3.958);
--color-blue-900: oklch(37.9% .146 265.522);
--color-rose-700: oklch(51.4% .222 16.935);
--color-amber-700: oklch(55.5% .163 48.998);
--color-amber-900: oklch(41.4% .112 45.904);
--color-yellow-900: oklch(42.1% .095 57.708);
--color-gray-700: oklch(37.3% .034 259.733);
--color-cyan-600: oklch(60.9% .126 221.723);
--color-surface: #0b1220;
--color-gray-600: oklch(44.6% .03 256.802);
--color-purple-400: oklch(71.4% .203 305.504);
--color-red-100: oklch(93.6% .032 17.717);
--color-blue-600: oklch(54.6% .245 262.881);
--tw-border-style: solid;
--color-amber-950: oklch(27.9% .077 45.635);
--color-cyan-900: oklch(39.8% .07 227.392);
--color-red-600: oklch(57.7% .245 27.325);
--color-border: #243044;
--color-lime-400: oklch(84.1% .238 128.85);
--color-gray-200: oklch(92.8% .006 264.531);
--color-indigo-700: oklch(45.7% .24 277.023);
--color-black: #000;
--color-red-950: oklch(25.8% .092 26.042);
--color-emerald-400: oklch(76.5% .177 163.223);
--color-amber-100: oklch(96.2% .059 95.617);
--color-teal-500: oklch(70.4% .14 182.503);
--color-blue-950: oklch(28.2% .091 267.935);
--color-emerald-800: oklch(43.2% .095 166.913);
--color-amber-200: oklch(92.4% .12 95.746);
```

### Spacing

```css
--spacing: .25rem;
--tw-space-y-reverse: 0;
```

### Typography

```css
--text-2xl: 1.5rem;
--text-lg: 1.125rem;
--text-5xl--line-height: 1;
--text-base--line-height: 1.5;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
--tracking-wider: .05em;
--font-arabic: "Cairo", "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif;
--text-lg--line-height: calc(1.75 / 1.125);
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
--font-weight-bold: 700;
--text-6xl: 3.75rem;
--text-xs--line-height: calc(1 / .75);
--default-font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
--text-xl: 1.25rem;
--leading-relaxed: 1.625;
--leading-snug: 1.375;
--text-2xl--line-height: calc(2 / 1.5);
--tracking-wide: .025em;
--text-xl--line-height: calc(1.75 / 1.25);
--font-weight-semibold: 600;
--text-sm: .875rem;
--leading-tight: 1.25;
--font-weight-extrabold: 800;
--text-4xl: 2.25rem;
--text-sm--line-height: calc(1.25 / .875);
--text-3xl--line-height: 1.2;
--text-5xl: 3rem;
--text-3xl: 1.875rem;
--text-xs: .75rem;
--font-weight-medium: 500;
--font-weight-normal: 400;
--text-6xl--line-height: 1;
--text-4xl--line-height: calc(2.5 / 2.25);
--text-base: 1rem;
--default-mono-font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
--tracking-tight: -.025em;
```

### Shadows

```css
--tw-inset-shadow-alpha: 100%;
--tw-drop-shadow-alpha: 100%;
--tw-inset-shadow: 0 0 #0000;
--tw-shadow-alpha: 100%;
--tw-shadow: 0 0 #0000;
```

### Radii

```css
--radius-2xl: 1rem;
--radius-lg: .5rem;
--radius-3xl: 1.5rem;
--radius-xl: .75rem;
```

### Other

```css
--container-md: 28rem;
--aspect-video: 16 / 9;
--ease-in: cubic-bezier(.4, 0, 1, 1);
--blur-xl: 24px;
--tw-gradient-from: rgba(0, 0, 0, 0);
--blur-3xl: 64px;
--tw-gradient-to: rgba(0, 0, 0, 0);
--tw-scale-z: 1;
--tw-gradient-via-position: 50%;
--container-lg: 32rem;
--tw-gradient-to-position: 100%;
--default-transition-duration: .15s;
--tw-gradient-from-position: 0%;
--ease-in-out: cubic-bezier(.4, 0, .2, 1);
--default-transition-timing-function: cubic-bezier(.4, 0, .2, 1);
--tw-translate-z: 0;
--tw-gradient-via: rgba(0, 0, 0, 0);
--tw-scale-y: 1;
--container-6xl: 72rem;
--container-3xl: 48rem;
--tw-translate-y: 0;
--blur-md: 12px;
--ease-out: cubic-bezier(0, 0, .2, 1);
--animate-spin: spin 1s linear infinite;
--container-2xl: 42rem;
--tw-translate-x: 0;
--tw-scale-x: 1;
--blur-sm: 8px;
```

### Semantic

```css
--color-green-400: oklch(79.2% .209 151.711);
--color-amber-400: oklch(82.8% .189 84.429);
--color-yellow-600: oklch(68.1% .162 75.834);
--color-amber-600: oklch(66.6% .179 58.318);
--color-yellow-400: oklch(85.2% .199 91.936);
--color-amber-300: oklch(87.9% .169 91.605);
--color-amber-800: oklch(47.3% .137 46.201);
--color-amber-500: oklch(76.9% .188 70.08);
--color-amber-700: oklch(55.5% .163 48.998);
--color-amber-900: oklch(41.4% .112 45.904);
--color-yellow-900: oklch(42.1% .095 57.708);
--color-amber-950: oklch(27.9% .077 45.635);
--color-amber-100: oklch(96.2% .059 95.617);
--color-amber-200: oklch(92.4% .12 95.746);
--color-red-900: oklch(39.6% .141 25.723);
--color-red-400: oklch(70.4% .191 22.216);
--color-red-800: oklch(44.4% .177 26.899);
--color-red-500: oklch(63.7% .237 25.331);
--color-red-300: oklch(80.8% .114 19.571);
--color-red-700: oklch(50.5% .213 27.518);
--color-red-100: oklch(93.6% .032 17.717);
--color-red-600: oklch(57.7% .245 27.325);
--color-red-950: oklch(25.8% .092 26.042);
--color-blue-700: oklch(48.8% .243 264.376);
--color-blue-300: oklch(80.9% .105 251.813);
--color-blue-400: oklch(70.7% .165 254.624);
--color-blue-800: oklch(42.4% .199 265.638);
--color-blue-100: oklch(93.2% .032 255.585);
--color-blue-500: oklch(62.3% .214 259.815);
--color-blue-900: oklch(37.9% .146 265.522);
--color-blue-600: oklch(54.6% .245 262.881);
--color-blue-950: oklch(28.2% .091 267.935);
```

## Transitions & Animations

**Easing functions:** `cubic-bezier(0.4, 0, 0.2, 1)`

**Durations:** `0.15s`

### Common Transitions

```css
transition: all;
transition: color 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), outline-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), fill 0.15s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-from 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-via 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-to 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), translate 0.15s cubic-bezier(0.4, 0, 0.2, 1), scale 0.15s cubic-bezier(0.4, 0, 0.2, 1), rotate 0.15s cubic-bezier(0.4, 0, 0.2, 1), filter 0.15s cubic-bezier(0.4, 0, 0.2, 1), -webkit-backdrop-filter 0.15s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.15s cubic-bezier(0.4, 0, 0.2, 1), display 0.15s cubic-bezier(0.4, 0, 0.2, 1), content-visibility 0.15s cubic-bezier(0.4, 0, 0.2, 1), overlay 0.15s cubic-bezier(0.4, 0, 0.2, 1), pointer-events 0.15s cubic-bezier(0.4, 0, 0.2, 1);
```

### Keyframe Animations

**pulse-live**
```css
@keyframes pulse-live {
  0%, 100% { opacity: 1; box-shadow: rgba(16, 185, 129, 0.6) 0px 0px; }
  50% { opacity: 0.85; box-shadow: rgba(16, 185, 129, 0) 0px 0px 0px 8px; }
}
```

**scan-line**
```css
@keyframes scan-line {
  0% { top: 0%; }
  100% { top: 100%; }
}
```

**slide-up**
```css
@keyframes slide-up {
  0% { opacity: 0; transform: translateY(24px); }
  100% { opacity: 1; transform: translateY(0px); }
}
```

**fade-in**
```css
@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

**counter**
```css
@keyframes counter {
  0% { opacity: 0.5; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
```

**spin**
```css
@keyframes spin {
  100% { transform: rotate(360deg); }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (4 instances)

```css
.buttons {
  background-color: oklch(0.596 0.145 163.225);
  color: oklch(0.765 0.177 163.223);
  font-size: 11px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

### Cards (1 instances)

```css
.cards {
  background-color: rgba(15, 23, 42, 0.8);
  border-radius: 24px;
  box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0 0 0 / 0.5) 0px 25px 50px -12px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Inputs (3 instances)

```css
.inputs {
  background-color: rgb(11, 18, 32);
  color: rgb(255, 255, 255);
  border-color: oklab(0.999994 0.0000455678 0.0000200868 / 0.1);
  border-radius: 12px;
  font-size: 14px;
  padding-top: 10px;
  padding-right: 12px;
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Input — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgb(11, 18, 32);
  color: rgb(255, 255, 255);
  padding: 10px 12px 10px 40px;
  border-radius: 12px;
  border: 1px solid oklab(0.999994 0.0000455678 0.0000200868 / 0.1);
  font-size: 14px;
  font-weight: 400;
```

### Button — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: oklch(0.765 0.177 163.223);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px solid oklch(0.765 0.177 163.223);
  font-size: 11px;
  font-weight: 400;
```

### Button — 2 instances, 2 variants

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: oklch(0.551 0.027 264.364);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px solid oklch(0.551 0.027 264.364);
  font-size: 16px;
  font-weight: 400;
```

**Variant 2** (1 instance)

```css
  background: oklch(0.596 0.145 163.225);
  color: rgb(255, 255, 255);
  padding: 12px 0px 12px 0px;
  border-radius: 12px;
  border: 0px solid rgb(255, 255, 255);
  font-size: 14px;
  font-weight: 600;
```

## Layout System

**0 grid containers** and **9 flex containers** detected.

### The System

- **Content column** — 420px wide
  - Width ladder: 420px · 1152px
- **Section rhythm** — 32px vertical padding (ladder: 28px · 32px)
- **Gap scale** — 6px · 8px · 10px

### Container Widths

| Max Width | Padding |
|-----------|---------|
| 100% | 0px |
| 420px | 0px |

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| column/nowrap | 1x |
| row/nowrap | 8x |

**Gap values:** `6px`, `8px`, `10px`

## Accessibility (WCAG 2.1)

**Overall Score: 0%** — 0 passing, 1 failing color pairs

### Failing Color Pairs

| Foreground | Background | Ratio | Level | Used On |
|------------|------------|-------|-------|---------|
| `#ffffff` | `#009966` | 3.65:1 | FAIL | button (1x) |

## Design System Score

**Overall: 82/100 (Grade: B)**

| Category | Score |
|----------|-------|
| Color Discipline | 100/100 |
| Typography Consistency | 90/100 |
| Spacing System | 100/100 |
| Shadow Consistency | 100/100 |
| Border Radius Consistency | 100/100 |
| Accessibility | 0/100 |
| CSS Tokenization | 100/100 |

**Strengths:** Tight, disciplined color palette, Consistent typography system, Well-defined spacing scale, Clean elevation system, Consistent border radii, Good CSS variable tokenization

**Issues:**
- 1 WCAG contrast failures
- 796 duplicate CSS declarations

## Gradients

**2 unique gradients** detected.

| Type | Direction | Stops | Classification |
|------|-----------|-------|----------------|
| linear | to right bottom | 3 | bold |
| linear | to right | 3 | bold |

```css
background: linear-gradient(to right bottom, rgb(7, 13, 24) 0%, oklab(0.183114 -0.00355966 -0.0306859 / 0.95) 50%, oklab(0.220017 -0.0288864 0.00207976 / 0.9) 100%);
background: linear-gradient(to right, oklch(0.596 0.145 163.225) 0%, oklch(0.704 0.14 182.503) 50%, oklch(0.765 0.177 163.223) 100%);
```

## Z-Index Map

**1 unique z-index values** across 1 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| sticky | 10,10 | header.r.e.l.a.t.i.v.e. .z.-.1.0. .f.l.e.x. .i.t.e.m.s.-.c.e.n.t.e.r. .j.u.s.t.i.f.y.-.b.e.t.w.e.e.n. .p.x.-.5. .p.y.-.4. .m.a.x.-.w.-.6.x.l. .m.x.-.a.u.t.o. .w.-.f.u.l.l, main.r.e.l.a.t.i.v.e. .z.-.1.0. .f.l.e.x.-.1. .f.l.e.x. .i.t.e.m.s.-.c.e.n.t.e.r. .j.u.s.t.i.f.y.-.c.e.n.t.e.r. .p.x.-.4. .p.y.-.8 |

## SVG Icons

**6 unique SVG icons** detected. Dominant style: **outlined**.

| Size Class | Count |
|------------|-------|
| xs | 2 |
| sm | 4 |

**Icon colors:** `currentColor`

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| Cairo | google-fonts | 400, 500, 600, 700, 800 | normal |
| Inter | google-fonts | 400, 500, 600, 700, 800 | normal |

**Google Fonts URL:** `https://fonts.googleapis.com/`

## Image Style Patterns

| Pattern | Count | Key Styles |
|---------|-------|------------|
| hero | 1 | objectFit: cover, borderRadius: 0px, shape: square |

**Aspect ratios:** 3:2 (1x)

## Motion Language

**Feel:** mixed · **Scroll-linked:** yes

### Duration Tokens

| name | value | ms |
|---|---|---|
| `xs` | `150ms` | 150 |

### Easing Families

- **custom** (5 uses) — `cubic-bezier(0.4, 0, 0.2, 1)`

## Component Anatomy

### button — 4 instances

**Slots:** label
**Variants:** outline
**Sizes:** xl · medium

| variant | count | sample label |
|---|---|---|
| default | 3 | Mot de passe oublié ? |
| outline | 1 | Se connecter |

## Brand Voice

**Tone:** playful · **Pronoun:** third-person · **Headings:** Sentence case (tight)

### Top CTA Verbs

- **mot** (1)
- **se** (1)
- **s'inscrire** (1)

### Button Copy Patterns

- "mot de passe oublié ?" (1×)
- "se connecter" (1×)
- "s'inscrire" (1×)

### Sample Headings

> Connexion

## Page Intent

**Type:** `landing` (confidence 0.45)
**Description:** Ovitech MVP offline-first — gestion ovine Sidi Bel Abbès, mode rural hors ligne.

## Section Roles

Reading order (top→bottom): nav → hero

| # | Role | Heading | Confidence |
|---|------|---------|------------|
| 0 | nav | — | 0.4 |
| 1 | hero | Connexion | 0.85 |

## Material Language

**Label:** `flat` (confidence 0)

| Metric | Value |
|--------|-------|
| Avg saturation | 0.571 |
| Shadow profile | soft |
| Avg shadow blur | 0px |
| Max radius | 24px |
| backdrop-filter in use | no |
| Gradients | 2 |

## Imagery Style

**Label:** `photography` (confidence 0.45)
**Counts:** total 1, svg 0, icon 0, screenshot-like 0, photo-like 1
**Dominant aspect:** landscape
**Radius profile on images:** square

## Component Library

**Detected:** `tailwindcss` (confidence 0.843)

Evidence:
- tailwind-like class density 80%

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `Inter` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
