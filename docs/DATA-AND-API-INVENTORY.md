# Data and API Inventory — Phase 1

**Reference:** `ovitechdz/ovitech.saas-` @ `f99cd02`
**Sources:** `src/lib/types.ts`, `src/lib/store/*`, `src/lib/indexed-db-storage.ts`,
`src/lib/backup.ts`, `src/lib/db.ts`, `server/`, `migrations/`, `src/lib/seed.ts`.

## 1. Domain model

All domain types are declared in `src/lib/types.ts` (217 lines). The model is
single-farm, local-first, and string-ID based.

### Core entities

| Type | Key fields | Notes |
|---|---|---|
| `Animal` | `id`, `rfid`, `code`, `sex`, `breed`, `birthDate`, `weightKg`, `bcs`, `stage`, `pen`, `status`, `lastScanAt`, `adgKg`, `notes` | Unique `code` and `rfid` per farm at DB level |
| `WeightRecord` | `id`, `animalId`, `kg`, `at`, `syncStatus`, `source` (`seed\|terrain`) | Append-only history |
| `NutritionRec` | `id`, `animalId`, `createdAt`, `engineVersion`, `ration\|null`, `notes[]`, `confidence`, `missingInputs[]`, `evidence[]`, `syncStatus`, `approvedBy`, `servedAt`, `servedBy` | `ration === null` means engine refusal |
| `Ration` | `forageKg`, `concentrateKg`, `mineralG`, `waterL`, `cpPercent`, `meMj`, `dmiKg` | Deterministic output |
| `FarmEvent` | `id`, `type`, `animalId`, `at`, `label`, `detail`, `syncStatus`, `error?` | Audit trail |
| `HealthEvent` | `id`, `animalId`, `type`, `at`, `by`, `note`, `syncStatus` | Clinical log |
| `FeedLot` | `id`, `name`, `kind`, `stockKg`, `costPerKg`, `available`, `origin` | Four kinds |
| `EnergySnapshot` | `solarKwhToday`, `consumedKwhToday`, `batteryPercent`, `autonomyPercent`, `status`, `series[14]` | Simulated |
| `EnvironmentSnapshot` | `pens[]`, `hydroponie` | Simulated climate/hydroponics |
| `KpiPoint` | `day`, `adg`, `feedCost`, `identified` | 14-day series |
| `KpiDef` | `id`, `name`, `formula`, `source`, `baseline`, `target`, `pillar` | 8-row dictionary |
| `ExpertSignoff` | `id`, `name`, `specialty`, `signedAt`, `protocol`, `notes`, `engineVersion`, `passed`, `total`, `caseIds[]` | Local sign-off |

### Enumerations

- `Role = "field" | "production"`
- `NetworkState = "online" | "offline"`
- `SyncStatus = local | pending | syncing | synced | failed | conflict`
- `Stage`: `agneau`, `croissance`, `engraissement`, `brebis_entretien`,
  `brebis_gestation`, `brebis_lactation`, `belier`
- `AnimalStatus`: `actif`, `vendu`, `mort`
- `EventType`: `scan`, `saisie`, `recommandation`, `sync`, `erreur`, `identite`,
  `transfert`, `distribution`
- `HealthEventType`: `examen`, `traitement`, `naissance`, `observation`

### Persisted shape

`FarmData` (`src/lib/store/index.ts:29`) contains 14 keys:

`role`, `network`, `currentFarmId`, `animals`, `events`, `healthEvents`, `recs`,
`feed`, `energy`, `kpiSeries`, `weights`, `signoffs`, `lastSyncedAt`,
`failNextSync`.

`pickFarmData()` (`src/lib/backup.ts:55`) and `partialize` (`index.ts:126`)
must stay in sync; `backup.ts` comments call this a 13-key list but it is 14.

## 2. State management

### Composition

`useFarmStore` is a single Zustand store composed of seven slices:

| Slice | File | Actions |
|---|---|---|
| Core | `store/core.ts` | `setRole`, `setNetwork`, `setFailNextSync` |
| Animals | `store/animals.ts` | `resolveScan`, `recordScan`, `logScanFailure`, `captureAnimal`, `registerAnimal`, `moveAnimal` |
| Feed | `store/feed.ts` | `setFeedAvailable`, `adjustFeedStock` |
| Engine | `store/engine.ts` | `runEngine`, `runEngineForPen`, `approveRec`, `serveRec`, `servePen` |
| Sync | `store/sync.ts` | `syncAll`, `retryEvent`, `markConflict`, `resolveConflict` |
| Signoffs | `store/signoffs.ts` | `signProtocol` |
| Health | `store/health.ts` | `addHealthEvent` |

Root extras: `resetDemo`, `setCurrentFarmId`, `resetStoreForSsr`.

### Persistence

- Store name: `ovitech-farm-v5`; persist `version: 3`.
- `skipHydration: true`; `AppShell` calls `persist.rehydrate()` on mount.
- Storage: `createJSONStorage(() => indexedDbStorage())`.
- IndexedDB database `ovitech`, object store `persist` (DB version 2).
- Automatic one-time migration from `localStorage` legacy value.
- Fallback to `localStorage` when IndexedDB is unavailable.
- Write failures recorded through `recordPersistError()` and surfaced by the
  shell as a toast every 1.5 s.
- Migration `migrateFarmData` is field-by-field, falling back to seed values for
  invalid/missing fields (never all-or-nothing).

### Growth limits

`store/trim.ts`:

- `EVENTS_MAX = 400`
- `RECS_MAX = 200`
- `WEIGHTS_MAX = 200`

`trimSynced` only drops the oldest **synced** rows; unsynced rows are never
dropped. Health events are capped separately at `HEALTH_EVENTS_MAX = 200`
(`store/health.ts:7`) but the trim helper is not applied to them.

## 3. Seed dataset

Source: `src/lib/seed.ts`. Deterministic clock `2026-08-28T10:00:00Z`.

| Entity | Count | Notes |
|---|---:|---|
| Animals | 12 | Ouled Djellal, Rembi; active herd |
| Weight records | 22 | 14-day history |
| Feed lots | 4 | forage, concentrate, hybrid, mineral |
| Recommendations | 4 | mix of emitted/refused |
| Farm events | 4 | scans, entries, recommendation |
| Health events | 3 | |
| KPI definitions | 8 | dictionary |
| KPI series | 14 days | adg, feedCost, identified |
| Pens | 7 | `Engraissement A/B`, `Maternité`, `Parc A/B`, `Parc jeunes`, `Béliers` |
| Breeds | 4 | `Ouled Djellal`, `Rembi`, `Hamra`, `Berbère` |

Farm identity: `FARM = { name: "OVITECH écosystème", region: "Hauts Plateaux — Algérie", flock: "Troupeau Ouled Djellal / Rembi", document: "OVT-PD-02 · v0.9" }`.

Seed IDs are human-readable (`an-2401`, `feed-orge`, `ev-…`), which the tests
and engine cases rely on.

## 4. Data flows

### Write path (local)

```
UI action
  → slice action (Zustand set)
  → persist middleware
  → IndexedDB `persist` (JSON string)
  → (animals slice only) addOutbox() → IndexedDB `outbox` / localStorage fallback
```

### Sync path (simulated)

```
/sync "Synchroniser"
  → syncAll()
      if offline → no-op
      if failNextSync → clear flag, no-op
      else → set all local|pending rows to synced
             set lastSyncedAt = now
  → toast with counts
```

No `fetch`. No server call. The outbox is written but never drained.

### Server path (scaffold, unused by UI)

```
server/routes/api/sync/animals.post.ts
  syncAnimals (createServerFn POST)
    → authMiddleware → requireUserId
    → requireFarmMembership(userId, farmId)
    → getSql()
    → sql.transaction(applyAnimalSyncMutation)
        → claim mutation_id (idempotency)
        → upsert animals by (farm_id, id)
    → { ok, acked, count } | { ok, acked, duplicate } | { ok:false, code }
```

`src/lib/sync-apply.ts` contains the SQL used by the endpoint and is covered by
`sync-apply.test.ts`. The client never imports `syncAnimals`.

## 5. Local storage inventory

| Store | Key / DB | Content | Lifetime |
|---|---|---|---|
| Zustand persist | IndexedDB `ovitech` / `persist` / `ovitech-farm-v5` | 14-key `FarmData` | Durable |
| Outbox | IndexedDB `ovitech` / `outbox` | `OutboxRecord[]` | Durable |
| Outbox fallback | `localStorage["ovitech-outbox-v1"]` | same | Durable |
| Team photos | IndexedDB via `persist` / `ovitech-team-photos` | member id → data URL | Durable |
| Language | `localStorage["ovitech-presentation-lang"]` | `fr\|en\|ar` | Durable |
| Nav collapsed | `localStorage["ovitech-nav-collapsed"]` | `"0"\|"1"` | Durable |
| PWA install stamp | `localStorage["ovitech-pwa-installed"]` | `"1"` | Durable |
| SW registration stamp | `sessionStorage["ovitech-sw-registered"]` | `"1"` | Session |
| Legacy store | `localStorage` key migrated into IndexedDB | old FarmData | Migrated |

No cookies are set by the local-first path. Better Auth would set its own
cookies if enabled.

## 6. Backup format

Source: `src/lib/backup.ts`.

```json
{
  "format": "ovitech-backup",
  "version": 1,
  "exportedAt": "ISO-8601",
  "engine": "DDNE-REF-0.9",
  "checksum": "<sha256 of JSON.stringify(state)>",
  "state": { ...14 keys... }
}
```

Validation on import:

1. Valid JSON and object.
2. `format === "ovitech-backup"`.
3. `version === 1`.
4. Structural candidate: role string, network enum, energy object, 8 array keys,
   each ≤ 50,000 items, total ≤ 200,000, `lastSyncedAt` null|string,
   `failNextSync` boolean, all 14 persisted keys present.
5. SHA-256 checksum equality.

Restore is a full `setState(pendingRestore)` after confirmation. It does **not**
re-run the migration/validation per entity and does not merge. A malicious but
structurally valid backup can replace all local state; this is acceptable for a
single-user local tool but must be a deliberate decision in the rebuild.

## 7. Server API surface

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/api/health` | GET | Liveness/readiness JSON (200/503) | None |
| `syncAnimals` (server fn) | POST | Upsert animal batch with idempotency | `authMiddleware` + farm membership |

`/api/health` details (`server/routes/api/health.ts`):

- Pings Neon via `pg` if `DATABASE_URL` is set (2.5 s timeout).
- Otherwise reports `source: "pglite", ok: false, critical: false`.
- Payload includes commit, env, region, DB check, uptime, RSS.
- `cache-control: no-store`.
- Uses `VERCEL_GIT_COMMIT_SHA`, `VERCEL_ENV`, `VERCEL_REGION` — Vercel coupling
  to remove.

There is **no** REST API for animals, recommendations, feed, health, KPIs,
backup, or auth from the client. Everything is local.

## 8. Database schema

Applied by `scripts/migrate.mjs` when `DATABASE_URL` exists; otherwise PGlite
boots and applies migrations itself.

### `migrations/farms_memberships.sql`

- `farms(id text pk, name, created_at, updated_at)`
- `farm_memberships(id text pk, user_id, farm_id fk, role check OWNER|MANAGER|OPERATOR, created_at, updated_at, unique(user_id, farm_id))`
- Indexes on `user_id`, `farm_id`.

### `migrations/app_core.sql`

- `sync_idempotency(mutation_id, farm_id, created_at, pk(farm_id, mutation_id))`
- `animals(id, farm_id fk, rfid, code, sex, breed, birth_date, weight_kg, bcs, stage, pen, status, last_scan_at, adg_kg, notes, created_at, updated_at, pk(farm_id,id), unique(farm_id,code), unique(farm_id,rfid))`
- Index `animals_farm_id_idx`.

### `migrations/auth/0001_auth.sql`

Better Auth tables (user, session, account, verification, etc.). Read in Phase 1;
not exercised by the shipped local mode.

### Tenant model

- `farm_id` is the tenant key on animals and idempotency.
- `requireFarmMembership` rejects non-members.
- `src/lib/auth/isolation.server.ts` documents sibling-tenant isolation.
- The client store has `currentFarmId = "farm-1"` but no switcher and no
  server-backed farm list.

## 9. Auth surface

| Module | Role | Used by UI? |
|---|---|---|
| `auth/client.ts` | Better Auth client, Grok OAuth, bearer token, preview secret | No |
| `auth/provider.tsx` | `AuthProvider` | Mounted in root, no gate |
| `auth/use-current-user.ts` | Session or dev user | No |
| `auth/gates.tsx` | SignedIn/SignedOut/Redirect/UserButton | **No** |
| `auth/server.ts` | Better Auth server config | Only if auth enabled |
| `auth/verify.server.ts` | `requireUserId` | `authMiddleware` |
| `auth/middleware.ts` | Server-fn auth middleware | `syncAnimals` |
| `auth/farm-auth.server.ts` | `requireFarmMembership` | `syncAnimals` |
| `auth/isolation.server.ts` | Tenant isolation helper | Server |
| `auth/gate-session.server.ts` | Session gating hooks | Server config |
| `auth/gate-identity.server.ts` | Identity gate | Server config |
| `auth/popup.server.ts` | OAuth popup flow | Server |
| `auth/providers.ts` | Grok provider descriptors | Client |
| `auth/preview.ts` | Preview client id/secret fallback | Client/server |
| `auth/email-password.ts` | Email/password helper | Unused |
| `auth/pglite-dialect.ts` | Kysely dialect for PGlite | DB |
| `auth/farm-membership.ts` | Membership types/helpers | Server |

Conclusion: the auth subsystem is a substantial scaffold that the shipped
single-user app never exercises. It is also Grok-coupled. The rebuild should
retain the **server-side** membership/idempotency pattern but replace the
provider and add the missing sign-in route and gates.

## 10. External integrations

| Integration | Where | Status |
|---|---|---|
| Grok auth broker (`auth.grok.me`) | `auth/client.ts`, `auth/preview.ts` | Coupled; excluded from rebuild |
| Grok PWA middleware (`/__grok/*`) | `server/middleware/grok-pwa.ts`, `scripts/grok-pwa-*.mjs` | Required for manifest/icons; replace |
| Google Fonts | `__root.tsx` | Network dependency; self-host |
| Vercel env vars | `server/routes/api/health.ts` | Remove |
| Neon Postgres | `DATABASE_URL`, `src/lib/db.ts` | Optional; host-agnostic |
| PGlite | `@electric-sql/pglite`, `src/lib/db.ts` | Local fallback |
| pdfmake | `pdf-engine.ts` + 4 generators | Client-side PDF |
| Recharts | charts | Client |
| Sonner | toasts | Client |

No AI/LLM API is called anywhere in `src/`. The nutrition engine is pure
arithmetic. Grok is present only as an auth/deployment platform, not as an
inference provider.

## 11. i18n data

| Locale | Keys | JSON size |
|---|---:|---:|
| `fr` | 1,082 | ~59.6 KB |
| `en` | 1,082 | ~55.3 KB |
| `ar` | 1,082 | ~50.1 KB |

- Identical key sets across the three locales (verified by flattening).
- Namespaces: `shell`, `vision`, `pres`, `project`, `investisseurs`, `app`.
- FR is the bundled default; EN/AR are lazy-loaded chunks.
- `frDoc` is read directly during SSR to keep output deterministic.
- Interpolation uses i18next `{{var}}` syntax; `escapeValue: false`.
- Language stored under `ovitech-presentation-lang`; document `lang`/`dir`
  updated client-side.
- **Arabic-first rebuild requirement:** the reference is FR-first. The rebuild
  must invert the default, make AR the bundled locale, and verify RTL layout
  and PDF shaping.

## 12. PDF generation

| Generator | Ref | Content | Fonts |
|---|---|---|---|
| `rapport-pdf.ts` | `OVT-REPORT-01` | Herd report: per-animal health, weight, latest rec | Roboto + Amiri |
| `indicateurs-pdf.ts` | `OVT-REPORT-02` | KPI report with series | Roboto + Amiri |
| `journal-pdf.ts` | `OVT-REPORT-03` | Incident journal with SHA-256 reference | Roboto + Amiri |
| `dossier-pdf.ts` | `OVT-DOSSIER` | Investor dossier | Roboto + Amiri |
| `pdf-engine.ts` | — | Lazy `pdfmake`, VFS fonts, Amiri inline TTF | — |

All PDFs are generated in the browser and downloaded as blobs. No server-side
rendering. Arabic uses `rtl: true` and the Amiri font. `pdf-engine.ts` imports
the Amiri TTF as an inline asset, which inflates the client bundle.

## 13. Data quality observations

1. `backup.ts` header says “13 keys” while the list has 14.
2. `HealthEvent` has no `HEALTH_EVENTS_MAX` trim applied at insertion, unlike
   events/recs/weights.
3. `NutritionRec` is cast with `as any` in `syncAll`/`resolveConflict`
   (`store/sync.ts:53,95`) to bypass a type mismatch.
4. `server/routes/api/sync/animals.post.ts` starts with a UTF-8 BOM.
5. `animals.ts` defines `outboxAnimal` before its imports (valid hoisting, but
   unusual ordering).
6. `setRole` and `setCurrentFarmId` exist but are never used by UI.
7. The store has no schema validation at the boundary; `migrateFarmData`
   accepts any array shape.
8. KPI series are seeded, not recomputed from events; live changes do not
   extend the historical series.
9. `lastScanAt` is updated by `recordScan`, but scan recency in pages is
   computed with `Date.now()` against seed timestamps — the demo will “age”
   as real time passes beyond 2026-09-11.
