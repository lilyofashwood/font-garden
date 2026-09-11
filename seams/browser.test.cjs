const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const route = decodeURIComponent(url.pathname);
  const filename = path.resolve(root, '.' + (route.endsWith('/') ? route + 'index.html' : route));
  if (!filename.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(filename, (error, data) => {
    if (error) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', mime[path.extname(filename)] || 'text/plain');
    response.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true, ...(process.env.GARDEN_CHROMIUM ? { executablePath: process.env.GARDEN_CHROMIUM } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const errors = [], external = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => { if (!request.url().startsWith(origin + '/')) external.push(request.url()); });
    await page.goto(origin + '/seams/');
    await page.waitForSelector('body[data-seam-ready="true"]');
    assert.equal(await page.locator('#register option').count(), 78);
    assert.equal(await page.locator('#mode option').count(), 6);
    assert(!/[A-Za-z]/.test(await page.title()));
    assert.equal(await page.inputValue('#selected'), 'home');
    assert.equal(await page.isDisabled('#register'), true);
    assert.equal(await page.isVisible('#recovered'), false);
    assert.equal((await page.inputValue('#packet')).includes('Another verse is welcome.'), false);
    await page.click('#unfold');
    assert.equal(await page.textContent('#out-selected'), 'home');
    assert.equal(await page.textContent('#out-ghost'), 'Another verse is welcome.');
    assert.equal(await page.textContent('#out-hex'), 'MEOW');

    await page.fill('#lane-a', '雨');
    await page.fill('#lane-b', '🌒 moon');
    await page.click('#weave');
    assert.equal(await page.isVisible('#recovered'), false);
    await page.click('#unfold');
    assert.equal(await page.textContent('#out-a'), '雨');
    assert.equal(await page.textContent('#out-b'), '🌒 moon');
    assert.equal(await page.textContent('#out-carrier'), await page.inputValue('#carrier'));
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__copied = value; } } }));
    await page.click('#copy-verse');
    assert.equal(await page.evaluate(() => window.__copied), await page.textContent('#verse'));
    await page.click('#copy-packet');
    assert.equal(await page.evaluate(() => window.__copied), await page.inputValue('#packet'));
    const downloadEvent = page.waitForEvent('download');
    await page.click('#download');
    const download = await downloadEvent;
    assert.equal(download.suggestedFilename(), 'lantern-between-letters.garden-seam.json');
    assert.equal(JSON.parse(fs.readFileSync(await download.path(), 'utf8')).verse, await page.textContent('#verse'));

    await page.fill('#selected', '');
    assert.equal(await page.isDisabled('#register'), false);
    assert.equal(await page.isDisabled('#mode'), true);
    const hostile = '<img src=x onerror="window.__injected=true"> café 🐈‍⬛';
    await page.fill('#carrier', hostile);
    await page.fill('#ghost', '<script>window.__injected=true</script>');
    await page.click('#weave');
    await page.click('#unfold');
    assert.equal(await page.locator('.specimen-frame img, .readings img, .readings script').count(), 0);
    assert.equal(await page.evaluate(() => window.__injected), undefined);
    assert.equal(await page.inputValue('#carrier'), hostile);
    assert.equal(await page.textContent('#out-ghost'), '<script>window.__injected=true</script>');
    assert.equal((await page.textContent('#out-carrier')).normalize('NFKC'), hostile);

    await page.fill('#carrier', '');
    await page.click('#weave');
    assert.equal(await page.getAttribute('#status', 'data-kind'), 'error');
    await page.locator('#packet-details').evaluate(element => { element.open = true; });
    await page.fill('#packet', '{"broken":');
    await page.click('#unfold');
    assert.equal(await page.getAttribute('#status', 'data-kind'), 'error');
    assert.equal(await page.isVisible('#recovered'), false);
    await page.fill('#packet', '{"__proto__":{"polluted":true}}');
    await page.click('#unfold');
    assert.equal(await page.getAttribute('#status', 'data-kind'), 'error');
    assert.equal(await page.evaluate(() => ({}).polluted), undefined);

    await page.goto(origin + '/seams/#ghost-hex');
    await page.waitForSelector('body[data-seam-ready="true"]');
    assert.equal(JSON.parse(await page.inputValue('#packet')).id, 'ghost-hex');
    assert.equal(await page.isVisible('#recovered'), false);
    await page.click('#unfold');
    assert.equal(await page.isVisible('#recovered'), true);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('blocked'); } } }));
    await page.click('#copy-verse');
    assert.equal(await page.evaluate(() => window.getSelection().toString()), await page.textContent('#verse'));

    await page.goto(origin + '/seams/');
    await page.waitForSelector('body[data-seam-ready="true"]');
    await page.waitForFunction(() => !/[A-Za-z]/.test(document.querySelector('#status').textContent));
    const leaks = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, 4), leaks = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.parentElement.closest(GardenPresentation.skipSelector) && GardenPresentation.prose(node.data) !== node.data) leaks.push(node.data);
      }
      return leaks;
    });
    assert.deepEqual(leaks, []);
    fs.mkdirSync(path.join(root, 'test-artifacts'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'test-artifacts/seams-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: path.join(root, 'test-artifacts/seams-mobile.png'), fullPage: true });
    const trail = JSON.parse(fs.readFileSync(path.join(__dirname, 'trail.json'), 'utf8'));
    for (const id of ['font-garden', 'ghost-hex', 'kagami-no-migaka']) {
      await page.goto(origin + '/seams/#' + id);
      await page.waitForSelector('body[data-seam-ready="true"]');
      const packet = trail.find(packet => packet.id === id);
      assert.equal(await page.textContent('#verse'), packet.verse, id + ' heavy marks remain exact');
      assert.match(await page.locator('#verse').evaluate(element => getComputedStyle(element).fontFamily), /^STIXGeneral,/);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      await page.locator('.specimen-frame').screenshot({ path: path.join(root, 'test-artifacts/seams-marked-' + id + '.png') });
      await page.click('#unfold');
      assert.equal(await page.isVisible('#recovered'), true);
      assert.equal(await page.textContent('#verse'), packet.verse, id + ' survives explicit decode unchanged');
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log('PASS seam loom: six layers, 78 registers, exact copying/download, malformed packets, inert HTML, authored trail, Unicode presentation, desktop/mobile, local-only requests');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { server.close(); console.error(error); process.exitCode = 1; });
