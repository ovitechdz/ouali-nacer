#!/usr/bin/env node
/**
 * Verification script - effective rendered text size (P2-1 group E).
 *
 * Not wired into `npm run ci` because CI has no browser. Run it against the
 * local preview while the tree is under review:
 *
 *   npm run build && npm run preview        # terminal 1, port 4173
 *   node scripts/audit-text-effective-size.mjs
 *   node scripts/audit-text-effective-size.mjs --shots=after
 *
 * The static gate (`check:text-size`) reads declarations; this script reads
 * what the browser actually paints. For every element that directly owns text
 * it computes:
 *
 * - HTML: `getComputedStyle().fontSize` multiplied by the cumulative scale of
 *   every CSS `transform` on the ancestor chain;
 * - SVG text: `getComputedStyle().fontSize` multiplied by
 *   `getScreenCTM().a`, which is what the viewBox scaling does to the glyphs.
 *
 * Every effective size below 12 px is reported with route, locale, width,
 * selector and snippet. Elements inside `aria-hidden` are skipped and listed
 * with their text, so a skip can never hide information silently. The script
 * also asserts `lang` and `dir` on every render, so an Arabic capture can never
 * silently be a French one.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const FLOOR_PX = 12;
const WIDTHS = [360, 420, 768, 1440];
const LOCALES = {
  ar: { expectedLang: 'ar', expectedDir: 'rtl', tag: 'ar-DZ' },
  fr: { expectedLang: 'fr', expectedDir: 'ltr', tag: 'fr-FR' },
};
const ROUTES = [
  '/',
  '/journee',
  '/scan',
  '/troupeau',
  '/sante',
  '/nutrition',
  '/ration',
  '/fourrage',
  '/energie',
  '/indicateurs',
  '/journal',
  '/sync',
  '/donnees',
  '/preuve',
  '/verification',
  '/ecosysteme',
  '/ecosysteme/cameras',
  '/ecosysteme/portails',
  '/ecosysteme/balance',
  '/ecosysteme/iot',
  '/vision',
  '/investisseurs',
  '/label',
  '/equipe',
  '/team',
  '/etat',
  '/offline',
];

const args = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, value = ''] = argument.replace(/^--/, '').split('=');
    return [key, value];
  }),
);
const BASE_URL = process.env.AUDIT_BASE_URL ?? args.get('base') ?? 'http://127.0.0.1:4173';
const LABEL = args.get('label') ?? 'effective';
const SHOTS = args.get('shots');
const OUT_DIR =
  args.get('out') ??
  process.env.TEXT_AUDIT_OUT ??
  path.join(os.homedir(), 'ovitech-audit', 'docs', 'rebuild', 'phase-p2-1-text');

async function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_MODULE, 'playwright', 'playwright-core'].filter(
    Boolean,
  );
  for (const candidate of candidates) {
    try {
      return await import(candidate);
    } catch {
      // try the next candidate
    }
  }
  throw new Error(
    'playwright is not resolvable. Install it outside the project or set PLAYWRIGHT_MODULE to its path.',
  );
}

/**
 * The npx cache may ship a Playwright whose pinned Chromium build is not the
 * one installed on this machine, so resolve the newest installed build instead
 * of downloading a browser.
 */
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const roots = [
    path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright'),
    path.join(os.homedir(), '.cache', 'ms-playwright'),
    path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'),
  ];
  const builds = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      if (!name.startsWith('chromium-')) continue;
      for (const candidate of [
        path.join(root, name, 'chrome-win64', 'chrome.exe'),
        path.join(root, name, 'chrome-linux', 'chrome'),
        path.join(root, name, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      ]) {
        if (fs.existsSync(candidate)) builds.push({ name, candidate });
      }
    }
  }
  builds.sort((a, b) => a.name.localeCompare(b.name));
  return builds.at(-1)?.candidate;
}

/** Runs in the page. Keep it self-contained: no closures over node values. */
function measurePage(floor) {
  const SVG_TEXT = new Set(['text', 'tspan', 'textpath']);
  const selectorOf = (element) => {
    const parts = [];
    let node = element;
    let depth = 0;
    while (node && node.nodeType === 1 && depth < 4) {
      const tag = node.tagName.toLowerCase();
      const classes = (node.getAttribute('class') ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .join('.');
      const index = node.parentElement
        ? Array.prototype.indexOf.call(node.parentElement.children, node) + 1
        : 1;
      parts.unshift(`${tag}${classes ? `.${classes}` : ''}:nth-child(${index})`);
      node = node.parentElement;
      depth += 1;
    }
    return parts.join(' > ');
  };
  const scaleOf = (element) => {
    let scale = 1;
    let node = element;
    while (node && node.nodeType === 1) {
      const transform = window.getComputedStyle(node).transform;
      if (transform && transform !== 'none') {
        try {
          const matrix = new DOMMatrixReadOnly(transform);
          const area = Math.abs(matrix.a * matrix.d - matrix.b * matrix.c);
          if (area > 0) scale *= Math.sqrt(area);
        } catch {
          // an unparsable transform cannot scale text
        }
      }
      node = node.parentElement;
    }
    return scale;
  };

  const under = [];
  const skips = [];
  const histogram = {};
  let total = 0;
  for (const element of document.querySelectorAll('body *')) {
    const tag = element.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'noscript') continue;
    const own = Array.from(element.childNodes)
      .filter((node) => node.nodeType === 3 && node.textContent.trim())
      .map((node) => node.textContent.trim())
      .join(' ')
      .trim();
    if (!own) continue;
    total += 1;

    const hidden = element.closest('[aria-hidden="true"]');
    if (hidden) {
      skips.push({
        text: own.slice(0, 40),
        selector: selectorOf(element),
        reason: 'aria-hidden',
      });
      continue;
    }

    const computed = Number.parseFloat(window.getComputedStyle(element).fontSize) || 0;
    const isSvgText = element.namespaceURI === 'http://www.w3.org/2000/svg' && SVG_TEXT.has(tag);
    const ctm = isSvgText ? element.getScreenCTM() : null;
    const scale = isSvgText ? Math.abs(ctm?.a ?? 1) : scaleOf(element);
    const effective = Math.round(computed * scale * 100) / 100;
    const bucket = String(Math.round(effective * 10) / 10);
    histogram[bucket] = (histogram[bucket] ?? 0) + 1;

    if (effective < floor - 0.005) {
      under.push({
        text: own.slice(0, 40),
        selector: selectorOf(element),
        computed,
        scale: Math.round(scale * 1000) / 1000,
        effective,
        svg: isSvgText,
      });
    }
  }
  return {
    under,
    skips,
    total,
    histogram,
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
  };
}

async function resolveAnimalRoute(page) {
  await page.goto(`${BASE_URL}/troupeau`, { waitUntil: 'networkidle' });
  const href = await page.evaluate(() => {
    const link = document.querySelector('a[href*="/troupeau/"]');
    return link ? link.getAttribute('href') : null;
  });
  if (!href) throw new Error('no animal link found on /troupeau');
  return href;
}

const { chromium } = await loadPlaywright();
const executablePath = findChromium();
const browser = await chromium.launch(executablePath ? { executablePath } : {});

fs.mkdirSync(OUT_DIR, { recursive: true });
const shotDir = SHOTS ? path.join(OUT_DIR, 'shots', SHOTS) : null;
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

const rows = [];
const langFailures = [];
const thinRenders = [];
let routeList = [];

for (const [locale, config] of Object.entries(LOCALES)) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
      locale: config.tag,
    });
    await context.addInitScript((value) => {
      window.localStorage.setItem('ovitech-language', value);
    }, locale);
    const page = await context.newPage();
    if (routeList.length === 0) {
      const resolved = [...ROUTES.slice(0, 4), await resolveAnimalRoute(page), ...ROUTES.slice(4)];
      const only = (args.get('routes') ?? '').split(',').filter(Boolean);
      routeList = only.length
        ? resolved.filter((route) => only.some((wanted) => route.startsWith(wanted)))
        : resolved;
    }
    for (const route of routeList) {
      await page.goto(BASE_URL + route, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      let result = await page.evaluate(measurePage, FLOOR_PX);
      // A lazy route can briefly show its skeleton while the dev server
      // recompiles. Retry a census that would silently skip most of the page.
      for (let attempt = 0; attempt < 3 && result.total < 10; attempt += 1) {
        await page.waitForTimeout(500);
        result = await page.evaluate(measurePage, FLOOR_PX);
      }
      if (result.total < 10) {
        thinRenders.push({ route, locale, width, total: result.total });
      }
      const langOk = result.lang === config.expectedLang;
      const dirOk = result.dir === config.expectedDir;
      if (!langOk || !dirOk) {
        langFailures.push({
          route,
          locale,
          width,
          lang: result.lang,
          dir: result.dir,
        });
      }
      rows.push({ route, locale, width, ...result });
      if (shotDir) {
        const name = `w${width}-${locale}${route.replace(/\//g, '-') || '-home'}.png`;
        await page.screenshot({
          path: path.join(shotDir, name),
          fullPage: true,
        });
      }
      const flag = result.under.length ? `  ${result.under.length} under ${FLOOR_PX}px` : '';
      console.log(
        `${locale} w${width} ${route}: ${result.total} text owners, lang=${result.lang}, dir=${result.dir}${flag}`,
      );
    }
    await context.close();
  }
}
await browser.close();

const findings = rows.flatMap((row) =>
  row.under.map((entry) => ({
    route: row.route,
    locale: row.locale,
    width: row.width,
    ...entry,
  })),
);
const skips = rows.flatMap((row) =>
  row.skips.map((entry) => ({
    route: row.route,
    locale: row.locale,
    width: row.width,
    ...entry,
  })),
);
const svgFindings = findings.filter((entry) => entry.svg);

const jsonFile = path.join(OUT_DIR, `effective-size-${LABEL}.json`);
fs.writeFileSync(
  jsonFile,
  `${JSON.stringify({ label: LABEL, baseUrl: BASE_URL, floor: FLOOR_PX, widths: WIDTHS, rows, findings, skips, langFailures, thinRenders }, null, 2)}\n`,
);

const smallest = rows
  .flatMap((row) =>
    Object.entries(row.histogram).map(([size, count]) => ({
      size: Number(size),
      count,
    })),
  )
  .reduce((map, entry) => {
    map.set(entry.size, (map.get(entry.size) ?? 0) + entry.count);
    return map;
  }, new Map());
const sizes = [...smallest.keys()].sort((a, b) => a - b);
const mdFile = path.join(OUT_DIR, `effective-size-${LABEL}.md`);
const lines = [
  `# Effective text size audit - ${LABEL}`,
  '',
  `- base URL: ${BASE_URL}`,
  `- routes: ${routeList.length}, widths: ${WIDTHS.join(', ')}, locales: ar, fr`,
  `- renders: ${rows.length}, text owners measured: ${rows.reduce((sum, row) => sum + row.total, 0)}`,
  `- effective size below ${FLOOR_PX}px: ${findings.length} (of which SVG text: ${svgFindings.length})`,
  `- aria-hidden skips listed: ${skips.length}`,
  `- lang/dir assertion failures: ${langFailures.length}`,
  `- thin renders after retries: ${thinRenders.length}`,
  '',
  '## Effective size census',
  '',
  '| effective px | elements |',
  '| --- | --- |',
  ...sizes.map((size) => `| ${size} | ${smallest.get(size)} |`),
  '',
  '## Findings',
  '',
];
if (findings.length === 0) {
  lines.push('None: every text owner renders at or above the floor.');
} else {
  for (const entry of findings) {
    lines.push(
      `- ${entry.route} ${entry.locale} w${entry.width}: ${entry.effective}px = ${entry.computed}px x ${entry.scale} (${entry.svg ? 'svg' : 'html'}) \`${entry.selector}\` - "${entry.text}"`,
    );
  }
}
lines.push('', '## aria-hidden skips', '');
if (skips.length === 0) lines.push('None.');
else {
  for (const entry of skips.slice(0, 40)) {
    lines.push(
      `- ${entry.route} ${entry.locale} w${entry.width}: "${entry.text}" \`${entry.selector}\``,
    );
  }
  if (skips.length > 40) lines.push(`- ... ${skips.length - 40} more in the JSON`);
}
if (langFailures.length) {
  lines.push('', '## lang/dir failures', '');
  for (const entry of langFailures) {
    lines.push(
      `- ${entry.route} ${entry.locale} w${entry.width}: lang=${entry.lang} dir=${entry.dir}`,
    );
  }
}
if (thinRenders.length) {
  lines.push('', '## thin renders after retries', '');
  for (const entry of thinRenders) {
    lines.push(`- ${entry.route} ${entry.locale} w${entry.width}: ${entry.total} text owners`);
  }
}
fs.writeFileSync(mdFile, `${lines.join('\n')}\n`);

console.log('');
console.log(`renders: ${rows.length}`);
console.log(`text owners: ${rows.reduce((sum, row) => sum + row.total, 0)}`);
console.log(`effective < ${FLOOR_PX}px: ${findings.length} (svg ${svgFindings.length})`);
console.log(`aria-hidden skips: ${skips.length}`);
console.log(`lang/dir failures: ${langFailures.length}`);
console.log(`thin renders after retries: ${thinRenders.length}`);
console.log(`json: ${jsonFile}`);
console.log(`md:   ${mdFile}`);
process.exitCode = findings.length || langFailures.length ? 1 : 0;
