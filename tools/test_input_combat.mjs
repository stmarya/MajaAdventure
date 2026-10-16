import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { InputManager } from '../src/engine/InputManager.js';
import { EnemySoldier } from '../src/game/Enemy.js';
import { Player } from '../src/game/Player.js';
import { Renderer } from '../src/engine/Renderer.js';
const anim=JSON.parse(readFileSync(new URL('../docs/animation_config.json',import.meta.url)));
function key(target,type,code){const e=new Event(type,{cancelable:true});Object.defineProperty(e,'code',{value:code});target.dispatchEvent(e);}
test('keyboard aliases stay active until every mapped key is released',()=>{
 const target=new EventTarget(),i=new InputManager(target);key(target,'keydown','ArrowRight');key(target,'keydown','KeyD');i.akhirFrame();key(target,'keyup','KeyD');assert.equal(i.aktif('kanan'),true);assert.equal(i.baruDilepas('kanan'),false);key(target,'keyup','ArrowRight');assert.equal(i.aktif('kanan'),false);assert.equal(i.baruDilepas('kanan'),true);i.destroy();
});
test('blur clears held keys, virtual pointers and stale edges',()=>{
 const target=new EventTarget(),i=new InputManager(target);key(target,'keydown','Space');i.setVirtual('one','kanan',true);target.dispatchEvent(new Event('blur'));assert.equal(i.aktif('kanan'),false);assert.equal(i.baruDitekan('lompat'),false);i.destroy();
});
test('multiple virtual pointers do not release each other',()=>{
 const i=new InputManager(new EventTarget());i.setVirtual('one','kanan',true);i.setVirtual('two','kanan',true);i.setVirtual('one','kanan',false);assert.equal(i.aktif('kanan'),true);i.setVirtual('two','kanan',false);assert.equal(i.aktif('kanan'),false);i.destroy();
});
test('soldier telegraph and recovery do not cause damage; strike does',()=>{
 const e=new EnemySoldier({tile_x:2,tile_y:2,tipe:'enemy_soldier'},anim.enemy_soldier);e._state='attack';e._arahKanan=true;e.animCtrl.mainkan('attack',true);
 assert.equal(e.cekTumbukanPlayer(56,44,20,40),false);e.animCtrl.update(0.11);assert.equal(e.cekTumbukanPlayer(56,44,20,40),true);e.animCtrl.update(0.11);assert.equal(e.cekTumbukanPlayer(56,44,20,40),false);
});
test('soldier exits recovery when animation next has changed to idle',()=>{
 const e=new EnemySoldier({tile_x:2,tile_y:2,tipe:'enemy_soldier'},anim.enemy_soldier);e._state='attack';e.animCtrl.mainkan('attack',true);
 const collision={gerakkan(){},diTangga:()=>false};e.update(0.4,{x:1000,y:1000},collision);assert.equal(e._state,'patrol');assert.equal(e._attackCooldown,1200);
});
test('dead enemy never deals attack damage',()=>{
 const e=new EnemySoldier({tile_x:2,tile_y:2,tipe:'enemy_soldier'},anim.enemy_soldier);e._state='attack';e.animCtrl.mainkan('attack',true);e.animCtrl.update(0.11);e.hp=0;assert.equal(e.cekTumbukanPlayer(32,32,100,100),false);
});
test('jump buffer can trigger on next grounded tick; coyote time permits edge jump',()=>{
 const p=new Player(anim.warrior);p.respawn(0,0);p._coyote=0.08;p._updateInput(1/60,{aktif:()=>false,baruDitekan:()=>false},null);p._jumpBuffer=.08;p._updateInput(1/60,{aktif:()=>false,baruDitekan:()=>false},null);assert.equal(p.vy,-7);assert.equal(p._jumpBuffer,0);
 p.respawn(0,0);p._jumpBuffer=.08;p.diTanah=true;p._updateInput(1/60,{aktif:()=>false,baruDitekan:()=>false},null);assert.equal(p.vy,-7);
});
test('renderer uses punctuation metadata rather than stale charset offsets',()=>{
 const calls=[];const renderer=Object.create(Renderer.prototype);renderer.ctx={save(){},restore(){},drawImage(...a){calls.push(a)}};
 renderer.fontGlyphs={':':{x:48,y:16},' ':{x:88,y:16}};renderer.renderTeks({width:128},': ',0,0);assert.equal(calls[0][1],48);assert.equal(calls[1][1],88);
});
