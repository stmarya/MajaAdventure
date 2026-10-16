# Kesiapan vertical slice

Engine aktif adalah HTML5 Canvas + JavaScript modules, bukan migrasi Godot. Scope sekarang satu level web + keyboard yang dapat dimainkan dari menu sampai exit, dengan checkpoint, combat, koleksi, pause dan retry.

## Bukti otomatis

Lihat `progres/hasil/` untuk hasil aktual per tahap. Node traversal memakai konfigurasi level runtime dengan musuh/hazard aktif, bergerak, melompat dan menyerang; tanpa teleport atau pengubahan HP. Browser smoke memverifikasi transisi UI, failure loading dan endpoint retry/exit, tetapi menggunakan injeksi posisi test untuk endpoint tersebut.

## Belum disahkan

Feel kontrol, kualitas audio, konsistensi final-art, keseimbangan level, aksesibilitas penuh, hak distribusi dan QA browser/perangkat nyata belum dapat dinyatakan selesai dari tes otomatis. Ikuti `PLAYTEST.md`, `ASSET_RIGHTS.md`, dan `BUILD_RELEASE.md`. Windows native dan Android belum kandidat rilis.
