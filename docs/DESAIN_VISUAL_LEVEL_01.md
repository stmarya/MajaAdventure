# Konsep visual Level 01 — MajaAdventure

**Status:** draft untuk diskusi, belum implementasi.  
**Target desain sekarang:** web desktop + keyboard (A).  
**Tujuan:** menyepakati cara membaca lingkungan, karakter, object, action, effects, dan sound sebelum mengubah aset produksi atau koordinat level.

## Preview

Mockup memakai PNG yang sudah ada di `assets/`; halaman HTML juga memuat katalog seluruh PNG serta pemutar manual untuk seluruh file audio yang tersedia. Aset varian dan state ditampilkan sebagai katalog, bukan ditumpuk sekaligus ke dalam satu layar gameplay.

[Buka mockup visual dan katalog aset](mockups/level01-visual-concept.html)

## Arah visual sementara

- **Tema:** jalur reruntuhan Majapahit di dalam hutan—kontras batu bata, kanopi, dan landmark candi dari aset yang tersedia.
- **Gaya:** pertahankan pixel-art dan nearest-neighbor; jangan menambah blur, glow, atau upscale yang mengaburkan piksel.
- **Kedalaman:** langit → hutan jauh → landmark/pepohonan → jalur tile dan hazard → karakter/item → foliage foreground secukupnya.
- **Hierarki:** player dan ancaman menjadi fokus; landmark seperti gerbang/candi memberi orientasi; dekorasi tidak boleh menutupi collision atau telegraph.
- **Motion:** perubahan pose harus mengikuti aksi (run, jump, attack, hurt, land), sementara kamera mengikuti tanpa membuat jalur sulit dibaca. Nilai timing final harus ditentukan lewat playtest, bukan asumsi.

## Komposisi contoh

Mockup satu layar menggunakan scene internal 320×180. Komposisi contoh menempatkan hero di kiri-tengah, lawan di depan dengan ruang untuk membaca serangan, koin membentuk petunjuk lompatan, spike dalam satu klaster terlihat, checkpoint obor dan hadiah tidak menumpuk di jalur bahaya, serta landmark candi di sisi tujuan. Ini **contoh komposisi**, bukan salinan koordinat final level.

### Beat level yang diusulkan

| Zona konseptual | Fungsi | Penataan object/action yang diusulkan |
|---|---|---|
| 1 · Pembuka | Orientasi dan latihan aman | Mulai di jalur yang terbaca; kenalkan bergerak/lompat dan koin sebelum ancaman padat. |
| 2 · Tantangan pertama | Menguji satu kemampuan per beat | Tampilkan hazard sebelum pemain harus bereaksi; sediakan ruang ancang dan tempat mendarat yang tampak. |
| 3 · Jeda/checkpoint | Memulihkan dan memberi orientasi | Letakkan obor, buah Maja atau peti sebagai titik baca/reward dengan ruang aman. |
| 4 · Combat | Mengajari baca telegraph dan strike | Jaga jarak musuh dari hazard; urutkan persiapan musuh → kesempatan merespons → strike → feedback hit → recovery. |
| 5 · Penutup | Menggabungkan kemampuan | Gunakan landmark/gerbang yang mudah dikenali; hindari memasukkan ancaman baru di detik terakhir. |

Pembagian zona ini perlu dicocokkan dengan koordinat aktual `levels/level_01.json` dan playtest; jangan memindahkan object sampai draft disetujui.

## Peran aset dan action

- **Player & musuh:** gunakan warrior, soldier, dan monkey yang sudah ada. Serangan perlu punya pose awal, frame hit yang terbaca, serta recovery; musuh perlu telegraph yang cukup jelas.
- **Tiles & hazard:** batu, rumput, tangga, platform satu arah, dan spike membedakan jalur aman dari area bahaya. Jangan menyelesaikan masalah keterbacaan dengan menambah dekorasi.
- **Reward/interaksi:** Gobog untuk pickup, buah Maja untuk pemulihan, chest untuk reward, obor untuk checkpoint. Beri satu feedback utama per event.
- **VFX:** dust untuk landing, slash untuk serangan, hit hanya saat hit terkonfirmasi, coin burst saat pickup, torch/checkpoint saat aktivasi. Hindari efek terus aktif yang menyita perhatian.
- **Environment:** background jauh/parallax memberi kedalaman; foreground dipakai hemat agar tidak menutupi karakter, item, atau hazard.
- **UI:** health, Gobog/score, pause, mute dan settings harus mudah dibaca; menu/overlay memakai tombol dan panel yang sudah ada. State pressed/disabled hanya muncul saat state tersebut berlaku.

## Sound map untuk listening review

| Event/konteks | Aset kandidat sekarang | Cara review |
|---|---|---|
| Menu | `bgm_mainmenu_01.wav`, `bgm_mainmenu_02.ogg` | Bandingkan loop dan level suara; jangan putar otomatis saat halaman dibuka. |
| Level | `bgm_level01_01.wav`, `bgm_level01_02.ogg` | Bandingkan varian; cek apakah musik mengganggu cue penting. |
| Suasana hutan | `sfx_ambient_jungle.wav` | Jadikan ambience lembut/berkelanjutan; dengarkan loop untuk klik atau jeda. |
| Lompat / keris | `sfx_jump.wav`, `sfx_attack_keris.wav` | Sinkronkan dengan awal aksi dan frame strike yang benar. |
| Pickup / reward | `sfx_coin_pickup.wav`, `sfx_chest_open.wav` | Singkat, jelas, tidak saling menumpuk bila beberapa item diambil cepat. |
| Damage / hazard | `sfx_damage_hit.wav`, `sfx_spike_trap.wav` | Bedakan sumber damage; cek kenyamanan dan volume puncak. |
| Progress / akhir sesi | `sfx_checkpoint.wav`, `sfx_gameover.wav`, `sfx_levelcomplete.wav` | Jadikan feedback state yang berbeda; uji transisi dari gameplay ke menu/akhir level. |

Semua file audio di atas tersedia untuk dipreview di mockup. Ini belum berarti semua varian sudah disetujui untuk runtime atau distribusi.

## Cara mengubah draft menjadi keputusan

1. Review mockup pada ukuran desktop dan mobile-narrow; sepakati komposisi serta apakah arah visualnya sesuai.
2. Jalankan playtest baseline desktop + keyboard tanpa mengubah gerak dahulu.
3. Buat daftar masalah berurutan menurut dampak pada keterbacaan, kontrol, dan kelancaran.
4. Ubah satu kelompok nilai/asset pada satu waktu; catat hasil sebelum/sesudah dan tes yang dijalankan.
5. Setelah gerak dan level stabil, lakukan review environment/VFX serta listening review.
6. Baru rencanakan touch/mobile; dukungan perangkat harus dibuktikan dengan uji perangkat nyata.

## Yang belum disetujui

- Koordinat final object, jarak antarhazard, dan komposisi semua bagian level.
- Timing animasi/motion dan damage balance setelah playtest.
- Varian BGM final, volume mix, serta persetujuan distribusi musik/efek.
- Final art: catatan validator saat ini masih menyebut deviasi palette/alpha; mockup tidak mengubah atau menyetujui aset.
- Dukungan mobile touch, gamepad, native build, dan matriks browser di luar target A.
