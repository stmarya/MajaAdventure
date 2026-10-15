# Production Checklist — Majapahit Platformer

**Diperbarui:** 15 October 2026 (Sesi Reorganisasi Assets)

---

> Checklist ini mencerminkan status asset SETELAH sesi reorganisasi otomatis.
> ✅ = File ada di folder `final/` atau sudah di-integrasikan ke engine
> ⬜ = Belum ada / perlu dibuat / perlu validasi
> 🔄 = Draft tersedia, perlu QA/retune sebelum final

## CHARACTER

| Status | ID | Nama | Prioritas | Catatan |
|---|---|---|---|---|
| ✅ Ada (placeholder) | `chr_warrior_sheet` | Sprite Sheet Karakter Utama (Warrior) | **HIGH** | Dari pipeline generate |
| ✅ Ada (placeholder) | `chr_soldier_sheet` | Sprite Sheet Enemy Soldier | **HIGH** | Dari pipeline generate |
| ✅ Ada (placeholder) | `chr_monkey_sheet` | Sprite Sheet Enemy Monkey | **MEDIUM** | Dari pipeline generate |
| ⬜ Belum Final | `chr_warrior_portrait` | Portrait Karakter UI | **MEDIUM** | Perlu pixel artist |

## ENVIRONMENT

| Status | ID | Nama | Prioritas | Catatan |
|---|---|---|---|---|
| ✅ Ada (placeholder) | `env_ruins_wall_01` | Tileset Bata Andesit Merah (4×4 tile) | **HIGH** | Di `assets/environment/tilesets/final/` |
| ✅ Ada | `bg_sky_layer` | Background Langit | **HIGH** | Di `assets/environment/backgrounds/final/` |
| ✅ Ada | `bg_jungle_far` | Background Hutan Jauh | **HIGH** | Di `assets/environment/backgrounds/final/` |
| ✅ Ada | `bg_jungle_near` | Background Hutan Dekat | **HIGH** | Di `assets/environment/backgrounds/final/` |
| ✅ Ada | `env_palmtree_*` | Pohon Kelapa (3 ukuran) | **HIGH** | Di `assets/environment/props/final/` |
| ✅ Ada | `env_candi_bentar_*` | Candi Bentar Kiri+Kanan | **HIGH** | Di `assets/environment/props/final/` |
| ✅ Ada | `env_banner_majapahit` | Bendera Majapahit | **MEDIUM** | Di `assets/environment/props/final/` |
| ✅ Ada | `env_ladder_tile` | Tile Tangga Kayu | **MEDIUM** | Di `assets/environment/tilesets/final/` |
| ✅ Ada | `env_trap_spike` | Perangkap Spike Idle+Aktif | **HIGH** | Di `assets/environment/tilesets/final/` |
| ✅ Ada | `env_ruins_relief_01` | Relief Panel Batu | **MEDIUM** | Di `assets/environment/tilesets/final/` |
| ✅ Ada (frame terpisah) | Obor animasi | Api Obor 4 Frame | **MEDIUM** | Di `assets/environment/props/animated/` |
| ✅ Ada (frame terpisah) | Rumput, semak, daun jatuh | Dekorasi Dunia Hidup | **LOW** | Di `assets/environment/props/animated/` |

## FAUNA (Baru)

| Status | ID | Nama | Prioritas | Catatan |
|---|---|---|---|---|
| ✅ Ada (frame terpisah) | `fauna_burung` | Burung Terbang 4 Frame | **LOW** | Di `assets/environment/fauna/burung/` |
| ✅ Ada (frame terpisah) | `fauna_kupu_kupu` | Kupu-kupu 4 Frame | **LOW** | Di `assets/environment/fauna/kupu_kupu/` |
| ✅ Ada (frame terpisah) | `fauna_capung` | Capung 4 Frame | **LOW** | Di `assets/environment/fauna/capung/` |
| ✅ Ada (frame terpisah) | `fauna_kunang_kunang` | Kunang-kunang 4 Frame | **LOW** | Di `assets/environment/fauna/kunang_kunang/` |

## UI

| Status | ID | Nama | Prioritas | Catatan |
|---|---|---|---|---|
| ✅ Ada (baru) | `ui_healthbar_empty/fill` | HUD Health Bar (Kosong + Isi) | **HIGH** | Dari paket03-ui-audio |
| ✅ Ada (baru) | `ui_icon_life` | Ikon Nyawa (Keris Mini 16×16) | **HIGH** | Dari paket03-ui-audio |
| ✅ Ada (baru) | `ui_icon_coin` | Ikon Koin HUD 16×16 | **HIGH** | Dari paket03-ui-audio |
| ✅ Ada (baru) | `ui_icon_maja` | Ikon Buah Maja 16×16 | **MEDIUM** | Dari paket03-ui-audio |
| ✅ Ada (baru) | `ui_btn_audio_on/off` | Tombol Toggle Audio 24×24 | **HIGH** | Dari paket03-ui-audio, aktif di HUD |
| ✅ Ada (baru) | `ui_btn_pause/play/retry/home` | Tombol HUD Ikon 24×24 | **HIGH** | Dari paket03-ui-audio |
| ✅ Ada (baru) | `ui_btn_mulai/lanjut/ulang` | Tombol Teks 64×20 | **HIGH** | Dari paket03-ui-audio |
| ✅ Ada (baru) | `ui_screen_mainmenu` | Layar Menu Utama 320×180 | **HIGH** | Dari paket03-ui-audio |
| ✅ Ada (baru) | `ui_screen_gameover` | Layar Game Over 320×180 | **HIGH** | Dari paket03-ui-audio |
| ✅ Ada (baru) | `ui_screen_levelcomplete` | Layar Level Complete 320×180 | **MEDIUM** | Dari paket03-ui-audio |
| ✅ Ada (baru) | `ui_screen_pause` | Layar Pause Overlay 320×180 | **MEDIUM** | Dari paket03-ui-audio |
| ✅ Ada (baru) | `ui_panel_stone_gold` | Panel 48×48 9-Slice Batu+Emas | **MEDIUM** | Dari paket03-ui-audio |

## FONT

| Status | ID | Nama | Prioritas | Catatan |
|---|---|---|---|---|
| ✅ Ada (baru) | `font_bitmap` | Font Pixel Art 8×8 (A-Z, 0-9) | **HIGH** | Dari paket03-ui-audio, menggantikan placeholder |
| ✅ Ada (baru) | `font_glyphs.json` | Metadata Glyph JSON | **HIGH** | Di `assets/ui/fonts/` |
| ⬜ Belum | `font_ttf` | Font TTF Fallback | **LOW** | Tidak diprioritaskan |

## ITEM

| Status | ID | Nama | Prioritas | Catatan |
|---|---|---|---|---|
| ✅ Ada (placeholder) | `itm_gobog_sheet` | Koin Gobog (4 frame) | **HIGH** | Di `assets/items/final/` |
| ✅ Ada (placeholder) | `itm_maja_static` | Buah Maja Power-Up | **HIGH** | Di `assets/items/final/` |
| ✅ Ada (placeholder) | `itm_chest_closed/open` | Peti Kayu Tertutup+Terbuka | **HIGH** | Di `assets/items/final/` |
| ⬜ Belum | `itm_banner_sheet` | Bendera Majapahit Animasi | **MEDIUM** | Frame terpisah tersedia di staging |

## VFX

| Status | ID | Nama | Prioritas | Catatan |
|---|---|---|---|---|
| ✅ Ada (placeholder) | `vfx_hit_sheet` | VFX Hit/Slash Keris (3 Frame) | **HIGH** | Di `assets/vfx/final/` |
| ✅ Ada (placeholder) | `vfx_dust_sheet` | VFX Debu Landing (3 Frame) | **MEDIUM** | Di `assets/vfx/final/` |
| ✅ Ada (placeholder) | `vfx_torch_sheet` | VFX Api Obor (3 Frame) | **MEDIUM** | Di `assets/vfx/final/` — dipakai sebagai visual checkpoint |
| ✅ Ada (frame terpisah) | `vfx_coin_burst` | VFX Ambil Koin (4 Frame) | **MEDIUM** | Di `assets/vfx/vfx_coin_burst/` |
| ✅ Ada (frame terpisah) | `vfx_slash` | VFX Tebasan Keris (4 Frame) | **MEDIUM** | Di `assets/vfx/vfx_slash/` |
| ✅ Ada (frame terpisah) | Checkpoint visual | Animasi Checkpoint (8 Frame) | **MEDIUM** | Di `assets/vfx/checkpoint/` |
| ⬜ Belum sheet | `vfx_coin_burst_sheet` | Perlu dijahit jadi 1 sheet | **MEDIUM** | Frame ada, belum di-atlas |
| ⬜ Belum | `vfx_glow_maja_sheet` | VFX Glow Buah Maja | **LOW** | Belum dibuat |

## AUDIO

| Status | ID | Nama | Prioritas | Catatan |
|---|---|---|---|---|
| ✅ Tersedia (OGG+WAV) | `bgm_mainmenu` | BGM Menu Utama | **HIGH** | `bgm_mainmenu_02.ogg` (baru), `bgm_mainmenu_01.wav` (lama) |
| ✅ Tersedia (OGG+WAV) | `bgm_level01` | BGM Level 1 | **HIGH** | `bgm_level01_02.ogg` (baru), `bgm_level01_01.wav` (lama) |
| 🔄 Perlu QA | `sfx_jump` | SFX Lompat | **HIGH** | WAV baru dari paket03, belum listening review |
| 🔄 Perlu QA | `sfx_attack_keris` | SFX Serangan Keris | **HIGH** | WAV baru dari paket03 |
| 🔄 Perlu QA | `sfx_coin_pickup` | SFX Ambil Koin | **HIGH** | WAV baru dari paket03 |
| 🔄 Perlu QA | `sfx_damage_hit` | SFX Terkena Damage | **HIGH** | WAV baru dari paket03 |
| 🔄 Perlu QA | `sfx_chest_open` | SFX Buka Peti | **MEDIUM** | WAV baru dari paket03 |
| 🔄 Perlu QA | `sfx_spike_trap` | SFX Spike Trap Aktif | **MEDIUM** | WAV baru dari paket03 |
| 🔄 Perlu QA | `sfx_gameover` | SFX Game Over Jingle | **MEDIUM** | WAV baru dari paket03 |
| 🔄 Perlu QA | `sfx_checkpoint` | SFX Checkpoint Aktif | **MEDIUM** | **Baru** — WAV dari paket03 |
| ✅ Ada (placeholder) | `sfx_levelcomplete` | SFX Level Complete | **MEDIUM** | WAV placeholder lama |
| ✅ Ada (placeholder) | `sfx_ambient_jungle` | Ambient Hutan Loop | **LOW** | WAV placeholder lama |

## STAGING — Tersedia Tapi Belum Diintegrasikan

| Paket | Isi | Catatan |
|---|---|---|
| `staging/majapahit-ekspansi-02-lima-bagian/` | Lingkungan baru (air, kabut), penghuni baru (pemanah, pedagang, babi hutan, penjaga perisai), VFX baru, area baru (desa, tepi sungai, hutan dalam) | Untuk level 2+ |
| `staging/majapahit-external-audio-cc0/` | BGM ambient hutan, jingle NES, SFX RPG (footstep, draw knife, dll.), UI sounds, voice pack | Pilih yang relevan untuk level 2+ |
| `staging/majapahit-assets-draft/` | Sheet PNG besar (warrior, environment, items_enemies_ui) — draft AI, perlu pixel cleanup | Sumber referensi / slice manual |
| `staging/majapahit-assets-terpisah-dan-animasi/` | Frame terpisah semua karakter, lingkungan, musuh, item, UI — terorganisir per animasi | Untuk pipeline slicing / reference |

---

## Ringkasan Progres

| Metrik | Nilai |
|---|---|
| Total asset terdaftar | 58+ (bertambah dari staging) |
| Selesai / Tersedia | ~42 (termasuk placeholder + baru dari paket03) |
| Perlu QA audio | 8 SFX + 2 BGM OGG |
| Belum dibuat | ~8 (portrait, banner anim, VFX glow, font TTF, coin burst sheet) |
| Baru diintegrasikan sesi ini | **19 assets** (audio baru, UI screens, font, HUD, buttons, VFXManager) |

## Perubahan Kode Sesi Ini

| File | Perubahan |
|---|---|
| `src/game/VFXManager.js` | **Baru** — sistem VFX pool, dust saat landing, hit saat serangan |
| `src/game/GameManager.js` | Integrasi VFXManager, checkpoint visual beranimasi + sfx, dust VFX |
| `src/engine/main.js` | BGM OGG baru, assets baru (UI buttons, screens, font, icons), audio toggle button, pause screen |
| `assets/audio/bgm/` | `bgm_mainmenu_02.ogg` + `bgm_level01_02.ogg` (baru) |
| `assets/audio/sfx/` | `sfx_checkpoint.wav` (baru) + 7 SFX lama diganti versi paket03 |
| `assets/ui/screens/final/` | 4 layar baru dari paket03 |
| `assets/ui/fonts/` | `font_majapahit_bitmap.png` + `font_glyphs.json` (baru) |
| `assets/ui/hud/final/` | `ui_healthbar_empty/fill/full/half`, ikon baru |
| `assets/ui/buttons/` | **Baru** — 11 folder button (audio, pause, play, retry, home, close, mulai, lanjut, ulang) |
| `assets/vfx/checkpoint/` | **Baru** — 8 frame animasi checkpoint |
| `assets/environment/fauna/` | **Baru** — 4 fauna animasi (burung, kupu-kupu, capung, kunang-kunang) |
| `assets/environment/props/animated/` | **Baru** — obor, rumput, semak, daun jatuh |
| `staging/archives/` | 7 file ZIP + OGG dipindahkan dari root |
