# Tahap A0 — Audit aset, review tata letak, dan polish UI

**Status:** draf review pada cabang `a0/asset-layout-ui-polish`; belum dianggap persetujuan art, playtest, atau gerbang rilis.  
**Basis:** cabang dibuat dari `main` pada 2026-10-30.  
**Target:** web desktop + keyboard; mobile touch belum menjadi target A0.

## Ringkasan keputusan

- Inventaris lengkap tersedia di [`A0_inventaris_aset.csv`](A0_inventaris_aset.csv). Audit mencakup 146 berkas di `assets/` dan 692 media di paket sumber; total 838 baris aset/media.
- [Galeri aset interaktif](mockups/galeri-aset-a0.html) memudahkan peninjauan gambar, animasi, audio, dan varian dari inventaris. Jalankan server lokal dari root proyek; galeri ini adalah katalog, bukan level game.
- Tidak ditemukan nama generik seperti `asset1.png` atau `bg_old.png`. Tidak ada nama/path aset yang di-rename dan tidak ada berkas gambar/audio yang dihapus. Struktur direktori saat ini memberi konteks subjek pada nama frame berulang.
- Sembilan puluh lima anggota arsip merupakan salinan byte-identik dari aset di `assets/`; duplikasi byte-identik di antara 146 berkas `assets/` tidak ditemukan. Salinan arsip dipertahankan sebagai provenance.
- Layout Level 01 dirapikan pada data level: landmark candi dipindah ke tujuan akhir, obor dekoratif ganda dan dua palem yang mengganggu dihapus dari susunan level, serta obor/palem tersisa ditata ulang. Tilemap, collision, hazard, pickup, checkpoint, dan tujuan gameplay tidak diubah.
- Shell UI web mendapatkan state hover/pressed/focus/disabled dan tata letak responsif; tombol mute di canvas mendapat feedback hover/pressed dan penanganan pointer yang konsisten.
- A0 siap ditinjau pemilik, tetapi komposisi final, pengalaman bermain, hak aset, dan kelayakan rilis tetap belum disetujui.

## 1. Cakupan dan metode inventaris

Inventaris memeriksa file secara rekursif, mencatat ekstensi, kategori, status, lokasi lengkap, ukuran, dimensi gambar, SHA-256, dan hubungan salinan kanonis bila ada. Paket sumber ZIP diverifikasi dengan SHA-256 dari manifest sebelum anggota medianya dihitung. File lisensi, README, dan manifest tetap berada dalam paket sumber dan bukan baris media CSV.

Galeri browser mengindeks 838 baris yang sama dari CSV, menampilkan pratinjau langsung file `assets/`, dan mengekstrak media unik dari ZIP saat dibutuhkan. Buka [`Galeri aset A0`](mockups/galeri-aset-a0.html) lewat server lokal sesuai petunjuk di halaman.

| Cakupan | Hasil |
|---|---:|
| Berkas yang dilacak langsung di `assets/` | 146 |
| Aset media runtime pada `docs/asset_manifest.json` | 53 |
| Berkas data runtime tambahan dalam manifest | 4 |
| Total path dalam manifest (media + data) | 57 |
| Media dalam paket sumber | 692 |
| Baris dalam CSV (assets langsung + media arsip) | 838 |
| Salinan arsip byte-identik dengan `assets/` | 95 |
| Duplikat SHA-256 di antara file langsung `assets/` | 0 |

CSV memberi tiap berkas salah satu status yang membedakan **aktif runtime**, **varian/frame sumber**, **belum terintegrasi**, **kandidat audio**, dan **sumber lama yang tidak aktif**. Tidak tercantum di manifest saja tidak cukup untuk menyimpulkan bahwa suatu aset harus dihapus: frame animasi, state UI, alternatif audio, dan sumber berlisensi perlu dipertahankan sampai pemilik memutuskan sebaliknya.

### Konvensi penamaan yang dipakai ke depan

Pertahankan struktur direktori semantik dan gunakan pola `kategori_subjek_state-varian_nomor.ext` untuk file baru atau file yang kelak memang perlu diubah namanya. Contoh: `env_tree_oak_01.png`, `char_player_idle_01.png`, `ui_button_play_hover.png`, `sfx_checkpoint_activate_01.wav`. Nama kategori disarankan: `env`, `char`, `enemy`, `prop`, `itm`, `vfx`, `ui`, `bgm`, dan `sfx`. Nomor urut dua digit dipakai untuk rangkaian; suffix state harus mengikuti penggunaan sebenarnya.

Nama seperti `frame_00.png` tidak otomatis ambigu bila path lengkap sudah menyatakan subjek/urutan, misalnya `assets/environment/fauna/burung/frame_00.png`. Karena itu nama sumber tersebut dipertahankan. Jangan meratakan direktori atau mengganti nama file hanya untuk memenuhi pola bila tindakan itu berisiko merusak provenance atau referensi.

## 2. Changelog rename dan aset deprecated

### Changelog rename

| Nama/lokasi lama | Nama/lokasi baru | Keputusan |
|---|---|---|
| — | — | Tidak ada rename aset pada A0. Pemeriksaan nama dan path tidak menemukan nama generik yang perlu segera diperbaiki; struktur folder memberi konteks pada frame berulang. |

Tidak ada referensi yang perlu diubah akibat rename. Perubahan referensi non-rename yang dibuat pada cabang ini tercatat di bagian Project state.

### Aset lama dan rekomendasi

| Aset | Status dan bukti | Rekomendasi |
|---|---|---|
| `.asset-packs/ui-audio-03` → `menus/background.png` | Sumber menu draft yang tidak aktif; menu runtime memakai `assets/ui/screens/final/ui_screen_mainmenu.png`. | Pertahankan hanya di arsip sumber untuk provenance; jangan pulihkan ke jalur runtime kecuali desainnya dipilih kembali. |
| Frame fauna, animasi prop, VFX, state tombol, serta audio yang tidak terdaftar di manifest | Sumber atau varian; sebagian masih bisa menjadi kebutuhan fase berikut. | Jangan hapus/arsipkan ulang sebelum integrasi dan review pemilik. Statusnya belum aktif bukan bukti deprecated. |
| Audio eksternal CC0 dalam arsip | 331 kandidat audio, belum dipilih dan belum melalui listening review proyek. | Tetap di arsip; pilih hanya setelah review kebutuhan, kualitas, atribusi/syarat sumber, dan uji dengar. |

Tidak ada media fisik yang dihapus. Batasan tooling pada cabang ini juga tidak memerlukan operasi rename file biner.

## 3. Panduan tata letak environment

Panduan berikut merupakan target komposisi untuk iterasi Level 01, bukan hasil playtest atau aturan collision baru.

### Urutan layer yang disarankan

1. Langit dan warna dasar/background jauh.
2. Siluet hutan jauh atau lapisan parallax dengan kontras rendah.
3. Landmark latar (siluet gerbang/candi) dan pepohonan tengah yang tidak menutupi jalur.
4. Tilemap, platform, tepi jalur, dan hazard; siluet spike tetap terbaca.
5. Objek gameplay diurutkan menurut fungsi: checkpoint, pickup, interaksi, musuh, lalu player sesuai koordinat dan depth aktual.
6. VFX singkat di atas objek pemicunya; hindari efek dekoratif yang terus menyala.
7. Foliage foreground secukupnya, tidak melewati siluet player, musuh, pickup, hazard, atau tujuan.
8. HUD dan kontrol overlay berada di lapisan UI, terpisah dari kamera/scroll dunia.

### Density guide

- Jadikan ruang gerak sebagai prioritas. Mulai dengan satu fokus dekoratif utama per beat; hindari menumpuk landmark, obor, palem, dan reward pada satu garis baca.
- Gunakan klaster background kecil dan berjeda (sebagai titik awal, sekitar 18–24 tile antarkelompok), lalu validasi pada ukuran permainan aktual. Ini parameter review visual, bukan angka baku engine.
- Sisakan ruang negatif untuk siluet player, telegraph musuh, lompatan, dan landing. Pertahankan buffer pendaratan sekurangnya 32 px pada komposisi lompatan yang memakai spike, sesuai studi visual; uji ulang dengan kecepatan dan lompatan runtime.
- Jangan menaruh dekorasi foreground pada jalur pandang hazard atau pickup. Jika sebuah area tampak kosong, pastikan ruang itu memang membantu membaca aksi sebelum menambah aset.
- Obor/checkpoint harus terbaca sebagai penanda, bukan pola berulang rapat; hindari dua obor pada posisi berdekatan yang tampak seperti satu objek ganda.
- Gunakan pengulangan tile untuk lantai/tembok; variasikan prop hanya pada beat penting agar pola tiling tetap rapi.

### Zona Level 01 (200 × 20 tile)

| Zona tile-x | Fungsi visual/gameplay | Kepadatan dan susunan yang disarankan |
|---|---|---|
| 0–20 | Orientasi dan checkpoint awal | Satu penanda checkpoint yang jelas; beri ruang baca untuk player dan jalur awal. |
| 20–40 | Transisi ke tantangan pertama | Dekorasi ringan; jaga jarak dari tepi/jalur hazard dan jangan mengulang pohon/obor pada satu titik. |
| 40–80 | Ruang gerak dan pemulihan | Sisakan ruang aman untuk membaca dan memulihkan ritme; satu checkpoint/reward sesuai data level, tanpa menutup jalur. |
| 80–120 | Perubahan beat dan jeda | Pertahankan ruang baca/jeda; hindari landmark candi kedua yang menduplikasi tujuan akhir atau tumpukan prop di sekitar jalur musuh. |
| 120–160 | Checkpoint dan tantangan berikutnya | Tandai checkpoint, pertahankan ruang antarbeat, dan jauhkan dekorasi dari spike serta landing. |
| 160–200 | Pendekatan hadiah/gerbang | Kurangi kepadatan menjelang exit; jadikan candi sebagai framing tujuan, bukan hambatan di atas lintasan. |

Rentang zona di atas adalah pembagian kerja untuk review, bukan pemisahan level yang tersimpan sebagai objek engine.

### Perubahan layout Level 01 pada cabang A0

- Pasangan candi dipindah dari awal level (tile-x 10 dan 12) ke dekat exit (188 dan 190) agar landmark menegaskan arah tujuan.
- Pasangan candi duplikat di tile-x 90 dan 92 dihapus dari daftar objek level; pasangan tujuan akhir kini ditempatkan pada tile-y 14 agar berpijak di atas lantai, tidak melayang.
- Empat objek obor dekoratif lama (`torch_001`–`torch_004`) dihapus dari susunan level untuk menghilangkan duplikasi dengan rangkaian obor `prop_torch_001`–`prop_torch_005` yang sudah ada.
- Lima obor rangkaian yang tersisa ditempatkan pada tile-x 15, 59, 90, 129, dan 182 sebagai penanda berjeda.
- Dua palem dekoratif yang bertabrakan dengan beat hazard/landmark di tile-x 35 dan 90 dihapus; palem pendek di tile-x 160 digeser ke 168 untuk menambah jarak visual dari spike.
- Tidak ada tile collision, spike, checkpoint, item, enemy, atau koordinat exit gameplay yang diubah. Penempatan tetap harus divalidasi dengan playthrough A1.

## 4. Laporan perbaikan UI

| Area | Sebelum | Perubahan A0 | Batasan |
|---|---|---|---|
| Shell halaman | Panel dan tombol terasa seperti prototipe polos. | Hierarki judul/status, panel canvas, spacing, palet gelap pixel-art, garis aksen emas, dan kontrol responsif dirapikan. | Tidak mengganti ilustrasi/tekstur utama. |
| Tombol DOM | Respons visual terbatas dan fokus keyboard kurang menonjol. | State hover, active/pressed, disabled, `focus-visible`, ukuran target sentuh, dan transisi singkat ditambahkan. | Transisi dibatasi; `prefers-reduced-motion` mengurangi gerakan. |
| Kontrol mute dalam canvas | Feedback pointer hanya terjadi saat aktivasi. | Hover/pressed diberi highlight; pointer capture, hit-test, pembatalan, dan perubahan kursor ditangani agar aktivasi konsisten. | State keyboard ditangani shell/keyboard game; bukan aset tombol baru. |
| State akhir dan sentuh | Overlay statistik game over/selesai memakai atlas font dengan glyph berulang sehingga menimpa CTA; kontrol sentuh juga muncul saat menu/jeda. | Overlay statistik duplikatif di canvas dihilangkan; judul/CTA memakai artwork yang sudah ada, ringkasan skor/koin/waktu tetap di status DOM yang dapat diakses. Kontrol sentuh disembunyikan di luar gameplay. | Font bitmap belum diperbaiki/diganti; mobile tetap eksperimental dan bukan target rilis A0. |
| Aset UI | Ada state sumber yang belum terhubung ke seluruh kontrol. | Aset lama dipertahankan; tidak dibuat file gambar baru untuk menghindari duplikasi art. | Approval hak distribusi aset dan review art masih tertunda. |

Perbaikan ini memoles shell dan feedback interaksi web, bukan desain ulang semua layar pixel-art di dalam canvas. Status layar menu/jeda dan HUD dalam canvas masih perlu diuji pada sesi bermain dan dapat menjadi pekerjaan A4 setelah baseline A1.

## 5. Project state setelah A0 (draf)

### Perubahan yang ada pada cabang

- `index.html`: shell visual, tata letak responsif, state tombol dan aksesibilitas fokus/reduced-motion.
- `src/engine/main.js`: feedback hover/pressed serta pointer handling kontrol mute di canvas.
- `levels/level_01.json`: koreksi metadata BGM ke file yang tersedia, penataan prop dekoratif, candi menuju exit.
- `docs/animation_config.json`: rujukan sheet coin-burst yang tidak ada dihapus; konfigurasi tidak lagi menunjuk ke path biner yang hilang. Runtime masih menggunakan fallback VFX yang ada.
- `docs/level_schema.json`: contoh BGM diselaraskan ke file yang tersedia.
- `docs/README_ASSET_SOURCE.md`: hitungan isi arsip dan file langsung diselaraskan dengan checksum aktual.
- Dokumen ini dan `A0_inventaris_aset.csv`: keputusan audit, mapping status, layout guide, serta inventaris penuh.

### Validasi dan tindak lanjut

- QA setelah perubahan: 42/42 tes Node, 3/3 integrasi sumber, 4/4 tes delivery, 13 pemeriksaan browser smoke, build internal 78 file runtime; manifest tetap 53 aset runtime dengan 0 error teknis.
- Screenshot menu, gameplay, jeda, game over, dan level selesai diperiksa pada desktop; menu/gameplay/jeda juga diperiksa pada lebar 390 px. Area exit diperiksa di desktop: candi sekarang berpijak di lantai dan membingkai jalur, bukan melayang. Tidak ada overflow horizontal (lebar dokumen 390 px) atau error JavaScript pada sesi screenshot.
- Validator masih mencatat 25 deviasi palette/alpha. Karena itu, hasil teknis lulus tidak berarti art final atau rilis disetujui.
- Minta pemilik meninjau inventaris, keputusan menyimpan aset lama, komposisi exit, dan arah UI.
- Jalankan playtest A1 sebelum menyatakan jarak hazard, landing, checkpoint, atau density sudah final.
- Lakukan listening review audio dan cek hak/licensing secara terpisah. Lulusnya tes teknis bukan persetujuan art/lisensi.

**Status gerbang:** A0 adalah draf implementasi untuk review. A1 belum dimulai; A0 belum memperoleh persetujuan final; tidak ada klaim siap rilis.