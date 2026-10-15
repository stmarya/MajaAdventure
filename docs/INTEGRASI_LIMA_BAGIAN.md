# Integrasi lima bagian — rencana, belum implementasi

## 1. Lingkungan bergerak
- Air terjun/sungai/sulur: loop sesuai manifest, kemudian uji timing dan pivot.
- Kabut: layer belakang, opacity/kecepatan dikendalikan engine; jangan menutupi hazard.
- Daun/fauna: spawn terbatas, lintasan di engine, variasikan fase animasi agar tidak serempak.

## 2. Properti interaktif
- Tuas mengubah flag, kemudian membuka gerbang. Urutan pose tuas perlu disesuaikan.
- Gerbang: collision tetap aktif sampai ruang lewat cukup terbuka.
- Jembatan/platform: utuh → retak → pecah → debris. Collision harus mengikuti state.
- Checkpoint: simpan lokasi respawn, mainkan aktivasi sekali, lalu loop aktif.

## 3. Penghuni & musuh
- Pemanah: pose persiapan/bidik tersedia. Projectile dan event release belum dibuat.
- Penjaga perisai: pose pertahanan/serang tersedia; blocking dan damage arah belum dibuat.
- Babi hutan: empat pose lari; usulan AI patrol → bersiap → charge → recovery.
- Pedagang: empat pose idle/gestur; dialog, toko dan item belum dibuat.
- Musuh baru belum memiliki set idle/run/hit/death lengkap.

## 4. Efek aksi
- Hubungkan percikan air ke kontak permukaan air.
- Serpihan kayu/gerabah ke event pecah, bukan terus-menerus.
- Poof kalah saat HP habis; sembunyikan efek setelah animasi selesai.
- Efek tidak memiliki collision; jangan gunakan GIF sebagai sistem VFX engine.

## 5. Variasi area
- Desa: rumah, sumur, gerobak, pagar bambu.
- Candi: tangga bata, panggung batu, pilar, pedupaan.
- Sungai: jembatan, batu pijakan, tebing sungai, alang-alang.
- Hutan: akar besar, batu berlumut, akar gantung, platform gantung.
- Ini 16 objek modular, bukan level siap main atau tile terrain seamless.

## Sebelum rilis
- Pilih engine, target platform dan resolusi gameplay.
- Selaraskan ukuran hero, NPC, musuh dan props antar-paket.
- Atur collision sederhana, pivot, sorting layer dan import nearest-neighbor.
- Uji outline, visibility, looping serta bentuk yang berubah antarfame AI.
- Buat vertical slice dahulu sebelum memperluas seluruh level.
