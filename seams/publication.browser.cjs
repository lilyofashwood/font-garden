/* Independent browser contract for the planted seams across the public garden. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const garden = path.resolve(__dirname, '..');
const repos = path.resolve(garden, '..');
const trail = JSON.parse(fs.readFileSync(path.join(__dirname, 'trail.json'), 'utf8'));
const packets = new Map(trail.map(packet => [packet.id, packet]));
// Existing Ghost Hex lettering predates these seams; no new dependency is permitted.
const ghostLegacyFont = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap';
const surfaces = [
  ['steg-web', '/'],
  ['chatlog-printer', '/apps/chatlog-printer/'],
  ['diacritic-bloom', '/apps/diacritic-bloom/'],
  ['font-garden', '/apps/font-garden/'],
  ['ghost-hex', '/apps/ghost-hex/'],
  ['hexmoji', '/apps/hexmoji/'],
  ['kagami-no-migaka', '/apps/kagami-no-migaka/'],
  ['melody-cipher', '/apps/melody-cipher/'],
  ['messageloggerfix', '/apps/messageloggerfix/'],
  ['moon-tears', '/apps/moon-tears/'],
  ['ouroboros-cipher', '/apps/ouroboros-cipher/'],
  ['uniception', '/apps/uniception/'],
  ['twitterpainted', '/apps/twitterpainted/'],
  ['zalgo-cipher', '/apps/zalgo-cipher/'],
];

async function preview() {
  const argument = process.argv.indexOf('--base-url');
  if (argument !== -1) {
    const supplied = process.argv[argument + 1];
    if (!supplied) throw new Error('--base-url needs an existing local preview URL.');
    return { origin: new URL(supplied).origin, stop: async () => {} };
  }
  const script = [
    'import importlib.util',
    'from http.server import ThreadingHTTPServer',
    'spec=importlib.util.spec_from_file_location("garden_preview", "preview.py")',
    'module=importlib.util.module_from_spec(spec)',
    'spec.loader.exec_module(module)',
    'server=ThreadingHTTPServer(("127.0.0.1", 0), module.ReviewHandler)',
    'print("http://127.0.0.1:"+str(server.server_port), flush=True)',
    'server.serve_forever()',
  ].join('\n');
  const child = spawn(process.env.PYTHON || 'python3', ['-u', '-c', script], { cwd: path.join(repos, 'workspace-context'), stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', data => { stderr += String(data); });
  const origin = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Local preview start timed out. ' + stderr)); }, 10000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('exit', code => { clearTimeout(timer); reject(new Error('Preview exited ' + code + ': ' + stderr)); });
    child.stdout.on('data', data => {
      output += String(data);
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
  });
  return { origin, stop: async () => { if (child.exitCode === null) { child.kill(); await once(child, 'exit'); } } };
}

(async () => {
  assert.equal(packets.size, 14, 'one unique packet per public repository');
  const local = await preview();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.GARDEN_CHROMIUM ? { executablePath: process.env.GARDEN_CHROMIUM } : {}) });
    const failures = [];
    for (const [id, route] of surfaces) {
      const page = await browser.newPage({ viewport: { width: 1365, height: 1000 } });
      const errors = [], external = [], failedResources = [], existingFonts = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('request', request => {
        if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== local.origin) {
          if (id === 'ghost-hex' && request.url() === ghostLegacyFont) existingFonts.push(request.url());
          else external.push(request.url());
        }
      });
      page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) failedResources.push([response.status(), response.url()]); });
      try {
        const response = await page.goto(local.origin + route, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, id + ' front door');
        const packet = packets.get(id);
        const wire = page.locator('.garden-seam-wire');
        assert.equal(await wire.count(), 1, id + ' has one deliberately framed seam');
        assert(await wire.isVisible(), id + ' seam is visible on screen');
        assert.equal(await wire.textContent(), packet.verse, id + ' survives page typography byte-for-byte');
        const jewel = page.locator('.garden-seam-jewel');
        if (packet.jewel) assert.equal(await jewel.textContent(), packet.jewel, id + ' jewel stays exact');
        else if (await jewel.count()) assert.equal(await jewel.textContent(), '', id + ' empty jewel');
        assert.equal(await page.locator('a[href$="/font-garden/seams/#' + id + '"]').count(), 1, id + ' points to its named reader');
        await page.setViewportSize({ width: 390, height: 844 });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), id + ' mobile overflow');
        assert.equal(await wire.textContent(), packet.verse, id + ' remains exact after reflow');
        if (id === 'chatlog-printer') {
          await page.emulateMedia({ media: 'print' });
          assert.equal(await wire.isVisible(), false, 'authored Chatlog decoration never enters a printed transcript');
          await page.emulateMedia({ media: 'screen' });
        }
        assert.deepEqual(errors, [], id + ' script errors');
        assert.deepEqual(external, [], id + ' off-origin requests');
        assert.deepEqual(failedResources, [], id + ' missing local assets');
        if (existingFonts.length) console.log('EXISTING DEPENDENCY: ghost-hex Google Fonts stylesheet retained; seam adds no requests (' + ghostLegacyFont + ')');
        console.log('PASS planted seam: ' + id);
      } catch (error) {
        failures.push(id + ': ' + error.message);
      } finally { await page.close(); }
    }

    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.goto(local.origin + '/apps/font-garden/seams/index.html#steg-web', { waitUntil: 'networkidle' });
      await page.waitForSelector('body[data-seam-ready="true"]');
      assert.equal(await page.isVisible('#recovered'), false, 'trail opens without spoiling the readings');
      assert.equal(await page.textContent('#verse'), packets.get('steg-web').verse, 'preview serves the exact authored launcher poem');
      await page.click('#unfold');
      assert.equal(await page.isVisible('#recovered'), true, 'explicit unfold reveals the readings');
      const expected = await import('./codec.mjs').then(codec => codec.decodeSeam(packets.get('steg-web')));
      for (const field of ['carrier', 'selected', 'ghost', 'hex', 'a', 'b']) {
        assert.equal(await page.textContent('#out-' + field), expected[field] || '∅', 'reader restores ' + field);
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'loom mobile overflow');
      console.log('PASS preview seam loom: exact trail, explicit reveal and six recovered fields');
    } catch (error) { failures.push('seam loom: ' + error.message); }
    finally { await page.close(); }
    assert.deepEqual(failures, [], 'published seam integration');
    console.log('PASS 14 planted public surfaces and offline loom under the exact-allowlist preview');
  } finally {
    if (browser) await browser.close();
    await local.stop();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
