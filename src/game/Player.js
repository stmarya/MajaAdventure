/**
 * Player.js
 * Entitas karakter utama yang dapat dikontrol pemain.
 * Mengelola: fisika, input, animasi, damage, invincibility frames, dan state machine.
 *
 * State mesin:
 *   idle → run → jump → fall → attack → hurt → dead
 */

import { KONFIG }              from "../engine/config.js";
import { AnimationController } from "../engine/AnimationController.js";

// Hitbox karakter (lebih kecil dari frame untuk feel yang lebih baik)
const HITBOX_LEBAR  = 20;
const HITBOX_TINGGI = 40;
// Offset hitbox dari pojok kiri atas frame sprite
const HITBOX_OFS_X  = (KONFIG.FRAME_LEBAR  - HITBOX_LEBAR)  / 2;
const HITBOX_OFS_Y  = KONFIG.FRAME_TINGGI  - HITBOX_TINGGI;

// Durasi invincibility frames setelah terkena damage (ms)
const IFRAME_DURASI_MS = 1000;
// Berapa kali sprite berkedip per detik saat iframe
const KEDIP_PER_DETIK  = 10;

export class Player {
  /**
   * @param {object} animConfig  - animation_config.json["warrior"]
   */
  constructor(animConfig) {
    // ── Posisi & Fisika ──────────────────────────────────────────────────────
    this.x  = 0;
    this.y  = 0;
    this.vx = 0;
    this.vy = 0;

    // ── Hitbox (world space, relatif ke x/y) ─────────────────────────────────
    this.lebar  = HITBOX_LEBAR;
    this.tinggi = HITBOX_TINGGI;

    // ── State ────────────────────────────────────────────────────────────────
    this.diTanah      = false;
    this.diTangga     = false;
    this.menghadapKanan = false;
    this._sedangSerang  = false;
    this._iframeSisa    = 0;   // ms tersisa invincibility frames
    this._iframeTimer   = 0;   // akumulator untuk kedip
    this._mati          = false;

    // ── Stats ────────────────────────────────────────────────────────────────
    this.hp     = 3;
    this.hpMaks = 3;
    this.koin   = 0;

    // ── Animasi ──────────────────────────────────────────────────────────────
    this.animCtrl = animConfig ? new AnimationController(animConfig) : null;
  }

  // ── Getter posisi hitbox (world space) ────────────────────────────────────

  get hitboxX()      { return this.x + HITBOX_OFS_X; }
  get hitboxY()      { return this.y + HITBOX_OFS_Y; }
  get hitboxKanan()  { return this.hitboxX + this.lebar; }
  get hitboxBawah()  { return this.hitboxY + this.tinggi; }
  get pusat()        { return { x: this.x + KONFIG.FRAME_LEBAR / 2, y: this.y + KONFIG.FRAME_TINGGI / 2 }; }
  get mati()         { return this._mati; }
  get diInvincible() { return this._iframeSisa > 0; }

  // ─── Update ────────────────────────────────────────────────────────────────

  /**
   * Update player satu frame.
   * @param {number} dt              - Delta time (detik)
   * @param {import("../engine/InputManager.js").InputManager} input
   * @param {import("../game/CollisionSystem.js").CollisionSystem} collision
   * @param {import("../engine/AudioManager.js").AudioManager} audio
   */
  update(dt, input, collision, audio) {
    if (this._mati) { this.animCtrl?.update(dt); return; }
    this._dropThrough = Math.max(0, (this._dropThrough ?? 0) - dt);

    this._updateIframes(dt);
    this._updateInput(dt, input, audio);
    this._terapkanFisika(dt, collision);
    this._updateAnimasi();
    this.animCtrl?.update(dt);
  }

  // ─── Damage & Mati ─────────────────────────────────────────────────────────

  /**
   * Terima damage. Diabaikan saat masih di iframe.
   * @param {number} jumlah
   * @param {import("../engine/AudioManager.js").AudioManager} audio
   */
  terimaKerusakan(jumlah, audio) {
    if (this.diInvincible || this._mati) return;
    this.hp -= jumlah;
    if (this.hp <= 0) {
      this.hp = 0;
      this._mati = true;
      this.animCtrl?.mainkan("death", true);
      // sfx_gameover diputar oleh main.js saat transisi state, tidak di sini
      // agar tidak double-play
    } else {
      this._iframeSisa = IFRAME_DURASI_MS;
      this.animCtrl?.mainkan("hurt", true);
      audio?.putarSFX("sfx_damage_hit");
    }
    this.vx = 0;
  }

  /**
   * Reset player ke posisi spawn (respawn).
   * @param {number} spawnX - pixel X
   * @param {number} spawnY - pixel Y
   */
  respawn(spawnX, spawnY) {
    this.x  = spawnX;
    this.y  = spawnY;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.hpMaks;
    this.diTanah = false;
    this.diTangga = false;
    this._dropThrough = 0;
    this._sedangSerang = false;
    this._iframeTimer = 0;
    this._mati   = false;
    this._iframeSisa = 0;
    this.animCtrl?.mainkan("idle", true);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  /**
   * Render player ke layar.
   * @param {import("../engine/Renderer.js").Renderer} renderer
   * @param {import("../engine/Camera.js").Camera} camera
   * @param {import("../engine/AssetLoader.js").AssetLoader} loader
   * @param {boolean} [debug=false]
   */
  render(renderer, camera, loader, debug = false) {
    // Saat iframe, kedipkan sprite
    if (this.diInvincible) {
      const ticks = Math.floor(this._iframeTimer * KEDIP_PER_DETIK);
      if (ticks % 2 === 1) return; // lewati frame ganjil → efek kedip
    }

    const pos   = camera.worldKeLayar(this.x, this.y);
    const sheet = loader.ambilGambar("chr_warrior_sheet");

    if (sheet && this.animCtrl) {
      renderer.renderSprite(
        sheet,
        this.animCtrl.frameAbsolut,
        KONFIG.FRAME_LEBAR,
        KONFIG.FRAME_TINGGI,
        pos.x, pos.y,
        this.menghadapKanan
      );
    } else {
      // Placeholder kotak saat sprite belum ada
      renderer.renderKotak(pos.x, pos.y, KONFIG.FRAME_LEBAR, KONFIG.FRAME_TINGGI, KONFIG.WARNA.MERAH_BATA);
    }

    // Debug: tampilkan hitbox
    if (debug) {
      const hb = camera.worldKeLayar(this.hitboxX, this.hitboxY);
      renderer.renderOutlineKotak(hb.x, hb.y, this.lebar, this.tinggi, "#00FF00");
    }
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  _updateIframes(dt) {
    if (this._iframeSisa > 0) {
      const dtMs = dt * 1000;
      this._iframeSisa   -= dtMs;
      this._iframeTimer  += dt;
      if (this._iframeSisa <= 0) {
        this._iframeSisa  = 0;
        this._iframeTimer = 0;
      }
    }
  }

  _updateInput(dt, input, audio) {
    // Jangan terima input saat animasi hurt/death belum selesai
    const animAktif = this.animCtrl?.animasiAktif;
    if (animAktif === "death") return;
    if (animAktif === "hurt" && !this.animCtrl?.sudahSelesai) return;

    // ── Serangan ──────────────────────────────────────────────────────────────
    if (input.baruDitekan("serang") && animAktif !== "attack") {
      this.animCtrl?.mainkan("attack", true);
      audio?.putarSFX("sfx_attack_keris");
      this.vx *= 0.3; // perlambat sedikit saat menyerang
      this._sedangSerang = true;
    }

    // Tandai tidak sedang menyerang jika animasi attack selesai
    if (animAktif === "attack" && this.animCtrl?.sudahSelesai) {
      this._sedangSerang = false;
    }

    // Blokir gerak/lompat saat animasi attack
    if (animAktif === "attack" && !this.animCtrl?.sudahSelesai) return;

    // ── Gerak horizontal ─────────────────────────────────────────────────────
    if (input.aktif("kiri")) {
      this.vx = -KONFIG.KECEPATAN_LARI;
      this.menghadapKanan = false;
    } else if (input.aktif("kanan")) {
      this.vx = KONFIG.KECEPATAN_LARI;
      this.menghadapKanan = true;
    } else {
      this.vx *= KONFIG.FRICTION;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // ── Tangga ───────────────────────────────────────────────────────────────
    if (this.diTangga) {
      if (input.aktif("kiri") || input.aktif("kanan")) {
        // Gerak horizontal = keluar tangga
        this.diTangga = false;
      } else if (input.baruDitekan("lompat")) {
        // Tekan lompat sekali = lompat keluar tangga
        this.vy = KONFIG.KECEPATAN_LOMPAT;
        this.diTangga = false;
      } else if (input.aktif("lompat")) {
        // Tahan lompat/atas = naik tangga
        this.vy = -KONFIG.KECEPATAN_JALAN;
      } else if (input.aktif("jongkok")) {
        // Tahan jongkok/bawah = turun tangga
        this.vy = KONFIG.KECEPATAN_JALAN;
      } else {
        this.vy = 0; // diam di tangga
      }
      return; // skip fisika normal saat di tangga
    }

    // ── Lompat ───────────────────────────────────────────────────────────────
    if (input.baruDitekan("lompat") && this.diTanah) {
      if (input.aktif("jongkok")) {
        // Turun dari one-way platform: jongkok + lompat
        this._dropThrough = 0.2;
        this.vy  = 2;
        this.diTanah = false;
      } else {
        // Lompat normal
        this.vy    = KONFIG.KECEPATAN_LOMPAT;
        this.diTanah = false;
        audio?.putarSFX("sfx_jump");
      }
    }
  }

  _terapkanFisika(dt, collision) {
    // Tangga: nonaktifkan gravitasi
    if (this.diTangga) {
      const hb = { x: this.hitboxX, y: this.hitboxY, lebar: this.lebar, tinggi: this.tinggi, vx: 0, vy: this.vy, diTanah: false };
      // Gerak Y saja, tidak ada resolusi X saat di tangga
      hb.y += hb.vy;
      this.y = hb.y - HITBOX_OFS_Y;
      return;
    }

    // Gravitasi
    this.vy += KONFIG.GRAVITASI;
    if (this.vy > KONFIG.KECEPATAN_MAX_Y) this.vy = KONFIG.KECEPATAN_MAX_Y;

    // Bungkus dalam objek hitbox untuk CollisionSystem
    const hb = {
      x:      this.hitboxX,
      y:      this.hitboxY,
      lebar:  this.lebar,
      tinggi: this.tinggi,
      vx:     this.vx,
      vy:     this.vy,
      diTanah: this.diTanah,
    };

    collision.gerakkan(hb, this._dropThrough > 0);

    // Sinkronisasi kembali posisi dari hitbox yang sudah dikoreksi
    this.x       = hb.x - HITBOX_OFS_X;
    this.y       = hb.y - HITBOX_OFS_Y;
    this.vx      = hb.vx;
    this.vy      = hb.vy;
    this.diTanah = hb.diTanah;

    // Cek tangga
    this.diTangga = collision.diTangga({
      x: this.hitboxX, y: this.hitboxY,
      lebar: this.lebar, tinggi: this.tinggi
    });

    // Batas kiri level
    const batasKiri = -HITBOX_OFS_X;
    if (this.x < batasKiri) { this.x = batasKiri; this.vx = 0; }
  }

  _updateAnimasi() {
    const ctrl = this.animCtrl;
    if (!ctrl) return;
    const animAktif = ctrl.animasiAktif;

    // Animasi terminal: jangan override
    if (animAktif === "death") return;
    if (animAktif === "hurt"   && !ctrl.sudahSelesai) return;
    if (animAktif === "attack" && !ctrl.sudahSelesai) return;

    if (this._mati) {
      ctrl.mainkan("death");
      return;
    }

    if (!this.diTanah) {
      // Biarkan sekuens jump_ascent→jump_peak→jump_descent mengalir via AnimationController.next
      // Hanya ganti ke jump_ascent jika belum dalam sekuens lompatan sama sekali
      const sedangLompat = animAktif === "jump_ascent"  ||
                           animAktif === "jump_peak"    ||
                           animAktif === "jump_descent" ||
                           animAktif === "land";
      if (!sedangLompat) {
        // Mulai sekuens lompatan dari awal
        ctrl.mainkan(this.vy < 0 ? "jump_ascent" : "jump_descent");
      }
      // Jika vy sudah positif (turun) tapi masih di animasi ascent/peak, biarkan `next` mengalir
    } else if (this.diTangga) {
      ctrl.mainkan("idle");
    } else if (Math.abs(this.vx) > 0.5) {
      ctrl.mainkan("run");
    } else {
      ctrl.mainkan("idle");
    }
  }
}
