# Build dan rilis

## Status

Kandidat internal web + keyboard. Bukan produk siap publik. Native Windows dan Android belum tersedia; simulasi sentuh bukan pengujian perangkat nyata.

## Instalasi dan tes

Gunakan Node ≥22 dan Python 3.13. `npm ci`, lalu `python -m pip install -r requirements-dev.txt`. Jalankan tes yang disebut di README. Dependency Python dan Playwright dipin; lockfile npm wajib dipakai.

`tools/test_playthrough.mjs` memakai controller otomatis pada level nyata, tanpa teleport/HP override. Browser smoke menginjeksi jembatan hanya pada response test untuk menguji endpoint death/retry/exit; bukan perjalanan pemain manusia. Tidak ada jembatan test dalam runtime produksi.

## Kandidat internal

1. Pastikan working tree bersih pada commit yang hendak dibagikan.
2. Jalankan validator teknis, Node, source integration, delivery dan browser smoke.
3. `python tools/build_web.py --channel internal`.
4. Uji ZIP yang diekstrak via HTTP server, atau `TEST_WEB_ROOT` menunjuk `dist/web` untuk smoke runner.
5. Simpan ZIP, `.sha256`, commit sumber dan `BUILD_INFO.json`; jangan distribusikan source pack. Label **internal playtest only** tidak menghapus kewajiban izin pemilik aset.

ZIP deterministik untuk snapshot sumber, metadata Git dan versi toolchain yang sama. Timestamp entry ZIP distabilkan; digest file runtime dicatat. Metadata `dirty_worktree` harus false untuk kandidat yang disepakati tim. CI menghasilkan artifact, bukan deployment publik.

## Gerbang publik — masih diblokir

`docs/release_approvals.json` memerlukan tujuh pemeriksaan: visual_rights, audio_rights, code_license, art_qa, human_playtest, audio_listening, browser_matrix. Masing-masing harus memuat persetujuan nyata, reviewer, waktu dan evidence. Jangan mengisi persetujuan atas nama manusia.

Build publik memeriksa seluruh approval, integritas teknis dan strict palette/alpha. Approval art tidak bisa melewati strict validator. Persetujuan administratif tidak menjamin hak hukum; reviewer wajib memeriksa dokumen sumber yang benar.

- Legal/owner: bukti hak komersial/distribusi semua aset runtime dan lisensi kode dipilih pemilik.
- Art: perbaiki deviasi palette/alpha dan review konsistensi karakter, background, HUD serta kontras.
- QA: selesaikan protokol `PLAYTEST.md`, dengarkan seluruh audio, uji browser/perangkat target.
- Setelah semua bukti sah: `python tools/build_web.py --channel public`; deployment tetap tindakan manual terpisah.

## Pipeline aset

`python tools/restore_assets.py` memeriksa checksum pack. `python tools/pipeline/assemble_new_assets.py --source . --output dist/asset-candidate` menghasilkan kandidat terpisah. Review sebelum menyalin ke runtime dan memperbarui manifest hash. Dilarang menandai semua aset legal hanya karena ada pool audio CC0; runtime harus dipetakan satu per satu.
