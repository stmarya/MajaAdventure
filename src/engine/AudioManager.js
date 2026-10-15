/**
 * AudioManager.js
 * Mengelola pemutaran BGM dan SFX.
 * Mendukung: loop BGM, pause/resume, pool SFX overlap, volume, mute.
 *
 * Perbaikan:
 *  - Ganti cloneNode() → new Audio(src) yang lebih andal lintas-browser
 *  - Volume default dibaca dari KONFIG bukan hardcode
 *  - hentikanBGM: set src ke "" agar memory dibebaskan
 */

import { KONFIG } from "./config.js";

export class AudioManager {
  /**
   * @param {import("./AssetLoader.js").AssetLoader} loader
   */
  constructor(loader) {
    this._loader    = loader;
    this._volumeBGM = KONFIG.VOLUME_BGM_DEFAULT;
    this._volumeSFX = KONFIG.VOLUME_SFX_DEFAULT;
    this._bgmAktif  = null;
    this._bgmEl     = null;
    this._dibisukan = false;
  }

  // ─── BGM ──────────────────────────────────────────────────────────────────

  /**
   * Mulai putar BGM. Jika BGM yang sama sudah berjalan, tidak ada yang berubah.
   * @param {string} id
   * @param {boolean} [loop=true]
   */
  putarBGM(id, loop = true) {
    if (this._bgmAktif === id && this._bgmEl && !this._bgmEl.paused) return;
    this.hentikanBGM();

    const sumber = this._loader.ambilAudio(id);
    if (!sumber) {
      console.warn(`[AudioManager] BGM tidak ditemukan: ${id}`);
      return;
    }

    // Gunakan new Audio(src) bukan cloneNode() agar andal di semua browser
    this._bgmEl        = new Audio(sumber.src);
    this._bgmEl.loop   = loop;
    this._bgmEl.volume = this._dibisukan ? 0 : this._volumeBGM;
    this._bgmAktif     = id;

    // Tangani autoplay policy browser
    this._bgmEl.play().catch(() => {
      console.warn("[AudioManager] Autoplay BGM diblokir browser. Akan diputar setelah interaksi pengguna.");
    });
  }

  /** Hentikan BGM dan bebaskan referensi. */
  hentikanBGM() {
    if (this._bgmEl) {
      this._bgmEl.pause();
      this._bgmEl.currentTime = 0;
      this._bgmEl.src = ""; // bebaskan resource
      this._bgmEl = null;
    }
    this._bgmAktif = null;
  }

  /** Pause BGM. */
  pauseBGM() {
    this._bgmEl?.pause();
  }

  /** Resume BGM setelah pause. */
  resumeBGM() {
    this._bgmEl?.play().catch(() => {});
  }

  // ─── SFX ──────────────────────────────────────────────────────────────────

  /**
   * Putar SFX. Clone baru dibuat setiap panggilan agar bisa overlap.
   * @param {string} id
   */
  putarSFX(id) {
    if (this._dibisukan) return;
    const sumber = this._loader.ambilAudio(id);
    if (!sumber) return;

    const clone    = new Audio(sumber.src);
    clone.volume   = this._volumeSFX;
    clone.play().catch(() => {});
    // Auto-cleanup setelah selesai untuk mencegah memory leak
    clone.addEventListener("ended", () => { clone.src = ""; }, { once: true });
  }

  // ─── Volume & Mute ────────────────────────────────────────────────────────

  /** @param {number} vol - 0.0–1.0 */
  setVolumeBGM(vol) {
    this._volumeBGM = Math.max(0, Math.min(1, vol));
    if (this._bgmEl) this._bgmEl.volume = this._dibisukan ? 0 : this._volumeBGM;
  }

  /** @param {number} vol - 0.0–1.0 */
  setVolumeSFX(vol) {
    this._volumeSFX = Math.max(0, Math.min(1, vol));
  }

  /** Toggle bisu/tidak bisu semua audio. */
  toggleBisu() {
    this._dibisukan = !this._dibisukan;
    if (this._bgmEl) {
      this._bgmEl.volume = this._dibisukan ? 0 : this._volumeBGM;
    }
  }

  get dibisukan() { return this._dibisukan; }
}
