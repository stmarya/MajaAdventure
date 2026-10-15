#!/usr/bin/env python3
"""Restore lossless PNG/GIF asset packs using only Python's standard library."""
from pathlib import Path, PurePosixPath
import base64,hashlib,io,json,zipfile,argparse
ROOT=Path(__file__).resolve().parents[1]

def main():
    manifest=json.loads((ROOT/'.asset-packs/manifest.json').read_text())
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack', choices=[p['name'] for p in manifest['packs']], help='Restore only the selected pack')
    args=parser.parse_args()
    for pack in manifest['packs']:
        if args.pack and pack['name']!=args.pack: continue
        destination=ROOT/pack['destination']
        if destination.exists() and any(destination.iterdir()):
            raise SystemExit(f'Refusing to overwrite existing files: {destination}. Move the folder before restoring again.')
        encoded=''.join((ROOT/part).read_text() for part in pack['parts'])
        data=base64.b64decode(encoded,validate=True)
        if hashlib.sha256(data).hexdigest()!=pack['sha256']:
            raise SystemExit(f'Checksum mismatch: {pack["name"]}')
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            members=[]
            for info in archive.infolist():
                path=PurePosixPath(info.filename)
                if path.is_absolute() or '..' in path.parts or not path.parts or path.parts[0]!=pack['zip_root']:
                    raise SystemExit('Unexpected archive path: '+info.filename)
                if ((info.external_attr>>16)&0o170000)==0o120000:
                    raise SystemExit('Symlinks are not allowed')
                relative=Path(*path.parts[1:])
                if relative.parts: members.append((info,relative))
            for info,relative in members:
                target=destination/relative
                if info.is_dir():target.mkdir(parents=True,exist_ok=True)
                else:
                    target.parent.mkdir(parents=True,exist_ok=True)
                    target.write_bytes(archive.read(info))
        print(f'Restored {pack["name"]} -> {pack["destination"]}')
    print('Done. PNG frames are for the engine; GIFs are previews.')

if __name__=='__main__':main()
