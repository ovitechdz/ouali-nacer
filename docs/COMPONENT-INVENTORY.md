# Component Inventory — Phase 1

**Reference:** `ovitechdz/ovitech.saas-` @ `f99cd02`
**Source:** `C:\Users\ASUS\ovitech-reference\src\components\` and `src/styles.css`
**Count:** 16 top-level components, 7 chart components, 5 UI primitives.

## 1. Component map

| Component | File | Lines | Purpose | External deps |
|---|---|---:|---|---|
| `AppShell` | `app-shell.tsx` | 490 | Sidebar, header, mobile nav, network toggle, rehydration, persist-error toast | zustand, router, sonner, lucide |
| `BrandMark` | `brand-mark.tsx` | 20 | Logo mark + wordmark | — |
| `DevicePage` | `ecosysteme-device.tsx` | 77 | Shared layout for the four simulated device pages | router, badge/card, i18n |
| `EngineCasesPanel` | `engine-cases-panel.tsx` | 72 | Renders TC-01…TC-07 results and reset-demo | `engine-cases`, store |
| `GoldenPath` | `golden-path.tsx` | 76 | Five-step flow indicator | store, i18n |
| `HealthStatusBadge` / `HealthSignals` | `health-status.tsx` | 39 | Health level and signal badges | `health`, badge |
| `InstallButton` | `install-button.tsx` | 118 | PWA install prompt with iOS instructions | toast, i18n |
| `LangToggle` | `lang-toggle.tsx` | 30 | FR/EN/AR segmented control | `presentation`, i18n |
| `PreviewHostBridge` | `preview-host-bridge.tsx` | 25 | Grok preview chrome bridge | `preview-host-bridge` lib |
| `ProjectCharts` | `project-charts.tsx` | 268 | Four presentation charts + score logic | Recharts, `engine-cases` |
| `ProofReplay` | `proof-replay.tsx` | 154 | Scripted 5-step golden-path replay | store, timers |
| `RecCard` | `rec-card.tsx` | 121 | Recommendation card with approve/serve | store, `ration`, badge/card |
| `Reveal` | `reveal.tsx` | 45 | IntersectionObserver fade-in, reduced-motion aware | — |
| `SyncChip` | `sync-chip.tsx` | 30 | Sync status chip (local/pending/synced/failed/conflict) | badge, i18n |
| `TeamSection` | `team-section.tsx` | 78 | Presentation team cards | `team`, `Reveal`, `presentation` |
| `TimeText` | `time-text.tsx` | 16 | Hydration-safe relative/absolute time | `format` |
| `CountUp` | `charts/count-up.tsx` | 40 | Animated number | — |
| `Donut` | `charts/donut.tsx` | 80 | SVG donut | — |
| `Ease` | `charts/ease.ts` | 6 | Easing helper | — |
| `Entrance` | `charts/entrance.tsx` | 20 | Delay-based entrance wrapper | — |
| `FlowArrows` | `charts/flow-arrows.tsx` | 70 | Decorative flow arrows | — |
| `StatGauge` | `charts/stat-gauge.tsx` | 110 | SVG radial gauge | — |
| `Badge` | `ui/badge.tsx` | 30 | Tone variants: ok/warn/danger/gold/leaf/muted | CVA |
| `Button` | `ui/button.tsx` | 60 | Variants: default/outline/ghost/leaf; sizes sm/default/lg/icon | CVA, Radix Slot |
| `Card` + `CardHeader`/`CardTitle`/`CardDesc` | `ui/card.tsx` | 30 | Surface container | — |
| `Input` | `ui/input.tsx` | 35 | Text input | — |
| `Spinner` | `ui/spinner.tsx` | 15 | Loading indicator | — |

## 2. App shell anatomy

Source: `src/components/app-shell.tsx`.

```
<div min-h-dvh>
  skip link (#contenu)
  <div flex>
    <aside sticky w-64|w-16  (lg+ only)>
      Brand
      Nav (6 groups, collapsible, icons)
    </aside>
    <div flex-1>
      <header sticky>
        mobile menu button | desktop collapse button | spacer
        LangToggle | network badge | pending badge | network toggle | install button
      </header>
      <main id="contenu">{children}</main>
      (mobile bottom nav with FAB /scan)
    </div>
  </div>
</div>
```

Key behaviours:

- Collapsed state persisted under `ovitech-nav-collapsed`.
- Pending count = `events + healthEvents + recs + weights` with non-synced status.
- Mobile drawer uses a dialog-like overlay; closes on navigation.
- Network is a **manual toggle** — there is no `navigator.onLine` listener and no
  `online`/`offline` event subscription anywhere in `src/`.
- The shell has no sign-in gate and no tenant/farm switcher.

## 3. Design tokens

Source: `src/styles.css` (Tailwind v4 `@theme`).

### Palette

| Token | Value | Usage |
|---|---|---|
| `--color-navy-950` | `#0a1220` | page background |
| `--color-navy-900` | `#0e1826` | surface, elevated |
| `--color-navy-800` | `#142234` | surface-2, input |
| `--color-navy-700` | `#1c2e44` | borders, grid lines |
| `--color-gold-300` | `#e7c46b` | ring, highlight |
| `--color-gold-500` | `#c9a227` | primary, kicker |
| `--color-gold-600` | `#aa8823` | hover |
| `--color-gold-700` | `#8a6d1f` | chart borders |
| `--color-green-400` | `#33c285` | accent, success |
| `--color-green-500` | `#1f8f5f` | leaf / ok |
| `--color-green-600` | `#17704e` | dark leaf |
| `--color-green-700` | `#12573a` | darkest leaf |
| `--color-ink-100` | `#f4f1e6` | foreground |
| `--color-ink-300` | `#c9d2de` | muted |
| `--color-ink-500` | `#8a96a8` | subtle |
| `--color-danger` | `#b0473e` | error |
| `--color-warn` | `#c9a227` | warning (same as gold) |

Semantic aliases: `background`, `foreground`, `card`, `primary`, `secondary`,
`accent`, `destructive`, `ring`, `input`, `border`, `border-strong`, `gold`,
`gold-fg`, `leaf`, `leaf-fg`, `ok`, `warn`, `danger`, `muted`, `subtle`.

### Typography

| Token | Family | Usage |
|---|---|---|
| `font-display` | Fraunces (serif fallback) | headings, big numbers |
| `font-sans` | Manrope | body |
| `font-mono` | IBM Plex Mono | RFID, codes, evidence, formulas |

Fonts are loaded from Google Fonts in `__root.tsx` — a network dependency that
contradicts strict offline-first and must be self-hosted in the rebuild.

### Radii, shadows, effects

- `--radius-xs/sm/md/lg/xl` (4/6/10/14/20 px class scale).
- Glass/gradient utility classes in `styles.css` include `glass-card`,
  `orb-ring`, `orb-ring-delay`, scan pulse.
- Motion: `prefers-reduced-motion` respected in `Reveal`; CSS animations for
  scan rings, count-up, gauge.

### Directionality

- Static root: `lang="fr" dir="ltr"`.
- i18n provider applies `document.documentElement.lang` and `dir` on the client
  from the selected language (`ar` → `rtl`).
- Several presentation/device pages set a local `dir` attribute as well.
- Logical utilities (`ms-*`, `me-*`, `text-start`) are used inconsistently:
  many components use physical `left/right` or `pr-4`, which will mirror
  incorrectly in RTL. This is a rebuild task.

## 4. UI state coverage

| State | Coverage in reference | Gap for rebuild |
|---|---|---|
| Empty list | Plain sentence per page | No illustration/CTA pattern |
| Loading | Only animal dossier | No skeletons; PDF warm-up is silent |
| Error | Root error boundary | No per-route retry |
| Offline | Manual banner + badge | No real connectivity detection |
| Permission denied | Not implemented | No disabled/explained state |
| Validation error | Inline toast only | No field-level messages |
| Success | Toast | No optimistic UI beyond Zustand |
| Long content | Tables with `overflow-x-auto` | Cards not virtualised |
| Reduced motion | `Reveal` only | Charts/counters still animate |
| Print | Ration sheet only | Other reports are PDF downloads |

## 5. Chart inventory

| Chart | File | Data | Notes |
|---|---|---|---|
| Radial gauge | `charts/stat-gauge.tsx` | value, max, unit, tone | SVG, accessible label |
| Count-up | `charts/count-up.tsx` | numeric value | requestAnimationFrame |
| Donut | `charts/donut.tsx` | segments | SVG |
| Entrance | `charts/entrance.tsx` | delay | opacity/translate |
| Flow arrows | `charts/flow-arrows.tsx` | — | decorative |
| ADG line | `indicateurs.tsx` | `kpiSeries.adg` | Recharts |
| Identification line | `indicateurs.tsx` | `kpiSeries.identified` | Recharts, domain 70–100 |
| Energy area | `energie.tsx` | `energy.series` | solar vs load |
| Weight line | `troupeau.$id.tsx` | weight records | Recharts |
| Capability bars | `project-charts.tsx` | engine case scores | Recharts |
| Pillar pie | `project-charts.tsx` | capability distribution | Recharts |

Recharts is the heaviest client dependency; the rebuild should keep the same
visual language but consider a lighter chart layer.

## 6. Reusable vs page-local

**Reusable as-is (design intent):** `Badge`, `Button`, `Card`, `Input`,
`Spinner`, `StatGauge`, `CountUp`, `Donut`, `Entrance`, `Reveal`, `SyncChip`,
`TimeText`, `HealthStatusBadge`, `HealthSignals`, `RecCard`, `DevicePage`,
`GoldenPath`, `EngineCasesPanel`.

**Page-local and should be extracted in the rebuild:** `Stat`, `MiniStat`,
`KpiCard`, `GaugeCard`, `FilterChip`, `Queue`, `Row`, `AnimalCard`,
`HealthCard`, `Fact`, `MemberPhoto`.

**Reference-only / not to port as-is:** `PreviewHostBridge` (Grok coupling),
`ProjectCharts` presentation scoring (hard-coded capability claims),
`TeamSection` presentation variant.

## 7. Accessibility observations

Positive:
- Skip link, `aria-pressed` on filter chips and language toggle,
  `aria-label` on gauges and chart regions, `role="status"` on hydration
  loading, table headers, visible focus rings in the token set.

Gaps:
- Icon-only buttons in the header rely on labels but lack tooltips.
- Mobile drawer does not trap focus or restore focus on close.
- Colour contrast of `ink-500` on `navy-900` is borderline for small text.
- Toasts are the only error surface; they are not announced with `aria-live`
  regions by the app (Sonner provides its own).
- Charts have `role="img"` + label but no data table alternative.
- `dir` is toggled at runtime but physical spacing utilities break RTL.

## 8. Component-level truth notes

- `RecCard` exposes **approve** only when `role === "production"` and
  **serve** only when `canServe(rec).ok`. Both are correct gates, but no UI can
  set the role. The rebuild must expose an explicit role/authority model.
- `ProofReplay` drives real store actions with fixed timers; it is a demo, not a
  test harness, and should be labelled as such.
- `InstallButton` stores an install stamp in `localStorage` and uses
  `beforeinstallprompt`; iOS path is instructional only.
- `SyncChip` maps five statuses; `syncing` exists in the type but no UI sets it.
- `DevicePage` is a thin presentational shell and can be reused for any
  “simulated device” screen, provided the simulation badge stays visible.
