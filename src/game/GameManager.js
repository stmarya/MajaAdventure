/**
 * GameManager.js
 * Orkestrator utama sesi permainan (satu level).
 *
 * Tanggung jawab:
 *  - Inisialisasi dan reset level
 *  - Update semua entitas (player, enemy, item)
 *  - Deteksi pickup item (koin, buah Maja, peti)
 *  - Deteksi combat (player menyerang enemy, enemy menyerang player)
 *  - Deteksi checkpoint dan level exit
 *  - Render semua layer (background, tile, entitas, HUD)
 *  - Mengembalikan state transisi ke main.js (null | "gameover" | "levelcomplete")
 */

import { KONFIG }           from "../engine/config.js";
import { Level }            from "./Level.js";
import { Player }           from "./Player.js";
import { CollisionSystem }  from "./CollisionSystem.js";
import { EnemySoldier, EnemyMonkey } from "./Enemy.js";
import { VFXManager }       from "./VFXManager.js";
import { PropRenderer }     from "./PropRenderer.js";
import { ScoreManager }     from "../utils/ScoreManager.js";

// Jarak pickup item (pixel, dari pusat item ke pusat player)
const PICKUP_RADIUS = 18;
// Radius aktivasi checkpoint
const CHECKPOINT_RADIUS = KONFIG.UKURAN_TILE * 2;

export class GameManager {
  constructor() {
    this.level      = new Level();
    this.player     = null;
    this.enemies    = [];
    this.items      = [];   // { id, tipe, x, y, diambil, animFrame, timer }
    this.collision  = null;
    this.vfx        = new VFXManager();
    this.skor       = new ScoreManager();
    this.props      = null; // PropRenderer, dibuat saat inisialisasi
    this._aktifCheckpoint  = null;
    this._checkpointState  = new Map();
    // Pending VFX — null berarti tidak ada yang perlu di-spawn
    this._pendingDust      = null;
    this._pendingHit       = null;
    this._pendingCoinBurst = null;
  }

  // ─── Inisialisasi ──────────────────────────────────────────────────────────

  /**
   * Inisialisasi sesi baru dari data level dan config animasi.
   * @param {object} levelJson
   * @param {object} animConfig
   * @param {import("../engine/TilemapRenderer.js").TilemapRenderer} tileMapper
   */
  inisialisasi(levelJson, animConfig, tileMapper) {
    // Level & collision
    this.level.inisialisasi(levelJson, tileMapper);
    this.collision = new CollisionSystem(this.level, tileMapper);

    // Player
    const spawn = this.level.spawnPx;
    this.player = new Player(animConfig?.warrior ?? null);
    this.player.respawn(spawn.x, spawn.y);

    // Musuh, item, reset vfx dan pending state
    this.enemies = [];
    this.items   = [];
    this.vfx.bersihkan();
    this._aktifCheckpoint  = spawn;
    this._checkpointState.clear();
    this._pendingDust      = null;
    this._pendingHit       = null;
    this._pendingCoinBurst = null;

    for (const obj of this.level.objek) {
      this._instansiObjek(obj, animConfig);
    }

    // Inisialisasi state visual checkpoint
    for (const cp of this.level.checkpoints) {
      this._checkpointState.set(cp.id, {
        x:         cp.tile_x * KONFIG.UKURAN_TILE,
        y:         cp.tile_y * KONFIG.UKURAN_TILE,
        aktif:     false,
        timer:     0,
        animFrame: 0,
      });
    }

    // Buat PropRenderer dari objek level
    this.props = new PropRenderer(this.level.objek);

    // Mulai skor baru
    this.skor.mulai();
  }

  /**
   * Reset level (respawn player, musuh, item).
   * Dipakai saat game over → coba lagi.
   * @param {object} levelJson
   * @param {object} animConfig
   * @param {import("../engine/TilemapRenderer.js").TilemapRenderer} tileMapper
   */
  reset(levelJson, animConfig, tileMapper) {
    this.inisialisasi(levelJson, animConfig, tileMapper);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /**
   * Update semua logika game satu frame.
   * @param {number} dt
   * @param {import("../engine/InputManager.js").InputManager} input
   * @param {import("../engine/AudioManager.js").AudioManager} audio
   * @returns {null|"gameover"|"levelcomplete"}
   */
  update(dt, input, audio) {
    if (!this.player || !this.level || !this.collision) return null;

    // Update level (spike timer)
    this.level.update(dt);

    // Update skor/timer
    this.skor.update(dt);

    // Update props (animasi obor dll.)
    this.props?.update(dt);

    // Update VFX
    this.vfx.update(dt);

    // Simpan posisi Y player sebelum update untuk deteksi landing
    const diTanahSebelum = this.player.diTanah;

    // Update player
    this.player.update(dt, input, this.collision, audio);

    // Deteksi landing → spawn dust VFX (hanya set saat baru mendarat)
    if (!diTanahSebelum && this.player.diTanah) {
      this._pendingDust = {
        x: this.player.x + KONFIG.FRAME_LEBAR  / 2,
        y: this.player.y + KONFIG.FRAME_TINGGI,
      };
    }
    // _pendingDust di-clear setelah digunakan di render(), bukan di sini

    // Cek spike langsung kena player
    if (!this.player.mati && !this.player.diInvincible) {
      if (this.collision.kenaSpike({
        x: this.player.hitboxX, y: this.player.hitboxY,
        lebar: this.player.lebar, tinggi: this.player.tinggi
      })) {
        this.player.terimaKerusakan(1, audio);
      }
    }

    // Update checkpoint animasi
    this._updateCheckpoint(dt, audio);

    // Update musuh
    const playerState = {
      x: this.player.x, y: this.player.y,
      hitboxX: this.player.hitboxX, hitboxY: this.player.hitboxY,
      lebar: this.player.lebar, tinggi: this.player.tinggi,
    };

    // Pre-hitung hitbox serangan player sekali sebelum loop enemy
    let hbSerangan = null;
    let sxSerangan = 0, sySerangan = 0;
    if (this.player.animCtrl?.hitboxAktif) {
      hbSerangan = this.player.animCtrl.hitbox;
      if (hbSerangan) {
        const sxOfset = this.player.menghadapKanan
          ? hbSerangan.x
          : -(hbSerangan.x + hbSerangan.lebar);
        sxSerangan = this.player.x + sxOfset;
        sySerangan = this.player.y + hbSerangan.y;
      }
    }

    let sfxSeranganDiputar = false; // cegah double SFX satu frame
    for (const enemy of this.enemies) {
      if (!enemy.aktif) continue;
      enemy.update(dt, playerState, this.collision);

      // Enemy menyerang player
      if (!this.player.mati && !this.player.diInvincible) {
        const mengenai = enemy.cekTumbukanPlayer(
          this.player.hitboxX, this.player.hitboxY,
          this.player.lebar,   this.player.tinggi
        );
        if (mengenai) {
          this.player.terimaKerusakan(enemy.damage, audio);
        }
      }

      // Player menyerang enemy
      if (hbSerangan) {
        const kenaEnemy = (
          enemy.hitboxX     < sxSerangan + hbSerangan.lebar &&
          enemy.hitboxKanan > sxSerangan                    &&
          enemy.hitboxY     < sySerangan + hbSerangan.tinggi &&
          enemy.hitboxBawah > sySerangan
        );
        if (kenaEnemy) {
          const sudahMati = enemy.mati;
          enemy.terimaKerusakan(1);
          // SFX attack hanya 1x per frame meskipun kena beberapa enemy
          if (!sfxSeranganDiputar) {
            audio.putarSFX("sfx_attack_keris");
            sfxSeranganDiputar = true;
          }
          // VFX hit — simpan posisi enemy terakhir yang kena
          this._pendingHit = {
            x: enemy.hitboxX + enemy.lebar / 2,
            y: enemy.hitboxY + enemy.tinggi / 2,
          };
          // Catat kill jika musuh baru mati
          if (!sudahMati && enemy.mati) {
            this.skor.musuhDikalahkan(1);
          }
        }
      }
    }

    // Update & pickup item
    this._updateItem(dt, audio);

    // Cek level exit
    if (this._cekExit()) return "levelcomplete";

    // Cek game over
    if (this.player.mati && this.player.animCtrl?.sudahSelesai) {
      return "gameover";
    }

    return null;
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  /**
   * Render semua konten level ke canvas.
   * @param {import("../engine/Renderer.js").Renderer} renderer
   * @param {import("../engine/Camera.js").Camera} camera
   * @param {import("../engine/TilemapRenderer.js").TilemapRenderer} tileMapper
   * @param {import("../engine/AssetLoader.js").AssetLoader} loader
   * @param {boolean} [debug=false]
   */
  render(renderer, camera, tileMapper, loader, debug = false) {
    // Background parallax (dipanggil sebelumnya dari main.js)

    // Tile layer
    if (this.level.tileData.length > 0) {
      tileMapper.renderLayer(
        this.level.tileData,
        this.level.lebarTiles,
        this.level.tinggiTiles,
        camera.x,
        camera.y
      );
    }

    // Props dekorasi (pohon, candi bentar, obor, bendera) — di belakang entitas
    this.props?.render(renderer, camera, loader);

    // Checkpoint visual (obor bendera)
    this._renderCheckpoint(renderer, camera, loader);

    // Item
    this._renderItem(renderer, camera, loader);

    // VFX (di bawah player, di atas tile)
    if (this._pendingDust) {
      const pos = camera.worldKeLayar(this._pendingDust.x, this._pendingDust.y);
      this.vfx.tampilkanDebu(loader.ambilGambar("vfx_dust"), pos.x, pos.y);
      this._pendingDust = null;
    }
    if (this._pendingHit) {
      const pos = camera.worldKeLayar(this._pendingHit.x, this._pendingHit.y);
      this.vfx.tampilkanHit(loader.ambilGambar("vfx_hit"), pos.x, pos.y);
      this._pendingHit = null;
    }
    if (this._pendingCoinBurst) {
      const pos = camera.worldKeLayar(this._pendingCoinBurst.x, this._pendingCoinBurst.y);
      // Gunakan vfx_hit sebagai fallback jika vfx_coin_burst belum tersedia (sheet belum dijahit)
      const burstSheet = loader.ambilGambar("vfx_hit");
      if (burstSheet) this.vfx.tampilkan("coin_burst", burstSheet, pos.x, pos.y, 32, 32, 3, 14);
      this._pendingCoinBurst = null;
    }
    this.vfx.render(renderer);

    // Enemy
    for (const enemy of this.enemies) {
      if (!enemy.aktif) continue;
      const sheet = loader.ambilGambar(`chr_${enemy.tipe.replace("enemy_", "")}_sheet`);
      enemy.render(renderer, camera, sheet, enemy.frameLebar, enemy.frameTinggi, debug);
    }

    // Player
    this.player?.render(renderer, camera, loader, debug);
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  /**
   * Render HUD (health bar, koin, nyawa).
   * @param {import("../engine/Renderer.js").Renderer} renderer
   * @param {import("../engine/AssetLoader.js").AssetLoader} loader
   */
  renderHUD(renderer, loader) {
    const player = this.player;
    if (!player) return;
    const font = loader.ambilGambar("font_bitmap");

    // ── Kiri atas: health bar (y=4) ──────────────────────────────────────────
    renderer.renderHealthBar(
      loader.ambilGambar("ui_healthbar_empty"),
      loader.ambilGambar("ui_healthbar_fill"),
      player.hp, player.hpMaks, 4, 4
    );

    // ── Kiri atas: ikon nyawa di bawah health bar (y=20) ─────────────────────
    const ikonNyawa = loader.ambilGambar("ui_icon_life");
    for (let i = 0; i < player.hpMaks; i++) {
      if (ikonNyawa) {
        renderer.ctx.globalAlpha = i < player.hp ? 1.0 : 0.35;
        renderer.ctx.drawImage(ikonNyawa, 4 + i * 18, 20, 14, 14);
        renderer.ctx.globalAlpha = 1.0;
      } else {
        renderer.renderKotak(4 + i * 18, 20, 12, 12,
          i < player.hp ? KONFIG.WARNA.MERAH_BATA : KONFIG.WARNA.HITAM_TUA);
      }
    }

    // ── Kanan atas: counter koin dengan ikon (y=4, hindari audio toggle 24+4=28px dari kanan) ─
    // Audio toggle: KONFIG.CANVAS_LEBAR - 28px. Kita tempatkan koin mulai x = KONFIG.CANVAS_LEBAR - 78
    const coinX = KONFIG.CANVAS_LEBAR - 80;
    const ikonKoin = loader.ambilGambar("ui_icon_coin");
    if (ikonKoin) {
      renderer.ctx.drawImage(ikonKoin, coinX, 4, 12, 12);
      renderer.renderTeks(font, `${String(player.koin).padStart(3, "0")}`, coinX + 14, 4);
    } else {
      renderer.renderTeks(font, `KOIN:${player.koin}`, coinX, 4);
    }

    // ── Kanan atas: skor (y=18, di bawah koin) ───────────────────────────────
    const skor = this.skor?.skor ?? 0;
    renderer.renderTeks(font, `${String(skor).padStart(6, "0")}`, coinX, 18);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  _instansiObjek(obj, animConfig) {
    const px = obj.tile_x * KONFIG.UKURAN_TILE;
    const py = obj.tile_y * KONFIG.UKURAN_TILE;

    switch (obj.tipe) {
      case "enemy_soldier":
        this.enemies.push(new EnemySoldier(obj, animConfig?.enemy_soldier ?? null));
        break;
      case "enemy_monkey":
        this.enemies.push(new EnemyMonkey(obj, animConfig?.enemy_monkey ?? null));
        break;
      case "item_gobog":
        this.items.push({ id: obj.id, tipe: "gobog",    x: px, y: py, nilai: obj.nilai ?? 1,  diambil: false, timer: 0 });
        break;
      case "item_maja_fruit":
        this.items.push({ id: obj.id, tipe: "maja",     x: px, y: py, nilai: obj.nilai ?? 1,  diambil: false, timer: 0 });
        break;
      case "item_chest":
        this.items.push({ id: obj.id, tipe: "chest",    x: px, y: py, isi: obj.isi ?? [],      diambil: false, terbuka: false, timer: 0 });
        break;
      // trigger_spike, prop_*, level_exit ditangani oleh Level.js atau GameManager._cekExit
      default: break;
    }
  }

  _updateItem(dt, audio) {
    if (!this.player) return;
    const px = this.player.x + KONFIG.FRAME_LEBAR  / 2;
    const py = this.player.y + KONFIG.FRAME_TINGGI / 2;

    for (const item of this.items) {
      if (item.diambil) continue;

      const ix = item.x + KONFIG.UKURAN_TILE / 2;
      const iy = item.y + KONFIG.UKURAN_TILE / 2;
      const dist = Math.hypot(px - ix, py - iy);

      if (dist <= PICKUP_RADIUS) {
        item.diambil = true;
        switch (item.tipe) {
          case "gobog":
            this.player.koin += item.nilai;
            this.skor.koinDiambil(item.nilai);
            audio.putarSFX("sfx_coin_pickup");
            // VFX coin burst di posisi koin
            this._pendingCoinBurst = { x: ix, y: iy };
            break;
          case "maja":
            this.player.hp = Math.min(this.player.hp + item.nilai, this.player.hpMaks);
            break;
          case "chest":
            if (!item.terbuka) {
              item.terbuka = true;
              audio.putarSFX("sfx_chest_open");
              for (const isi of (item.isi ?? [])) {
                if (isi.tipe === "item_gobog") {
                  this.player.koin += isi.jumlah;
                  this.skor.koinDiambil(isi.jumlah);
                  audio.putarSFX("sfx_coin_pickup");
                }
              }
            }
            break;
        }
      }
    }
  }

  _renderItem(renderer, camera, loader) {
    for (const item of this.items) {
      if (item.diambil && item.tipe !== "chest") continue;
      const pos = camera.worldKeLayar(item.x, item.y);

      switch (item.tipe) {
        case "gobog": {
          const sheet = loader.ambilGambar("itm_gobog_sheet");
          if (sheet) {
            renderer.renderSprite(sheet, 0, 16, 16, pos.x, pos.y); // frame static
          } else {
            renderer.renderKotak(pos.x, pos.y, 12, 12, KONFIG.WARNA.KUNING_EMAS);
          }
          break;
        }
        case "maja": {
          const img = loader.ambilGambar("itm_maja_static");
          if (img) {
            renderer.ctx.drawImage(img, pos.x, pos.y, 16, 16);
          } else {
            renderer.renderKotak(pos.x, pos.y, 14, 14, KONFIG.WARNA.HIJAU_HUTAN);
          }
          break;
        }
        case "chest": {
          const key = item.terbuka ? "itm_chest_open" : "itm_chest_closed";
          const img = loader.ambilGambar(key);
          if (img) {
            renderer.ctx.drawImage(img, pos.x, pos.y, 32, 32);
          } else {
            renderer.renderKotak(pos.x, pos.y, 28, 24, KONFIG.WARNA.EMAS_TUA);
          }
          break;
        }
      }
    }
  }

  _updateCheckpoint(dt, audio) {
    if (!this.player) return;
    const ANIM_FPS    = 6;
    const ANIM_FRAMES = 4;

    for (const [id, state] of this._checkpointState) {
      // Animasi berulang
      state.timer += dt;
      if (state.timer >= 1 / ANIM_FPS) {
        state.timer -= 1 / ANIM_FPS;
        state.animFrame = (state.animFrame + 1) % ANIM_FRAMES;
      }

      // Aktivasi checkpoint saat player dekat
      if (!state.aktif) {
        const dist = Math.hypot(this.player.x - state.x, this.player.y - state.y);
        if (dist < CHECKPOINT_RADIUS) {
          state.aktif = true;
          this._aktifCheckpoint = { x: state.x, y: state.y };
          audio?.putarSFX("sfx_checkpoint");
        }
      }
    }
  }

  _renderCheckpoint(renderer, camera, loader) {
    for (const [, state] of this._checkpointState) {
      const pos = camera.worldKeLayar(state.x, state.y);

      // Pilih sheet: aktivasi jika baru aktif (animFrame < 4), lalu sheet aktif normal
      const sheet = loader.ambilGambar("vfx_torch"); // fallback dengan torch (bendera belum jadi sheet)

      if (sheet) {
        // Render torch sebagai penanda checkpoint (3 frame, 16×24, pakai vfx_torch)
        const frameIdx = state.aktif ? state.animFrame % 3 : 0;
        const kolomPerBaris = Math.max(1, Math.floor(sheet.width / 16));
        const srcX = (frameIdx % kolomPerBaris) * 16;
        const srcY = Math.floor(frameIdx / kolomPerBaris) * 24;
        renderer.ctx.drawImage(sheet, srcX, srcY, 16, 24, pos.x - 8, pos.y - 24, 16, 24);
      } else {
        // Fallback: kotak warna
        const warna = state.aktif ? KONFIG.WARNA.KUNING_EMAS : KONFIG.WARNA.ABU_BATU;
        renderer.renderKotak(pos.x - 4, pos.y - 16, 8, 16, warna);
      }
    }
  }

  _cekExit() {
    if (!this.player) return false;
    const exits = this.level.objek.filter(o => o.tipe === "level_exit");
    for (const exit of exits) {
      const ex = exit.tile_x * KONFIG.UKURAN_TILE;
      const ey = exit.tile_y * KONFIG.UKURAN_TILE;
      const dist = Math.hypot(this.player.x - ex, this.player.y - ey);
      if (dist < KONFIG.UKURAN_TILE * 2) return true;
    }
    return false;
  }
}
