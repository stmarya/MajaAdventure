# Tahap 2 — UX dan kesiapan vertical slice

Tanggal: 2026-10-16. Target push: `main`.
Pesan commit: `feat(stage-2): improve playable slice UX, combat and browser regression tests`.

## Perubahan
- Menu/control DOM berlabel dan fokus keyboard, pause/resume/retry/restart/home, status teks, tutorial dan preferensi kurangi kedipan.
- Ikon audio dapat diklik; mute/volume dipertahankan lokal; SFX dibatasi dan dibersihkan.
- Keyboard alias tetap aktif sampai seluruh tombol alias dilepas; blur membersihkan input dan menjeda game; F3 debug opt-in tidak konflik dengan D.
- Kontrol sentuh eksperimental dengan pointer capture/cancel; target resmi tetap web + keyboard.
- Level: 75 tile pengisi bawah platform dibersihkan untuk headroom yang cukup; tes traversal sekarang mencapai akhir memakai input dan combat asli, mati dan retry secara normal, kedua checkpoint aktif.
- Musuh tanpa animasi death yang di-author dihapus aman, tanpa warning atau corpse permanen.
- Coyote time/jump buffer; hitbox serang kiri/kanan dicerminkan di dalam frame; soldier hanya damage saat strike aktif, keluar dari recovery dengan benar; tidak ada damage corpse.
- Glyph punctuation memakai metadata, HUD skor tidak menabrak ikon audio.
- Error konfigurasi/aset gambar tampil sebagai kegagalan eksplisit dengan tombol muat ulang.
- Playtest checklist memisahkan tes otomatis dari verifikasi manusia.

## Pengujian
Lihat `progres/hasil/tahap-2-*`. Hasil aktual: 28/28 tes Node lulus (termasuk traversal tanpa teleport/HP override), 13 pemeriksaan smoke Chromium lulus, 3/3 unittest integrasi sumber lulus.

## Masih terbuka
Playtest manusia, audio listening, penilaian art/historis/balance, gamepad dan perangkat Android nyata. Tahap ini menyiapkan kandidat vertical slice, bukan mengklaim seluruh persetujuan tersebut selesai.
