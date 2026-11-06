# Repository Identity

**Status:** verified via GitHub API and `git ls-remote` on 2026-11-02
**Decision:** the only canonical source is `ovitechdz/ovitech.saas-` at `main`.

## ملخص عربي

المستودع المرجعي الرسمي هو `https://github.com/ovitechdz/ovitech.saas-`، الفرع الافتراضي `main`، وآخر التزام `f99cd02227cd9d6b5325cda21f94b89108b62d26` بتاريخ 2026-10-17. المستودع عام، بلا ترخيص، وحجم شجرته 281 ملفًا. النسخة المحلية الموجودة باسم `ovitech.saas-` تعود إلى حساب آخر وليست المرجع.

## 1. Canonical identity

| Field | Value |
|---|---|
| Owner | `ovitechdz` (GitHub user ID 326333114) |
| Repository | `ovitech.saas-` |
| Full name | `ovitechdz/ovitech.saas-` |
| URL | https://github.com/ovitechdz/ovitech.saas- |
| Clone URL | https://github.com/ovitechdz/ovitech.saas-.git |
| Visibility | Public |
| Fork | No |
| Archived / disabled | No / No |
| Default branch | `main` |
| HEAD commit | `f99cd02227cd9d6b5325cda21f94b89108b62d26` |
| HEAD date | 2026-10-17T16:28:08Z |
| HEAD author | Ouali Nacer `<nacerouali464@gmail.com>` |
| HEAD subject | `feat: integrate code hardening and scientific references (#2)` |
| Commit verification | GitHub reports `verified: true` (valid PGP signature) |
| Created | 2026-10-03T15:53:17Z |
| Last push | 2026-10-17T16:28:08Z |
| Description | `elvage intensif écosystème` |
| Homepage | `https://ovitech-saas-f2h1.vercel.app` |
| License | **None declared** (`null`) |
| Stars / forks / open issues | 0 / 0 / 0 |
| Reported repository size | 1,824 KB |

## 2. Git refs observed

```text
ref: refs/heads/main  HEAD
f99cd02227cd9d6b5325cda21f94b89108b62d26  HEAD / refs/heads/main

9de18b5fec9800b88ea346b833366cecba8dde4e  refs/heads/fix/references-numbering
9de18b5fec9800b88ea346b833366cecba8dde4e  refs/heads/integrate/hardening-references
9b4cf7ad9bb8f4b6dd96d9d1ae6e7a0ce1428252  refs/heads/ovitech-code-hardening
b9c1d6c6c19430fc42b72ba16407fa3da338b54f  refs/tags/v1.0.0-rc.1
```

Only `main` is considered the reference for Phase 1. Branches and the release candidate remain available for comparison but are not merged automatically.

## 3. Official tree snapshot

From the GitHub tree API at `f99cd02`:

- 315 entries total.
- 281 files (blobs).
- 3,170,853 bytes of tracked content.
- Tree is not truncated.
- No `.env`, `.vercel`, `.grok`, `credentials`, or `secrets` paths in the tracked tree.
- CI workflows present: `.github/workflows/ci.yml`, `.github/workflows/e2e.yml`.
- Lockfile: `package-lock.json` only.
- Top-level application folders: `src/`, `server/`, `public/`, `migrations/`, `scripts/`, `docs/`.
- The repository root also contains many historical audit/diagnostic text files; these are not architectural authority.

## 4. Verified stack (from official `main`)

| Area | Observed |
|---|---|
| Runtime requirement | Node `>=24.21.0 <25` |
| UI | React, TanStack Start/Router, Radix UI, Tailwind CSS v4, Recharts, framer-motion |
| State / forms | Zustand, react-hook-form, Zod |
| Local data | IndexedDB, custom storage layer |
| Server / DB | Node server, Kysely, `pg`, PGlite fallback, migrations |
| Auth | `better-auth`, `jose` |
| Offline / PWA | Service worker precache script, local queue/sync modules |
| Reporting | `pdfmake` |
| i18n | i18next / react-i18next (French, English, Arabic) |
| Testing | Node test runner, Playwright |
| Build | Vite 8, custom post-build precache, DB migration script |
| Package name | `app-builder-workspace` (not `ovitech`) |

This is a **demonstrator/MVP codebase**, not a validated production SaaS. Its own README classifies hardware, energy, cloud sync, and authenticated golden-path behavior as demonstrators or roadmap.

## 5. Local clone discrepancy

| Field | Official | Local `OVITECH_Sauvegardes\ovitech.saas-` |
|---|---|---|
| Remote | `ovitechdz/ovitech.saas-` | `nacerouali464-sketch/ovitech.saas-` |
| Branch | `main` | `main` |
| HEAD | `f99cd02` (2026-10-17) | `ded6ab6` (2026-09-12) |
| Files | 281 tracked | 383 on disk |
| `.grok/` | absent | present |
| `.vercel/` | absent | present |
| Role | **Canonical** | **Stale third-party clone — evidence only** |

The local clone has one local branch (`main`) and one remote branch (`origin/vercel/install-vercel-speed-insights-mgg3gc`). No official tags are present locally.

## 6. Identity conclusion

- The reference project is confirmed.
- The exact inspectable revision is `f99cd02227cd9d6b5325cda21f94b89108b62d26`.
- The local clone with the same folder name is not authoritative and will not be used for migration.
- The absence of a license must be resolved before any code is copied or adapted.
- The target project must not inherit Vercel or Grok coupling, even though traces exist in the reference ecosystem.

## 7. Naming caution

Three similarly named projects exist locally:

1. `ovitech.saas-` — official web SaaS repository (the reference).
2. `ovitech_projet.-complet-` — a different, broader project/fork with mobile apps and Supabase.
3. `ovitech-clean` — a local prototype created before this governed rebuild.

They must not be merged or treated as interchangeable.
