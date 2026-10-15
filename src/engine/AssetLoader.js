/**
 * AssetLoader.js
 * Memuat semua asset (gambar dan audio) secara async dengan progress tracking.
 *
 * Perbaikan:
 *  - muatAudio: tambahkan fallback event 'canplay' dan 'loadeddata' selain 'canplaythrough'
 *    agar tidak hang di browser mobile yang tidak memicu canplaythrough untuk OGG
 *  - muatAudio: timeout 10 detik agar tidak hang selamanya jika file tidak bisa diputar
 *  - Duplikasi _totalAsset++ diamankan agar counter akurat
 */

export class AssetLoader {
  constructor() {
    /** @type {Map<string, HTMLImageElement|null>} */
    this.gambar = new Map();
    /** @type {Map<string, HTMLAudioElement|null>} */
    this.audio  = new Map();

    this._totalAsset = 0;
    this._dimuat     = 0;
    this._onProgress = null;
    this._onSelesai  = null;
  }

  /** @param {function(number, string): void} fn */
  set onProgress(fn) { this._onProgress = fn; }
  /** @param {function(): void} fn */
  set onSelesai(fn)  { this._onSelesai = fn; }

  /**
   * Muat satu gambar PNG.
   * @param {string} id    - Kunci unik
   * @param {string} path  - Path relatif ke file PNG
   * @returns {Promise<void>}
   */
  muatGambar(id, path) {
    this._totalAsset++;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.gambar.set(id, img);
        this._dimuat++;
        this._lapor(id);
        resolve();
      };
      img.onerror = () => {
        // Asset belum dibuat — simpan null, jangan crash
        console.warn(`[AssetLoader] Gambar tidak ditemukan: ${path}`);
        this.gambar.set(id, null);
        this._dimuat++;
        this._lapor(id);
        resolve();
      };
      img.src = path;
    });
  }

  /**
   * Muat satu file audio (OGG/WAV).
   * Mendukung fallback event 'canplay' → 'loadeddata' → timeout 10s
   * agar tidak hang di browser mobile yang tidak memicu 'canplaythrough'.
   * @param {string} id    - Kunci unik
   * @param {string} path  - Path ke file audio
   * @returns {Promise<void>}
   */
  muatAudio(id, path) {
    this._totalAsset++;
    return new Promise((resolve) => {
      const el = new Audio();
      let selesai = false;

      const selesaikan = (berhasil) => {
        if (selesai) return; // pastikan hanya dipanggil sekali
        selesai = true;
        if (!berhasil) {
          console.warn(`[AssetLoader] Audio tidak ditemukan atau tidak bisa diputar: ${path}`);
          this.audio.set(id, null);
        } else {
          this.audio.set(id, el);
        }
        this._dimuat++;
        this._lapor(id);
        resolve();
      };

      el.addEventListener("canplaythrough", () => selesaikan(true),  { once: true });
      el.addEventListener("canplay",        () => selesaikan(true),  { once: true });
      el.addEventListener("loadeddata",     () => selesaikan(true),  { once: true });
      el.addEventListener("error",          () => selesaikan(false), { once: true });

      // Timeout 10 detik agar loading tidak hang selamanya
      setTimeout(() => selesaikan(false), 10_000);

      el.src = path;
      el.load();
    });
  }

  /**
   * Muat semua asset dari daftar secara paralel.
   * @param {Array<{id: string, tipe: "gambar"|"audio", path: string}>} daftar
   * @returns {Promise<void>}
   */
  async muatSemua(daftar) {
    const promises = daftar.map(({ id, tipe, path }) => {
      if (tipe === "gambar") return this.muatGambar(id, path);
      if (tipe === "audio")  return this.muatAudio(id, path);
      return Promise.resolve();
    });
    await Promise.all(promises);
    if (this._onSelesai) this._onSelesai();
  }

  /**
   * Ambil gambar yang sudah dimuat.
   * @param {string} id
   * @returns {HTMLImageElement|null}
   */
  ambilGambar(id) {
    return this.gambar.get(id) ?? null;
  }

  /**
   * Ambil audio yang sudah dimuat.
   * @param {string} id
   * @returns {HTMLAudioElement|null}
   */
  ambilAudio(id) {
    return this.audio.get(id) ?? null;
  }

  /** Lapor progres ke callback. */
  _lapor(namaAsset) {
    if (this._onProgress && this._totalAsset > 0) {
      const persen = Math.round((this._dimuat / this._totalAsset) * 100);
      this._onProgress(persen, namaAsset);
    }
  }

  /** Persen progres saat ini (0–100). */
  get persen() {
    return this._totalAsset > 0
      ? Math.round((this._dimuat / this._totalAsset) * 100)
      : 0;
  }
}
