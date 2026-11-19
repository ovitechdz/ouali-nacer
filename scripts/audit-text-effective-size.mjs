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
 * Floor by locale: French 12 px, Arabic 13 px (approved D-0056). Every size
 * below the locale floor is reported with route, locale, width, selector and
 * snippet. The invisible count-up sizer is skipped and listed; the visible
 * aria-hidden animated copy is measured, because a sighted reader sees it.
 * Each render also checks horizontal overflow, clipped text, overlapping text
 * and broken tables, and asserts `lang` and `dir` so an Arabic capture can
 * never silently be a French one.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** D-0056: Arabic informational text has a 13 px minimum; French keeps 12 px. */
const FLOOR_BY_LOCALE = { ar: 13, fr: 12 };
const floorFor = (locale) => FLOOR_BY_LOCALE[locale] ?? 12;
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
function measurePage({ floor }) {
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
  const layout = { overflow: [], clipped: [], overlaps: [], tables: [], intentional: [] };
  const owners = [];
  const viewport = window.innerWidth;
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

    const style = window.getComputedStyle(element);
    // The invisible span only reserves the final width; its twin at
    // `absolute inset-0` is the copy a sighted reader actually sees, so that
    // one is measured below instead of being skipped with it.
    const hidden = element.closest('[aria-hidden="true"]');
    const sizer = hidden && element.classList.contains('invisible');
    if (hidden && sizer) {
      skips.push({
        text: own.slice(0, 40),
        selector: selectorOf(element),
        reason: 'aria-hidden invisible sizer (no visible information)',
      });
      continue;
    }

    // ---- layout census ----
    const rect = element.getBoundingClientRect();
    // Screen-reader-only copy, decorative motion and hidden layers are not
    // painted for a sighted reader, so their geometry is not a layout finding.
    const decorative =
      hidden ||
      element.closest('.sr-only') ||
      style.position === 'fixed' ||
      style.visibility === 'hidden' ||
      Number(style.opacity) === 0;
    // A wide table inside `overflow-x: auto` is intentionally scrollable: its
    // cells legitimately sit outside the fold. Only unscrollable bleed counts.
    let inScroller = false;
    for (let node = element.parentElement; node; node = node.parentElement) {
      const overflowX = getComputedStyle(node).overflowX;
      if (overflowX === 'auto' || overflowX === 'scroll') {
        inScroller = true;
        break;
      }
    }
    if (rect.width && rect.height && !decorative) {
      owners.push({ element, rect, own });
      if (!inScroller && (rect.right > viewport + 1 || rect.left < -1)) {
        layout.overflow.push({
          selector: selectorOf(element),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          viewport,
          text: own.slice(0, 30),
        });
      }
    }
    if (rect.width && rect.height && !decorative) {
      const deltaW = element.scrollWidth - element.clientWidth;
      const deltaH = element.scrollHeight - element.clientHeight;
      const hardClip =
        ['hidden', 'clip'].includes(style.overflowX) ||
        ['hidden', 'clip'].includes(style.overflowY);
      const intentional =
        element.classList.contains('truncate') ||
        style.textOverflow === 'ellipsis' ||
        (style.webkitLineClamp && style.webkitLineClamp !== 'none');
      if (intentional) {
        // Truncation is recorded, never failed: a text-size fix must not ADD
        // truncation, but the product already truncates some strings by design.
        layout.intentional.push({
          selector: selectorOf(element),
          text: own.slice(0, 30),
          deltaW,
          deltaH,
        });
      } else if (hardClip && (deltaW > 1 || deltaH > 3)) {
        // <=3 px of vertical overflow is line-height rounding, not clipped text.
        layout.clipped.push({
          selector: selectorOf(element),
          text: own.slice(0, 30),
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
        });
      }
    }

    const computed = Number.parseFloat(style.fontSize) || 0;
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
  const documentWidth = document.documentElement.scrollWidth;
  if (documentWidth > viewport + 1) {
    layout.overflow.unshift({
      kind: 'document',
      scrollWidth: documentWidth,
      viewport,
    });
  }

  for (const table of document.querySelectorAll('table')) {
    const parent = table.parentElement;
    const wrapped = parent && ['auto', 'scroll'].includes(getComputedStyle(parent).overflowX);
    if (table.scrollWidth > table.clientWidth + 1 && !wrapped) {
      layout.tables.push({
        selector: selectorOf(table),
        issue: 'horizontal scroll without an overflow-x wrapper',
        scrollWidth: table.scrollWidth,
        clientWidth: table.clientWidth,
      });
    }
    const heads = table.querySelectorAll('thead th').length;
    const cells = table.querySelector('tbody tr')?.querySelectorAll('td, th').length ?? 0;
    if (heads && cells && heads !== cells) {
      layout.tables.push({
        selector: selectorOf(table),
        issue: 'header/body column mismatch',
        heads,
        cells,
      });
    }
  }

  for (let i = 0; i < owners.length; i += 1) {
    for (let j = i + 1; j < owners.length; j += 1) {
      const a = owners[i];
      const b = owners[j];
      if (a.element.parentElement !== b.element.parentElement) continue;
      if (a.element.contains(b.element) || b.element.contains(a.element)) continue;
      if (getComputedStyle(a.element).position !== 'static') continue;
      if (getComputedStyle(b.element).position !== 'static') continue;
      const width = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const height = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (width > 2 && height > 2) {
        layout.overlaps.push({
          a: selectorOf(a.element),
          b: selectorOf(b.element),
          textA: a.own.slice(0, 20),
          textB: b.own.slice(0, 20),
          width: Math.round(width),
          height: Math.round(height),
        });
      }
    }
  }

  return {
    under,
    skips,
    total,
    histogram,
    layout,
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
      let result = await page.evaluate(measurePage, {
        floor: floorFor(locale),
      });
      // A lazy route can briefly show its skeleton while the dev server
      // recompiles. Retry a census that would silently skip most of the page.
      for (let attempt = 0; attempt < 3 && result.total < 10; attempt += 1) {
        await page.waitForTimeout(500);
        result = await page.evaluate(measurePage, { floor: floorFor(locale) });
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
      if (shotDir && width <= 420) {
        const name = `w${width}-${locale}${route.replace(/\//g, '-') || '-home'}.png`;
        await page.screenshot({
          path: path.join(shotDir, name),
          fullPage: true,
        });
      }
      const layoutIssues = ['overflow', 'clipped', 'overlaps', 'tables'].reduce(
        (sum, key) => sum + result.layout[key].length,
        0,
      );
      const flag = result.under.length
        ? `  ${result.under.length} under ${floorFor(locale)}px`
        : '';
      const layoutFlag = layoutIssues ? `  ${layoutIssues} layout` : '';
      console.log(
        `${locale} w${width} ${route}: ${result.total} text owners, lang=${result.lang}, dir=${result.dir}${flag}${layoutFlag}`,
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
const layoutIssues = Object.fromEntries(
  ['overflow', 'clipped', 'overlaps', 'tables', 'intentional'].map((key) => [
    key,
    rows.flatMap((row) =>
      row.layout[key].map((entry) => ({
        route: row.route,
        locale: row.locale,
        width: row.width,
        ...entry,
      })),
    ),
  ]),
);

const jsonFile = path.join(OUT_DIR, `effective-size-${LABEL}.json`);
fs.writeFileSync(
  jsonFile,
  `${JSON.stringify({ label: LABEL, baseUrl: BASE_URL, floors: FLOOR_BY_LOCALE, widths: WIDTHS, rows, findings, skips, layoutIssues, langFailures, thinRenders }, null, 2)}\n`,
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
  `- floor by locale: ar ${FLOOR_BY_LOCALE.ar}px, fr ${FLOOR_BY_LOCALE.fr}px`,
  `- effective size below the locale floor: ${findings.length} (of which SVG text: ${svgFindings.length})`,
  `- aria-hidden skips listed: ${skips.length}`,
  `- layout defects: overflow ${layoutIssues.overflow.length}, clipped ${layoutIssues.clipped.length}, overlaps ${layoutIssues.overlaps.length}, tables ${layoutIssues.tables.length}`,
  `- intentional truncation (recorded, not a defect): ${layoutIssues.intentional.length}`,
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
for (const [key, entries] of Object.entries(layoutIssues)) {
  if (!entries.length) continue;
  lines.push('', `## ${key}`, '');
  for (const entry of entries.slice(0, 40)) {
    lines.push(
      `- ${entry.route} ${entry.locale} w${entry.width}: ${entry.issue ?? ''} ${entry.selector ?? entry.kind ?? ''} ${JSON.stringify(entry).slice(0, 220)}`,
    );
  }
  if (entries.length > 40) lines.push(`- ... ${entries.length - 40} more in the JSON`);
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
console.log(`effective below locale floor: ${findings.length} (svg ${svgFindings.length})`);
console.log(`aria-hidden skips: ${skips.length}`);
console.log(
  `layout defects: overflow ${layoutIssues.overflow.length}, clipped ${layoutIssues.clipped.length}, overlaps ${layoutIssues.overlaps.length}, tables ${layoutIssues.tables.length}; intentional truncation ${layoutIssues.intentional.length}`,
);
console.log(`lang/dir failures: ${langFailures.length}`);
console.log(`thin renders after retries: ${thinRenders.length}`);
console.log(`json: ${jsonFile}`);
console.log(`md:   ${mdFile}`);
process.exitCode =
  findings.length ||
  langFailures.length ||
  layoutIssues.overflow.length ||
  layoutIssues.clipped.length ||
  layoutIssues.overlaps.length ||
  layoutIssues.tables.length
    ? 1
    : 0;
