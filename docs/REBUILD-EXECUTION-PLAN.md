# Rebuild Execution Plan

**Method:** READ → MODEL → PLAN → IMPLEMENT → VERIFY → CERTIFY
**Current position:** Gate 1 approved; Phase 2 complete, awaiting Approval Gate 2
**Target:** independent, clean, offline-first OVITECH platform — not a Vercel deployment, not a Grok-dependent app.

## ملخص عربي

الخطة تبدأ بمراجعة كاملة للمرجع ثم تصميم البنية ثم بناء مشروع مستقل. لا يُسمح بالانتقال إلى أي مرحلة قبل موافقة المستخدم. المشروع الجديد يجب أن يعمل دون إنترنت، دون Vercel، ودون أي مزود ذكاء اصطناعي إجباري. المشروع المحلي السابق `ovitech-clean` لا يُعتبر الأساس المعتمد.

## 1. Stage sequence and gates

| Stage | Output | Gate |
|---|---|---|
| Phase 0 — Discovery & safety | Environment, repository identity, protection plan, execution plan | **Approval Gate 0** |
| Phase 1 — Reverse engineering | Route/page/component inventory, feature-truth matrix, PWA/security/visual audits | **Approval Gate 1** |
| Phase 2 — Architecture & migration | Target architecture, migration matrix, DB/API/PWA/infra/AI/security designs | **Approval Gate 2** |
| Phase 3 — Clean foundation | Independent repo, strict TypeScript, design system, i18n, tests, CI | Verification report |
| Phase 4 — Domain core & data layer | Ported pure domain modules, repository, migrations, backup, authority | Domain acceptance |
| Phase 5 — UI reconstruction | Shell, component kit, all identified pages, responsive/RTL states | Visual parity report |
| Phase 6 — Business modules & offline | Remaining modules, PWA precache, offline suite, print reports | Offline suite + module acceptance |
| Phase 7 — Security, performance & QA | Security, accessibility, budgets, E2E, Arabic QA, honesty QA | QA certification |
| Phase 8 — Hosting & release | Cloudflare Pages, headers, monitoring, rollback | Release approval |
| Phase 9 — Certification & handover | Parity, deviations, debt, handover pack | Final sign-off |

> Phases 4–6 were re-scoped at Gate 2: data must precede UI, and sync is
> removed from the MVP (D-0017). The operative acceptance criteria live in
> `PHASE-2-ROADMAP.md`; this table is the summary view.

No stage may be skipped. A passing build alone is never sufficient evidence.

## 2. Phase 0 exit criteria

- [x] Official repository identified.
- [x] Default branch and HEAD recorded.
- [x] Read-only access confirmed.
- [x] Local environment audited.
- [x] Existing local projects and conflicts recorded.
- [x] Source protection plan written.
- [x] Risks and unknowns listed.
- [ ] User approval of ownership/license.
- [ ] User approval of target path.
- [ ] User decision on the pre-existing `ovitech-clean` prototype.

## 3. Phase 1 plan (after approval only)

### 3.1 Read-only source acquisition

- Clone official `main` at `f99cd02…` into `C:\Users\ASUS\ovitech-reference`.
- Disable the push URL.
- Run a read-only secret scan.
- Record the exact commit in every report.

### 3.2 Inventories

- Routes and pages, including hidden and parameterized routes.
- Navigation, menus, empty/error/loading states.
- Components and design tokens.
- Data models, tables, migrations, APIs.
- Auth, roles, permissions, tenant rules.
- IndexedDB, localStorage, service worker, caching, sync queue.
- PDF/Excel generation, i18n, RTL.
- External services and AI integrations.
- Hardware/device surfaces.

### 3.3 Feature truth classification

Every feature receives exactly one label with evidence (normalised in D-0020):

- A — Real deterministic domain logic
- B — Functional local feature
- C — Simulated, explicitly labelled
- D — Presentation/content only
- E — Scaffold or unwired code
- F — Broken or contradictory

No button, route, or API alone counts as proof. Unreachable code is never
counted as working. See `FEATURE-TRUTH-MATRIX.md` for the operative definitions.

### 3.4 Visual and behavioral capture

- Desktop, tablet, mobile screenshots.
- Arabic RTL and French/English LTR states.
- Light and dark modes.
- Empty, loading, error, and success states.
- Interaction traces for critical flows.

### 3.5 Phase 1 deliverables

- `PHASE-1-FEATURE-INVENTORY.md`
- `ROUTES-AND-PAGES.md`
- `COMPONENT-INVENTORY.md`
- `DATA-AND-API-INVENTORY.md`
- `DOMAIN-FUNCTIONALITY-AUDIT.md`
- `PWA-OFFLINE-AUDIT.md`
- `SECURITY-AUDIT.md`
- `VISUAL-REFERENCE-CATALOG.md`
- `FEATURE-TRUTH-MATRIX.md`

## 4. Phase 2 plan

- Migration decision matrix per component: REUSE / REFACTOR / REBUILD / REJECT / DEFER.
- Clean Architecture layers and module boundaries.
- Domain model, UUID strategy, relationships, constraints, indexes, soft delete, versioning, audit log.
- Multi-farm tenant isolation and RBAC.
- API contracts and idempotent sync endpoints.
- PWA architecture: app shell, IndexedDB, outbox, retry, conflict resolution, server acknowledgement.
- Infrastructure comparison: VPS, managed hosting, containers, managed/self-hosted database.
- AI independence: optional provider interface, deterministic core, no mandatory key.
- Security model: authentication, authorization, CSRF, validation, encryption, rate limits, audit.
- Scientific integrity: DDNE inputs, equations, units, sources, limits, and assumptions.

## 5. Phase 3 foundation rules

- New independent Git repository.
- Strict TypeScript, no unnecessary dependencies.
- Domain logic isolated from UI and infrastructure.
- Arabic-first RTL, with French and English supported structurally.
- No secrets in code.
- No Vercel configuration, scripts, or runtime dependency.
- No mandatory AI provider.
- Tests and CI from the first commit.
- `.env.example` only; environment validation at startup.

## 6. Scope guardrails

### Must not claim

- That the reference is production-ready when its own README labels parts as demonstrators.
- That simulated RFID, gates, scales, cameras, energy, or sync are real integrations.
- That a deterministic rules engine is AI/ML.
- That unverified nutrition numbers are scientific recommendations.
- That a local save equals cloud synchronization.

### Must not do

- Deploy to Vercel.
- Copy secrets or production data.
- Add a mandatory Grok/xAI dependency.
- Mix the stale third-party clone into the target.
- Modify the reference repository.
- Delete existing user projects.

## 7. Proposed target setup (not created)

| Item | Proposal |
|---|---|
| Reference clone | `C:\Users\ASUS\ovitech-reference` |
| Target project | `C:\Users\ASUS\ovitech-rebuild` |
| Target Git | New independent repository; no remote until approved |
| Package manager | npm (matches reference lockfile) |
| Node | 24.21.x (already installed) |
| Deployment | VPS/container candidate; decision deferred to Phase 2/8 |

## 8. Open decisions requiring user input

1. **Ownership/license:** Do you own `ovitechdz/ovitech.saas-`, or do you have written permission to rebuild and reuse it? The repository has no license.
2. **Source of truth:** Confirm `main@f99cd02` is the exact revision to rebuild.
3. **Existing prototype:** Should `C:\Users\ASUS\ovitech-clean` be archived/renamed, kept untouched, or used only as non-authoritative reference?
4. **Target path:** Approve `C:\Users\ASUS\ovitech-rebuild`, or provide another path.
5. **Scope:** Is the deliverable a faithful functional/visual parity build, or a clean MVP that may intentionally simplify non-core pages?
6. **Languages:** Arabic-first with FR/EN structure, or full trilingual parity from Phase 3?
7. **Hosting:** Defer the final choice to Phase 2, or state a preferred non-Vercel provider now.
8. **AI:** Confirm that only an optional, provider-independent assistant is desired, with deterministic rules as the default.

## 9. Stop conditions

Work stops immediately and the user is notified if:

- The official repository cannot be verified.
- A secret is found.
- The reference worktree is accidentally modified.
- A required approval is missing.
- A requested action would deploy, publish, delete, or overwrite user data.
- A feature cannot be verified but is being presented as working.

## 10. Next action after Approval Gate 0

Only after explicit approval: create the read-only reference clone, verify the commit, run the secret scan, and begin Phase 1 inventories. No target application code will be written in Phase 1.
