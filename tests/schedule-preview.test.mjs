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

function sameJson(a, b) {
  const keys = (obj) => Object.keys(obj).sort();
  return JSON.stringify(a, keys(a)) === JSON.stringify(b, keys(b));
}

async function main() {
  const aborted = [];
  const continued = [];
  const server = await serve(root);
  const { port } = server.address();
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=390,844']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    let host = '';
    try { host = new URL(url).hostname; } catch (e) {}
    const local = host === '127.0.0.1' || host === 'localhost' || url.startsWith('data:') || url.startsWith('blob:');
    if (local) {
      continued.push(url);
      req.continue().catch(() => {});
    } else {
      aborted.push(url + ' ' + req.method());
      req.abort('blockedbyclient').catch(() => {});
    }
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('PAGE', msg.text());
  });
  const origin = `http://127.0.0.1:${port}`;
  await page.goto(origin + '/manifest.webmanifest', { waitUntil: 'domcontentloaded', timeout: 15000 });
  const seeded = await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('gt_v2', '{"__sentinel":"progress-KEEP"}');
    localStorage.setItem('iue_cloud_client_id', 'sentinel-device');
    localStorage.setItem('iue_cloud_sync_url_v2', 'sentinel-sync-id');
    localStorage.setItem('iue.comp1511.weekChecks.v1', '{"__sentinel":true}');
    localStorage.setItem('memo_7u', 'sentinel-memo');
    sessionStorage.setItem('iue_sentinel_session', 'session-KEEP');
    function dump(store) {
      const out = {};
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        out[k] = store.getItem(k);
      }
      return out;
    }
    return { local: dump(localStorage), session: dump(sessionStorage), cookie: document.cookie };
  });
  const url = origin + '/index.html?iueFixture=schedule-preview';
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
  const hostGate = await page.evaluate(() => ({
    isolated: window.IUE_STORAGE_ISOLATED === true,
    okLocal: window.iueFixtureHostOk('127.0.0.1') && window.iueFixtureHostOk('localhost') && window.iueFixtureHostOk('::1'),
    blockedHost: !window.iueFixtureHostOk('7u717.github.io') && !window.iueFixtureHostOk('example.com') && !window.iueFixtureHostOk('')
  }));
  assert(hostGate.isolated && hostGate.okLocal && hostGate.blockedHost, 'fixture host gate failed ' + JSON.stringify(hostGate));
  const memGt = await page.evaluate(() => localStorage.getItem('gt_v2'));
  assert(memGt && memGt.includes('p1160_q5') && !memGt.includes('progress-KEEP'), 'fixture did not keep baked progress in memory only');
  const booted = await page.evaluate(() => window.__iueRealStorageSnapshot());
  assert(sameJson(seeded.local, booted.local), 'real localStorage changed during fixture boot ' + JSON.stringify(booted.local));
  assert(sameJson(seeded.session, booted.session), 'real sessionStorage changed during fixture boot ' + JSON.stringify(booted.session));
  assert(booted.cookie === seeded.cookie, 'cookie changed during fixture boot');

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

  box = await center(page, rowSel, 0);
  const tapBeforeEscape = await page.$eval(rowSel, (el) => el.getAttribute('data-tap'));
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await waitPreview(page, 'pointer');
  await page.keyboard.press('Escape');
  await sleep(40);
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'Escape did not dismiss the hold preview');
  await page.mouse.up();
  await sleep(200);
  assert(await page.$eval(rowSel, (el) => el.getAttribute('data-tap')) === tapBeforeEscape, 'Escape then release navigated');
  await page.mouse.click(box.x, box.y);
  await sleep(200);
  assert(await page.$eval(rowSel, (el) => el.getAttribute('data-tap')) === String(+tapBeforeEscape + 1), 'normal tap after Escape hold did not run');

  async function bareDown(pid) {
    await page.evaluate((sel, id) => {
      const row = document.querySelector(sel);
      const r = row.getBoundingClientRect();
      row.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: id, pointerType: 'mouse', button: 0, isPrimary: true, clientX: r.left + 12, clientY: r.top + 10 }));
    }, rowSel, pid);
  }
  async function bareReleaseClick(pid) {
    return page.evaluate((sel, id) => {
      const row = document.querySelector(sel);
      const r = row.getBoundingClientRect();
      const x = r.left + 12, y = r.top + 10;
      row.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: id, pointerType: 'mouse', button: 0, isPrimary: true, clientX: x, clientY: y }));
      const click = new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y });
      row.dispatchEvent(click);
      return { missing: click.pointerId == null, tap: row.getAttribute('data-tap') };
    }, rowSel, pid);
  }
  const tapBeforeBare = await page.$eval(rowSel, (el) => el.getAttribute('data-tap'));
  await bareDown(41);
  await waitPreview(page, 'pointer');
  const bare = await bareReleaseClick(41);
  assert(bare.missing, 'synthetic click unexpectedly had pointerId');
  await sleep(30);
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'bare release left the preview open');
  assert(await page.$eval(rowSel, (el) => el.getAttribute('data-tap')) === tapBeforeBare, 'MouseEvent without pointerId navigated after hold');
  box = await center(page, rowSel, 0);
  await page.mouse.click(box.x, box.y);
  await sleep(200);
  assert(await page.$eval(rowSel, (el) => el.getAttribute('data-tap')) === String(+tapBeforeBare + 1), 'tap after bare release was swallowed');

  const tapBeforeBareEsc = await page.$eval(rowSel, (el) => el.getAttribute('data-tap'));
  await bareDown(42);
  await waitPreview(page, 'pointer');
  await page.keyboard.press('Escape');
  await sleep(40);
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'Escape did not dismiss before bare release');
  const bareEsc = await bareReleaseClick(42);
  assert(bareEsc.missing, 'escape release click had pointerId');
  await sleep(30);
  assert(await page.$eval(rowSel, (el) => el.getAttribute('data-tap')) === tapBeforeBareEsc, 'MouseEvent without pointerId navigated after Escape');
  box = await center(page, rowSel, 0);
  await page.mouse.click(box.x, box.y);
  await sleep(200);
  assert(await page.$eval(rowSel, (el) => el.getAttribute('data-tap')) === String(+tapBeforeBareEsc + 1), 'tap after bare Escape release was swallowed');

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

  box = await center(page, rowSel, 0);
  const scrollBefore = await page.$eval('#sec-timetable', (el) => ({ top: el.scrollTop, room: el.scrollHeight - el.clientHeight }));
  assert(scrollBefore.room > 40, 'timetable cannot scroll ' + JSON.stringify(scrollBefore));
  const touch = await page.createCDPSession();
  const point = (x, y, id) => ({ x, y, id, radiusX: 1, radiusY: 1, force: 1, rotationAngle: 0 });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(box.x, box.y, 0)] });
  for (let i = 1; i <= 8; i++) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(box.x, box.y - i * 28, 0)] });
    await sleep(16);
  }
  await sleep(520);
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'touch scroll opened the preview');
  const scrollAfter = await page.$eval('#sec-timetable', (el) => el.scrollTop);
  assert(scrollAfter > scrollBefore.top + 20, 'touch move did not scroll, before ' + scrollBefore.top + ' after ' + scrollAfter);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(150);

  box = await center(page, rowSel, 1);
  const tapBeforeCancel = await page.evaluate((sel) => document.querySelectorAll(sel)[1].getAttribute('data-tap'), rowSel);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(box.x, box.y, 0)] });
  await waitPreview(page, 'pointer');
  await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await sleep(200);
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'touchcancel left the preview open');
  assert(await page.evaluate((sel) => document.querySelectorAll(sel)[1].getAttribute('data-tap'), rowSel) === tapBeforeCancel, 'touchcancel navigated');
  await page.mouse.click(box.x, box.y);
  await sleep(200);
  assert(await page.evaluate((sel) => document.querySelectorAll(sel)[1].getAttribute('data-tap'), rowSel) === String(+tapBeforeCancel + 1), 'tap after touchcancel did not run');

  box = await center(page, rowSel, 0);
  const tapBeforeMulti = await page.$eval(rowSel, (el) => el.getAttribute('data-tap'));
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(box.x, box.y, 0)] });
  await sleep(180);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(box.x, box.y, 0), point(box.x + 36, box.y + 24, 1)] });
  await sleep(560);
  assert(await page.$eval('body', (el) => el.getAttribute('data-sq-open')) == null, 'second finger still opened the preview');
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(200);
  assert(await page.$eval(rowSel, (el) => el.getAttribute('data-tap')) === tapBeforeMulti, 'multitouch navigated');
  await page.mouse.click(box.x, box.y);
  await sleep(200);
  assert(await page.$eval(rowSel, (el) => el.getAttribute('data-tap')) === String(+tapBeforeMulti + 1), 'tap after multitouch did not run');

  await page.evaluate(() => {
    const img = document.createElement('img');
    img.src = 'https://example.com/iue-nonlocal-probe.png';
    document.body.appendChild(img);
  });
  await sleep(300);
  assert(aborted.some((entry) => entry.includes('example.com')), 'interception did not abort a nonlocal resource: ' + aborted.join('\n'));

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

  const finished = await page.evaluate(() => window.__iueRealStorageSnapshot());
  assert(sameJson(seeded.local, finished.local), 'real localStorage changed after interactions ' + JSON.stringify(finished.local));
  assert(sameJson(seeded.session, finished.session), 'real sessionStorage changed after interactions ' + JSON.stringify(finished.session));
  assert(finished.cookie === seeded.cookie, 'cookie changed after interactions');
  const pageBlocked = await page.evaluate(() => window.IUE_BLOCKED_URLS || []);
  assert(pageBlocked.length === 0, 'page issued a remote fetch: ' + pageBlocked.join('\n'));
  assert(continued.every((u) => u.startsWith('http://127.0.0.1:' + port) || u.startsWith('http://localhost:' + port) || u.startsWith('data:') || u.startsWith('blob:')), 'continued a nonlocal request');
  assert(!continued.some((u) => forbidden.test(u)), 'continued a forbidden host');
  assert(!aborted.some((u) => u.startsWith('http://127.0.0.1:' + port)), 'aborted a local resource');
  await writeFile(path.join(artifactDir, 'schedule_preview_test_summary.json'), JSON.stringify({ ok: true, self, continued: continued.length, aborted: aborted.length, viewport: '390x844', storage: 'unchanged' }, null, 2));
  const failPage = await browser.newPage();
  await failPage.setRequestInterception(true);
  failPage.on('request', (req) => {
    const url = req.url();
    let host = '';
    try { host = new URL(url).hostname; } catch (e) {}
    const local = host === '127.0.0.1' || host === 'localhost' || url.startsWith('data:') || url.startsWith('blob:');
    if (local) req.continue().catch(() => {});
    else req.abort('blockedbyclient').catch(() => {});
  });
  await failPage.goto(origin + '/manifest.webmanifest', { waitUntil: 'domcontentloaded', timeout: 15000 });
  const failSeed = await failPage.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('gt_v2', '{"__sentinel":"progress-KEEP"}');
    localStorage.setItem('iue_cloud_client_id', 'sentinel-device');
    localStorage.setItem('iue_cloud_sync_url_v2', 'sentinel-sync-id');
    function dump(store) {
      const out = {};
      for (let i = 0; i < store.length; i++) out[store.key(i)] = store.getItem(store.key(i));
      return out;
    }
    return { local: dump(localStorage), session: dump(sessionStorage) };
  });
  try {
    await failPage.goto(origin + '/index.html?iueFixture=schedule-preview&iueFixtureShadow=fail', { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch (e) {}
  await failPage.waitForFunction(() => window.IUE_FIXTURE_ABORT === 'storage-shadow', { timeout: 5000 });
  const failed = await failPage.evaluate(() => ({
    abort: window.IUE_FIXTURE_ABORT,
    fixture: window.IUE_ISOLATED_FIXTURE,
    isolated: window.IUE_STORAGE_ISOLATED,
    banner: !!document.querySelector('.sq-fixture-banner'),
    real: window.__iueRealStorageSnapshot ? window.__iueRealStorageSnapshot() : null,
    seen: localStorage.getItem('gt_v2')
  }));
  assert(failed.abort === 'storage-shadow', 'shadow failure did not abort ' + JSON.stringify(failed));
  assert(!failed.fixture, 'aborted fixture still marked active');
  assert(failed.isolated === false, 'aborted fixture reported storage isolated');
  assert(!failed.banner, 'aborted fixture continued into the schedule UI');
  assert(failed.seen === '{"__sentinel":"progress-KEEP"}', 'shadow failure wrote over real progress: ' + failed.seen);
  const failNow = await failPage.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) out[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
    return out;
  });
  assert(sameJson(failSeed.local, failNow), 'real localStorage changed after shadow failure ' + JSON.stringify(failNow));
  await failPage.close();

  console.log('schedule preview tests passed');
  console.log('self-check cases', self.cases.length);
  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
