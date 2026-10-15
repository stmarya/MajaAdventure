"""
test_edge_cases.py
Verifikasi edge case dan potensi runtime error.
"""
import json, re, struct, os

print("=" * 60)
print("TEST 8: EDGE CASES & RUNTIME ERROR PREVENTION")
print("=" * 60)

issues = []

def baca(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

# ── T8.1: Division by zero guards ─────────────────────────────────
# Renderer.renderTeks: kolomPerBaris = Math.max(1, ...)  OK
# Renderer.renderHealthBar: if (hpMaks <= 0) return  OK
# TilemapRenderer.renderBackground: bgLebar = Math.max(1, bgImage.width) OK
# PropRenderer.render: kolom = Math.max(1, ...)  OK
# AnimationController: fps = Math.max(1, Math.min(60, def.fps ?? 8))  OK
renderer = baca("src/engine/Renderer.js")
assert "Math.max(1," in renderer, "Renderer harus punya guard Math.max(1,...)"
assert "if (hpMaks <= 0) return" in renderer, "renderHealthBar harus guard hpMaks"
print("T8.1 Division-by-zero guards di Renderer: OK")

# ── T8.2: Null asset handling ───────────────────────────────────────
# AssetLoader.muatGambar: onerror simpan null, tidak crash
# Renderer.renderSprite: if (!sheet) return
# Renderer.renderTeks: if (!fontSheet || !teks) return
# GameManager._renderItem: menggunakan loader.ambilGambar yang bisa null, tapi ada fallback renderKotak
renderer2 = baca("src/engine/Renderer.js")
assert "if (!sheet) return" in renderer2, "renderSprite harus guard !sheet"
assert "if (!fontSheet || !teks) return" in renderer2, "renderTeks harus guard !fontSheet"
print("T8.2 Null asset handling: OK")

# ── T8.3: Player mati tidak bisa input ─────────────────────────────
player = baca("src/game/Player.js")
assert "if (this._mati) return" in player, "Player.update harus guard _mati"
print("T8.3 Player dead blocks input: OK")

# ── T8.4: Enemy aktif flag ─────────────────────────────────────────
enemy = baca("src/game/Enemy.js")
assert "if (!this.aktif) return" in enemy, "Enemy.update harus cek aktif"
assert "if (!enemy.aktif) continue" in baca("src/game/GameManager.js"), "GameManager harus skip enemy tidak aktif"
print("T8.4 Enemy aktif flag: OK")

# ── T8.5: Camera teleport pada respawn ─────────────────────────────
main = baca("src/engine/main.js")
assert "kamera?.teleport(spawn.x, spawn.y)" in main, "kamera harus di-teleport saat respawn"
print("T8.5 Camera teleport on respawn: OK")

# ── T8.6: ScoreManager tidak crash saat localStorage unavailable ───
scoremanager = baca("src/utils/ScoreManager.js")
assert "try {" in scoremanager and "} catch {" in scoremanager, "ScoreManager harus try-catch localStorage"
print("T8.6 ScoreManager localStorage try-catch: OK")

# ── T8.7: Audio autoplay policy ────────────────────────────────────
audio = baca("src/engine/AudioManager.js")
assert ".play().catch(" in audio, "AudioManager.putarBGM harus handle autoplay rejection"
print("T8.7 Audio autoplay rejection handled: OK")

# ── T8.8: AssetLoader tidak hang ───────────────────────────────────
loader = baca("src/engine/AssetLoader.js")
assert "setTimeout(() => selesaikan(false), 10_000)" in loader, "AssetLoader harus punya timeout 10s"
print("T8.8 AssetLoader 10s timeout: OK")

# ── T8.9: InputManager blur event ──────────────────────────────────
input_mgr = baca("src/engine/InputManager.js")
assert '"blur"' in input_mgr and "_aksiAktif.clear()" in input_mgr, "InputManager harus clear saat blur"
print("T8.9 InputManager blur cleanup: OK")

# ── T8.10: PropRenderer bounds check ───────────────────────────────
prop = baca("src/game/PropRenderer.js")
assert "KONFIG.CANVAS_LEBAR" in prop, "PropRenderer harus culling dengan CANVAS_LEBAR"
assert "KONFIG.CANVAS_TINGGI" in prop, "PropRenderer harus culling dengan CANVAS_TINGGI"
print("T8.10 PropRenderer culling bounds: OK")

# ── T8.11: Level exit hanya ada 1 ──────────────────────────────────
with open("levels/level_01.json") as f:
    ld = json.load(f)
exits = [o for o in ld["objek"] if o["tipe"] == "level_exit"]
assert len(exits) == 1, "Harus tepat 1 level_exit, dapat {}".format(len(exits))
print("T8.11 Tepat 1 level_exit: OK")

# ── T8.12: Kamera tidak keluar batas level ─────────────────────────
# Camera.update: clamp x/y ke [0, lebarLevel - CANVAS], [0, tinggiLevel - CANVAS]
camera = baca("src/engine/Camera.js")
assert "Math.max(0, Math.min(this.x," in camera, "Camera harus clamp X"
assert "Math.max(0, Math.min(this.y," in camera, "Camera harus clamp Y"
print("T8.12 Camera clamping: OK")

# ── T8.13: Tile ID 0 dilewati rendering ────────────────────────────
tilemap = baca("src/engine/TilemapRenderer.js")
assert "if (tileId === 0) continue" in tilemap, "TilemapRenderer harus skip tile 0"
renderer3 = baca("src/engine/Renderer.js")
assert "if (!tileset || tileId === 0) return" in renderer3, "renderTile harus skip tileId 0"
print("T8.13 Tile ID 0 skip: OK")

# ── T8.14: Cek item_chest isi tidak null ───────────────────────────
chest_objs = [o for o in ld["objek"] if o["tipe"] == "item_chest"]
print("T8.14 item_chest: {} chest ditemukan".format(len(chest_objs)))
for c in chest_objs:
    isi = c.get("isi", [])
    assert isinstance(isi, list), "Chest isi harus array"
    for item in isi:
        assert "tipe" in item, "Chest isi harus punya field tipe"
        assert "jumlah" in item, "Chest isi harus punya field jumlah"
    print("     Chest {}: {} item dalam isi".format(c["id"], len(isi)))
print("     Semua chest isi valid: OK")

# ── T8.15: DT_MAX mencegah physics explosion ───────────────────────
config = baca("src/engine/config.js")
assert "DT_MAX:" in config and "0.05" in config, "DT_MAX harus ada di config"
main2 = baca("src/engine/main.js")
assert "dt = Math.min(dt, KONFIG.DT_MAX)" in main2, "dt harus di-clamp dengan DT_MAX"
print("T8.15 DT_MAX physics protection: OK")

print()
if issues:
    print("ISSUES ({} ditemukan):".format(len(issues)))
    for i in issues:
        print("  [X]", i)
else:
    print("Semua T8 edge case checks PASSED.")
