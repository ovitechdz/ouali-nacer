/**
 * Verification of the deferred services chunk failure mode (Phase 5b Batch 2b, step 3).
 *
 * Runs against the built `dist` served by `vite preview` (the chunk only exists there).
 * Scenario A: cold load with the chunk request aborted.
 * Scenario B: warm load, then a reload with the browser cache cleared and the chunk aborted.
 *
 * Requirement: FarmGate must render a recoverable error state (never a blank screen).
 * A failed dynamic import is cached for the document, so "recoverable" means the gate
 * offers a page reload - which is what the fix in farm-gate.tsx does.
 *
 * Exits 1 when a scenario fails, so it can be re-run as evidence.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const {
  chromium,
} = require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/2c10347c988d3245/node_modules/playwright');
const exe = path.join(
  process.env.LOCALAPPDATA,
  'ms-playwright',
  'chromium-1234',
  'chrome-win64',
  'chrome.exe',
);

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const OUT = process.env.OUT ?? path.join(process.env.TEMP, 'opencode', 'chunk-abort');
fs.mkdirSync(OUT, { recursive: true });

const serviceChunk = fs
  .readdirSync(path.resolve('dist/assets'))
  .find((name) => /^services-.*\.js$/.test(name));
if (!serviceChunk) throw new Error('no services-*.js in dist/assets');
console.log('[abort] services chunk =', serviceChunk);

const browser = await chromium.launch({ headless: true, executablePath: exe });
const failures = [];

async function snapshot(page, settle = 1500) {
  await page.waitForTimeout(settle);
  return page.evaluate(() => ({
    text: (document.body.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 140),
    buttons: [...document.querySelectorAll('button')].map((b) => b.textContent?.trim() ?? ''),
    onboarding: document.querySelector('#onboarding-farm') !== null,
    rootChildren: document.querySelector('#root')?.children.length ?? -1,
  }));
}

function check(label, condition, detail) {
  if (condition) {
    console.log(`[abort] PASS ${label}`);
  } else {
    failures.push(label);
    console.log(`[abort] FAIL ${label} :: ${JSON.stringify(detail)}`);
  }
}

async function recover(page, label) {
  const action = page.getByRole('button', { name: /reload|recharger|تحميل/i });
  const count = await action.count();
  check(`${label}: reload action offered`, count > 0, await snapshot(page, 0));
  if (count === 0) return;
  await Promise.all([
    page.waitForLoadState('domcontentloaded').catch(() => undefined),
    action.first().click(),
  ]);
  const after = await snapshot(page, 2500);
  check(`${label}: reload recovers to onboarding`, after.onboarding, after);
  await page.screenshot({ path: path.join(OUT, `${label}-recovered.png`) });
}

// --- Scenario A: cold load, chunk aborted -----------------------------------
{
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();
  const blocked = [];
  await page.route(`**/${serviceChunk}`, (route) => {
    blocked.push(route.request().url());
    return route.abort('failed');
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 160)));
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const state = await snapshot(page);
  await page.screenshot({ path: path.join(OUT, 'first-load-blocked.png') });
  console.log('[abort] A cold load blocked=', blocked.length, JSON.stringify(state));
  check('A: chunk request was blocked', blocked.length > 0, blocked);
  check('A: not a blank screen', state.text.length > 20 && state.rootChildren > 0, state);
  check('A: error state shown', /خطأ|erreur|error/i.test(state.text), state);
  check('A: no uncaught page error', errors.length === 0, errors);
  await page.unroute(`**/${serviceChunk}`);
  await recover(page, 'first-load');
  await context.close();
}

// --- Scenario B: warm load, then blocked reload ------------------------------
{
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 160)));
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const warm = await snapshot(page);
  check('B: warm load reaches onboarding', warm.onboarding, warm);

  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.clearBrowserCache');
  const blocked = [];
  await page.route(`**/${serviceChunk}`, (route) => {
    blocked.push(route.request().url());
    return route.abort('failed');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const state = await snapshot(page);
  await page.screenshot({ path: path.join(OUT, 'later-load-blocked.png') });
  console.log('[abort] B later load blocked=', blocked.length, JSON.stringify(state));
  check('B: later chunk request was blocked', blocked.length > 0, blocked);
  check('B: not a blank screen', state.text.length > 20 && state.rootChildren > 0, state);
  check('B: error state shown', /خطأ|erreur|error/i.test(state.text), state);
  check('B: no uncaught page error', errors.length === 0, errors);
  await page.unroute(`**/${serviceChunk}`);
  await recover(page, 'later-load');
  await context.close();
}

await browser.close();
if (failures.length) {
  console.error(`[abort] ${failures.length} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('[abort] ok - recoverable error state on first and later load');
}
