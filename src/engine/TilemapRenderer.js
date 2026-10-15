/**
 * TilemapRenderer.js
 * Merender layer tile dari data level JSON menggunakan tileset yang sudah dimuat.
 */

import { KONFIG } from "./config.js";

export class TilemapRenderer {
  /**
   * @param {Renderer} renderer        - Instance Renderer
   * @param {HTMLImageElement} tileset - Gambar tileset
   * @param {number} kolomTileset      - Jumlah kolom di tileset
   * @param {object} tileProperties    - Map tileId → properti (dari tileset_config.json)
   */
  constructor(renderer, tileset, kolomTileset, tileProperties) {
    this.renderer       = renderer;
    this.tileset        = tileset;
    this.kolomTileset   = kolomTileset;
    this.tileProperties = tileProperties;
  }

  /**
   * Render satu layer tile dengan view culling (hanya render tile yang terlihat).
   * @param {number[]} data        - Array flat tile data (0 = kosong)
   * @param {number} lebarTiles    - Jumlah tile horizontal level
   * @param {number} tinggiTiles   - Jumlah tile vertikal level
   * @param {number} kameraX       - Posisi kamera X dalam pixel
   * @param {number} kameraY       - Posisi kamera Y dalam pixel
   */
  renderLayer(data, lebarTiles, tinggiTiles, kameraX, kameraY) {
    const ukuran = KONFIG.UKURAN_TILE;

    // Hitung range tile yang terlihat di viewport
    const tileXMulai = Math.max(0, Math.floor(kameraX / ukuran));
    const tileYMulai = Math.max(0, Math.floor(kameraY / ukuran));
    const tileXAkhir = Math.min(lebarTiles  - 1, Math.ceil((kameraX + KONFIG.CANVAS_LEBAR)  / ukuran));
    const tileYAkhir = Math.min(tinggiTiles - 1, Math.ceil((kameraY + KONFIG.CANVAS_TINGGI) / ukuran));

    for (let tileY = tileYMulai; tileY <= tileYAkhir; tileY++) {
      for (let tileX = tileXMulai; tileX <= tileXAkhir; tileX++) {
        const idx    = tileY * lebarTiles + tileX;
        const tileId = data[idx] ?? 0;
        if (tileId === 0) continue;

        const screenX = Math.round(tileX * ukuran - kameraX);
        const screenY = Math.round(tileY * ukuran - kameraY);

        this.renderer.renderTile(this.tileset, tileId, this.kolomTileset, screenX, screenY);
      }
    }
  }

  /**
   * Render background parallax layer.
   * @param {HTMLImageElement} bgImage  - Gambar background
   * @param {number} kameraX            - Posisi kamera X
   * @param {number} parallaxX          - Koefisien parallax (0.0–1.0)
   * @param {number} [offsetY=0]        - Offset Y tetap background
   */
  renderBackground(bgImage, kameraX, parallaxX, offsetY = 0) {
    if (!bgImage) return;
    const bgLebar = Math.max(1, bgImage.width); // guard pembagian nol

    const scrollX = kameraX * parallaxX;

    // Modulo positif: ((scrollX % bgLebar) + bgLebar) % bgLebar
    // Mencegah nilai negatif yang menghasilkan gap di sisi kiri layar
    const offsetScroll = ((scrollX % bgLebar) + bgLebar) % bgLebar;
    const mulaiX       = -offsetScroll;
    const jumlahTile   = Math.ceil(KONFIG.CANVAS_LEBAR / bgLebar) + 2;

    for (let i = 0; i < jumlahTile; i++) {
      this.renderer.ctx.drawImage(bgImage, Math.round(mulaiX + i * bgLebar), offsetY);
    }
  }

  /**
   * Dapatkan properti tile berdasarkan ID.
   * @param {number} tileId
   * @returns {object}
   */
  dapatPropertiTile(tileId) {
    return this.tileProperties[tileId] ?? { solid: false };
  }

  /**
   * Apakah tile di koordinat tile x,y solid?
   * @param {number[]} data
   * @param {number} lebarTiles
   * @param {number} tileX
   * @param {number} tileY
   * @returns {boolean}
   */
  adalahSolid(data, lebarTiles, tileX, tileY) {
    if (tileX < 0 || tileY < 0) return true; // batas kiri/atas = solid
    const idx    = tileY * lebarTiles + tileX;
    const tileId = data[idx] ?? 0;
    if (tileId === 0) return false;
    return this.tileProperties[tileId]?.solid ?? false;
  }

  /**
   * Apakah tile di koordinat tile x,y bisa dipanjat?
   * @param {number[]} data
   * @param {number} lebarTiles
   * @param {number} tileX
   * @param {number} tileY
   * @returns {boolean}
   */
  bisaDipanjat(data, lebarTiles, tileX, tileY) {
    const idx    = tileY * lebarTiles + tileX;
    const tileId = data[idx] ?? 0;
    return this.tileProperties[tileId]?.climbable ?? false;
  }

  /**
   * Apakah tile di koordinat tile x,y adalah hazard aktif?
   * @param {number[]} data
   * @param {number} lebarTiles
   * @param {number} tileX
   * @param {number} tileY
   * @returns {boolean}
   */
  adalahHazardAktif(data, lebarTiles, tileX, tileY) {
    const idx    = tileY * lebarTiles + tileX;
    const tileId = data[idx] ?? 0;
    const prop   = this.tileProperties[tileId];
    return (prop?.hazard && prop?.hazard_aktif) ?? false;
  }
}
