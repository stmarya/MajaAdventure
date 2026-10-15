"""
verify_imports.py
Verifikasi semua import JS bisa di-resolve dan nama yang diimport tersedia.
"""
import re, os

exports = {}
imports_map = {}

for root, dirs, files in os.walk("src"):
    for f in files:
        if not f.endswith(".js"):
            continue
        path = os.path.join(root, f).replace("\\", "/")
        with open(path, "r", encoding="utf-8") as fp:
            content = fp.read()

        exp = re.findall(r"export\s+(?:class|function|const|let|var)\s+(\w+)", content)
        exports[path] = exp

        imps = re.findall(r'import\s+\{([^}]+)\}\s+from\s+["\']([^"\']+)["\']', content)
        imports_map[path] = imps

errors = []
for src_path, imps in imports_map.items():
    for (names_str, rel_path) in imps:
        if not rel_path.startswith("."):
            continue
        src_dir = os.path.dirname(src_path)
        target = os.path.normpath(os.path.join(src_dir, rel_path)).replace("\\", "/")
        if not target.endswith(".js"):
            target += ".js"

        if not os.path.exists(target):
            errors.append("MISSING: {} imports from {} -> {}".format(src_path, rel_path, target))
        else:
            names = [n.strip() for n in names_str.split(",")]
            target_exports = exports.get(target, [])
            for name in names:
                name = name.strip()
                if name and name not in target_exports:
                    errors.append("UNDEF  : {} imports '{}' from {} (tidak ada di exports: {})".format(
                        src_path, name, rel_path, target_exports
                    ))

print("=== VERIFIKASI IMPORT ===")
if errors:
    for e in errors:
        print(e)
    print("\nTotal error:", len(errors))
else:
    print("Semua import terverifikasi OK.")
    print("Total file JS dianalisa:", len(exports))
