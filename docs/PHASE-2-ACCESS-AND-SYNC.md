# Phase 2 — Access Model and Sync Posture

**Status:** proposed, awaiting Approval Gate 2
**Decisions:** D-0017 (single-user local-first; no sync in the MVP)
**Defects addressed:** D-101 (unreachable approval), D-102 (fake sync), D-103 (dead auth)

---

## 1. Why this document exists

The reference has three contradictory access stories:

1. a two-role model (`field` / `production`) that no UI can change;
2. a Better Auth scaffold with no sign-in route;
3. a sync button that flips local statuses and claims success.

Each looks like a feature and is not one. The rebuild replaces all three with a
single, explicit, testable model.

---

## 2. Access model — single-operator local-first

### 2.1 What the user gets

- The app opens directly. No login screen, no account, no server call.
- On first run, a short onboarding asks for:
  - farm name (default "مزرعتي"),
  - operator display name,
  - authority: **Terrain** (`field`) or **Production** (`production`).
- The operator can be changed later in **Settings → Operator**, with a
  confirmation and an audit entry.
- The choice is stored in the local `FarmDocument`; it is not a security
  boundary.

### 2.2 What the user is told

A persistent line in Settings, and a note on the capability-status page:

> This installation is local to this device. It is not an account, not a
> login, and not a multi-user system. Anyone with access to this device and
> browser profile can read and change the data. Use a device passcode and
> encrypted exports if the data is sensitive.

No claim of authentication, tenancy, or cloud backup is made anywhere.

### 2.3 Threat model (honest scope)

| Threat | Covered? | Mitigation |
|---|---|---|
| Another person using the same unlocked browser profile | **No** | Device/browser profile security; optional PIN in Phase 7 |
| Theft of the device | **No** (plaintext IndexedDB) | OS disk encryption; encrypted export |
| Malicious browser extension / same-origin script | **No** | Strict CSP, minimal dependencies |
| Accidental deletion | **Partial** | Confirmation dialogs, backup reminders |
| Data loss on browser clear | **Partial** | Export reminders, `navigator.storage.persist()` |
| Server breach | **N/A** | No server stores farm data |

This is a deliberate, documented trade-off, not an oversight.

---

## 3. Authority model

### 3.1 Roles

| Authority | Arabic label | Scope |
|---|---|---|
| `field` | فريق الميدان | scan, weigh, capture, health events, transfers, serve |
| `production` | مسؤول الإنتاج | everything `field` can do, plus approve and edit feed/rations |

"Production" is not a superuser; it is the review authority for nutrition.

### 3.2 Authority matrix

| Action | field | production | Notes |
|---|:--:|:--:|---|
| Scan / identify | ✅ | ✅ | |
| Record weight / BCS | ✅ | ✅ | |
| Register animal | ✅ | ✅ | |
| Transfer pen | ✅ | ✅ | |
| Add health event | ✅ | ✅ | |
| Run engine (single / pen) | ✅ | ✅ | |
| **Approve recommendation** | ❌ | ✅ | Requires authority; recorded |
| **Serve recommendation** | ✅ | ✅ | Only if approved and stock covers |
| Adjust feed stock | ❌ | ✅ | Inventory control |
| Toggle feed availability | ❌ | ✅ | |
| Sign engine protocol | ❌ | ✅ | Expert act |
| Export backup | ✅ | ✅ | |
| Import backup | ❌ | ✅ | Destructive |
| Reset / delete farm | ❌ | ✅ | Destructive, double confirm |
| Change operator | ✅ | ✅ | Audited |

The matrix is a pure function `can(actor, action, context)` in
`domain/authority.ts`, unit-tested for every cell. The UI renders disabled
controls with a reason, not hidden buttons.

### 3.3 Recommendation lifecycle

```
        run engine
            │
     ┌──────┴───────┐
     │              │
  ration null    ration emitted
  (refused)          │
     │           approve (production)
     │              │
     │           approved
     │              │
     │           serve (field/production)
     │              │
     │           served + stock debited + audit
     │              │
     └──────────► terminal
```

Rules:

- A refused recommendation cannot be approved or served.
- Approval requires `authority === "production"`; the button is visible but
  disabled with "requires production authority" for `field`.
- Serving requires approval, stock coverage, and not-already-served.
- Serving is idempotent by recommendation id.
- Changing authority mid-flow never rewrites existing approvals; each
  approval keeps the actor snapshot.

This fixes D-101 without inventing an account system.

### 3.4 Audit semantics

Every approval and serve writes an audit event with:

```json
{
  "type": "approbation",
  "at": "2026-11-03T10:00:00Z",
  "by": "op_01H…",
  "entityType": "recommendation",
  "entityId": "rec_01H…",
  "summary": { "key": "audit.approved", "params": { "code": "OV-2403" } }
}
```

The recommendation also stores `approvedBy: { id, name, at }` so the fact
survives even if the operator profile is later renamed.

---

## 4. Optional local lock (Phase 7, not MVP)

A 6-digit PIN gate can be added in front of the app:

- It is a **UX lock**, not encryption.
- It is not described as authentication.
- Rate-limited, no recovery without data loss, documented.
- If approved later, it ships behind a settings toggle and a clear warning.

Encryption at rest is a separate future decision (WebCrypto + passphrase,
unlocking the document into memory). Not in the MVP.

---

## 5. Sync posture

### 5.1 MVP: no sync

- No "Synchroniser" button.
- No `syncStatus` badges (`local`, `pending`, `synced`, `failed`, `conflict`).
- No outbox writes; the `outbox` object store exists empty and unused.
- No network calls at runtime.
- The `/sync` route becomes **`/donnees` (Data)**: backup, restore, storage
  usage, export reminders, demo reset (dev only).

### 5.2 What replaces the sync story

| Old claim | New reality |
|---|---|
| "File de synchronisation" | "Données locales — dernière exportation : …" |
| "Synchroniser" | "Exporter une sauvegarde" |
| "Synchronisé" chip | Removed |
| "Conflit" | Import conflict preview (before commit) |
| "Dernière synchro" | "Dernière sauvegarde" |

This is a **visible parity deviation** (DEV-02) and must be listed in the
parity report.

### 5.3 Future sync — extension design (not built)

If a backend is approved in a later phase:

```
application use-case
  → repository.save(document)            [local commit]
  → outbox.append(mutation)              [durable, same transaction]
  → SyncWorker (explicit user action or background)
      → POST /sync/batch { farmId, mutations[] }
      → server validates membership + idempotency
      → returns per-mutation ack / conflict
  → outbox.mark(acked | conflict)
```

Requirements already satisfied by this design:

- `farmId` on every entity.
- ULIDs as stable ids.
- `AuditEvent` as the mutation journal.
- `engineVersion` frozen per recommendation.
- A repository port that can be wrapped by an outbox decorator.

The server contract from the reference (`sync_idempotency`, `farm_id`,
`mutation_id`) is sound and can be reused conceptually. It is **not** part of
the MVP.

### 5.4 Claim discipline

Any future sync feature must pass a test that cuts the network and proves:

1. the local write still commits;
2. the outbox row survives reload;
3. the ack is verified before the row is marked synced;
4. a replayed mutation is not applied twice;
5. conflicts are surfaced, never auto-discarded.

Until then, the word "synchronisé" must not appear in the UI.

---

## 6. Capability-status page

New route: **`/etat` (Capability status)**, linked from Settings and the
footer.

It lists every module with one of four labels:

| Label | Meaning | Example |
|---|---|---|
| **Opérationnel** | real, tested, local | nutrition engine, ration sheet, backup |
| **Simulé** | labelled simulation, no device | RFID scan, energy, climate, cameras |
| **Contenu** | presentation only | vision, investor dossier, label |
| **Non disponible** | deliberately absent | sync, multi-user, AI provider |

Each row links to the relevant page and states the evidence (test name or
document). This page is the product's own truth matrix and is generated from a
single `capabilities.ts` registry so it cannot drift silently.

---

## 7. Acceptance tests for this document

1. Fresh install → onboarding → operator `field`; approve buttons disabled
   with an explanation; serve disabled until approval.
2. Switch to `production` → approve succeeds → audit event written → serve
   succeeds → stock debited exactly once.
3. Switch back to `field` → existing approval remains valid and attributed.
4. Refused recommendation → no approve/serve controls.
5. Serving twice → second call is a no-op with a clear message.
6. No network requests during any of the above (Playwright request log).
7. `/etat` reflects the registry and cannot be edited by seed data.
8. Search the built bundle for "synchronisé", "sync", "login", "sign in" →
   no user-facing hits.

---

## 8. Open questions for Gate 2

| # | Question | Default |
|---|---|---|
| S-1 | Accept the single-operator model with an explicit authority switch? | Yes |
| S-2 | Accept "no sync, backup only" and the visible deviation? | Yes |
| S-3 | Accept the disabled-with-reason pattern for restricted actions? | Yes |
| S-4 | Accept the capability-status page as a required route? | Yes |
| S-5 | Defer the optional PIN lock to Phase 7? | Yes |
