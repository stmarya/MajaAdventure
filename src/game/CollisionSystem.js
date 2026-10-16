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
    // Small substeps prevent tunnelling even for fast test/knockback movement.
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(entity.vx), Math.abs(entity.vy)) / 8));
    const dx = entity.vx / steps, dy = entity.vy / steps;
    entity.diTanah = false;
    for (let i = 0; i < steps; i++) {
      if (entity.vx !== 0) {
        entity.x += dx;
        for (const tile of this._overlaps(entity)) {
          if (!tile.prop.solid || tile.prop.one_way) continue;
          if (dx > 0) { entity.x = Math.min(entity.x, tile.x * KONFIG.UKURAN_TILE - entity.lebar); hasil.kananDinding = true; }
          else { entity.x = Math.max(entity.x, (tile.x + 1) * KONFIG.UKURAN_TILE); hasil.kiriDinding = true; }
          entity.vx = 0;
        }
      }
      const oldBottom = entity.y + entity.tinggi;
      if (entity.vy !== 0) {
        entity.y += dy;
        for (const tile of this._overlaps(entity)) {
          if (!tile.prop.solid) continue;
          if (tile.prop.one_way && (oneWayPassthrough || dy <= 0 || oldBottom > tile.y * KONFIG.UKURAN_TILE + 0.01)) continue;
          if (dy > 0) { entity.y = Math.min(entity.y, tile.y * KONFIG.UKURAN_TILE - entity.tinggi); entity.diTanah = true; }
          else { entity.y = Math.max(entity.y, (tile.y + 1) * KONFIG.UKURAN_TILE); hasil.atap = true; }
          entity.vy = 0;
        }
      }
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

  *_overlaps(entity) {
    const size = KONFIG.UKURAN_TILE;
    const left = Math.floor(entity.x / size), right = Math.floor((entity.x + entity.lebar - 0.001) / size);
    const top = Math.floor(entity.y / size), bottom = Math.floor((entity.y + entity.tinggi - 0.001) / size);
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      let prop;
      if (x < 0 || x >= this._level.lebarTiles || y < 0) prop = { solid: true };
      else if (y >= this._level.tinggiTiles) prop = { solid: false };
      else prop = this._tileMapper.dapatPropertiTile(this._level.tileData[y * this._level.lebarTiles + x] ?? 0);
      yield { x, y, prop };
    }
  }
}
