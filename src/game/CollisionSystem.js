/**
 * CollisionSystem.js
 * Sistem deteksi dan resolusi tabrakan AABB berbasis tile.
 *
 * Pendekatan:
 *  - Entity diwakili oleh hitbox (x, y, lebar, tinggi) dalam world space
 *  - Resolusi dilakukan sumbu per sumbu (X dulu, lalu Y) agar sudut mulus
 *  - Support: solid tile, one-way platform (lompat dari bawah), climbable ladder
 *
 * Semua koordinat dalam PIXEL (world space). Konversi ke tile dilakukan internal.
 */

import { KONFIG } from "../engine/config.js";

export class CollisionSystem {
  /**
   * @param {import("../game/Level.js").Level} level
   * @param {import("../engine/TilemapRenderer.js").TilemapRenderer} tileMapper
   */
  constructor(level, tileMapper) {
    this._level     = level;
    this._tileMapper = tileMapper;
  }

  // ─── API Publik ────────────────────────────────────────────────────────────

  /**
   * Pindahkan entity dengan resolusi tabrakan penuh.
   * Mengubah state entity secara in-place (x, y, vx, vy, diTanah).
   *
   * @param {object} entity - { x, y, lebar, tinggi, vx, vy, diTanah, diTangga }
   * @param {boolean} [oneWayPassthrough=false] - true = abaikan one_way platform (saat turun)
   * @returns {{kiriDinding:boolean, kananDinding:boolean, atap:boolean}}
   */
  gerakkan(entity, oneWayPassthrough = false) {
    const hasil = { kiriDinding: false, kananDinding: false, atap: false };

    // ── Sumbu X ──────────────────────────────────────────────────────────────
    entity.x += entity.vx;
    const colX = this._cekTumbukan(entity, oneWayPassthrough);

    if (colX.kiri) {
      entity.x  = colX.kiri * KONFIG.UKURAN_TILE;
      entity.vx = 0;
      hasil.kiriDinding = true;
    } else if (colX.kanan) {
      entity.x  = (colX.kanan - 1) * KONFIG.UKURAN_TILE - entity.lebar;
      entity.vx = 0;
      hasil.kananDinding = true;
    }

    // ── Sumbu Y ──────────────────────────────────────────────────────────────
    const sebelumnyaDiTanah = entity.diTanah;
    entity.diTanah = false;
    entity.y += entity.vy;
    const colY = this._cekTumbukan(entity, oneWayPassthrough);

    if (colY.atas) {
      entity.y  = (colY.atas + 1) * KONFIG.UKURAN_TILE;
      entity.vy = 0;
      hasil.atap = true;
    } else if (colY.bawah) {
      entity.y      = (colY.bawah - 1) * KONFIG.UKURAN_TILE - entity.tinggi;
      entity.vy     = 0;
      entity.diTanah = true;
    }

    return hasil;
  }

  /**
   * Cek apakah entiti sedang berada di atas tile climbable (tangga).
   * @param {object} entity - { x, y, lebar, tinggi }
   * @returns {boolean}
   */
  diAtas(entity) {
    const tileX = Math.floor((entity.x + entity.lebar / 2) / KONFIG.UKURAN_TILE);
    const tileY = Math.floor((entity.y + entity.tinggi)    / KONFIG.UKURAN_TILE);
    return this._tileMapper.bisaDipanjat(
      this._level.tileData, this._level.lebarTiles, tileX, tileY
    );
  }

  /**
   * Cek apakah entiti sedang bertumpang tindih dengan tile climbable.
   * @param {object} entity - { x, y, lebar, tinggi }
   * @returns {boolean}
   */
  diTangga(entity) {
    const tileX = Math.floor((entity.x + entity.lebar / 2) / KONFIG.UKURAN_TILE);
    const tileY = Math.floor((entity.y + entity.tinggi / 2) / KONFIG.UKURAN_TILE);
    return this._tileMapper.bisaDipanjat(
      this._level.tileData, this._level.lebarTiles, tileX, tileY
    );
  }

  /**
   * Apakah hitbox entity bertumpang tindih dengan spike yang aktif?
   * @param {object} entity - { x, y, lebar, tinggi }
   * @returns {boolean}
   */
  kenaSpike(entity) {
    // Periksa sudut-sudut bawah hitbox
    const y = entity.y + entity.tinggi;
    for (const xOfs of [2, entity.lebar - 2]) {
      const tileX = Math.floor((entity.x + xOfs) / KONFIG.UKURAN_TILE);
      const tileY = Math.floor(y              / KONFIG.UKURAN_TILE);
      if (this._level.adalahSpikeAktif(tileX, tileY)) return true;
    }
    return false;
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  /**
   * Periksa tumbukan entity (setelah posisi diubah).
   * Mengembalikan tile index yang menyebabkan tumbukan, atau null.
   *
   * @param {object} entity
   * @param {boolean} oneWayPassthrough
   * @returns {{kiri:number|null, kanan:number|null, atas:number|null, bawah:number|null}}
   */
  _cekTumbukan(entity, oneWayPassthrough) {
    const hasil = { kiri: null, kanan: null, atas: null, bawah: null };
    const ukuran = KONFIG.UKURAN_TILE;
    const data   = this._level.tileData;
    const lebar  = this._level.lebarTiles;

    // Batas tile yang dicakup hitbox
    const tileX0 = Math.floor(entity.x             / ukuran);
    const tileX1 = Math.floor((entity.x + entity.lebar  - 1) / ukuran);
    const tileY0 = Math.floor(entity.y             / ukuran);
    const tileY1 = Math.floor((entity.y + entity.tinggi - 1) / ukuran);

    // ── Kiri ────────────────────────────────────────────────────────────────
    for (let ty = tileY0; ty <= tileY1; ty++) {
      if (this._adalahSolidUntuk(data, lebar, tileX0, ty, oneWayPassthrough, entity, ty === tileY1)) {
        hasil.kiri = tileX0 + 1;
        break;
      }
    }

    // ── Kanan ───────────────────────────────────────────────────────────────
    for (let ty = tileY0; ty <= tileY1; ty++) {
      if (this._adalahSolidUntuk(data, lebar, tileX1, ty, oneWayPassthrough, entity, ty === tileY1)) {
        hasil.kanan = tileX1;
        break;
      }
    }

    // ── Atas ────────────────────────────────────────────────────────────────
    for (let tx = tileX0; tx <= tileX1; tx++) {
      if (this._adalahSolidUntuk(data, lebar, tx, tileY0, oneWayPassthrough, entity, false)) {
        hasil.atas = tileY0;
        break;
      }
    }

    // ── Bawah ───────────────────────────────────────────────────────────────
    for (let tx = tileX0; tx <= tileX1; tx++) {
      if (this._adalahSolidUntuk(data, lebar, tx, tileY1, oneWayPassthrough, entity, true)) {
        hasil.bawah = tileY1;
        break;
      }
    }

    return hasil;
  }

  /**
   * Apakah tile di (tileX, tileY) solid untuk entity ini?
   * Memperhitungkan one_way platform dan mode passthrough.
   *
   * @param {number[]} data
   * @param {number} lebarTiles
   * @param {number} tileX
   * @param {number} tileY
   * @param {boolean} oneWayPassthrough
   * @param {object} entity
   * @param {boolean} adalahBawah - true jika sedang memeriksa sisi bawah entity
   * @returns {boolean}
   */
  _adalahSolidUntuk(data, lebarTiles, tileX, tileY, oneWayPassthrough, entity, adalahBawah) {
    if (tileX < 0 || tileY < 0) return true; // batas luar level = solid
    if (tileX >= lebarTiles || tileY >= this._level.tinggiTiles) return false;

    const idx    = tileY * lebarTiles + tileX;
    const tileId = data[idx] ?? 0;
    if (tileId === 0) return false;

    const prop = this._tileMapper.dapatPropertiTile(tileId);
    if (!prop.solid) return false;

    // One-way platform: hanya solid dari atas
    if (prop.one_way) {
      if (oneWayPassthrough) return false;
      if (!adalahBawah)      return false; // tidak menghalangi dari sisi lain
      // Solid hanya jika kaki entity di atas tepi platform
      const platformTopPx = tileY * KONFIG.UKURAN_TILE;
      return (entity.y + entity.tinggi - entity.vy) <= platformTopPx + 2;
    }

    return true;
  }
}
