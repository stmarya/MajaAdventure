import assert from "node:assert/strict";
import { test } from "node:test";
import { FaunaSystem } from "../src/utils/FaunaSystem.js";

function rendererMock() {
  const calls = [];
  let depth = 0;
  return {
    calls,
    ctx: {
      save() { depth++; },
      restore() { depth--; },
      fillRect(...args) { calls.push(["placeholder", ...args]); },
    },
    renderSprite(...args) { calls.push(["sprite", ...args]); },
    get depth() { return depth; },
  };
}

function placeOnScreen(fauna) {
  for (const entity of fauna._entitas) {
    entity.x = 100;
    entity.y = 50;
    entity.oscAmpl = 0;
    entity.animFrame = 2;
    entity.vx = -10;
  }
}

test("source sheets render all 18 fauna with correct dimensions, frame and facing", () => {
  const fauna = new FaunaSystem(3200);
  const loader = { ambilGambar: (id) => ({ id }) };
  fauna.inisialisasi(loader);
  placeOnScreen(fauna);
  const renderer = rendererMock();
  fauna.render(renderer, 0);
  assert.equal(renderer.calls.length, 18);
  for (const [index, call] of renderer.calls.entries()) {
    const entity = fauna._entitas[index];
    assert.deepEqual(call, [
      "sprite", entity.sheet, 2, entity.def.lebar, entity.def.tinggi,
      Math.round(100 * entity.def.parallax), 50, true,
    ]);
  }
  assert.equal(renderer.depth, 0);
});

test("missing sheets warn once per type and retain placeholder rendering", (t) => {
  const warnings = [];
  t.mock.method(console, "warn", (message) => warnings.push(message));
  const fauna = new FaunaSystem(3200);
  fauna.inisialisasi({ ambilGambar: () => null });
  placeOnScreen(fauna);
  const renderer = rendererMock();
  fauna.render(renderer, 0);
  assert.equal(warnings.length, 4);
  assert.ok(renderer.calls.length >= 18);
  assert.ok(renderer.calls.every(([kind]) => kind === "placeholder"));
  assert.equal(renderer.depth, 0);
});

test("animation advances and reinitialization replaces source sheets", () => {
  const fauna = new FaunaSystem(3200);
  const oldSheet = {};
  const newSheet = {};
  fauna.inisialisasi({ ambilGambar: () => oldSheet });
  for (const entity of fauna._entitas) {
    entity.animTimer = 0;
    entity.animFrame = 3;
    entity.animFps = 10;
  }
  fauna.update(0.11);
  assert.ok(fauna._entitas.every((entity) => entity.animFrame === 0));
  fauna.inisialisasi({ ambilGambar: () => newSheet });
  assert.equal(fauna._entitas.length, 18);
  assert.ok(fauna._entitas.every((entity) => entity.sheet === newSheet));
  fauna.reset(640);
  const renderer = rendererMock();
  fauna.render(renderer, 0);
  assert.equal(renderer.calls.length, 0);
});
