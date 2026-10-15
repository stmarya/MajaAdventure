"""
generate_placeholder_assets.py
Menghasilkan semua placeholder PNG asset untuk Majapahit Platformer.

Setiap asset dibuat secara prosedural:
  - Karakter      : sprite sheet dengan frame berwarna + label
  - Tileset        : grid 16×16 tile dengan warna berbeda per ID
  - Background     : gradient sederhana tiling-ready
  - Items          : ikon kecil berwarna
  - UI             : panel pixel art, health bar, ikon nyawa
  - VFX            : frame efek sederhana

Semua output ke folder final/ yang sesuai.
Ukuran canvas: 320×180px native, tile 16×16, karakter 48×48 frame.
Palette: 16 warna dari docs/color_palette.json
"""

import os
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ─── Root & Palette ───────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent.parent

with open(ROOT / "docs" / "color_palette.json") as f:
    PAL_DATA = json.load(f)

# Ubah palette list ke dict nama → RGB tuple
PALETTE = {}
for entry in PAL_DATA["colors"]:
    rgb_list = entry["rgb"]
    PALETTE[entry["name"]] = tuple(rgb_list)

def _hex(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

# Shorthand warna yang sering dipakai (fallback hardcode jika nama tidak cocok)
C = {
    "bg":       PALETTE.get("Hitam Tua",      _hex("#2B1810")),
    "bata":     PALETTE.get("Merah Bata",     _hex("#C1440E")),
    "terakota": PALETTE.get("Merah Terakota", _hex("#E8623A")),
    "emas":     PALETTE.get("Emas Tua",       _hex("#D4A017")),
    "kuning":   PALETTE.get("Kuning Emas",    _hex("#F5C842")),
    "putih":    PALETTE.get("Putih Gading",   _hex("#F0EBD8")),
    "hijau_g":  PALETTE.get("Hijau Gelap",    _hex("#2D5016")),
    "hijau":    PALETTE.get("Hijau Hutan",    _hex("#4A7C2F")),
    "biru":     PALETTE.get("Biru Indigo",    _hex("#1A3A5C")),
    "abu":      PALETTE.get("Abu Batu",       _hex("#7A6650")),
    "coklat_g": PALETTE.get("Coklat Gelap",   _hex("#5C2E1A")),
    "coklat_t": PALETTE.get("Coklat Kayu",    _hex("#8B4513")),
    "oranye":   PALETTE.get("Merah Terakota", _hex("#E8623A")),
    "biru_l":   PALETTE.get("Biru Langit",    _hex("#2E6B9E")),
    "kuning_p": PALETTE.get("Pasir Kulit",    _hex("#C8A882")),
    "hijau_l":  PALETTE.get("Hijau Daun",     _hex("#7AB648")),
    "krem":     PALETTE.get("Krem Terang",    _hex("#FDEEA0")),
}

TRANSPARENT = (0, 0, 0, 0)

def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)

def save(img: Image.Image, path: Path):
    ensure_dir(path.parent)
    img.save(str(path))
    print(f"  ✓ {path.relative_to(ROOT)}")

def rgb(color):
    """Kembalikan tuple RGBA dari RGB tuple."""
    return color + (255,) if len(color) == 3 else color

def draw_pixel_outline(draw, x, y, w, h, color, thickness=1):
    """Gambar outline kotak dengan ketebalan tertentu."""
    for t in range(thickness):
        draw.rectangle([x+t, y+t, x+w-1-t, y+h-1-t], outline=color)

def draw_label(draw, text, x, y, color=None):
    """Gambar label teks kecil 1px per karakter (manual pixel font)."""
    # Gunakan font default PIL yang kecil
    if color is None:
        color = C["putih"] + (255,)
    try:
        draw.text((x, y), text, fill=color)
    except Exception:
        pass

# ─── 1. KARAKTER SPRITE SHEETS ────────────────────────────────────────────────

def make_warrior_sheet():
    """
    chr_warrior_sheet.png — manifest: 480×270px
    Layout: 10 kolom × ~5.6 → pakai 10 kolom × 6 baris = 480×288 agar ≥270
    Sesuaikan: 10 cols × 48 = 480px lebar, 6 rows × 48 = 288 → crop ke 270 = 5.625 baris
    Manifest: 480×270 → 10 kolom × (270/48≈5.6 baris) — buat sheet pas 480×270px
    """
    FW, FH = 48, 48
    W, H = 480, 270          # sesuai manifest
    COLS = W // FW           # 10 kolom

    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Data animasi: (frame_idx, label, body_color, accent_color)
    frames = [
        # idle
        (0,  "IDL0", C["terakota"], C["emas"]),
        (1,  "IDL1", C["terakota"], C["kuning"]),
        (2,  "IDL2", C["terakota"], C["emas"]),
        (3,  "IDL3", C["terakota"], C["kuning"]),
        # run
        (4,  "RUN0", C["bata"],     C["emas"]),
        (5,  "RUN1", C["bata"],     C["kuning"]),
        (6,  "RUN2", C["bata"],     C["emas"]),
        (7,  "RUN3", C["bata"],     C["kuning"]),
        (8,  "RUN4", C["bata"],     C["emas"]),
        (9,  "RUN5", C["bata"],     C["kuning"]),
        # jump
        (10, "JMP↑", C["oranye"],   C["emas"]),
        (11, "JMP—", C["oranye"],   C["kuning"]),
        (12, "JMP↓", C["oranye"],   C["emas"]),
        (13, "LAND", C["terakota"], C["emas"]),
        # attack
        (14, "ATK0", C["bata"],     C["kuning"]),
        (15, "ATK1", C["bata"],     C["kuning_p"]),
        (16, "ATK2", C["bata"],     C["emas"]),
        # hurt
        (17, "HRT0", C["abu"],      C["putih"]),
        (18, "HRT1", C["abu"],      C["putih"]),
        # death
        (19, "DTH0", C["coklat_g"], C["abu"]),
        (20, "DTH1", C["coklat_g"], C["coklat_t"]),
    ]

    for (fi, label, body, accent) in frames:
        col = fi % COLS
        row = fi // COLS
        px = col * FW
        py = row * FH

        # Tubuh karakter: persegi panjang piksel
        # Kaki
        draw.rectangle([px+16, py+32, px+24, py+44, ], fill=rgb(C["coklat_g"]))
        draw.rectangle([px+28, py+32, px+36, py+44, ], fill=rgb(C["coklat_g"]))
        # Badan
        draw.rectangle([px+14, py+16, px+38, py+34], fill=rgb(body))
        # Kepala
        draw.rectangle([px+16, py+4,  px+34, py+18], fill=rgb(C["kuning_p"]))
        # Udeng (ikat kepala merah)
        draw.rectangle([px+14, py+2,  px+36, py+8],  fill=rgb(C["bata"]))
        # Aksen baju (motif batik)
        draw.rectangle([px+16, py+22, px+38, py+24], fill=rgb(accent))
        # Keris (hanya di frame attack)
        if "ATK" in label:
            draw.rectangle([px+36, py+18, px+46, py+20], fill=rgb(C["kuning"]))
            draw.rectangle([px+36, py+14, px+38, py+20], fill=rgb(C["abu"]))
        # Outline
        draw_pixel_outline(draw, px+1, py+1, FW-2, FH-2, rgb(C["bg"]))
        # Label
        draw.text((px+2, py+2), label, fill=rgb(C["putih"]))

    path = ROOT / "assets/characters/warrior/final/chr_warrior_sheet.png"
    save(img, path)


def make_soldier_sheet():
    """chr_soldier_sheet.png — manifest: 288×52px (6 kolom × 1 baris)"""
    COLS = 6
    FW, FH = 48, 52
    W, H = 288, 52            # sesuai manifest: 6×48=288, 1 baris=52

    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    frames = [
        (0, "IDL0", C["abu"],   C["bata"]),
        (1, "IDL1", C["abu"],   C["terakota"]),
        (2, "PAT",  C["abu"],   C["bata"]),
        (3, "ATK0", C["abu"],   C["kuning"]),
        (4, "ATK1", C["coklat_g"], C["kuning"]),
        (5, "ATK2", C["coklat_g"], C["emas"]),
        (6, "STG0", C["coklat_t"], C["putih"]),
        (7, "DTH0", C["coklat_g"], C["abu"]),
        (8, "DTH1", C["coklat_g"], C["coklat_t"]),
    ]

    for (fi, label, body, accent) in frames:
        col = fi % COLS
        row = fi // COLS
        px = col * FW
        py = row * FH

        # Kaki
        draw.rectangle([px+14, py+36, px+22, py+48], fill=rgb(C["coklat_g"]))
        draw.rectangle([px+28, py+36, px+36, py+48], fill=rgb(C["coklat_g"]))
        # Badan + baju zirah
        draw.rectangle([px+12, py+18, px+40, py+38], fill=rgb(body))
        # Helm
        draw.rectangle([px+14, py+4,  px+36, py+20], fill=rgb(C["abu"]))
        draw.rectangle([px+12, py+10, px+38, py+16], fill=rgb(C["coklat_g"]))
        # Tombak
        if "ATK" in label:
            draw.rectangle([px+38, py+8,  px+46, py+44], fill=rgb(C["coklat_t"]))
            draw.rectangle([px+38, py+4,  px+46, py+12], fill=rgb(C["kuning"]))
        else:
            draw.rectangle([px+38, py+10, px+42, py+48], fill=rgb(C["coklat_t"]))
        # Outline
        draw_pixel_outline(draw, px+1, py+1, FW-2, FH-2, rgb(C["bg"]))
        draw.text((px+2, py+2), label, fill=rgb(C["putih"]))

    path = ROOT / "assets/characters/enemy_soldier/final/chr_soldier_sheet.png"
    save(img, path)


def make_monkey_sheet():
    """chr_monkey_sheet.png — enemy monkey 32×32px per frame, 4 kolom × 1 baris"""
    COLS = 4
    FW, FH = 32, 32
    W, H = COLS * FW, FH

    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    frames = [
        (0, "IDL0", C["coklat_t"]),
        (1, "IDL1", C["coklat_t"]),
        (2, "JMP0", C["coklat_g"]),
        (3, "JMP1", C["coklat_g"]),
    ]

    for (fi, label, body) in frames:
        px = fi * FW
        py = 0
        # Ekor
        draw.ellipse([px+20, py+18, px+30, py+28], fill=rgb(body))
        # Badan
        draw.ellipse([px+6,  py+12, px+26, py+28], fill=rgb(body))
        # Kepala
        draw.ellipse([px+8,  py+2,  px+24, py+18], fill=rgb(C["kuning_p"]))
        # Mata
        draw.rectangle([px+10, py+6, px+13, py+9], fill=rgb(C["bg"]))
        draw.rectangle([px+18, py+6, px+21, py+9], fill=rgb(C["bg"]))
        # Mulut
        draw.rectangle([px+12, py+12, px+20, py+14], fill=rgb(C["bg"]))
        # Outline
        draw_pixel_outline(draw, px+1, py+1, FW-2, FH-2, rgb(C["bg"]))
        draw.text((px+2, py+2), label, fill=rgb(C["putih"]))

    path = ROOT / "assets/characters/enemy_monkey/final/chr_monkey_sheet.png"
    save(img, path)


# ─── 2. TILESET ───────────────────────────────────────────────────────────────

def make_tileset():
    """
    env_ruins_wall_01.png — sheet penuh tileset 16 tile dalam 4×4 grid (64×64px).
    Engine menggunakan kolomTileset=4 untuk menghitung koordinat src tile.
    Manifest mencatat dimensi 1 tile (16×16), sheet sesungguhnya = 64×64.
    """
    COLS, ROWS = 4, 4
    T = 16
    W, H = COLS * T, ROWS * T   # 64×64 px — sheet tileset penuh

    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    tile_colors = {
        1:  C["bata"],      # bata_solid_bersih
        2:  C["terakota"],  # bata_lumut_ringan
        3:  C["hijau_l"],   # bata_lumut_lebat
        4:  C["coklat_t"],  # bata_rusak
        5:  C["hijau"],     # lantai_bata_rumput
        6:  C["abu"],       # dinding_batu
        7:  C["coklat_g"],  # lantai_batu_gelap
        8:  C["bata"],      # dekorasi_paras_kala
        9:  C["oranye"],    # bata_ornamen
        10: C["biru"],      # tangga_kayu        (climbable)
        11: C["kuning_p"],  # spike_idle          (hazard)
        12: C["kuning"],    # spike_aktif         (hazard aktif)
        13: C["hijau_g"],   # tanah_rumput
        14: C["coklat_t"],  # one_way_platform
        15: C["abu"],       # kolom_bata
        16: C["hijau_l"],   # panel_dekorasi
    }

    for tile_id in range(1, 17):
        col = (tile_id - 1) % COLS
        row = (tile_id - 1) // COLS
        px = col * T
        py = row * T

        base_color = tile_colors.get(tile_id, C["bg"])
        draw.rectangle([px, py, px+T-1, py+T-1], fill=rgb(base_color))

        # Tambah detail tekstur minimal
        if tile_id in (1, 2, 3, 4):  # bata wall
            draw.line([(px, py+7), (px+T-1, py+7)],    fill=rgb(C["coklat_g"]))
            draw.line([(px+7, py), (px+7, py+7)],      fill=rgb(C["coklat_g"]))
            draw.line([(px+2, py+8), (px+2, py+T-1)],  fill=rgb(C["coklat_g"]))
        if tile_id == 10:  # tangga
            for i in range(0, T, 4):
                draw.line([(px+2, py+i), (px+T-3, py+i)], fill=rgb(C["kuning_p"]))
        if tile_id in (11, 12):  # spike
            for si in range(3):
                sx = px + 2 + si * 5
                tip_y = py + 2
                draw.polygon([sx, py+T-2, sx+2, tip_y, sx+4, py+T-2],
                             fill=rgb(C["putih"]))

        # Outline border tipis
        draw.rectangle([px, py, px+T-1, py+T-1], outline=rgb(C["bg"]))

    path = ROOT / "assets/environment/tilesets/final/env_ruins_wall_01.png"
    save(img, path)


# ─── 3. BACKGROUND LAYERS ─────────────────────────────────────────────────────

def make_bg_sky():
    """bg_sky_layer.png — 320×180px langit gradient biru"""
    W, H = 320, 180
    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Gradient langit dari atas ke bawah
    for y in range(H):
        t = y / H
        r = int(C["biru"][0] * (1-t) + C["biru_l"][0] * t)
        g = int(C["biru"][1] * (1-t) + C["biru_l"][1] * t)
        b = int(C["biru"][2] * (1-t) + C["biru_l"][2] * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Tambah beberapa awan piksel sederhana
    clouds = [(40, 30), (130, 20), (220, 40), (290, 25)]
    for (cx, cy) in clouds:
        draw.rectangle([cx-12, cy-4, cx+12, cy+4], fill=rgb(C["putih"]))
        draw.rectangle([cx-8,  cy-8, cx+8,  cy+0], fill=rgb(C["putih"]))

    path = ROOT / "assets/environment/backgrounds/final/bg_sky_layer.png"
    save(img, path)


def make_bg_jungle_far():
    """bg_jungle_far.png — 320×180px hutan jauh siluet"""
    W, H = 320, 180
    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Langit background (transparan di atas, hutan di bawah)
    # Siluet pohon jauh
    for i in range(0, W, 24):
        h_pohon = 60 + (i * 7 % 40)
        cy = H - h_pohon
        # Batang
        draw.rectangle([i+10, cy+h_pohon//2, i+14, H], fill=rgb(C["hijau_g"]))
        # Dedaunan segitiga
        pts = [(i+12, cy), (i+2, cy+h_pohon//2), (i+22, cy+h_pohon//2)]
        draw.polygon(pts, fill=rgb(C["hijau_g"]))

    path = ROOT / "assets/environment/backgrounds/final/bg_jungle_far.png"
    save(img, path)


def make_bg_jungle_near():
    """bg_jungle_near.png — manifest: 320×120px hutan dekat"""
    W, H = 320, 120
    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Pohon lebih besar dan detail
    for i in range(0, W, 32):
        h_pohon = 80 + (i * 11 % 50)
        cy = H - h_pohon
        # Batang
        draw.rectangle([i+12, cy+h_pohon//3, i+20, H], fill=rgb(C["coklat_g"]))
        # Tiga lapis dedaunan
        for layer in range(3):
            lh = h_pohon // 2 - layer * 10
            ly = cy + layer * 12
            pts = [(i+16, ly), (i+2, ly+lh), (i+30, ly+lh)]
            draw.polygon(pts, fill=rgb(C["hijau"]))

    # Semak-semak di bawah
    for i in range(0, W, 20):
        draw.ellipse([i, H-16, i+18, H], fill=rgb(C["hijau_g"]))

    path = ROOT / "assets/environment/backgrounds/final/bg_jungle_near.png"
    save(img, path)


# ─── 4. ITEMS ─────────────────────────────────────────────────────────────────

def make_gobog_sheet():
    """itm_gobog_sheet.png — koin gobog 16×16px, 4 frame animasi berputar"""
    COLS = 4
    T = 16
    W, H = COLS * T, T

    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    for i in range(4):
        px = i * T
        # Frame putaran: full → sedikit gepeng → sangat gepeng → sedikit gepeng
        widths = [12, 8, 2, 8]
        w = widths[i]
        offset = (T - w) // 2
        # Koin emas
        draw.ellipse([px+offset, 2, px+offset+w, T-2], fill=rgb(C["kuning"]))
        if w > 4:
            # Motif tengah
            draw.ellipse([px+offset+2, 4, px+offset+w-2, T-4], fill=rgb(C["emas"]))
        draw.text((px+2, 2), f"C{i}", fill=rgb(C["bg"]))

    path = ROOT / "assets/items/final/itm_gobog_sheet.png"
    save(img, path)


def make_maja_static():
    """itm_maja_static.png — buah maja 16×16px"""
    T = 16
    img  = Image.new("RGBA", (T, T), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Buah bulat hijau
    draw.ellipse([2, 4, T-2, T-2], fill=rgb(C["hijau"]))
    draw.ellipse([3, 5, T-5, T-4], fill=rgb(C["hijau_l"]))
    # Tangkai
    draw.rectangle([6, 0, 8, 4], fill=rgb(C["coklat_t"]))
    # Daun
    draw.ellipse([7, 0, 13, 5], fill=rgb(C["hijau_g"]))
    # Outline
    draw_pixel_outline(draw, 2, 4, T-4, T-6, rgb(C["bg"]))

    path = ROOT / "assets/items/final/itm_maja_static.png"
    save(img, path)


def make_chest_closed():
    """itm_chest_closed.png — peti tertutup 32×32px"""
    W, H = 32, 32
    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Kotak peti
    draw.rectangle([2, 12, W-2, H-2], fill=rgb(C["coklat_t"]))
    # Tutup
    draw.rectangle([2,  4, W-2, 14],  fill=rgb(C["coklat_g"]))
    # Kunci tengah
    draw.rectangle([13, 14, 19, 20],  fill=rgb(C["emas"]))
    draw.ellipse([13, 10, 19, 16],    fill=rgb(C["kuning"]))
    # Strip logam
    draw.rectangle([2, 12, W-2, 14],  fill=rgb(C["emas"]))
    draw.rectangle([2, 14, 6,  H-2],  fill=rgb(C["emas"]))
    draw.rectangle([W-6, 14, W-2, H-2], fill=rgb(C["emas"]))
    # Outline
    draw_pixel_outline(draw, 2, 4, W-4, H-6, rgb(C["bg"]), 1)

    path = ROOT / "assets/items/final/itm_chest_closed.png"
    save(img, path)


def make_chest_open():
    """itm_chest_open.png — peti terbuka 32×32px"""
    W, H = 32, 32
    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Kotak badan
    draw.rectangle([2, 16, W-2, H-2], fill=rgb(C["coklat_t"]))
    # Tutup terangkat di belakang
    draw.rectangle([2, 4, W-2, 16],   fill=rgb(C["coklat_g"]))
    # Kilatan isi (sinar emas)
    draw.polygon([14, 12, 16, 4, 18, 12], fill=rgb(C["kuning"]))
    # Strip logam
    draw.rectangle([2, 16, W-2, 18],  fill=rgb(C["emas"]))
    # Outline
    draw_pixel_outline(draw, 2, 4, W-4, H-6, rgb(C["bg"]), 1)

    path = ROOT / "assets/items/final/itm_chest_open.png"
    save(img, path)


# ─── 5. VFX ───────────────────────────────────────────────────────────────────

def make_vfx_hit():
    """vfx_hit_sheet.png — manifest: 96×32px (6 frame × 16px, 2 baris → 96×32)"""
    import math
    COLS, FW, FH = 6, 16, 32
    W, H = COLS * FW, FH     # 96×32 sesuai manifest
    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    for i in range(COLS):
        px = i * FW
        py = 0
        r = max(1, (COLS - i) * 2)
        alpha = max(0, 220 - i * 35)
        cx, cy = px + FW//2, FH//2
        draw.ellipse([cx-r, cy-r, cx+r, cy+r],
                     fill=(C["kuning"][0], C["kuning"][1], C["kuning"][2], alpha))
        if i < COLS - 1 and r > 2:
            for angle in range(0, 360, 90):
                ax = int(cx + r * math.cos(math.radians(angle + i*15)))
                ay = int(cy + r * math.sin(math.radians(angle + i*15)))
                draw.rectangle([ax-1, ay-1, ax+1, ay+1], fill=rgb(C["putih"]))

    path = ROOT / "assets/vfx/final/vfx_hit_sheet.png"
    save(img, path)


def make_vfx_dust():
    """vfx_dust_sheet.png — manifest: 72×16px (4.5 frame → 72/16=4.5, pakai 72×16)"""
    W, H = 72, 16   # sesuai manifest
    FW = 18         # 72 / 4 = 18px per frame
    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    for i in range(4):
        px = i * FW
        alpha = max(0, 255 - i * 60)
        if alpha > 0:
            for j in range(3):
                ox = (j - 1) * (i + 2)
                draw.ellipse([px+8+ox-1, H-5-i, px+8+ox+2, H-2-i],
                            fill=(C["kuning_p"][0], C["kuning_p"][1], C["kuning_p"][2], alpha))

    path = ROOT / "assets/vfx/final/vfx_dust_sheet.png"
    save(img, path)


def make_vfx_torch():
    """vfx_torch_sheet.png — manifest: 48×24px (3 frame × 16px × 24px)"""
    COLS = 3
    FW, FH = 16, 24
    img  = Image.new("RGBA", (COLS * FW, FH), TRANSPARENT)   # 48×24 sesuai manifest
    draw = ImageDraw.Draw(img)

    for i in range(COLS):
        px = i * FW
        # Batang obor
        draw.rectangle([px+6, FH-8, px+10, FH-1], fill=rgb(C["coklat_t"]))
        # Api (bergerak sedikit tiap frame)
        offset = (i % 2) * 2 - 1
        # Luar api
        draw.ellipse([px+4+offset, 4,  px+12+offset, FH-6], fill=rgb(C["bata"]))
        # Tengah api
        draw.ellipse([px+5+offset, 6,  px+11+offset, FH-8], fill=rgb(C["kuning"]))
        # Inti api
        draw.ellipse([px+6, 8, px+10, FH-10], fill=rgb(C["putih"]))

    path = ROOT / "assets/vfx/final/vfx_torch_sheet.png"
    save(img, path)


# ─── 6. UI ────────────────────────────────────────────────────────────────────

def make_ui_healthbar_empty():
    """ui_healthbar_empty.png — frame health bar kosong 96×12px"""
    W, H = 96, 12
    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W-1, H-1], fill=rgb(C["bg"]))
    draw_pixel_outline(draw, 0, 0, W, H, rgb(C["emas"]), 2)

    path = ROOT / "assets/ui/hud/final/ui_healthbar_empty.png"
    save(img, path)


def make_ui_healthbar_fill():
    """ui_healthbar_fill.png — bar isi health 96×12px"""
    W, H = 96, 12
    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Gradient merah bata → terakota
    for x in range(W):
        t = x / W
        r = int(C["bata"][0] * (1-t) + C["terakota"][0] * t)
        g = int(C["bata"][1] * (1-t) + C["terakota"][1] * t)
        b = int(C["bata"][2] * (1-t) + C["terakota"][2] * t)
        draw.line([(x, 2), (x, H-2)], fill=(r, g, b, 255))

    # Highlight atas
    draw.line([(2, 2), (W-2, 2)], fill=rgb(C["terakota"]))

    path = ROOT / "assets/ui/hud/final/ui_healthbar_fill.png"
    save(img, path)


def make_ui_icon_life():
    """ui_icon_life.png — ikon hati/nyawa 16×16px"""
    T = 16
    img  = Image.new("RGBA", (T, T), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Bentuk hati piksel
    heart = [
        (4,4),(5,3),(6,3),(7,4),(8,4),(9,3),(10,3),(11,4),
        (3,5),(4,4),(5,4),(6,4),(7,4),(8,4),(9,4),(10,4),(11,4),(12,5),
        (3,6),(4,5),(5,5),(6,5),(7,5),(8,5),(9,5),(10,5),(11,5),(12,6),
        (4,7),(5,6),(6,6),(7,6),(8,6),(9,6),(10,6),(11,6),(12,7),
        (5,8),(6,7),(7,7),(8,7),(9,7),(10,7),(11,8),
        (6,9),(7,8),(8,8),(9,8),(10,9),
        (7,10),(8,9),(9,10),
        (8,11),
    ]
    for (x, y) in heart:
        draw.rectangle([x, y, x, y], fill=rgb(C["bata"]))

    path = ROOT / "assets/ui/hud/final/ui_icon_life.png"
    save(img, path)


def make_ui_coin_counter():
    """ui_coin_counter.png — manifest: 48×16px"""
    W, H = 48, 16
    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W-1, H-1], fill=(C["bg"][0], C["bg"][1], C["bg"][2], 200))
    draw_pixel_outline(draw, 0, 0, W, H, rgb(C["kuning"]), 1)

    # Ikon koin kecil
    draw.ellipse([2, 2, 8, 9], fill=rgb(C["kuning"]))
    draw.ellipse([3, 3, 7, 8], fill=rgb(C["emas"]))

    path = ROOT / "assets/ui/hud/final/ui_coin_counter.png"
    save(img, path)


def make_ui_screens():
    """Generate 4 layar UI: mainmenu, gameover, levelcomplete, pause"""
    W, H = 320, 180

    screens = {
        "ui_screen_mainmenu":      ("MAJAPAHIT", "PLATFORMER", "TEKAN Z UNTUK MULAI", C["biru"]),
        "ui_screen_gameover":      ("GAME OVER",  "",           "TEKAN Z COBA LAGI",   C["bg"]),
        "ui_screen_levelcomplete": ("LEVEL",      "SELESAI!",   "TEKAN Z LANJUT",      C["hijau_g"]),
        "ui_screen_pause":         ("JEDA",       "",           "ESC = LANJUT",         C["coklat_g"]),
    }

    for name, (title1, title2, subtitle, bg_color) in screens.items():
        img  = Image.new("RGBA", (W, H), rgb(bg_color))
        draw = ImageDraw.Draw(img)

        # Border bata
        draw_pixel_outline(draw, 4, 4, W-8, H-8, rgb(C["emas"]),     3)
        draw_pixel_outline(draw, 8, 8, W-16, H-16, rgb(C["bata"]),   1)

        # Ornamen sudut
        for (cx, cy) in [(8,8),(W-24,8),(8,H-24),(W-24,H-24)]:
            draw.rectangle([cx, cy, cx+14, cy+14], fill=rgb(C["emas"]))
            draw.rectangle([cx+2, cy+2, cx+12, cy+12], fill=rgb(bg_color))

        # Judul besar (pixel manual)
        draw.rectangle([W//2-60, H//2-40, W//2+60, H//2-16], fill=rgb(C["emas"]))
        draw.text((W//2-55, H//2-36), title1, fill=rgb(C["bg"]))
        if title2:
            draw.text((W//2-55, H//2-26), title2, fill=rgb(C["bg"]))

        # Subtitle berkedip
        draw.rectangle([W//2-64, H//2+4, W//2+64, H//2+16], fill=rgb(C["coklat_g"]))
        draw.text((W//2-60, H//2+6), subtitle, fill=rgb(C["putih"]))

        # Dekorasi batik (garis diagonal)
        for i in range(0, W, 16):
            draw.line([(i, H-20), (i+8, H-12)], fill=rgb(C["bata"]))

        path = ROOT / f"assets/ui/screens/final/{name}.png"
        save(img, path)


def make_font_bitmap():
    """
    font_majapahit_bitmap.png — manifest: 128×48px
    Charset 48 karakter diatur dalam 16 kolom × 3 baris = 128×48px (8×8 per glyph)
    """
    CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,:-/()% "
    GW, GH = 8, 8
    GCOLS = 16            # 16 glyph per baris
    W = GCOLS * GW        # 128px
    H = 3 * GH            # 3 baris × 8 = 24 → padded ke 48
    H = 48                # sesuai manifest: 128×48

    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Gambar setiap karakter dalam grid GCOLS kolom
    for i, char in enumerate(CHARSET):
        col = i % GCOLS
        row = i // GCOLS
        px  = col * GW
        py  = row * GH
        # Outline kotak per glyph
        draw.rectangle([px+1, py, px+GW-2, py+GH-1], outline=rgb(C["putih"]))
        # Garis diagonal unik per karakter (bisa dibedakan saat debug)
        draw.line([(px+1, py+1), (px+GW-2, py+GH-2)], fill=rgb(C["putih"]))

    path = ROOT / "assets/ui/fonts/font_majapahit_bitmap.png"
    save(img, path)


# ─── 7. PROPS ENVIRONMENT ─────────────────────────────────────────────────────

def make_prop_candi_bentar():
    """env_candi_bentar_left.png & right.png — setengah gerbang 32×64px"""
    W, H = 32, 64

    for side in ["left", "right"]:
        img  = Image.new("RGBA", (W, H), TRANSPARENT)
        draw = ImageDraw.Draw(img)

        # Badan gerbang
        draw.rectangle([4, 16, W-4, H-1],   fill=rgb(C["bata"]))
        # Kepala runcing
        if side == "left":
            pts = [(4,16), (W-4,16), (W//2, 2)]
        else:
            pts = [(4,16), (W-4,16), (W//2, 2)]
        draw.polygon(pts, fill=rgb(C["terakota"]))
        # Detail ornamen
        draw.rectangle([8, 24, W-8, 30],   fill=rgb(C["emas"]))
        draw.rectangle([8, 36, W-8, 42],   fill=rgb(C["emas"]))
        draw.rectangle([8, 48, W-8, 54],   fill=rgb(C["emas"]))
        # Outline
        draw_pixel_outline(draw, 4, 2, W-8, H-3, rgb(C["bg"]), 1)

        path = ROOT / f"assets/environment/props/final/env_candi_bentar_{side}.png"
        save(img, path)


def make_prop_palmtrees():
    """env_palmtree_tall/med/short.png — pohon palem, manifest: 32×96 / 32×64 / 32×48"""
    variants = {
        "tall":  (32, 96),
        "med":   (32, 64),   # manifest: 32×64 (bukan 24×64)
        "short": (32, 48),   # manifest: 32×48 (bukan 16×48)
    }

    for name, (W, H) in variants.items():
        img  = Image.new("RGBA", (W, H), TRANSPARENT)
        draw = ImageDraw.Draw(img)

        trunk_w = max(4, W // 6)
        tx = (W - trunk_w) // 2

        # Batang melengkung
        for y in range(H//4, H):
            offset = int((y - H//4) / (H * 0.6) * 3)
            draw.rectangle([tx+offset, y, tx+trunk_w+offset, y], fill=rgb(C["coklat_t"]))

        # Daun palmtree
        leaf_cx = tx + trunk_w//2
        leaf_cy = H//4
        for angle in range(0, 360, 60):
            import math
            lx = int(leaf_cx + (W//3) * math.cos(math.radians(angle)))
            ly = int(leaf_cy + (H//8) * math.sin(math.radians(angle)))
            draw.ellipse([min(leaf_cx,lx)-2, min(leaf_cy,ly)-2,
                          max(leaf_cx,lx)+2, max(leaf_cy,ly)+2],
                         fill=rgb(C["hijau"]))
            draw.line([(leaf_cx, leaf_cy), (lx, ly)], fill=rgb(C["hijau_g"]))

        # Buah kelapa
        draw.ellipse([leaf_cx-3, leaf_cy+2, leaf_cx+3, leaf_cy+8], fill=rgb(C["coklat_t"]))

        path = ROOT / f"assets/environment/props/final/env_palmtree_{name}.png"
        save(img, path)


# ─── 8. BANNER ────────────────────────────────────────────────────────────────

def make_banner():
    """banner Majapahit merah-putih 16×32px"""
    W, H = 16, 32
    img  = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Tiang
    draw.rectangle([0, 0, 2, H-1], fill=rgb(C["coklat_t"]))
    # Kain merah atas
    draw.rectangle([2, 2, W-1, H//2], fill=rgb(C["bata"]))
    # Kain putih bawah
    draw.rectangle([2, H//2, W-1, H-2], fill=rgb(C["putih"]))
    # Outline
    draw_pixel_outline(draw, 2, 2, W-3, H-4, rgb(C["bg"]), 1)

    path = ROOT / "assets/environment/props/final/env_banner_majapahit.png"
    save(img, path)


# ─── 9. LADDER TILE ──────────────────────────────────────────────────────────

def make_ladder_tile():
    """env_ladder_tile.png — tile tangga 16×16px (tile ID 10)"""
    T = 16
    img  = Image.new("RGBA", (T, T), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Dua tiang vertikal
    draw.rectangle([2, 0, 4, T-1],   fill=rgb(C["coklat_t"]))
    draw.rectangle([11, 0, 13, T-1], fill=rgb(C["coklat_t"]))
    # Anak tangga (4 buah)
    for y in range(2, T, 4):
        draw.rectangle([2, y, 13, y+1], fill=rgb(C["coklat_g"]))

    path = ROOT / "assets/environment/tilesets/final/env_ladder_tile.png"
    save(img, path)


def make_spike_tiles():
    """env_trap_spike_idle.png & _active.png — tile spike 16×16px"""
    T = 16

    for state in ["idle", "active"]:
        img  = Image.new("RGBA", (T, T), TRANSPARENT)
        draw = ImageDraw.Draw(img)

        base_color = C["abu"] if state == "idle" else C["kuning"]
        # Platform bawah
        draw.rectangle([0, T-4, T-1, T-1], fill=rgb(C["coklat_t"]))
        # 3 spike
        for si in range(3):
            sx = 2 + si * 5
            pts = [(sx, T-4), (sx+2, 2), (sx+4, T-4)]
            draw.polygon(pts, fill=rgb(base_color))

        path = ROOT / f"assets/environment/tilesets/final/env_trap_spike_{state}.png"
        save(img, path)


def make_relief_tile():
    """env_ruins_relief_01.png — relief kala 16×16px dekoratif"""
    T = 16
    img  = Image.new("RGBA", (T, T), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # Bata dasar
    draw.rectangle([0, 0, T-1, T-1], fill=rgb(C["bata"]))
    # Wajah kala (relief)
    draw.ellipse([3, 3, T-3, T-3], fill=rgb(C["terakota"]))
    draw.rectangle([5, 5, 7, 9],   fill=rgb(C["bg"]))
    draw.rectangle([9, 5, 11, 9],  fill=rgb(C["bg"]))
    draw.rectangle([6, 11, 10, 13], fill=rgb(C["bg"]))
    # Tanduk
    draw.polygon([3,3, 0,0, 4,5], fill=rgb(C["emas"]))
    draw.polygon([T-3,3, T-0,0, T-4,5], fill=rgb(C["emas"]))

    path = ROOT / "assets/environment/tilesets/final/env_ruins_relief_01.png"
    save(img, path)


# ─── MAIN ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║   GENERATE PLACEHOLDER PNG ASSETS                       ║")
    print("╚══════════════════════════════════════════════════════════╝\n")

    print("─── Karakter ─────────────────────────────────────────────")
    make_warrior_sheet()
    make_soldier_sheet()
    make_monkey_sheet()

    print("\n─── Tileset ──────────────────────────────────────────────")
    make_tileset()
    make_ladder_tile()
    make_spike_tiles()
    make_relief_tile()

    print("\n─── Background Layers ────────────────────────────────────")
    make_bg_sky()
    make_bg_jungle_far()
    make_bg_jungle_near()

    print("\n─── Items ────────────────────────────────────────────────")
    make_gobog_sheet()
    make_maja_static()
    make_chest_closed()
    make_chest_open()

    print("\n─── VFX ──────────────────────────────────────────────────")
    make_vfx_hit()
    make_vfx_dust()
    make_vfx_torch()

    print("\n─── UI ───────────────────────────────────────────────────")
    make_ui_healthbar_empty()
    make_ui_healthbar_fill()
    make_ui_icon_life()
    make_ui_coin_counter()
    make_ui_screens()
    make_font_bitmap()

    print("\n─── Props Environment ────────────────────────────────────")
    make_prop_candi_bentar()
    make_prop_palmtrees()
    make_banner()

    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║   SELESAI — Semua placeholder PNG telah digenerate      ║")
    print("╚══════════════════════════════════════════════════════════╝\n")
