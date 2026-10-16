# Hak distribusi dan lisensi — gerbang rilis

**Status: belum disetujui untuk rilis publik.** Tidak ada lisensi baru yang diberikan oleh perubahan ini.

| Kelompok | Bukti saat ini | Keputusan yang diperlukan |
|---|---|---|
| Visual runtime + paket sumber | README sumber menyatakan lisensi distribusi belum ditetapkan | Pemilik hak mengonfirmasi asal, hak modifikasi dan hak distribusi tiap paket; simpan bukti |
| Audio runtime sintetis Paket03 | Dokumen sumber menyatakan dibuat secara sintetis | Konfirmasi pemilik hak dan izin distribusi runtime yang benar-benar dipakai |
| Library external-cc0 | Kredit/checksum/lisensi disimpan di paket; bukan otomatis dipakai runtime | Jika dipilih, cocokkan file dengan register dan pertahankan credit/license |
| Kode game | Repo belum menetapkan lisensi kode | Pemilik repo memilih hak distribusi; jangan otomatis menambahkan MIT/CC0 |
| Dependensi pengujian | Playwright, lisensi tercatat di package lock/package upstream | Dev-only, tidak disalin ke build web |

`docs/asset_manifest.json` memetakan seluruh runtime dengan status hak pending; `docs/release_approvals.json` menyimpan keputusan bernama dan bukti. Jangan menandai `approved` hanya agar build publik lolos. Build internal tidak memberi izin redistribusi.
