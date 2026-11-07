/**
 * Isolated 390px check for the 最近日程 hold preview.
 * Opens only the local fixture (?iueFixture=schedule-preview). Never calls sync APIs.
 *
 *   node tests/schedule-preview.test.mjs
 * Requires puppeteer-core resolvable from /tmp/sqtest and system Chrome.
 */
import { createRequire } from 'module';
import { mkdir, writeFile } from 'fs/promises';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire('/tmp/sqtest/package.json');
const puppeteer = require('puppeteer-core');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = process.env.SQ_ARTIFACT_DIR || '/opt/cursor/artifacts';
const forbidden = /restful-api\.dev|jsonblob\.com|iue-cloud-state\.json|dictionaryapi\.dev|mymemory\.translated\.net|github\.io|7u717/i;

function serve(dir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      const rel = decodeURIComponent(url.pathname);
      const file = path.normalize(path.join(dir, rel === '/' ? '/index.html' : rel));
      if (!file.startsWith(dir)) { res.writeHead(403); res.end('no'); return; }
      import('fs').then((fs) => {
        fs.readFile(file, (err, buf) => {
          if (err) { res.writeHead(404); res.end('missing'); return; }
          const ext = path.extname(file);
          const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
          res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
          res.end(buf);
        });
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitPreview(page, mode) {
  await page.waitForFunction((expected) => {
    if (document.body.getAttribute('data-sq-open') !== expected) return false;
    const el = document.getElementById('sq-preview');
    if (!el || el.hidden) return false;
    return parseFloat(getComputedStyle(el).opacity) > 0.95;
  }, { timeout: 2000 }, mode);
}

async function center(page, selector, index) {
  return page.evaluate((sel, i) => {
    const node = document.querySelectorAll(sel)[i];
    node.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 24) };
  }, selector, index);
}

async function main() {
  const blocked = [];
  const requests = [];
  const server = await serve(root);
  const { port } = server.address();
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=390,844']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on('request', (req) => {
    const url = req.url();
    requests.push(url);
    if (forbidden.test(url)) blocked.push(url + ' ' + req.method());
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('PAGE', msg.text());
  });
  const url = `http://127.0.0.1:${port}/index.html?iueFixture=schedule-preview`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.sq-fixture-banner', { timeout: 10000 });
  await page.waitForFunction(() => {
    const splash = document.querySelector('.iue-splash');
    if (!splash) return true;
    const cs = getComputedStyle(splash);
    return cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0;
  }, { timeout: 5000 });
  await sleep(200);
  const self = JSON.parse(await page.$eval('#sq-selfcheck', (el) => el.textContent || '{}'));
  if (!self.ok) {
    console.log(JSON.stringify(self, null, 2));
    throw new Error('self-check failed');
  }
  const banner = await page.$eval('.sq-fixture-banner', (el) => el.textContent);
  assert(banner.includes('测试数据') && banner.includes('未连接同步'), 'banner missing test label');
  const titles = await page.$$eval('.v2-tt-queue .dash-queue-title', (nodes) => nodes.map((n) => n.textContent));
  assert(titles.length === 3 && titles.every((t) => t.includes('【测试】')), 'fixture rows not labeled: ' + titles.join('|'));
  assert(await page.$eval('#header-title', (el) => el.textContent) === '课表', 'fixture did not stay on timetable');

  const rowSel = '.v2-tt-queue .dash-queue-row';
  let box = await center(page, rowSel, 0);
  await page.mouse.click(box.x, box.y);
  await sleep(200);
  let tap = await page.$eval(rowSel, (el) => el.getAttribute('data-tap'));
  assert(tap === '1', 'short tap should keep the original action, tap=' + tap);
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'short tap opened preview');
  assert(await page.$eval('#sq-preview', (el) => el.hidden), 'preview visible after tap');

  box = await center(page, rowSel, 0);
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await waitPreview(page, 'pointer');
  const previewText = await page.$eval('#sq-preview', (el) => el.innerText);
  assert(previewText.includes('【测试】已发布作业'), 'preview missing title');
  assert(previewText.includes('测试用任务说明，不是真实作业'), 'preview missing real fixture note');
  assert(previewText.includes('10%'), 'preview missing published weight');
  assert(previewText.includes('暂无详情'), 'missing location should be 暂无详情');
  assert(previewText.includes('未发布'), 'missing grade should be 未发布');
  assert(previewText.includes('松手收起预览'), 'missing release hint');
  assert(!previewText.includes('示例') && !previewText.includes('示意'), 'sample copy leaked into preview');
  assert(!/\d+\s*\/\s*\d+/.test(previewText), 'fabricated grade in preview: ' + previewText);
  const menuOpen = await page.$eval('#vq-menu', (el) => !el.hidden && el.classList.contains('open'));
  const oldPv = await page.$eval('#fx4-pv', (el) => !el.hidden);
  const backdrop = await page.$eval('#vq-backdrop', (el) => !el.hidden && el.classList.contains('open'));
  assert(!menuOpen && !oldPv && !backdrop, 'old sticky menu or full-screen blur opened');
  const filter = await page.$eval('#sq-preview', (el) => getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter || '');
  assert(/blur\(/.test(filter), 'preview blur missing: ' + filter);
  const fullBlur = await page.$$eval('body *', (nodes) => nodes.filter((n) => {
    if (n.id === 'sq-preview') return false;
    const s = getComputedStyle(n);
    const b = s.backdropFilter || s.webkitBackdropFilter || '';
    if (!/blur\(/.test(b) || s.display === 'none' || s.visibility === 'hidden' || n.hidden) return false;
    const r = n.getBoundingClientRect();
    return r.width > 360 && r.height > 700;
  }).map((n) => n.className + ':' + (getComputedStyle(n).backdropFilter || '')));
  assert(fullBlur.length === 0, 'full-screen blur present: ' + fullBlur.join(','));
  const geom = await page.$eval('#sq-preview', (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: innerWidth, h: innerHeight, radius: getComputedStyle(el).borderRadius, opacity: getComputedStyle(el).opacity };
  });
  assert(geom.left >= 8 && geom.right <= geom.w - 8, 'horizontal margin ' + JSON.stringify(geom));
  assert(geom.top >= 8 && geom.bottom <= geom.h - 8, 'vertical margin ' + JSON.stringify(geom));
  assert(parseFloat(geom.opacity) > 0.9, 'preview opacity ' + geom.opacity);
  assert(parseFloat(geom.radius) >= 16, 'radius ' + geom.radius);
  await mkdir(artifactDir, { recursive: true });
  await page.screenshot({ path: path.join(artifactDir, 'schedule_preview_hold_390.png') });
  const duringTap = await page.$eval(rowSel, (el) => el.getAttribute('data-tap'));
  assert(duringTap === '1', 'hold navigated or retapped');
  await page.mouse.up();
  await sleep(350);
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'release did not dismiss');
  assert(await page.$eval(rowSel, (el) => el.getAttribute('data-tap')) === '1', 'release triggered the row action');

  box = await center(page, rowSel, 1);
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await page.mouse.move(box.x, box.y + 48, { steps: 6 });
  await sleep(600);
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'scroll intent still opened preview');
  await page.mouse.up();
  await sleep(150);

  box = await center(page, rowSel, 1);
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await waitPreview(page, 'pointer');
  const unpublished = await page.$eval('#sq-preview', (el) => el.innerText);
  assert(unpublished.includes('【测试】未发布项'), unpublished);
  assert(unpublished.includes('截止时间未发布'), 'missing deadline not marked 未发布');
  assert(unpublished.includes('未发布'), unpublished);
  assert(unpublished.includes('暂无详情'), unpublished);
  assert(!unpublished.includes('10%'), 'unpublished row showed a weight');
  assert(!/\d+\s*\/\s*\d+/.test(unpublished), 'unpublished row showed a grade');
  await page.screenshot({ path: path.join(artifactDir, 'schedule_preview_unpublished_390.png') });
  await page.evaluate(() => {
    const pid = 1;
    document.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, cancelable: true, pointerId: pid, pointerType: 'mouse' }));
    document.dispatchEvent(new Event('touchcancel', { bubbles: true }));
  });
  await page.mouse.up().catch(() => {});
  await sleep(200);
  const still = await page.$eval('body', (el) => el.getAttribute('data-sq-open'));
  if (still) {
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1, pointerType: 'touch' })));
    await sleep(100);
  }
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'pointercancel did not dismiss, state=' + still);

  await page.focus(rowSel + ':nth-child(3)');
  await page.keyboard.down('Alt');
  await page.keyboard.press('Enter');
  await page.keyboard.up('Alt');
  await waitPreview(page, 'keyboard');
  const kb = await page.$eval('#sq-preview', (el) => el.innerText);
  assert(kb.includes('【测试】暂无详情项'), kb);
  assert(kb.includes('暂无详情'), kb);
  assert(kb.includes('Esc 关闭'), kb);
  assert(kb.includes('Lab'), kb);
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.className);
  assert(/sq-go|sq-close/.test(focused), 'keyboard preview did not move focus: ' + focused);
  await page.screenshot({ path: path.join(artifactDir, 'schedule_preview_keyboard_390.png') });
  await page.keyboard.press('Escape');
  await sleep(200);
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'escape did not close');

  const before = await page.$eval(rowSel + ':nth-child(3)', (el) => el.getAttribute('data-tap'));
  await page.focus(rowSel + ':nth-child(3)');
  await page.keyboard.down('Enter');
  await waitPreview(page, 'keyhold');
  await page.keyboard.up('Enter');
  await sleep(200);
  const afterHold = await page.$eval(rowSel + ':nth-child(3)', (el) => el.getAttribute('data-tap'));
  assert(before === afterHold, 'keyboard hold activated the row');
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'key release did not dismiss');
  await page.focus(rowSel + ':nth-child(3)');
  await page.keyboard.press('Enter');
  await sleep(150);
  const afterTap = await page.$eval(rowSel + ':nth-child(3)', (el) => el.getAttribute('data-tap'));
  assert(String(+before + 1) === afterTap, 'keyboard short Enter did not run the original action ' + before + ' -> ' + afterTap);

  await page.evaluate(() => {
    document.querySelectorAll('.iue-toast').forEach((el) => el.remove());
    showCourse('dashboard');
  });
  await sleep(400);
  await page.evaluate(() => document.querySelectorAll('.iue-toast').forEach((el) => el.remove()));
  const dash = await page.evaluate(() => ({
    title: document.getElementById('header-title').textContent,
    ring: !!document.querySelector('.dl1, .v2-hero'),
    preview: document.body.getAttribute('data-sq-open'),
    fixtureOnDash: !!document.querySelector('#sec-dashboard .sq-fixture-banner')
  }));
  assert(dash.title === '总览', 'dashboard title changed');
  assert(dash.ring, 'deadline ring missing');
  assert(!dash.preview, 'preview stuck on dashboard');
  assert(!dash.fixtureOnDash, 'fixture banner leaked onto dashboard');
  await page.screenshot({ path: path.join(artifactDir, 'schedule_preview_dashboard_unchanged_390.png') });

  const pageBlocked = await page.evaluate(() => window.IUE_BLOCKED_URLS || []);
  assert(blocked.length === 0, 'forbidden request: ' + blocked.join('\n'));
  assert(pageBlocked.length === 0, 'page blocked a sync attempt: ' + pageBlocked.join('\n'));
  assert(requests.every((u) => u.startsWith('http://127.0.0.1:' + port) || u.startsWith('data:')), 'non-local request ' + requests.filter((u) => !u.startsWith('http://127.0.0.1')).join('\n'));
  await writeFile(path.join(artifactDir, 'schedule_preview_test_summary.json'), JSON.stringify({ ok: true, self, requests: requests.length, viewport: '390x844' }, null, 2));
  console.log('schedule preview tests passed');
  console.log('self-check cases', self.cases.length);
  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
