# PWA and Offline Audit — Phase 1

**Reference:** `ovitechdz/ovitech.saas-` @ `f99cd02`
**Sources:** `public/sw.js`, `src/lib/register-sw.ts`, `src/components/install-button.tsx`,
`src/lib/indexed-db-storage.ts`, `src/lib/store/index.ts`, `src/routes/__root.tsx`,
`scripts/grok-pwa-plugin.mjs`, `scripts/grok-pwa-shared.mjs`,
`server/middleware/grok-pwa.ts`, `scripts/postbuild-precache.mjs`.

## 1. Verdict

The app is **offline-capable after a first successful online visit**, but it is
not fully offline-first:

| Capability | Status |
|---|---|
| Local domain data (herd, recs, feed, events, weights) | **Works offline** (IndexedDB) |
| Navigation to already-visited pages | **Works offline** (cache-first navigations) |
| First visit / uncached page | **Fails offline** (no precache of route chunks) |
| Static assets | **Works offline once cached** (stale-while-revalidate) |
| Arabic/French PDF fonts | **Works offline after chunk load**, but Amiri is inlined |
| Google Fonts | **Fails offline unless browser cache has them** |
| Real network detection | **Missing** (manual toggle only) |
| Background sync / queue drain | **Missing** |
| Auth/session offline | **Not supported** (auth is effectively off) |
| Install prompt | **Works** (Chrome/Edge; iOS instructional) |

The strongest offline property is the **domain store**, not the service worker.

## 2. Service worker

Source: `public/sw.js` (113 lines).

- Cache name: `ovitech-shell-v3`.
- `PRECACHE = []` — **no build assets are precached**.
- `APP_SHELL`:
  - `/`
  - `/__grok/manifest.webmanifest`
  - `/favicon.svg`
  - `/__grok/icon-180.png`
  - `/__grok/icon-192.png`
  - `/__grok/icon-512.png`
- `install`: `skipWaiting()`, then `cache.addAll`-style fetch of the shell with
  `Promise.allSettled` (individual failures tolerated).
- `activate`: deletes all caches except the current name, then `clients.claim()`.
- `fetch`:
  - non-GET → passthrough;
  - cross-origin → passthrough;
  - `/api/*` → passthrough (never cached);
  - `navigate` → network-first, cache the response, fall back to cache or `/`;
  - `/__grok/*` → network-first with cache fallback;
  - asset regex (`js|mjs|css|map|json|svg|png|jpe?g|gif|ico|woff2?|ttf|eot|webmanifest`)
    → cache-first with background revalidation;
  - everything else → network only.

### Consequences

1. **No precache** means the first offline navigation to a route whose JS chunk
   was never fetched will fail or render an incomplete shell.
2. `/api/*` is never available offline — correct for a real API, but the app’s
   only API is health/sync scaffolding, so this has little impact today.
3. Navigation fallback is `/`, so a deep link offline returns the home document;
   the client router may then fail to resolve the route chunk.
4. Cache is keyed by request URL; query strings create separate entries.
5. No cache size limit or eviction policy; the cache grows with every visited
   asset.
6. No `message` handler for skip-waiting/update prompts. Users get a new SW on
   the next full reload only.
7. Cache name is hard-coded; a deploy without a name change keeps stale assets
   until revalidation.
8. `scripts/postbuild-precache.mjs` exists but the runtime SW does not consume a
   generated manifest in this file. The build may inject `PRECACHE`, but the
   tracked `sw.js` is the source of truth for the served file unless the plugin
   rewrites it. This needs runtime verification in Phase 2.

### Registration

`src/lib/register-sw.ts`:

- only in `import.meta.env.PROD`;
- only once per session (`sessionStorage["ovitech-sw-registered"]`);
- scope `/`;
- failure logged, stamp removed.

Therefore **dev-mode offline testing is impossible without a production build**.

## 3. Manifest and icons

- Manifest is not a static file. It is rendered by Nitro middleware at
  `/__grok/manifest.webmanifest` (`server/middleware/grok-pwa.ts`) and by a Vite
  plugin during preview/dev (`scripts/grok-pwa-plugin.mjs`).
- Fields: `name`/`short_name` derived from host, `id`, `start_url`, `scope`,
  `display: standalone`, `background_color: #0a1220`, `theme_color: #0a1220`,
  icons 180/192/512 + maskable 512.
- Icons live under `public/__grok/` and are referenced by absolute path.
- `__root.tsx` links the manifest and Apple touch icon.
- Install page: `/…?install=1&platform=ios` renders an instructional page from
  `public/__grok/install/`.

### Coupling risk

Every PWA identity asset is under `/__grok/`, a Grok-platform namespace. The
rebuild must ship:

- `public/manifest.webmanifest` (static, Arabic-first name/short name),
- `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`,
  `apple-touch-icon.png`,
- its own install instructions,
- and remove `server/middleware/grok-pwa.ts`, `scripts/grok-pwa-*.mjs`,
  `virtual:grok-og-identity`, and the `__grok` cache branch.

## 4. Local persistence

Source: `src/lib/indexed-db-storage.ts` (242 lines).

- DB `ovitech`, version 2.
- Stores: `persist` (key/value strings) and `outbox` (records with indexes on
  `status`, `created_at`, `(entity_type, entity_id)`).
- Zustand store `ovitech-farm-v5`, `version: 3`, `skipHydration: true`.
- One-time migration from legacy `localStorage` key.
- Fallback to `localStorage` if IndexedDB is absent.
- Persist errors are recorded and surfaced by the shell every 1.5 s.
- Outbox has a `localStorage["ovitech-outbox-v1"]` fallback.
- Team photos use a separate persisted store (`ovitech-team-photos`).
- Language and UI preferences use `localStorage`.

### Durability assessment

- Domain data survives reload, tab close, and offline periods.
- IndexedDB quota exhaustion is handled by a toast but not by a retry/eviction
  strategy.
- No encryption at rest; data is readable by any script on the origin.
- No export reminder or storage-pressure indicator.
- `skipHydration` + manual rehydrate means the first render can show seed data
  briefly before persisted data loads. The animal dossier guards against this;
  other pages do not.

## 5. Network state

- `NetworkState` is stored (`online|offline`) and toggled manually from the
  header and `/sync`.
- **No `navigator.onLine` check.**
- **No `online`/`offline` event listeners.**
- When offline:
  - badge changes;
  - a `erreur` event “Réseau coupé” is appended;
  - `/sync` refuses to run;
  - `/journee` and `/scan` show banners;
  - local writes continue.
- When back online, nothing is drained automatically; the user must press
  “Synchroniser”.

This is a **simulation of offline mode**, not detection of it. The rebuild must
use `navigator.onLine` + events, plus a heartbeat, and keep the manual override
for demos if desired.

## 6. Install flow

`src/components/install-button.tsx`:

- captures `beforeinstallprompt`;
- hides the button when standalone or already stamped
  (`localStorage["ovitech-pwa-installed"]`);
- iOS Safari → shows “Share → Add to Home Screen” instructions;
- other browsers without the event → hides the button;
- marks installed on `appinstalled`.

Gaps:

- No `display-mode` change listener after install.
- No per-platform instructions for Android non-Chrome.
- No offline-readiness message before install.

## 7. Offline test matrix (for the rebuild)

| Scenario | Expected |
|---|---|
| First load online, then airplane mode, reload `/` | App shell renders; data from IndexedDB |
| Offline deep link to `/troupeau/an-2401` never visited | Precache must serve route chunk, else explicit offline page |
| Offline create animal + weight | Persist locally; outbox row PENDING |
| Offline serve ration | Allowed; stock debited; event local |
| Restore online | Detect connectivity; drain outbox; show progress; resolve conflicts |
| Two tabs open, one writes | Other tab reflects state (storage event or rehydrate) |
| Storage quota exceeded | Clear error + export prompt |
| Update deployed | New SW activates on reload; no mixed old/new chunks |
| Arabic offline | AR bundle + Amiri font cached |
| Install then launch offline | Standalone window opens cached shell |

None of these are covered by the current test suite.

## 8. Gaps and risks

| ID | Risk | Severity | Fix direction |
|---|---|---|---|
| P-01 | No asset precache → uncached routes fail offline | High | Generate precache manifest at build; cache all route chunks + fonts |
| P-02 | Grok-namespaced manifest/icons | High | Own manifest + icons |
| P-03 | Manual network toggle, no detection | High | `navigator.onLine` + events + heartbeat |
| P-04 | No outbox drain / background sync | High | Drain loop + Background Sync API where available |
| P-05 | Google Fonts network dependency | Medium | Self-host WOFF2 |
| P-06 | Cache name static / no update UX | Medium | Versioned cache + update prompt |
| P-07 | No cache eviction | Medium | Limit entries / LRU |
| P-08 | Hydration flash on non-dossier pages | Medium | Global hydration gate |
| P-09 | No encryption at rest | Medium | Optional passphrase/WebCrypto |
| P-10 | No storage pressure indicator | Low | `navigator.storage.estimate()` |
| P-11 | `api/*` never cached (fine today) | Low | Keep; document |
| P-12 | Dev cannot test SW | Low | Add preview-mode test script |

## 9. Rebuild requirements

1. **Arabic-first manifest**: `name: "أوفيتيك"`, `short_name: "أوفيتيك"`,
   `lang: "ar"`, `dir: "rtl"`, `start_url: "/"`, `display: standalone`,
   theme `#0a1220`, background `#0a1220`.
2. **Self-hosted fonts** (Fraunces/Manrope/IBM Plex Mono or Arabic equivalents)
   and a local Amiri for PDFs.
3. **Build-time precache** of the app shell, route chunks, icons, fonts and the
   offline page.
4. **Offline page** at `/offline` with a clear “data is local” message.
5. **Real connectivity detection** with a manual override retained for demos.
6. **Outbox drain** with idempotency keys, exponential backoff, conflict states
   and a visible queue.
7. **Update flow**: detect a waiting SW, show “update available”, activate on
   confirmation.
8. **Storage transparency**: show usage, allow export, warn before quota.
9. **No Grok paths** in manifest, icons, middleware or cache rules.
10. **Offline test suite** covering the matrix in §7, run against a production
    build.
