/** Browser state injection is confined to the test runner, never shipped runtime. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
const root=process.env.TEST_WEB_ROOT??fileURLToPath(new URL('../',import.meta.url));
const port=Number(process.env.TEST_PORT??8765),base=`http://127.0.0.1:${port}`;
const server=spawn(process.env.TEST_PYTHON??'python3',['-u','-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:['ignore','pipe','pipe']});
let serverLog='';server.stderr.on('data',d=>serverLog+=d);
let browser;let passed=0;
const pass=name=>{passed++;console.log(`PASS ${name}`);};
try {
 let ready=false;for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error(serverLog);try{const r=await fetch(base);if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,50));}if(!ready)throw Error('Test HTTP server did not start');
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 const plain=await context.newPage();await plain.goto(base);await plain.locator('#start').waitFor({state:'visible'});assert.equal(await plain.evaluate(()=>typeof globalThis.__testOnly),'undefined');await plain.close();pass('production page has no test bridge');
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/engine/main.js',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nglobalThis.__testOnly={gameMgr,audio,input,get state(){return stateGame;},get debug(){return debugMode;}};'});});
 await page.goto(base);await page.locator('#start').waitFor({state:'visible'});await page.locator('#start').click();await page.waitForFunction(()=>__testOnly.state==='bermain');pass('boot and native start button');
 const x=await page.evaluate(()=>__testOnly.gameMgr.player.x);await page.keyboard.down('KeyD');await page.waitForTimeout(120);await page.keyboard.up('KeyD');assert.ok(await page.evaluate(()=>__testOnly.gameMgr.player.x)>x);assert.equal(await page.evaluate(()=>__testOnly.debug),false);pass('D moves player without toggling debug');
 await page.locator('#pause').click();await page.waitForFunction(()=>__testOnly.state==='pause');const paused=await page.evaluate(()=>__testOnly.gameMgr.skor.waktuDetik);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>__testOnly.gameMgr.skor.waktuDetik),paused);await page.locator('#resume').click();await page.waitForFunction(()=>__testOnly.state==='bermain');pass('pause freezes timer and resume works');
 await page.locator('#mute').click();assert.equal(await page.locator('#mute').getAttribute('aria-pressed'),'true');const canvasBox=await page.locator('#canvas').boundingBox();await page.locator('#canvas').click({position:{x:canvasBox.width*304/320,y:canvasBox.height*16/180}});assert.equal(await page.locator('#mute').getAttribute('aria-pressed'),'false');pass('DOM mute and Canvas audio icon work');
 // Move to a real checkpoint position to isolate the recovery path, not traverse the level.
 await page.evaluate(()=>{const g=__testOnly.gameMgr,cp=g.level.checkpoints[0];g.player.x=cp.tile_x*16;g.player.y=cp.tile_y*16;g._updateCheckpoint(0,__testOnly.audio);g.player._iframeSisa=0;g.player.terimaKerusakan(99,__testOnly.audio)});
 await page.waitForFunction(()=>__testOnly.state==='gameover');await page.locator('#retry').click();await page.waitForFunction(()=>__testOnly.state==='bermain');assert.equal(await page.evaluate(()=>__testOnly.gameMgr._aktifCheckpoint.x),960);pass('death reaches gameover and retry uses checkpoint');
 await page.evaluate(()=>{const g=__testOnly.gameMgr,ex=g.level.objek.find(o=>o.tipe==='level_exit');g.player.x=ex.tile_x*16;g.player.y=192;g.player.vx=g.player.vy=0;});await page.waitForFunction(()=>__testOnly.state==='levelcomplete');assert.match(await page.locator('#status').textContent(),/Level selesai/);await page.locator('#home').click();await page.locator('#start').click();await page.waitForFunction(()=>__testOnly.state==='bermain');assert.equal(await page.evaluate(()=>__testOnly.gameMgr.skor.skor),0);assert.equal(await page.evaluate(()=>__testOnly.gameMgr.player.x),32);pass('completion, accessible summary, menu and fresh replay');
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForFunction(()=>__testOnly.state==='pause');await page.locator('#resume').click();pass('focus loss auto-pauses');
 await page.setViewportSize({width:360,height:640});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);pass('360px viewport has no horizontal overflow');
 assert.deepEqual(errors,[]);pass('no unexpected JavaScript exception');
 const bad=await context.newPage();await bad.route('**/docs/animation_config.json',r=>r.fulfill({status:503,body:'unavailable'}));await bad.goto(base);await bad.locator('#reload').waitFor({state:'visible'});assert.match(await bad.locator('#status').textContent(),/Gagal memuat/);await bad.close();pass('configuration failure is explicit and recoverable');
 const image=await context.newPage();await image.route('**/assets/characters/warrior/final/chr_warrior_sheet.png',r=>r.fulfill({status:404,body:'missing'}));await image.goto(base);await image.locator('#reload').waitFor({state:'visible'});await image.close();pass('missing essential image does not pretend loading succeeded');
 const mobile=await browser.newContext({viewport:{width:360,height:640},isMobile:true,hasTouch:true});const touch=await mobile.newPage();await touch.goto(base);await touch.locator('#start').click();await touch.locator('[data-action="lompat"]').tap();assert.equal(await touch.locator('[data-action="lompat"]').isVisible(),true);await mobile.close();pass('experimental touch controls are visible and respond to tap');
 console.log(`Browser smoke: ${passed} checks passed. Endpoints injected; NOT a human playthrough, audio review or real-device certification.`);
} catch(error) { console.error(error);process.exitCode=1; }
finally {if(browser)await browser.close();server.kill();if(server.exitCode===null)await once(server,'exit');}
