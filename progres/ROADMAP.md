# Roadmap MajaAdventure — target A: web desktop + keyboard

**Terakhir diperbarui:** 2026-10-30
**Target yang disepakati:** mulai dari web desktop + keyboard; mobile touch menjadi tahap berikutnya setelah kontrol inti stabil. Gamepad dan aplikasi native berada di luar target awal.  
**Status dokumen:** roadmap hidup. Status `Selesai` merujuk bukti yang tercatat di repo; bukan klaim bahwa game sudah siap rilis publik.

## Ringkasan

Proyek sudah memiliki fondasi vertical slice web: simulasi fixed-step, gameplay platformer, aset runtime terdaftar, tes regresi, browser smoke, dan build internal. Cabang `a0/asset-layout-ui-polish` menyiapkan draf implementasi A0: inventaris/checksum aset, penataan prop level, perbaikan referensi BGM/VFX, dan polish shell UI. Draf ini menunggu tinjauan pemilik dan playtest; bukan persetujuan final art, lisensi, atau rilis.

[Konsep visual dan peta sound Level 01](../docs/DESAIN_VISUAL_LEVEL_01.md) · [Mockup visual dan katalog aset](../docs/mockups/level01-visual-concept.html)

## Riwayat kegiatan dan hasil

| Tahap / tanggal | Kegiatan | Hasil yang tercatat | Status / batasan |
|---|---|---|---|
| 1 — 2026-10-16 | Stabilitas gameplay inti: collision per sumbu, fixed-step, input edge, respawn/checkpoint, exit, skor, dan regression tests | 19/19 tes Node dan 3/3 tes integrasi sumber lulus; Chromium smoke alur state lulus | Selesai di commit `7259c5b`; smoke otomatis bukan playtest manusia. [Detail Tahap 1](01-gameplay-inti.md) |
| 2 — 2026-10-16 | UX vertical slice: kontrol, pause/retry, status teks, kurangi kedipan, audio settings, checkpoint, combat dan traversal | 28/28 tes Node, 13 pemeriksaan smoke Chromium, 3/3 tes integrasi sumber lulus | Selesai di commit `187a0b4`; touch tetap eksperimental, game feel/balance dan playtest manusia masih terbuka. [Detail Tahap 2](02-vertical-slice.md) |
| 3 — 2026-10-16 | Pipeline aset dan build, manifest, validasi level, package allowlist/checksum, CI lintas OS, gerbang rilis publik | 42/42 tes Node; 3/3 source integration; 4/4 delivery; 13 pemeriksaan browser pada source dan paket; 53 aset runtime tanpa error teknis | Selesai di commit `a7c89cd` dan difinalisasi dokumentasinya di `4d570d0`; 25 aset masih deviasi palette/alpha, tujuh approval rilis menunggu, dan hasil Actions remote belum diverifikasi. Build publik memang diblokir. [Detail Tahap 3](03-produksi-distribusi.md) |
| 4 — 2026-10-29 | Review proyek, inventaris aset, diskusi target platform | Target A dipilih: web desktop + keyboard lebih dulu; mockup konsep dibuat memakai aset lokal yang sudah ada | Draft untuk review; dokumentasi/mockup dipush pada [`5afe9c2`](https://github.com/stmarya/MajaAdventure/commit/5afe9c2642b2a7163c6d09faf7c8e3159f6eb95a). Belum mengubah kode, data level, file aset, atau audio produksi. |
| 5 — 2026-10-29 | Revisi komposisi hero, Gobog, spike, reward, penjaga, dan landmark berdasarkan review | Gobog dipisah dari hero; spike diberi buffer pendaratan; penjaga dipisah dari hazard; buah Maja menjadi reward tunggal; hero dan penjaga dihadapkan satu sama lain; candi dibersihkan sebagai tujuan; peti tidak ditumpuk di viewport | Konsep v0.3 menunggu tinjauan pengguna. Dokumentasi/mockup saja; tidak mengubah runtime, koordinat level, file aset, atau audio produksi. |
| 6 — 2026-10-30 | Audit A0 aset, tata letak Level 01, referensi, dan shell UI | Inventaris CSV 838 baris (146 file `assets/` + 692 media arsip); 95 salinan arsip byte-identik; penataan candi/obor/palem; state UI hover/pressed/focus/disabled; overlay akhir dirapikan; referensi BGM dan contoh schema diperbaiki | Draf pada cabang `a0/asset-layout-ui-polish`; tidak ada file aset yang di-rename atau dihapus. QA otomatis dan visual awal lulus; menunggu review pemilik dan playtest A1. Tidak menyetujui art/lisensi atau rilis. |

Angka tes dan status Tahap 1–3 disalin dari laporan progres proyek, bukan hasil eksekusi ulang saat membuat dokumen ini. Catatan lengkap dan log per tahap tersedia di [indeks progres](README.md) dan folder `hasil/`.

## Arah desain sementara

- Pertahankan identitas pixel-art Majapahit dan gunakan aset yang sudah tersedia sebelum meminta aset baru.
- Susun adegan dalam lapisan yang terbaca: langit dan hutan jauh → landmark → jalur bermain → karakter/interaksi → foliage depan.
- Jaga ruang kosong untuk membaca bahaya, telegraph musuh, jalur lompat, dan area mendarat; hindari dekorasi yang menyamarkan hazard.
- Beri tiap action sebab-akibat yang jelas: persiapan → aksi → hit/landing/pickup → respons visual dan audio → recovery.
- Efek muncul karena event, bukan terus-menerus. Hormati preferensi pengurangan kedipan dan batasi visual yang tidak perlu.
- Jangan menganggap semua file/varian harus tampil bersamaan. Sprite sheet, frame, tombol state, layar menu, dan SFX digunakan pada konteksnya masing-masing.

## Roadmap berikutnya

| Urutan | Pekerjaan | Hasil yang diharapkan | Bukti / kriteria selesai | Status |
|---|---|---|---|---|
| A0 | Review mockup, audit aset, tata letak Level 01, dan polish UI bersama pemilik proyek | Inventaris, galeri aset, panduan layout, perbaikan awal prop/UI, lalu keputusan review sebelum menyebut A0 selesai | Tinjau [laporan A0](../docs/A0_REVIEW.md), [inventaris CSV](../docs/A0_inventaris_aset.csv), dan [galeri aset](../docs/mockups/galeri-aset-a0.html); cek visual/playthrough; catat perubahan atau persetujuan final | Draf disiapkan; menunggu tinjauan pemilik |
| A1 | Baseline playtest web desktop + keyboard tanpa bantuan pembuat | Catatan gerak, kebingungan, kematian, combat, dan sesi selesai | Catatan tester, browser/OS/commit, langkah reproduksi; pisahkan fakta dari opini | Belum mulai |
| A2 | Tuning gerak dan kontrol secara bertahap | Gerak terasa responsif dan konsisten pada browser desktop yang disepakati | Tes collision/regression dan playtest sebelum/sesudah; tidak menumpuk perubahan yang belum terukur | Belum mulai |
| A3 | Tata ulang pacing, object, hazard, checkpoint, dan action | Jalur aman, tantangan, jeda, dan hadiah mudah dibaca | Uji playthrough penuh; hazard tidak tertutup; pickup/checkpoint/combat memberi feedback benar | Belum mulai |
| A4 | Polish environment, animasi, impact, VFX | Hierarki foreground/background jelas; impact terbaca; efek tidak berlebihan | Review visual pada ukuran internal dan pembesaran pixel yang digunakan; cek opsi reduce-flash | Belum mulai |
| A5 | Listening review serta mix musik/SFX | Musik, ambience, dan SFX seimbang serta nyaman | Checklist audio pada headphone dan speaker, volume rendah/normal; keputusan varian direkam | Belum mulai |
| A6 | Validasi web desktop + keyboard di browser sasaran | Kandidat desktop yang repeatable dan bisa diuji | Jalankan tes teknis, source/package smoke, build bersih; periksa hasil CI Actions remote | Belum mulai |
| A7 | Evaluasi web mobile + touch setelah A stabil | Keputusan berbasis perangkat nyata apakah kontrol sentuh layak | Uji Android Chrome dan iOS Safari pada perangkat nyata sebelum menyatakan dukungan | Nanti / di luar A saat ini |
| A8 | Gerbang distribusi | Kandidat rilis hanya saat hak, art, audio, QA, dan bukti disetujui | Lengkapi approval sah, strict-art pass, playtest/listening review; jangan mengisi approval atas nama orang lain | Terblokir oleh approval yang masih pending |

## Ruang lingkup dan batasan

- Target awal: **web desktop + keyboard**. Browser/OS spesifik perlu dipilih dan dicatat sebelum menyebut matriks kompatibilitas selesai.
- Mobile touch adalah tahap selanjutnya; gamepad, native Windows/Android, dan “semua perangkat” tidak termasuk janji rilis pada tahap A.
- Perubahan pada mockup/roadmap tidak sama dengan implementasi. Tidak ada koordinat level, aset, lisensi, atau setting runtime yang disetujui melalui dokumen ini.
- Rilis publik tetap menunggu hak distribusi/lisensi, strict art, playtest manusia, listening review, dan matriks browser/perangkat.

## Catatan perubahan dokumen

- 2026-10-29 — Menambahkan target A, ringkasan progres historis, roadmap polish pengalaman, serta konsep visual awal berbasis aset lokal. **Dokumentasi/mockup saja; runtime belum diubah.** Commit: [`5afe9c2`](https://github.com/stmarya/MajaAdventure/commit/5afe9c2642b2a7163c6d09faf7c8e3159f6eb95a).
- 2026-10-29 — Merevisi mockup agar sprite/tile/HUD pada scene memakai ukuran sumber, panorama dipotong 1:1, dan preview desktop memakai pembesaran 3×. Audit aset: belum perlu art/sound baru untuk draft; reuse candi sebagai landmark exit, tunda platform satu arah (belum dipakai level), dan catat integrasi VFX slash sebagai pekerjaan runtime. Belum mengubah runtime, level, atau aset produksi. Revisi konsep dipush pada [`5f14bbf`](https://github.com/stmarya/MajaAdventure/commit/5f14bbfead77e8dd807c82e3098a60e66d4759f5).
- 2026-10-29 — Revisi komposisi v0.3 setelah review hero/musuh/hazard/reward/landmark: koin tidak lagi menimpa hero; hazard dan penjaga dipisahkan oleh area mendarat; efek hit statis dihapus; buah Maja menjadi satu reward yang jelas; candi diberi ruang sebagai tujuan dan peti disimpan untuk beat terpisah. Hanya mockup dan dokumentasi yang berubah; runtime, level, dan aset produksi tetap tidak berubah. Menunggu tinjauan pengguna. Mockup dan brief dipush pada [`99d057e`](https://github.com/stmarya/MajaAdventure/commit/99d057e72619a8f7f2ed1d5fd9d21652d2bba5c5).
- 2026-10-30 — Draf A0 menambahkan inventaris aset lengkap, panduan density/layer, dan laporan status. Di cabang review, penataan prop Level 01 serta shell UI diperbarui; metadata BGM dan contoh schema diperbaiki, dan rujukan coin-burst ke sheet yang tidak ada dihapus. Tidak ada file media yang di-rename atau dihapus. A0 belum disetujui; validasi/playtest dan review hak aset masih diperlukan. Lihat [laporan A0](../docs/A0_REVIEW.md).
- 2026-10-30 — Menambahkan [galeri aset interaktif](../docs/mockups/galeri-aset-a0.html) untuk menelusuri inventaris PNG/GIF, audio, dan berkas data runtime maupun paket arsip. Ini katalog peninjauan, bukan scene gameplay atau persetujuan aset.
