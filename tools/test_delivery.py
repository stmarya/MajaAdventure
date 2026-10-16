"""Integration tests for clean-source restoration, cross-OS pipeline, and packaging."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import sys
import unittest
import zipfile
ROOT=Path(__file__).resolve().parents[1]

def run(*args,cwd=ROOT):return subprocess.run(args,cwd=cwd,capture_output=True,text=True,encoding='utf-8',errors='replace')
class DeliveryTests(unittest.TestCase):
    def test_runtime_manifest_is_consistent(self):
        result=run(sys.executable,str(ROOT/'tools/validation/validate_assets.py'))
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertIn('ART NOT APPROVED',result.stdout) # visible debt, never silently waived
    def test_internal_build_allowlist_and_reproducibility(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp)
            first=run(sys.executable,str(ROOT/'tools/build_web.py'),'--output',str(out))
            self.assertEqual(first.returncode,0,first.stdout+first.stderr)
            archive=next(out.glob('*.zip'));before=hashlib.sha256(archive.read_bytes()).hexdigest()
            again=run(sys.executable,str(ROOT/'tools/build_web.py'),'--output',str(out));self.assertEqual(again.returncode,0,again.stderr)
            self.assertEqual(before,hashlib.sha256(archive.read_bytes()).hexdigest())
            with zipfile.ZipFile(archive) as z:
                names=z.namelist();self.assertIn('index.html',names);self.assertIn('BUILD_INFO.json',names)
                self.assertFalse(any(n.startswith(('.asset-packs/','tools/','progres/','node_modules/','.github/')) for n in names))
                self.assertIn('assets/ui/fonts/font_glyphs.json',names)
    def test_public_build_is_blocked_without_real_approvals(self):
        with tempfile.TemporaryDirectory() as temp:
            result=run(sys.executable,str(ROOT/'tools/build_web.py'),'--channel','public','--output',temp)
            self.assertNotEqual(result.returncode,0);self.assertIn('visual_rights',result.stderr);self.assertEqual(list(Path(temp).glob('*.zip')),[])
    def test_pipeline_restores_and_writes_only_requested_output(self):
        with tempfile.TemporaryDirectory() as temp:
            copy=Path(temp)/'repo';copy.mkdir()
            shutil.copytree(ROOT/'.asset-packs',copy/'.asset-packs');(copy/'tools').mkdir();shutil.copyfile(ROOT/'tools/restore_assets.py',copy/'tools/restore_assets.py')
            result=run(sys.executable,str(copy/'tools/restore_assets.py'),cwd=copy);self.assertEqual(result.returncode,0,result.stderr)
            destination=Path(temp)/'candidate'
            result=run(sys.executable,str(ROOT/'tools/pipeline/assemble_new_assets.py'),'--source',str(copy),'--output',str(destination))
            self.assertEqual(result.returncode,0,result.stdout+result.stderr)
            self.assertTrue((destination/'assets/characters/warrior/final/chr_warrior_sheet.png').is_file())
            self.assertFalse(any('\\' in p.name for p in destination.rglob('*')))
            before={p.relative_to(destination).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in destination.rglob('*.png')}
            result=run(sys.executable,str(ROOT/'tools/pipeline/assemble_new_assets.py'),'--source',str(copy),'--output',str(destination));self.assertEqual(result.returncode,0,result.stderr)
            after={p.relative_to(destination).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in destination.rglob('*.png')};self.assertEqual(before,after)
if __name__=='__main__':unittest.main()
