/**
 * Renderer.js
 * Modul render utama. Mengatur canvas, skala integer, dan menyediakan
 * metode render dasar untuk sprite, tile, dan teks pixel art.
 *
 * Perbaikan:
 *  - imageSmoothingEnabled di-reset setiap kali canvas di-resize (reset oleh browser)
 *  - renderTeks menggunakan ctx.save/restore agar fillStyle tidak bocor
 *  - Konstanta HUD diambil dari KONFIG, bukan hardcode
 *  - renderLoading menggunakan KONFIG.WARNA_BG_LOADING
 */

import { KONFIG } from "./config.js";

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext("2d");

    // Terapkan skala awal
    this._skala = KONFIG.SKALA_DEFAULT;
    this._terapkanSkala();
  }

  // ─── Skala ────────────────────────────────────────────────────────────────

  /** Hitung skala integer terbaik berdasarkan ukuran jendela. */
  hitungSkalaTerbaik() {
    const skalaX = Math.floor(window.innerWidth  / KONFIG.CANVAS_LEBAR);
    const skalaY = Math.floor(window.innerHeight / KONFIG.CANVAS_TINGGI);
    // Clamp ke rentang SKALA_MIN–SKALA_MAKS dari konfigurasi
    return Math.max(KONFIG.SKALA_MIN, Math.min(skalaX, skalaY, KONFIG.SKALA_MAKS));
  }

  /**
   * Terapkan skala ke canvas.
   * PENTING: mengubah canvas.width/height me-reset context 2D sepenuhnya,
   * termasuk imageSmoothingEnabled. Wajib di-set ulang di sini.
   */
  _terapkanSkala() {
    this.canvas.width  = KONFIG.CANVAS_LEBAR;
    this.canvas.height = KONFIG.CANVAS_TINGGI;
    this.canvas.style.width  = `${KONFIG.CANVAS_LEBAR  * this._skala}px`;
    this.canvas.style.height = `${KONFIG.CANVAS_TINGGI * this._skala}px`;
    // Wajib di-set ulang setelah resize — browser me-reset context
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Resize canvas mengikuti jendela. Dipanggil dari event listener window resize. */
  terapkanAutoSkala() {
    this._skala = this.hitungSkalaTerbaik();
    this._terapkanSkala();
  }

  // ─── Clear ────────────────────────────────────────────────────────────────

  /** Bersihkan seluruh canvas dengan warna background. */
  bersihkan(warna = KONFIG.WARNA_BG_LOADING) {
    this.ctx.fillStyle = warna;
    this.ctx.fillRect(0, 0, KONFIG.CANVAS_LEBAR, KONFIG.CANVAS_TINGGI);
  }

  // ─── Sprite ───────────────────────────────────────────────────────────────

  /**
   * Render satu frame sprite dari sprite sheet.
   * @param {HTMLImageElement} sheet    - Sprite sheet
   * @param {number} frameIndex         - Index frame (0-based, kiri ke kanan, atas ke bawah)
   * @param {number} frameLebar         - Lebar satu frame (px)
   * @param {number} frameTinggi        - Tinggi satu frame (px)
   * @param {number} x                  - Posisi X di canvas (px, sudut kiri atas sprite)
   * @param {number} y                  - Posisi Y di canvas (px)
   * @param {boolean} [flipH=false]     - Flip horizontal (untuk karakter menghadap kanan)
   */
  renderSprite(sheet, frameIndex, frameLebar, frameTinggi, x, y, flipH = false) {
    if (!sheet) return;

    // Guard: kolomPerBaris minimal 1 agar tidak ada pembagian nol
    const kolomPerBaris = Math.max(1, Math.floor(sheet.width / frameLebar));
    const srcX = (frameIndex % kolomPerBaris) * frameLebar;
    const srcY = Math.floor(frameIndex / kolomPerBaris) * frameTinggi;

    if (flipH) {
      this.ctx.save();
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(
        sheet,
        srcX, srcY, frameLebar, frameTinggi,
        -(x + frameLebar), y, frameLebar, frameTinggi
      );
      this.ctx.restore();
    } else {
      this.ctx.drawImage(
        sheet,
        srcX, srcY, frameLebar, frameTinggi,
        x, y, frameLebar, frameTinggi
      );
    }
  }

  /**
   * Render satu tile dari tileset.
   * @param {HTMLImageElement} tileset
   * @param {number} tileId             - ID tile (1-based sesuai tileset_config.json)
   * @param {number} kolomTileset       - Jumlah kolom di tileset image
   * @param {number} x                  - Posisi X di canvas (px)
   * @param {number} y                  - Posisi Y di canvas (px)
   */
  renderTile(tileset, tileId, kolomTileset, x, y) {
    if (!tileset || tileId === 0) return;
    const idx    = tileId - 1; // tile_id 1-based → 0-based index
    const kolom  = Math.max(1, kolomTileset);
    const ukuran = KONFIG.UKURAN_TILE;
    const srcX   = (idx % kolom) * ukuran;
    const srcY   = Math.floor(idx / kolom) * ukuran;
    this.ctx.drawImage(tileset, srcX, srcY, ukuran, ukuran, x, y, ukuran, ukuran);
  }

  /**
   * Render teks dengan font bitmap 8×8.
   * Menggunakan save/restore agar state ctx tidak bocor ke render lain.
   * @param {HTMLImageElement} fontSheet - Bitmap font sheet
   * @param {string} teks               - String yang akan dirender
   * @param {number} x                  - Posisi X awal
   * @param {number} y                  - Posisi Y
   * @param {number} [spasi=1]          - Jarak antar karakter (px)
   */
  renderTeks(fontSheet, teks, x, y, spasi = 1) {
    if (!fontSheet || !teks) return;
    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,:-/()% ";
    const GLYPH_L = 8;
    const GLYPH_T = 8;
    const KOLOM   = Math.max(1, Math.floor(fontSheet.width / GLYPH_L));

    this.ctx.save();
    let xPos = x;
    for (const karakter of teks.toUpperCase()) {
      const idx = CHARSET.indexOf(karakter);
      if (idx >= 0) {
        const srcX = (idx % KOLOM) * GLYPH_L;
        const srcY = Math.floor(idx / KOLOM) * GLYPH_T;
        this.ctx.drawImage(fontSheet, srcX, srcY, GLYPH_L, GLYPH_T, xPos, y, GLYPH_L, GLYPH_T);
      }
      xPos += GLYPH_L + spasi;
    }
    this.ctx.restore();
  }

  /**
   * Render kotak solid (untuk debug hitbox atau placeholder).
   * @param {number} x
   * @param {number} y
   * @param {number} lebar
   * @param {number} tinggi
   * @param {string} [warna]
   */
  renderKotak(x, y, lebar, tinggi, warna = KONFIG.WARNA.MERAH_BATA) {
    this.ctx.save();
    this.ctx.fillStyle = warna;
    this.ctx.fillRect(x, y, lebar, tinggi);
    this.ctx.restore();
  }

  /**
   * Render outline kotak (untuk debug collision).
   * @param {number} x
   * @param {number} y
   * @param {number} lebar
   * @param {number} tinggi
   * @param {string} [warna]
   */
  renderOutlineKotak(x, y, lebar, tinggi, warna = KONFIG.WARNA.HIJAU_HUTAN) {
    this.ctx.save();
    this.ctx.strokeStyle = warna;
    this.ctx.lineWidth   = 1;
    this.ctx.strokeRect(x + 0.5, y + 0.5, lebar - 1, tinggi - 1);
    this.ctx.restore();
  }

  /**
   * Render health bar bergaya pixel art.
   * Dimensi diambil dari KONFIG agar tidak hardcode.
   * @param {HTMLImageElement|null} frameKosong
   * @param {HTMLImageElement|null} frameIsi
   * @param {number} hp        - HP saat ini
   * @param {number} hpMaks    - HP maksimum (>0)
   * @param {number} x
   * @param {number} y
   */
  renderHealthBar(frameKosong, frameIsi, hp, hpMaks, x, y) {
    if (hpMaks <= 0) return; // guard pembagian nol

    const LEBAR   = KONFIG.HEALTHBAR_LEBAR;
    const TINGGI  = KONFIG.HEALTHBAR_TINGGI;
    const PADDING = KONFIG.HEALTHBAR_PADDING;

    if (frameKosong) {
      this.ctx.drawImage(frameKosong, x, y, LEBAR, TINGGI);
    } else {
      this.renderKotak(x, y, LEBAR, TINGGI, KONFIG.WARNA.HITAM_TUA);
    }

    const hpClamp  = Math.max(0, Math.min(hp, hpMaks));
    if (hpClamp > 0) {
      const isiLebar = Math.round(((LEBAR - PADDING * 2) * hpClamp) / hpMaks);
      if (frameIsi) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x + PADDING, y + PADDING, isiLebar, TINGGI - PADDING * 2);
        this.ctx.clip();
        this.ctx.drawImage(frameIsi, x, y, LEBAR, TINGGI);
        this.ctx.restore();
      } else {
        this.renderKotak(x + PADDING, y + PADDING, isiLebar, TINGGI - PADDING * 2, KONFIG.WARNA.MERAH_BATA);
      }
    }
  }

  /**
   * Render layar loading dengan bar progres.
   * Menggunakan ctx.save/restore agar tidak ada state yang bocor.
   * @param {number} persen  - 0–100
   */
  renderLoading(persen) {
    this.bersihkan(KONFIG.WARNA_BG_LOADING);

    const cx = KONFIG.CANVAS_LEBAR  / 2;
    const cy = KONFIG.CANVAS_TINGGI / 2;

    this.ctx.save();

    // Judul
    this.ctx.fillStyle = KONFIG.WARNA.PUTIH_GADING;
    this.ctx.font      = "8px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("MAJAPAHIT PLATFORMER", cx, cy - 20);

    // Loading bar
    const barLebar  = 120;
    const barTinggi = 6;
    const barX = cx - barLebar / 2;
    const barY = cy - barTinggi / 2;

    // Frame bar
    this.ctx.fillStyle = KONFIG.WARNA.HITAM_TUA;
    this.ctx.fillRect(barX - 1, barY - 1, barLebar + 2, barTinggi + 2);
    // Isi bar
    const persanClamp = Math.max(0, Math.min(100, persen));
    this.ctx.fillStyle = KONFIG.WARNA.MERAH_BATA;
    this.ctx.fillRect(barX, barY, Math.round(barLebar * persanClamp / 100), barTinggi);

    // Persentase
    this.ctx.fillStyle = KONFIG.WARNA.PUTIH_GADING;
    this.ctx.font      = "6px monospace";
    this.ctx.fillText(`${persanClamp}%`, cx, cy + 16);

    this.ctx.restore();
  }
}
