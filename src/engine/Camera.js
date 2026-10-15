/**
 * Camera.js
 * Kamera 2D dengan smoothing dan dead zone.
 * Mengikuti target (player) dengan interpolasi smooth.
 */

import { KONFIG } from "./config.js";

export class Camera {
  /**
   * @param {number} lebarLevel  - Lebar level dalam pixel
   * @param {number} tinggiLevel - Tinggi level dalam pixel
   */
  constructor(lebarLevel, tinggiLevel) {
    this.x = 0;          // posisi kamera (pojok kiri atas) dalam world space
    this.y = 0;

    this._lebarLevel  = lebarLevel;
    this._tinggiLevel = tinggiLevel;

    this._smoothing  = 0.1;   // koefisien interpolasi (0–1). Lebih besar = lebih responsif
    this._deadZoneX  = 80;    // pixel dari tengah layar sebelum kamera mulai bergerak (horizontal)
    this._deadZoneY  = 40;    // pixel dari tengah layar (vertikal)
  }

  /**
   * Konfigurasi kamera dari data level.
   * @param {object} kameraData  - Objek kamera dari level JSON
   */
  konfigurasidariLevel(kameraData) {
    this._smoothing = kameraData.smoothing   ?? this._smoothing;
    this._deadZoneX = kameraData.dead_zone_x ?? this._deadZoneX;
    this._deadZoneY = kameraData.dead_zone_y ?? this._deadZoneY;
  }

  /**
   * Update posisi kamera mengikuti target.
   * @param {number} targetX  - Posisi X pusat target (world space)
   * @param {number} targetY  - Posisi Y pusat target (world space)
   */
  update(targetX, targetY) {
    const cx = KONFIG.CANVAS_LEBAR  / 2;
    const cy = KONFIG.CANVAS_TINGGI / 2;

    // Posisi ideal kamera (target di tengah layar)
    const idealX = targetX - cx;
    const idealY = targetY - cy;

    // Terapkan dead zone: kamera tidak bergerak selama target masih dalam zona
    const deltaX = idealX - this.x;
    const deltaY = idealY - this.y;

    if (Math.abs(deltaX) > this._deadZoneX) {
      const arah = deltaX > 0 ? 1 : -1;
      this.x += (Math.abs(deltaX) - this._deadZoneX) * this._smoothing * arah;
    }

    if (Math.abs(deltaY) > this._deadZoneY) {
      const arah = deltaY > 0 ? 1 : -1;
      this.y += (Math.abs(deltaY) - this._deadZoneY) * this._smoothing * arah;
    }

    // Clamp kamera agar tidak keluar batas level
    this.x = Math.max(0, Math.min(this.x, this._lebarLevel  - KONFIG.CANVAS_LEBAR));
    this.y = Math.max(0, Math.min(this.y, this._tinggiLevel - KONFIG.CANVAS_TINGGI));

    // Bulatkan ke integer agar tidak ada sub-pixel blur
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
  }

  /**
   * Pindahkan kamera langsung ke posisi (tanpa smoothing).
   * Digunakan saat pindah level atau respawn.
   * @param {number} x
   * @param {number} y
   */
  teleport(x, y) {
    // Bulatkan ke integer sama seperti update() agar tidak ada sub-pixel
    this.x = Math.round(Math.max(0, Math.min(x, this._lebarLevel  - KONFIG.CANVAS_LEBAR)));
    this.y = Math.round(Math.max(0, Math.min(y, this._tinggiLevel - KONFIG.CANVAS_TINGGI)));
  }

  /**
   * Konversi koordinat world ke koordinat layar.
   * @param {number} worldX
   * @param {number} worldY
   * @returns {{x: number, y: number}}
   */
  worldKeLayar(worldX, worldY) {
    return {
      x: Math.round(worldX - this.x),
      y: Math.round(worldY - this.y),
    };
  }
}
