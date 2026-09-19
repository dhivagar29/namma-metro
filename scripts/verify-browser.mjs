// Run after npm run build on a machine that permits Chromium.
// Serves built files through Playwright request interception; no HTTP listener.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
let chromium;
try { ({chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright')); }
catch { try {({chromium}=require('/usr/local/lib/node_modules/playwright-core'));} catch {throw new Error('Install Playwright in your local tooling, or set PLAYWRIGHT_MODULE to its absolute module path.');} }
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const files=new Set();
 await page.route('https://metro.local/**',async route=>{
  const pathname=new URL(route.request().url()).pathname;
  const file=resolve('dist',pathname==='/'?'index.html':`.${pathname}`);
  assert.ok(file.startsWith(`${resolve('dist')}/`));
  try {files.add(pathname);await route.fulfill({body:readFileSync(file),contentType:({'.js':'text/javascript','.css':'text/css','.wav':'audio/wav','.html':'text/html'})[extname(file)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Not found'});}
 });
 await page.goto('https://metro.local/');
 await page.locator('canvas').waitFor();
 await page.screenshot({path:'artifacts/01-welcome.png'});
 await page.getByRole('button',{name:'Select Purple · Begin duty'}).click();
 await page.waitForTimeout(5500);
 assert.equal(await page.getByRole('button',{name:'Close doors D',exact:true}).isEnabled(),true);
 await page.screenshot({path:'artifacts/02-cab-whitefield.png'});
 await page.keyboard.press('KeyD');
 assert.match(await page.locator('.lamp-row').innerText(),/CLOSING/);
 await page.waitForTimeout(2800);
 assert.match(await page.locator('.destination h1').innerText(),/Hopefarm Channasandra/);
 await page.getByRole('button',{name:'W / ↑ power',exact:true}).click();
 await page.waitForTimeout(7000);
 assert.ok(Number((await page.locator('.speedometer strong').innerText()).replace(/\D/g,''))>0);
 assert.equal(await page.getByRole('button',{name:'Open doors D',exact:true}).isDisabled(),true);
 await page.screenshot({path:'artifacts/03-elevated-driving.png'});
 // Space must brake even after clicking a dashboard button (keyboard focus).
 await page.keyboard.down('Space');await page.waitForTimeout(1000);
 assert.match(await page.locator('.console-status').innerText(),/BRAKING/);
 await page.keyboard.up('Space');
 await page.keyboard.press('KeyM');assert.equal(await page.getByRole('button',{name:'Unmute sound'}).getAttribute('aria-pressed'),'true');
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'Resume duty'}).isVisible(),true);
 await page.screenshot({path:'artifacts/04-paused.png'});
 await page.getByRole('button',{name:'Resume duty'}).click();
 await page.getByRole('button',{name:'All 37 stops'}).click();
 assert.equal(await page.locator('.full-route li').count(),37);
 await page.getByRole('button',{name:'Close route'}).click();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/05-mobile.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.equal([...files].filter(name=>name.endsWith('.wav')).length,9);
 assert.deepEqual(errors,[]);
 console.log('PASS: render, departure, inertia, door interlock, emergency keyboard input, mute, pause, 37-stop route, mobile, 9 WAVs; screenshots in artifacts/.');
} finally {await browser.close();}
