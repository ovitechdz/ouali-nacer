# Design tooling manifest

Development-only design and QA tooling. None of it is imported by the application,
added to `package.json`, or shipped in the bundle. The trees are gitignored; this file
is the reproducible record of what was installed and how.

Recorded 2026-11-07. Node `24.21.0`, npm `11.19.0`.

## Installed

| Tool | Version | Location on disk | Installed with | Verification |
|---|---|---|---|---|
| `skills` CLI | 1.7.6 | npx cache | `npx skills@1.7.6` | `npx --no-install skills --version` |
| `design-taste-frontend` (tasteskill) | 2.5.1 | `.agents/skills/design-taste-frontend/` | `npx skills add Leonxlnx/taste-skill` | `skills-lock.json` hash `974e1bb8cf7c78d3a63f1456d54a97119c03e7ab8bf374e04ade800892326ec7` |
| `impeccable` skill | 4.8.0 | `.agents/skills/impeccable/`, `.github/skills/impeccable/` | `npx impeccable install` | `scripts/VERSION` = `0.1.18` (engine) |
| `impeccable` engine | 0.1.18 (windows-x64) | `…/scripts/bin/windows-x64/impeccable.exe` | shipped with the skill | SHA-256 `8f61e96b0c97001546a824d79b44f46b423b560f3eb1a0cc44a8695a1b395d9f`, matches `scripts/engine-checksums.txt` |
| `transitions-dev` | unversioned snapshot | `.agents/skills/transitions-dev/` | `npx skills add Jakubantalik/transitions.dev` | `skills-lock.json` hash `b8f0f695498eec44440f3c00a5a0cf8dcc9e1b4d5b519665bf789cff683aa7c5` |
| `transitions-polish` | unversioned snapshot | `.agents/skills/transitions-polish/` | same source as above | `skills-lock.json` hash `e456d8cc8ef3b18ae9d1f5be41ea92b0b14abeb8cf8cf7eff2da09966b15a785` |
| `transitions-ui-generation` | not installed | — | installer skipped it | YAML parse error: `Nested mappings are not allowed in compact mappings` |
| `@playwright/cli` | 0.1.23 | global npm prefix | `npm install -g @playwright/cli@0.1.23` | `npm ls -g --depth=0` |
| Playwright CLI skill | bundled with 0.1.23 | `.claude/skills/playwright-cli/` | `playwright-cli install --skills` | five skills listed by `npx skills list` |
| `designlang` | 13.4.0 | npx cache | `npx designlang@13.4.0` (run ad hoc) | `npx designlang@13.4.0 --version` |

`impeccable init` wrote `PRODUCT.md`; `designlang` produced the extraction under
`docs/rebuild/design-extract-style/`. Neither is a runtime dependency.

## What is ignored, and why

`.agents/`, `.claude/skills/`, `.codex/`, `.github/skills/`, `.github/agents/`,
`.github/hooks/`, `.playwright/`, `.playwright-cli/` and `skills-lock.json` are
third-party tool trees (about 78 MB, including two 19.5 MB copies of
`impeccable.exe`). They are excluded from git, Prettier, ESLint, TypeScript,
Vitest and Tailwind source scanning. `.github/workflows/` is application
configuration and stays tracked.

## Security posture (read-only review, 2026-11-07)

Nothing from either skill was executed during the review; the commands above are
recorded, not re-run.

- **No secret reads found.** No `.env`, `.ssh`, keychain, credential or token file
  reads in either skill. `process.env` use is limited to locating Chrome
  (`CHROME_PATH`, `LOCALAPPDATA`, `PROGRAMFILES`, `USERPROFILE`), a temp-dir
  override (`TASTE_SKILL_TMP`), and the user's own `OPENAI_API_KEY` for the
  optional image-generation fallback.
- **Process execution.** `design-taste-frontend` runs headless Chrome via
  `child_process.spawn` and kills only its own process trees with `taskkill`
  (`scripts/gate.mjs`, `scripts/consistency.mjs`, `scripts/icons.mjs`,
  `scripts/photos.mjs`, the asset checkers). `photos.mjs` optionally runs
  `ffmpeg` to convert JPEG to WebP. Its `SKILL.md` frontmatter also installs a
  `Stop` hook that executes `node scripts/gate.mjs --hook claude`.
- **Network at runtime.** Wikimedia Commons API and `upload.wikimedia.org`
  (photo search/fetch), `picsum.photos` (library frames), `cdn.jsdelivr.net`
  (icons), `overpass-api.de` (map baking, one POST with a bounding box), and
  Google Fonts links emitted into generated pages. `impeccable` makes one
  `GET https://impeccable.style/api/roll` per direction roll (scope, mode, seed,
  re-roll counter; no project files, prompts or code), an optional anonymous
  choice ping that honours `DO_NOT_TRACK`/`IMPECCABLE_NO_TELEMETRY`, and the
  optional OpenAI image fallback.
- **Contradictions with project rules.** Some skill templates and asset
  modules load Google Fonts, Unsplash or Picsum at page runtime. Nothing is
  copied into `src/`; the application remains offline-first and self-hosted.
- **Hooks.** `impeccable` installs post-edit/Stop hooks (`.codex/hooks.json`,
  `.github/hooks/impeccable.json`); `design-taste-frontend` carries a `Stop`
  hook in `SKILL.md`. They are development guardrails, are not committed, and
  are not part of the application runtime.
