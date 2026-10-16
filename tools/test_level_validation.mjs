import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateLevel } from '../src/game/validateLevel.js';
import { AssetLoader } from '../src/engine/AssetLoader.js';
const fresh=()=>JSON.parse(readFileSync(new URL('../levels/level_01.json',import.meta.url),'utf8'));
test('authored runtime level passes bounded validation',()=>assert.equal(validateLevel(fresh()).dimensi.tile_size,16));
for(const [name,mutate] of [
 ['oversized dimension',l=>l.dimensi.lebar_tiles=999999],
 ['inconsistent pixel dimensions',l=>l.dimensi.lebar_px++],
 ['unknown tile',l=>l.layer_tile[0].data[0]=999],
 ['truncated tile array',l=>l.layer_tile[0].data.pop()],
 ['spawn out of bounds',l=>l.spawn.player.tile_x=-1],
 ['duplicate object ID',l=>l.objek[1].id=l.objek[0].id],
 ['unknown object type',l=>l.objek[0].tipe='executable'],
 ['missing object type',l=>delete l.objek[0].tipe],
 ['nonfinite damage',l=>l.objek[0].damage=Infinity],
 ['missing exit',l=>l.objek=l.objek.filter(o=>o.tipe!=='level_exit')],
 ['trigger extending past level',l=>{const o=l.objek.find(o=>o.tipe==='trigger_spike');o.lebar_tiles=l.dimensi.lebar_tiles;}],
])test(`rejects ${name}`,()=>{const level=fresh();mutate(level);assert.throws(()=>validateLevel(level));});
test('image loader settles once and clears watchdog on success',async()=>{
 const original=globalThis.Image;let created;
 globalThis.Image=class {constructor(){created=this;}set src(value){queueMicrotask(()=>this.onload());}};
 try {const loader=new AssetLoader();await loader.muatGambar('image','fake.png');assert.equal(loader.ambilGambar('image'),created);assert.equal(loader.persen,100);assert.equal(created.onload,null);assert.equal(created.onerror,null);}finally{globalThis.Image=original;}
});
test('image watchdog resolves a hung request instead of freezing boot',async()=>{
 const original=globalThis.Image,oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout;let fire,cleared=false;
 globalThis.Image=class {set src(value){}};globalThis.setTimeout=fn=>{fire=fn;return 7;};globalThis.clearTimeout=id=>{cleared=id===7;};
 try{const loader=new AssetLoader();const pending=loader.muatGambar('missing','hung.png');fire();await pending;assert.equal(loader.ambilGambar('missing'),null);assert.equal(loader.persen,100);assert.equal(cleared,true);}finally{globalThis.Image=original;globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
});
