# 🏯 Majapahit Platformer

**Game 2D Retro Platformer berlatar Kerajaan Majapahit — Visual Style 16-bit Pixel Art**

---

## Gambaran Proyek

| Properti | Nilai |
|---|---|
| Engine | HTML5 Canvas (Vanilla JavaScript) |
| Resolusi Native | 320 × 180 px (16:9) |
| Skala | Integer ×2 / ×3 / ×4 |
| Interpolasi | Nearest-neighbor (pixel art) |
| Platform Target | Web, Windows, Android |
| Versi | 0.1.0 |

---

## Struktur Folder

```
MajapahitPlatformer/
├── assets/            ← Semua file asset game
│   ├── characters/    ← Sprite karakter dan musuh
│   ├── environment/   ← Tileset, prop, background
│   ├── ui/            ← HUD, layar menu, font
│   ├── items/         ← Collectible, power-up, dekorasi
│   ├── vfx/           ← Visual effects spritesheet
│   └── audio/         ← BGM dan SFX
├── docs/              ← Dokumentasi, spec, checklist
├── src/               ← Source code engine + game
│   ├── engine/        ← Core engine (loader, renderer, dll)
│   ├── game/          ← Game logic (player, enemy, level)
│   └── utils/         ← Utility helpers
├── levels/            ← Data level (JSON)
├── tools/             ← Pipeline & validation scripts
│   ├── pipeline/      ← Script processing asset
│   └── validation/    ← Script QA otomatis
└── build/             ← Output build per platform
```

---

## Konvensi Penamaan File

| Kategori | Format |
|---|---|
| Sprite sheet | `chr_[nama]_sheet.png` |
| Frame karakter | `chr_[nama]_[aksi]_00.png` |
| Tile environment | `env_[tema]_[jenis]_01.png` |
| UI element | `ui_[fungsi]_[state].png` |
| Item | `itm_[nama]_[state]_00.png` |
| BGM | `bgm_[scene]_01.ogg` |
| SFX | `sfx_[aksi].wav` |
| VFX sheet | `vfx_[nama]_sheet.png` |

---

## Dokumentasi

| File | Isi |
|---|---|
| `docs/project_config.json` | Konfigurasi teknis proyek |
| `docs/color_palette.json` | Palette resmi 16 warna |
| `docs/style_guide.md` | Panduan visual & pixel art |
| `docs/asset_manifest.json` | Manifest lengkap 58 assets |
| `docs/animation_config.json` | Konfigurasi semua animasi |
| `docs/tileset_config.json` | Konfigurasi tileset & schema level |
| `docs/production_checklist.md` | Checklist status produksi |

---

## Cara Menjalankan

```bash
# Buka di browser (development)
# Cukup serve folder root dengan HTTP server lokal
python -m http.server 8080
# Buka http://localhost:8080/index.html
```

---

## Integrasi MajaAdventure

Sumber utama aset: https://github.com/stmarya/MajaAdventure, diimpor dari
`MajaAdventure-main.zip` pada 16 Oktober 2026. Snapshot ZIP dipakai untuk integrasi
awal; versi GitHub mempertahankan riwayat repo sumber.

Salinan repo, dokumentasi sumber, arsip Base64 dan aset asli yang telah dipulihkan
disimpan di [staging/MajaAdventure](staging/MajaAdventure/README.md).
Folder staging hanya ada pada workspace integrasi lokal dan tidak diunggah.
Pada clone GitHub, sumber utama adalah `.asset-packs/` di root repo;
dokumentasi awal dipertahankan di [docs/README_ASSET_SOURCE.md](docs/README_ASSET_SOURCE.md).
Kelima paket telah diperiksa SHA-256 dan setiap file hasil ekstraksi dibandingkan
dengan isi arsip. Gambar/audio sumber sama dengan staging lama; engine Canvas,
level, UI yang sudah disesuaikan, dan pemilihan audio lokal dipertahankan.

Untuk membangun ulang sprite sheet dari sumber utama (memerlukan Pillow):

```powershell
# Pada clone GitHub baru, pulihkan paket dahulu (sekali saja):
python tools\restore_assets.py
# Di workspace ZIP lokal, paket sudah dipulihkan di staging/MajaAdventure.
python tools\pipeline\assemble_new_assets.py
# Atau tentukan folder repo lain yang paketnya sudah dipulihkan:
python tools\pipeline\assemble_new_assets.py --source "C:\path\ke\MajaAdventure"
```

Pipeline menulis ulang sprite sheet karakter, tileset, properti, item dan ikon
base pack pada lokasi yang sama dengan engine. Fauna kini menggunakan empat
frame asli Dunia Hidup, bukan kotak placeholder. Obor memakai sprite obor,
bukan bendera; efek benturan/debu juga memakai frame sumber.
Sheet fauna dan VFX baru menggunakan nearest-neighbor dan crop bersama untuk
menjaga pivot. VFX tetap tiga frame sesuai kontrak engine; frame keempat
tetap tersedia di repo sumber. Resolusi, collision, AI dan kontrol tidak diubah.

Paket Lima Bagian dan audio eksternal tetap tersedia sebagai bahan produksi,
bukan otomatis menjadi musuh, level, dialog atau soundtrack baru.
Lihat checklist sumber di `docs/CHECKLIST_ASET_MASTER.md` pada clone GitHub,
atau `staging/MajaAdventure/docs/CHECKLIST_ASET_MASTER.md` pada workspace ZIP.
Lisensi distribusi aset visual belum ditetapkan oleh repo sumber.
Audio eksternal berlisensi CC0; dokumen `AUDIO_EXTERNAL_CC0.md` di folder docs sumber
dipertahankan beserta dokumen lisensi di dalam paket.

Validasi integrasi:

```powershell
python -m unittest discover -s tools -p test_source_integration.py
node --test tools\test_fauna.mjs
python tools\test_sprite_dimensions.py
python tools\verify_imports.py
```

Backup sebelum integrasi tersedia di
`build/backups/before-maja-integration-20261016.zip`.

---

*Proyek ini menggunakan pipeline asset berbasis Python untuk validasi dan processing.*  
*Lihat `tools/` untuk script otomasi.*
