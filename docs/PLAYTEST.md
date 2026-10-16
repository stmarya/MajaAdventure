# Playtest Level 01

## Sasaran
Web + keyboard. Satu sesi utuh spawn → checkpoint → gerbang akhir, termasuk gagal dan pulih. Kontrol sentuh eksperimental; bukan persetujuan rilis Android.

## Langkah tester manusia (belum dinyatakan selesai)
- [ ] Pemain baru memahami gerak/lompat/serang tanpa arahan pembuat.
- [ ] Selesaikan level tanpa debug, teleport, atau kebal buatan.
- [ ] Mati sebelum dan sesudah masing-masing checkpoint; cek posisi dan collectible/skor.
- [ ] Coba ulang dari awal, menu, pause/resume, ganti tab dan kembali.
- [ ] Serang kiri/kanan; amati telegraph prajurit, jendela hit dan feedback.
- [ ] Uji musik/SFX dengan headphone dan speaker; volume, kenyamanan, clipping dan seamless loop.
- [ ] Periksa dekorasi menutupi hazard, kontras, pivot, seam tile, dan mode kurangi kedipan.

## Catatan wajib setiap sesi
Tanggal, tester, browser/OS/perangkat, commit, durasi sampai selesai, kematian per area, checkpoint terakhir, kebingungan kontrol, bug dengan langkah reproduksi, serta feedback menyenangkan/tidaknya game. Jangan menyamakan waktu target desain dengan durasi terukur.

## Tes otomatis
`npm test` menjalankan modul asli; `npm run test:browser` menjalankan browser smoke dengan server lokal terkelola. Injeksi state/posisi hanya berada dalam runner Playwright, tidak diekspos oleh produksi. Smoke membuktikan transisi dan error handling, bukan validasi fun atau playthrough manusia.
