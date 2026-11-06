# Glossary

## Domain

| Term | Meaning |
|---|---|
| **DDNE** | The deterministic nutrition decision engine inherited from the reference (`DDNE-REF-0.9`, frozen as `DDNE-REF-1.0` for the rebuild). It computes a ration from weight, BCS, stage and feed context, and refuses when a required input is missing. |
| **Refusal contract** | When an input is missing, the engine returns `ration: null` plus machine-readable `missingInputs` instead of guessing. |
| **BCS / NEC** | Body condition score / note d'état corporel, 1–5. Used by the nutrition and health rules. |
| **ADG** | Average daily gain, derived from consecutive weight records. |
| **DMI** | Dry-matter intake, the intake ceiling used when sizing a ration. |
| **Ration** | The forage and concentrate quantities assigned to an animal or pen, with cost and cover days. |
| **Serving** | Committing an approved ration to the pen; debits feed stock exactly once. |
| **Health signal** | A deterministic flag (weight loss, low BCS, stale scan, gestation, refusal) with a severity. |
| **Operator profile** | The local user identity (display name, authority, optional farm label) that replaces the reference's fixed `field` role. |

## Architecture

| Term | Meaning |
|---|---|
| **Port** | An interface owned by the domain/application layer (`Clock`, `IdGenerator`, `FarmRepository`, `BackupCodec`, `PdfRenderer`, `AiProvider`). |
| **Adapter** | A concrete implementation of a port (`SystemClock`, `UlidGenerator`, `MemoryFarmRepository`). IndexedDB arrives in phase 4. |
| **Composition root** | `src/app/services.ts` — the only place that chooses adapters. |
| **Farm document** | The single persisted state object (`schemaVersion`, `updatedAt`, extended in phase 4). |
| **Message key** | A typed identifier such as `nav.team`; domain code returns keys and parameters, never sentences. |
| **Logical property** | Direction-agnostic CSS (`margin-inline-start`, `text-align: start`) used instead of left/right. |
| **Capability class** | The audit's truth taxonomy: **A** real deterministic logic, **B** functional local feature, **C** simulated and labelled, **D** presentation only, **E** scaffold/unwired, **F** broken/unsafe. |
| **Gate** | A blocking quality check. Phase 3 implements gates 1–11 plus bundle and origin audits. |

## Deployment

| Term | Meaning |
|---|---|
| **Static build** | `dist/` served by any static host; there is no server runtime and no API in the MVP. |
| **Offline-first** | Assets, fonts and data are local; the service worker is added in phase 6. |
| **MVP** | Phases 4–7 scope: herd, health, nutrition, feed, KPIs, audit, backup, print reports, PWA. |
