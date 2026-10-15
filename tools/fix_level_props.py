"""
fix_level_props.py
Membersihkan prop lama di level_01.json yang tipenya tidak ada di DEF_PROP PropRenderer.js.
- prop_palmtree (varian: tall/med/short) -> konversi ke prop_palmtree_tall/med/short
- prop_candi_bentar -> konversi ke prop_candi_kiri + prop_candi_kanan
"""
import json

with open("levels/level_01.json", "r", encoding="utf-8") as f:
    d = json.load(f)

# Tipe prop yang VALID (sesuai DEF_PROP di PropRenderer.js)
TIPE_VALID = {
    "prop_palmtree_tall", "prop_palmtree_med", "prop_palmtree_short",
    "prop_candi_kiri", "prop_candi_kanan",
    "prop_banner", "prop_relief", "prop_torch"
}

before = len(d["objek"])
kept   = []
log    = []

for obj in d["objek"]:
    tipe = obj["tipe"]

    if not tipe.startswith("prop_"):
        kept.append(obj)
        continue

    if tipe in TIPE_VALID:
        kept.append(obj)
    elif tipe == "prop_palmtree":
        # Konversi berdasarkan field 'varian'
        varian   = obj.get("varian", "tall")
        new_tipe = "prop_palmtree_" + varian
        new_obj  = {
            "tipe":   new_tipe,
            "id":     obj["id"] + "_v2",
            "tile_x": obj["tile_x"],
            "tile_y": obj["tile_y"],
        }
        kept.append(new_obj)
        log.append("KONVERSI: {} id={} -> {}".format(tipe, obj["id"], new_tipe))
    elif tipe == "prop_candi_bentar":
        # Pecah jadi kiri + kanan berdampingan (2 tile = 32px)
        kept.append({
            "tipe":   "prop_candi_kiri",
            "id":     obj["id"] + "_kiri",
            "tile_x": obj["tile_x"],
            "tile_y": obj["tile_y"],
        })
        kept.append({
            "tipe":   "prop_candi_kanan",
            "id":     obj["id"] + "_kanan",
            "tile_x": obj["tile_x"] + 2,
            "tile_y": obj["tile_y"],
        })
        log.append("KONVERSI: {} id={} -> prop_candi_kiri + prop_candi_kanan".format(tipe, obj["id"]))
    else:
        log.append("HAPUS: {} id={}".format(tipe, obj["id"]))

print("Sebelum: {} objek".format(before))
print("Sesudah: {} objek".format(len(kept)))
print("Perubahan:")
for l in log:
    print("  " + l)

d["objek"] = kept
with open("levels/level_01.json", "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, separators=(",", ":"))

print("\nDONE: levels/level_01.json diperbarui")

# Verifikasi akhir
from collections import Counter
props_akhir = [o for o in kept if o["tipe"].startswith("prop_")]
c = Counter(o["tipe"] for o in props_akhir)
print("\n=== PROP AKHIR ===")
for k, v in sorted(c.items()):
    print("  {}: {}".format(k, v))
print("Total prop: {}".format(len(props_akhir)))
