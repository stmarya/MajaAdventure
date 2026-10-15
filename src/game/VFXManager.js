/**
 * VFXManager.js
 * Mengelola efek visual sementara (VFX) yang otomatis terhapus setelah selesai.
 *
 * Setiap VFX adalah objek {id, sheet, frameIndex, timer, fps, x, y, frameLebar, frameTinggi, totalFrame}
 * VFX di-render SEBELUM karakter (di atas tile, di bawah UI).
 *
 * Cara pakai:
 *   vfxMgr.tampilkan("hit",   hitSheet,  x, y)
 *   vfxMgr.tampilkan("dust",  dustSheet, x, y)
 *   vfxMgr.update(dt)
 *   vfxMgr.render(renderer)
 */

export class VFXManager {
  constructor() {
    /** @type {Array<object>} Pool VFX aktif */
    this._pool = [];
  }

  /**
   * Tampilkan efek VFX satu kali di posisi dunia.
   * @param {string}              id          - Identifier debug
   * @param {HTMLImageElement}    sheet       - Sprite sheet VFX
   * @param {number}              x           - X layar (sudah dikonversi dari world)
   * @param {number}              y           - Y layar
   * @param {number}              frameLebar  - Lebar 1 frame (px)
   * @param {number}              frameTinggi - Tinggi 1 frame (px)
   * @param {number}              totalFrame  - Jumlah frame total
   * @param {number}              [fps=12]    - Frame per detik
   */
  tampilkan(id, sheet, x, y, frameLebar, frameTinggi, totalFrame, fps = 12) {
    if (!sheet) return;
    this._pool.push({
      id,
      sheet,
      frameIndex: 0,
      timer: 0,
      fps,
      x, y,
      frameLebar,
      frameTinggi,
      totalFrame,
    });
  }

  /**
   * Helper cepat: efek debu (dust) mendarat/berjalan.
   * @param {HTMLImageElement} sheet
   * @param {number} x
   * @param {number} y
   */
  tampilkanDebu(sheet, x, y) {
    this.tampilkan("dust", sheet, x, y, 24, 16, 3, 12);
  }

  /**
   * Helper cepat: efek hit/benturan serangan.
   * @param {HTMLImageElement} sheet
   * @param {number} x
   * @param {number} y
   */
  tampilkanHit(sheet, x, y) {
    this.tampilkan("hit", sheet, x, y, 32, 32, 3, 16);
  }

  /**
   * Update semua VFX aktif.
   * VFX yang sudah selesai dihapus otomatis.
   * @param {number} dt
   */
  update(dt) {
    for (let i = this._pool.length - 1; i >= 0; i--) {
      const vfx = this._pool[i];
      vfx.timer += dt;
      const durasiFrame = 1 / Math.max(1, vfx.fps);

      while (vfx.timer >= durasiFrame) {
        vfx.timer -= durasiFrame;
        vfx.frameIndex++;
      }

      // Hapus VFX yang sudah melebihi frame terakhir
      if (vfx.frameIndex >= vfx.totalFrame) {
        this._pool.splice(i, 1);
      }
    }
  }

  /**
   * Render semua VFX aktif.
   * @param {import("../engine/Renderer.js").Renderer} renderer
   */
  render(renderer) {
    for (const vfx of this._pool) {
      const { sheet, frameIndex, frameLebar, frameTinggi, totalFrame } = vfx;
      const idx = Math.min(frameIndex, totalFrame - 1);

      const kolomPerBaris = Math.max(1, Math.floor(sheet.width / frameLebar));
      const srcX = (idx % kolomPerBaris) * frameLebar;
      const srcY = Math.floor(idx / kolomPerBaris) * frameTinggi;

      renderer.ctx.drawImage(
        sheet,
        srcX, srcY, frameLebar, frameTinggi,
        Math.round(vfx.x - frameLebar / 2),
        Math.round(vfx.y - frameTinggi / 2),
        frameLebar, frameTinggi
      );
    }
  }

  /** Hapus semua VFX (saat reset level). */
  bersihkan() {
    this._pool.length = 0;
  }

  /** Jumlah VFX aktif saat ini. */
  get jumlah() { return this._pool.length; }
}
