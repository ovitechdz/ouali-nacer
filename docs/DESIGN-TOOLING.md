# Design tooling manifest

Development-only design and QA tooling. None of it is imported by the application,
added to `package.json`, or shipped in the bundle. The trees are gitignored; this file
is the reproducible record of what was installed and how.

Recorded 2026-11-07; automatic hooks disabled 2026-11-08; GSAP skills added
2026-11-08. Node `24.21.0`, npm `11.19.0`.

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
| `gsap-skills` (`gsap-core`, `gsap-frameworks`, `gsap-performance`, `gsap-plugins`, `gsap-react`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-utils`) | source commit `aed9cfd3277740755f6bfc1155c7aa645403b760` | `.agents/skills/gsap-*/` (8 folders, `SKILL.md` only) | `npx skills add https://github.com/greensock/gsap-skills --skill '*' --agent codex github-copilot opencode -y` | `npx skills list` shows all 8, source `greensock/gsap-skills`; hashes in `skills-lock.json`; each `SKILL.md` declares `license: MIT` |

`impeccable init` wrote `PRODUCT.md`; `designlang` produced the extraction under
`docs/rebuild/design-extract-style/`. Neither is a runtime dependency.

## What is ignored, and why

`.agents/`, `.claude/skills/`, `.codex/`, `.github/skills/`, `.github/agents/`,
`.github/hooks/`, `.playwright/`, `.playwright-cli/` and `skills-lock.json` are
third-party tool trees (about 78 MB, including two 19.5 MB copies of
`impeccable.exe`). They are excluded from git, Prettier, ESLint, TypeScript,
Vitest and Tailwind source scanning. `.github/workflows/` is application
configuration and stays tracked.

## Automatic hooks disabled (2026-11-08)

No skill file was deleted and no skill script was modified. Three edits remove
the automatic execution paths. All three files are gitignored, so reinstall
restores them; repeat the edits below after any reinstall or upgrade.

1. **`design-taste-frontend` Stop hook.** In
   `.agents/skills/design-taste-frontend/SKILL.md`, remove the `hooks:` block
   from the YAML frontmatter (the six lines beginning `hooks:` and ending
   `timeout: 600`, immediately before the closing `---`). The skill body and all
   `scripts/` files remain untouched. Run the quality gate manually:
   `node .agents/skills/design-taste-frontend/scripts/gate.mjs`.
2. **Codex impeccable hooks.** `.codex/hooks.json` is replaced with:
   `{"hooks": {}}`. This removes both `PostToolUse` and `Stop`.
3. **GitHub Copilot impeccable hook.** `.github/hooks/impeccable.json` is
   replaced with: `{"version": 1, "hooks": {}}`. This removes `postToolUse`.

Exact reproduction after a reinstall:

```powershell
# 1. In .agents/skills/design-taste-frontend/SKILL.md, delete the frontmatter
#    block from "hooks:" through "timeout: 600" (lines 14–19 in 2.5.1).
# 2. And 3. empty the two registries (keeps the files, disables the hooks):
Set-Content .codex/hooks.json '{"hooks": {}}'
Set-Content .github/hooks/impeccable.json '{"version": 1, "hooks": {}}'
```

Do not run `impeccable hooks install` or re-add a `hooks:` block. The
`impeccable` hooks are disabled even though the skill instructions still
document them; the documentation file is not a hook registry.

## Telemetry opt-out (2026-11-08)

The user-scope environment variables were set with:

```powershell
[Environment]::SetEnvironmentVariable('DO_NOT_TRACK', '1', 'User')
[Environment]::SetEnvironmentVariable('IMPECCABLE_NO_TELEMETRY', '1', 'User')
```

Verify with:

```powershell
[Environment]::GetEnvironmentVariable('DO_NOT_TRACK', 'User')            # 1
[Environment]::GetEnvironmentVariable('IMPECCABLE_NO_TELEMETRY', 'User') # 1
```

They apply to processes started after the change; an already-running agent
keeps its inherited environment until restarted. `OPENAI_API_KEY` is **not
visible** to this process and is not present in the user or machine scope
(checked by name only; no value was read). The optional image-generation
fallback therefore cannot run here without an explicit key.

## Project prohibitions (2026-11-08)

These are forbidden in this project from now on, independent of what a skill
document says:

- `impeccable generate-image` — no image-generation API calls.
- `impeccable live` and live mode — no localhost capture/injection service.
- Any runtime asset download (Wikimedia, Unsplash, Picsum, jsDelivr, Google
  Fonts, Overpass, or any other external origin).
- Copying any skill template or asset that loads Google Fonts, Unsplash,
  Picsum, jsDelivr or another external origin into `src/` or `public/`.
- Running any skill hook automatically. Quality gates are run manually.

## GSAP skills — install and read-only review (2026-11-08, corrected 2026-11-12)

The official GreenSock agent skills were installed for reference only. At install time **`gsap`
itself was not installed**. Current state (verified Phase 6): `gsap@3.15.1` **is** declared in
`package.json` `dependencies` (and present in `node_modules`), but **no file under `src/` imports
it** — the eight `gsap-*` skills remain reference material. Any actual use of gsap requires a
measured bundle-budget check and explicit approval (see DECISION-LOG D-0034).

Install command, run from the project root:

```powershell
npx skills add https://github.com/greensock/gsap-skills --skill '*' --agent codex github-copilot opencode -y
```

Result: eight skills in `.agents/skills/gsap-*/`, each containing only
`SKILL.md` (no scripts, examples or binaries). Source commit
`aed9cfd3277740755f6bfc1155c7aa645403b760`; integrity hashes are recorded in
`skills-lock.json`. `npx skills list` confirms all eight with source
`greensock/gsap-skills`. The folders are covered by the existing `.agents/`
ignore rule (`git check-ignore` returns `.gitignore:23:.agents/`), so
`git status` stays clean.

Read-only review — nothing from the skills was executed. Per-file findings:

| Check | Finding | File:line |
|---|---|---|
| Hooks | None. Frontmatter has only `name`, `description`, `license` in all eight files; no `hooks:`, `allowed-tools`, `PostToolUse` or `Stop`. | `gsap-*/SKILL.md:1-5` |
| Shell execution | None. No `child_process`, `spawn`, `exec`, `execSync`, PowerShell or shell block. The only `bash` fence is documentation for the user, not an executed instruction. | `gsap-react/SKILL.md:17-22` (docs only) |
| Runtime network | None. Every URL is a documentation hyperlink to `gsap.com`; no `fetch`, `XMLHttpRequest`, `curl`, `wget`, `axios` or WebSocket. | `gsap-core/SKILL.md:114,237`; `gsap-plugins/SKILL.md:17,101,220,258,301,433`; `gsap-scrolltrigger/SKILL.md:44,118,149,295`; `gsap-react/SKILL.md:136`; `gsap-utils/SKILL.md:19,180,205,284` |
| Reads outside project | None. No `$HOME`, `~/`, `process.env`, `.env`, `.ssh`, `.aws`, credential or token file access. | scan of all eight files |
| Hidden instructions | None. No "ignore previous", "disregard", system-prompt or exfiltration language. The only `token` hits are warnings **not** to create an `.npmrc` or use the private registry. | `gsap-plugins/SKILL.md:17,20` |
| Broken reference | `gsap-frameworks` points to `examples/vue/` and `examples/nuxt/`, which the installer did not copy. Do not follow; the patterns are fully inlined in the prose. | `gsap-frameworks/SKILL.md:23,94` |

The installer's own scan reported all eight as "Safe / 0 alerts / Low Risk";
that is a third-party signal, not a substitute for the review above. Findings:
the skill set is documentation only and carries no executable surface. The
`npm install gsap` line is an instruction to the reader and remains forbidden
until an explicit dependency decision is taken.

## GSAP npm licence (not installed)

Checked from the published package metadata and licence text on 2026-11-08.

- Package: `gsap@3.15.1`. The published tarball contains **no standalone
  `LICENSE`/`LICENSE.txt` file** (179 files; both paths return 404, and the
  GitHub repository root has no licence file either).
- The licence declaration is in `package.json:66`:
  `"license": "Standard 'no charge' license: https://gsap.com/standard-license."`
- `README.md:90-93` repeats it: `### License`, the `gsap.com/standard-license`
  link, and `Copyright (c) 2008-2026, GreenSock. All rights reserved.`
- Canonical text: the Standard "No Charge" GSAP License at
  `https://gsap.com/standard-license`, effective 2025-04-30. Its FAQ states:
  "Yes, really! Commercial usage is covered under the standard license. All of
  GSAP including the plugins that were formerly 'members-only' like SplitText
  and MorphSVG can be used in commercial projects at no charge."
- Therefore commercial use is permitted, including **ScrollTrigger** and
  **SplitText**. Restrictions: no use in a competing visual animation builder,
  no reverse engineering for a competitive product, and no removal of
  proprietary notices. The old "end users must not be charged" summary is
  commented out in the page HTML and is not part of the current I–VI grant.
- Nothing was installed; this is a licence reading, not a dependency approval.

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
  `ffmpeg` to convert JPEG to WebP. Its `SKILL.md` frontmatter previously
  installed a `Stop` hook that executed `node scripts/gate.mjs --hook claude`;
  that block was removed on 2026-11-08 (see above).
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
- **Hooks (disabled).** `impeccable` originally registered post-edit/Stop hooks
  (`.codex/hooks.json`, `.github/hooks/impeccable.json`) and
  `design-taste-frontend` carried a `Stop` hook in `SKILL.md`. All automatic
  registrations were removed/emptied on 2026-11-08; they are not committed and
  are not part of the application runtime.
