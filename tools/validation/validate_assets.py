#!/usr/bin/env python3
"""Validate actual runtime separately from unfinished art. --strict-art is a release gate."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import wave
from PIL import Image
ROOT = Path(__file__).resolve().parents[2]

def validate(root=ROOT, check_art=True):
    manifest=json.loads((root/'docs/asset_manifest.json').read_text(encoding='utf-8'))
    result={'technical_errors':[], 'art_findings':[], 'runtime_assets':len(manifest['assets']), 'art_checked':check_art}
    errors=result['technical_errors']; ids=set(); paths=set()
    palette_data=json.loads((root/'docs/color_palette.json').read_text(encoding='utf-8'))
    palette={tuple(color['rgb']) for color in palette_data['colors']}
    if len(palette)!=16: errors.append('Official palette must contain 16 unique colors')
    for asset in manifest['assets']:
        name=asset['file']; path=root/name
        if asset['id'] in ids or name in paths: errors.append(f'Duplicate runtime entry: {name}')
        ids.add(asset['id']);paths.add(name)
        if Path(name).is_absolute() or '..' in Path(name).parts or not name.startswith('assets/'):
            errors.append(f'Unsafe path: {name}');continue
        if not path.is_file(): errors.append(f'Missing runtime file: {name}');continue
        if path.stat().st_size>8*1024*1024: errors.append(f'Asset exceeds 8MiB budget: {name}')
        if hashlib.sha256(path.read_bytes()).hexdigest()!=asset['sha256']: errors.append(f'Checksum mismatch: {name}; review and regenerate manifest intentionally')
        if asset['type']=='gambar':
            try:
                with Image.open(path) as image:
                    if image.size!=(asset['width'],asset['height']): errors.append(f'Dimension mismatch: {name}')
                    if check_art:
                        pixels=list(image.convert('RGBA').getdata())
                        semi=sum(0<a<255 for r,g,b,a in pixels)
                        outside=len({(r,g,b) for r,g,b,a in pixels if a and (r,g,b) not in palette})
                        if semi or outside: result['art_findings'].append({'file':name,'semi_transparent_pixels':semi,'colors_outside_palette':outside})
            except (OSError,ValueError) as error: errors.append(f'Invalid PNG {name}: {error}')
        elif path.suffix=='.wav':
            try:
                with wave.open(str(path)) as audio:
                    if audio.getnframes()<=0 or audio.getframerate()<=0: errors.append(f'Empty WAV: {name}')
            except (wave.Error,EOFError) as error: errors.append(f'Invalid WAV {name}: {error}')
        elif path.suffix=='.ogg' and not path.read_bytes().startswith(b'OggS'): errors.append(f'Invalid OGG container: {name}')
    main=(root/'src/engine/main.js').read_text(encoding='utf-8')
    runtime=set(re.findall(r'path:\s*"(assets/[^"]+)"',main))
    if runtime!=paths: errors.append(f'Manifest/bootstrap drift: missing={sorted(runtime-paths)}, unused={sorted(paths-runtime)}')
    for name in manifest['data_files']:
        if Path(name).is_absolute() or '..' in Path(name).parts or not name.startswith(('docs/','levels/','assets/')):
            errors.append(f'Unsafe data path: {name}');continue
        try: json.loads((root/name).read_text(encoding='utf-8'))
        except (OSError,ValueError) as error: errors.append(f'Invalid data file {name}: {error}')
    config=json.loads((root/'docs/animation_config.json').read_text(encoding='utf-8'))
    for sprite in config.values():
        if not isinstance(sprite,dict) or sprite.get('sprite_sheet') not in paths: continue
        path=root/sprite['sprite_sheet']
        if not path.is_file(): continue
        with Image.open(path) as image:
            w,h=sprite['frame_lebar'],sprite['frame_tinggi']
            capacity=image.width//w*(image.height//h)
            if image.width%w or image.height%h: errors.append(f'Sheet not frame-aligned: {path.name}')
            for name,animation in sprite['animasi'].items():
                if not animation.get('frames') or any(not isinstance(n,int) or n<0 or n>=capacity for n in animation['frames']): errors.append(f'Frame out of bounds: {path.name}/{name}')
    for path in (root/'levels').glob('*.json'):
        level=json.loads(path.read_text(encoding='utf-8'));dim=level['dimensi'];width,height=dim['lebar_tiles'],dim['tinggi_tiles']
        data=next((a['data'] for a in level['layer_tile'] if a['id']=='layer_main'),[])
        if len(data)!=width*height or any(not isinstance(n,int) or n<0 or n>16 for n in data): errors.append(f'Invalid tile data: {path.name}')
        for point in [level['spawn']['player'],*level['spawn']['checkpoint']]:
            if not (0<=point['tile_x']<width and 0<=point['tile_y']<height): errors.append(f'Spawn outside world: {path.name}')
    return result

def public_approval_errors(root=ROOT):
    data=json.loads((root/'docs/release_approvals.json').read_text(encoding='utf-8'))
    required=['visual_rights','audio_rights','code_license','art_qa','human_playtest','audio_listening','browser_matrix']
    missing=[]
    for name in required:
        item=data.get('required_checks',{}).get(name,{})
        if item.get('approved') is not True or not all(isinstance(item.get(k),str) and item[k].strip() for k in ['reviewer','reviewed_at','evidence']): missing.append(f'Approval pending: {name}')
    return missing

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--strict-art',action='store_true',help='Fail on palette/alpha deviation; required before public release')
    parser.add_argument('--report',type=Path)
    # Compatibility with documented commands. All technical checks still run.
    for name in ['hanya-manifest','hanya-level','hanya-animasi','hanya-palette','skip-palette','verbose']:
        parser.add_argument('--'+name,action='store_true')
    args=parser.parse_args();result=validate(check_art=not args.skip_palette)
    print(f"Runtime assets: {result['runtime_assets']}; technical errors: {len(result['technical_errors'])}; art deviations: {len(result['art_findings'])}")
    for error in result['technical_errors']: print('ERROR:',error)
    if result['art_findings']: print('ART NOT APPROVED: palette/alpha deviations remain. Technical PASS is NOT final-art or public-release approval.')
    if not result['art_checked']: print('ART NOT CHECKED (--skip-palette).')
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    return 1 if result['technical_errors'] or ((args.strict_art or args.hanya_palette) and result['art_findings']) else 0
if __name__=='__main__':raise SystemExit(main())
