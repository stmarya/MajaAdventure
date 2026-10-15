# Checklist aset master — sebelum kode gameplay

**Keputusan produksi: aset dahulu, gameplay kemudian.**
Status saat ini **belum lengkap/final**. File yang tersedia tidak otomatis siap rilis.

Legenda:
- **Tersedia draft**: file sudah ada; perlu penyelarasan art direction/skala/pivot.
- **Perlu QA**: wajib diuji visual/loop/audio atau dibandingkan antar-paket.
- **Belum ada**: belum tersedia sebagai aset terpisah.
- **Tertunda layanan**: upaya generasi gambar gagal; bukan sudah selesai.

## Karakter utama
| Aset | Status | Catatan |
|---|---|---|
| Idle/run/jump/keris attack/defeat | Tersedia draft | Base Pack;4/7/4/4/3 frame |
| Hurt/hit reaction | Tertunda layanan | Belum dibuat |
| Ladder climb | Tertunda layanan | Belum dibuat |
| Landing/crouch | Tertunda layanan | Belum dibuat |
| Portrait HUD karakter | Belum ada | Jangan menganggap ikon keris sebagai portrait |

## Musuh dan penghuni
| Aset | Status | Catatan |
|---|---|---|
| Prajurit tombak idle/attack | Tersedia draft | Walk/hit/death belum ada |
| Monyet idle/jump | Tersedia draft | Walk/attack/hit/death belum ada |
| Pemanah aksi bidik/serang | Tersedia draft | Projectile/event release belum dibuat |
| Pemanah idle/run/hit/death | Tertunda layanan | Belum dibuat |
| Penjaga perisai aksi pertahanan/serang | Tersedia draft | Bukan set animasi lengkap |
| Penjaga perisai idle/run/hit/death | Tertunda layanan | Belum dibuat |
| Babi hutan lari | Tersedia draft | Idle/windup/hit/death belum ada |
| Pedagang idle/gestur | Tersedia draft | Belum ada portrait dialog |
| Projectile panah | Belum ada | Sprite terpisah dibutuhkan |

## Environment, item, VFX
| Aset | Status | Catatan |
|---|---|---|
| Bata/floor/ladder/spike/relief/candi/palma | Tersedia draft | Uji grid16px dan seamless belum selesai |
| Obor/rumput/semak/daun/fauna | Tersedia draft | Dunia Hidup01 |
| Air terjun/sungai/kabut/sulur | Tersedia draft | Belum teruji seamless/loop di engine |
| Parallax sky/far/mid/foreground terpisah | Tertunda layanan | Menu background bukan pengganti4layer |
| Guci/peti/checkpoint/tuas/gerbang/platform/jembatan | Tersedia draft | State visual tersedia |
| Gobog/Maja/peti/bendera | Tersedia draft | Skala dan playback perlu QA |
| Debu/slash/hit/koin/air/kayu/gerabah/poof | Tersedia draft | Masih4frame per rangkaian |
|16props desa/candi/sungai/hutan | Tersedia draft | Bukan empat level lengkap |

## UI dan menu — Paket03
| Aset | Status | Catatan |
|---|---|---|
| Healthbar empty/half/full +fill | Tersedia draft |120×16, fill106×4 |
|8tombol ikon ×3state | Tersedia draft |24×24 |
|MULAI/LANJUT/ULANG ×3state | Tersedia draft |64×20 |
|Ikon keris/koin/Maja/hati | Tersedia draft |16×16 |
|Panel9-slice | Tersedia draft |48×48,border6 |
|Font bitmap uppercase/digit/simbol dasar | Tersedia draft |8×8;metadata glyph |
|Font lowercase/aksen/TTF | Belum ada | Bukan syarat untuk UI uppercase awal |
|Main/pause/gameover/complete overlays | Tersedia draft |320×180 |
|Background menu | Tersedia draft |Dirangkai dari gambar lama, bukan ilustrasi baru |
|4preview layar | Tersedia draft |Bukan layar interaktif |

## Audio original sintetis — Paket03
| Aset | Status | Catatan |
|---|---|---|
|BGM level64detik | Perlu QA |StereoOGG44.1kHz120BPM |
|BGM menu57.6detik | Perlu QA |StereoOGG44.1kHz100BPM |
|8SFX gameplay | Perlu QA |PCM16mono44.1kHzWAV |

Audio dicek format/durasi/headroom, **belum diuji dengar**. Perlu penilaian
musik, kenyamanan spektrum, mix volume serta sambungan loop sebelum final.
Tidak menggunakan sampel lagu/rekaman pihak ketiga; dibuat dengan sintesis FM/chiptune.
Gaya metalik terinspirasi gamelan, bukan rekonstruksi atau rekaman autentik.

## Urutan penyelesaian aset berikutnya
1. Pulihkan layanan gambar, lalu lengkapi animasi hero dan musuh di atas.
2. Buat projectile panah, portrait hero/NPC, serta4layer parallax terpisah.
3. Normalisasi ukuran native, pivot, outline dan kontras seluruh paket.
4. Rapikan tile sehingga benar-benar mengikuti grid16×16 dan uji seamless.
5. Lakukan review dengar audio dan finalisasi loop/level volume.
6. Bekukan manifest aset versi1 setelah checklist wajib selesai.

Tidak ada kode gameplay, proyek engine atau fitur interaksi yang dibuat pada tahap ini.
