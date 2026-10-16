"""
assemble_new_assets.py
Pipeline: ambil frame PNG dari repo staging/MajaAdventure/assets/,
susun menjadi sprite sheet sesuai dimensi engine.
Jalankan: python tools/pipeline/assemble_new_assets.py [--source PATH_REPO]

Engine dimensions:
  - Karakter utama : frame 48x48px
  - Enemy soldier  : frame 48x52px
  - Enemy monkey   : frame 32x32px
  - Tile           : 16x16px
  - Item gobog     : 16x16px
  - Item peti      : 32x32px
  - Props          : various (diperbesar sesuai PropRenderer.DEF_PROP)
  - Background     : diperbesar ke 320px lebar minimal
"""

import argparse
import os
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT if (ROOT / ".asset-packs" / "manifest.json").is_file() else ROOT / "staging" / "MajaAdventure"
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output", type=Path, default=ROOT, help="Output root; use a separate folder for visual QA")
parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
args = parser.parse_args()
SOURCE = args.source.resolve()
OUTPUT = args.output.resolve()
BASE_TERPISAH = str(SOURCE / "assets" / "base-pack")
BASE_DUNIA = SOURCE / "assets" / "expansions" / "dunia-hidup-01"
if not Path(BASE_TERPISAH).is_dir() or not BASE_DUNIA.is_dir():
    parser.error("Paket belum dipulihkan. Jalankan tools/restore_assets.py di repo sumber.")
os.chdir(ROOT)
OUT_CHARS     = "assets/characters"
OUT_ENV       = "assets/environment"
OUT_ITEMS     = "assets/items/final"
OUT_UI        = "assets/ui"
OUT_VFX       = "assets/vfx/final"

log = []
errors = []

def log_ok(msg):
    log.append("[OK]  " + msg)
    print("[OK] ", msg)

def log_err(msg):
    errors.append("[ERR] " + msg)
    print("[ERR]", msg)

def muat_frames(folder, prefix="frame_", count=None):
    """Muat semua frame_NN.png dari folder, urutkan, return list Image."""
    frames = []
    if not os.path.isdir(folder):
        raise FileNotFoundError(f"Folder tidak ada: {folder}")
    files = sorted([f for f in os.listdir(folder) if f.startswith(prefix) and f.endswith(".png")])
    if count:
        if len(files) < count:
            raise ValueError(f"{folder}: perlu {count} frame, tersedia {len(files)}")
        files = files[:count]
    for fn in files:
        with Image.open(os.path.join(folder, fn)) as source:
            img = source.convert("RGBA")
            frames.append(img)
    return frames

def buat_sheet_horisontal(frames, target_w, target_h, output_path):
    """Susun frames secara horizontal dalam satu sheet, resize tiap frame ke target_w x target_h."""
    if not frames:
        log_err(f"Tidak ada frame untuk {output_path}")
        return False
    sheet = Image.new("RGBA", (target_w * len(frames), target_h), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        # Resize dengan aspect ratio terjaga, lalu center
        frame_resized = resize_fit(frame, target_w, target_h)
        sheet.paste(frame_resized, (i * target_w, 0))
    simpan(sheet, output_path)
    log_ok(f"{len(frames)} frames -> {output_path} ({sheet.width}x{sheet.height})")
    return True

def resize_fit(img, target_w, target_h):
    """Resize image agar muat dalam target_w x target_h, jaga aspect ratio, center."""
    src_w, src_h = img.size
    scale = min(target_w / src_w, target_h / src_h)
    new_w = max(1, int(src_w * scale))
    new_h = max(1, int(src_h * scale))
    img_resized = img.resize((new_w, new_h), Image.Resampling.NEAREST)
    # Jika pixelated lebih baik pakai NEAREST untuk karakter
    result = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    offset_x = (target_w - new_w) // 2
    offset_y = (target_h - new_h) // 2
    result.paste(img_resized, (offset_x, offset_y))
    return result

def resize_exact(img, w, h):
    """Resize exact tanpa aspect ratio."""
    return img.resize((w, h), Image.Resampling.NEAREST)

def simpan(img, path):
    path = Path(path)
    if path.is_absolute(): path = path.relative_to(ROOT)
    if ".." in path.parts: raise ValueError("Output path escapes root")
    path = OUTPUT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG")
    log_ok(f"Simpan {path} ({img.width}x{img.height})")

# =============================================================================
# 1. KARAKTER UTAMA (warrior) — sheet 48x48px per frame
#    idle(4) + run(7) + jump_ascent(1)+jump_peak(1)+jump_descent(1)+land(1) + attack(3) + hurt(2) + death(2)
#    Layout: baris per animasi, semua dalam 1 sheet horizontal
# =============================================================================
print("\n=== KARAKTER UTAMA ===")

# Muat semua animasi warrior
idle_frames    = muat_frames(os.path.join(BASE_TERPISAH, "karakter_utama", "idle"),   count=4)
run_frames     = muat_frames(os.path.join(BASE_TERPISAH, "karakter_utama", "run"),    count=7)  # 6 frame run
jump_frames    = muat_frames(os.path.join(BASE_TERPISAH, "karakter_utama", "jump"),   count=4)  # ascent, peak, descent, land
attack_frames  = muat_frames(os.path.join(BASE_TERPISAH, "karakter_utama", "attack"), count=3)  # 3 frame attack (skip frame ke-4)
defeat_frames  = muat_frames(os.path.join(BASE_TERPISAH, "karakter_utama", "defeat"), count=2)  # 2 frame death

# hurt = 2 frame (reuse idle 0,1)
hurt_frames = idle_frames[:2] if len(idle_frames) >= 2 else idle_frames[:1] * 2

# Total frame warrior: 4+7+1+1+1+3+2+2 = 21, tapi engine pakai index 0-19 (20 frame)
# Layout engine (dari animation_config.json):
# idle: [0,1,2,3] - 4 frame
# run: [4,5,6,7,8,9] - 6 frame
# jump_ascent: [10], jump_peak: [11], jump_descent: [12], land: [10 reuse]
# attack: [13,14,15] - 3 frame
# hurt: [16,17] - 2 frame
# death: [18,19] - 2 frame
# Total unik: 20 frame (index 0-19)

FW = 48  # frame width
FH = 48  # frame height

# Buat sheet dengan tepat 10 kolom x 2 baris = 20 frame (480x96)
# Kolom 10, baris ditentukan dari jumlah frame
TOTAL_FRAME = 20
KOLOM = 10
BARIS = (TOTAL_FRAME + KOLOM - 1) // KOLOM

sheet_warrior = Image.new("RGBA", (FW * KOLOM, FH * BARIS), (0, 0, 0, 0))

def paste_frame(sheet, img, idx, fw, fh, kolom):
    x = (idx % kolom) * fw
    y = (idx // kolom) * fh
    f = resize_fit(img, fw, fh)
    sheet.paste(f, (x, y))

# idle: index 0-3
for i, f in enumerate(idle_frames[:4]):
    paste_frame(sheet_warrior, f, i, FW, FH, KOLOM)

# run: index 4-9 (6 frame)
run6 = run_frames[:6] if len(run_frames) >= 6 else run_frames + [run_frames[-1]] * (6 - len(run_frames))
for i, f in enumerate(run6):
    paste_frame(sheet_warrior, f, 4 + i, FW, FH, KOLOM)

# jump_ascent: index 10
if jump_frames: paste_frame(sheet_warrior, jump_frames[0], 10, FW, FH, KOLOM)
# jump_peak: index 11
if len(jump_frames) > 1: paste_frame(sheet_warrior, jump_frames[1], 11, FW, FH, KOLOM)
elif jump_frames: paste_frame(sheet_warrior, jump_frames[0], 11, FW, FH, KOLOM)
# jump_descent: index 12
if len(jump_frames) > 2: paste_frame(sheet_warrior, jump_frames[2], 12, FW, FH, KOLOM)
elif jump_frames: paste_frame(sheet_warrior, jump_frames[-1], 12, FW, FH, KOLOM)

# attack: index 13-15
for i, f in enumerate(attack_frames[:3]):
    paste_frame(sheet_warrior, f, 13 + i, FW, FH, KOLOM)

# hurt: index 16-17 (reuse idle 0,1)
for i, f in enumerate(hurt_frames[:2]):
    paste_frame(sheet_warrior, f, 16 + i, FW, FH, KOLOM)

# death: index 18-19
for i, f in enumerate(defeat_frames[:2]):
    paste_frame(sheet_warrior, f, 18 + i, FW, FH, KOLOM)

simpan(sheet_warrior, "assets/characters/warrior/final/chr_warrior_sheet.png")

# =============================================================================
# 2. ENEMY SOLDIER (prajurit) — frame 48x52px
#    idle(2), patrol(reuse idle), attack(3), stagger(1 reuse), death(1 reuse)
#    Layout engine: idle=[0,1], patrol=[0,1], attack=[2,3,4], stagger=[5], death=[5]
# =============================================================================
print("\n=== ENEMY SOLDIER ===")

praj_idle   = muat_frames(os.path.join(BASE_TERPISAH, "musuh", "prajurit", "idle"),   count=2)
praj_attack = muat_frames(os.path.join(BASE_TERPISAH, "musuh", "prajurit", "attack"), count=3)

EFW, EFH = 48, 52
# 6 frame: idle0, idle1, attack0, attack1, attack2, stagger/death
TOTAL_SOLDIER = 6
sheet_soldier = Image.new("RGBA", (EFW * TOTAL_SOLDIER, EFH), (0, 0, 0, 0))

def paste_h(sheet, img, idx, fw, fh):
    f = resize_fit(img, fw, fh)
    sheet.paste(f, (idx * fw, 0))

for i, f in enumerate(praj_idle[:2]):
    paste_h(sheet_soldier, f, i, EFW, EFH)
for i, f in enumerate(praj_attack[:3]):
    paste_h(sheet_soldier, f, 2 + i, EFW, EFH)
# stagger/death (index 5): reuse idle_0
if praj_idle:
    paste_h(sheet_soldier, praj_idle[0], 5, EFW, EFH)

simpan(sheet_soldier, "assets/characters/enemy_soldier/final/chr_soldier_sheet.png")

# =============================================================================
# 3. ENEMY MONKEY — frame 32x32px
#    idle(1), jump(4)  → total 4 frame: idle=[0,1 reuse], jump=[2,3]
# =============================================================================
print("\n=== ENEMY MONKEY ===")

monkey_idle = muat_frames(os.path.join(BASE_TERPISAH, "musuh", "monyet", "idle"), count=1)
monkey_jump = muat_frames(os.path.join(BASE_TERPISAH, "musuh", "monyet", "jump"), count=4)

MFW, MFH = 32, 32
TOTAL_MONKEY = 4
sheet_monkey = Image.new("RGBA", (MFW * TOTAL_MONKEY, MFH), (0, 0, 0, 0))

# idle: [0,1] — pakai frame_00 dua kali
if monkey_idle:
    paste_h(sheet_monkey, monkey_idle[0], 0, MFW, MFH)
    paste_h(sheet_monkey, monkey_idle[0], 1, MFW, MFH)
# jump: [2,3]
for i, f in enumerate(monkey_jump[:2]):
    paste_h(sheet_monkey, f, 2 + i, MFW, MFH)

simpan(sheet_monkey, "assets/characters/enemy_monkey/final/chr_monkey_sheet.png")

# =============================================================================
# 4. TILESET — 4x4 grid, tile 16x16px = 64x64px total
#    Tile ID layout (sesuai tileset_config.json):
#    Baris 0: 1=bata_solid, 2=bata_lumut_ringan, 3=bata_lumut_lebat, 4=bata_rusak
#    Baris 1: 5=lantai_rumput, 6=lantai_bersih, 7=relief_kala, 8=bata_tepi_kiri
#    Baris 2: 9=bata_tepi_kanan, 10=tangga, 11=spike_idle, 12=spike_aktif
#    Baris 3: 13=tanah_kosong(0), 14=one_way, 15=bata_dalam, 16=canopy
# =============================================================================
print("\n=== TILESET ===")

TW = TH = 16
sheet_tile = Image.new("RGBA", (TW * 4, TH * 4), (0, 0, 0, 0))

def paste_tile(sheet, img, col, row, tw=16, th=16):
    f = img.resize((tw, th), Image.Resampling.NEAREST)
    sheet.paste(f, (col * tw, row * th))

# Tile bata/dinding: ambil dari tiles/dinding (5 varian)
dinding = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "tiles", "dinding"), count=5)
dinding_retak = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "tiles", "dinding_retak"), count=4)
dinding_tanaman = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "tiles", "dinding_tanaman"), count=1)
lantai_rumput = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "tiles", "lantai_rumput"), count=5)
sudut_atas = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "tiles", "sudut_atas"), count=2)
tangga_img = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "tangga", "kayu"), count=1)
spike_imgs = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "perangkap", "spike"), count=2)
relief_kala = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "relief", "kala"), count=1)

# Baris 0: tile 1-4 (bata solid varian)
for i, t in enumerate((dinding[:4] if len(dinding) >= 4 else dinding + dinding_retak)[:4]):
    paste_tile(sheet_tile, t, i, 0)

# Baris 1: tile 5=lantai_rumput, 6=lantai_bersih, 7=relief_kala, 8=bata_tepi
lantai_list = lantai_rumput[:1] + (dinding_tanaman[:1] or dinding[:1])
if lantai_rumput: paste_tile(sheet_tile, lantai_rumput[0], 0, 1)  # 5
if len(lantai_rumput) > 1: paste_tile(sheet_tile, lantai_rumput[1], 1, 1)  # 6
if relief_kala: paste_tile(sheet_tile, relief_kala[0], 2, 1)  # 7
if sudut_atas: paste_tile(sheet_tile, sudut_atas[0], 3, 1)  # 8

# Baris 2: tile 9=bata_tepi_kanan, 10=tangga, 11=spike_idle, 12=spike_aktif
if len(sudut_atas) > 1: paste_tile(sheet_tile, sudut_atas[1], 0, 2)  # 9
elif sudut_atas: paste_tile(sheet_tile, sudut_atas[0], 0, 2)
if tangga_img: paste_tile(sheet_tile, tangga_img[0], 1, 2)  # 10
if spike_imgs: paste_tile(sheet_tile, spike_imgs[0], 2, 2)  # 11 spike idle
if len(spike_imgs) > 1: paste_tile(sheet_tile, spike_imgs[1], 3, 2)  # 12 spike aktif

# Baris 3: tile 13=kosong(transparan), 14=one_way(lantai), 15=bata_dalam, 16=canopy
# 13 = transparant (sudah kosong)
if lantai_rumput: paste_tile(sheet_tile, lantai_rumput[0], 1, 3)  # 14 one_way
if dinding: paste_tile(sheet_tile, dinding[-1], 2, 3)  # 15 bata_dalam
if dinding_tanaman: paste_tile(sheet_tile, dinding_tanaman[0], 3, 3)  # 16 canopy

simpan(sheet_tile, "assets/environment/tilesets/final/env_ruins_wall_01.png")

# =============================================================================
# 5. BACKGROUND LAYERS — diperbesar ke 320x180px minimal
# =============================================================================
print("\n=== BACKGROUND ===")

kanopi_jauh  = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "kanopi", "jauh"),  count=1)
kanopi_dekat = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "kanopi", "dekat"), count=1)

if kanopi_jauh:
    bg_jauh = kanopi_jauh[0].resize((640, 180), Image.Resampling.NEAREST)
    simpan(bg_jauh, "assets/environment/backgrounds/final/bg_jungle_far.png")

if kanopi_dekat:
    bg_dekat = kanopi_dekat[0].resize((640, 180), Image.Resampling.NEAREST)
    simpan(bg_dekat, "assets/environment/backgrounds/final/bg_jungle_near.png")

# bg_sky: buat gradient biru (asset baru tidak punya sky, buat solid)
sky = Image.new("RGBA", (640, 180), (28, 74, 120, 255))
simpan(sky, "assets/environment/backgrounds/final/bg_sky_layer.png")

# =============================================================================
# 6. PROPS — sesuai DEF_PROP di PropRenderer.js
#    palmtree_tall: 32x64, palmtree_med: 32x48, palmtree_short: 24x32
#    candi_kiri/kanan: 32x64
#    banner: 16x32
# =============================================================================
print("\n=== PROPS ===")

pohon_tinggi = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "pohon", "tinggi"), count=1)
pohon_sedang = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "pohon", "sedang"), count=1)
pohon_pendek = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "pohon", "pendek"), count=1)
candi_kiri   = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "candi_bentar", "kiri"),  count=1)
candi_kanan  = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "candi_bentar", "kanan"), count=1)
bendera      = muat_frames(os.path.join(BASE_TERPISAH, "dekorasi", "bendera"), count=1)

def simpan_prop(frames, w, h, path):
    if frames:
        img = frames[0].resize((w, h), Image.Resampling.NEAREST)
        simpan(img, path)

simpan_prop(pohon_tinggi, 32, 64, "assets/environment/props/final/env_palmtree_tall.png")
simpan_prop(pohon_sedang, 32, 48, "assets/environment/props/final/env_palmtree_med.png")
simpan_prop(pohon_pendek, 24, 32, "assets/environment/props/final/env_palmtree_short.png")
simpan_prop(candi_kiri,   32, 64, "assets/environment/props/final/env_candi_bentar_left.png")
simpan_prop(candi_kanan,  32, 64, "assets/environment/props/final/env_candi_bentar_right.png")
simpan_prop(bendera,      16, 32, "assets/environment/props/final/env_banner_majapahit.png")

# Relief: ambil dari relief/kala
relief_kala_full = muat_frames(os.path.join(BASE_TERPISAH, "lingkungan", "relief", "kala"), count=1)
if relief_kala_full:
    img = relief_kala_full[0].resize((16, 16), Image.Resampling.NEAREST)
    simpan(img, "assets/environment/tilesets/final/env_ruins_relief_01.png")

# =============================================================================
# 7. ITEMS — gobog 16x16 (4 frame), peti 32x32 (close/open)
# =============================================================================
print("\n=== ITEMS ===")

gobog = muat_frames(os.path.join(BASE_TERPISAH, "items", "gobog"), count=4)
peti  = muat_frames(os.path.join(BASE_TERPISAH, "items", "peti"),  count=2)
maja  = muat_frames(os.path.join(BASE_TERPISAH, "items", "maja"),  count=1)

if gobog:
    sheet_gobog = Image.new("RGBA", (16 * len(gobog), 16), (0, 0, 0, 0))
    for i, f in enumerate(gobog):
        g = f.resize((16, 16), Image.Resampling.NEAREST)
        sheet_gobog.paste(g, (i * 16, 0))
    simpan(sheet_gobog, "assets/items/final/itm_gobog_sheet.png")

if peti and len(peti) >= 2:
    closed = peti[0].resize((32, 32), Image.Resampling.NEAREST)
    opened = peti[1].resize((32, 32), Image.Resampling.NEAREST)
    simpan(closed, "assets/items/final/itm_chest_closed.png")
    simpan(opened, "assets/items/final/itm_chest_open.png")
elif peti:
    img = peti[0].resize((32, 32), Image.Resampling.NEAREST)
    simpan(img, "assets/items/final/itm_chest_closed.png")
    simpan(img, "assets/items/final/itm_chest_open.png")

if maja:
    img = maja[0].resize((16, 16), Image.Resampling.NEAREST)
    simpan(img, "assets/items/final/itm_maja_static.png")

# =============================================================================
# 8. UI dari staging/majapahit-assets-terpisah/ui/
# =============================================================================
print("\n=== UI ===")

ui_gobog = muat_frames(os.path.join(BASE_TERPISAH, "ui", "counter_gobog"), count=1)
ui_nyawa = muat_frames(os.path.join(BASE_TERPISAH, "ui", "nyawa_keris"),   count=1)

if ui_gobog:
    img = ui_gobog[0].resize((12, 12), Image.Resampling.NEAREST)
    simpan(img, "assets/ui/hud/final/ui_coin_icon.png")

if ui_nyawa:
    img = ui_nyawa[0].resize((14, 14), Image.Resampling.NEAREST)
    simpan(img, "assets/ui/hud/final/ui_icon_life.png")

# =============================================================================
# 9. VFX dan fauna dari Dunia Hidup (bukan sprite pengganti)
# =============================================================================
print("\n=== VFX TORCH ===")

def buat_sheet_pixel(folder, w, h, count, output):
    frames = muat_frames(str(folder), count=count)
    # Satu crop bersama mempertahankan pivot antarframe.
    bounds = [frame.getbbox() for frame in frames]
    if any(bound is None for bound in bounds):
        raise ValueError(f"Frame transparan/kosong: {folder}")
    left = min(bound[0] for bound in bounds)
    top = min(bound[1] for bound in bounds)
    right = max(bound[2] for bound in bounds)
    bottom = max(bound[3] for bound in bounds)
    scale = min(w / (right - left), h / (bottom - top))
    size = (max(1, int((right - left) * scale)),
            max(1, int((bottom - top) * scale)))
    sheet = Image.new("RGBA", (w * count, h))
    for index, frame in enumerate(frames):
        sprite = frame.crop((left, top, right, bottom)).resize(size, Image.Resampling.NEAREST)
        sheet.paste(sprite, (index * w + (w - size[0]) // 2, (h - size[1]) // 2))
    simpan(sheet, str(output))

for folder, name, w, h in [
    ("lingkungan/obor", "torch", 16, 24),
    ("vfx/benturan", "hit", 32, 32),
    ("vfx/debu_mendarat", "dust", 24, 16),
]:
    buat_sheet_pixel(BASE_DUNIA / folder, w, h, 3,
                     ROOT / "assets" / "vfx" / "final" / f"vfx_{name}_sheet.png")

for name, w, h in [
    ("burung", 12, 8), ("kupu_kupu", 10, 8),
    ("capung", 12, 6), ("kunang_kunang", 6, 6),
]:
    buat_sheet_pixel(BASE_DUNIA / "fauna" / name, w, h, 4,
                     ROOT / "assets" / "environment" / "fauna" / f"fauna_{name}_sheet.png")

# =============================================================================
# RINGKASAN
# =============================================================================
print(f"\n{'='*60}")
print(f"SELESAI: {len(log)} OK, {len(errors)} error")
if errors:
    print("\nERROR:")
    for e in errors:
        print(" ", e)
    raise SystemExit(1)
