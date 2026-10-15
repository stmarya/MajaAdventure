"""
test_sprite_dimensions.py
Verifikasi dimensi sprite sheet cukup untuk semua frame animasi yang dibutuhkan.
"""
import struct

def baca_dim(path):
    with open(path, 'rb') as f:
        f.read(8)   # PNG signature
        f.read(4)   # chunk length
        f.read(4)   # IHDR
        w = struct.unpack('>I', f.read(4))[0]
        h = struct.unpack('>I', f.read(4))[0]
        return w, h

def cek(label, path, fw, fh, butuh):
    w, h = baca_dim(path)
    kolom = w // fw
    baris = h // fh
    total = kolom * baris
    status = "OK" if total >= butuh else "KURANG!"
    print("  [{}] {}: {}x{}px -> {} kolom x {} baris = {} frames (butuh {})".format(
        status, label, w, h, kolom, baris, total, butuh))
    return status == "OK"

results = []
print("=" * 60)
print("TEST 3: SPRITE SHEET DIMENSION CHECK")
print("=" * 60)

results.append(cek("warrior_sheet",      "assets/characters/warrior/final/chr_warrior_sheet.png",             48, 48, 20))
results.append(cek("soldier_sheet",      "assets/characters/enemy_soldier/final/chr_soldier_sheet.png",       48, 52,  6))
results.append(cek("monkey_sheet",       "assets/characters/enemy_monkey/final/chr_monkey_sheet.png",         32, 32,  4))
results.append(cek("tileset_ruins",      "assets/environment/tilesets/final/env_ruins_wall_01.png",           16, 16, 16))
results.append(cek("vfx_hit",            "assets/vfx/final/vfx_hit_sheet.png",                               32, 32,  3))
results.append(cek("vfx_dust",           "assets/vfx/final/vfx_dust_sheet.png",                              24, 16,  3))
results.append(cek("vfx_torch",          "assets/vfx/final/vfx_torch_sheet.png",                             16, 24,  3))
results.append(cek("itm_gobog_sheet",    "assets/items/final/itm_gobog_sheet.png",                           16, 16,  4))

# Font check
w, h = baca_dim("assets/ui/fonts/font_majapahit_bitmap.png")
glyphs = (w // 8) * (h // 8)
charset_len = len("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,:-/()% ")
status = "OK" if glyphs >= charset_len else "KURANG!"
print("  [{}] font_bitmap: {}x{}px -> {} glyphs (butuh {})".format(status, w, h, glyphs, charset_len))
results.append(status == "OK")

fail = results.count(False)
print()
print("Hasil: {} OK, {} FAIL".format(results.count(True), fail))
