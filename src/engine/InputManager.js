/**
 * InputManager.js
 * Menangani input keyboard dan touch untuk game.
 * Menggunakan pola "tombol ditekan saat ini" + "tombol baru ditekan frame ini"
 * agar bisa dibedakan antara tap sekali dan tahan.
 */

export class InputManager {
  constructor() {
    /** @type {Set<string>} Tombol yang sedang ditekan */
    this._ditekan = new Set();
    /** @type {Set<string>} Tombol yang baru ditekan frame ini */
    this._baruDitekan = new Set();
    /** @type {Set<string>} Tombol yang baru dilepas frame ini */
    this._baruDilepas = new Set();

    // Peta kode tombol ke aksi game
    this._peta = {
      "ArrowLeft":  "kiri",
      "ArrowRight": "kanan",
      "ArrowUp":    "lompat",
      "ArrowDown":  "jongkok",
      "KeyZ":       "serang",
      "KeyX":       "lompat",
      "Space":      "lompat",
      "KeyA":       "kiri",
      "KeyD":       "kanan",
      "KeyW":       "lompat",
      "KeyS":       "jongkok",
      "Escape":     "pause",
      "Enter":      "konfirmasi",
    };

    // Inisialisasi state aksi
    this._aksiAktif    = new Set();
    this._aksiBaru     = new Set();
    this._aksiDilepas  = new Set();

    this._daftarEventListener();
  }

  _daftarEventListener() {
    window.addEventListener("keydown", (e) => {
      if (this._ditekan.has(e.code)) return; // cegah repeat
      this._ditekan.add(e.code);
      this._baruDitekan.add(e.code);

      const aksi = this._peta[e.code];
      if (aksi) {
        this._aksiAktif.add(aksi);
        this._aksiBaru.add(aksi);
      }

      // Cegah scroll halaman saat bermain
      if (["ArrowUp", "ArrowDown", "Space"].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", (e) => {
      this._ditekan.delete(e.code);
      this._baruDilepas.add(e.code);

      const aksi = this._peta[e.code];
      if (aksi) {
        this._aksiAktif.delete(aksi);
        this._aksiDilepas.add(aksi);
      }
    });

    // Blur — lepas semua tombol saat jendela kehilangan fokus
    window.addEventListener("blur", () => {
      this._ditekan.clear();
      this._aksiAktif.clear();
    });
  }

  /**
   * Apakah aksi sedang aktif (tombol ditahan)?
   * @param {string} aksi
   * @returns {boolean}
   */
  aktif(aksi) {
    return this._aksiAktif.has(aksi);
  }

  /**
   * Apakah aksi baru saja dimulai frame ini (tap sekali)?
   * @param {string} aksi
   * @returns {boolean}
   */
  baruDitekan(aksi) {
    return this._aksiBaru.has(aksi);
  }

  /**
   * Apakah aksi baru saja dilepas frame ini?
   * @param {string} aksi
   * @returns {boolean}
   */
  baruDilepas(aksi) {
    return this._aksiDilepas.has(aksi);
  }

  /**
   * Harus dipanggil DI AKHIR setiap frame game loop.
   * Membersihkan state "baru ditekan/dilepas" untuk frame berikutnya.
   */
  akhirFrame() {
    this._baruDitekan.clear();
    this._baruDilepas.clear();
    this._aksiBaru.clear();
    this._aksiDilepas.clear();
  }
}
