#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_assets.py
=================
Script pemrosesan pipeline asset untuk proyek Majapahit Platformer.

Tugas:
  1. Memindahkan file dari raw/ ke processed/ (crop, strip metadata)
  2. Memindahkan file dari processed/ ke final/ setelah QA manual
  3. Mengenerate sprite sheet dari frame individu
  4. Memperbarui status asset di production_checklist.md
  5. Menghitung statistik progres produksi

Cara pakai:
  python tools/pipeline/process_assets.py --status
  python tools/pipeline/process_assets.py --buat-sheet chr_warrior
  python tools/pipeline/process_assets.py --pindah-final assets/characters/warrior/processed/
  python tools/pipeline/process_assets.py --update-checklist

Dependensi:
  pip install Pillow
"""

import os
import sys
import json
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Tuple

try:
    from PIL import Image
    PILLOW_ADA = True
except ImportError:
    PILLOW_ADA = False

# ─── Konfigurasi ──────────────────────────────────────────────────────────────

ROOT          = Path(__file__).resolve().parent.parent.parent
DOCS          = ROOT / "docs"
MANIFEST_PATH = DOCS / "asset_manifest.json"
ANIM_CFG_PATH = DOCS / "animation_config.json"
CHECKLIST_OUT = DOCS / "production_checklist.md"

RESET  = "\033[0m"
HIJAU  = "\033[92m"
KUNING = "\033[93m"
BIRU   = "\033[94m"
MERAH  = "\033[91m"
TEBAL  = "\033[1m"

# ─── Utilitas ─────────────────────────────────────────────────────────────────

def cetak_ok(t): print(f"  {HIJAU}✓{RESET} {t}")
def cetak_err(t): print(f"  {MERAH}✗{RESET} {t}")
def cetak_inf(t): print(f"  {BIRU}ℹ{RESET} {t}")

def muat_json(path: Path) -> Optional[dict]:
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        cetak_err(f"Gagal muat {path.name}: {e}")
        return None

def simpan_json(path: Path, data: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ─── Fungsi Status Pipeline ───────────────────────────────────────────────────

def tampilkan_status() -> None:
    """Tampilkan ringkasan progres produksi berdasarkan file yang ada di final/."""
    print(f"\n{TEBAL}╔══════════════════════════════════════════════╗{RESET}")
    print(f"{TEBAL}║   STATUS PROGRES PRODUKSI ASSET              ║{RESET}")
    print(f"{TEBAL}╚══════════════════════════════════════════════╝{RESET}")

    manifest = muat_json(MANIFEST_PATH)
    if not manifest:
        return

    total     = 0
    selesai   = 0
    high_total  = 0
    high_done   = 0
    per_kategori = {}

    for kategori, daftar in manifest.get("assets", {}).items():
        kat_total  = 0
        kat_selesai = 0
        for asset in daftar:
            total += 1
            kat_total += 1
            if asset.get("prioritas") == "HIGH":
                high_total += 1

            # Cek keberadaan file final
            file_str = asset.get("file") or asset.get("file_kosong") or asset.get("file_static") or asset.get("file_closed")
            ada = False
            if file_str and not file_str.startswith("["):
                ada = (ROOT / file_str).exists()

            if ada:
                selesai += 1
                kat_selesai += 1
                if asset.get("prioritas") == "HIGH":
                    high_done += 1

        per_kategori[kategori] = (kat_selesai, kat_total)

    persen = (selesai / total * 100) if total > 0 else 0
    persen_high = (high_done / high_total * 100) if high_total > 0 else 0

    print(f"\n  Total Asset   : {selesai}/{total} selesai ({persen:.1f}%)")
    print(f"  Prioritas HIGH: {high_done}/{high_total} selesai ({persen_high:.1f}%)")
    print()
    print(f"  {'Kategori':<20} {'Selesai':>8} {'Total':>8} {'Progress':>10}")
    print(f"  {'─'*20} {'─'*8} {'─'*8} {'─'*10}")
    for kat, (done, tot) in per_kategori.items():
        bar_len = 10
        filled  = int((done / tot * bar_len)) if tot > 0 else 0
        bar     = "█" * filled + "░" * (bar_len - filled)
        print(f"  {kat:<20} {done:>8} {tot:>8}  [{bar}]")
    print()


# ─── Fungsi Buat Sprite Sheet ─────────────────────────────────────────────────

def buat_sprite_sheet(sprite_id: str) -> None:
    """
    Gabungkan frame individu dari folder processed/ menjadi sprite sheet tunggal.
    Frame diurutkan berdasarkan nama file.
    Output disimpan ke folder final/.
    """
    if not PILLOW_ADA:
        cetak_err("Pillow tidak terinstal. Jalankan: pip install Pillow")
        sys.exit(1)

    anim_config = muat_json(ANIM_CFG_PATH)
    if not anim_config or sprite_id not in anim_config:
        cetak_err(f"Sprite ID '{sprite_id}' tidak ditemukan di animation_config.json")
        return

    sprite_data  = anim_config[sprite_id]
    frame_lebar  = sprite_data.get("frame_lebar", 48)
    frame_tinggi = sprite_data.get("frame_tinggi", 48)

    # Tentukan folder processed berdasarkan sprite_id
    id_ke_folder = {
        "warrior":       ROOT / "assets/characters/warrior/processed",
        "enemy_soldier": ROOT / "assets/characters/enemy_soldier/processed",
        "enemy_monkey":  ROOT / "assets/characters/enemy_monkey/processed",
    }
    folder_processed = id_ke_folder.get(sprite_id)
    if not folder_processed:
        cetak_err(f"Folder processed tidak dikonfigurasi untuk sprite_id='{sprite_id}'")
        return

    if not folder_processed.exists():
        cetak_err(f"Folder tidak ditemukan: {folder_processed.relative_to(ROOT)}")
        return

    frame_files = sorted([f for f in folder_processed.glob("*.png")])
    if not frame_files:
        cetak_err(f"Tidak ada file PNG di {folder_processed.relative_to(ROOT)}")
        return

    jumlah_frame = len(frame_files)
    # Layout: maks 8 frame per baris
    kolom_maks = 8
    kolom = min(jumlah_frame, kolom_maks)
    baris = (jumlah_frame + kolom_maks - 1) // kolom_maks

    sheet_lebar  = kolom * frame_lebar
    sheet_tinggi = baris * frame_tinggi

    sheet = Image.new("RGBA", (sheet_lebar, sheet_tinggi), (0, 0, 0, 0))

    for idx, frame_file in enumerate(frame_files):
        col = idx % kolom_maks
        row = idx // kolom_maks
        try:
            frame_img = Image.open(frame_file).convert("RGBA")
            if frame_img.size != (frame_lebar, frame_tinggi):
                cetak_err(f"  Frame {frame_file.name} ukuran {frame_img.size}, diharapkan ({frame_lebar},{frame_tinggi})")
                continue
            sheet.paste(frame_img, (col * frame_lebar, row * frame_tinggi))
        except Exception as e:
            cetak_err(f"  Gagal muat frame {frame_file.name}: {e}")
            continue

    # Tentukan output
    folder_final_map = {
        "warrior":       ROOT / "assets/characters/warrior/final",
        "enemy_soldier": ROOT / "assets/characters/enemy_soldier/final",
        "enemy_monkey":  ROOT / "assets/characters/enemy_monkey/final",
    }
    output_folder = folder_final_map.get(sprite_id, ROOT / "assets/characters" / sprite_id / "final")
    output_folder.mkdir(parents=True, exist_ok=True)
    output_path = output_folder / f"chr_{sprite_id}_sheet.png"

    sheet.save(output_path, "PNG")
    cetak_ok(f"Sprite sheet dibuat: {output_path.relative_to(ROOT)}")
    cetak_inf(f"Dimensi: {sheet_lebar}×{sheet_tinggi}px | {jumlah_frame} frame | {kolom} kolom × {baris} baris")


# ─── Fungsi Pindah ke Final ───────────────────────────────────────────────────

def pindah_ke_final(folder_processed_str: str) -> None:
    """
    Pindahkan semua file PNG dari folder processed/ ke final/,
    setelah QA manual dinyatakan selesai.
    File yang sudah ada di final/ tidak akan ditimpa (pakai --paksa untuk timpa).
    """
    folder_processed = ROOT / folder_processed_str
    if not folder_processed.exists():
        cetak_err(f"Folder tidak ditemukan: {folder_processed_str}")
        return

    # Tentukan folder final (satu level di atas processed, lalu final)
    folder_final = folder_processed.parent / "final"
    folder_final.mkdir(exist_ok=True)

    file_list = list(folder_processed.glob("*.png"))
    if not file_list:
        cetak_inf(f"Tidak ada PNG di {folder_processed_str}")
        return

    dipindah = 0
    dilewati = 0
    for f in file_list:
        tujuan = folder_final / f.name
        if tujuan.exists():
            cetak_inf(f"  Lewati (sudah ada): {f.name}")
            dilewati += 1
        else:
            shutil.copy2(f, tujuan)
            cetak_ok(f"  Dipindah: {f.name}")
            dipindah += 1

    cetak_inf(f"Selesai: {dipindah} dipindah, {dilewati} dilewati")


# ─── Fungsi Update Checklist ──────────────────────────────────────────────────

def update_production_checklist() -> None:
    """
    Generate ulang production_checklist.md berdasarkan manifest dan
    status file yang ada di folder final/.
    """
    manifest = muat_json(MANIFEST_PATH)
    if not manifest:
        return

    sekarang = datetime.now().strftime("%d %B %Y %H:%M")
    baris = [
        f"# Production Checklist — Majapahit Platformer",
        f"",
        f"**Diperbarui:** {sekarang}",
        f"",
        f"---",
        f"",
        f"> Checklist ini di-generate otomatis oleh `tools/pipeline/process_assets.py --update-checklist`.",
        f"> Status **Selesai** = file ditemukan di folder `final/`. Status **Belum** = file belum ada.",
        f"",
    ]

    SIMBOL = { True: "✅", False: "⬜" }
    LABEL  = { True: "Selesai", False: "Belum Dibuat" }

    total = 0
    selesai_total = 0

    for kategori, daftar in manifest.get("assets", {}).items():
        baris += [f"## {kategori.upper()}", ""]
        baris += ["| Status | ID | Nama | Prioritas | PIC |", "|---|---|---|---|---|"]

        for asset in daftar:
            total += 1
            id_a      = asset.get("id", "?")
            nama_a    = asset.get("nama", "—")
            prior_a   = asset.get("prioritas", "—")
            pic_a     = asset.get("pic", "—")

            # Cek file
            file_str = (asset.get("file") or asset.get("file_kosong") or
                        asset.get("file_static") or asset.get("file_closed") or
                        asset.get("file_kiri"))
            ada = False
            if file_str and not file_str.startswith("["):
                ada = (ROOT / file_str).exists()

            if ada:
                selesai_total += 1

            baris.append(
                f"| {SIMBOL[ada]} {LABEL[ada]} | `{id_a}` | {nama_a} | **{prior_a}** | {pic_a} |"
            )

        baris.append("")

    persen = (selesai_total / total * 100) if total > 0 else 0
    baris_ringkasan = [
        "---",
        "",
        "## Ringkasan Progres",
        "",
        f"| Metrik | Nilai |",
        f"|---|---|",
        f"| Total asset | {total} |",
        f"| Selesai | {selesai_total} ({persen:.1f}%) |",
        f"| Belum dibuat | {total - selesai_total} |",
        "",
    ]
    baris = baris + baris_ringkasan

    with open(CHECKLIST_OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(baris))

    cetak_ok(f"Checklist diperbarui: {CHECKLIST_OUT.relative_to(ROOT)}")
    cetak_inf(f"Progres: {selesai_total}/{total} ({persen:.1f}%)")


# ─── Entry Point ──────────────────────────────────────────────────────────────

def parse_argumen():
    parser = argparse.ArgumentParser(description="Pipeline processor asset Majapahit Platformer")
    parser.add_argument("--status",            action="store_true",  help="Tampilkan progres produksi")
    parser.add_argument("--buat-sheet",        metavar="SPRITE_ID",  help="Gabungkan frame ke sprite sheet (contoh: warrior)")
    parser.add_argument("--pindah-final",      metavar="FOLDER",     help="Pindahkan processed/ ke final/")
    parser.add_argument("--update-checklist",  action="store_true",  help="Perbarui production_checklist.md")
    return parser.parse_args()


def main():
    args = parse_argumen()

    print(f"\n{TEBAL}╔══════════════════════════════════════════════╗{RESET}")
    print(f"{TEBAL}║   MAJAPAHIT PLATFORMER — ASSET PIPELINE      ║{RESET}")
    print(f"{TEBAL}╚══════════════════════════════════════════════╝{RESET}")

    if args.status:
        tampilkan_status()
    elif args.buat_sheet:
        buat_sprite_sheet(args.buat_sheet)
    elif args.pindah_final:
        pindah_ke_final(args.pindah_final)
    elif args.update_checklist:
        update_production_checklist()
    else:
        # Default: tampilkan status
        tampilkan_status()
        print(f"Gunakan --help untuk melihat semua opsi.")


if __name__ == "__main__":
    main()
