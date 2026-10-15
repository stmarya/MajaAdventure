/**
 * FaunaSystem.js
 * Sistem dekorasi fauna latar belakang — burung, kupu-kupu, capung, kunang-kunang.
 *
 * Setiap fauna bergerak secara independen di layer parallax tertentu.
 * Fauna tidak mempengaruhi gameplay sama sekali — murni dekorasi visual.
 *
 * Fauna dirender SETELAH background parallax tapi SEBELUM tile layer.
 *
 * Cara pakai:
 *   const fauna = new FaunaSystem(lebarLevelPx);
 *   fauna.inisialisasi(loader);        // panggil setelah loader selesai
 *   fauna.update(dt);
 *   fauna.render(renderer, kamera.x);
 */

import { KONFIG } from "../engine/config.js";

// Definisi tipe fauna
const DEF_FAUNA = {
  burung: {
    assetId:    "fauna_burung",
    warna:      "#2E6B9E",        // fallback warna placeholder
    lebar:      12,
    tinggi:     8,
    kecepatanMin: 20,
    kecepatanMaks: 40,
    parallax:   0.4,              // bergerak lebih lambat dari player (layer tengah)
    jumlah:     5,
    yMin:       10,               // pixel dari atas layar (layar koordinat, bukan world)
    yMaks:      60,
  },
  kupu_kupu: {
    assetId:    "fauna_kupu_kupu",
    warna:      "#7AB648",
    lebar:      10,
    tinggi:     8,
    kecepatanMin: 12,
    kecepatanMaks: 22,
    parallax:   0.5,
    jumlah:     4,
    yMin:       40,
    yMaks:      100,
  },
  capung: {
    assetId:    "fauna_capung",
    warna:      "#1A3A5C",
    lebar:      12,
    tinggi:     6,
    kecepatanMin: 25,
    kecepatanMaks: 50,
    parallax:   0.55,
    jumlah:     3,
    yMin:       30,
    yMaks:      90,
  },
  kunang_kunang: {
    assetId:    "fauna_kunang_kunang",
    warna:      "#F5C842",
    lebar:      6,
    tinggi:     6,
    kecepatanMin: 8,
    kecepatanMaks: 18,
    parallax:   0.35,
    jumlah:     6,
    yMin:       50,
    yMaks:      130,
  },
};

// Fauna hanya aktif siang (burung/kupu/capung) atau malam (kunang-kunang)
// Dalam konteks ini semua aktif, kunang-kunang lebih transparan di "siang"
const ALPHA_KUNANG = 0.6;

export class FaunaSystem {
  /**
   * @param {number} lebarLevelPx - Lebar level dunia (pixel)
   */
  constructor(lebarLevelPx) {
    this._lebarLevel = lebarLevelPx;
    /** @type {Array<object>} */
    this._entitas = [];
    this._initialized = false;
  }

  /**
   * Inisialisasi entitas fauna (panggil setelah assets dimuat).
   * @param {import("../engine/AssetLoader.js").AssetLoader} loader
   */
  inisialisasi(loader) {
    this._entitas = [];

    for (const [tipe, def] of Object.entries(DEF_FAUNA)) {
      const sheet = loader.ambilGambar(def.assetId);
      if (!sheet) {
        console.warn(`[FaunaSystem] Sprite tidak tersedia: ${def.assetId}; memakai placeholder.`);
      }
      for (let i = 0; i < def.jumlah; i++) {
        this._entitas.push({
          tipe,
          def,
          sheet,
          // Posisi dalam world space (bukan screen)
          x:     Math.random() * this._lebarLevel,
          y:     def.yMin + Math.random() * (def.yMaks - def.yMin),
          // Kecepatan: positif = gerak kanan, negatif = gerak kiri
          vx:    (Math.random() < 0.5 ? 1 : -1) *
                 (def.kecepatanMin + Math.random() * (def.kecepatanMaks - def.kecepatanMin)),
          // Animasi
          animTimer: Math.random() * 0.5, // offset awal agar tidak semua sync
          animFrame: Math.floor(Math.random() * 4),
          animFps:   6 + Math.random() * 4,
          // Y oscillasi
          oscTimer:  Math.random() * Math.PI * 2,
          oscAmpl:   3 + Math.random() * 5,
          oscFrekuensi: 0.8 + Math.random() * 1.2,
        });
      }
    }

    this._initialized = true;
  }

  /**
   * Update semua entitas fauna.
   * @param {number} dt
   */
  update(dt) {
    if (!this._initialized) return;

    for (const e of this._entitas) {
      // Gerak horizontal
      e.x += e.vx * dt;

      // Wrap-around saat keluar batas level
      if (e.vx > 0 && e.x > this._lebarLevel + 20) {
        e.x = -20;
        e.y = e.def.yMin + Math.random() * (e.def.yMaks - e.def.yMin);
      } else if (e.vx < 0 && e.x < -20) {
        e.x = this._lebarLevel + 20;
        e.y = e.def.yMin + Math.random() * (e.def.yMaks - e.def.yMin);
      }

      // Oscillasi vertikal (melayang naik-turun)
      e.oscTimer += dt * e.oscFrekuensi;

      // Animasi frame (guard animFps >= 1 untuk cegah Infinity)
      e.animTimer += dt;
      const durasiFrame = 1 / Math.max(1, e.animFps);
      if (e.animTimer >= durasiFrame) {
        e.animTimer -= durasiFrame;
        e.animFrame = (e.animFrame + 1) % 4;
      }
    }
  }

  /**
   * Render semua fauna.
   * Posisi screen = worldX * parallax - kameraX * parallax
   * @param {import("../engine/Renderer.js").Renderer} renderer
   * @param {number} kameraX
   */
  render(renderer, kameraX) {
    if (!this._initialized) return;

    for (const e of this._entitas) {
      const { def } = e;

      // Hitung posisi layar dengan parallax
      const screenX = Math.round(e.x * def.parallax - kameraX * def.parallax);
      const screenY = Math.round(e.y + Math.sin(e.oscTimer) * e.oscAmpl);

      // Culling sederhana
      if (screenX + def.lebar < 0 || screenX > KONFIG.CANVAS_LEBAR) continue;
      if (screenY + def.tinggi < 0 || screenY > KONFIG.CANVAS_TINGGI) continue;

      renderer.ctx.save();
      const alpha = e.tipe === "kunang_kunang" ? ALPHA_KUNANG : 0.85;
      renderer.ctx.globalAlpha = alpha;
      if (e.sheet) {
        renderer.renderSprite(e.sheet, e.animFrame, def.lebar, def.tinggi,
          screenX, screenY, e.vx < 0);
        renderer.ctx.restore();
        continue;
      }
      renderer.ctx.fillStyle   = def.warna;

      // Placeholder hanya jika pemuatan sprite gagal.
      if (e.tipe === "burung") {
        // Dua garis miring (siluet burung terbang)
        renderer.ctx.fillRect(screenX,     screenY,     5, 2);
        renderer.ctx.fillRect(screenX + 6, screenY - 1, 5, 2);
      } else if (e.tipe === "capung") {
        // Kotak memanjang
        renderer.ctx.fillRect(screenX, screenY + 2, def.lebar, 2);
        renderer.ctx.fillRect(screenX + 3, screenY, 4, def.tinggi);
      } else {
        // Kotak kecil untuk kupu-kupu dan kunang-kunang
        renderer.ctx.fillRect(screenX, screenY, def.lebar, def.tinggi);
      }

      renderer.ctx.restore();
    }
  }

  /** Reset fauna (saat level baru). */
  reset(lebarLevelPx) {
    this._lebarLevel = lebarLevelPx;
    this._initialized = false;
    this._entitas = [];
  }
}
