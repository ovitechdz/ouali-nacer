#!/usr/bin/env node
/**
 * Batch 3 motion proof (D-0048 / D-0049 / D-0050).
 *
 * Proves, in a real browser, that:
 *   1. the ten approved routes play the CSS page entrance (opacity + vertical
 *      translate, 250 ms) on first paint and on a client-side route change;
 *   2. the travel is vertical in both locales, so RTL never mirrors it;
 *   3. the entrance changes no layout box, and cumulative layout shift stays
 *      within what the same routes already do with motion turned off (control);
 *   4. `prefers-reduced-motion: reduce` removes every animation, including the
 *      skeleton pulse and the loading spin;
 *   5. every existing hover/focus/colour transition uses the shared durations
 *      and easing, and none animates a layout property;
 *   6. the ar and fr screenshots of the same route and width differ.
 *
 * Usage: start `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`, then
 *   node scripts/verify-motion.mjs --out <dir>
 *
 * Playwright is not a project dependency yet (K-75). Resolution order:
 * PLAYWRIGHT_PATH, the local install, then the npx cache.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const ROUTES = {
  energie: '/energie',
  indicateurs: '/indicateurs',
  ecosysteme: '/ecosysteme',
  cameras: '/ecosysteme/cameras',
  portails: '/ecosysteme/portails',
  balance: '/ecosysteme/balance',
  iot: '/ecosysteme/iot',
  vision: '/vision',
  label: '/label',
  etat: '/etat',
};

const LOCALES = { ar: 'rtl', fr: 'ltr' };
const DURATION_MS = 250;
const OFFSET_PX = 6;
const MID_MS = 125;
const CLS_LOAD_LIMIT = 0.01;
const CLS_ROUTE_MARGIN = 0.01;
/** Only these transition longhands may animate (D-0049). */
const ALLOWED_PROPERTIES = [
  'color',
  'background-color',
  'border-color',
  'outline-color',
  'text-decoration-color',
  'fill',
  'stroke',
  'opacity',
  'transform',
  'box-shadow',
];
const LAYOUT_PROPERTIES = [
  'width',
  'height',
  'top',
  'left',
  'right',
  'bottom',
  'margin',
  'padding',
];

function parseArgs(argv) {
  const args = { base: 'http://127.0.0.1:5173', out: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--base') args.base = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
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
  throw new Error('playwright not found. Set PLAYWRIGHT_PATH (see K-75).');
}

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

const failures = [];
const checks = [];
function check(label, condition, detail) {
  checks.push({ label, ok: Boolean(condition), detail });
  if (!condition) failures.push(`${label} :: ${JSON.stringify(detail)}`);
}

const INIT_CLS = () => {
  window.__cls = [];
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__cls.push(entry.value);
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {
    // Chromium always supports layout-shift; a missing observer reports 0.
  }
};

const INIT_LOCALE = (value) => {
  try {
    window.localStorage.setItem('ovitech-language', value);
  } catch {
    // the lang/dir assertion below catches a failed switch
  }
};

const INIT_CLOCK = (fixed) => {
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
};

async function newPage(browser, { locale, width, reduced }) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  await context.addInitScript(INIT_LOCALE, locale);
  await context.addInitScript(INIT_CLOCK, Date.UTC(2026, 10, 14, 9, 0, 0));
  await context.addInitScript(INIT_CLS);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 160)));
  return { context, page, errors };
}

async function settle(page, selector) {
  await page.waitForFunction((target) => document.querySelector(target) !== null, selector, {
    timeout: 30000,
  });
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

const clsTotal = (page) =>
  page.evaluate(() => (window.__cls ?? []).reduce((sum, value) => sum + value, 0));

/** Parks the entrance animation at a given time and reports the rendered state. */
async function readEntrance(page, atMs) {
  return page.evaluate((time) => {
    const root = document.querySelector('main .ov-page-enter');
    if (!root) return { error: 'no .ov-page-enter in main' };
    const animations = root.getAnimations();
    const animation = animations.find((entry) => entry.animationName === 'ov-page-in');
    if (!animation) {
      return {
        error: 'no ov-page-in animation',
        names: animations.map((entry) => entry.animationName),
        computed: getComputedStyle(root).animationName,
      };
    }
    if (time !== null) {
      animation.pause();
      animation.currentTime = time;
    }
    const style = getComputedStyle(root);
    const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
    return {
      animationName: animation.animationName,
      duration: animation.effect.getComputedTiming().duration,
      opacity: Number(style.opacity),
      translateX: matrix.m41,
      translateY: matrix.m42,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      // Layout values are unaffected by transforms: the entrance must not
      // change them.
      layout: {
        top: root.offsetTop,
        width: root.offsetWidth,
        height: root.offsetHeight,
      },
    };
  }, atMs);
}

async function finishEntrance(page) {
  return page.evaluate(() => {
    const root = document.querySelector('main .ov-page-enter');
    const animation = root?.getAnimations().find((entry) => entry.animationName === 'ov-page-in');
    animation?.finish();
    const style = getComputedStyle(root);
    const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
    return {
      opacity: Number(style.opacity),
      translateX: matrix.m41,
      translateY: matrix.m42,
      transform: style.transform,
      layout: {
        top: root.offsetTop,
        width: root.offsetWidth,
        height: root.offsetHeight,
      },
    };
  });
}

/** Client-side navigation: a real link when one exists, else router popstate. */
async function navigateClient(page, route) {
  const viaLink = await page.evaluate((href) => {
    const link =
      document.querySelector(`aside a[href="${href}"]`) ??
      document.querySelector(`a[href="${href}"]`);
    if (!link) return false;
    link.click();
    return true;
  }, route);
  if (!viaLink) {
    await page.evaluate((href) => {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, route);
  }
  await page.waitForURL(`**${route}`, { timeout: 15000 });
  await settle(page, 'main .ov-page-enter');
  return viaLink;
}

/** Every rendered transition must be on the shared scale and must not move layout. */
async function auditTransitions(page) {
  return page.evaluate(
    ({ allowed, layout }) => {
      const splitList = (value) => {
        const parts = [];
        let depth = 0;
        let current = '';
        for (const character of value) {
          if (character === '(') depth += 1;
          if (character === ')') depth -= 1;
          if (character === ',' && depth === 0) {
            parts.push(current.trim());
            current = '';
          } else {
            current += character;
          }
        }
        parts.push(current.trim());
        return parts.filter(Boolean);
      };

      const durations = new Map();
      const timings = new Map();
      const offenders = [];
      for (const element of document.querySelectorAll('*')) {
        const style = getComputedStyle(element);
        if (style.transitionDuration === '0s' || style.transitionProperty === 'none') continue;
        const properties = splitList(style.transitionProperty);
        const times = splitList(style.transitionDuration);
        const eases = splitList(style.transitionTimingFunction);
        for (const property of properties) {
          // `--tw-*` entries are Tailwind's colour helpers, not layout.
          if (property.startsWith('--tw-')) continue;
          if (!allowed.includes(property)) offenders.push(property);
          if (layout.some((prefix) => property.startsWith(prefix))) offenders.push(property);
        }
        for (const value of times) {
          durations.set(value, (durations.get(value) ?? 0) + 1);
          if (value !== '0.15s' && value !== '0.25s') offenders.push(`duration ${value}`);
        }
        for (const value of eases) {
          timings.set(value, (timings.get(value) ?? 0) + 1);
          if (value !== 'cubic-bezier(0, 0, 0.2, 1)') offenders.push(`easing ${value}`);
        }
      }
      return {
        durations: Object.fromEntries(durations),
        timings: Object.fromEntries(timings),
        offenders: [...new Set(offenders)],
        tokens: {
          quick: getComputedStyle(document.documentElement)
            .getPropertyValue('--duration-quick')
            .trim(),
          fast: getComputedStyle(document.documentElement)
            .getPropertyValue('--duration-fast')
            .trim(),
          ease: getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim(),
        },
        // The 250 ms transform case has no live consumer after the audit page,
        // so prove Tailwind compiled both arbitrary utilities.
        probes: [
          'transition-colors duration-[var(--duration-quick)] ease-out',
          'transition-transform duration-[var(--duration-fast)] ease-out',
        ].map((className) => {
          const element = document.createElement('div');
          element.className = className;
          document.body.append(element);
          const style = getComputedStyle(element);
          const value = {
            duration: style.transitionDuration,
            timing: style.transitionTimingFunction,
          };
          element.remove();
          return value;
        }),
      };
    },
    { allowed: ALLOWED_PROPERTIES, layout: LAYOUT_PROPERTIES },
  );
}

/** Same navigations with motion off: the control for the layout-shift check. */
async function measureControl(browser, args, locale, width) {
  const { context, page } = await newPage(browser, { locale, width, reduced: true });
  const load = {};
  const change = {};
  try {
    for (const [name, route] of Object.entries(ROUTES)) {
      await page.goto(args.base + route, { waitUntil: 'domcontentloaded' });
      await settle(page, 'main .ov-page-enter');
      await page.waitForTimeout(300);
      load[name] = await clsTotal(page);

      await page.goto(args.base + '/', { waitUntil: 'domcontentloaded' });
      await settle(page, 'h1');
      const before = await clsTotal(page);
      await navigateClient(page, route);
      await page.waitForTimeout(500);
      change[name] = (await clsTotal(page)) - before;
    }
  } finally {
    await context.close();
  }
  return { load, change };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.out) throw new Error('--out <dir> is required');
  fs.mkdirSync(args.out, { recursive: true });

  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch({ headless: true, executablePath: resolveExecutable() });
  const shots = [];
  const pageErrors = [];

  try {
    for (const locale of Object.keys(LOCALES)) {
      const expectedDir = LOCALES[locale];

      for (const width of [420, 1440]) {
        const control = await measureControl(browser, args, locale, width);
        const { context, page, errors } = await newPage(browser, {
          locale,
          width,
          reduced: false,
        });
        pageErrors.push(...errors);

        for (const [name, route] of Object.entries(ROUTES)) {
          await page.goto(args.base + route, { waitUntil: 'domcontentloaded' });
          await settle(page, 'main .ov-page-enter');

          const start = await readEntrance(page, 0);
          check(`${name}@${width} ${locale}: entrance exists`, !start.error, start);
          if (start.error) continue;
          check(
            `${name}@${width} ${locale}: lang/dir`,
            start.lang === locale && start.dir === expectedDir,
            { lang: start.lang, dir: start.dir },
          );
          check(
            `${name}@${width} ${locale}: 250 ms entrance`,
            Math.abs(start.duration - DURATION_MS) < 1,
            start.duration,
          );
          check(
            `${name}@${width} ${locale}: starts transparent`,
            start.opacity <= 0.05,
            start.opacity,
          );
          await page.screenshot({
            path: path.join(args.out, `${name}-${width}-${locale}-start.png`),
          });

          const mid = await readEntrance(page, MID_MS);
          check(
            `${name}@${width} ${locale}: mid-entrance is in flight`,
            mid.opacity > 0.05 && mid.opacity < 0.99,
            mid.opacity,
          );
          check(
            `${name}@${width} ${locale}: vertical travel only`,
            Math.abs(mid.translateX) < 0.01 &&
              mid.translateY > 0 &&
              mid.translateY <= OFFSET_PX + 0.01,
            { x: mid.translateX, y: mid.translateY },
          );
          await page.screenshot({
            path: path.join(args.out, `${name}-${width}-${locale}-mid.png`),
          });

          const end = await finishEntrance(page);
          check(
            `${name}@${width} ${locale}: settles opaque`,
            end.opacity === 1 && Math.abs(end.translateY) < 0.01,
            { opacity: end.opacity, y: end.translateY },
          );
          check(
            `${name}@${width} ${locale}: entrance moves no layout box`,
            end.layout.top === mid.layout.top &&
              end.layout.width === mid.layout.width &&
              end.layout.height === mid.layout.height,
            { start: start.layout, end: end.layout },
          );

          const settled = path.join(args.out, `${name}-${width}-${locale}-end.png`);
          await page.screenshot({ path: settled });
          shots.push({ page: name, width, locale, sha256: sha256(settled) });

          const loadCls = await clsTotal(page);
          check(
            `${name}@${width} ${locale}: load layout shift is negligible`,
            loadCls < CLS_LOAD_LIMIT,
            { motion: loadCls, control: control.load[name] },
          );
        }

        // Client-side route change, same proof.
        for (const [name, route] of Object.entries(ROUTES)) {
          await page.goto(args.base + '/', { waitUntil: 'domcontentloaded' });
          await settle(page, 'h1');
          const before = await clsTotal(page);
          const viaLink = await navigateClient(page, route);
          const routeStart = await readEntrance(page, 0);
          check(
            `${name}@${width} ${locale}: route change replays the entrance`,
            !routeStart.error && routeStart.opacity <= 0.05,
            routeStart,
          );
          const routeEnd = await finishEntrance(page);
          check(
            `${name}@${width} ${locale}: route change settles opaque`,
            routeEnd.opacity === 1,
            routeEnd.opacity,
          );
          check(
            `${name}@${width} ${locale}: route change moves no layout box`,
            routeEnd.layout.top === routeStart.layout.top &&
              routeEnd.layout.width === routeStart.layout.width &&
              routeEnd.layout.height === routeStart.layout.height,
            { start: routeStart.layout, end: routeEnd.layout },
          );
          await page.waitForTimeout(300);
          const after = await clsTotal(page);
          check(
            `${name}@${width} ${locale}: route shift is not worse than motion off`,
            after - before <= control.change[name] + CLS_ROUTE_MARGIN,
            { motion: after - before, control: control.change[name], viaLink },
          );
        }

        // Shared transition scale, measured on a page dense with hover chrome.
        await page.goto(args.base + '/journee', { waitUntil: 'domcontentloaded' });
        await settle(page, 'h1');
        const audit = await auditTransitions(page);
        check(
          `${locale}: every transition uses the shared durations`,
          Object.keys(audit.durations).every((value) => value === '0.15s' || value === '0.25s'),
          audit.durations,
        );
        check(
          `${locale}: every transition uses the shared easing`,
          Object.keys(audit.timings).every((value) => value === 'cubic-bezier(0, 0, 0.2, 1)'),
          audit.timings,
        );
        check(
          `${locale}: no transition animates layout or an unknown property`,
          audit.offenders.length === 0,
          audit.offenders,
        );
        check(
          `${locale}: the motion tokens hold their values`,
          audit.tokens.quick === '150ms' &&
            audit.tokens.fast === '250ms' &&
            audit.tokens.ease === 'cubic-bezier(0, 0, 0.2, 1)',
          audit.tokens,
        );
        check(
          `${locale}: both arbitrary duration utilities compile`,
          audit.probes[0].duration === '0.15s' &&
            audit.probes[1].duration === '0.25s' &&
            audit.probes.every((probe) => probe.timing === 'cubic-bezier(0, 0, 0.2, 1)'),
          audit.probes,
        );

        await context.close();
      }
    }

    // Reduced motion: no animation at all.
    for (const locale of Object.keys(LOCALES)) {
      const { context, page, errors } = await newPage(browser, {
        locale,
        width: 420,
        reduced: true,
      });
      pageErrors.push(...errors);
      for (const name of ['energie', 'ecosysteme', 'etat']) {
        await page.goto(args.base + ROUTES[name], { waitUntil: 'domcontentloaded' });
        await settle(page, 'main .ov-page-enter');
        const reduced = await page.evaluate(() => {
          const root = document.querySelector('main .ov-page-enter');
          const style = getComputedStyle(root);
          // Probe the two functional indicators directly: they may not be on
          // this route right now, but the reduced-motion rule must still hold.
          const probes = ['animate-pulse', 'animate-spin'].map((className) => {
            const probe = document.createElement('div');
            probe.className = className;
            document.body.append(probe);
            const name = getComputedStyle(probe).animationName;
            probe.remove();
            return name;
          });
          return {
            animationName: style.animationName,
            animations: root.getAnimations().length,
            documentAnimations: document.getAnimations().length,
            opacity: Number(style.opacity),
            transform: style.transform,
            probes,
          };
        });
        check(
          `${name} ${locale}: reduced motion has no entrance`,
          reduced.animationName === 'none' && reduced.animations === 0,
          { name: reduced.animationName, count: reduced.animations },
        );
        check(
          `${name} ${locale}: reduced motion paints the final state`,
          reduced.opacity === 1 && (reduced.transform === 'none' || reduced.transform === ''),
          { opacity: reduced.opacity, transform: reduced.transform },
        );
        check(
          `${name} ${locale}: reduced motion stops pulse and spin`,
          reduced.probes.every((value) => value === 'none'),
          reduced.probes,
        );
        check(
          `${name} ${locale}: reduced motion leaves nothing animating`,
          reduced.documentAnimations === 0,
          reduced.documentAnimations,
        );
        await page.screenshot({
          path: path.join(args.out, `${name}-420-${locale}-reduced.png`),
        });
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  // ar and fr must not be the same pixels.
  const byKey = new Map();
  for (const shot of shots) {
    const key = `${shot.page}@${shot.width}`;
    if (!byKey.has(key)) byKey.set(key, new Map());
    byKey.get(key).set(shot.locale, shot.sha256);
  }
  for (const [key, locales] of byKey) {
    check(`${key}: ar and fr differ`, new Set(locales.values()).size === locales.size, [
      ...locales.keys(),
    ]);
  }

  check('no uncaught page error', pageErrors.length === 0, pageErrors);

  fs.writeFileSync(
    path.join(args.out, 'manifest.json'),
    JSON.stringify({ base: args.base, firedAt: new Date().toISOString(), shots, checks }, null, 2),
  );

  const passed = checks.filter((entry) => entry.ok).length;
  console.log(`[motion] ${passed}/${checks.length} checks passed`);
  for (const entry of checks.filter((item) => !item.ok)) {
    console.error(`[motion] FAIL ${entry.label} :: ${JSON.stringify(entry.detail)}`);
  }
  if (failures.length) {
    console.error(`[motion] ${failures.length} failure(s)`);
    process.exitCode = 1;
  } else {
    console.log('[motion] ok - entrance, RTL travel, CLS, reduced motion and shared transitions');
  }
}

await main();
