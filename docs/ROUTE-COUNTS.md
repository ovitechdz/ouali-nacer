# Route counts — reconciled (2026-11-12)

Source of truth: `src/app/router.tsx` (28 `createRoute` calls). Alias pages are separate paths that
render the same screen.

| Count | Meaning | Evidence |
| --- | --- | --- |
| **28** | total route paths in the router | `src/app/router.tsx` (28 `createRoute(`) |
| **27** | static URLs (no path parameters) | all except `/troupeau/$id` |
| **1** | dynamic URL | `/troupeau/$id` |
| **24** | distinct screens | 22 files in `src/pages` + the two ecosystem hub screens rendered from `router.tsx` |
| 22 | page components on disk | `src/pages/*.tsx` excluding tests |

## Aliases (both paths render the same screen)

| Alias | Canonical | Note |
| --- | --- | --- |
| `/team` | `/equipe` | team page, French path is canonical |
| `/donnees` | `/troupeau` | data entry renders the herd page |

## Why the numbers differed

Earlier documents counted different things: 27 = static URLs, 24 = screens, 26 = screens excluding
the two alias paths (`/team`, `/donnees`). The table above is the single reconciled reference; do not
restate a count without its definition.
