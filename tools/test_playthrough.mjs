import {readFileSync}from'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {GameManager}from'../src/game/GameManager.js';
import {TilemapRenderer}from'../src/engine/TilemapRenderer.js';
test('real level clears using movement, jump, combat and checkpoint retry; no teleport or invulnerability override',()=>{
const r=fileURLToPath(new URL('../',import.meta.url));const j=p=>JSON.parse(readFileSync(r+p));const l=j('levels/level_01.json'),a=j('docs/animation_config.json'),t=j('docs/tileset_config.json');const g=new GameManager(),m=new TilemapRenderer(null,null,4,Object.fromEntries(t.tilesets[0].tiles.map(t=>[t.id,t])));g.inisialisasi(l,a,m);let deaths=0,max=0,lastJump=-100,lastAttack=-100,finished=false;const trace=[];
for(let tick=0;tick<3000;tick++){
 const p=g.player;
 const nearEnemy=g.enemies.some(e=>e.aktif&&!e.mati&&Math.abs(e.x-p.x)<60&&Math.abs(e.y-p.y)<48);
 const tileX=Math.floor((p.hitboxKanan+20)/16),top=Math.floor(p.hitboxY/16),bottom=Math.floor((p.hitboxBawah-1)/16);
 let obstacle=false;for(let y=top;y<=bottom;y++)if(m.dapatPropertiTile(g.level.tileData[y*200+tileX]??0).solid)obstacle=true;
 const jump=p.diTanah&&tick-lastJump>20&&(obstacle||nearEnemy||tick%60===0);const attack=nearEnemy&&tick-lastAttack>30;
 if(jump)lastJump=tick;if(attack)lastAttack=tick;
 const state=g.update(1/60,{aktif:x=>x==='kanan',baruDitekan:x=>x==='lompat'?jump:x==='serang'?attack:false},{putarSFX(){}});max=Math.max(max,p.x);if(tick%600===0)trace.push({tick,x:p.x,y:p.y,hp:p.hp});
 if(state==='gameover'){deaths++;g.respawnCheckpoint();}
 if(state==='levelcomplete'){finished=true;trace.push({tick,x:p.x,y:p.y,hp:p.hp});break;}
}
assert.equal(finished,true,JSON.stringify({deaths,max,trace}));
assert.ok(deaths>=1,'regression route must exercise real death and recovery');
assert.deepEqual([...g._checkpointState.values()].map(c=>c.aktif),[true,true]);
console.log(`Traversal: finished, deaths=${deaths}, both checkpoints activated; no teleport, no HP overrides.`);
});
