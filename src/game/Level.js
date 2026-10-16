/**
 * Level.js
 * Memuat dan menyimpan data level aktif.
 * Menyediakan akses ke tile_data, objek, spawn point, dan metadata level.
 * Bertanggung jawab men-toggle tile spike berdasarkan timer trigger.
 */

import { KONFIG } from "../engine/config.js";

export class Level {
  constructor() {
    this._data    = null;  // data JSON level mentah
    this._tileMap = null;  // referensi ke TilemapRenderer
    /** @type {Array<{id:string, data:number[]}>} layer tiles */
    this.layers   = [];
    /** @type {number[]} data tile layer utama (flat array) */
    this.tileData = [];
    /** @type {number} */
    this.lebarTiles  = 0;
    /** @type {number} */
    this.tinggiTiles = 0;
    /** @type {Array} objek level (enemy, item, prop, trigger) */
    this.objek = [];
    /** @type {{tile_x:number, tile_y:number}} */
    this.spawnPlayer = { tile_x: 2, tile_y: 15 };
    /** @type {Array<{id:string, tile_x:number, tile_y:number}>} */
    this.checkpoints = [];

    // State trigger spike — Map id → {aktif, timer, intervalMs, durasiMs}
    this._spikeTriggers = new Map();
  }

  /**
   * Inisialisasi dari data JSON level.
   * @param {object} levelJson  - Data dari levels/level_XX.json
   * @param {import("../engine/TilemapRenderer.js").TilemapRenderer} tileMapper
   */
  inisialisasi(levelJson, tileMapper) {
    this._data   = levelJson;
    this._tileMap = tileMapper;

    const dim = levelJson.dimensi ?? {};
    this.lebarTiles  = dim.lebar_tiles  ?? 200;
    this.tinggiTiles = dim.tinggi_tiles ?? 20;

    // Ambil layer tile utama
    this.layers  = structuredClone(levelJson.layer_tile ?? []);
    const mainLayer = this.layers.find(l => l.id === "layer_main");
    this.tileData   = mainLayer?.data ?? [];

    if (this.tileData.length === 0) {
      console.warn("[Level] tile_data kosong — level tidak akan ter-render");
    }

    // Spawn & checkpoint
    this.spawnPlayer = levelJson.spawn?.player ?? { tile_x: 2, tile_y: 15 };
    this.checkpoints = levelJson.spawn?.checkpoint ?? [];

    // Objek
    this.objek = levelJson.objek ?? [];

    // Inisialisasi trigger spike
    this._spikeTriggers.clear();
    for (const obj of this.objek) {
      if (obj.tipe === "trigger_spike") {
        this._spikeTriggers.set(obj.id, {
          obj,
          aktif:        false,
          timer:        0,
          intervalMs:   obj.interval_aktif_ms ?? 1500,
          durasiMs:     obj.durasi_aktif_ms   ?? 1000,
        });
      }
    }
  }

  /**
   * Update timer spike trigger setiap frame.
   * @param {number} dt - Delta time dalam detik
   */
  update(dt) {
    const dtMs = dt * 1000;

    for (const [id, state] of this._spikeTriggers) {
      state.timer += dtMs;
      const { obj } = state;

      if (!state.aktif) {
        // Menunggu interval sebelum aktif
        if (state.timer >= state.intervalMs) {
          state.aktif = true;
          state.timer = 0;
          this._setSpikeArea(obj.tile_x, obj.lebar_tiles ?? 1, true);
        }
      } else {
        // Sudah aktif — tunggu durasi lalu kembali idle
        if (state.timer >= state.durasiMs) {
          state.aktif = false;
          state.timer = 0;
          this._setSpikeArea(obj.tile_x, obj.lebar_tiles ?? 1, false);
        }
      }
    }
  }

  /**
   * Toggle tile spike dalam area menjadi aktif atau idle.
   * @param {number} tileX      - Tile X mulai
   * @param {number} lebarTiles - Jumlah tile spike
   * @param {boolean} aktif
   */
  _setSpikeArea(tileX, lebarTiles, aktif) {
    const tileId = aktif ? 12 : 11; // 12=spike_aktif, 11=spike_idle
    const y      = this.tinggiTiles - 5; // baris spike (lantai - 5)
    for (let i = 0; i < lebarTiles; i++) {
      const idx = y * this.lebarTiles + (tileX + i);
      if (idx >= 0 && idx < this.tileData.length) {
        this.tileData[idx] = tileId;
      }
    }
  }

  /**
   * Apakah spike aktif di posisi tile x,y?
   * @param {number} tileX
   * @param {number} tileY
   * @returns {boolean}
   */
  adalahSpikeAktif(tileX, tileY) {
    if (!this.tileData.length) return false;
    const idx = tileY * this.lebarTiles + tileX;
    return (this.tileData[idx] ?? 0) === 12;
  }

  /**
   * Posisi pixel spawn player.
   * @returns {{x: number, y: number}}
   */
  get spawnPx() {
    return {
      x: this.spawnPlayer.tile_x * KONFIG.UKURAN_TILE,
      y: this.spawnPlayer.tile_y * KONFIG.UKURAN_TILE,
    };
  }

  /**
   * Lebar level dalam pixel.
   * @returns {number}
   */
  get lebarPx()  { return this.lebarTiles  * KONFIG.UKURAN_TILE; }

  /**
   * Tinggi level dalam pixel.
   * @returns {number}
   */
  get tinggiPx() { return this.tinggiTiles * KONFIG.UKURAN_TILE; }

  /**
   * Data JSON level mentah (untuk keperluan lain).
   * @returns {object|null}
   */
  get meta() { return this._data?.meta ?? null; }
}
