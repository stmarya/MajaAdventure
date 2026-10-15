/**
 * AnimationController.js
 * Mengontrol animasi sprite berdasarkan animation_config.json.
 * Setiap entity yang punya sprite wajib memiliki satu AnimationController.
 *
 * Perbaikan:
 *  - Guard fps <= 0 agar tidak menghasilkan Infinity
 *  - Loop while pada update agar frame tidak terlewat saat dt besar
 *  - frameAbsolut clamp agar tidak pernah out-of-bounds
 */

export class AnimationController {
  /**
   * @param {object} spriteConfig  - Entri config dari animation_config.json untuk sprite ini
   *                                 (misal: animConfig.warrior)
   */
  constructor(spriteConfig) {
    this._config       = spriteConfig;
    this._animasiAktif = null;
    this._frameIndex   = 0;
    this._timer        = 0;
    this._selesai      = false;

    // Mainkan animasi default (entri pertama) jika ada
    const namaDefault = Object.keys(spriteConfig.animasi ?? {})[0];
    if (namaDefault) this.mainkan(namaDefault);
  }

  /**
   * Mulai memainkan animasi.
   * Jika animasi yang diminta sudah berjalan dan paksa=false, tidak ada yang terjadi.
   * @param {string} namaAnimasi
   * @param {boolean} [paksa=false]
   */
  mainkan(namaAnimasi, paksa = false) {
    if (this._animasiAktif === namaAnimasi && !paksa) return;
    const defAnimasi = this._config.animasi?.[namaAnimasi];
    if (!defAnimasi) {
      console.warn(`[AnimationController] Animasi tidak ditemukan: "${namaAnimasi}"`);
      return;
    }
    this._animasiAktif = namaAnimasi;
    this._frameIndex   = 0;
    this._timer        = 0;
    this._selesai      = false;
  }

  /**
   * Update frame animasi berdasarkan delta time.
   * Menggunakan loop while agar tidak ada frame yang terlewat saat dt besar.
   * @param {number} dt - Delta time dalam detik
   */
  update(dt) {
    if (!this._animasiAktif || this._selesai) return;
    const def = this._config.animasi[this._animasiAktif];
    if (!def || !def.frames || def.frames.length === 0) return;

    this._timer += dt;

    // Loop untuk menangani kasus dt besar (lebih dari 1 frame)
    let batasIterasi = 16; // cegah infinite loop jika fps sangat kecil
    while (batasIterasi-- > 0) {
      // Durasi per frame: dari frame_durasi_ms atau 1/fps
      let durasiFrame;
      if (def.frame_durasi_ms?.[this._frameIndex] !== undefined) {
        durasiFrame = def.frame_durasi_ms[this._frameIndex] / 1000;
      } else {
        // Guard fps: minimal 1, maksimal 60 agar tidak ada nilai tak terduga
        const fps = Math.max(1, Math.min(60, def.fps ?? 8));
        durasiFrame = 1 / fps;
      }

      if (this._timer < durasiFrame) break; // belum waktunya ganti frame

      this._timer -= durasiFrame;
      this._frameIndex++;

      if (this._frameIndex >= def.frames.length) {
        if (def.loop) {
          this._frameIndex = 0;
        } else {
          this._frameIndex = def.frames.length - 1;
          this._selesai    = true;
          // Pindah ke animasi berikutnya jika dikonfigurasi
          if (def.next) {
            this.mainkan(def.next);
            // Reset timer agar animasi next mulai dari awal (tidak carry-over sisa waktu)
            this._timer = 0;
          }
          break;
        }
      }
    }
  }

  /**
   * Dapatkan index frame absolut di sprite sheet untuk frame animasi saat ini.
   * Selalu clamp agar tidak pernah out-of-bounds.
   * @returns {number}
   */
  get frameAbsolut() {
    if (!this._animasiAktif) return 0;
    const def = this._config.animasi[this._animasiAktif];
    if (!def || !def.frames || def.frames.length === 0) return 0;
    const idx = Math.max(0, Math.min(this._frameIndex, def.frames.length - 1));
    return def.frames[idx] ?? 0;
  }

  /**
   * Apakah animasi non-loop sudah selesai?
   * @returns {boolean}
   */
  get sudahSelesai() { return this._selesai; }

  /**
   * Nama animasi yang sedang berjalan.
   * @returns {string|null}
   */
  get animasiAktif() { return this._animasiAktif; }

  /**
   * Apakah hitbox serangan aktif di frame ini?
   * @returns {boolean}
   */
  get hitboxAktif() {
    if (!this._animasiAktif) return false;
    const def = this._config.animasi[this._animasiAktif];
    if (!def || def.hitbox_aktif_frame === undefined) return false;
    return this._frameIndex === def.hitbox_aktif_frame;
  }

  /**
   * Data hitbox animasi saat ini (jika ada).
   * @returns {{x:number, y:number, lebar:number, tinggi:number}|null}
   */
  get hitbox() {
    if (!this._animasiAktif) return null;
    const def = this._config.animasi[this._animasiAktif];
    return def?.hitbox ?? null;
  }
}
