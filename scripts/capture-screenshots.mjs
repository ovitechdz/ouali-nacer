#!/usr/bin/env node
/**
 * Evidence capture for the taste/a11y reviews.
 *
 * Two guarantees the previous ad-hoc captures did not have:
 *   1. every shot asserts `documentElement.lang`/`dir` for the requested locale
 *      before it is written, so a shot can never be silently filed under the
 *      wrong locale;
 *   2. after the run the ar and fr shots of the same page and width are hashed,
 *      and an identical pair fails the run (identical pixels across locales mean
 *      the locale never applied).
 *
 * Usage (dev server auto-seeds the demo farm; `vite preview` does not):
 *   npm run dev -- --host 127.0.0.1 --port 5173
 *   node scripts/capture-screenshots.mjs --out C:\path\to\shots --pages journal,nutrition
 *   node scripts/capture-screenshots.mjs --verify C:\path\to\shots
 *
 * Playwright is not a project dependency yet (see HANDOFF). Resolution order:
 * PLAYWRIGHT_PATH, the local install, then the npx cache.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const LOCALES = { ar: 'rtl', fr: 'ltr' };
/** Fixed instant for the fake clock (see addInitScript below). */
const FROZEN_NOW = Date.UTC(2026, 10, 13, 9, 0, 0);
const DEFAULT_PAGES = {
  home: '/',
  journee: '/journee',
  scan: '/scan',
  troupeau: '/troupeau',
  sante: '/sante',
  nutrition: '/nutrition',
  ration: '/ration',
  fourrage: '/fourrage',
  energie: '/energie',
  indicateurs: '/indicateurs',
  journal: '/journal',
  sync: '/sync',
  preuve: '/preuve',
  verification: '/verification',
  ecosysteme: '/ecosysteme',
  cameras: '/ecosysteme/cameras',
  portails: '/ecosysteme/portails',
  balance: '/ecosysteme/balance',
  iot: '/ecosysteme/iot',
  vision: '/vision',
  investisseurs: '/investisseurs',
  label: '/label',
  equipe: '/equipe',
  etat: '/etat',
};

function parseArgs(argv) {
  const args = { base: 'http://127.0.0.1:5173', widths: [360, 420, 1440], locales: ['ar', 'fr'] };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const next = argv[i + 1];
    if (flag === '--base') args.base = next;
    else if (flag === '--out') args.out = next;
    else if (flag === '--verify') args.verify = next;
    else if (flag === '--pages') args.pages = next.split(',').map((name) => name.trim());
    else if (flag === '--widths') args.widths = next.split(',').map(Number);
    else if (flag === '--locales') args.locales = next.split(',').map((name) => name.trim());
    else if (flag === '--motion') {
      // Settled pass: keep page motion on, let it finish, then shoot.
      args.motion = true;
      continue;
    } else continue;
    i += 1;
  }
  return args;
}

function resolvePlaywright() {
  const candidates = [];
  if (process.env.PLAYWRIGHT_PATH) candidates.push(process.env.PLAYWRIGHT_PATH);
  candidates.push('playwright');
  const npxRoot = path.join(process.env.LOCALAPPDATA ?? '', 'npm-cache', '_npx');
  if (fs.existsSync(npxRoot)) {
    for (const entry of fs.readdirSync(npxRoot)) {
      candidates.push(path.join(npxRoot, entry, 'node_modules', 'playwright'));
    }
  }
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // try the next one
    }
  }
  throw new Error(
    'playwright not found. Set PLAYWRIGHT_PATH to a playwright package directory (see HANDOFF).',
  );
}

/** The npx cache ships newer browser builds than are installed; fall back to the local Chromium. */
function resolveExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  const root = path.join(process.env.LOCALAPPDATA ?? '', 'ms-playwright');
  if (!fs.existsSync(root)) return undefined;
  const builds = fs
    .readdirSync(root)
    .filter((entry) => /^chromium-\d+$/.test(entry))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const build of builds) {
    const exe = path.join(root, build, 'chrome-win64', 'chrome.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

function sha256(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function readManifest(dir) {
  const file = path.join(dir, 'manifest.json');
  if (!fs.existsSync(file)) throw new Error(`no manifest.json in ${dir}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Fails when the ar and fr shots of the same page and width are byte-identical. */
function verifyParity(dir, shots) {
  const byKey = new Map();
  const missing = [];
  const tampered = [];
  for (const shot of shots) {
    const file = path.join(dir, `${shot.page}-${shot.width}-${shot.locale}.png`);
    if (!fs.existsSync(file)) {
      missing.push(`${shot.page}@${shot.width} ${shot.locale}`);
      if (!byKey.has(`${shot.page}@${shot.width}`))
        byKey.set(`${shot.page}@${shot.width}`, new Map());
      continue;
    }
    const hash = sha256(file);
    if (shot.sha256 && shot.sha256 !== hash) {
      tampered.push(`${shot.page}@${shot.width} ${shot.locale}`);
    }
    const key = `${shot.page}@${shot.width}`;
    if (!byKey.has(key)) byKey.set(key, new Map());
    byKey.get(key).set(shot.locale, hash);
  }

  if (missing.length) {
    console.error(`[capture] FAIL ${missing.length} shot(s) missing from ${dir}:`);
    for (const entry of missing) console.error(`  ${entry}`);
    process.exitCode = 1;
  }
  if (tampered.length) {
    console.error(`[capture] FAIL ${tampered.length} file(s) changed after capture in ${dir}:`);
    for (const entry of tampered) console.error(`  ${entry}`);
    process.exitCode = 1;
  }

  const identical = [];
  const incomplete = [];
  for (const [key, locales] of byKey) {
    if (locales.size < 2) {
      incomplete.push(key);
      continue;
    }
    if (new Set(locales.values()).size === 1) identical.push(key);
  }
  if (identical.length) {
    console.error(`[capture] FAIL ${identical.length} identical ar/fr pair(s) in ${dir}:`);
    for (const key of identical) console.error(`  ${key}`);
    process.exitCode = 1;
  }
  if (incomplete.length) {
    console.error(`[capture] FAIL ${incomplete.length} pair(s) missing a locale in ${dir}:`);
    for (const key of incomplete) console.error(`  ${key}`);
    process.exitCode = 1;
  }
  if (!identical.length && !incomplete.length && !missing.length && !tampered.length) {
    console.log(`[capture] parity ok - ${byKey.size} page/width pairs differ between ar and fr.`);
  }
}

async function capture(args, chromium) {
  if (!args.out) throw new Error('--out <dir> is required');
  fs.mkdirSync(args.out, { recursive: true });
  const pages = Object.fromEntries(
    Object.entries(DEFAULT_PAGES).filter(([name]) => !args.pages || args.pages.includes(name)),
  );
  if (args.pages) {
    const unknown = args.pages.filter((name) => !(name in DEFAULT_PAGES));
    if (unknown.length) throw new Error(`unknown page(s): ${unknown.join(', ')}`);
  }

  const browser = await chromium.launch({ headless: true, executablePath: resolveExecutable() });
  const shots = [];
  try {
    for (const locale of args.locales) {
      const expectedDir = LOCALES[locale];
      if (!expectedDir) throw new Error(`unsupported locale ${locale}`);
      const context = await browser.newContext({
        viewport: { width: 420, height: 900 },
        // Entrance motion must not race the shutter. By default the app renders
        // its static state (see use-gsap-reveal), so frames are stable and no shot
        // can capture a block that is still at opacity 0. `--motion` keeps the
        // animations on and waits for them to settle instead.
        reducedMotion: args.motion ? 'no-preference' : 'reduce',
      });
      await context.addInitScript((value) => {
        try {
          window.localStorage.setItem('ovitech-language', value);
        } catch {
          // storage may be unavailable; the assertion below catches the fallback
        }
      }, locale);
      // The demo seed derives its timestamps from the current clock (`buildDemoDocument(new Date())`),
      // so two runs a minute apart render different text. Freeze the clock so a recapture is
      // byte-comparable with the previous one. GSAP times tweens from Date.now, so the settled
      // (`--motion`) pass must keep the real clock or every tween would park at frame zero.
      if (!args.motion) {
        await context.addInitScript((fixed) => {
          const RealDate = Date;
          class FrozenDate extends RealDate {
            constructor(...params) {
              if (params.length === 0) super(fixed);
              else super(...params);
            }
            static now() {
              return fixed;
            }
          }
          window.Date = FrozenDate;
        }, FROZEN_NOW);
      }
      const page = await context.newPage();
      page.on('pageerror', (error) => console.error(`[capture] pageerror ${locale}: ${error}`));

      await page.goto(args.base + DEFAULT_PAGES.home, { waitUntil: 'domcontentloaded' });
      if ((await page.locator('#onboarding-farm').count()) > 0) {
        throw new Error('dev seed missing: capture against `npm run dev`, not `vite preview`');
      }
      await page.waitForFunction(() => document.querySelector('h1') !== null, { timeout: 30000 });

      for (const width of args.widths) {
        await page.setViewportSize({ width, height: 900 });
        for (const [name, route] of Object.entries(pages)) {
          await page.goto(args.base + route, { waitUntil: 'domcontentloaded' });
          await page.waitForFunction(() => document.querySelector('h1') !== null, {
            timeout: 30000,
          });
          // A late font swap or a partially decoded image re-renders glyphs and
          // pixels, so hashes churned run to run. Decode both before the shutter.
          await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all(
              [...document.images].map((image) => image.decode().catch(() => undefined)),
            );
          });
          if (args.motion) {
            // Walk the page once so every ScrollTrigger batch plays, then return
            // to the top and let the last tween finish before the shutter.
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(900);
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.waitForTimeout(700);
          } else {
            await page.waitForTimeout(300);
          }

          const actual = await page.evaluate(() => ({
            lang: document.documentElement.lang,
            dir: document.documentElement.dir,
            path: location.pathname,
            hiddenReveals: [...document.querySelectorAll('[data-reveal], [data-enter]')].filter(
              (element) => {
                const style = window.getComputedStyle(element);
                return style.opacity === '0' || style.visibility === 'hidden';
              },
            ).length,
          }));
          if (actual.lang !== locale || actual.dir !== expectedDir) {
            throw new Error(
              `${name}@${width}: expected lang=${locale} dir=${expectedDir}, got lang=${actual.lang} dir=${actual.dir}`,
            );
          }
          if (actual.hiddenReveals > 0) {
            throw new Error(
              `${name}@${width} ${locale}: ${actual.hiddenReveals} hidden reveal block(s)`,
            );
          }

          const file = path.join(args.out, `${name}-${width}-${locale}.png`);
          await page.screenshot({ path: file });
          const hash = sha256(file);
          shots.push({ page: name, width, locale, sha256: hash, bytes: fs.statSync(file).size });
          console.log(`[capture] ${name}@${width} ${locale} ${hash.slice(0, 12)}`);
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(args.out, 'manifest.json'),
    JSON.stringify({ base: args.base, capturedAt: new Date().toISOString(), shots }, null, 2),
  );
  verifyParity(args.out, shots);
}

const args = parseArgs(process.argv.slice(2));
if (args.verify) {
  verifyParity(args.verify, readManifest(args.verify).shots);
} else {
  const { chromium } = resolvePlaywright();
  await capture(args, chromium);
}
