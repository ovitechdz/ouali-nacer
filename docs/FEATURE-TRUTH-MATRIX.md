# Feature Truth Matrix (A–F) — Phase 1

**Reference:** `ovitechdz/ovitech.saas-` @ `f99cd02`
**Purpose:** classify every claimed capability by what the code actually does, so
the rebuild reproduces real behaviour and never inherits a false claim.

## Truth classes

| Class | Definition | Ship rule |
|---|---|---|
| **A** | Real deterministic domain logic — pure, tested, no simulation | Reproduce with tests |
| **B** | Functional local feature — works end-to-end on-device, no server/multi-user | Reproduce; add backend only if in scope |
| **C** | Simulated capability — explicitly labelled, no hardware/back-end | Reproduce **with the label** |
| **D** | Presentation/content only — no business logic | Reproduce as content, not as evidence |
| **E** | Scaffold or unwired code — exists but unreachable/unused | Complete or remove; never ship silently |
| **F** | Broken, contradictory, or unsafe to ship as-is | Fix before parity claim |

## 1. Identity and herd

| # | Feature | Class | What actually works | Evidence | Gap / decision |
|---|---|---|---|---|---|
| 1.1 | Animal registry (CRUD) | **B** | Create, read, update weight/BCS/pen/notes; unique code/RFID | `store/animals.ts` | No delete/archive UI; add in rebuild |
| 1.2 | RFID scan | **C** | Simulated input, 900 ms animation, 5 presets, ok/unknown/unreadable | `routes/scan.tsx` | No reader; keep “simulé” badge |
| 1.3 | Identity resolution | **A** | RFID exact → code → unknown; failure logged | `resolveScan` | Add fuzzy/checksum rules later |
| 1.4 | Animal enrolment | **B** | Full form, validation, initial weight, `identite` event, outbox row | `registerAnimal` | Add photo/optional fields |
| 1.5 | Pen transfer | **B** | Updates pen, writes `transfert` event | `moveAnimal` | Add reason/date |
| 1.6 | Animal status (sold/dead) | **E** | Type exists; no UI action | `types.ts` | Add lifecycle actions |
| 1.7 | Weight history | **B** | Append-only records, chart, ADG from history | `captureAnimal`, `adgFromHistory` | Add edit/delete with audit |
| 1.8 | RFID hardware integration | **C** | None | `DEMO_VS_REAL.md` | Explicitly out of scope until hardware |

## 2. Nutrition and feeding

| # | Feature | Class | What actually works | Evidence | Gap / decision |
|---|---|---|---|---|---|
| 2.1 | Nutrition engine | **A** | Deterministic ME/DMI/CP/water/mineral formulas, versioned, evidence strings | `nutrition-engine.ts` | Translate strings; inject clock |
| 2.2 | Refusal on missing data | **A** | Refuses without weight/BCS/feed context | `nutrition-engine.ts:48–75` | Preserve exactly |
| 2.3 | Confidence model | **A** | haute / moyenne / insuffisante | `:157–161` | Preserve |
| 2.4 | Per-animal recommendation | **B** | `runEngine` writes rec + event | `store/engine.ts` | Add batch UI |
| 2.5 | Per-pen recommendation | **B** | `runEngineForPen` | `store/engine.ts:144` | Add scheduling |
| 2.6 | Recommendation review | **F** | Approve exists but is unreachable (role fixed to `field`) | `engine.ts:151`, `rec-card.tsx:77`, `seed-state.ts` | **Add authority model** |
| 2.7 | Ration distribution | **F** | `serveRec`/`servePen` gated on approval, so unreachable | `ration.ts:43`, `engine.ts:175` | Same fix as 2.6 |
| 2.8 | Ration sheet | **A/B** | Per-pen aggregation, cost, totals, print | `ration.ts` | Preserve |
| 2.9 | Stock deduction | **A** | Forage/concentrate from lots, covers check, atomic batch | `feed-stock.ts` | Add mineral/water inventory |
| 2.10 | Feed lot availability | **B** | Toggle + stock adjust + events | `store/feed.ts` | Add supplier/lot traceability |
| 2.11 | Feed autonomy / cover days | **B** | Forage stock / daily need | `kpis.ts` | Include concentrate separately |
| 2.12 | Hybrid feed production | **C** | Seed lot only; no production model | `seed.ts`, `/fourrage` | Label as concept |
| 2.13 | Hydroponics | **C** | Static snapshot in `/ecosysteme/iot` | `environment` seed | Label as simulation |
| 2.14 | Ration printing | **B** | `window.print()` with print CSS | `/ration` | Add PDF option |

## 3. Health

| # | Feature | Class | What actually works | Evidence | Gap / decision |
|---|---|---|---|---|---|
| 3.1 | Health signals | **A** | Weight loss, BCS, scan age, gestation window, refusal | `health.ts` | Unify scan threshold |
| 3.2 | Triage levels | **A** | ok/suivi/alerte, vet review flag | `health.ts:87–96` | Preserve |
| 3.3 | Health event log | **B** | Add exam/treatment/birth/observation | `store/health.ts` | Add trim + attachments |
| 3.4 | Veterinary diagnosis | — | **Not claimed** | UI copy | Keep out |
| 3.5 | Treatment protocols | **D** | Text only | presentation | Content only |

## 4. Indicators and audit

| # | Feature | Class | What actually works | Evidence | Gap / decision |
|---|---|---|---|---|---|
| 4.1 | Farm KPIs | **A** | Identification %, data-driven %, mean weight/ADG, cost, cover | `kpis.ts` | Add time windows |
| 4.2 | KPI dictionary | **D** | 8 definitions with formula/source/target | `seed.ts:553` | Keep as reference content |
| 4.3 | KPI history chart | **C** | Seeded 14-day series, not recomputed | `seed.ts:359` | Generate from events or label demo |
| 4.4 | Error journal | **B** | Events + refusals + identity failures | `/journal` | Add filters/export |
| 4.5 | Audit trail | **B** | Append-only local events | store | Add tamper-evidence |
| 4.6 | Evidence pack | **B** | JSON snapshot with disclaimer and counts | `evidence.ts` | Add signature/version |
| 4.7 | Proof replay | **C** | Scripted 5-step store simulation | `proof-replay.tsx` | Label as demo |
| 4.8 | Engine verification cases | **A/B** | TC-01…TC-07 run against live animals | `engine-cases.ts` | Add CI execution |
| 4.9 | Expert sign-off | **B** | Local record of name/specialty/score | `store/signoffs.ts` | Add signature semantics |

## 5. Sync, storage, backup

| # | Feature | Class | What actually works | Evidence | Gap / decision |
|---|---|---|---|---|---|
| 5.1 | IndexedDB persistence | **A/B** | Durable local state, migration, fallback | `indexed-db-storage.ts` | Add quota UX |
| 5.2 | Outbox write | **B** | Animal mutations queued | `animals.ts:1–6` | Extend to all entities |
| 5.3 | Outbox drain | **E** | Never drained | `store/sync.ts` | Implement or remove |
| 5.4 | Sync UI | **C** | Status flip + lastSyncedAt | `sync.tsx` | Replace with real drain |
| 5.5 | Server sync endpoint | **E** | Idempotent upsert + membership, never called by UI | `animals.post.ts` | Wire or remove |
| 5.6 | Conflict simulation | **C** | Manual mark/resolve | `sync.tsx` | Real conflict model |
| 5.7 | Backup export | **A/B** | JSON + SHA-256 + version | `backup.ts` | Add encryption option |
| 5.8 | Backup restore | **A/B** | Validates shape/size/checksum, full replace | `backup.ts` | Add merge/preview diff |
| 5.9 | Reset demo | **B** | Restores seed | `resetDemo` | Keep behind confirm |
| 5.10 | Multi-farm | **E** | `currentFarmId` constant, no switcher | store | Out of MVP or implement |

## 6. PWA and platform

| # | Feature | Class | What actually works | Evidence | Gap / decision |
|---|---|---|---|---|---|
| 6.1 | Installable PWA | **B/C** | Manifest, icons, install button, iOS instructions | `install-button.tsx`, `__grok` | Own manifest/icons |
| 6.2 | App-shell caching | **B** | Navigation + assets cached after first visit | `public/sw.js` | Precache build assets |
| 6.3 | Offline data | **A/B** | All domain data local | IndexedDB | Preserve |
| 6.4 | Offline detection | **C** | Manual toggle only | `app-shell.tsx` | Real `navigator.onLine` |
| 6.5 | Background sync | **E** | None | — | Add if sync in scope |
| 6.6 | Language FR/EN/AR | **A/B** | 1,082 keys × 3, lazy bundles, `dir` switch | `i18n/` | Invert to AR-first |
| 6.7 | RTL layout | **F** | Partial; physical spacing breaks mirroring | components | Full RTL audit |
| 6.8 | Arabic PDF | **B** | Amiri + `rtl` per block | `pdf-engine.ts` | Regression tests |
| 6.9 | Google Fonts | **C** | Network-loaded | `__root.tsx` | Self-host |
| 6.10 | Grok preview bridge | **E** | Host message bridge | `preview-host-bridge.tsx` | Remove |
| 6.11 | Theme | **B** | Dark-only tokens | `styles.css` | Add light theme or state dark-only |

## 7. Auth and tenancy

| # | Feature | Class | What actually works | Evidence | Gap / decision |
|---|---|---|---|---|---|
| 7.1 | Better Auth config | **E** | Server config, OAuth, sessions | `auth/server.ts` | Replace provider |
| 7.2 | Sign-in UI | **E/F** | Gates exist, `/login` missing, no imports | `gates.tsx` | Complete or remove |
| 7.3 | Session gate | **E** | None on routes | `__root.tsx` | Add if multi-user |
| 7.4 | Role model | **F** | `field\|production`, default field, no switch | `types.ts`, store | Explicit authority |
| 7.5 | Farm membership | **E** | Server check used only by unwired endpoint | `farm-auth.server.ts` | Keep for server mode |
| 7.6 | Tenant isolation | **A/E** | `farm_id`, membership, same-site guard | migrations, `isolation.server.ts` | Preserve pattern |
| 7.7 | Dev user fallback | **C** | Synthetic user when auth off | `use-current-user.ts` | Remove or gate |

## 8. Devices and ecosystem

| # | Feature | Class | What actually works | Evidence | Gap / decision |
|---|---|---|---|---|---|
| 8.1 | Camera layer | **C** | Coverage stats only, no feed | `/ecosysteme/cameras` | Keep label |
| 8.2 | Gate/portal layer | **C** | Identification % + scan count | `/ecosysteme/portails` | Keep label |
| 8.3 | Scale layer | **C** | Weight coverage + average | `/ecosysteme/balance` | Keep label |
| 8.4 | IoT climate | **C** | Static pen temp/humidity | `environment` | Keep label |
| 8.5 | Energy management | **C** | Static solar/load/battery + 14-day series | `seed.ts` | Keep label |
| 8.6 | Hardware control | — | **Not present** | — | Do not claim |

## 9. Presentation and business

| # | Feature | Class | What actually works | Evidence | Gap / decision |
|---|---|---|---|---|---|
| 9.1 | Vision page | **D** | 4 pillars, 8 decisions, charts | `/vision` | Content parity |
| 9.2 | Investor dossier | **D** | Narrative + PDF | `/investisseurs` | Content parity |
| 9.3 | Startup Algeria label | **D** | Self-assessment matrix | `/label` | Never imply certification |
| 9.4 | Team page | **B/D** | Real members, local photos, contact links | `/team` | Privacy note |
| 9.5 | Market/financial figures | **D** | Static strings | `/investisseurs` | Mark as projections |
| 9.6 | Capability charts | **D** | Derived from engine cases, presented as scores | `project-charts.tsx` | Label methodology |

## 10. Summary counts

| Class | Count | Share |
|---|---:|---:|
| A — real deterministic | 12 | 15 % |
| B — functional local | 21 | 26 % |
| C — simulated/labelled | 18 | 22 % |
| D — presentation only | 7 | 9 % |
| E — scaffold/unwired | 12 | 15 % |
| F — broken/contradictory | 5 | 6 % |
| Not claimed | 2 | 2 % |
| **Total rows** | **77** | 100 % |

(Counts are approximate; some rows combine A/B because the logic is real but the
persistence is local-only.)

## 11. Rebuild parity rule

For each row:

- **A/B** → reproduce behaviour and cover it with tests.
- **C** → reproduce only with a visible simulation label and a documented
  hardware/back-end gap.
- **D** → reproduce content and structure, but never present it as audited
  evidence or certified results.
- **E** → either finish it (with tests) or remove it; do not inherit dead code.
- **F** → fix before claiming parity.

No row may be upgraded to a stronger class without new code and new evidence.
