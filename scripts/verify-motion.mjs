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

async function newPage(browser, { locale, width, reduced, clock = true }) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  await context.addInitScript(INIT_LOCALE, locale);
  // GSAP times its tweens from Date.now, so the frozen clock that the CSS checks
  // need would park every GSAP tween at frame zero. Batch 4 runs with the real clock.
  if (clock) await context.addInitScript(INIT_CLOCK, Date.UTC(2026, 10, 14, 9, 0, 0));
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

/**
 * Batch 4 watches: every text frame a count-up paints, the chart's dash state and
 * the reveal state of the long-page targets. Kept as page functions so the same
 * code stringifies into `page.evaluate`.
 */
const INIT_COUNT_WATCH = () => {
  window.__counts = [];
  const start = () => {
    new MutationObserver((records) => {
      for (const record of records) {
        const host = record.target.nodeType === 3 ? record.target.parentElement : record.target;
        const counter = host && host.closest ? host.closest('[data-count-up]') : null;
        if (!counter) continue;
        const copy = counter.querySelector('[aria-hidden="true"].absolute');
        if (!copy) continue;
        const text = copy.textContent ?? '';
        const last = window.__counts[window.__counts.length - 1];
        if (last && last.text === text) continue;
        window.__counts.push({ t: performance.now(), text });
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
};

const READ_COUNTERS = () =>
  Array.from(document.querySelectorAll('[data-count-up]')).map((node) => ({
    sr: node.querySelector('.sr-only')?.textContent ?? '',
    sizer: node.querySelector('[aria-hidden="true"].invisible')?.textContent ?? '',
    copy: node.querySelector('[aria-hidden="true"].absolute')?.textContent ?? '',
    hiddenCopies: node.querySelectorAll('[aria-hidden="true"]').length,
    live: Boolean(node.closest('[aria-live]')),
  }));

const READ_CHART = () => {
  const line = document.querySelector('[data-chart-line]');
  const area = document.querySelector('[data-chart-area]');
  if (!line) return { error: 'no [data-chart-line]' };
  const style = getComputedStyle(line);
  const box = line.getBoundingClientRect();
  return {
    dash: style.strokeDasharray,
    offset: style.strokeDashoffset,
    opacity: Number(style.opacity),
    areaOpacity: area ? Number(getComputedStyle(area).opacity) : null,
    length: typeof line.getTotalLength === 'function' ? line.getTotalLength() : null,
    box: { top: Math.round(box.top), width: Math.round(box.width), height: Math.round(box.height) },
  };
};

const READ_REVEAL = () => {
  const nodes = Array.from(document.querySelectorAll('main [data-reveal], main table tbody tr'));
  return {
    total: nodes.length,
    hidden: nodes.filter((node) => Number(getComputedStyle(node).opacity) < 1).length,
    transformed: nodes.filter((node) => {
      const transform = getComputedStyle(node).transform;
      return transform !== 'none' && transform !== '';
    }).length,
  };
};

const BATCH4_ROUTES = {
  home: '/',
  troupeau: '/troupeau',
  sante: '/sante',
  nutrition: '/nutrition',
  fourrage: '/fourrage',
  indicateurs: '/indicateurs',
};

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
    // ---- Batch 4: count-ups, chart entry and the scroll-linked reveal ----
    for (const locale of Object.keys(LOCALES)) {
      const { context, page, errors } = await newPage(browser, {
        locale,
        width: 1440,
        reduced: false,
        clock: false,
      });
      pageErrors.push(...errors);
      await page.addInitScript(INIT_COUNT_WATCH);

      // Count-ups: the accessibility tree keeps one settled number while an
      // aria-hidden copy counts for less than 600 ms.
      await page.goto(args.base + '/', { waitUntil: 'domcontentloaded' });
      await settle(page, '[data-count-up]');
      const countersStart = await page.evaluate(READ_COUNTERS);
      await page.waitForTimeout(900);
      const countersEnd = await page.evaluate(READ_COUNTERS);
      const sampled = await page.evaluate(() => window.__counts ?? []);
      // Measure from the first frame whose text actually changes: the "0" the
      // component paints before the GSAP chunk resolves is not counting time.
      const countingFrom = sampled.findIndex((frame) => frame.text !== sampled[0]?.text);
      const span =
        countingFrom === -1 ? 0 : sampled[sampled.length - 1].t - sampled[countingFrom].t;

      check(`${locale}: count-ups exist on home`, countersStart.length >= 4, countersStart.length);
      check(
        `${locale}: no counter sits in a live region`,
        countersStart.every((counter) => !counter.live),
        countersStart.filter((counter) => counter.live).length,
      );
      check(
        `${locale}: both visual copies of a counter are aria-hidden`,
        countersStart.every((counter) => counter.hiddenCopies === 2),
        countersStart.map((counter) => counter.hiddenCopies),
      );
      check(
        `${locale}: the announced value never changes during the count`,
        countersStart.length === countersEnd.length &&
          countersStart.every((counter, index) => counter.sr === countersEnd[index].sr),
        countersStart.map((counter, index) => [counter.sr, countersEnd[index]?.sr]),
      );
      check(
        `${locale}: the announced value is the settled value`,
        countersEnd.every((counter) => counter.sr === counter.copy && counter.sr === counter.sizer),
        countersEnd,
      );
      check(
        `${locale}: the count actually ran`,
        sampled.length > 1 && sampled.some((frame) => frame.text !== countersEnd[0]?.copy),
        {
          frames: sampled.length,
          first: sampled[0]?.text,
          last: sampled[sampled.length - 1]?.text,
        },
      );
      check(`${locale}: the count finishes inside 600 ms`, span <= 600, span);

      // Chart entry: the line is drawn along its own length.
      await page.goto(args.base + '/indicateurs', { waitUntil: 'domcontentloaded' });
      const drewAway = await page
        .waitForFunction(
          () => {
            const line = document.querySelector('[data-chart-line]');
            if (!line) return false;
            return Number.parseFloat(getComputedStyle(line).strokeDasharray) > 0;
          },
          null,
          { timeout: 15000 },
        )
        .then(() => true)
        .catch(() => false);
      const chartMid = await page.evaluate(READ_CHART);
      await page.waitForTimeout(1400);
      const chartDone = await page.evaluate(READ_CHART);
      check(`${locale}: the KPI chart draws itself`, drewAway && !chartMid.error, chartMid);
      if (!chartMid.error && !chartDone.error) {
        check(
          `${locale}: the draw works through a dash offset`,
          Number.parseFloat(chartMid.dash) > 0 &&
            Number.parseFloat(chartMid.offset) >= 0 &&
            Number.parseFloat(chartMid.offset) <= Number.parseFloat(chartMid.dash) + 1,
          { dash: chartMid.dash, offset: chartMid.offset },
        );
        check(
          `${locale}: the drawn line settles complete`,
          chartDone.opacity === 1 &&
            (chartDone.offset === '0px' || chartDone.offset === '0' || chartDone.offset === ''),
          { opacity: chartDone.opacity, offset: chartDone.offset },
        );
        check(
          `${locale}: the area lands on the opacity its class declares`,
          chartDone.areaOpacity !== null &&
            chartDone.areaOpacity > 0.1 &&
            chartDone.areaOpacity <= 0.2,
          chartDone.areaOpacity,
        );
        check(
          `${locale}: the chart draw moves no box`,
          chartMid.box.width === chartDone.box.width &&
            chartMid.box.height === chartDone.box.height,
          { mid: chartMid.box, done: chartDone.box },
        );
      }

      // Scroll-linked reveal: below-the-fold targets wait, then arrive once.
      // A shorter viewport keeps real page content below the fold on both routes.
      await page.setViewportSize({ width: 1440, height: 520 });
      for (const [name, route] of Object.entries({ home: '/', fourrage: '/fourrage' })) {
        await page.goto(args.base + route, { waitUntil: 'domcontentloaded' });
        await settle(page, 'main h1');
        await page.waitForTimeout(400);
        const revealBefore = await page.evaluate(READ_REVEAL);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1100);
        const revealAfter = await page.evaluate(READ_REVEAL);
        check(
          `${name}@1440x520 ${locale}: below-the-fold targets start hidden`,
          revealBefore.total > 0 && revealBefore.hidden > 0,
          revealBefore,
        );
        check(
          `${name}@1440x520 ${locale}: scrolling reveals every target once`,
          revealAfter.hidden === 0 && revealAfter.transformed === 0,
          revealAfter,
        );
      }

      await context.close();
    }

    // Reduced motion: every Batch 4 effect is off and the settled state is drawn.
    for (const locale of Object.keys(LOCALES)) {
      const { context, page, errors } = await newPage(browser, {
        locale,
        width: 1440,
        reduced: true,
        clock: false,
      });
      pageErrors.push(...errors);
      await page.addInitScript(INIT_COUNT_WATCH);
      for (const [name, route] of Object.entries(BATCH4_ROUTES)) {
        await page.goto(args.base + route, { waitUntil: 'domcontentloaded' });
        await settle(page, 'main h1');
        await page.waitForTimeout(300);
        const state = await page.evaluate(() => {
          const chart = document.querySelector('[data-chart-line]');
          const counters = Array.from(document.querySelectorAll('[data-count-up]'));
          const settled = counters.map((node) => node.querySelector('.sr-only')?.textContent ?? '');
          const sampleTexts = (window.__counts ?? []).map((frame) => frame.text);
          const targets = Array.from(
            document.querySelectorAll('main [data-reveal], main table tbody tr'),
          );
          return {
            samples: sampleTexts.length,
            sampleTexts: sampleTexts.slice(0, 6),
            settled: settled.slice(0, 6),
            // With reduced motion the component may repaint the settled value
            // (React remounts it), but it must never paint an intermediate one.
            intermediate: sampleTexts.filter((text) => !settled.includes(text)).slice(0, 6),
            countersSettled: counters.every(
              (node) =>
                (node.querySelector('.sr-only')?.textContent ?? '') ===
                (node.querySelector('[aria-hidden="true"].absolute')?.textContent ?? ''),
            ),
            chart: chart
              ? {
                  dash: getComputedStyle(chart).strokeDasharray,
                  opacity: Number(getComputedStyle(chart).opacity),
                }
              : null,
            hiddenTargets: targets.filter((node) => Number(getComputedStyle(node).opacity) < 1)
              .length,
            animations: document.getAnimations().length,
          };
        });
        check(
          `${name} ${locale}: reduced motion paints no intermediate number`,
          state.intermediate.length === 0,
          { samples: state.samples, intermediate: state.intermediate, settled: state.settled },
        );
        check(
          `${name} ${locale}: reduced motion shows the settled number`,
          state.countersSettled,
          state.countersSettled,
        );
        if (state.chart) {
          check(
            `${name} ${locale}: reduced motion draws no chart`,
            state.chart.opacity === 1 && (state.chart.dash === 'none' || state.chart.dash === ''),
            state.chart,
          );
        }
        check(
          `${name} ${locale}: reduced motion hides no content`,
          state.hiddenTargets === 0,
          state.hiddenTargets,
        );
        check(
          `${name} ${locale}: reduced motion leaves nothing animating`,
          state.animations === 0,
          state.animations,
        );
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
