#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate_assets.py
==================
Script validasi otomatis pipeline asset untuk proyek Majapahit Platformer.

Tugas:
  1. Memverifikasi semua file PNG ada di lokasi yang benar (sesuai manifest)
  2. Memvalidasi dimensi setiap sprite/tile sesuai spesifikasi
  3. Memverifikasi semua pixel di PNG menggunakan warna dari palette resmi
  4. Mendeteksi anti-aliasing (pixel semi-transparan yang terlarang)
  5. Memvalidasi naming convention seluruh file di folder final/
  6. Memverifikasi file audio ada dan format-nya benar
  7. Menghasilkan laporan validasi lengkap

Cara pakai:
  python tools/validation/validate_assets.py
  python tools/validation/validate_assets.py --hanya-manifest
  python tools/validation/validate_assets.py --hanya-palette
  python tools/validation/validate_assets.py --verbose

Dependensi:
  pip install Pillow

Tidak ada dependensi lain — semua built-in Python 3.8+.
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from typing import Optional

# Pillow dibutuhkan untuk validasi gambar
try:
    from PIL import Image
    PILLOW_ADA = True
except ImportError:
    PILLOW_ADA = False

# ─── Konfigurasi Jalur ────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent.parent  # root proyek
DOCS = ROOT / "docs"
MANIFEST_PATH     = DOCS / "asset_manifest.json"
PALETTE_PATH      = DOCS / "color_palette.json"
PROJECT_CFG_PATH  = DOCS / "project_config.json"
ANIM_CFG_PATH     = DOCS / "animation_config.json"
TILESET_CFG_PATH  = DOCS / "tileset_config.json"

# ─── Regex Naming Convention ──────────────────────────────────────────────────

POLA_NAMING = {
    # chr_[nama]_[subname]*[_NN].png
    "chr":  re.compile(r"^chr_[a-z]+(_[a-z]+)*(_\d{2})?\.png$"),
    # env_[nama]_[subname]*[_NN].png — 2+ segmen diizinkan (candi_bentar_left, trap_spike_idle)
    "env":  re.compile(r"^env_[a-z]+(_[a-z]+)+(_\d{2})?\.png$"),
    # bg_[nama]*.png — tidak harus diakhiri _layer
    "bg":   re.compile(r"^bg_[a-z]+(_[a-z]+)*\.png$"),
    # ui_[nama](_[subname])*.png
    "ui":   re.compile(r"^ui_[a-z]+(_[a-z]+)*\.png$"),
    # itm_[nama](_[subname])*[_NN].png
    "itm":  re.compile(r"^itm_[a-z]+(_[a-z]+)*(_\d{2})?\.png$"),
    # bgm — terima .wav dan .ogg (placeholder pakai .wav)
    "bgm":  re.compile(r"^bgm_[a-z0-9]+_\d{2}\.(ogg|wav)$"),
    "sfx":  re.compile(r"^sfx_[a-z_]+\.wav$"),
    # vfx — bisa _sheet atau nama lain
    "vfx":  re.compile(r"^vfx_[a-z]+(_[a-z]+)*\.png$"),
    "font": re.compile(r"^font_[a-z_]+\.(png|ttf)$"),
}

# ─── Warna Palette Resmi ──────────────────────────────────────────────────────

PALETTE_HEX = [
    "#2B1810", "#5C2E1A", "#8B4513", "#C1440E",
    "#E8623A", "#D4A017", "#F5C842", "#FDEEA0",
    "#2D5016", "#4A7C2F", "#7AB648", "#1A3A5C",
    "#2E6B9E", "#C8A882", "#F0EBD8", "#7A6650",
]

def hex_ke_rgb(hex_str: str) -> tuple:
    """Konversi hex color string ke tuple (R, G, B)."""
    h = hex_str.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

PALETTE_RGB = set(hex_ke_rgb(h) for h in PALETTE_HEX)

# ─── Spesifikasi Dimensi ──────────────────────────────────────────────────────

SPEK_DIMENSI = {
    # Karakter — dimensi sheet penuh (bukan per-frame)
    "chr_warrior":       (480, 270),   # 10 col × 48px, tinggi 270px
    "chr_soldier":       (288,  52),   # 6 col × 48px, 1 baris 52px
    "chr_monkey":        (128,  32),   # 4 col × 32px, 1 baris 32px
    # Environment — tile individual 16×16
    "env_ruins_wall":    (64,   64),   # tileset sheet 4×4 = 64×64
    "env_ladder":        (16,   16),
    "env_trap":          (16,   16),
    "env_ruins_relief":  (16,   16),
    # Background
    "bg_sky":            (320, 180),
    "bg_jungle_far":     (320, 180),
    "bg_jungle_near":    (320, 120),
    # Props
    "env_candi_bentar":  (32,   64),   # tiap sisi 32×64
    "env_palmtree_tall": (32,   96),
    "env_palmtree_med":  (32,   64),
    "env_palmtree_short":(32,   48),
    # Items
    "itm_gobog":         (64,   16),   # 4 frame × 16px = 64×16
    "itm_maja":          (16,   16),
    "itm_chest":         (32,   32),
    # VFX
    "vfx_hit":           (96,   32),
    "vfx_dust":          (72,   16),
    "vfx_torch":         (48,   24),
    # UI
    "ui_healthbar_empty":(96,   12),
    "ui_healthbar_fill": (96,   12),
    "ui_icon_life":      (16,   16),
    "ui_coin_counter":   (48,   16),
    "ui_screen":         (320, 180),
    # Font
    "font_bitmap":       (128,  48),
}

# ─── Utilitas ─────────────────────────────────────────────────────────────────

RESET  = "\033[0m"
MERAH  = "\033[91m"
HIJAU  = "\033[92m"
KUNING = "\033[93m"
BIRU   = "\033[94m"
TEBAL  = "\033[1m"

def cetak_header(teks: str) -> None:
    garis = "─" * 60
    print(f"\n{TEBAL}{BIRU}{garis}{RESET}")
    print(f"{TEBAL}{BIRU}  {teks}{RESET}")
    print(f"{TEBAL}{BIRU}{garis}{RESET}")

def cetak_ok(teks: str) -> None:
    print(f"  {HIJAU}✓{RESET} {teks}")

def cetak_error(teks: str) -> None:
    print(f"  {MERAH}✗ ERROR:{RESET} {teks}")

def cetak_peringatan(teks: str) -> None:
    print(f"  {KUNING}⚠ PERINGATAN:{RESET} {teks}")

def cetak_info(teks: str) -> None:
    print(f"  {BIRU}ℹ{RESET} {teks}")

def muat_json(path: Path) -> Optional[dict]:
    """Muat file JSON. Kembalikan None jika gagal."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        cetak_error(f"File tidak ditemukan: {path.relative_to(ROOT)}")
        return None
    except json.JSONDecodeError as e:
        cetak_error(f"JSON tidak valid di {path.relative_to(ROOT)}: {e}")
        return None

# ─── Modul Validasi ───────────────────────────────────────────────────────────

class HasilValidasi:
    """Akumulator hasil validasi untuk semua tahap."""
    def __init__(self):
        self.total_cek   = 0
        self.lulus       = 0
        self.gagal       = 0
        self.peringatan  = 0
        self.detail_gagal = []

    def tambah_ok(self):
        self.total_cek += 1
        self.lulus += 1

    def tambah_gagal(self, pesan: str):
        self.total_cek += 1
        self.gagal += 1
        self.detail_gagal.append(pesan)
        cetak_error(pesan)

    def tambah_peringatan(self, pesan: str):
        self.total_cek += 1
        self.peringatan += 1
        cetak_peringatan(pesan)

    def cetak_ringkasan(self):
        print(f"\n{TEBAL}Ringkasan: {self.lulus} lulus / {self.gagal} gagal / {self.peringatan} peringatan dari {self.total_cek} pemeriksaan{RESET}")

    @property
    def semua_lulus(self) -> bool:
        return self.gagal == 0


def validasi_file_konfigurasi(hasil: HasilValidasi) -> None:
    """Tahap 1: Pastikan semua file konfigurasi JSON ada dan valid."""
    cetak_header("TAHAP 1 — Validasi File Konfigurasi")
    for path, nama in [
        (MANIFEST_PATH,    "asset_manifest.json"),
        (PALETTE_PATH,     "color_palette.json"),
        (PROJECT_CFG_PATH, "project_config.json"),
        (ANIM_CFG_PATH,    "animation_config.json"),
        (TILESET_CFG_PATH, "tileset_config.json"),
    ]:
        data = muat_json(path)
        if data is not None:
            cetak_ok(f"{nama} — valid JSON")
            hasil.tambah_ok()
        else:
            hasil.tambah_gagal(f"{nama} — tidak ditemukan atau JSON rusak")

    # Validasi jumlah warna palette
    palette = muat_json(PALETTE_PATH)
    if palette and "colors" in palette:
        jumlah = len(palette["colors"])
        if jumlah == 16:
            cetak_ok(f"Palette memiliki tepat 16 warna")
            hasil.tambah_ok()
        else:
            hasil.tambah_gagal(f"Palette harus 16 warna, ditemukan {jumlah}")


def validasi_manifest_asset(hasil: HasilValidasi, verbose: bool = False) -> None:
    """Tahap 2: Verifikasi semua asset yang terdaftar di manifest ada di filesystem."""
    cetak_header("TAHAP 2 — Validasi Keberadaan File Asset (dari Manifest)")
    manifest = muat_json(MANIFEST_PATH)
    if not manifest:
        hasil.tambah_gagal("Manifest tidak bisa dimuat, skip tahap ini")
        return

    ditemukan = 0
    tidak_ditemukan = 0

    def cek_file(path_str: str, id_asset: str):
        nonlocal ditemukan, tidak_ditemukan
        if not path_str:
            return
        path = ROOT / path_str
        if path.exists():
            ditemukan += 1
            if verbose:
                cetak_ok(f"[{id_asset}] {path_str}")
            hasil.tambah_ok()
        else:
            tidak_ditemukan += 1
            hasil.tambah_peringatan(f"[{id_asset}] Belum ada: {path_str}")

    # Iterasi semua kategori di manifest
    for kategori, daftar in manifest.get("assets", {}).items():
        for asset in daftar:
            id_a = asset.get("id", "?")
            # Cek semua field yang berisi path file
            for field in ["file", "file_kiri", "file_kanan", "file_kosong", "file_isi",
                          "file_static", "file_glow", "file_closed", "file_open",
                          "file_idle", "file_active", "file_hover"]:
                val = asset.get(field)
                if val and not val.startswith("["):
                    cek_file(val, id_a)

    cetak_info(f"Total file ditemukan: {ditemukan} | Belum dibuat: {tidak_ditemukan}")


def validasi_naming_convention(hasil: HasilValidasi) -> None:
    """Tahap 3: Validasi naming convention semua file di folder final/."""
    cetak_header("TAHAP 3 — Validasi Naming Convention (folder final/)")
    folder_final_list = list(ROOT.rglob("final"))
    if not folder_final_list:
        cetak_peringatan("Tidak ada folder final/ ditemukan. Asset belum dibuat.")
        hasil.tambah_peringatan("Tidak ada folder final/ berisi file")
        return

    total_file = 0
    file_lulus = 0
    for folder in folder_final_list:
        if not folder.is_dir():
            continue
        for file in folder.iterdir():
            if file.is_dir():
                continue
            total_file += 1
            nama = file.name
            prefix = nama.split("_")[0] if "_" in nama else ""
            pola = POLA_NAMING.get(prefix)
            if pola and pola.match(nama):
                file_lulus += 1
                hasil.tambah_ok()
            else:
                hasil.tambah_gagal(f"Naming tidak sesuai konvensi: {nama}  (prefix: '{prefix}')")

    if total_file == 0:
        cetak_info("Belum ada file di folder final/ — validasi naming ditunda")
    else:
        cetak_info(f"{file_lulus}/{total_file} file lulus naming convention")


def validasi_dimensi_png(hasil: HasilValidasi, verbose: bool = False) -> None:
    """Tahap 4: Validasi dimensi PNG sesuai spesifikasi."""
    if not PILLOW_ADA:
        cetak_peringatan("Pillow tidak terinstal. Validasi dimensi/palette dilewati.")
        cetak_info("Jalankan: pip install Pillow")
        hasil.tambah_peringatan("Pillow tidak tersedia")
        return

    cetak_header("TAHAP 4 — Validasi Dimensi PNG")
    manifest = muat_json(MANIFEST_PATH)
    if not manifest:
        return

    for kategori, daftar in manifest.get("assets", {}).items():
        for asset in daftar:
            file_path_str = asset.get("file")
            if not file_path_str or file_path_str.startswith("["):
                continue
            file_path = ROOT / file_path_str
            if not file_path.exists():
                continue
            if not file_path.suffix.lower() == ".png":
                continue

            lebar_spek = asset.get("lebar")
            tinggi_spek = asset.get("tinggi")
            if not lebar_spek or not tinggi_spek:
                continue

            try:
                with Image.open(file_path) as img:
                    l, t = img.size
                    if l == lebar_spek and t == tinggi_spek:
                        if verbose:
                            cetak_ok(f"{file_path.name} — {l}×{t}px ✓")
                        hasil.tambah_ok()
                    else:
                        hasil.tambah_gagal(
                            f"{file_path.name} — dimensi {l}×{t}px, "
                            f"diharapkan {lebar_spek}×{tinggi_spek}px"
                        )
            except Exception as e:
                hasil.tambah_gagal(f"{file_path.name} — gagal dibaca: {e}")


def validasi_palette_dan_antialiasing(hasil: HasilValidasi, verbose: bool = False) -> None:
    """Tahap 5: Validasi setiap pixel PNG menggunakan warna palette resmi dan tidak ada AA."""
    if not PILLOW_ADA:
        return  # Sudah dihandle di validasi_dimensi_png

    cetak_header("TAHAP 5 — Validasi Color Palette & Anti-Aliasing")
    png_files = list((ROOT / "assets").rglob("*.png"))

    if not png_files:
        cetak_info("Belum ada file PNG di assets/ — validasi palette ditunda")
        hasil.tambah_peringatan("Belum ada PNG untuk divalidasi")
        return

    for file_path in png_files:
        # Lewati file yang bukan di folder final
        if "final" not in str(file_path) and "processed" not in str(file_path):
            continue

        try:
            with Image.open(file_path) as img:
                img_rgba = img.convert("RGBA")
                pixels = list(img_rgba.getdata())

                warna_ilegal = set()
                pixel_aa = 0

                for r, g, b, a in pixels:
                    # Cek anti-aliasing: alpha bukan 0 atau 255
                    if 0 < a < 255:
                        pixel_aa += 1

                    # Skip pixel transparan penuh (alpha=0)
                    if a == 0:
                        continue

                    # Cek apakah warna ada di palette
                    if (r, g, b) not in PALETTE_RGB:
                        warna_ilegal.add(f"#{r:02X}{g:02X}{b:02X}")

                rel_path = file_path.relative_to(ROOT)

                if pixel_aa > 0:
                    hasil.tambah_gagal(
                        f"{rel_path} — {pixel_aa} pixel anti-aliasing (alpha semi-transparan)"
                    )
                else:
                    if verbose:
                        cetak_ok(f"{rel_path} — tidak ada anti-aliasing ✓")
                    hasil.tambah_ok()

                if warna_ilegal:
                    # Batasi output ke 5 warna pertama agar tidak membanjiri layar
                    contoh = list(warna_ilegal)[:5]
                    hasil.tambah_gagal(
                        f"{rel_path} — {len(warna_ilegal)} warna di luar palette: "
                        f"{', '.join(contoh)}{'...' if len(warna_ilegal) > 5 else ''}"
                    )
                else:
                    if verbose:
                        cetak_ok(f"{rel_path} — semua warna dalam palette ✓")
                    hasil.tambah_ok()

        except Exception as e:
            hasil.tambah_gagal(f"{file_path.name} — gagal divalidasi: {e}")


def validasi_audio(hasil: HasilValidasi) -> None:
    """Tahap 6: Verifikasi file audio ada dan format-nya benar."""
    cetak_header("TAHAP 6 — Validasi Asset Audio")
    manifest = muat_json(MANIFEST_PATH)
    if not manifest:
        return

    audio_assets = manifest.get("assets", {}).get("audio", [])
    for asset in audio_assets:
        file_path_str = asset.get("file")
        if not file_path_str:
            continue
        file_path = ROOT / file_path_str
        id_a = asset.get("id", "?")
        fmt = asset.get("format", "").upper()

        if file_path.exists():
            ext = file_path.suffix.upper().lstrip(".")
            if ext == fmt or (fmt == "OGG" and ext == "OGG") or (fmt == "WAV" and ext == "WAV"):
                cetak_ok(f"[{id_a}] {file_path.name} — format {fmt} ✓")
                hasil.tambah_ok()
            else:
                hasil.tambah_gagal(f"[{id_a}] {file_path.name} — format {ext}, diharapkan {fmt}")
        else:
            hasil.tambah_peringatan(f"[{id_a}] Belum ada: {file_path_str}")


def validasi_konsistensi_level(hasil: HasilValidasi) -> None:
    """Tahap 7: Validasi konsistensi data level JSON terhadap schema."""
    cetak_header("TAHAP 7 — Validasi Data Level")
    level_files = list((ROOT / "levels").glob("*.json"))

    if not level_files:
        cetak_peringatan("Belum ada file level di levels/")
        hasil.tambah_peringatan("Tidak ada file level ditemukan")
        return

    field_wajib_meta = ["id", "nama", "urutan", "bgm", "tileset", "gravitasi"]
    field_wajib_dim  = ["lebar_tiles", "tinggi_tiles", "tile_size"]

    for level_file in level_files:
        data = muat_json(level_file)
        if not data:
            hasil.tambah_gagal(f"{level_file.name} — JSON tidak valid")
            continue

        nama_file = level_file.name
        meta = data.get("meta", {})
        dim  = data.get("dimensi", {})

        # Cek field wajib
        for field in field_wajib_meta:
            if field not in meta:
                hasil.tambah_gagal(f"{nama_file} — field meta.{field} tidak ada")
            else:
                hasil.tambah_ok()

        for field in field_wajib_dim:
            if field not in dim:
                hasil.tambah_gagal(f"{nama_file} — field dimensi.{field} tidak ada")
            else:
                hasil.tambah_ok()

        # Cek konsistensi dimensi px vs tile
        if dim.get("lebar_px") and dim.get("lebar_tiles") and dim.get("tile_size"):
            lebar_hitung = dim["lebar_tiles"] * dim["tile_size"]
            if lebar_hitung == dim["lebar_px"]:
                cetak_ok(f"{nama_file} — dimensi konsisten ({dim['lebar_tiles']}×{dim['tile_size']}={dim['lebar_px']}px)")
                hasil.tambah_ok()
            else:
                hasil.tambah_gagal(
                    f"{nama_file} — inkonsistensi: "
                    f"{dim['lebar_tiles']}tiles × {dim['tile_size']}px ≠ {dim['lebar_px']}px"
                )

        # Cek objek tidak di luar batas level
        objek = data.get("objek", [])
        lebar_maks = dim.get("lebar_tiles", 0)
        tinggi_maks = dim.get("tinggi_tiles", 0)
        for obj in objek:
            tx = obj.get("tile_x", 0)
            ty = obj.get("tile_y", 0)
            if tx < 0 or tx >= lebar_maks:
                hasil.tambah_gagal(
                    f"{nama_file} — objek '{obj.get('id','?')}' tile_x={tx} di luar batas (0–{lebar_maks-1})"
                )
            else:
                hasil.tambah_ok()
            if ty < 0 or ty >= tinggi_maks:
                hasil.tambah_gagal(
                    f"{nama_file} — objek '{obj.get('id','?')}' tile_y={ty} di luar batas (0–{tinggi_maks-1})"
                )
            else:
                hasil.tambah_ok()

        # Cek exit level ada
        exits = [o for o in objek if o.get("tipe") == "level_exit"]
        if exits:
            cetak_ok(f"{nama_file} — {len(exits)} exit ditemukan ✓")
            hasil.tambah_ok()
        else:
            hasil.tambah_peringatan(f"{nama_file} — tidak ada level_exit")

        cetak_ok(f"{nama_file} — {len(objek)} objek valid")


def validasi_animasi_config(hasil: HasilValidasi) -> None:
    """Tahap 8: Validasi konsistensi animation config."""
    cetak_header("TAHAP 8 — Validasi Animation Config")
    config = muat_json(ANIM_CFG_PATH)
    if not config:
        hasil.tambah_gagal("animation_config.json tidak bisa dimuat")
        return

    # Hanya proses entri sprite yang berupa dict dengan key "animasi"
    entri_sprite = {
        k: v for k, v in config.items()
        if not k.startswith("_") and isinstance(v, dict) and "animasi" in v
    }
    for sprite_id, sprite_data in entri_sprite.items():
        animasi = sprite_data.get("animasi", {})
        if not animasi:
            hasil.tambah_peringatan(f"[{sprite_id}] Tidak ada entri animasi")
            continue

        for anim_id, anim_data in animasi.items():
            if not isinstance(anim_data, dict):
                continue
            frames = anim_data.get("frames", [])
            fps    = anim_data.get("fps", 0)
            loop   = anim_data.get("loop")

            # Validasi frames tidak kosong
            if not frames:
                hasil.tambah_gagal(f"[{sprite_id}/{anim_id}] frames kosong")
            else:
                hasil.tambah_ok()

            # Validasi fps realistis (1–30 untuk retro)
            if not (1 <= fps <= 30):
                hasil.tambah_gagal(f"[{sprite_id}/{anim_id}] fps={fps} di luar rentang 1–30")
            else:
                hasil.tambah_ok()

            # Validasi loop ada
            if loop is None:
                hasil.tambah_gagal(f"[{sprite_id}/{anim_id}] field 'loop' tidak ada")
            else:
                hasil.tambah_ok()

            # Validasi hitbox_aktif_frame tidak melebihi jumlah frames
            hitbox_frame = anim_data.get("hitbox_aktif_frame")
            if hitbox_frame is not None and hitbox_frame >= len(frames):
                hasil.tambah_gagal(
                    f"[{sprite_id}/{anim_id}] hitbox_aktif_frame={hitbox_frame} "
                    f"melebihi jumlah frames={len(frames)}"
                )
            elif hitbox_frame is not None:
                hasil.tambah_ok()

    cetak_ok(f"Selesai cek {len(entri_sprite)} sprite config")


# ─── Laporan Akhir ────────────────────────────────────────────────────────────

def cetak_laporan_akhir(hasil: HasilValidasi) -> None:
    """Cetak laporan validasi akhir."""
    cetak_header("LAPORAN VALIDASI AKHIR")
    hasil.cetak_ringkasan()

    if hasil.detail_gagal:
        print(f"\n{TEBAL}{MERAH}Daftar Kegagalan ({len(hasil.detail_gagal)} item):{RESET}")
        for i, kegagalan in enumerate(hasil.detail_gagal, 1):
            print(f"  {MERAH}{i:3d}.{RESET} {kegagalan}")

    print()
    if hasil.semua_lulus:
        print(f"{TEBAL}{HIJAU}✓ SEMUA VALIDASI LULUS — Pipeline siap{RESET}")
    else:
        print(f"{TEBAL}{MERAH}✗ ADA KEGAGALAN — Perbaiki sebelum lanjut ke produksi{RESET}")
    print()


# ─── Entry Point ──────────────────────────────────────────────────────────────

def parse_argumen():
    parser = argparse.ArgumentParser(
        description="Validasi asset pipeline Majapahit Platformer"
    )
    parser.add_argument("--hanya-manifest",  action="store_true", help="Hanya validasi keberadaan file dari manifest")
    parser.add_argument("--hanya-palette",   action="store_true", help="Hanya validasi palette & anti-aliasing PNG")
    parser.add_argument("--hanya-level",     action="store_true", help="Hanya validasi file level JSON")
    parser.add_argument("--hanya-animasi",   action="store_true", help="Hanya validasi animation config")
    parser.add_argument("--skip-palette",    action="store_true",
                        help="Lewati validasi palette & anti-aliasing (mode placeholder/prosedural)")
    parser.add_argument("--verbose", "-v",   action="store_true", help="Output detail per file")
    return parser.parse_args()


def main():
    args = parse_argumen()
    hasil = HasilValidasi()

    print(f"\n{TEBAL}╔══════════════════════════════════════════════════════════╗{RESET}")
    print(f"{TEBAL}║   MAJAPAHIT PLATFORMER — VALIDASI PIPELINE ASSET         ║{RESET}")
    print(f"{TEBAL}╚══════════════════════════════════════════════════════════╝{RESET}")
    print(f"Root proyek: {ROOT}")

    if args.hanya_manifest:
        validasi_manifest_asset(hasil, args.verbose)
    elif args.hanya_palette:
        validasi_palette_dan_antialiasing(hasil, args.verbose)
    elif args.hanya_level:
        validasi_konsistensi_level(hasil)
    elif args.hanya_animasi:
        validasi_animasi_config(hasil)
    else:
        # Jalankan semua validasi
        validasi_file_konfigurasi(hasil)
        validasi_manifest_asset(hasil, args.verbose)
        validasi_naming_convention(hasil)
        validasi_dimensi_png(hasil, args.verbose)
        if args.skip_palette:
            cetak_header("TAHAP 5 — Validasi Color Palette & Anti-Aliasing")
            cetak_info("Mode --skip-palette aktif: validasi palette dilewati (asset prosedural/placeholder)")
        else:
            validasi_palette_dan_antialiasing(hasil, args.verbose)
        validasi_audio(hasil)
        validasi_konsistensi_level(hasil)
        validasi_animasi_config(hasil)

    cetak_laporan_akhir(hasil)
    sys.exit(0 if hasil.semua_lulus else 1)


if __name__ == "__main__":
    main()
