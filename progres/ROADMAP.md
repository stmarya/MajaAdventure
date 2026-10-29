# Roadmap MajaAdventure — target A: web desktop + keyboard

**Terakhir diperbarui:** 2026-10-29  
**Target yang disepakati:** mulai dari web desktop + keyboard; mobile touch menjadi tahap berikutnya setelah kontrol inti stabil. Gamepad dan aplikasi native berada di luar target awal.  
**Status dokumen:** roadmap hidup. Status `Selesai` merujuk bukti yang tercatat di repo; bukan klaim bahwa game sudah siap rilis publik.

## Ringkasan

Proyek sudah memiliki fondasi vertical slice web: simulasi fixed-step, gameplay platformer, aset runtime terdaftar, tes regresi, browser smoke, dan build internal. Tahap selanjutnya berfokus pada kualitas pengalaman—gerak, action/combat, penataan objek, efek, lingkungan, dan sound—dengan playtest manusia dan perbaikan kecil yang bisa diukur. Mockup dan desain visual tahap sekarang adalah **draft diskusi**; belum diterapkan ke runtime atau layout level produksi.

[Konsep visual dan peta sound Level 01](../docs/DESAIN_VISUAL_LEVEL_01.md) · [Mockup visual dan katalog aset](../docs/mockups/level01-visual-concept.html)

## Riwayat kegiatan dan hasil

| Tahap / tanggal | Kegiatan | Hasil yang tercatat | Status / batasan |
|---|---|---|---|
| 1 — 2026-10-16 | Stabilitas gameplay inti: collision per sumbu, fixed-step, input edge, respawn/checkpoint, exit, skor, dan regression tests | 19/19 tes Node dan 3/3 tes integrasi sumber lulus; Chromium smoke alur state lulus | Selesai di commit `7259c5b`; smoke otomatis bukan playtest manusia. [Detail Tahap 1](01-gameplay-inti.md) |
| 2 — 2026-10-16 | UX vertical slice: kontrol, pause/retry, status teks, kurangi kedipan, audio settings, checkpoint, combat dan traversal | 28/28 tes Node, 13 pemeriksaan smoke Chromium, 3/3 tes integrasi sumber lulus | Selesai di commit `187a0b4`; touch tetap eksperimental, game feel/balance dan playtest manusia masih terbuka. [Detail Tahap 2](02-vertical-slice.md) |
| 3 — 2026-10-16 | Pipeline aset dan build, manifest, validasi level, package allowlist/checksum, CI lintas OS, gerbang rilis publik | 42/42 tes Node; 3/3 source integration; 4/4 delivery; 13 pemeriksaan browser pada source dan paket; 53 aset runtime tanpa error teknis | Selesai di commit `a7c89cd` dan difinalisasi dokumentasinya di `4d570d0`; 25 aset masih deviasi palette/alpha, tujuh approval rilis menunggu, dan hasil Actions remote belum diverifikasi. Build publik memang diblokir. [Detail Tahap 3](03-produksi-distribusi.md) |
| 4 — 2026-10-29 | Review proyek, inventaris aset, diskusi target platform | Target A dipilih: web desktop + keyboard lebih dulu; mockup konsep dibuat memakai aset lokal yang sudah ada | Draft untuk review; dokumentasi/mockup dipush pada [`5afe9c2`](https://github.com/stmarya/MajaAdventure/commit/5afe9c2642b2a7163c6d09faf7c8e3159f6eb95a). Belum mengubah kode, data level, file aset, atau audio produksi. |

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
| A0 | Review mockup, arah art, urutan beat level, dan sound map bersama pemilik proyek | Komposisi dan daftar perubahan disepakati sebelum implementasi | Persetujuan pada draft; keputusan yang masih terbuka ditulis | Sedang didiskusikan |
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
