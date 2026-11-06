# Routes and Pages — Phase 1 Inventory

**Reference:** `ovitechdz/ovitech.saas-` @ `f99cd02227cd9d6b5325cda21f94b89108b62d26`
**Read-only source:** `C:\Users\ASUS\ovitech-reference`
**Inventory date:** 2026-11-03
**Scope:** every file in `src/routes/` (27 files: 24 page routes, 2 layout routes, 1 root route).

## 1. Route tree

```
__root.tsx                         root document + providers + AppShell
├── /                              index.tsx (Home dashboard)
├── /scan                          scan.tsx
├── /journee                       journee.tsx
├── /troupeau                      troupeau.tsx (layout, <Outlet/>)
│   ├── /troupeau/                 troupeau.index.tsx (herd list)
│   └── /troupeau/$id              troupeau.$id.tsx (animal dossier)
├── /sante                         sante.tsx
├── /nutrition                     nutrition.tsx
├── /ration                        ration.tsx
├── /fourrage                      fourrage.tsx
├── /energie                       energie.tsx
├── /indicateurs                   indicateurs.tsx
├── /journal                       journal.tsx
├── /sync                          sync.tsx
├── /preuve                        preuve.tsx
├── /verification                  verification.tsx
├── /ecosysteme                    ecosysteme.tsx (layout, <Outlet/>)
│   ├── /ecosysteme/               ecosysteme.index.tsx
│   ├── /ecosysteme/cameras        ecosysteme.cameras.tsx
│   ├── /ecosysteme/portails       ecosysteme.portails.tsx
│   ├── /ecosysteme/balance        ecosysteme.balance.tsx
│   └── /ecosysteme/iot            ecosysteme.iot.tsx
├── /vision                        vision.tsx
├── /investisseurs                 investisseurs.tsx
├── /team                          team.tsx
└── /label                         label.tsx
```

There is **no** `/login` route. `src/lib/auth/gates.tsx` declares
`SIGN_IN_PATH = "/login"` but no route file exists, and no page imports the
auth gates. See `SECURITY-AUDIT.md` §5.

## 2. Navigation model

Source: `src/components/app-shell.tsx` lines 49–147.

### Desktop sidebar — six groups

| Group | Leaves |
|---|---|
| `troupeau` | `/journee`, `/troupeau`, `/sante` |
| `nutrition` | `/nutrition`, `/ration` |
| `autonomie` | `/fourrage`, `/energie` |
| `pilotage` | `/indicateurs`, `/preuve`, `/verification`, `/journal`, `/sync` |
| `ecosysteme` | `/ecosysteme` (exact), `/ecosysteme/cameras`, `/ecosysteme/portails`, `/ecosysteme/balance`, `/ecosysteme/iot` |
| `dossier` | `/label`, `/vision`, `/team`, `/investisseurs` |

`/` is reached through the brand mark, not a group. `/scan` is **not**
linked from the desktop sidebar; it is reached from the Home CTA, the daily
worklist, the animal dossier, and the mobile FAB.

### Mobile bottom bar — five slots

`/` (commande), `/journee`, `/scan` (raised FAB), `/troupeau`, `/sync`.

### Shell behaviour

- Sticky sidebar (`lg:` breakpoint, 1024 px), collapsible to 64 px; state stored
  in `localStorage["ovitech-nav-collapsed"]`.
- Sticky header with menu button, language toggle (FR/EN/AR), network badge,
  pending badge, and a manual online/offline switch.
- Skip link to `#contenu`, `print:hidden` on navigation chrome.
- `AppShell` triggers `useFarmStore.persist.rehydrate()` once and polls
  `consumePersistError()` every 1.5 s to warn on IndexedDB write failure.
- **No auth gate wraps the shell.** With the shipped default
  `VITE_AUTH_ENABLED=false`, the app is fully open and uses a synthetic dev user.

## 3. Page-by-page inventory

Legend for “Data”: `AS` animal store, `RC` recommendations, `FD` feed, `EN`
energy, `EV` events, `HE` health events, `WT` weights, `KP` KPI series,
`SG` sign-offs, `SS` session/derived.

### 3.1 `/` — Home dashboard

- **File:** `src/routes/index.tsx` (411 lines)
- **Purpose:** command centre; role-sensitive landing page.
- **Data:** AS, RC, FD, EN, EV, SS.
- **Blocks:**
  - KPI row from `computeFarmKpis`: identified %, data-driven %, cover days,
    mean ADG, active headcount, mean weight, refusals, ration cost.
  - Golden-path flow (5 checks) via `GoldenPath`.
  - Latest recommendation preview + counts of “to review” / “to serve”.
  - Role-dependent stat: `field` → energy autonomy; `production` → forage cover.
  - Role-dependent CTAs: field → `/scan` + `/journee`; production → `/nutrition` + `/indicateurs`.
- **States:** empty herd/recs degrade to zero values; no loading skeleton; no error boundary beyond `error-component.tsx`.
- **Role gate:** presentation only, driven by `useFarmStore.role` (default `"field"`).

### 3.2 `/scan` — RFID / identity capture

- **File:** `src/routes/scan.tsx` (404 lines)
- **Purpose:** simulated individual scan, identity resolution, measurement
  capture, engine trigger, animal enrolment.
- **State machine:** `idle → scanning (900 ms timer) → result`.
- **Presets:** `2401`, `2410` (“sans poids”), `E280-1160-0003`, `9999`
  (unknown), `ERR` (unreadable).
- **Outcomes:**
  - `ok` → record scan, prefill weight/BCS/notes, show animal card.
  - `unknown` → log failure, show enrolment form (code, sex, breed, stage, pen,
    birth date).
  - `unreadable` → log failure with reason, show explanatory card.
- **Actions:** `resolveScan`, `recordScan`, `logScanFailure`, `captureAnimal`,
  `registerAnimal`, `runEngine`.
- **Validation:** `weightSchema` (0 < kg ≤ 1000), `bcsSchema` (1–5),
  `newAnimalSchema`.
- **Offline:** shows a warning banner; the flow still completes locally.
- **Explicitly labelled:** “simulé” badge — no hardware reader.
- **States:** idle, scanning, result, unknown, unreadable, saved-with-rec.

### 3.3 `/journee` — Daily worklist

- **File:** `src/routes/journee.tsx` (268 lines)
- **Purpose:** today’s queues for the field operator.
- **Data:** AS, RC, FD, EV, EN, SS.
- **Counters:** animals to scan (stale scan), animals without weight, rations to
  serve, open sync queue.
- **Queues:** rations to serve, identity rescans, missing data, alerts
  (low BCS + engine refusals).
- **Extras:** offline banner, last 5 events, links to `/scan`, `/ration`,
  `/journal`.
- **States:** empty queue messages for each block; offline banner.

### 3.4 `/troupeau/` — Herd list

- **File:** `src/routes/troupeau.index.tsx` (273 lines)
- **Purpose:** browse, filter, group and export the herd.
- **Filters:** free-text (code/RFID/breed/pen), stage chips, pen chips,
  card/pen grouping toggle.
- **Computed:** latest rec per animal, health status per animal.
- **Actions:** per-pen engine run (visible to `role === "production"` only);
  PDF herd report (`generateRapport`, `OVT-REPORT-01`).
- **States:** empty result card; PDF busy/error toasts; PDF engine warm-up on mount.
- **Note:** PDF warm-up renders an empty document on every mount.

### 3.5 `/troupeau/$id` — Animal dossier

- **File:** `src/routes/troupeau.$id.tsx` (407 lines)
- **Purpose:** single-animal record.
- **Data:** AS, RC, EV, HE, WT.
- **Blocks:** identity header, facts (weight, BCS, age, ADG, gestation), weight
  chart (Recharts), measurement capture (weight/BCS), health-event form
  (`examen`, `traitement`, `vaccination`, `observation`), pen transfer, rec
  history, event journal.
- **Actions:** `captureAnimal`, `addHealthEvent`, `moveAnimal`, `runEngine`.
- **States:** hydration guard (`app.loading.title`), not-found card, empty
  history, no health events.
- **Validation:** weight/BCS schemas; health note required.

### 3.6 `/sante` — Health triage

- **File:** `src/routes/sante.tsx` (177 lines)
- **Purpose:** health signal triage.
- **Signals:** weight loss ≥ threshold, low BCS, missing/stale scan, engine
  refusal, vet review.
- **Counts:** alert / watch / ok.
- **Filters:** all, alerte, suivi, ok.
- **Actions:** none mutating; links to animal dossiers. Production role gets a
  link to `/troupeau` only.
- **States:** per-filter empty message.

### 3.7 `/nutrition` — Recommendations

- **File:** `src/routes/nutrition.tsx` (180 lines)
- **Purpose:** run and review the deterministic nutrition engine.
- **Formula card:** five displayed equations (`app.nutrition.f1..f5`).
- **Actions:** run for one pen (`runEngineForPen`), run for one of the first 8
  active animals (`runEngine`), filter recs.
- **Filters:** all, emitted, refused, to review, to serve.
- **Rendering:** `RecCard` per recommendation, with evidence disclosure,
  approve (production only), serve (gated by `canServe`).
- **States:** no recommendations, refusal toasts with missing-input list.

### 3.8 `/ration` — Ration sheet

- **File:** `src/routes/ration.tsx` (213 lines)
- **Purpose:** printable per-pen ration sheet and batch distribution.
- **Data:** AS, RC, FD, SS.
- **Computed:** `buildRationSheet` → covered/total, ready, served, total forage,
  total concentrate, cost, blocked count, per-pen groups and rows.
- **Actions:** `window.print()`, per-pen engine rerun, per-pen approve
  (production only), per-pen serve (`servePen`), per-row serve (`serveRec`).
- **States:** blocked lot warning, per-row blocked/served/ready/to-review badges,
  `canServe` gate.
- **Gap:** the default role is `field`, so the per-pen approve button and
  `RecCard` approve button are unreachable through the UI. See
  `DOMAIN-FUNCTIONALITY-AUDIT.md` §7.

### 3.9 `/fourrage` — Feed autonomy

- **File:** `src/routes/fourrage.tsx` (299 lines)
- **Purpose:** feed stock and autonomy.
- **Data:** FD, RC, AS, EN.
- **Computed:** forage stock, concentrate stock, concentrate cover days,
  annual cover %, stock value, per-lot cost.
- **Actions:** toggle lot availability (`setFeedAvailable`), adjust stock
  (`adjustFeedStock`), per-pen engine rerun.
- **States:** empty stock, zero need, blocked lots.

### 3.10 `/energie` — Energy

- **File:** `src/routes/energie.tsx` (145 lines)
- **Purpose:** solar/battery demonstrator.
- **Data:** EN.
- **Blocks:** autonomy gauge, solar today, load today, surplus, battery, four
  load priorities, 14-day area chart, explicit demo disclaimer.
- **States:** nominal vs non-nominal badge; chart empty only if series empty.
- **Truth:** simulated data; no inverter or meter integration.

### 3.11 `/indicateurs` — KPIs

- **File:** `src/routes/indicateurs.tsx` (251 lines)
- **Purpose:** management indicators and KPI dictionary.
- **Data:** AS, RC, KP, FD, EN, SS.
- **Blocks:** four gauges, four counters, ADG line chart, identification line
  chart, 8-row KPI dictionary table, PDF export (`OVT-REPORT-02`).
- **States:** cover-days placeholder `—` when undefined; data freshness line;
  PDF busy/error.
- **Note:** the page states the values are demo-sourced
  (`app.indicateurs.demoNote`).

### 3.12 `/journal` — Error and refusal journal

- **File:** `src/routes/journal.tsx` (170 lines)
- **Purpose:** replayable audit of incidents and engine refusals.
- **Filters:** errors = `type === "erreur" || syncStatus ∈ {failed, conflict} || error`.
- **Blocks:** incident count, refusal count, identity-failure count, incident
  list (max 40), refusal list with missing inputs, links to `/sync` and
  `/preuve`, PDF export (`OVT-REPORT-03`).
- **States:** no incidents, no refusals.

### 3.13 `/sync` — Sync, backup, restore

- **File:** `src/routes/sync.tsx` (246 lines)
- **Purpose:** local queue visibility, simulated sync, backup/restore, demo reset.
- **Data:** EV, AS, RC, SS.
- **Actions:**
  - `syncAll()` — simulated; flips `local|pending → synced`.
  - `setFailNextSync` — arms a no-op failure.
  - `markConflict` — marks a local/pending event as conflict.
  - `retryEvent` — failed → pending.
  - `resolveConflict` — keep local or drop.
  - Backup export (`buildBackup`, SHA-256 checksum) and import
    (`parseBackup`, confirmation preview).
  - `resetDemo()`.
- **States:** offline refusal toast, no open events, no local candidate for
  conflict, restore confirmation card, rec sync list (first 8).
- **Truth:** no network request is made by `syncAll`. The server endpoint
  `syncAnimals` exists but is not called by the UI.

### 3.14 `/preuve` — Proof pack

- **File:** `src/routes/preuve.tsx` (233 lines)
- **Purpose:** evidence checklist and JSON evidence pack.
- **Blocks:** 8–10 checks derived from events/animals/recs/network/feed/weights/
  energy/sign-offs; `ProofReplay` (scripted golden-path replay); evidence
  download via `buildEvidencePack` + `downloadEvidence`.
- **States:** pass/fail per check; replay running/step cursor.
- **Truth:** the replay is a scripted demonstration, not a test runner.

### 3.15 `/verification` — Engine verification and sign-off

- **File:** `src/routes/verification.tsx` (151 lines)
- **Purpose:** run the engine test cases and record expert sign-off.
- **Data:** AS, SG.
- **Blocks:** `EngineCasesPanel` (TC-01…TC-07), sign-off form (name,
  specialty `nutrition|élevage`, notes), sign-off list.
- **Actions:** `runAllCases`, `signProtocol`.
- **Validation:** `signoffSchema` (name required).
- **States:** pass/fail per case, empty sign-offs.

### 3.16 `/ecosysteme/` — Device hub

- **File:** `src/routes/ecosysteme.index.tsx` (159 lines)
- **Purpose:** present the four simulated device layers.
- **Stats:** active animals, weighings, 14-day scan coverage %, weight coverage %.
- **Blocks:** concept card with simulation badge, stats, four device cards
  (cameras, gates, scale, IoT), four pillar links.
- **States:** zero-safe percentages; all cards are links.
- **Note:** duplicates `app.ecosysteme.mapTitle` for two different sections.

### 3.17 `/ecosysteme/cameras`

- **File:** `src/routes/ecosysteme.cameras.tsx` (26 lines)
- **Stats:** 14-day scan coverage %, active headcount, recent scans.
- **Body:** `DevicePage` simulation notice only. No camera feed, no images.

### 3.18 `/ecosysteme/portails`

- **File:** `src/routes/ecosysteme.portails.tsx` (26 lines)
- **Stats:** identified %, scan event passages, active headcount.
- **Body:** `DevicePage` simulation notice only.

### 3.19 `/ecosysteme/balance`

- **File:** `src/routes/ecosysteme.balance.tsx` (32 lines)
- **Stats:** weighings count, weight coverage %, average kg.
- **Body:** `DevicePage` simulation notice only.

### 3.20 `/ecosysteme/iot`

- **File:** `src/routes/ecosysteme.iot.tsx` (100 lines)
- **Stats:** battery %, autonomy %, number of pens.
- **Blocks:** climate table per pen (temperature, humidity, status badge),
  hydroponics snapshot (stock kg, trays, cycles/day, temperature, status).
- **Truth:** static seed data (`environment`), labelled simulated.

### 3.21 `/vision` — Project vision

- **File:** `src/routes/vision.tsx` (155 lines)
- **Purpose:** presentation of the four pillars, eight founding decisions
  (FD-01…FD-08), label roadmap, charts, team section, equation, out-of-MVP list.
- **Data:** static presentation strings + `ProjectCharts` + `TeamSection`.
- **States:** static; no async state.

### 3.22 `/investisseurs` — Investor dossier

- **File:** `src/routes/investisseurs.tsx` (481 lines)
- **Purpose:** investor-facing narrative and PDF dossier.
- **Blocks:** five ecosystem layers, capability/claim matrix, market and impact
  figures, references by layer, contact card, PDF generation
  (`generateDossier`, `OVT-DOSSIER`).
- **States:** PDF busy/error toasts; static content otherwise.
- **Note:** business/financial claims are presentation content, not computed
  from farm data.

### 3.23 `/team` — Team

- **File:** `src/routes/team.tsx` (318 lines)
- **Purpose:** real team members with local photo upload.
- **Data:** `TEAM` (4 members), `useTeamPhotoStore`.
- **Actions:** upload/resize photo (≤512 px data URL, local only), remove photo,
  open contact dialog, mail/tel/WhatsApp links.
- **States:** no photo (initials), photo present, dialog open, validation error
  for non-image/oversized file.
- **Privacy:** photos never leave the device (IndexedDB `ovitech-team-photos`).

### 3.24 `/label` — Startup Algeria label

- **File:** `src/routes/label.tsx` (282 lines)
- **Purpose:** self-assessment against the label matrix.
- **Data:** `LABEL_MATRIX`, `MVP_FEATURES`, `BUSINESS_OBJECTIVES`, `OPEN_P0`,
  live counts (animals, recs, pending), sign-offs.
- **Actions:** evidence pack download (`buildEvidencePack` + `downloadEvidence`),
  print, links.
- **States:** matrix pass/partial/fail, open P0 list, signatures list.
- **Truth:** the page is a self-declaration; it does not certify anything
  externally.

### 3.25 Layout routes

- `src/routes/troupeau.tsx` — `<Outlet/>` only.
- `src/routes/ecosysteme.tsx` — `<Outlet/>` only.

### 3.26 Root route

- `src/routes/__root.tsx` (93 lines)
- Providers: `I18nProvider` → `AuthProvider` → `AppShell` → `Outlet`, plus
  `Toaster`, `PreviewHostBridge`, `Scripts`.
- Head: title `OVITECH`, description, `theme-color #08110e`, favicon,
  stylesheet, manifest `/__grok/manifest.webmanifest`, Apple touch icon,
  Google Fonts (Fraunces, IBM Plex Mono, Manrope).
- Static `<html lang="fr" dir="ltr">`; i18n provider rewrites `lang`/`dir` on
  the client.
- Service worker registration on mount (production only).
- `beforeLoad` resets the store during SSR to avoid cross-request leakage.

## 4. Cross-cutting page patterns

| Pattern | Where | Notes |
|---|---|---|
| Page header | all | kicker (gold uppercase) + `font-display text-4xl` title + muted lead |
| Container widths | `max-w-3xl` (scan), `4xl` (journal/animal/sync), `5xl` (journee/nutrition/energie/ecosysteme devices), `6xl` (troupeau/ration/fourrage/indicateurs/ecosysteme hub) | |
| Stat cards | Home, journee, ration, journal, indicateurs, sync, ecosysteme | `Card p-4`, muted uppercase label, tabular number |
| Filter chips | troupeau, sante, nutrition | rounded-full, gold when active |
| Empty states | every list | plain muted sentence, no illustration |
| Loading | animal dossier only | text `app.loading.title`; no skeletons elsewhere |
| Error | root `error-component.tsx` | generic boundary |
| Toasts | mutations | Sonner, dark theme, top-center, offset 72 |
| Print | ration sheet | `no-print` on controls, `print:hidden` in shell |
| i18n | all pages | `useAppT()` for `app.*`, `useAppLang()` for direction |
| RTL | ecosysteme pages and presentation sections | `dir={lang === "ar" ? "rtl" : "ltr"}` |
| Role gating | Home, troupeau, sante, ration, rec-card | only `production` can approve / run per-pen |

## 5. Missing / unreachable routes

| Expected | Status | Evidence |
|---|---|---|
| `/login` | **Missing** | `SIGN_IN_PATH = "/login"` in `src/lib/auth/gates.tsx:17`; no route file |
| Sign-in / sign-out UI | **Unused** | `SignedIn`, `SignedOut`, `RedirectToSignIn`, `UserButton` are never imported by a route |
| 404 route | Not custom | Router default |
| `/api/*` pages | None | Only server routes under `server/routes/api` |
| Role switch | **Missing** | `setRole` exists in the store but is only called from tests |

## 6. Route-level truth summary

| Route | Functional depth | Backend | Hardware | Truth class |
|---|---|---|---|---|
| `/` | Dashboard aggregation | Local store | — | B |
| `/scan` | Full simulated workflow | Local store | Simulated | C |
| `/journee` | Derived queues | Local store | — | B |
| `/troupeau/` | Filters + PDF | Local store | — | B |
| `/troupeau/$id` | Capture + health + transfer | Local store | — | B |
| `/sante` | Derived triage | Local store | — | B |
| `/nutrition` | Deterministic engine | Local store | — | A/B |
| `/ration` | Batch serve + print | Local store | — | B (approve unreachable) |
| `/fourrage` | Stock edits | Local store | — | B |
| `/energie` | Static/simulated series | Seed | Simulated | C |
| `/indicateurs` | Computed KPIs + PDF | Local store | — | B |
| `/journal` | Audit list + PDF | Local store | — | B |
| `/sync` | Simulated sync + real file backup | Local store | — | C (sync), A (backup) |
| `/preuve` | Checklist + JSON evidence + scripted replay | Local store | — | B/C |
| `/verification` | Engine cases + sign-off | Local store | — | B |
| `/ecosysteme/*` | Static/derived device pages | Seed | Simulated | C |
| `/vision` | Presentation | Static | — | E |
| `/investisseurs` | Presentation + PDF | Static | — | E |
| `/team` | Local photo store | Local store | — | B |
| `/label` | Self-assessment + evidence | Local store | — | E/B |

Truth classes are defined in `FEATURE-TRUTH-MATRIX.md`.
