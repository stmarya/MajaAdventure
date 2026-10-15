"""Verify source pack integrity and the runtime asset contract."""
import base64
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import unittest
import zipfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT if (ROOT / ".asset-packs" / "manifest.json").is_file() else ROOT / "staging" / "MajaAdventure"


class SourceIntegrationTests(unittest.TestCase):
    def test_source_packs_and_restored_files_match_checksums(self):
        manifest = json.loads((SOURCE / ".asset-packs" / "manifest.json").read_text())
        self.assertEqual(len(manifest["packs"]), 5)
        for pack in manifest["packs"]:
            with self.subTest(pack=pack["name"]):
                encoded = "".join((SOURCE / part).read_text() for part in pack["parts"])
                data = base64.b64decode(encoded, validate=True)
                self.assertEqual(hashlib.sha256(data).hexdigest(), pack["sha256"])
                self.assertEqual(len(data), pack["archive_bytes"])
                with zipfile.ZipFile(io.BytesIO(data)) as archive:
                    self.assertIsNone(archive.testzip())
                    for entry in archive.infolist():
                        if entry.is_dir():
                            continue
                        relative = PurePosixPath(entry.filename).relative_to(pack["zip_root"])
                        restored = SOURCE / pack["destination"] / Path(*relative.parts)
                        if (SOURCE / pack["destination"]).exists():
                            self.assertEqual(restored.read_bytes(), archive.read(entry), str(relative))

    def test_all_bootstrap_assets_exist(self):
        main = (ROOT / "src" / "engine" / "main.js").read_text(encoding="utf-8")
        paths = re.findall(r'path:\s*"(assets/[^"]+)"', main)
        self.assertGreater(len(paths), 50)
        for path in paths:
            with self.subTest(path=path):
                self.assertTrue((ROOT / path).is_file())

    def test_new_sheets_have_nonempty_frames_at_runtime_dimensions(self):
        sheets = [
            ("environment/fauna/fauna_burung_sheet.png", 12, 8, 4),
            ("environment/fauna/fauna_kupu_kupu_sheet.png", 10, 8, 4),
            ("environment/fauna/fauna_capung_sheet.png", 12, 6, 4),
            ("environment/fauna/fauna_kunang_kunang_sheet.png", 6, 6, 4),
            ("vfx/final/vfx_torch_sheet.png", 16, 24, 3),
            ("vfx/final/vfx_hit_sheet.png", 32, 32, 3),
            ("vfx/final/vfx_dust_sheet.png", 24, 16, 3),
        ]
        for path, width, height, count in sheets:
            with self.subTest(path=path):
                with Image.open(ROOT / "assets" / path) as sheet:
                    self.assertEqual(sheet.size, (width * count, height))
                    for index in range(count):
                        frame = sheet.crop((index * width, 0, (index + 1) * width, height))
                        self.assertIsNotNone(frame.getbbox(), f"{path}: frame {index}")


if __name__ == "__main__":
    unittest.main()
