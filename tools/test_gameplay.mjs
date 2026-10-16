import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { CollisionSystem } from "../src/game/CollisionSystem.js";
import { GameManager } from "../src/game/GameManager.js";
import { TilemapRenderer } from "../src/engine/TilemapRenderer.js";
import { FixedStepClock } from "../src/engine/FixedStepClock.js";
import { Player } from "../src/game/Player.js";
import { ScoreManager } from "../src/utils/ScoreManager.js";
const json = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const anim = json("../docs/animation_config.json");
const level = json("../levels/level_01.json");
const tiles = json("../docs/tileset_config.json");
const props = Object.fromEntries(tiles.tilesets[0].tiles.map(t => [t.id, t]));
const mapper = new TilemapRenderer(null, null, 4, props);
const audio = { putarSFX() {} };
const neutral = { aktif: () => false, baruDitekan: () => false };
const make = () => { const g = new GameManager(); g.inisialisasi(level, anim, mapper); return g; };
function collision(data, width = 4) {
  return new CollisionSystem({ tileData: data, lebarTiles: width, tinggiTiles: data.length / width }, {
    dapatPropertiTile: id => ({ solid: id === 1 || id === 14, one_way: id === 14 }), bisaDipanjat: () => false,
  });
}
const body = (o = {}) => ({ x: 16, y: 24, lebar: 8, tinggi: 8, vx: 0, vy: 2, diTanah: false, ...o });
const floor = [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0];
test("landing snaps exactly to floor and stays stable", () => {
  const c = collision(floor), e = body();
  for (let i=0;i<180;i++) { e.vy=0.4; c.gerakkan(e); assert.equal(e.y,24); assert.equal(e.diTanah,true); }
});
test("right and left walls stop at their actual edges", () => {
  const c=collision([0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]);
  let e=body({x:23,y:16,vx:3,vy:0});c.gerakkan(e);assert.equal(e.x,24);assert.equal(e.vx,0);
  e=body({x:49,y:16,vx:-3,vy:0});c.gerakkan(e);assert.equal(e.x,48);
});
test("ceiling in row zero is a collision, not a falsy sentinel", () => {
  const c=collision([1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0]),e=body({y:17,vy:-3});
  c.gerakkan(e);assert.equal(e.y,16);assert.equal(e.vy,0);
});
test("one-way: land above, pass from below, and explicit drop-through", () => {
  const c=collision(floor.map(n=>n===1?14:n));
  let e=body();c.gerakkan(e);assert.equal(e.y,24);
  e=body({y:42,vy:-7});c.gerakkan(e);assert.equal(e.y,35);
  e=body();c.gerakkan(e,true);assert.equal(e.y,26);
});
test("large displacement does not tunnel through a floor", () => {
  const c=collision(floor),e=body({y:0,vy:100});c.gerakkan(e);assert.equal(e.y,24);
});
test("left and right world boundaries are solid", () => {
  const c=collision(Array(16).fill(0));let e=body({x:0,vx:-3,vy:0});c.gerakkan(e);assert.equal(e.x,0);
  e=body({x:56,vx:3,vy:0});c.gerakkan(e);assert.equal(e.x,56);
});
test("death animation completes and reaches gameover", () => {
  const g=make();g.player.terimaKerusakan(99,audio);let state;
  for(let i=0;i<120;i++) state=g.update(1/60,neutral,audio);
  assert.equal(state,"gameover");assert.equal(g.player.animCtrl.sudahSelesai,true);
});
test("death takes precedence over reaching exit", () => {
  const g=make(),ex=g.level.objek.find(o=>o.tipe==="level_exit");g.player.x=ex.tile_x*16;g.player.y=ex.tile_y*16;
  g.player.terimaKerusakan(99,audio);assert.notEqual(g.update(1/60,neutral,audio),"levelcomplete");
});
test("checkpoint retry preserves run while full reset starts fresh", () => {
  const g=make(),cp=g.level.checkpoints[0];g.player.x=cp.tile_x*16;g.player.y=cp.tile_y*16;g._updateCheckpoint(0,audio);
  g.items[0].diambil=true;g.skor.koinDiambil(2);g.player.terimaKerusakan(99,audio);g.respawnCheckpoint();
  assert.equal(g.player.x,cp.tile_x*16);assert.equal(g.player.hp,g.player.hpMaks);assert.equal(g.items[0].diambil,true);assert.equal(g.skor.koin,2);
  g.reset(level,anim,mapper);assert.equal(g.player.x,level.spawn.player.tile_x*16);assert.equal(g.skor.skor,0);assert.equal(g.items[0].diambil,false);
});
test("falling outside level reaches gameover even with invulnerability", () => {
  const g=make();g.player.y=g.level.tinggiPx+100;g.player._iframeSisa=1000;
  for(let i=0;i<120;i++) g.update(1/60,neutral,audio);assert.equal(g._terminal,"gameover");
});
test("score completion is idempotent", () => {
  const s=new ScoreManager();s.mulai();const first=s.selesaikan(3);assert.equal(s.selesaikan(3),first);
  s.mulai();assert.equal(s.selesaikan(3),first);
});
test("30/60/120/144Hz rendering produces identical fixed-step movement", () => {
  const distances=[];
  for(const hz of [30,60,120,144]) {
    const p=new Player(anim.warrior),clock=new FixedStepClock();p.respawn(32,192);
    const c={gerakkan(h){h.x+=h.vx;h.y+=h.vy;h.diTanah=true;},diTangga:()=>false};
    for(let i=0;i<hz;i++) clock.advance(1/hz,dt=>p.update(dt,{...neutral,aktif:a=>a==="kanan"},c,audio));
    distances.push(p.x-32);
  }
  assert.deepEqual(distances,[180,180,180,180]);
});
test("idle spawn does not oscillate vertically", () => {
  const g=make();const y=g.player.y;for(let i=0;i<120;i++)g.update(1/60,neutral,audio);assert.equal(g.player.y,y);
});
test("level spike mutations do not leak into original level data", () => {
  const before=JSON.stringify(level.layer_tile);const g=make();g.level.update(2);assert.equal(JSON.stringify(level.layer_tile),before);
});
test("fixed clock clamps background catchup and discards accumulator on transition", () => {
  const c=new FixedStepClock();let ticks=0;c.advance(100,()=>{ticks++;});assert.equal(ticks,15);
  c.advance(0.1,()=>false);assert.equal(c.accumulator,0);
});

test("exit is reachable from actual floor contact, not an embedded sprite",()=>{
 const g=make(),ex=g.level.objek.find(o=>o.tipe==="level_exit");g.player.x=ex.tile_x*16;g.player.y=192;
 assert.equal(g.update(1/60,neutral,audio),"levelcomplete");
});
