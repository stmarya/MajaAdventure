# Persiapan berikutnya — Vertical Slice Level 01

Status: rancangan awal, belum diimplementasikan.

## Keputusan yang perlu dikonfirmasi

- [ ] Engine dan versi: belum dipilih. Usulan untuk diskusi: Godot 4 + GDScript.
- [ ] Target awal: web, desktop, atau keduanya.
- [ ] Resolusi gameplay: usulan dari dokumen aset 320×180, dengan integer scaling.
- [ ] Input awal: keyboard; gamepad/touch belum ditentukan.

## Sasaran prototipe

Satu level pendek yang bisa dimainkan dari spawn sampai gerbang akhir:
bergerak → melompat → menyerang → mengambil koin → checkpoint → selesai.
Durasi sasaran 2–3 menit adalah target desain, belum hasil pengujian.

## Tahap integrasi

1. Import PNG menggunakan nearest-neighbor. Sesuaikan skala Base Pack dan Dunia Hidup.
2. Susun animasi pemain: idle, run, jump, attack, defeat. Atur pivot dan baseline.
3. Buat kontrol kiri/kanan, lompat, gravitasi, collision serta kamera.
4. Uji terrain dan seamless tile; rapikan tile sebelum membangun level final.
5. Tambahkan koin, guci/peti pecah dan checkpoint. Pisahkan visual dari hitbox.
6. Tambahkan prajurit tombak, health/damage dan respawn.
7. Hubungkan VFX dengan event landing, attack, hit dan coin pickup.
8. Tempatkan dekorasi ambient secukupnya; jangan menghalangi platform/hazard.
9. Uji start–finish, frame timing, collision, performa dan tampilan pada resolusi target.

## Rancangan alur Level 01

- **Zona A — pintu masuk hutan:** tutorial bergerak dan lompat, beberapa koin.
- **Zona B — reruntuhan:** guci pecah, obor, satu perangkap spike, satu musuh.
- **Zona C — checkpoint:** tempat aman untuk memperkenalkan save/respawn.
- **Zona D — gerbang candi:** kombinasi platform dan musuh, lalu trigger selesai.

## Penggunaan Dunia Hidup

- Obor, rumput, semak dan fauna: animasi loop.
- Daun/fauna: lintasan dan spawn dibuat di engine, bukan dari GIF.
- Guci/peti: animasi pecah sekali; kemudian debris atau hide.
- Checkpoint: aktivasi sekali, lalu loop aktif; lokasi respawn disimpan oleh gameplay.
- VFX: playback sekali lalu hide/free.
- Gunakan durasi manifest sebagai titik awal, bukan nilai final wajib.

## Kriteria selesai

- [ ] Pemain tidak menembus tanah/platform atau tersangkut di tepi tile.
- [ ] Serangan memiliki timing/hitbox yang jelas.
- [ ] Checkpoint dan respawn bekerja.
- [ ] Pemain dapat mencapai akhir level tanpa softlock.
- [ ] Dekorasi tidak menutupi hazard atau mengganggu keterbacaan.
- [ ] Semua aset tetap tajam tanpa filter blur.

## Belum termasuk

Boss, banyak level, inventory kompleks, multiplayer, audio final, serta finalisasi historis/art direction.
