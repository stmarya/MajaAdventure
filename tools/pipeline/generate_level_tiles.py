#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_level_tiles.py
=======================
Script generator tile_data untuk level_01.json.

Menghasilkan peta tile 200×20 berbasis pola:
  - Baris 0–2   : langit (kosong, tile 0)
  - Baris 3–14  : area udara & platform
  - Baris 15    : lantai utama (tile 5 = lantai_bata_rumput)
  - Baris 16–19 : tanah dalam (tile 15 = bata_dalam/solid)

Platform tambahan tersebar berdasarkan posisi objek di level JSON.
Spike trap ditempatkan berdasarkan trigger_spike di objek level.

Cara pakai:
  python tools/pipeline/generate_level_tiles.py
"""

import json
from pathlib import Path

ROOT       = Path(__file__).resolve().parent.parent.parent
LEVEL_PATH = ROOT / "levels" / "level_01.json"

# ── Tile ID (sesuai tileset_config.json) ──────────────────────────────────────
T_KOSONG       = 0
T_BATA_BERSIH  = 1   # bata_solid_bersih
T_BATA_LUMUT1  = 2   # bata_solid_lumut_ringan
T_BATA_LUMUT2  = 3   # bata_solid_lumut_lebat
T_BATA_RUSAK   = 4   # bata_rusak
T_LANTAI_RUMPUT = 5  # lantai_bata_rumput (platform surface)
T_LANTAI_BERSIH = 6  # lantai_bata_bersih
T_RELIEF       = 7   # relief_kala (dekorasi dinding)
T_TEPI_KIRI    = 8   # bata_tepi_kiri
T_TEPI_KANAN   = 9   # bata_tepi_kanan
T_TANGGA       = 10  # tangga_kayu (climbable)
T_SPIKE_IDLE   = 11  # spike idle
T_SPIKE_AKTIF  = 12  # spike aktif (default idle di level data)
T_UDARA        = 13  # tanah_kosong (alias 0)
T_PLATFORM_OW  = 14  # one_way_platform kayu
T_DALAM        = 15  # air_bata_dalam (solid pengisi)
T_CANOPY_BG    = 16  # canopy_bg_tile


def buat_tile_data(lebar, tinggi):
    """Buat array flat tile_data 200×20."""
    data = [T_KOSONG] * (lebar * tinggi)

    def set_tile(x, y, tile_id):
        if 0 <= x < lebar and 0 <= y < tinggi:
            data[y * lebar + x] = tile_id

    def isi_baris(y, tile_id, x_mulai=0, x_akhir=None):
        if x_akhir is None:
            x_akhir = lebar
        for x in range(x_mulai, x_akhir):
            set_tile(x, y, tile_id)

    def isi_platform(x_mulai, x_akhir, y, surface=T_LANTAI_RUMPUT, bawah=T_BATA_BERSIH):
        """Platform 2-tile tebal: baris y = surface, baris y+1 = solid bawah."""
        # Tepi kiri
        set_tile(x_mulai, y, T_TEPI_KIRI)
        # Isi tengah
        for x in range(x_mulai + 1, x_akhir - 1):
            set_tile(x, y, surface)
        # Tepi kanan
        set_tile(x_akhir - 1, y, T_TEPI_KANAN)
        # Baris bawah (solid)
        for x in range(x_mulai, x_akhir):
            set_tile(x, y + 1, bawah)

    # ── Lantai utama baris 15 (lebar penuh kecuali lubang) ───────────────────
    # Bagian 0–34: lantai solid
    isi_baris(15, T_LANTAI_RUMPUT, 0, 34)
    # Lubang kecil setelah spike area (baris 35–37) — pit jump hazard
    # Baris 38–64: lantai berlanjut
    isi_baris(15, T_LANTAI_RUMPUT, 38, 65)
    # Baris 65–65: lantai
    isi_baris(15, T_LANTAI_RUMPUT, 65, 90)
    # Baris 90–195: lantai penuh
    isi_baris(15, T_LANTAI_RUMPUT, 90, 196)
    # Ujung level: dinding keluar
    for y in range(13, 20):
        set_tile(196, y, T_BATA_BERSIH)
        set_tile(197, y, T_BATA_BERSIH)
        set_tile(198, y, T_BATA_BERSIH)
        set_tile(199, y, T_BATA_BERSIH)

    # ── Tanah dalam baris 16–19 ───────────────────────────────────────────────
    for y in range(16, 20):
        isi_baris(y, T_DALAM)

    # ── Dinding latar kiri (kolom 0) ──────────────────────────────────────────
    for y in range(0, 16):
        set_tile(0, y, T_BATA_BERSIH)
        set_tile(1, y, T_BATA_BERSIH)

    # ── Background canopy baris 3–7 (dekorasi, tidak solid) ──────────────────
    for y in range(3, 8):
        for x in range(2, lebar - 4):
            if data[y * lebar + x] == T_KOSONG:
                # Hanya isi setiap 3 kolom agar terlihat natural
                if x % 3 == 0:
                    set_tile(x, y, T_CANOPY_BG)

    # ── Platform melayang ────────────────────────────────────────────────────
    # Platform 1: baris 12–13, kolom 10–16 (sebelum lubang)
    isi_platform(10, 17, 12)

    # Platform 2: baris 10–11, kolom 22–28 (di atas koin)
    isi_platform(22, 29, 10)

    # Platform 3: baris 11–12, kolom 45–53 (area tengah)
    isi_platform(45, 54, 11)

    # Platform 4: baris 9–10, kolom 55–62 (tinggi)
    isi_platform(55, 63, 9)

    # Platform 5: baris 8–9, kolom 70–78 (sebelum candi)
    isi_platform(70, 79, 8)

    # Platform 6: baris 10–11, kolom 100–108
    isi_platform(100, 109, 10)

    # Platform 7: baris 12–13, kolom 115–122
    isi_platform(115, 123, 12)

    # Platform 8: baris 9–10, kolom 130–138
    isi_platform(130, 139, 9)

    # Platform 9: baris 11–12, kolom 150–158
    isi_platform(150, 159, 11)

    # Platform 10: baris 8–9, kolom 165–172
    isi_platform(165, 173, 8)

    # ── Tangga kayu ───────────────────────────────────────────────────────────
    # Tangga 1: kolom 20, baris 10–14 (naik ke platform 2)
    for y in range(10, 15):
        set_tile(20, y, T_TANGGA)

    # Tangga 2: kolom 58, baris 9–14 (naik ke platform 4)
    for y in range(9, 15):
        set_tile(58, y, T_TANGGA)

    # ── Spike trap areas (baris 15, tile idle) ────────────────────────────────
    # Spike 1: kolom 35–37
    for x in range(35, 38):
        set_tile(15, 15, T_SPIKE_IDLE)  # akan dikontrol oleh trigger_spike
    for x in range(35, 38):
        set_tile(x, 15, T_SPIKE_IDLE)

    # Spike 2: kolom 105–108
    for x in range(105, 109):
        set_tile(x, 15, T_SPIKE_IDLE)

    # Spike 3: kolom 155–157
    for x in range(155, 158):
        set_tile(x, 15, T_SPIKE_IDLE)

    # ── Dekorasi dinding (relief Kala) ────────────────────────────────────────
    # Beberapa panel relief di dinding latar
    for pos in [(15, 8), (45, 7), (88, 8), (130, 7), (160, 8)]:
        set_tile(pos[0], pos[1], T_RELIEF)
        set_tile(pos[0]+1, pos[1], T_RELIEF)

    # ── Variasi bata (lumut di area reruntuhan) ───────────────────────────────
    import random
    random.seed(42)  # seed tetap agar deterministik
    for y in range(16, 20):
        for x in range(2, lebar - 4):
            if data[y * lebar + x] == T_DALAM:
                r = random.random()
                if r < 0.15:
                    data[y * lebar + x] = T_BATA_LUMUT1
                elif r < 0.25:
                    data[y * lebar + x] = T_BATA_LUMUT2
                elif r < 0.30:
                    data[y * lebar + x] = T_BATA_RUSAK

    return data


def main():
    # Muat level JSON
    with open(LEVEL_PATH, encoding="utf-8-sig") as f:
        level = json.load(f)

    lebar  = level["dimensi"]["lebar_tiles"]   # 200
    tinggi = level["dimensi"]["tinggi_tiles"]  # 20

    print(f"Generating tile_data {lebar}×{tinggi} = {lebar*tinggi} tiles...")

    data_main = buat_tile_data(lebar, tinggi)

    # Masukkan ke level JSON sebagai layer_tile
    level["layer_tile"] = [
        {
            "id": "layer_main",
            "z": 4,
            "render_mode": "normal",
            "data": data_main
        }
    ]

    # Simpan kembali
    with open(LEVEL_PATH, "w", encoding="utf-8") as f:
        json.dump(level, f, ensure_ascii=False, separators=(",", ":"))

    # Statistik
    non_zero = sum(1 for t in data_main if t != 0)
    print(f"  Tile non-kosong: {non_zero} / {lebar*tinggi} ({non_zero*100//(lebar*tinggi)}%)")
    print(f"  Tile ID unik: {sorted(set(data_main))}")
    print(f"  level_01.json diperbarui: {LEVEL_PATH}")
    print("Selesai.")


if __name__ == "__main__":
    main()
