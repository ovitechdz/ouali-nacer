# Phase 2 — Hosting Decision

**Status:** proposed, awaiting Approval Gate 2
**Constraint:** Vercel excluded (D-0003). No deployment in this phase.
**Key fact:** in the MVP, the host serves **static code only**. All farm data
stays in the user's browser. No personal or farm data reaches the host.

---

## 1. Requirements

| # | Requirement | Weight |
|---|---|---|
| R1 | Serve static files over HTTPS with a custom domain | must |
| R2 | SPA fallback (`/troupeau/OV-2401` → `index.html`) | must |
| R3 | Custom security headers and cache rules | must |
| R4 | Immutable, atomic deploys with rollback | must |
| R5 | No Vercel | must |
| R6 | Low or zero operating cost | high |
| R7 | No server-side runtime for the MVP | high |
| R8 | Predictable jurisdiction / data location | medium |
| R9 | Path to add a backend later without changing providers | medium |
| R10 | Works well from Algeria (latency, availability) | medium |

---

## 2. Options

| Option | R1 | R2 | R3 | R4 | R6 | R7 | R8 | R10 | Notes |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|---|
| **Cloudflare Pages** | ✅ | ✅ | ✅ | ✅ | ✅ free | ✅ | Global edge; configurable | ✅ good |
| Netlify | ✅ | ✅ | ✅ | ✅ | ✅ free tier | ✅ | US/EU regions | ✅ good |
| GitHub Pages | ✅ | ⚠️ 404 hack | ❌ no headers | ✅ | ✅ | ✅ | Microsoft | ✅ |
| Hetzner VPS + Caddy | ✅ | ✅ | ✅ | ⚠️ self-managed | ~€4.5/mo | ✅ | EU (DE/FI) | ✅ |
| Algerian VPS / host | ✅ | ✅ | ⚠️ varies | ⚠️ | varies | ✅ | DZ | ⚠️ variable |
| Object storage + CDN (S3/R2) | ✅ | ⚠️ manual | ⚠️ CDN rules | ⚠️ | low | ✅ | varies | ✅ |

---

## 3. Recommendation

### ADR-011 — Cloudflare Pages for the MVP, Hetzner + Caddy as fallback

**Primary:** Cloudflare Pages.

**Why:**

1. Static hosting with first-class custom headers (`_headers`) and SPA
   fallback (`_redirects`).
2. Global edge network, good latency from North Africa.
3. Immutable deploys and instant rollback by commit.
4. Zero cost at expected traffic.
5. No server runtime to secure — the smallest possible attack surface.
6. Preview deployments per branch for visual review.

**Fallback:** Hetzner CX22 (or equivalent) + Caddy, deployed with a small
systemd unit and a static directory. Chosen if the owner requires EU-only
infrastructure, wants full control, or Cloudflare is unacceptable. Caddy gives
automatic TLS and simple headers; cost ≈ €4.5/month.

**Rejected:**

- **Vercel** — excluded by decision.
- **GitHub Pages** — cannot set the required security headers, SPA fallback is
  a 404 hack, no cache control.
- **Algerian host as primary** — attractive for residency, but the MVP stores
  no data server-side, and quality/automation varies. It remains a valid
  choice if the owner prefers it; the build is host-agnostic.

**Migration cost between providers:** near zero — one static directory, one
headers file, one redirects file. This is deliberate.

---

## 4. Host configuration

### 4.1 `public/_headers` (Cloudflare / Netlify compatible)

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/sw.js
  Cache-Control: no-cache

/manifest.webmanifest
  Content-Type: application/manifest+json
  Cache-Control: public, max-age=3600
```

Notes:

- `style-src 'unsafe-inline'` is a documented exception for Radix inline styles
  and chart positioning. It is reviewed at Phase 7.
- `worker-src blob:` is required if the PDF worker is bundled as a blob.
- No `unsafe-eval`, no third-party origins.

### 4.2 `public/_redirects`

```
/*  /index.html  200
```

SPA fallback. Deep links and PWA launches resolve to the shell; the router
renders the route.

### 4.3 Caching model

| Asset | Policy |
|---|---|
| `index.html` | `no-cache` (must revalidate) |
| Hashed JS/CSS | immutable, 1 year |
| Fonts/icons | immutable, 1 year |
| `sw.js`, manifest | no-cache / short |
| Offline page | short cache |

---

## 5. Build and release

```
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run build          # static output in dist/
npm run test:e2e       # against `vite preview`
npm run audit:bundle   # budgets
→ upload dist/
```

- Node pinned by `.nvmrc` and `engines` (24.21.x), npm lockfile committed.
- Build is reproducible; no remote build step fetches secrets.
- Deploy is atomic: new asset hashes, new `index.html`, new service worker.
- Rollback = promote the previous deployment; no rebuild.
- A release manifest records commit SHA, build time, engine version, schema
  version, and the locale set.

### Environments

| Environment | Purpose | Data |
|---|---|---|
| Local | development | seed, dev only |
| Preview | per-PR visual review | seed, labelled |
| Production | users | empty start, local data only |

No staging server with real data. There is no shared database to stage.

---

## 6. Domain, TLS, and PWA

- Custom domain over HTTPS; HSTS after the domain is stable.
- `manifest.webmanifest` served from the root scope; `start_url: "/"`.
- Icons and fonts under the same origin (no CDN subdomain) so the service
  worker can precache them without CORS complexity.
- A `/.well-known/security.txt` is optional; add in Phase 7.
- If hosted on a path (not recommended), `base` must be set at build time and
  the SW scope adjusted. **Root hosting is required.**

---

## 7. Monitoring (no analytics)

| Check | Method | Alert |
|---|---|---|
| Site reachable | external uptime check on `/` every 5 min | email |
| Manifest reachable | check `/manifest.webmanifest` | email |
| TLS expiry | host-managed or uptime checker | 14 days before |
| Build failure | CI notification | immediate |

No user tracking, no third-party scripts, no cookies. If product analytics are
ever required, they must be self-hosted, consented, and documented.

---

## 8. Cost estimate

| Item | Monthly |
|---|---|
| Cloudflare Pages (static, expected traffic) | €0 |
| Domain | ~€1–2 amortised |
| Uptime monitor | €0 (free tier) |
| **Total** | **≈ €1–2** |
| Fallback: Hetzner CX22 + backups | ≈ €5–6 |

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Provider policy change | Static output is portable in hours |
| Edge cache serving stale SW | `sw.js` no-cache + versioned cache + update prompt |
| CSP breaks a library | CSP tested in CI with Playwright; violations fail |
| Header file unsupported by a future host | Caddy/nginx equivalents documented |
| Domain/DNS ownership unclear | Confirm before Phase 8; no deployment without it |
| Data residency objection | Fallback VPS in chosen jurisdiction; no data is hosted anyway |

---

## 10. What is explicitly not decided here

- The production domain name.
- DNS provider and registrar.
- Whether a backend is ever added (Phase 6+ decision).
- Backup hosting for the static artifact itself (Git + release archive is
  enough).

---

## 11. Open questions for Gate 2

| # | Question | Default |
|---|---|---|
| H-1 | Accept Cloudflare Pages as primary? | Yes |
| H-2 | Accept Hetzner + Caddy as documented fallback? | Yes |
| H-3 | Accept root-domain hosting with the given headers? | Yes |
| H-4 | Accept zero analytics and uptime-only monitoring? | Yes |
