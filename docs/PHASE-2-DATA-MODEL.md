# Phase 2 — Data Model, Persistence and Migrations

**Status:** proposed, awaiting Approval Gate 2
**Companions:** `PHASE-2-ARCHITECTURE.md`, `DATA-AND-API-INVENTORY.md`
**Constraint:** single-user local-first. One farm per device. No server.

---

## 1. Principles

1. **One document, one farm.** The MVP persists a single `FarmDocument`.
   `farmId` still exists on every entity to keep a future sync path open.
2. **Append-only history.** Weights, health events, audit events and
   recommendations are never edited in place; corrections are new records.
3. **Derived values are not stored.** KPIs, health status, coverage and ration
   sheets are computed from source records on read.
4. **Every write validates.** Zod at form, repository and import boundaries.
5. **Every migration is a pure function with fixtures.** No ad-hoc field
   patching at runtime.
6. **No fake history in production.** Seed series are demo-only and labelled.

---

## 2. Identifier strategy

### ADR-007 — ULID for local records, opaque `farmId`

- Local record ids: **ULID** (26 chars, lexicographically sortable, timestamp
  prefix). Replaces the reference's `rec-…`/`ev-…` counters, which collide
  across devices.
- Human-readable codes remain separate and unique: `OV-2401`, RFID.
- `farmId`: opaque string, default `local-farm`, generated on first run and
  stored in `meta`. Never displayed as a uuid.
- Future server sync can map ULIDs directly; no rewrite needed.

---

## 3. Entities

All timestamps are ISO-8601 UTC strings. All ids are ULIDs unless stated.

### 3.1 `FarmDocument`

```ts
interface FarmDocument {
  schemaVersion: 3;
  farmId: string;
  createdAt: string;
  updatedAt: string;

  settings: FarmSettings;
  operator: OperatorProfile;

  animals: Animal[];
  weights: WeightRecord[];
  healthEvents: HealthEvent[];
  recommendations: NutritionRec[];
  feedLots: FeedLot[];
  auditEvents: AuditEvent[];
  signoffs: ExpertSignoff[];

  energy: EnergySnapshot;        // simulated snapshot, labelled
  environment: EnvironmentSnapshot; // simulated, labelled
  referenceSeries: KpiPoint[];   // demo-only, labelled
}
```

`FarmSettings`: farm name, region, flock label, locale, demo mode flag,
staleness threshold, engine definition id.

`OperatorProfile`: `id`, `displayName`, `authority: "field" | "production"`,
`createdAt`, `updatedAt`. Single operator in the MVP; the shape allows more.

### 3.2 `Animal`

| Field | Type | Rule |
|---|---|---|
| `id` | ULID | primary key |
| `farmId` | string | tenant key |
| `code` | string | `OV-####`, unique per farm |
| `rfid` | string | 15 hex or vendor id, unique per farm |
| `sex` | `"F" \| "M"` | required |
| `breed` | enum | Ouled Djellal, Rembi, Hamra, Berbère, other |
| `birthDate` | `YYYY-MM-DD` | not in the future |
| `weightKg` | number \| null | `0 < x ≤ 1000` |
| `bcs` | number \| null | `1 ≤ x ≤ 5` |
| `stage` | enum | 7 stages from the reference |
| `pen` | string | must exist in settings.pens |
| `status` | `actif \| vendu \| mort` | default `actif` |
| `lastScanAt` | ISO \| null | |
| `adgKg` | number \| null | derived from weights, cached |
| `expectedLambingAt` | ISO date \| null | replaces free-text gestation |
| `damId` / `sireId` | ULID \| null | parentage, optional |
| `notes` | string | ≤ 500 chars |
| `createdAt` / `updatedAt` | ISO | |

### 3.3 `WeightRecord`

`id`, `animalId`, `kg`, `at`, `source: "seed" | "field" | "import"`,
`bcs`, `note`, `createdAt`.
Unique guard: one record per `(animalId, at)` to prevent double entry.

### 3.4 `HealthEvent`

`id`, `animalId`, `type: examen | traitement | vaccination | naissance |
observation`, `at`, `by` (operator id), `note`, `severity?: "info" | "suivi" |
"alerte"`, `attachments?` (Phase 7), `createdAt`.
Hard cap: 5,000 records; oldest archived to the backup export file, never
silently dropped.

### 3.5 `NutritionRec`

`id`, `animalId`, `engineId`, `engineVersion`, `createdAt`, `inputsHash`,
`ration: Ration | null`, `notes: MessageDescriptor[]`,
`confidence: "haute" | "moyenne" | "insuffisante"`,
`missingInputs: MissingInput[]`, `evidence: EvidenceLine[]`,
`approvedBy: { id, name, at } | null`,
`servedAt`, `servedBy: { id, name } | null`,
`stocksDeducted: boolean` (serve idempotency).

`Ration`: `forageKg`, `concentrateKg`, `mineralG`, `waterL`, `cpPercent`,
`meMj`, `dmiKg`.

`MessageDescriptor`: `{ key: string; params?: Record<string, string|number> }`.
`EvidenceLine`: `{ key: string; params?: … }` plus optional `raw?: string` for
numeric expressions that must stay LTR.

### 3.6 `FeedLot`

`id`, `name`, `kind: fourrage | concentre | hybride | mineral`,
`stockKg`, `costPerKg`, `available`, `origin`, `updatedAt`.
Stock is a non-negative number; deduction is a single transaction per serve.

### 3.7 `AuditEvent`

`id`, `type: scan | saisie | recommandation | approbation | distribution |
transfert | identite | erreur | import | export | settings`, `at`,
`by` (operator id or `system`), `entityType`, `entityId`,
`summary: MessageDescriptor`, `detail?: Record<string, unknown>`,
`severity: "info" | "warn" | "error"`.

This replaces the reference's `syncStatus` on every record. Sync status is not
part of the MVP (D-0017). The audit log is the local source of truth for "what
happened".

### 3.8 `ExpertSignoff`

`id`, `name`, `specialty`, `signedAt`, `engineVersion`, `protocol`,
`passed`, `total`, `caseIds[]`, `notes`.
An explicit disclaimer field records that this is a local record, not an
external certification.

### 3.9 Simulated snapshots

`EnergySnapshot` and `EnvironmentSnapshot` are stored with
`simulated: true` and `asOf`. The UI must render the simulation badge whenever
`simulated` is true. A production build without seed data starts with these
snapshots empty and shows "no device connected".

---

## 4. Derived views (not stored)

| View | Inputs | Module |
|---|---|---|
| Animal health | animal, weights, latest rec, clock | `domain/health` |
| Farm KPIs | animals, recs, feed, weights | `domain/kpis` |
| Ration sheet | animals, recs, feed | `domain/ration` |
| Feed coverage | feed, recs | `domain/feed` |
| Engine cases | animals, feed, engine definition | `domain/engine-cases` |
| Golden path | audit events, recs, animals | `domain/golden-path` |

Memoisation is per render, keyed by the source arrays' identity. No caching
layer until profiling proves a need.

---

## 5. Persistence layout

### 5.1 IndexedDB

Database `ovitech`, version 3.

| Store | Key | Value | Notes |
|---|---|---|---|
| `state` | `"current"` | `FarmDocument` JSON | single document, transactional write |
| `meta` | string | `{ value, updatedAt }` | install id, last export, schema |
| `photos` | member id | data URL | team photos only |
| `outbox` | — | — | **created empty, unused, reserved** |

Why a single document instead of per-entity stores: the dataset is small
(thousands of records), queries are in-memory, and atomic replacement is
simpler and safer than multi-store transactions. If the dataset grows beyond
50k records, a per-entity migration is planned in `m010`.

### 5.2 localStorage

Only UI preferences: `ovitech.lang`, `ovitech.nav.collapsed`,
`ovitech.install.dismissed`, `ovitech.theme`. Never domain data.

### 5.3 sessionStorage

Nothing in the MVP.

---

## 6. Write protocol

```
UI intent
  → application use-case (validate intent)
  → domain command (pure transition → new FarmDocument)
  → repository.save(document)   [transactional]
  → BroadcastChannel("ovitech") [notify other tabs]
  → UI re-render from store
```

- A save failure leaves the in-memory state **unchanged** and surfaces a
  blocking recovery panel. No optimistic write without a commit.
- Multi-tab: the writer broadcasts `{ type: "document-updated", revision }`.
  Other tabs re-read the document; last write wins, and the loser sees a
  "reloaded from another tab" notice. The MVP does not merge across tabs.

---

## 7. Migrations

### 7.1 Version registry

| Version | Migration | Content |
|---|---|---|
| 1 | `m001_import_v1` | Import the reference's 14-key `FarmData` (backup v1) |
| 2 | `m002_operator` | Add `operator`, `settings`, `expectedLambingAt` |
| 3 | `m003_audit` | Add `auditEvents`; derive from legacy event log |
| 4 | `m004_message_keys` | Convert legacy French notes to descriptors where mappable |
| 5 | `m005_engine_version` | Freeze `engineId`/`engineVersion` per recommendation |

Each migration:

- is a pure function `(input: unknown) => FarmDocument`;
- has a JSON fixture from the previous version;
- is idempotent when applied twice;
- never deletes a record without recording an audit event.

Unknown or corrupt fields fall back to defaults **and** emit a
`schema.recovered` audit event, so data loss is visible rather than silent.

### 7.2 Backup compatibility

- v1 backups (reference) are importable through `m001`.
- v2 backups carry `schemaVersion`; import runs the chain to current.
- A backup from a **newer** schema is rejected with a clear message, not
  partially applied.

---

## 8. Import validation

| Check | Limit | Failure |
|---|---|---|
| File size | ≤ 25 MB | reject |
| `format` / `version` | supported | reject |
| `schemaVersion` | ≤ current | reject if newer |
| Arrays | ≤ 50,000 each | reject |
| Total records | ≤ 200,000 | reject |
| Strings | code ≤ 32, RFID ≤ 64, notes ≤ 500, names ≤ 120 | truncate with warning |
| Numbers | finite; weight/BCS/stock bounds | reject row, report count |
| Checksum | SHA-256 match | reject |
| Duplicate ids | none | reject |
| Duplicate code/RFID | none | reject with the conflicting codes |

The import preview shows: animal count, recommendation count, event count,
date range, engine versions present, and the diff against current data.

---

## 9. Seed and demo data

### ADR-008 — Seed data is a build-time fixture, never production

- `src/data/seed/` contains the reference dataset (12 animals, weights,
  feed lots, recs, events, environment, energy).
- It is imported only when `import.meta.env.VITE_DEMO_MODE === "true"` **and**
  the build is not production.
- The production build fails if the demo flag is set or if `seed` is imported
  by a non-test/non-dev module. Enforced by a build-time import-graph check.
- A fresh production install shows an empty state with "create your farm"
  onboarding, not OV-2401.

This is a deliberate deviation from the reference, which always starts seeded.

---

## 10. Retention and size

| Data | Cap | Behaviour at cap |
|---|---|---|
| Audit events | 5,000 | export prompt, then archive oldest to a file |
| Health events | 5,000 | same |
| Recommendations | 2,000 | same |
| Weights | 10,000 | same |
| Animals | 10,000 | warn |
| Photos | 20 × 512 px | reject with message |

The reference silently trims synced rows (`EVENTS_MAX = 400`). The rebuild
never silently deletes user data; it prompts an export.

---

## 11. Time

### ADR-009 — Clock injection and one timezone policy

- All timestamps stored as UTC ISO strings.
- Display in the device timezone via `Intl`.
- Domain rules receive a `Clock` port. Tests use a fixed clock.
- The demo uses `2026-08-28T10:00:00Z` for seed data **only**; "now" is always
  the injected clock.
- A single `SCAN_STALE_DAYS = 3` constant replaces the 1/3-day conflict.

---

## 12. Data-quality invariants (tested)

1. `animals.code` and `animals.rfid` unique (case-insensitive).
2. Every weight/health/rec points to an existing animal.
3. `birthDate ≤ today`; `at ≤ now + 5 min`.
4. `ration == null` implies non-empty `missingInputs`.
5. `ration != null` implies all formula inputs present and finite.
6. `servedAt != null` implies `approvedBy != null` and `stocksDeducted`.
7. `stocksDeducted` transitions false → true exactly once.
8. Feed stock never negative.
9. Every mutation produces exactly one audit event.
10. Backup round-trip is byte-stable except `exportedAt`.

---

## 13. Data-related open questions for Gate 2

| # | Question | Default |
|---|---|---|
| D-1 | Accept ULIDs and a single-document store? | Yes |
| D-2 | Accept v1 backup import via migration chain? | Yes |
| D-3 | Accept optional passphrase encryption for exports? | Yes |
| D-4 | Accept the no-silent-deletion retention policy? | Yes |
| D-5 | Accept empty production start (no seed)? | Yes |
