/**
 * PropRenderer.js
 * Merender prop/dekorasi statis dan beranimasi ke canvas.
 *
 * Prop diambil dari objek level bertipe "prop_*":
 *   - prop_palmtree_tall / med / short
 *   - prop_candi_bentar  (kiri + kanan)
 *   - prop_banner        (bendera Majapahit)
 *   - prop_torch         (obor beranimasi)
 *   - prop_relief        (relief batu statis)
 *
 * Setiap prop memiliki:
 *   { id, tipe, tile_x, tile_y, [anim_timer, anim_frame] }
 */

import { KONFIG } from "../engine/config.js";

// Definisi prop: assetId, lebar (px), tinggi (px), ofsX, ofsY (offset dari tile), animated
const DEF_PROP = {
  "prop_palmtree_tall":  { assetId: "env_palmtree_tall",         lebar: 32, tinggi: 64, ofsX: -8,  ofsY: -48, animated: false },
  "prop_palmtree_med":   { assetId: "env_palmtree_med",          lebar: 32, tinggi: 48, ofsX: -8,  ofsY: -32, animated: false },
  "prop_palmtree_short": { assetId: "env_palmtree_short",        lebar: 24, tinggi: 32, ofsX: -4,  ofsY: -16, animated: false },
  "prop_candi_kiri":     { assetId: "env_candi_bentar_left",     lebar: 32, tinggi: 64, ofsX: -16, ofsY: -48, animated: false },
  "prop_candi_kanan":    { assetId: "env_candi_bentar_right",    lebar: 32, tinggi: 64, ofsX:  0,  ofsY: -48, animated: false },
  "prop_banner":         { assetId: "env_banner_majapahit",      lebar: 16, tinggi: 32, ofsX:  0,  ofsY: -16, animated: false },
  "prop_relief":         { assetId: "env_ruins_relief_01",       lebar: 16, tinggi: 16, ofsX:  0,  ofsY:  0,  animated: false },
  "prop_torch":          { assetId: "vfx_torch",                 lebar: 16, tinggi: 24, ofsX:  0,  ofsY: -8,  animated: true,  fps: 8,  totalFrame: 3, frameLebar: 16, frameTinggi: 24 },
};

export class PropRenderer {
  /**
   * @param {object[]} objekLevel - Array objek dari level JSON
   */
  constructor(objekLevel) {
    /** @type {Array<{tipe:string, x:number, y:number, timer:number, frame:number, def:object}>} */
    this._props = [];

    for (const obj of objekLevel) {
      const def = DEF_PROP[obj.tipe];
      if (!def) continue;
      this._props.push({
        tipe:  obj.tipe,
        x:     (obj.tile_x ?? 0) * KONFIG.UKURAN_TILE,
        y:     (obj.tile_y ?? 0) * KONFIG.UKURAN_TILE,
        timer: 0,
        frame: 0,
        def,
      });
    }
  }

  /**
   * Update animasi prop (obor, dll.).
   * @param {number} dt
   */
  update(dt) {
    for (const p of this._props) {
      if (!p.def.animated) continue;
      p.timer += dt;
      const durasiFrame = 1 / Math.max(1, p.def.fps);
      while (p.timer >= durasiFrame) {
        p.timer -= durasiFrame;
        p.frame = (p.frame + 1) % (p.def.totalFrame ?? 1);
      }
    }
  }

  /**
   * Render semua prop ke canvas.
   * @param {import("../engine/Renderer.js").Renderer} renderer
   * @param {import("../engine/Camera.js").Camera} camera
   * @param {import("../engine/AssetLoader.js").AssetLoader} loader
   */
  render(renderer, camera, loader) {
    for (const p of this._props) {
      const { def } = p;
      const img = loader.ambilGambar(def.assetId);
      if (!img) continue;

      const screenX = Math.round(p.x + def.ofsX - camera.x);
      const screenY = Math.round(p.y + def.ofsY - camera.y);

      // Culling sederhana — lewati jika di luar viewport
      if (screenX + def.lebar  < 0 || screenX > KONFIG.CANVAS_LEBAR)  continue;
      if (screenY + def.tinggi < 0 || screenY > KONFIG.CANVAS_TINGGI) continue;

      if (def.animated) {
        // Ambil frame dari sprite sheet
        const fl = def.frameLebar  ?? def.lebar;
        const ft = def.frameTinggi ?? def.tinggi;
        const kolom = Math.max(1, Math.floor(img.width / fl));
        const srcX  = (p.frame % kolom) * fl;
        const srcY  = Math.floor(p.frame / kolom) * ft;
        renderer.ctx.drawImage(img, srcX, srcY, fl, ft, screenX, screenY, def.lebar, def.tinggi);
      } else {
        // Prop statis — gambar langsung
        renderer.ctx.drawImage(img, screenX, screenY, def.lebar, def.tinggi);
      }
    }
  }

  /** Jumlah prop aktif. */
  get jumlah() { return this._props.length; }
}
