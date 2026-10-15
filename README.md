# MajaAdventure

Aset visual untuk platformer 2D bertema Majapahit, gaya pixel art 16-bit.

## Ambil PNG/GIF — tanpa crop manual

Paket disimpan **lossless dalam arsip ZIP terenkode Base64** di `.asset-packs/`.
Ini format transport penyimpanan karena koneksi unggah saat ini hanya menerima teks.
**PNG/GIF belum disimpan langsung sebagai file terpisah di GitHub.** Pulihkan ke folder kerja dengan Python 3 (tanpa dependensi tambahan):

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

| Paket | Folder setelah ekstraksi | PNG aset/frame | GIF preview |
|---|---|---:|---:|
| Base Pack | `assets/base-pack/` | 98 | 13 |
| Dunia Hidup 01 | `assets/expansions/dunia-hidup-01/` | 64 | 16 |
| Ekspansi 02 — Lima Bagian | `assets/expansions/lima-bagian-02/` | 80 | 16 |
| Paket03 — UI & audio draft | `assets/expansions/ui-audio-03/` | 48 | 0 |
| **Total** | | **290** | **45** |

Tambahan audio:2BGM OGG +8SFX WAV original sintetis, belum diuji dengar.
Katalog dan preview layar PNG tidak termasuk hitungan aset/frame. Tiap paket menyertakan README
serta manifest. PNG sudah dipisah per objek/gerakan; GIF hanya pratinjau animasi.
Folder `assets/` merupakan hasil ekstraksi yang dapat dibuat ulang dari paket.

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
Representasi sejarah bersifat interpretasi seni game. Belum ada lisensi
distribusi yang ditetapkan pada repository ini.
