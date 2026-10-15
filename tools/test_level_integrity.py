"""
test_level_integrity.py
Validasi lengkap data level_01.json.
"""
import json

print("=" * 60)
print("TEST 4: LEVEL DATA INTEGRITY")
print("=" * 60)

with open("levels/level_01.json", "r", encoding="utf-8") as f:
    d = json.load(f)

errors = []
warnings = []

# Dimensi
dim = d["dimensi"]
lebar = dim["lebar_tiles"]
tinggi = dim["tinggi_tiles"]
print("  Dimensi: {}x{} tiles ({}x{}px)".format(lebar, tinggi, lebar*16, tinggi*16))

# Layer tile
layers = d.get("layer_tile", [])
main_layer = next((l for l in layers if l["id"] == "layer_main"), None)
if not main_layer:
    errors.append("layer_main tidak ditemukan!")
else:
    data = main_layer["data"]
    expected = lebar * tinggi
    if len(data) != expected:
        errors.append("layer_main len {} != expected {}".format(len(data), expected))
    else:
        non_zero = sum(1 for t in data if t != 0)
        print("  layer_main: {} tiles, {} non-zero ({}%)".format(len(data), non_zero, 100*non_zero//len(data)))

    # Cek tile ID range
    invalid_tiles = [(i, t) for i, t in enumerate(data) if t < 0 or t > 16]
    if invalid_tiles:
        errors.append("Tile ID di luar range 0-16: {} tile".format(len(invalid_tiles)))
        for idx, tid in invalid_tiles[:5]:
            errors.append("  Tile ({},{}) = {}".format(idx % lebar, idx // lebar, tid))
    else:
        print("  Semua tile ID valid (0-16)")

    # Spawn check
    spawn = d["spawn"]["player"]
    sx, sy = spawn["tile_x"], spawn["tile_y"]
    print("  Spawn: tile ({},{}) -> px ({},{})".format(sx, sy, sx*16, sy*16))

    SOLID_TILES = {1,2,3,4,5,6,7,8,9,14,15}
    spawn_idx = sy * lebar + sx
    spawn_tile = data[spawn_idx] if spawn_idx < len(data) else 0
    if spawn_tile in SOLID_TILES:
        errors.append("BLOCKER: Spawn ({},{}) tileId={} adalah SOLID (player spawn dalam dinding)!".format(sx, sy, spawn_tile))
    else:
        print("  Spawn tile = {} (kosong/safe)".format(spawn_tile))

    floor_idx = (sy + 1) * lebar + sx
    floor_tile = data[floor_idx] if floor_idx < len(data) else 0
    if floor_tile not in SOLID_TILES:
        warnings.append("Tidak ada lantai solid di bawah spawn ({},{}) tileId={}".format(sx, sy+1, floor_tile))
    else:
        print("  Lantai bawah spawn = tileId {} (solid OK)".format(floor_tile))

# Checkpoints
cps = d["spawn"]["checkpoint"]
print("  Checkpoints: {}".format(len(cps)))
for cp in cps:
    cpx, cpy = cp["tile_x"], cp["tile_y"]
    if cpx < 0 or cpx >= lebar or cpy < 0 or cpy >= tinggi:
        errors.append("Checkpoint {} di luar batas!".format(cp["id"]))
    else:
        cp_idx = cpy * lebar + cpx
        cp_tile = data[cp_idx] if main_layer else 0
        print("  CP {}: tile ({},{}) tileId={}".format(cp["id"], cpx, cpy, cp_tile))

# Level exit
exits = [o for o in d["objek"] if o["tipe"] == "level_exit"]
print("  Level exits: {}".format(len(exits)))
if not exits:
    errors.append("Tidak ada level_exit!")
else:
    for ex in exits:
        print("  exit: tile ({},{})".format(ex["tile_x"], ex["tile_y"]))

# Tipe objek
VALID_TYPES = {
    "enemy_soldier","enemy_monkey","item_gobog","item_maja_fruit","item_chest",
    "trigger_spike","level_exit",
    "prop_banner","prop_candi_kiri","prop_candi_kanan","prop_palmtree_tall",
    "prop_palmtree_med","prop_palmtree_short","prop_relief","prop_torch"
}
invalid_obj = [o for o in d["objek"] if o["tipe"] not in VALID_TYPES]
if invalid_obj:
    for o in invalid_obj:
        errors.append("Tipe tidak dikenal: {} id={}".format(o["tipe"], o.get("id","")))
else:
    print("  Semua {} objek tipe valid".format(len(d["objek"])))

# Objek di luar batas
for o in d["objek"]:
    ox = o.get("tile_x", 0)
    oy = o.get("tile_y", 0)
    if ox < 0 or ox >= lebar or oy < 0 or oy >= tinggi:
        warnings.append("Objek {} ({}) di luar batas: ({},{})".format(o.get("id","?"), o["tipe"], ox, oy))

print()
if errors:
    print("ERRORS ({})".format(len(errors)))
    for e in errors:
        print("  [X]", e)
else:
    print("Tidak ada error level data.")

if warnings:
    print("WARNINGS ({})".format(len(warnings)))
    for w in warnings:
        print("  [!]", w)
else:
    print("Tidak ada warning.")
