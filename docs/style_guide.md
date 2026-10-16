# Style Guide — Majapahit Platformer
**Versi 1.0.0 | Visual Style: 16-bit Pixel Art**

---

## 1. Prinsip Dasar

Seluruh visual dalam proyek ini mengikuti estetika **16-bit pixel art era SNES/Mega Drive** yang diadaptasi
ke dalam konteks budaya Kerajaan Majapahit (abad ke-13–15 M). Konsistensi visual adalah prioritas utama.

**Tiga hukum yang tidak dapat dilanggar:**
1. **Tidak ada anti-aliasing.** Setiap pixel harus fully opaque atau fully transparent.
2. **Tidak ada warna di luar 16 warna resmi** (lihat `docs/color_palette.json`).
3. **Sumber cahaya selalu dari kiri atas (sudut ~45°)** di semua sprite tanpa kecuali.

---

## 2. Color Palette Majapahit 16-bit

| ID | Nama | Hex | Penggunaan Utama |
|---|---|---|---|
| 0 | Hitam Tua | `#2B1810` | Outline semua sprite |
| 1 | Coklat Gelap | `#5C2E1A` | Shadow kayu & kulit |
| 2 | Coklat Kayu | `#8B4513` | Kayu, handle keris |
| 3 | Merah Bata | `#C1440E` | Udeng, bata andesit shadow |
| 4 | Merah Terakota | `#E8623A` | Highlight bata, kain |
| 5 | Emas Tua | `#D4A017` | Tunik hero, frame UI |
| 6 | Kuning Emas | `#F5C842` | Koin Gobog mid-tone |
| 7 | Krem Terang | `#FDEEA0` | Highlight koin, teks |
| 8 | Hijau Gelap | `#2D5016` | Shadow daun, canopy |
| 9 | Hijau Hutan | `#4A7C2F` | Daun mid-tone, lumut |
| 10 | Hijau Daun | `#7AB648` | Highlight daun, buah Maja |
| 11 | Biru Indigo | `#1A3A5C` | Jarik batik shadow |
| 12 | Biru Langit | `#2E6B9E` | Langit, jarik mid-tone |
| 13 | Pasir Kulit | `#C8A882` | Kulit semua karakter |
| 14 | Putih Gading | `#F0EBD8` | Teks UI, bendera putih |
| 15 | Abu Batu | `#7A6650` | Zirah enemy, batu relief |

**Gunakan `#F0EBD8` (Putih Gading) — BUKAN `#FFFFFF` (pure white).**  
**Gunakan `#2B1810` (Hitam Tua) — BUKAN `#000000` (pure black).**

---

## 3. Proporsi Karakter

### 3.1 Karakter Utama (Warrior)
```
Canvas frame: 48 × 48 px
┌─────────────────┐
│   [KEPALA]      │  ← 16px tinggi (termasuk udeng)
│   [BADAN ATAS]  │  ← 16px tinggi (tunik emas)
│   [BADAN BAWAH] │  ← 16px tinggi (jarik batik)
└─────────────────┘
Lebar bahu:  12–14 px
Lebar kaki:  4–6 px per kaki (saat berdiri)
Lebar keris: 8–10 px (bilah) × 12–14 px (panjang)
```

### 3.2 Enemy Soldier
```
Canvas frame: 48 × 52 px (lebih tinggi dari hero)
Rasio kepala-badan: 1:3.25
Bahu lebih lebar (14–16px) → kesan mengancam
Tombak: minimal 30px panjang total
```

### 3.3 Enemy Monkey
```
Canvas frame: 32 × 32 px
Postur membungkuk (badan lebih rendah dari hero)
Kepala proporsional besar (1:2 terhadap badan)
```

### 3.4 Aturan Simetri
- Semua karakter digambar **menghadap kiri** sebagai default.
- Engine akan `flip horizontal` secara programatik untuk arah kanan.
- **Jangan buat frame kanan** secara manual — redundan dan membuang storage.

---

## 4. Shading & Highlight

### 4.1 Sistem 3 Tone
Setiap material hanya boleh menggunakan **maksimal 3 tone**:
```
GELAP  → tone paling rendah (biasanya dari pasangan warna palette)
MID    → warna utama material
TERANG → 1–2px area highlight di sudut kiri atas permukaan
```

**Contoh untuk bata andesit:**
- Gelap: `#C1440E` (Merah Bata)
- Mid: `#E8623A` (Merah Terakota)
- Terang: `#FDEEA0` (Krem Terang) — hanya 1–2px di sudut

### 4.2 Outline
- **1px solid `#2B1810`** di seluruh tepi sprite yang bersentuhan dengan background.
- Untuk area internal yang sangat gelap, boleh menggunakan **selective outline** — outline dalam tone gelap warna area tersebut (bukan `#2B1810`).
- Tile environment: outline hanya di tepi yang *tidak* berbatasan dengan tile lain.

### 4.3 Dithering
Diperbolehkan hanya untuk:
- Transisi antara dua tone pada **area besar** (dinding, tanah, langit).
- Pola: **checkerboard 50%** alternating (satu pixel tone A, satu pixel tone B).
- Tidak untuk sprite karakter kecil (terlalu noisy di skala kecil).

### 4.4 Dilarang Keras
- Gradient (smooth atau banded lebih dari 3 tone)
- Glow/blur otomatis dari software
- Dithering pada outline
- Lebih dari 3 tone per material

---

## 5. Elemen Visual Khas Majapahit (Wajib Konsisten)

### 5.1 Udeng (Ikat Kepala)
- **Warna wajib:** `#C1440E` (shadow) + `#E8623A` (highlight)
- Lipatan khas tampak di bagian atas-depan kepala
- Wajib terlihat di **setiap frame animasi** karakter utama tanpa kecuali
- Tinggi udeng: ±4–6px di atas kepala

### 5.2 Jarik Batik
- Motif: zigzag geometris sederhana atau grid kotak (cukup kesan batik, bukan detail penuh)
- Warna dasar: `#1A3A5C` (Biru Indigo)
- Motif: `#F0EBD8` (Putih Gading) — titik-titik atau garis diagonal minimal
- Area: menutupi pinggang hingga lutut karakter

### 5.3 Keris
- Bilah wajib **luk (bergelombang)**, minimal **3 lekukan**
- Lebar bilah: 2–3px, panjang total: 12–14px
- Warna bilah: `#7A6650` (Abu Batu) + `#F0EBD8` (Putih Gading) highlight
- Handle: `#8B4513` (Coklat Kayu) + `#D4A017` (Emas Tua) untuk ukiran

### 5.4 Motif Kala
- Muncul di: tile relief batu, pintu candi, dekorasi dinding
- Elemen wajib: sepasang mata bulat besar, taring melengkung ke atas, **tanpa dagu bawah**
- Referensi: Kala di Candi Singosari & Candi Jago
- Warna: `#7A6650` (batu) + `#2B1810` (detail ukiran)

### 5.5 Candi Bentar (Gerbang Split)
- Struktur **terbelah dua simetris** — kiri dan kanan identik (flip horizontal)
- Puncak tinggi berundak, semakin kecil ke atas
- Warna dominan: `#C1440E` + `#E8623A` (bata andesit)
- Referensi: Candi Cetho, Candi Sukuh (arsitektur Jawa Timur)

### 5.6 Bendera Majapahit
- **Vertikal:** merah di atas, putih di bawah (proporsi 1:1)
- Warna merah: `#C1440E`
- Warna putih: `#F0EBD8` (Putih Gading — BUKAN pure white)
- Tiang: `#8B4513` (Coklat Kayu)

### 5.7 Koin Gobog
- Bentuk: **bulat dengan lubang di tengah** (bukan koin solid)
- Diameter luar: 12px, diameter lubang: 4px
- Motif: bunga teratai atau stupa sederhana (4–6 titik/garis radial)
- Warna: `#D4A017` (shadow) → `#F5C842` (mid) → `#FDEEA0` (highlight)

### 5.8 Arsitektur Bata Andesit
- **Gunakan** `#C1440E` dan `#E8623A` — BUKAN abu-abu netral
- Celah antar bata: `#2B1810` atau `#5C2E1A` (1px)
- Lumut di celah/sudut: `#4A7C2F` atau `#2D5016`
- Kesan reruntuhan: bata hilang acak, rumput tumbuh di tepi

---

## 6. Panduan Tile Environment

### 6.1 Grid dan Modularitas
- Semua tile: **16 × 16 px**
- Semua prop besar: kelipatan 16px (32, 48, 64, 96, 128px)
- Tile harus **seamless** (tepi kiri = tepi kanan, tepi atas = tepi bawah) untuk tile yang di-tile

### 6.2 Urutan Layering (Z-order dari belakang ke depan)
```
Layer 0 (paling jauh) : bg_sky_layer.png
Layer 1               : bg_jungle_far.png
Layer 2               : bg_jungle_near.png
Layer 3               : Tile background (canopy)
Layer 4               : Tile environment utama (dinding, lantai)
Layer 5               : Prop dekorasi (candi, pohon)
Layer 6               : Karakter, enemy, item
Layer 7 (paling depan): UI / HUD
```

### 6.3 Parallax Speed Coefficient
| Layer | Kecepatan Scroll |
|---|---|
| Sky layer | 0.1× |
| Jungle far | 0.3× |
| Jungle near | 0.6× |
| Environment | 1.0× (kamera) |
| UI | 0.0× (tetap) |

---

## 7. UI Style

- **Font:** bitmap 8×8px, semua kapital untuk judul, mixed case untuk teks biasa
- **Warna teks:** `#F0EBD8` (Putih Gading) di atas background gelap
- **Bingkai UI:** bergaya ukiran batu, sudut tidak rounded — pixel art tegas
- **HUD position:** health bar kiri atas, koin counter kanan atas, nyawa kiri atas (bawah health bar)
- **Padding internal UI:** minimal 4px dari tepi bingkai ke konten

---

## 8. Checklist Validasi Visual per Asset

Sebelum setiap asset dipindah ke folder `final/`, pastikan:

- [ ] Tidak ada warna di luar 16 warna palette resmi
- [ ] Tidak ada anti-aliasing (semi-transparent pixel)
- [ ] Outline 1px `#2B1810` di seluruh tepi sprite
- [ ] Arah cahaya dari kiri atas konsisten
- [ ] Maksimal 3 tone per material
- [ ] Background fully transparent (alpha = 0)
- [ ] Ukuran sesuai spesifikasi (karakter 48×48, tile 16×16, dll.)
- [ ] Nama file mengikuti naming convention
- [ ] Elemen khas Majapahit hadir (udeng, keris, motif, dll.) jika relevan


## 9. Status validasi runtime (tahap 3)

Kebijakan 16 warna dan tanpa semi-transparency tetap berlaku; runtime yang diwarisi masih menyimpang. Jalankan `python tools/validation/validate_assets.py --strict-art` untuk menampilkan dan menolak deviasi. Lulus validasi teknis bukan final-art approval. Pipeline baru memakai nearest-neighbor, tetapi sprite runtime tidak diganti massal tanpa review visual tim.
