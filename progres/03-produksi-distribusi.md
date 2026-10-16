# Tahap 3 — Produksi dan distribusi internal

Tanggal: 2026-10-16. Branch: `main`.
Pesan commit: `build(stage-3): add validated internal web delivery and public release gates`.

## Perubahan

- Pipeline source-pack menggunakan path portabel lintas OS, nearest-neighbor, mempertahankan alpha sumber tanpa perkalian mask ganda, dan output kandidat terpisah melalui `--output`.
- Tidak mengganti sprite runtime massal tanpa review art. Kandidat hasil pipeline perlu penilaian manusia.
- Manifest v2 memuat 53 aset runtime aktual dengan hash/dimensi/status hak; manifest historis tetap disimpan terpisah.
- Validator membedakan error teknis dan utang final-art. Kebijakan 16 warna/alpha tidak dilonggarkan.
- Validasi batas data level sebelum inisialisasi; trigger spike mengikuti koordinat Y data, bukan baris hardcoded.
- Watchdog gambar 10 detik dan settle-once; timer loader dibersihkan saat selesai.
- Build web allowlist (78 file runtime + BUILD_INFO), ZIP/checksum deterministik untuk snapshot dan toolchain sama; source pack, node_modules, tools dan progres tidak masuk paket.
- Build publik memerlukan tujuh persetujuan bernama beserta evidence dan strict-art pass. Semua approval tetap false; tidak ada lisensi baru, approval palsu, deployment atau rilis publik.
- Workflow CI Ubuntu/Windows untuk unit, source pack dan delivery; Chromium/source+package smoke dan artifact internal pada Ubuntu. CI telah dikonfigurasi, hasil job remote belum diverifikasi.
- README, checklist, hak aset dan panduan build diperbarui. Target aktif web+keyboard; Windows native/Android belum siap rilis.

## Hasil pengujian lokal

Lingkungan: Linux, Node 24, Python 3.13. Pipeline/integrasi juga diuji memakai venv terpisah dengan dependency dipin Pillow 11.3.0. Browser: Chromium headless via Playwright 1.64.1; bukan matriks browser/perangkat nyata.

| Pemeriksaan | Hasil |
|---|---|
| Node/regression + malformed level + watchdog | 42/42 lulus |
| Integrasi source pack | 3/3 lulus; juga lulus dengan Pillow dipin |
| Delivery: validasi runtime, allowlist/reproducibility, public block, restore+candidate pipeline | 4/4 lulus; juga lulus dengan Pillow dipin |
| Browser smoke source | 13 pemeriksaan lulus |
| Browser smoke paket runtime hasil build | 13 pemeriksaan lulus |
| Import JavaScript | Seluruh 20 file src terverifikasi |
| Runtime manifest | 53 aset; 0 error teknis |
| Strict art | Expected failure, exit 1; 25 aset masih menyimpang |
| Build publik | Expected failure, exit 1; seluruh approval pending + strict-art belum lolos |
| Build internal | Berhasil; checksum tersimpan dalam log |

Lihat `hasil/tahap-3-*`. ZIP lokal dibuat dari working tree saat implementasi: sumber dasar masih commit tahap 2 dengan `dirty_worktree=true`. Hash file dalam BUILD_INFO mengidentifikasi konten yang diuji; ZIP ini bukan release artifact dari commit tahap 3 yang bersih. Kandidat bersama harus dibangun ulang dari commit yang dipush/CI.

## Batasan dan tindak lanjut

- Belum menguji Windows secara lokal; workflow lintas OS bukan bukti eksekusi remote.
- Traversal otomatis tidak menggantikan playtest manusia. Endpoint browser retry/exit memakai injeksi posisi dalam runner saja.
- Final-art, lisensi visual/audio/kode, listening review, game feel/balance, browser matrix/perangkat nyata dan aksesibilitas penuh masih terbuka.
- Tidak ada deployment publik. Tim harus melengkapi bukti di `docs/release_approvals.json` secara sah sebelum build publik.

SHA push aktual dicatat pada `push-log.json` setelah konfirmasi GitHub dalam commit finalisasi dokumentasi; tidak menggunakan hash buatan atau hash self-referential.
