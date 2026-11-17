# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: one sheep-farm operator working on a single device, often with
intermittent or no connectivity. The product exposes two local authority
profiles:

- **Field team (فريق الميدان):** scans, weighs, registers animals, moves pens,
  records health events, runs the ration engine and serves approved rations.
- **Production manager (مسؤول الإنتاج):** everything the field team does, plus
  approving nutrition recommendations, managing feed inventory and settings,
  signing the engine verification protocol and importing backups.

Secondary stakeholder: the nutrition expert who signs the verification protocol.
The expert is a human reviewer, not a software user in the MVP.

_Inferred from `PHASE-2-ACCESS-AND-SYNC.md` §3 and the Phase 4 authority matrix;
confirm the persona labels if the farm team is organised differently._

## Product Purpose

OVITECH is an Arabic-first, offline-first farm console for a single sheep farm.
It records the herd, weights and health events; computes deterministic rations
with the DDNE engine; enforces an approve → serve authority boundary; tracks
feed stock and KPIs; keeps a local audit trail; and exports a verified JSON
backup.

Success means the full working loop — register → weigh → run engine → approve →
serve → audit — completes on one device with no network and no invented data.

## Positioning

OVITECH is deliberately **not** an AI assistant and **not** a cloud SaaS. Its
defensible mechanism is a frozen, explainable nutrition engine
(`DDNE-REF-1.0`) that refuses to emit a ration when a required input is
missing, combined with Arabic-first RTL and true local-first persistence.

A neighbouring product cannot copy this by adding a model: the value is the
audited deterministic rules, the refusal contract, the named production
approval, and the local audit trail.

## Operating Context

- One farm, one browser profile, one device; desktop and mobile web.
- Low-connectivity field use; no login, account, server call or real-time sync
  in the MVP.
- Arabic is the authored default (RTL); French and English are lazy-loaded with
  equal key coverage.
- Data lives in IndexedDB as a single versioned `FarmDocument`; JSON
  backup/restore (v2, SHA-256, optional AES-256-GCM) is the only transport.
- Core workflows: onboarding, animal registration, weight/BCS capture, pen
  transfer, health events, engine run, production approval, serve to pen, feed
  stock, KPIs, audit, settings, backup/restore.
- Client-side print/PDF reports; an automated PDF generator is deferred.
- Simulated hardware/IoT surfaces (RFID, cameras, gates, climate) must remain
  visibly labelled simulation; the MVP does not integrate hardware.

## Capabilities and Constraints

Confirmed in Phase 4:

- Schema v5; frozen engine `DDNE-REF-1.0`; descriptor-only domain messages;
  injected clock and identifiers.
- Commands: register, weigh, move, run engine, approve, serve, serve pen, feed
  lot/stock, health event, operator change, protocol signoff, scan, archive.
- Authority: only `production` approves; both authorities can serve; denied
  actions return a reason instead of disappearing.
- Serving is idempotent and never lets feed stock become negative.
- Migrations m001–m005 with legacy import and newer-schema rejection.
- Retention reports and explicit archival only after export.
- No authentication, tenancy, sync, backend, AI inference or hardware
  integration in the MVP.
- Seed/demo data is development-only and must never ship in production; no seed
  module exists yet.
- Bundle budgets: initial JS under 180 kB gzip, per-chunk under 120 kB, fonts
  under 120 kB.
- Service-worker installability and precache are Phase 6, not yet implemented.

## Brand Commitments

- Name: **OVITECH**.
- Logo: inherited from the original reference, not the style site.
- Arabic-first voice: Arabic is the source language; every user-facing string
  keeps AR/FR/EN parity.
- Typography is binding: **Inter** for Latin and **Cairo** as the only Arabic
  family, self-hosted WOFF2, no runtime Google Fonts.
- Visual tokens are binding and live in `src/styles/tokens.css`: dark-only
  surfaces `#0b1220` / `#111827` / `#1a2332`, header `#111827d9` with a solid
  `#101827` fallback, border `#243044`, solid primary `#009966` with `#04120c`
  labels, accent text/dot/icon `#00d492`, radii 8/12/16/24 px, 4 px spacing
  base, 72 rem container.
- Shell: vertical sidebar fixed on desktop, Drawer on mobile, right side in RTL;
  logical CSS properties only.
- Honest surface: simulated capabilities stay labelled; no fabricated customers,
  benchmarks, certifications or AI claims.

## Evidence on Hand

- Approved Phase 1 audit: master feature inventory, domain functionality audit
  (D-101…D-116), 77-capability truth matrix, 41 reference screenshots.
- Phase 2 architecture, data model, access/sync posture, Arabic/RTL strategy,
  quality strategy, migration matrix and roadmap.
- Style-site extraction: tokens, live FR/AR computed styles, Cairo coverage
  proof and 44 captures.
- Team-page archive: HTML, text, CSS, member JSON, screenshots and modals
  (`docs/design/TEAM-PAGE-SOURCE.md`; audit workspace `team-page-source/`).
- Domain fixtures: legacy v0 and v1–v4 documents plus a v1 backup; 254 tests in
  31 files.
- Absent and not to be fabricated: production customer data, testimonials,
  pricing, benchmarks, external certification, hardware telemetry, AI features.

## Product Principles

1. **Offline truth.** The farm loop must complete on one device without a
   network; no server is required for a valid workflow.
2. **Refuse rather than guess.** Missing inputs produce an explicit refusal,
   never an invented ration.
3. **Human authority.** Nutrition approval is a named production act recorded
   in the audit trail; the software never approves on the user's behalf.
4. **Arabic-first parity.** Arabic is authored and typeset first; FR/EN match
   its key coverage rather than arriving as an afterthought.
5. **Honest surface.** Simulations, estimates and deferred capabilities are
   labelled; the product does not claim what it cannot demonstrate.

## Accessibility & Inclusion

- RTL/LTR correctness is a product requirement; logical properties only.
- Keyboard-accessible shell: skip link, focus trap and Escape handling in the
  mobile Drawer.
- Arabic line-height 1.7 with zero letter-spacing; readable dark-theme
  contrast.
- No product-specific WCAG level has been formally established. WCAG 2.2 AA is
  the working target pending confirmation.

## Open Decisions

- Confirm the primary persona labels and whether a separate veterinarian role
  exists outside the `field` / `production` profiles.
- Confirm the accessibility standard (WCAG 2.2 AA assumed).
- Production domain/DNS, optional local PIN, automated PDF, any backend/sync
  and any AI provider remain deferred and require a new decision.
