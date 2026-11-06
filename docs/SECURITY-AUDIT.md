# Security Audit — Phase 1

**Reference:** `ovitechdz/ovitech.saas-` @ `f99cd02`
**Audit type:** read-only static review (no runtime penetration test)
**Date:** 2026-11-03

## 1. Verdict

The reference has a **reasonable security baseline for a local-first
demonstrator**, but it is not production-hardened, and the most sensitive
subsystem (auth/tenant) is unused by the shipped UI.

| Area | Rating | Notes |
|---|---|---|
| Secret hygiene (tracked files) | **Good** | No `.env`, keys, or real secrets tracked |
| Input validation (client) | **Good** | Zod schemas for weight, BCS, animal, sign-off |
| Input validation (server) | **Partial** | Sync endpoint trusts body shape beyond farm/mutation id |
| Authentication | **Scaffold only** | Real Better Auth config, but no route/gate and default off |
| Authorization | **Partial** | Farm membership + role checks exist; role unreachable in UI |
| Tenant isolation | **Good design** | `farm_id` + membership + same-site guard |
| Transport headers | **Basic** | 4 headers; no HSTS/CSP script policy |
| CSRF | **Partial** | Same-site guard + Better Auth origins; no token on custom endpoint |
| Local data protection | **Weak** | Plaintext IndexedDB/localStorage |
| Dependency surface | **Large** | 50+ runtime deps; no audit run recorded |
| PWA cache safety | **Partial** | `/api/*` never cached; no integrity/version UX |

## 2. Secret scan evidence

### 2.1 Project scanner

Command (executed read-only in `C:\Users\ASUS\ovitech-reference`):

```
node scripts/check-secrets.mjs
```

Result:

```
[check-secrets] ok — 281 tracked files scanned, no banned secrets detected
```

The scanner (`scripts/check-secrets.mjs`) enforces:

- blocked filenames: `.env*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.enc`,
  `*.crt`, `*.jks`, `*.keystore`;
- `PREVIEW_CLIENT_SECRET` may appear only in `src/lib/auth/preview.ts`;
- the 64-hex literal form of the preview secret may not appear elsewhere.

### 2.2 Independent pattern scan

```
git ls-files | Select-String -Pattern '(^|/)(\.env|.*\.pem$|.*\.key$|...'
→ no matches

git grep -l -E 'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}'
→ no matches
```

### 2.3 Findings

- No `.env`, `.vercel`, or `.grok` paths are tracked.
- `src/lib/auth/preview.ts` contains a **development-only placeholder**:
  `"preview-only-dev-secret-do-not-use-in-production"`. It throws in production
  if `GROK_PREVIEW_CLIENT_SECRET` is missing. It is not a real credential, but it
  is a platform-coupled fallback and must be removed in the rebuild.
- `DATABASE_URL`, `BETTER_AUTH_SECRET`, and provider secrets are read from
  environment variables only.
- No secrets were printed during the audit; the check output contains only a
  count.

## 3. Authentication

### 3.1 Architecture

- Better Auth ~1.6.30.
- Same-origin `/api/auth/*` endpoints.
- Generic OAuth plus Grok provider descriptors.
- Session resolved server-side via `auth.api.getSession` from request cookies.
- Optional bearer token in `sessionStorage` for the embedded preview
  (`auth/client.ts`), because partitioned cookies do not work in an iframe.
- `__Host-` cookies and `trustedOrigins` are documented in `isolation.server.ts`.
- Preview client id/secret and issuer (`https://auth.grok.me`) are Grok-specific.

### 3.2 Shipped behaviour

- `authEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false"`.
- `APP_ENV_DEFAULTS = { VITE_AUTH_ENABLED: "false" }` in
  `scripts/with-app-env.mjs:39`.
- Deployed builds are documented as setting the flag to `"true"`.
- With auth off, `useCurrentUser` returns a synthetic `DEV_USER`.
- **No route imports the auth gates.** `SIGN_IN_PATH = "/login"` points to a
  non-existent route.
- The root renders `AuthProvider` but never gates `AppShell`.

### 3.3 Consequence

There are two incoherent modes:

1. **Local/demo mode (default):** no authentication at all; every visitor has
   full local data access.
2. **Deployed mode (flag on):** auth is configured but the UI has no sign-in
   screen and no gate; server functions would reject unauthenticated calls, but
   the client-side app still renders.

This must be resolved in the rebuild: either ship a complete auth flow or
explicitly ship a single-user local mode with no auth claims.

## 4. Authorization and tenant isolation

### 4.1 Server-side controls

`server/routes/api/sync/animals.post.ts`:

1. `authMiddleware` → `requireUserId` (throws `UnauthorizedError`);
2. requires `body.farmId` and `body.mutationId`;
3. `requireFarmMembership(userId, farmId)` — fails closed;
4. transaction: claim `(farm_id, mutation_id)` then upsert by `(farm_id, id)`;
5. returns `duplicate: true` for replayed mutations.

`requireFarmMembership` (`farm-auth.server.ts`) queries `farm_memberships` and
rejects non-members. `isolation.server.ts` blocks scripted cross-site requests
using `Sec-Fetch-Site`, allowing same-origin, non-browser, and top-level GET
navigation.

This is a **sound pattern** and should be preserved conceptually.

### 4.2 Server-side gaps

- Body is typed `any`; only `farmId`/`mutationId` are checked. Animal fields are
  passed to SQL without schema validation.
- No limit on batch size or string lengths.
- Error handling collapses to `{ ok: false, code: "server_error" }` with no
  logging.
- Idempotency table has no TTL/cleanup.
- No rate limiting.
- No audit log beyond the idempotency row.

### 4.3 Client-side authorization

- Role: `field | production`; approval is production-only in both UI and store.
- Farm: `currentFarmId = "farm-1"` is a constant; no switcher.
- **Critical:** the role cannot be changed from the UI, so the production-only
  approval path is unreachable (see `DOMAIN-FUNCTIONALITY-AUDIT.md` §7). This is
  a functional defect with a security-adjacent consequence: authorization exists
  in code but cannot be exercised or verified by a normal user.

## 5. Transport and headers

`server/middleware/security-headers.ts`:

| Header | Value |
|---|---|
| `x-content-type-options` | `nosniff` |
| `x-frame-options` | `SAMEORIGIN` |
| `referrer-policy` | `strict-origin-when-cross-origin` |
| `content-security-policy` | `frame-ancestors 'self'` |

Missing:

- HSTS (assumed provided by Vercel; excluded host in the rebuild).
- A full CSP (`default-src`, `script-src`, `style-src`, `img-src`,
  `connect-src`, `font-src`, `frame-ancestors` is present only).
- `permissions-policy`.
- `cross-origin-opener-policy` / `cross-origin-resource-policy`.
- `x-dns-prefetch-control`.

The file itself documents that a strict CSP was not introduced because SSR
streaming and the OAuth popup were not audited under it. The rebuild must add a
tested CSP.

## 6. Cookies and sessions

- `__Host-` prefix documented; requires HTTPS, path `/`, no Domain.
- `SameSite=Lax` for session; same-site sibling isolation is handled separately.
- Bearer token in `sessionStorage` for preview only; XSS would expose it.
- No session rotation/expiry policy documented in the audited files.
- Sign-out helper exists (`signOut`) but no UI invokes it.

## 7. Input validation

### Client

`src/lib/validation.ts` + Zod:

- weight: finite, > 0, ≤ 1000 kg (rejects `Infinity`/`1e309`);
- BCS: 1–5;
- new animal: RFID/code required and unique;
- sign-off: name required, trimmed;
- backup: structural + size + checksum.

### Server

- None of the Zod schemas are applied to `syncAnimals`.
- SQL is parameterized via the `sql` template (no string concatenation found).
- No HTML injection surface in React (auto-escaping), but
  `dangerouslySetInnerHTML` should be verified absent.

### Findings

- No `dangerouslySetInnerHTML` in `src/`.
- File upload (team photo) is client-side only; it resizes to a data URL and
  stores in IndexedDB. It does not validate MIME beyond the image element’s
  ability to decode.
- PDFs are generated from local data; no server-side template injection.

## 8. Local data protection

- IndexedDB and localStorage are plaintext.
- Any script on the origin (including a compromised dependency) can read the
  full farm dataset and the preview bearer token.
- Team photos are stored as data URLs in IndexedDB and never uploaded — good for
  privacy, but still readable by same-origin scripts.
- Backup files are plaintext JSON with a checksum (integrity, not secrecy).
- No at-rest encryption, no passphrase, no secure enclave.

For a farm-operations app this may be acceptable, but it must be a documented
decision, not an accident. The rebuild should offer optional passphrase
encryption for exports and consider encrypting the IndexedDB payload.

## 9. Dependency and supply chain

- 50+ runtime dependencies including Better Auth, pdfmake, Recharts, Radix,
  TanStack, Zustand, Zod, pg, PGlite.
- `package-lock.json` is committed (good).
- `engines.node` pinned to `>=24.21.0 <25`.
- `overrides.nf3 = 0.3.17`.
- No `npm audit` result is committed.
- No SBOM.
- `postinstall`/build scripts exist for Vite/Nitro; supply-chain risk is normal
  for the ecosystem but should be pinned and reviewed.

## 10. Server surface and deployment coupling

| Surface | Exposure | Notes |
|---|---|---|
| `/api/health` | Public | Reveals commit/env/region/uptime/RSS; no secrets; `no-store` |
| `syncAnimals` | Authenticated server fn | Membership-checked; unvalidated body |
| `/api/auth/*` | Public | Better Auth; not exercised in default mode |
| `/__grok/*` | Public | Manifest, icons, install page |
| `?install=1` | Public | Static install tutorial |

Vercel-specific env reads (`VERCEL_*`) and Grok middleware must be removed.

## 11. PWA and cache security

- `/api/*` is never cached — correct.
- Cross-origin requests bypass the SW.
- Cached HTML/JS could persist after a security fix until cache version changes;
  no update prompt.
- No subresource integrity.
- `frame-ancestors 'self'` plus `X-Frame-Options: SAMEORIGIN` is consistent.
- The preview bridge (`PreviewHostBridge`) listens to host messages; it is
  Grok-only and must be removed. Its message validation was not audited in depth.

## 12. Risk register

| ID | Risk | Severity | Evidence | Rebuild action |
|---|---|---|---|---|
| S-01 | Unused auth + no `/login` route | **High** | `gates.tsx:17`, route tree | Complete auth or remove claims |
| S-02 | Role-based approval unreachable | **High** | `seed-state.ts`, `engine.ts:151` | Explicit authority model |
| S-03 | Server sync body unvalidated | **High** | `animals.post.ts` | Zod schema at boundary + batch limits |
| S-04 | Local data plaintext | **Medium** | IndexedDB/localStorage | Document + optional encryption |
| S-05 | No full CSP / HSTS / permissions policy | **Medium** | `security-headers.ts` | Add and test |
| S-06 | Preview secret fallback + Grok issuer | **Medium** | `preview.ts` | Remove platform coupling |
| S-07 | Bearer token in sessionStorage | **Medium** | `auth/client.ts` | Remove with preview flow |
| S-08 | No rate limiting on sync | **Medium** | `animals.post.ts` | Add per-user/per-farm limits |
| S-09 | Idempotency table unbounded | **Low** | migration | TTL/cleanup job |
| S-10 | Health endpoint leaks env metadata | **Low** | `health.ts` | Minimise payload |
| S-11 | No dependency audit/SBOM | **Medium** | repo | CI audit + SBOM |
| S-12 | SW has no update prompt/SRI | **Low** | `sw.js` | Versioned cache + update UX |
| S-13 | No audit log for approvals | **Low** | local events only | Append-only signed log |

## 13. Rebuild security requirements

1. **One coherent access model.** Either:
   - single-user local mode: no auth, no role claims, explicit “local only”
     banner; or
   - multi-user mode: `/login`, session gate, role model, farm switcher.
   Do not ship a half-state.
2. **Server boundary validation** with shared Zod schemas for every server
   function; reject unknown fields; cap batch and string sizes.
3. **Preserve tenant isolation**: `farm_id` on every row, membership check,
   same-site guard, idempotency keys.
4. **Strict CSP** tested against SSR streaming and any OAuth popup; add HSTS,
   `Permissions-Policy`, COOP/CORP.
5. **No platform-coupled secrets**: no Grok issuer, preview client, or
   `__grok` paths.
6. **Local data decision**: document plaintext storage; offer encrypted export;
   consider optional at-rest encryption.
7. **Dependency hygiene**: `npm audit` in CI, lockfile committed, SBOM,
   minimal dependency set.
8. **Rate limiting and audit logging** for mutating endpoints.
9. **Health endpoint** returns only `status`, `version`, `db.ok`; no env/region
   leakage.
10. **Security tests**: auth on/off, role enforcement, cross-site rejection,
    payload limits, checksum tampering, CSP regression.
