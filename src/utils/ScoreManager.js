/**
 * ScoreManager.js
 * Mengelola skor, statistik, dan waktu per sesi level.
 *
 * Skor dihitung dari:
 *  - Koin yang dikumpulkan  (+10 poin per koin)
 *  - Musuh yang dikalahkan  (+50 poin per musuh)
 *  - Bonus waktu            (berkurang 1 poin per detik, min 0)
 *  - Bonus selesai          (+500 poin jika HP > 0)
 *
 * Skor tertinggi (highscore) disimpan di localStorage.
 */

const POIN_KOIN       = 10;
const POIN_MUSUH      = 50;
const POIN_SELESAI    = 500;
const WAKTU_BONUS_MAKS = 300; // detik, mulai kurangi dari nilai ini

const KEY_HIGHSCORE = "majapahit_highscore";

export class ScoreManager {
  constructor() {
    this._skor        = 0;
    this._koin        = 0;
    this._musuhKalah  = 0;
    this._waktuDetik  = 0;     // total waktu bermain (detik)
    this._aktif       = false;

    // Highscore dari storage
    this._highscore   = this._muatHighscore();
  }

  // ─── Kontrol sesi ─────────────────────────────────────────────────────────

  /** Mulai sesi baru (reset semua statistik). */
  mulai() {
    this._skor       = 0;
    this._koin       = 0;
    this._musuhKalah = 0;
    this._waktuDetik = 0;
    this._aktif      = true;
  }

  /** Hentikan pencatat waktu (saat pause / gameover). */
  jeda() { this._aktif = false; }

  /** Lanjutkan pencatat waktu (saat resume). */
  lanjut() { this._aktif = true; }

  /**
   * Update timer setiap frame.
   * @param {number} dt - Delta time (detik)
   */
  update(dt) {
    if (this._aktif) this._waktuDetik += dt;
  }

  // ─── Event skor ───────────────────────────────────────────────────────────

  /** Catat koin diambil. @param {number} [jumlah=1] */
  koinDiambil(jumlah = 1) {
    this._koin  += jumlah;
    this._skor  += POIN_KOIN * jumlah;
  }

  /** Catat musuh dikalahkan. @param {number} [jumlah=1] */
  musuhDikalahkan(jumlah = 1) {
    this._musuhKalah += jumlah;
    this._skor       += POIN_MUSUH * jumlah;
  }

  /**
   * Finalisasi skor (dipanggil saat level selesai).
   * Tambahkan bonus waktu dan bonus selesai.
   * @param {number} hpSisa - HP player saat selesai
   * @returns {number} Skor akhir
   */
  selesaikan(hpSisa) {
    this._aktif = false;

    // Bonus waktu: makin cepat = makin tinggi
    const bonusWaktu = Math.max(0, Math.round(
      (WAKTU_BONUS_MAKS - this._waktuDetik) * 1
    ));
    this._skor += bonusWaktu;

    // Bonus selesai dengan HP tersisa
    if (hpSisa > 0) this._skor += POIN_SELESAI;

    // Simpan highscore
    if (this._skor > this._highscore) {
      this._highscore = this._skor;
      this._simpanHighscore();
    }

    return this._skor;
  }

  // ─── Getter ───────────────────────────────────────────────────────────────

  get skor()        { return this._skor; }
  get koin()        { return this._koin; }
  get musuhKalah()  { return this._musuhKalah; }
  get highscore()   { return this._highscore; }

  /** Waktu dalam format M:SS */
  get waktuFormat() {
    const total = Math.floor(this._waktuDetik);
    const menit = Math.floor(total / 60);
    const detik = total % 60;
    return `${menit}:${String(detik).padStart(2, "0")}`;
  }

  get waktuDetik()  { return this._waktuDetik; }

  /**
   * Ringkasan statistik untuk layar level complete.
   * @returns {{ skor, koin, musuhKalah, waktu, highscore }}
   */
  get statistik() {
    return {
      skor:       this._skor,
      koin:       this._koin,
      musuhKalah: this._musuhKalah,
      waktu:      this.waktuFormat,
      highscore:  this._highscore,
    };
  }

  // ─── localStorage ─────────────────────────────────────────────────────────

  _muatHighscore() {
    try {
      const val = localStorage.getItem(KEY_HIGHSCORE);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  _simpanHighscore() {
    try {
      localStorage.setItem(KEY_HIGHSCORE, String(this._highscore));
    } catch {
      // localStorage tidak tersedia (standalone file, private mode, dll.)
    }
  }
}
