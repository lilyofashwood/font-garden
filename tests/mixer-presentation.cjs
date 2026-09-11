const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.GARDEN_CHROMIUM?{executablePath:process.env.GARDEN_CHROMIUM}:{})});
 try {
  const page=await browser.newPage({viewport:{width:1365,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(pathToFileURL(path.join(__dirname,'../veil_script_font_garden_v0_2_1.html')).href);
  const check=async()=>assert.deepEqual(await page.evaluate(()=>{
   const skip=GardenPresentation.skipSelector+',.out-text,.big-output,.divider-text,.house-sample';
   const w=document.createTreeWalker(document.body,4),leaks=[];
   while(w.nextNode()){const n=w.currentNode;if(n.parentElement.getClientRects().length&&!n.parentElement.closest(skip)&&GardenPresentation.prose(n.data)!==n.data)leaks.push(n.data);}
   for(const e of document.querySelectorAll('[placeholder],[title]'))for(const name of ['placeholder','title'])if(/[A-Za-z]/.test(e.getAttribute(name)||''))leaks.push(e.id+':'+name);
   return leaks;
  }),[]);
  assert(!/[A-Za-z]/.test(await page.title()));
  const source='MiXeD cafe\u0301 👩🏽‍🔬 𝒜\u0344';
  await page.fill('#masterInput',source);
  await page.waitForFunction(value=>document.querySelector('[data-id="plain"] .out-text').textContent===value,source);
  assert.equal(await page.textContent('[data-id="plain"] .out-text'),source);
  await check();
  await page.fill('#styleSearch','no such register');
  await page.waitForFunction(()=>document.querySelector('.empty')&&!/[A-Za-z]/.test(document.querySelector('.empty').textContent));
  await check();await page.fill('#styleSearch','');
  for(const id of ['single','mixer','overlays','dividers','clean','about']){
   await page.click('#tab-'+id);await check();
  }
  await page.fill('#specBox','not json');await page.click('#applySpec');
  await page.waitForFunction(()=>document.querySelector('#toast').textContent.normalize('NFKC').startsWith('spec error:'));
  await check();
  await page.click('#tab-single');await page.selectOption('#singleStyle','plain');await page.fill('#singleInput',source);
  assert.equal(await page.textContent('#singleOutput'),source);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__copied=text}}));
  await page.click('#copySingle');await page.waitForFunction(()=>window.__copied===document.querySelector('#singleOutput').textContent);
  assert.equal(await page.evaluate(()=>window.__copied),source);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('blocked')}}});document.execCommand=()=>false;});
  await page.click('#copySingle');await page.waitForSelector('#manualCopy.show');
  assert.equal(await page.inputValue('#manualCopyText'),source);await check();await page.click('#closeManualCopy');
  await page.click('#tab-about');
  const before=await page.inputValue('#specBox'),download=page.waitForEvent('download');await page.click('#downloadSpec');
  assert.equal(fs.readFileSync(await (await download).path(),'utf8'),before);
  await page.click('#tab-overlays');await page.fill('#overlayInput',source);await check();
  fs.mkdirSync(path.join(__dirname,'../test-artifacts'),{recursive:true});
  await page.screenshot({path:path.join(__dirname,'../test-artifacts/mixer-lettering-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await check();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(__dirname,'../test-artifacts/mixer-lettering-mobile.png'),fullPage:true});
  const target=pathToFileURL(path.join(__dirname,'../veil_script_font_garden_v0_2_1.html')).href;
  for(const tab of ['all','single','mixer','overlays','dividers','clean','about']){
   await page.goto(target+'?tab='+tab+'&font=plain');
   assert.equal(await page.getAttribute('.tab.active','data-tab'),tab);
   assert.equal(await page.inputValue('#singleStyle'),'plain');await check();
  }
  await page.goto(target+'?tab=not-a-tool&font=not-a-font');
  assert.notEqual(await page.inputValue('#singleStyle'),'');await check();
  assert.deepEqual(errors,[]);
  console.log('PASS mixer: all seven tabs, dynamic empty/error/manual-copy UI, attributes, literal source/output, exact clipboard/spec download, desktop/mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
