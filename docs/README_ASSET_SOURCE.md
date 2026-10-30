# MajaAdventure

Aset visual untuk platformer 2D bertema Majapahit, gaya pixel art 16-bit.

## Arsip sumber dan aset runtime

Arsip sumber disimpan **lossless dalam ZIP terenkode Base64** di `.asset-packs/`.
Arsip ini menjaga bahan sumber dan varian yang belum dipilih. Aset yang benar-benar
dipakai game juga sudah diekstrak dan dilacak langsung di `assets/`; manifest runtime
resminya adalah `docs/asset_manifest.json`. Jangan menyamakan arsip sumber dengan
paket runtime atau persetujuan art/lisensi.

Untuk memulihkan arsip ke folder kerja dengan Python 3 (tanpa dependensi tambahan):

```sh
git clone https://github.com/stmarya/MajaAdventure.git
cd MajaAdventure
python3 tools/restore_assets.py
```

Di Windows, gunakan `py tools/restore_assets.py` jika perintah `python3` tidak tersedia.
Skrip memeriksa SHA-256 dan menolak menimpa folder yang sudah berisi file.
Untuk mengambil hanya paket baru setelah `git pull`, jalankan:

```sh
python3 tools/restore_assets.py --pack ui-audio-03
```

| Paket | Folder setelah ekstraksi | PNG | GIF | Audio |
|---|---|---:|---:|---:|
| Base Pack | `assets/base-pack/` | 98 | 13 | — |
| Dunia Hidup 01 | `assets/expansions/dunia-hidup-01/` | 68 | 16 | — |
| Ekspansi 02 — Lima Bagian | `assets/expansions/lima-bagian-02/` | 85 | 16 | — |
| Paket03 — UI & audio draft | `assets/expansions/ui-audio-03/` | 55 | 0 | 2 OGG + 8 WAV |
| **Total paket visual** | | **306** | **45** | |

Hitungan di atas diverifikasi dari isi ZIP dan checksum arsip pada audit A0
(2026-10-30); angka yang lebih lama pada dokumen sebelumnya telah diperbarui.
Paket audio eksternal berisi 330 OGG + 1 MP3 (331 berkas). Seluruh audio eksternal
tetap kandidat dan tidak otomatis masuk runtime.

Untuk meninjau katalog gambar, animasi, berkas audio, dan aset arsip lewat browser,
buka [Galeri aset A0](mockups/galeri-aset-a0.html) melalui server lokal dari folder proyek.

## Audio eksternal CC0 — sumber gratis

**331 file audio eksternal** telah ditambahkan sebagai paket terpisah, bukan hasil sintesis proyek.

| Jenis | File |
|---|---:|
| Voiceover Inggris |92|
| SFX RPG/foley/senjata |51|
| SFX UI |100|
| Jingle pendek |85|
| BGM |2|
| Ambience |1|
| **Total** |**331**|

Pulihkan setelah `git pull`:

```sh
python3 tools/restore_assets.py --pack external-audio-cc0
```

Folder hasil:`assets/audio/external-cc0/`. Lihat [lisensi, sumber dan kredit](docs/AUDIO_EXTERNAL_CC0.md).
Audio ini masih kandidat dan belum diuji dengar/diintegrasikan;tidak semua file harus digunakan.
Seluruh sumber terpilih menyatakanCC0. Lisensi sumber disertakan per paket/track.

Draft lama2BGM+8SFX sintetis tetap tersimpan terpisah di ui-audio-03, bukan bagian paket eksternal.

Tiap paket menyertakan README dan manifest. GIF adalah pratinjau animasi. Direktori
`assets/` memuat 146 file yang dilacak langsung; 53 berkas media tercatat sebagai
aset runtime. Manifest juga mencatat 4 berkas data runtime, satu di antaranya berada
di `assets/` dan tiga lainnya berada di `docs/` atau `levels/`. Sebanyak 95 anggota arsip media merupakan salinan byte-identik dari
file di `assets/` dan dipertahankan untuk menjaga provenance. Duplikasi di dalam
folder `assets/` sendiri tidak ditemukan berdasarkan SHA-256.

## Cakupan lima bagian

1. **Lingkungan bergerak:** obor/tanaman/fauna dari Dunia Hidup, ditambah air terjun, sungai, kabut pixel dan sulur.
2. **Properti interaktif:** guci/peti/checkpoint, ditambah tuas, gerbang, jembatan rusak dan platform rapuh.
3. **Penghuni & musuh:** prajurit/monyet, ditambah pemanah, penjaga perisai, babi hutan dan NPC pedagang.
4. **Efek aksi:** debu/tebasan/benturan/koin, ditambah air, kayu, gerabah dan poof kalah.
5. **Variasi area:** 16 properti statis terpisah untuk desa, halaman candi, tepi sungai dan hutan dalam.

Ini **paket visual**, bukan game atau empat level yang sudah bisa dimainkan.
Engine belum ditentukan. Collision, AI, projectile, loot, dialog, trigger, audio,
pivot dan penyesuaian skala/timing masih perlu implementasi dan pengujian.
Beberapa rangkaian baru berupa pose/state, bukan set animasi karakter lengkap.
Air dan terrain belum dijamin seamless.

## Fokus saat ini: lengkapi aset dahulu

Belum masuk pembuatan kode gameplay. Animasi hero/musuh tambahan serta layer parallax
masih belum tersedia karena layanan generasi gambar gagal. Lihat checklist untuk status jujur tiap aset.

## Langkah berikutnya

- [Checklist aset master](docs/CHECKLIST_ASET_MASTER.md)
- [Persiapan vertical slice](docs/PERSIAPAN_VERTICAL_SLICE.md)
- [Cakupan dan integrasi lima bagian](docs/INTEGRASI_LIMA_BAGIAN.md)

Aset dibuat dengan bantuan AI dan diproses menjadi sprite terpisah.
Representasi sejarah bersifat interpretasi seni game. Audio eksternal tetap mengikutiCC0 dari sumbernya;lisensi distribusi untuk proyek dan aset visual
repository ini belum ditetapkan.
