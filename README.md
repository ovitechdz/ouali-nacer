# OVITECH

Arabic-first, offline-first smart sheep-farm platform.

**Status: Phase 3 — clean foundation.** This repository contains a real,
building application shell, not a product demo. There is no herd, health,
nutrition, rationing, reporting or persistence feature yet, and no production
data.

## What works today

- Vite 7 + React 19 + TypeScript strict, TanStack Router (client mode).
- Design tokens and self-hosted **Inter + Cairo** fonts taken from the approved
  style reference. No Google Fonts at runtime.
- Arabic-first i18n (AR default, RTL) with typed keys and lazily loaded FR/EN.
- Fixed desktop sidebar, mobile drawer, sticky header, right-hand sidebar in
  RTL, skip link and focus management.
- Routes: `/`, `/equipe`, `/team` (alias), `/etat`, `/offline`, 404.
- Ports (`Clock`, `IdGenerator`, `FarmRepository`, `BackupCodec`,
  `PdfRenderer`, `AiProvider`), a memory repository, a system clock and ULID
  generation.
- CI gates: format, lint + layer boundaries, typecheck, tests + coverage,
  i18n parity, RTL audit, secret scan, forbidden dependencies, seed guard,
  static build, bundle budget and external-origin audit.

## What does **not** work yet

Herd management, health signals, the DDNE ration engine, feed stock, KPIs,
audit journal, backup import/export, PDF reports, IndexedDB persistence, the
service worker and the full `/equipe` page all arrive in phases 4–7. Anything
not listed above is absent by design, not simulated.

## Commands

```bash
npm ci             # install from the lockfile
npm run dev        # http://localhost:5173
npm run build      # typecheck + static production build
npm run test       # Vitest + coverage
npm run lint       # ESLint, including layer-boundary rules
npm run ci         # every phase-3 gate in order
```

## Structure

```
src/
  app/        router, providers, shell, composition root
  adapters/   concrete port implementations
  components/ UI primitives and shared layout components
  domain/     pure types and rules (no framework imports)
  i18n/       locale metadata, catalogues and boot
  lib/        small framework-agnostic helpers
  pages/      route components
  ports/      interfaces owned by the application
  styles/     tokens, fonts and base CSS
docs/         approved audit set, decisions and glossary
public/       reference logo, favicon, self-hosted WOFF2 and OFL licences
scripts/      CI gate implementations
```

Layer rules are enforced by ESLint: `domain` and `ports` cannot import React,
adapters or the app; only `src/app/services.ts` chooses adapters.

## Design source

Colour, radius, spacing and typography come from the approved style reference;
behaviour and routes come from the functional reference. Tokens are documented
in `docs/design/EXTRACTION-REPORT.md`. The logo is the reference logo and is
never mirrored.

## Safety

- The reference repository is read-only and is not modified by this project.
- No deployment, no push and no commit in this phase.
- No credentials, demo accounts or analytics are included.
- `FINAL-AUDIT-REPORT.md` was deliberately not copied: it belongs to a
  different deployment and its ownership is unresolved.

## Licence

Proprietary. Inter and Cairo are distributed under the SIL Open Font License
1.1; see `public/fonts/OFL-Inter.txt` and `public/fonts/OFL-Cairo.txt`.
