/**
 * main.js
 * Entry point utama engine Majapahit Platformer.
 *
 * Versi ini menggunakan modul src/game/ yang sudah lengkap:
 *   - GameManager (update + render semua entitas)
 *   - Player, Enemy, CollisionSystem, Level
 *
 * main.js hanya bertugas:
 *   1. Bootstrap (muat asset + config)
 *   2. Kelola state layar (loading/mainmenu/bermain/pause/gameover/levelcomplete)
 *   3. Jalankan game loop
 */

import { FixedStepClock } from "./FixedStepClock.js";
import { KONFIG }          from "./config.js";
import { AssetLoader }     from "./AssetLoader.js";
import { Renderer }        from "./Renderer.js";
import { InputManager }    from "./InputManager.js";
import { AudioManager }    from "./AudioManager.js";
import { Camera }          from "./Camera.js";
import { TilemapRenderer } from "./TilemapRenderer.js";
import { GameManager }     from "../game/GameManager.js";
import { FaunaSystem }     from "../utils/FaunaSystem.js";

// ─── Inisialisasi Modul ───────────────────────────────────────────────────────

const canvas   = document.getElementById("canvas");
const renderer = new Renderer(canvas);
const input    = new InputManager();
const loader   = new AssetLoader();
const audio    = new AudioManager(loader);
const gameMgr  = new GameManager();
let   fauna    = /** @type {FaunaSystem|null} */ (null);

// Debug explicitly opt-in via ?debug=1; F3 never conflicts with movement.
let debugMode = false;
window.addEventListener("keydown", (e) => {
  if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target?.tagName ?? "") || e.repeat) return;
  if (e.code === "F3" && new URLSearchParams(location.search).get("debug") === "1") { e.preventDefault(); debugMode = !debugMode; }
  if (e.code === "KeyM") { audio.toggleBisu(); syncUI(true); }
});

window.addEventListener("resize", () => renderer.terapkanAutoSkala());
renderer.terapkanAutoSkala();

const elBarIsi   = document.getElementById("loading-bar");
const elTeksLoad = document.getElementById("loading-text");

// ─── Daftar Asset ─────────────────────────────────────────────────────────────

const DAFTAR_ASSET = [
  // ─── Karakter ──────────────────────────────────────────────────────────────
  { id: "chr_warrior_sheet",       tipe: "gambar", path: "assets/characters/warrior/final/chr_warrior_sheet.png" },
  { id: "chr_soldier_sheet",       tipe: "gambar", path: "assets/characters/enemy_soldier/final/chr_soldier_sheet.png" },
  { id: "chr_monkey_sheet",        tipe: "gambar", path: "assets/characters/enemy_monkey/final/chr_monkey_sheet.png" },
  // ─── Environment ───────────────────────────────────────────────────────────
  { id: "tileset_ruins",               tipe: "gambar", path: "assets/environment/tilesets/final/env_ruins_wall_01.png" },
  { id: "bg_sky",                      tipe: "gambar", path: "assets/environment/backgrounds/final/bg_sky_layer.png" },
  { id: "bg_jungle_far",               tipe: "gambar", path: "assets/environment/backgrounds/final/bg_jungle_far.png" },
  { id: "bg_jungle_near",              tipe: "gambar", path: "assets/environment/backgrounds/final/bg_jungle_near.png" },
  // ─── Props / Dekorasi ──────────────────────────────────────────────────────
  { id: "env_palmtree_tall",           tipe: "gambar", path: "assets/environment/props/final/env_palmtree_tall.png" },
  { id: "env_palmtree_med",            tipe: "gambar", path: "assets/environment/props/final/env_palmtree_med.png" },
  { id: "env_palmtree_short",          tipe: "gambar", path: "assets/environment/props/final/env_palmtree_short.png" },
  { id: "env_candi_bentar_left",       tipe: "gambar", path: "assets/environment/props/final/env_candi_bentar_left.png" },
  { id: "env_candi_bentar_right",      tipe: "gambar", path: "assets/environment/props/final/env_candi_bentar_right.png" },
  { id: "env_banner_majapahit",        tipe: "gambar", path: "assets/environment/props/final/env_banner_majapahit.png" },
  { id: "env_ruins_relief_01",         tipe: "gambar", path: "assets/environment/tilesets/final/env_ruins_relief_01.png" },
  // ─── Items ─────────────────────────────────────────────────────────────────
  { id: "itm_gobog_sheet",         tipe: "gambar", path: "assets/items/final/itm_gobog_sheet.png" },
  { id: "itm_maja_static",         tipe: "gambar", path: "assets/items/final/itm_maja_static.png" },
  { id: "itm_chest_closed",        tipe: "gambar", path: "assets/items/final/itm_chest_closed.png" },
  { id: "itm_chest_open",          tipe: "gambar", path: "assets/items/final/itm_chest_open.png" },
  // ─── VFX ───────────────────────────────────────────────────────────────────
  { id: "vfx_hit",                 tipe: "gambar", path: "assets/vfx/final/vfx_hit_sheet.png" },
  { id: "vfx_dust",                tipe: "gambar", path: "assets/vfx/final/vfx_dust_sheet.png" },
  { id: "vfx_torch",               tipe: "gambar", path: "assets/vfx/final/vfx_torch_sheet.png" },
  // Fauna Dunia Hidup: empat frame per sprite sheet.
  { id: "fauna_burung",            tipe: "gambar", path: "assets/environment/fauna/fauna_burung_sheet.png" },
  { id: "fauna_kupu_kupu",         tipe: "gambar", path: "assets/environment/fauna/fauna_kupu_kupu_sheet.png" },
  { id: "fauna_capung",            tipe: "gambar", path: "assets/environment/fauna/fauna_capung_sheet.png" },
  { id: "fauna_kunang_kunang",     tipe: "gambar", path: "assets/environment/fauna/fauna_kunang_kunang_sheet.png" },
  // ─── UI / HUD ──────────────────────────────────────────────────────────────
  { id: "ui_healthbar_empty",      tipe: "gambar", path: "assets/ui/hud/final/ui_healthbar_empty.png" },
  { id: "ui_healthbar_fill",       tipe: "gambar", path: "assets/ui/hud/final/ui_healthbar_fill.png" },
  { id: "ui_icon_life",            tipe: "gambar", path: "assets/ui/hud/final/ui_icon_life.png" },
  { id: "ui_icon_coin",            tipe: "gambar", path: "assets/ui/hud/final/ui_coin_icon.png" },
  { id: "font_bitmap",             tipe: "gambar", path: "assets/ui/fonts/font_majapahit_bitmap.png" },
  // ─── UI Screens ────────────────────────────────────────────────────────────
  { id: "ui_screen_mainmenu",      tipe: "gambar", path: "assets/ui/screens/final/ui_screen_mainmenu.png" },
  { id: "ui_screen_gameover",      tipe: "gambar", path: "assets/ui/screens/final/ui_screen_gameover.png" },
  { id: "ui_screen_levelcomplete", tipe: "gambar", path: "assets/ui/screens/final/ui_screen_levelcomplete.png" },
  { id: "ui_screen_pause",         tipe: "gambar", path: "assets/ui/screens/final/ui_screen_pause.png" },
  // ─── UI Buttons ────────────────────────────────────────────────────────────
  { id: "ui_btn_audio_on",         tipe: "gambar", path: "assets/ui/buttons/audio_on/ui_btn_audio_on_normal.png" },
  { id: "ui_btn_audio_off",        tipe: "gambar", path: "assets/ui/buttons/audio_off/ui_btn_audio_off_normal.png" },
  { id: "ui_btn_pause",            tipe: "gambar", path: "assets/ui/buttons/pause/ui_btn_pause_normal.png" },
  { id: "ui_btn_play",             tipe: "gambar", path: "assets/ui/buttons/play/ui_btn_play_normal.png" },
  { id: "ui_btn_retry",            tipe: "gambar", path: "assets/ui/buttons/retry/ui_btn_retry_normal.png" },
  { id: "ui_btn_home",             tipe: "gambar", path: "assets/ui/buttons/home/ui_btn_home_normal.png" },
  { id: "ui_btn_mulai",            tipe: "gambar", path: "assets/ui/buttons/mulai/ui_btn_mulai_normal.png" },
  // ─── Audio BGM ─────────────────────────────────────────────────────────────
  // OGG diprioritaskan (lebih kecil, sudah ada loop metadata)
  { id: "bgm_mainmenu",            tipe: "audio",  path: "assets/audio/bgm/bgm_mainmenu_02.ogg" },
  { id: "bgm_level01",             tipe: "audio",  path: "assets/audio/bgm/bgm_level01_02.ogg" },
  // ─── Audio SFX ─────────────────────────────────────────────────────────────
  { id: "sfx_jump",                tipe: "audio",  path: "assets/audio/sfx/sfx_jump.wav" },
  { id: "sfx_attack_keris",        tipe: "audio",  path: "assets/audio/sfx/sfx_attack_keris.wav" },
  { id: "sfx_coin_pickup",         tipe: "audio",  path: "assets/audio/sfx/sfx_coin_pickup.wav" },
  { id: "sfx_damage_hit",          tipe: "audio",  path: "assets/audio/sfx/sfx_damage_hit.wav" },
  { id: "sfx_chest_open",          tipe: "audio",  path: "assets/audio/sfx/sfx_chest_open.wav" },
  { id: "sfx_spike_trap",          tipe: "audio",  path: "assets/audio/sfx/sfx_spike_trap.wav" },
  { id: "sfx_gameover",            tipe: "audio",  path: "assets/audio/sfx/sfx_gameover.wav" },
  { id: "sfx_levelcomplete",       tipe: "audio",  path: "assets/audio/sfx/sfx_levelcomplete.wav" },
  { id: "sfx_checkpoint",          tipe: "audio",  path: "assets/audio/sfx/sfx_checkpoint.wav" },
  { id: "sfx_ambient_jungle",      tipe: "audio",  path: "assets/audio/sfx/sfx_ambient_jungle.wav" },
];

// Peta filename → asset ID untuk background parallax
const PETA_BG_ID = {
  "bg_sky_layer.png":   "bg_sky",
  "bg_jungle_far.png":  "bg_jungle_far",
  "bg_jungle_near.png": "bg_jungle_near",
};

// ─── Data Game ────────────────────────────────────────────────────────────────

/** @type {"loading"|"mainmenu"|"bermain"|"pause"|"gameover"|"levelcomplete"} */
let stateGame      = "loading";
let animConfig     = null;
let levelData      = null;
let tilesetCfg     = null;
/** Statistik yang di-cache saat levelcomplete/gameover untuk ditampilkan di layar. */
let _statsCache    = null;

let kamera     = /** @type {Camera|null} */ (null);
let tileMapper = /** @type {TilemapRenderer|null} */ (null);

// ─── Muat Konfigurasi JSON ────────────────────────────────────────────────────

async function muatKonfigurasi() {
  try {
    const [rA, rL, rT, rF] = await Promise.all([
      fetch("docs/animation_config.json"),
      fetch("levels/level_01.json"),
      fetch("docs/tileset_config.json"),
      fetch("assets/ui/fonts/font_glyphs.json"),
    ]);
    if (!rA.ok) throw new Error(`animation_config: ${rA.status}`);
    if (!rL.ok) throw new Error(`level_01: ${rL.status}`);
    if (!rT.ok) throw new Error(`tileset_config: ${rT.status}`);
    if (!rF.ok) throw new Error(`font_glyphs: ${rF.status}`);

    animConfig = await rA.json();
    levelData  = await rL.json();
    tilesetCfg = await rT.json();
    renderer.fontGlyphs = (await rF.json()).glyphs;
  } catch (e) {
    console.error("[main] Gagal muat konfigurasi:", e);
    throw e;
  }
}

// ─── Inisialisasi Scene Bermain ───────────────────────────────────────────────

function inisialisasiBermain() {
  if (!levelData || !animConfig) {
    stateGame = "mainmenu";
    return;
  }

  const lebarPx  = levelData.dimensi?.lebar_px  ?? KONFIG.CANVAS_LEBAR;
  const tinggiPx = levelData.dimensi?.tinggi_px ?? KONFIG.CANVAS_TINGGI;

  kamera = new Camera(lebarPx, tinggiPx);
  // Catatan: kamera_batas ada di levelData.meta.kamera_batas tapi Camera tidak menggunakannya
  // (batas level sudah di-set melalui constructor Camera dengan lebarPx/tinggiPx)

  // Bangun tile property map
  const tileProps = {};
  for (const tile of tilesetCfg?.tilesets?.[0]?.tiles ?? []) {
    tileProps[tile.id] = tile;
  }
  const tilesetImg   = loader.ambilGambar("tileset_ruins");
  const kolomTileset = tilesetImg
    ? Math.max(1, Math.floor(tilesetImg.width / KONFIG.UKURAN_TILE))
    : 4;
  tileMapper = new TilemapRenderer(renderer, tilesetImg, kolomTileset, tileProps);

  // Inisialisasi GameManager
  gameMgr.inisialisasi(levelData, animConfig, tileMapper);

  // Inisialisasi FaunaSystem
  const lebarLevelPx = levelData.dimensi?.lebar_px ?? KONFIG.CANVAS_LEBAR * 10;
  fauna = new FaunaSystem(lebarLevelPx);
  fauna.inisialisasi(loader);  // loader sudah selesai saat ini

  // Posisi kamera awal mengikuti spawn player
  const spawn = gameMgr.level.spawnPx;
  kamera.teleport(spawn.x, spawn.y);

  stateGame = "mainmenu";
  // Mulai BGM menu segera setelah semua asset dimuat
  audio.putarBGM("bgm_mainmenu");
}

// ─── Helpers Render ───────────────────────────────────────────────────────────

function renderBackground() {
  if (!tileMapper || !kamera) return;
  for (const layer of levelData?.meta?.background_layers ?? []) {
    const filename = layer.file.split("/").pop();
    const imgId    = PETA_BG_ID[filename];
    if (!imgId) continue;
    tileMapper.renderBackground(loader.ambilGambar(imgId), kamera.x, layer.parallax_x);
  }
  // Fauna layer (di antara background parallax dan tile layer)
  if (fauna) fauna.render(renderer, kamera.x);
}

function renderPlaceholderLantai() {
  if (loader.ambilGambar("tileset_ruins") || !kamera) return;
  const lantaiY = (levelData?.dimensi?.tinggi_tiles ?? 20)
                  * KONFIG.UKURAN_TILE - KONFIG.UKURAN_TILE - kamera.y;
  renderer.renderKotak(0, lantaiY, KONFIG.CANVAS_LEBAR, KONFIG.UKURAN_TILE, KONFIG.WARNA.HIJAU_HUTAN);
}

// ─── Game Loop ─────────────────────────────────────────────────────────────────

let waktuSebelumnya = -1;
const simClock = new FixedStepClock(KONFIG.FPS_TARGET);

function loop(timestamp) {
  requestAnimationFrame(loop);

  let dt = waktuSebelumnya < 0 ? 0 : (timestamp - waktuSebelumnya) / 1000;
  waktuSebelumnya = timestamp;
  dt = Math.min(dt, KONFIG.DT_MAX);

  let inputConsumed = stateGame !== "bermain";
  switch (stateGame) {

    case "loading":
      renderer.renderLoading(loader.persen);
      break;

    case "mainmenu": {
      const bg = loader.ambilGambar("ui_screen_mainmenu");
      if (bg) {
        renderer.ctx.drawImage(bg, 0, 0, KONFIG.CANVAS_LEBAR, KONFIG.CANVAS_TINGGI);
      } else {
        renderer.bersihkan();
        renderer.renderKotak(0, 0, KONFIG.CANVAS_LEBAR, KONFIG.CANVAS_TINGGI, KONFIG.WARNA.BIRU_INDIGO);
        renderer.renderTeks(loader.ambilGambar("font_bitmap"),
          "MAJAPAHIT PLATFORMER", KONFIG.CANVAS_LEBAR / 2 - 80, KONFIG.CANVAS_TINGGI / 2 - 20);
        renderer.renderTeks(loader.ambilGambar("font_bitmap"),
          "TEKAN Z UNTUK MULAI",  KONFIG.CANVAS_LEBAR / 2 - 76, KONFIG.CANVAS_TINGGI / 2 + 10);
      }
      if (input.baruDitekan("serang") || input.baruDitekan("konfirmasi")) {
        startRun();
      }
      break;
    }

    case "bermain": {
      // Update semua logika game
      const pauseRequested = input.baruDitekan("pause");
      let transisi = null;
      simClock.advance(dt, (step) => {
        transisi = gameMgr.update(step, input, audio);
        fauna?.update(step);
        const player = gameMgr.player;
        if (kamera && player) kamera.update(player.pusat.x, player.pusat.y);
        input.akhirFrame();
        inputConsumed = true;
        return !transisi;
      });


      // Render — guard kamera dan tileMapper tidak null (seharusnya tidak terjadi tapi aman)
      renderer.bersihkan();
      if (kamera && tileMapper) {
        renderBackground();
        renderPlaceholderLantai();
        gameMgr.render(renderer, kamera, tileMapper, loader, debugMode);
      }
      gameMgr.renderHUD(renderer, loader);
      // Render tombol audio (pojok kanan bawah HUD)
      _renderAudioToggle(renderer, loader, audio);

      // Debug overlay
      if (debugMode) {
        renderer.ctx.save();
        renderer.ctx.fillStyle = "rgba(0,0,0,0.5)";
        renderer.ctx.fillRect(0, 0, 80, 12);
        renderer.ctx.fillStyle = "#F5C842";
        renderer.ctx.font = "6px monospace";
        // Guard dt > 0 untuk mencegah division by zero pada frame pertama
        const fps = dt > 0 ? Math.round(1 / dt) : 0;
        renderer.ctx.fillText(`DEBUG | FPS:${fps} dt:${dt.toFixed(3)}`, 2, 9);
        renderer.ctx.restore();
      }

      // Pause
      if (pauseRequested) {
        inputConsumed = true;
        simClock.reset();
        audio.pauseBGM();
        stateGame = "pause";
      }

      // Transisi dari GameManager
      if (transisi === "gameover") {
        gameMgr.skor.jeda();
        _statsCache = { ...gameMgr.skor.statistik };
        audio.hentikanBGM();
        audio.putarSFX("sfx_gameover");
        stateGame = "gameover";
      } else if (transisi === "levelcomplete") {
        gameMgr.skor.selesaikan(gameMgr.player?.hp ?? 0);
        _statsCache = { ...gameMgr.skor.statistik };
        audio.hentikanBGM();
        audio.putarSFX("sfx_levelcomplete");
        stateGame = "levelcomplete";
      }
      break;
    }

    case "pause": {
      // Tampilkan pause overlay jika tersedia, fallback ke manual
      const pauseBg = loader.ambilGambar("ui_screen_pause");
      if (pauseBg) {
        renderer.ctx.drawImage(pauseBg, 0, 0, KONFIG.CANVAS_LEBAR, KONFIG.CANVAS_TINGGI);
      } else {
        renderer.ctx.save();
        renderer.ctx.fillStyle = "rgba(0,0,0,0.55)";
        renderer.ctx.fillRect(0, 0, KONFIG.CANVAS_LEBAR, KONFIG.CANVAS_TINGGI);
        renderer.ctx.restore();
        renderer.renderTeks(loader.ambilGambar("font_bitmap"),
          "JEDA", KONFIG.CANVAS_LEBAR / 2 - 16, KONFIG.CANVAS_TINGGI / 2 - 10);
        renderer.renderTeks(loader.ambilGambar("font_bitmap"),
          "TEKAN ESC LANJUT", KONFIG.CANVAS_LEBAR / 2 - 60, KONFIG.CANVAS_TINGGI / 2 + 8);
      }
      // Tampilkan tombol audio di pause screen juga
      _renderAudioToggle(renderer, loader, audio);
      if (input.baruDitekan("pause")) {
        resumeGame();
      }
      break;
    }

    case "gameover": {
      const bg = loader.ambilGambar("ui_screen_gameover");
      if (bg) {
        renderer.ctx.drawImage(bg, 0, 0, KONFIG.CANVAS_LEBAR, KONFIG.CANVAS_TINGGI);
      } else {
        renderer.bersihkan(KONFIG.WARNA.HITAM_TUA);
        renderer.renderTeks(loader.ambilGambar("font_bitmap"),
          "GAME OVER", KONFIG.CANVAS_LEBAR / 2 - 36, KONFIG.CANVAS_TINGGI / 2 - 28);
      }
      // Tampilkan statistik terakhir di layar game over
      if (_statsCache) {
        _renderStatistik(renderer, loader, _statsCache, KONFIG.CANVAS_TINGGI / 2 - 10);
      }
      renderer.renderTeks(loader.ambilGambar("font_bitmap"),
        "TEKAN Z COBA LAGI", KONFIG.CANVAS_LEBAR / 2 - 68, KONFIG.CANVAS_TINGGI / 2 + 44);
      if (input.baruDitekan("serang") || input.baruDitekan("konfirmasi")) {
        retryCheckpoint();
      }
      break;
    }

    case "levelcomplete": {
      const bg = loader.ambilGambar("ui_screen_levelcomplete");
      if (bg) {
        renderer.ctx.drawImage(bg, 0, 0, KONFIG.CANVAS_LEBAR, KONFIG.CANVAS_TINGGI);
      } else {
        renderer.bersihkan(KONFIG.WARNA.BIRU_INDIGO);
        renderer.renderTeks(loader.ambilGambar("font_bitmap"),
          "LEVEL SELESAI!", KONFIG.CANVAS_LEBAR / 2 - 56, KONFIG.CANVAS_TINGGI / 2 - 50);
      }
      // Tampilkan statistik di layar level complete
      if (_statsCache) {
        _renderStatistik(renderer, loader, _statsCache, KONFIG.CANVAS_TINGGI / 2 - 32);
      }
      renderer.renderTeks(loader.ambilGambar("font_bitmap"),
        "TEKAN Z LANJUT", KONFIG.CANVAS_LEBAR / 2 - 52, KONFIG.CANVAS_TINGGI / 2 + 44);
      if (input.baruDitekan("serang") || input.baruDitekan("konfirmasi")) {
        audio.putarBGM("bgm_mainmenu");
        _statsCache = null;
        stateGame = "mainmenu";
      }
      break;
    }
  }

  syncUI();
  if (inputConsumed) input.akhirFrame();
}

// ─── Helper Render ────────────────────────────────────────────────────────────

/**
 * Render tombol audio toggle di sudut kanan atas HUD.
 * Ukuran tombol: 24×24 px. Posisi: 4px dari tepi kanan atas.
 * @param {Renderer} renderer
 * @param {AssetLoader} loader
 * @param {AudioManager} audio
 */
function _renderAudioToggle(renderer, loader, audio) {
  const SIZE = 24;
  const x = KONFIG.CANVAS_LEBAR  - SIZE - 4;
  const y = 4;

  const btnId = audio.dibisukan ? "ui_btn_audio_off" : "ui_btn_audio_on";
  const btn   = loader.ambilGambar(btnId);
  if (btn) {
    renderer.ctx.drawImage(btn, x, y, SIZE, SIZE);
  } else {
    // Fallback: ikon teks
    renderer.ctx.save();
    renderer.ctx.fillStyle = audio.dibisukan ? KONFIG.WARNA.ABU_BATU : KONFIG.WARNA.KUNING_EMAS;
    renderer.ctx.font      = "6px monospace";
    renderer.ctx.textAlign = "center";
    renderer.ctx.fillText(audio.dibisukan ? "BISU" : "♪", x + SIZE / 2, y + SIZE / 2 + 2);
    renderer.ctx.restore();
  }
}

/**
 * Render statistik skor (koin, musuh, waktu, skor total, highscore) di layar end-state.
 * @param {Renderer} renderer
 * @param {AssetLoader} loader
 * @param {{skor, koin, musuhKalah, waktu, highscore}} stats
 * @param {number} y  - Y awal baris pertama
 */
function _renderStatistik(renderer, loader, stats, y) {
  const font = loader.ambilGambar("font_bitmap");
  const cx   = KONFIG.CANVAS_LEBAR / 2;
  const BARIS = 14; // jarak antar baris (px)

  // Latar transparan di belakang statistik
  renderer.ctx.save();
  renderer.ctx.fillStyle = "rgba(0,0,0,0.45)";
  renderer.ctx.fillRect(cx - 80, y - 4, 160, BARIS * 6 + 8);
  renderer.ctx.restore();

  renderer.renderTeks(font, `KOIN    : ${String(stats.koin).padStart(3, " ")}`, cx - 72, y);
  renderer.renderTeks(font, `MUSUH   : ${String(stats.musuhKalah).padStart(3, " ")}`, cx - 72, y + BARIS);
  renderer.renderTeks(font, `WAKTU   : ${stats.waktu}`, cx - 72, y + BARIS * 2);
  renderer.renderTeks(font, `SKOR    : ${String(stats.skor).padStart(6, "0")}`, cx - 72, y + BARIS * 3);
  renderer.renderTeks(font, `TERBAIK : ${String(stats.highscore).padStart(6, "0")}`, cx - 72, y + BARIS * 4);
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  renderer.renderLoading(0);

  loader.onProgress = (persen, nama) => {
    if (elBarIsi) { elBarIsi.style.width = `${persen}%`; elBarIsi.parentElement.setAttribute("aria-valuenow", String(persen)); }
    if (elTeksLoad) elTeksLoad.textContent = `MEMUAT: ${nama} (${persen}%)`;
    renderer.renderLoading(persen);
  };

  await Promise.all([muatKonfigurasi(), loader.muatSemua(DAFTAR_ASSET)]);

  if (elBarIsi)   elBarIsi.parentElement.style.display = "none";
  if (elTeksLoad) elTeksLoad.style.display = "none";

  const missing = DAFTAR_ASSET.filter(a => a.tipe === "gambar" && !loader.ambilGambar(a.id));
  if (missing.length) throw new Error(`Aset gambar gagal dimuat: ${missing.map(a=>a.id).join(", ")}`);
  inisialisasiBermain();
  syncUI(true);
  requestAnimationFrame(loop);
}

// DOM controls remain accessible independently of the Canvas artwork.
let lastUIState = "";
const ui = id => document.getElementById(id);
function applyPreferences() { gameMgr.player.kurangiKedip = ui("reduce-flash").checked; }
function focusGame() { ui("canvas").focus({ preventScroll:true }); input.reset(); }
function startRun() {
  if (!levelData || !animConfig || !tileMapper) return;
  gameMgr.reset(levelData, animConfig, tileMapper);
  const p = gameMgr.level.spawnPx; kamera.teleport(p.x, p.y);
  fauna?.inisialisasi(loader); simClock.reset(); _statsCache = null;
  applyPreferences(); audio.putarBGM("bgm_level01"); stateGame = "bermain"; focusGame(); syncUI(true);
}
function retryCheckpoint() {
  const p = gameMgr.respawnCheckpoint(); kamera?.teleport(p.x,p.y); simClock.reset();
  _statsCache = null; applyPreferences(); audio.putarBGM("bgm_level01"); stateGame = "bermain"; focusGame(); syncUI(true);
}
function pauseGame() {
  if (stateGame !== "bermain") return;
  stateGame = "pause"; input.reset(); simClock.reset(); audio.pauseBGM(); syncUI(true);
}
function resumeGame() {
  if (stateGame !== "pause") return;
  stateGame = "bermain"; simClock.reset(); waktuSebelumnya = -1; audio.resumeBGM(); focusGame(); syncUI(true);
}
function homeGame() { stateGame = "mainmenu"; input.reset(); simClock.reset(); audio.putarBGM("bgm_mainmenu"); syncUI(true); }
function syncUI(force = false) {
  if (!force && lastUIState === stateGame) return;
  lastUIState = stateGame;
  const visible = {
    start:["mainmenu"], pause:["bermain"], resume:["pause"], retry:["gameover"],
    restart:["pause","gameover","levelcomplete"], home:["pause","gameover","levelcomplete"],
    mute:["mainmenu","bermain","pause","gameover","levelcomplete"], reload:["error"],
  };
  for (const [id,states] of Object.entries(visible)) ui(id).hidden = !states.includes(stateGame);
  const names = { loading:"Memuat permainan…", mainmenu:"Siap. Mulai lalu capai gerbang di ujung kanan.",
    bermain:"Bermain — Z menyerang, Spasi melompat, Esc menjeda.", pause:"Permainan dijeda.",
    gameover:"Kamu gugur. Coba lagi dari checkpoint atau ulang dari awal.", levelcomplete:"Level selesai! Pilih ulang dari awal atau kembali ke menu.", error:"Gagal memuat permainan. Periksa koneksi lalu muat ulang halaman." };
  ui("status").textContent = names[stateGame] + (_statsCache ? ` Skor ${_statsCache.skor}; koin ${_statsCache.koin}; waktu ${_statsCache.waktu}.` : "");
  ui("mute").setAttribute("aria-pressed",String(audio.dibisukan));
  ui("mute").textContent = audio.dibisukan ? "Aktifkan audio" : "Bisukan audio";
  if (["gameover","levelcomplete","pause","mainmenu","error"].includes(stateGame)) {
    const id = {gameover:"retry",levelcomplete:"restart",pause:"resume",mainmenu:"start",error:"reload"}[stateGame];
    ui(id).focus({preventScroll:true});
  }
}
ui("start").onclick = startRun; ui("restart").onclick = startRun; ui("retry").onclick = retryCheckpoint;
ui("pause").onclick = pauseGame; ui("resume").onclick = resumeGame; ui("home").onclick = homeGame;
ui("mute").onclick = () => { audio.toggleBisu(); syncUI(true); };
ui("reload").onclick = () => location.reload();
ui("volume-bgm").value = audio.volumeBGM; ui("volume-sfx").value = audio.volumeSFX;
ui("volume-bgm").oninput = e => audio.setVolumeBGM(Number(e.target.value));
ui("volume-sfx").oninput = e => audio.setVolumeSFX(Number(e.target.value));
try { ui("reduce-flash").checked = localStorage.getItem("maja_reduce_flash") === "true"; } catch { /* optional */ }
ui("reduce-flash").onchange = e => { if (gameMgr.player) applyPreferences(); try { localStorage.setItem("maja_reduce_flash",String(e.target.checked)); } catch { /* optional */ } };
canvas.addEventListener("pointerup", e => {
  const rect = canvas.getBoundingClientRect(), x=(e.clientX-rect.left)*320/rect.width, y=(e.clientY-rect.top)*180/rect.height;
  if (["bermain","pause"].includes(stateGame) && x>=292 && x<=316 && y>=4 && y<=28) { audio.toggleBisu(); syncUI(true); }
});
for (const button of document.querySelectorAll("[data-action]")) {
  button.addEventListener("pointerdown",e=>{ if(stateGame!=="bermain")return; e.preventDefault();button.setPointerCapture(e.pointerId);input.setVirtual(`touch-${e.pointerId}`,button.dataset.action,true); });
  for (const type of ["pointerup","pointercancel","lostpointercapture"]) button.addEventListener(type,e=>input.setVirtual(`touch-${e.pointerId}`,button.dataset.action,false));
}
window.addEventListener("blur",pauseGame);
document.addEventListener("visibilitychange",()=>{if(document.hidden)pauseGame();});
bootstrap().catch(error => { console.error("[bootstrap]",error); stateGame="error"; if(elBarIsi)elBarIsi.parentElement.hidden=true;if(elTeksLoad)elTeksLoad.hidden=true;syncUI(true); });
