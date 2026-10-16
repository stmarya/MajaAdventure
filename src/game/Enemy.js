/**
 * Enemy.js
 * Kelas dasar dan implementasi konkret musuh.
 *
 * Hierarki:
 *   Enemy (base)
 *   ├── EnemySoldier  — patroli + tusukan tombak
 *   └── EnemyMonkey   — patroli + lompat menyerang
 *
 * Setiap musuh punya state machine sederhana:
 *   idle → patrol → chase → attack → stagger → dead
 */

import { KONFIG }              from "../engine/config.js";
import { AnimationController } from "../engine/AnimationController.js";

// Hitbox musuh
const HB = {
  soldier: { lebar: 24, tinggi: 44, ofsX: 12, ofsY: 8 },
  monkey:  { lebar: 20, tinggi: 28, ofsX:  6, ofsY: 4 },
};

// ─── Kelas Dasar Enemy ────────────────────────────────────────────────────────

export class Enemy {
  /**
   * @param {object} objData    - Entri objek dari level JSON
   * @param {object} animConfig - animation_config.json entri untuk sprite ini
   * @param {object} hb         - { lebar, tinggi, ofsX, ofsY }
   */
  constructor(objData, animConfig, hb) {
    this.id   = objData.id ?? "enemy";
    this.tipe = objData.tipe;

    this.x  = (objData.tile_x ?? 0) * KONFIG.UKURAN_TILE;
    this.y  = (objData.tile_y ?? 0) * KONFIG.UKURAN_TILE;
    this.vx = 0;
    this.vy = 0;

    // Hitbox
    this.lebar  = hb.lebar;
    this.tinggi = hb.tinggi;
    this._ofsX  = hb.ofsX;
    this._ofsY  = hb.ofsY;

    // Stats
    this.hp     = objData.hp     ?? 2;
    this.damage = objData.damage ?? 1;

    // Patroli
    this._patrolKiri  = (objData.patrol_kiri  ?? objData.tile_x - 4) * KONFIG.UKURAN_TILE;
    this._patrolKanan = (objData.patrol_kanan ?? objData.tile_x + 4) * KONFIG.UKURAN_TILE;
    this._arahKanan   = false;

    // State
    this._state        = "patrol";
    this._serangan     = false;
    this._iframeSisa   = 0;

    // Animasi
    this.animCtrl = animConfig ? new AnimationController(animConfig) : null;
    this.animCtrl?.mainkan("idle");

    // Flag aktif (false = sudah mati & selesai animasi)
    this.aktif = true;
  }

  // ── Getter hitbox ──────────────────────────────────────────────────────────
  get hitboxX()     { return this.x + this._ofsX; }
  get hitboxY()     { return this.y + this._ofsY; }
  get hitboxKanan() { return this.hitboxX + this.lebar; }
  get hitboxBawah() { return this.hitboxY + this.tinggi; }
  get mati()        { return this.hp <= 0; }
  get pusat()       { return { x: this.hitboxX + this.lebar / 2, y: this.hitboxY + this.tinggi / 2 }; }

  // ─── Terkena damage ────────────────────────────────────────────────────────

  /** @param {number} jumlah */
  terimaKerusakan(jumlah) {
    if (this._iframeSisa > 0 || this.mati) return;
    this.hp -= jumlah;
    if (this.hp <= 0) {
      this.hp = 0;
      this._state = "dead";
      this.vx = 0;
      if (this.animCtrl?.punyaAnimasi("death")) this.animCtrl.mainkan("death", true);
      else this.aktif = false; // No authored death pose: remove, never leave an immortal corpse.
    } else {
      this._state = "stagger";
      this._iframeSisa = 400; // ms
      this.animCtrl?.mainkan("stagger", true);
      // Terpental mundur
      this.vx = this._arahKanan ? -2 : 2;
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  /**
   * @param {import("../engine/Renderer.js").Renderer} renderer
   * @param {import("../engine/Camera.js").Camera} camera
   * @param {HTMLImageElement|null} sheet
   * @param {number} frameLebar
   * @param {number} frameTinggi
   * @param {boolean} [debug=false]
   */
  render(renderer, camera, sheet, frameLebar, frameTinggi, debug = false) {
    if (!this.aktif) return;

    const pos = camera.worldKeLayar(this.x, this.y);

    if (sheet && this.animCtrl) {
      renderer.renderSprite(sheet, this.animCtrl.frameAbsolut, frameLebar, frameTinggi,
        pos.x, pos.y, this._arahKanan);
    } else {
      // Placeholder
      renderer.renderKotak(pos.x, pos.y, frameLebar, frameTinggi, KONFIG.WARNA.ABU_BATU);
    }

    if (debug) {
      const hb = camera.worldKeLayar(this.hitboxX, this.hitboxY);
      renderer.renderOutlineKotak(hb.x, hb.y, this.lebar, this.tinggi, KONFIG.WARNA.MERAH_TERAKOTA);
    }
  }

  // ─── Metode yang di-override subkelas ─────────────────────────────────────

  /** @param {number} dt @param {object} playerState @param {CollisionSystem} collision */
  update(dt, playerState, collision) { /* di-override */ }

  // ─── Shared helpers ───────────────────────────────────────────────────────

  _updateIframes(dt) {
    if (this._iframeSisa > 0) {
      this._iframeSisa -= dt * 1000;
      if (this._iframeSisa <= 0) {
        this._iframeSisa = 0;
        if (this._state === "stagger") this._state = "patrol";
      }
    }
  }

  _terapkanGravitasi(dt, collision) {
    this.vy += KONFIG.GRAVITASI;
    if (this.vy > KONFIG.KECEPATAN_MAX_Y) this.vy = KONFIG.KECEPATAN_MAX_Y;

    const hb = {
      x: this.hitboxX, y: this.hitboxY,
      lebar: this.lebar, tinggi: this.tinggi,
      vx: this.vx, vy: this.vy,
      diTanah: false,
    };
    collision.gerakkan(hb);

    this.x       = hb.x - this._ofsX;
    this.y       = hb.y - this._ofsY;
    this.vx      = hb.vx;
    this.vy      = hb.vy;
    this.diTanah = hb.diTanah;
  }

  /** Apakah player dalam jangkauan deteksi? */
  _deteksiPlayer(playerState, jangkauanPx) {
    const dx = Math.abs(playerState.x - this.x);
    const dy = Math.abs(playerState.y - this.y);
    return dx <= jangkauanPx && dy <= 48;
  }

  /** Apakah hitbox musuh bertumpang tindih dengan hitbox player? */
  cekTumbukanPlayer(playerHitboxX, playerHitboxY, playerLebar, playerTinggi) {
    if (this.mati || !this.hitboxSeranganAktif) return false;
    const def = this.animCtrl?.hitbox;
    const box = def ? {
      x: this.x + (this._arahKanan ? def.x : this.frameLebar - def.x - def.lebar),
      y: this.y + def.y, lebar: def.lebar, tinggi: def.tinggi,
    } : { x:this.hitboxX, y:this.hitboxY, lebar:this.lebar, tinggi:this.tinggi };
    return box.x < playerHitboxX + playerLebar && box.x + box.lebar > playerHitboxX &&
      box.y < playerHitboxY + playerTinggi && box.y + box.tinggi > playerHitboxY;
  }
}

// ─── Enemy Soldier ────────────────────────────────────────────────────────────

export class EnemySoldier extends Enemy {
  constructor(objData, animConfig) {
    super(objData, animConfig, HB.soldier);
    this._attackCooldown = 0; // ms
    this._serangan       = false;
  }

  get frameLebar()  { return 48; }
  get frameTinggi() { return 52; }

  update(dt, playerState, collision) {
    if (!this.aktif) return;
    const dtMs = dt * 1000;

    this._updateIframes(dt);
    this.animCtrl?.update(dt);

    // Cek apakah animasi death selesai → nonaktifkan entity
    if (this._state === "dead") {
      if (this.animCtrl?.sudahSelesai) {
        this.aktif = false;
      }
      return;
    }

    if (this._state === "stagger") {
      // Tetap terapkan gravitasi saat stagger agar tidak melayang
      this._terapkanGravitasi(dt, collision);
      return;
    }

    // Kurangi cooldown serangan
    if (this._attackCooldown > 0) {
      this._attackCooldown -= dtMs;
    }

    // Jangkauan deteksi 120px
    const playerDekat = this._deteksiPlayer(playerState, 120);

    if (this._state === "attack") {
      // Tunggu animasi selesai
      if (!this.animCtrl || this.animCtrl.sudahSelesai || this.animCtrl.animasiAktif !== "attack") {
        this._state       = "patrol";
        this._serangan    = false;
        this._attackCooldown = 1200;
      }
      this._terapkanGravitasi(dt, collision);
      return;
    }

    if (playerDekat) {
      const dx = playerState.x - this.x;
      this._arahKanan = dx > 0;

      if (Math.abs(dx) < 40 && this._attackCooldown <= 0) {
        // Serang jika sudah dekat
        this._state    = "attack";
        this._serangan = true;
        this.vx = 0;
        this.animCtrl?.mainkan("attack", true);
      } else {
        // Mendekati player
        this._state = "chase";
        this.vx = this._arahKanan ? KONFIG.KECEPATAN_JALAN : -KONFIG.KECEPATAN_JALAN;
        this.animCtrl?.mainkan("idle");
      }
    } else {
      // Patroli
      this._state = "patrol";
      if (this.x <= this._patrolKiri) {
        this._arahKanan = true;
      } else if (this.x >= this._patrolKanan) {
        this._arahKanan = false;
      }
      this.vx = this._arahKanan ? KONFIG.KECEPATAN_JALAN : -KONFIG.KECEPATAN_JALAN;
      this.animCtrl?.mainkan("idle");
    }

    this._terapkanGravitasi(dt, collision);
  }

  /** Apakah hitbox serangan aktif saat ini? */
  get hitboxSeranganAktif() {
    return this._state === "attack" && (this.animCtrl?.hitboxAktif ?? false);
  }
}

// ─── Enemy Monkey ─────────────────────────────────────────────────────────────

export class EnemyMonkey extends Enemy {
  constructor(objData, animConfig) {
    super(objData, animConfig, HB.monkey);
    this._lompatCooldown = 0;
  }

  get frameLebar()  { return 32; }
  get frameTinggi() { return 32; }

  update(dt, playerState, collision) {
    if (!this.aktif) return;
    const dtMs = dt * 1000;

    this._updateIframes(dt);
    this.animCtrl?.update(dt);

    if (this._state === "dead") {
      if (this.animCtrl?.sudahSelesai) this.aktif = false;
      return;
    }
    if (this._state === "stagger") {
      // Tetap terapkan gravitasi saat stagger agar tidak melayang
      this._terapkanGravitasi(dt, collision);
      return;
    }

    if (this._lompatCooldown > 0) this._lompatCooldown -= dtMs;

    const playerDekat = this._deteksiPlayer(playerState, 96);

    if (playerDekat && this.diTanah && this._lompatCooldown <= 0) {
      // Lompat ke arah player
      const dx = playerState.x - this.x;
      this._arahKanan  = dx > 0;
      this.vy          = KONFIG.KECEPATAN_LOMPAT * 0.8;
      this.vx          = this._arahKanan ? KONFIG.KECEPATAN_LARI : -KONFIG.KECEPATAN_LARI;
      this._lompatCooldown = 1800;
      this.animCtrl?.mainkan("jump", true);
    } else {
      // Patroli biasa
      if (this.x <= this._patrolKiri) {
        this._arahKanan = true;
      } else if (this.x >= this._patrolKanan) {
        this._arahKanan = false;
      }
      if (this.diTanah) {
        this.vx = this._arahKanan ? KONFIG.KECEPATAN_JALAN : -KONFIG.KECEPATAN_JALAN;
        this.animCtrl?.mainkan("idle");
      }
    }

    this._terapkanGravitasi(dt, collision);
  }

  /** Monkey menyerang saat sedang di udara mendekati player */
  get hitboxSeranganAktif() {
    return !this.diTanah && this._state !== "dead";
  }
}
