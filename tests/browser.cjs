const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.GARDEN_CHROMIUM?{executablePath:process.env.GARDEN_CHROMIUM}:{})});
 try {
  const page=await browser.newPage({viewport:{width:1365,height:950}}),errors=[],network=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
  assert.equal(await page.locator('#gallery article').count(),78);
  await page.fill('#source','café cafe\u0301 👩‍🔬 <img src=x onerror=alert(1)>');
  await page.waitForFunction(()=>document.querySelector('.specimen').textContent.includes('👩‍🔬'));
  assert.equal(await page.locator('#gallery img').count(),0);
  await page.fill('#filter','chaos noodle ii');
  await page.waitForFunction(()=>document.querySelectorAll('#gallery article').length===1);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>window.__copied=t}}));
  await page.locator('#gallery button').click();
  await page.waitForFunction(()=>window.__copied===document.querySelector('.specimen').textContent);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('blocked');}}}));
  await page.locator('#gallery button').click();assert.match((await page.innerText('#status')).normalize('NFKC'),/selected/);
  await page.fill('#filter','');await page.waitForFunction(()=>document.querySelectorAll('#gallery article').length===78);
  await page.fill('#source','the archive grows its own stars');
  fs.mkdirSync(path.join(__dirname,'../test-artifacts'),{recursive:true});
  await page.screenshot({path:path.join(__dirname,'../test-artifacts/desktop.png')});
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await page.screenshot({path:path.join(__dirname,'../test-artifacts/mobile.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  console.log('PASS all 78 cards, Unicode/custom input, inert HTML, filtering, clipboard/fallback, mobile overflow, no errors/network');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
