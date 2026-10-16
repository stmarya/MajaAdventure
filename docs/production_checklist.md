# Checklist produksi — setelah perbaikan tahap 1–3

## Implementasi dan pemeriksaan otomatis

- [x] Fixed-step 60 Hz, collision arah, death/retry/checkpoint dan replay terpisah.
- [x] Combat active-hitbox, jump buffer/coyote dan ruang traversal level.
- [x] Native DOM controls, feedback gagal loading, pause kehilangan fokus, pengaturan audio/flash.
- [x] Unit/regression, traversal otomatis level nyata, dan browser endpoint smoke tersedia.
- [x] Manifest runtime ber-hash, validasi data level dan watchdog loading gambar.
- [x] Pipeline kandidat lintas OS, allowlist web build, checksum dan gate publik.
- [x] Workflow CI Ubuntu/Windows dikonfigurasi; bukan klaim job remote sudah lulus.

## Harus selesai sebelum publikasi

- [ ] Bukti hak distribusi visual untuk setiap aset runtime.
- [ ] Konfirmasi kepemilikan/izin audio runtime dan pilihan lisensi kode oleh pemilik.
- [ ] Final-art memenuhi palette/alpha dan konsistensi style; deviasi masih ada.
- [ ] Playtest manusia end-to-end sesuai `PLAYTEST.md` dan evaluasi feel/difficulty.
- [ ] Listening review BGM/SFX, loudness, loop dan clipping.
- [ ] QA Chrome/Firefox/Safari dan perangkat target aktual, performa dan sesi panjang.
- [ ] Review aksesibilitas (canvas belum gameplay nonvisual), flashing dan keterbacaan.
- [ ] Jika target Android/native Windows tetap masuk scope: packaging dan device QA tersendiri.
- [ ] Persetujuan berbukti pada `release_approvals.json` dan build publik berhasil.

Tes otomatis tidak menggantikan checklist manusia atau legal. Tes endpoint browser menggunakan injeksi posisi hanya dalam runner; traversal otomatis terpisah tidak menggunakan teleport atau pengubahan HP.
