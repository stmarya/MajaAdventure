#!/usr/bin/env python3
"""Allowlisted, reproducible internal web package. Public channel has mandatory gates."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools/validation'))
from validate_assets import validate, public_approval_errors

def build(output,channel='internal'):
    report=validate(check_art=channel=='public')
    blockers=list(report['technical_errors'])
    if channel=='public':
        blockers+=public_approval_errors()
        if report['art_findings']:blockers.append('Final art violates palette/alpha policy; art approval cannot bypass strict checks')
    if blockers:raise ValueError('Build blocked:\n'+'\n'.join(blockers))
    output=output.resolve()
    # Destructive cleanup is confined to this exact known output name; do not delete arbitrary user paths.
    web=output/'web'
    if web.exists():
        if not (web/'BUILD_INFO.json').is_file():raise ValueError('Refusing to replace an unrecognized output/web directory')
        shutil.rmtree(web)
    web.mkdir(parents=True)
    manifest=json.loads((ROOT/'docs/asset_manifest.json').read_text(encoding='utf-8'))
    files={Path('index.html'),*[p.relative_to(ROOT) for p in (ROOT/'src').rglob('*.js')],*[Path(a['file']) for a in manifest['assets']],*[Path(p) for p in manifest['data_files']]}
    for path in sorted(files):
        if path.is_absolute() or '..' in path.parts:raise ValueError('Unsafe build path')
        destination=web/path;destination.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/path,destination)
    version=json.loads((ROOT/'package.json').read_text())['version']
    def git(*args):
        try:return subprocess.check_output(['git',*args],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()
        except (OSError,subprocess.CalledProcessError):return 'unavailable'
    info={'version':version,'channel':channel,'source_commit':git('rev-parse','HEAD'),'dirty_worktree':bool(git('status','--porcelain')),'files':{p.as_posix():hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in sorted(files)},'notice':'Internal playtest only; not a grant of distribution rights.' if channel=='internal' else 'Public release gates passed.'}
    (web/'BUILD_INFO.json').write_text(json.dumps(info,indent=2,sort_keys=True)+'\n',encoding='utf-8')
    archive=output/f'maja-adventure-{version}-{channel}.zip'
    with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for file in sorted(web.rglob('*')):
            if file.is_file():
                entry=zipfile.ZipInfo(file.relative_to(web).as_posix(),date_time=(1980,1,1,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED;entry.external_attr=0o100644<<16;z.writestr(entry,file.read_bytes())
    checksum=hashlib.sha256(archive.read_bytes()).hexdigest();archive.with_suffix('.zip.sha256').write_text(f'{checksum}  {archive.name}\n',encoding='utf-8')
    print(f'Built {channel} web: {len(files)} runtime files; archive SHA256 {checksum}')
    return archive

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,default=ROOT/'dist');p.add_argument('--channel',choices=['internal','public'],default='internal');a=p.parse_args()
    try:build(a.output,a.channel)
    except ValueError as error:print(error,file=sys.stderr);return 1
    return 0
if __name__=='__main__':raise SystemExit(main())
