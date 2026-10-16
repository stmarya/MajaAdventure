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
    this._sfxAktif = new Set();
    try {
      const s = JSON.parse(localStorage.getItem("maja_audio") ?? "null");
      if (s) {
        if (Number.isFinite(s.bgm)) this._volumeBGM = Math.max(0, Math.min(1, s.bgm));
        if (Number.isFinite(s.sfx)) this._volumeSFX = Math.max(0, Math.min(1, s.sfx));
        this._dibisukan = s.mute === true;
      }
    } catch { /* Storage is optional. */ }
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
      this._bgmEl.removeAttribute("src");
      this._bgmEl.load();
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
    if (this._dibisukan || this._sfxAktif.size >= 16) return;
    const sumber = this._loader.ambilAudio(id);
    if (!sumber) return;

    const clone    = new Audio(sumber.src);
    clone.volume = this._volumeSFX;
    this._sfxAktif.add(clone);
    const cleanup = () => { this._sfxAktif.delete(clone); clone.removeAttribute("src"); };
    clone.addEventListener("ended", cleanup, { once:true });
    clone.addEventListener("error", cleanup, { once:true });
    clone.play().catch(cleanup);
  }

  // ─── Volume & Mute ────────────────────────────────────────────────────────

  /** @param {number} vol - 0.0–1.0 */
  setVolumeBGM(vol) {
    if (!Number.isFinite(vol)) return;
    this._volumeBGM = Math.max(0, Math.min(1, vol));
    this._simpan();
    if (this._bgmEl) this._bgmEl.volume = this._dibisukan ? 0 : this._volumeBGM;
  }

  /** @param {number} vol - 0.0–1.0 */
  setVolumeSFX(vol) {
    if (!Number.isFinite(vol)) return;
    this._volumeSFX = Math.max(0, Math.min(1, vol));
    for (const sound of this._sfxAktif) sound.volume = this._dibisukan ? 0 : this._volumeSFX;
    this._simpan();
  }

  /** Toggle bisu/tidak bisu semua audio. */
  toggleBisu() {
    this._dibisukan = !this._dibisukan;
    for (const sound of this._sfxAktif) sound.volume = this._dibisukan ? 0 : this._volumeSFX;
    this._simpan();
    if (this._bgmEl) {
      this._bgmEl.volume = this._dibisukan ? 0 : this._volumeBGM;
    }
  }

  _simpan() {
    try { localStorage.setItem("maja_audio", JSON.stringify({ bgm:this._volumeBGM, sfx:this._volumeSFX, mute:this._dibisukan })); } catch { /* optional */ }
  }
  get volumeBGM() { return this._volumeBGM; }
  get volumeSFX() { return this._volumeSFX; }
  get dibisukan() { return this._dibisukan; }
}
