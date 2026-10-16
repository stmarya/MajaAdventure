# Majapahit Platformer / MajaAdventure

Game platformer 2D bertema Majapahit, menggunakan HTML5 Canvas dan JavaScript modules. Native canvas 320×180; tampilan pixel-art nearest-neighbor.

**Versi 0.1.1 — kandidat vertical slice untuk playtest internal, belum rilis publik.** Target aktif: web + keyboard. Windows native belum dipaketkan; kontrol sentuh bersifat eksperimental, bukan sertifikasi Android.

## Menjalankan lokal

Prasyarat: Node.js ≥22, Python 3.13, Git. Jalankan dari root repo:

```sh
npm ci
python -m pip install -r requirements-dev.txt
python -m http.server 8080
```

Buka `http://localhost:8080` (jangan langsung `file://`). Semua aset runtime sudah dilacak di Git. Source pack opsional dapat direstorasi dengan `python tools/restore_assets.py`; bukan syarat menjalankan game.

Kontrol: A/D atau panah untuk bergerak, X/Space/panah atas melompat, Z menyerang, panah bawah untuk turun dari platform satu-arah, Esc pause, M mute. Tombol menu juga dapat dipakai dengan keyboard. F3 hanya mengaktifkan debug jika URL memiliki `?debug=1`. Lihat petunjuk pada layar; UI memiliki opsi volume dan pengurangan flashing. Canvas gameplay belum mendukung permainan nonvisual penuh.

## Pengujian dan build

```sh
npm test
python -m unittest discover -s tools -p test_source_integration.py
python -m unittest discover -s tools -p test_delivery.py
python tools/validation/validate_assets.py
npx playwright install chromium
npm run test:browser
python tools/build_web.py --channel internal
```

Browser smoke memakai Python HTTP server sementara. Pada Windows atau interpreter bernama `python`, atur `TEST_PYTHON=python` di environment. Chromium lokal opsional melalui `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Build allowlist menghasilkan `dist/web/`, ZIP internal, checksum, dan `BUILD_INFO.json`. Tidak menyertakan source pack, tools, node_modules, atau progres. `python tools/build_web.py --channel public` **sengaja gagal** selama hak distribusi, final-art, dan QA manusia belum disetujui. Build internal juga bukan pemberian hak distribusi aset.

## Dokumentasi tim

- [Progres dan detail push per tahap](progres/README.md)
- [Prosedur build dan gerbang rilis](docs/BUILD_RELEASE.md)
- [Checklist produksi](docs/production_checklist.md)
- [Protokol playtest manusia](docs/PLAYTEST.md)
- [Hak aset dan lisensi](docs/ASSET_RIGHTS.md)
- [Manifest runtime](docs/asset_manifest.json): 53 aset yang benar-benar dimuat, hash dan dimensi; manifest lama dipertahankan sebagai `asset_manifest.legacy.json`.
- [Style guide](docs/style_guide.md), [animasi](docs/animation_config.json), [tileset](docs/tileset_config.json).

Dokumentasi sumber awal tetap tersedia pada [README_ASSET_SOURCE](docs/README_ASSET_SOURCE.md) dan [checklist master aset](docs/CHECKLIST_ASET_MASTER.md).

## Pipeline aset

Pipeline lintas OS menggunakan `pathlib` dan nearest-neighbor. Uji kandidat tanpa menimpa runtime:

```sh
python tools/restore_assets.py
python tools/pipeline/assemble_new_assets.py --source . --output dist/asset-candidate
python tools/validation/validate_assets.py --strict-art
```

Kandidat pipeline **belum otomatis disetujui** sebagai final art. Validator saat ini masih menemukan deviasi palette/alpha pada runtime; jangan sekadar melonggarkan kebijakan agar tes hijau. Penggantian sprite memerlukan pemeriksaan visual tim. Hak visual, audio dan lisensi kode juga belum disahkan.

## CI

`.github/workflows/quality.yml`: unit/regression + integritas pack + pipeline/build pada Ubuntu/Windows; browser smoke dan ZIP internal pada Ubuntu. Tidak melakukan deployment. Hasil konfigurasi CI bukan bukti job remote sudah lulus—periksa tab Actions setelah push.
