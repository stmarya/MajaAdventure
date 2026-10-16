# Tahap 1 — Stabilitas gameplay inti

Tanggal: 2026-10-16. Target push: `main`.
Pesan commit: `fix(stage-1): stabilize collision, fixed-step simulation and recovery flows`.

## Perubahan
- Collision directional per sumbu, landing tepat di permukaan, ceiling baris nol, world boundaries, substep anti-tunnelling dan one-way drop-through.
- Simulasi 60 tick/detik, terpisah dari refresh rate; input edge tidak hilang ketika belum ada simulation tick.
- Animasi kematian tetap maju; death mendahului exit; corpse enemy tidak memberikan contact damage.
- Kill plane menuju game over; retry menggunakan checkpoint dengan grace invulnerability.
- Retry checkpoint mempertahankan item/musuh/skor run; Mulai membuat sesi bersih. Highscore tetap disimpan lokal.
- Exit menggunakan pusat sprite; trigger akhir dipindahkan dari tile solid ke tile 193 yang terjangkau.
- Finalisasi skor idempotent; data level disalin agar spike tidak mencemari template reset.
- Tes Node mengeksekusi modul game asli, bukan port simulasi Python.

## Pengujian
Jalankan `npm test` dan `python3 -m unittest discover -s tools -p test_source_integration.py`.
Hasil: 19/19 tes Node lulus; 3/3 unittest integrasi sumber lulus; verifikasi impor lulus. Smoke Chromium boot → mulai → mati → retry → exit → menu → sesi baru lulus tanpa pageerror. Smoke menggunakan injeksi posisi/event terminal, bukan bukti playthrough manusia. Log: `progres/hasil/tahap-1-*.txt`.

## Batasan
Tuning combat, tutorial, UI dan hardening build adalah tahap berikutnya. Tidak mengklaim playtest manusia atau persetujuan lisensi.
