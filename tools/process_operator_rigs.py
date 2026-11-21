"""Extract each operator's generated parts atlas.

python -B tools/process_operator_rigs.py [rook|viper|titan|serrik|quill]
Outputs eight parts and a labeled preview per operator. With no argument, rebuild all five.
Runtime pivots and animation poses live in src/data/rigs.ts.
"""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from process_assets import shrink

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/rigs'
OUT = ROOT / 'public/assets'
# The runtime rig is calibrated to these part dimensions.
PARTS = [('head', 13, 16), ('torso', 18, 25), ('arm', 33, 15), ('support', 28, 14),
         ('thigh', 8, 17), ('shin', 11, 20), ('far_thigh', 8, 17), ('far_shin', 11, 20)]
ATLASES = {'rook': 'rook_parts_bright.png', 'viper': 'viper_parts.png',
           'titan': 'titan_parts.png', 'serrik': 'serrik_parts.png', 'quill': 'quill_parts.png'}


def process(operator):
    atlas = Image.open(SOURCE / ATLASES[operator]).convert('RGBA')
    aw, ah = atlas.size
    preview = Image.new('RGB', (768, 224), '#232939')
    draw = ImageDraw.Draw(preview)
    keys = []
    for i, (name, width, height) in enumerate(PARTS):
        col, row = i % 4, i // 4
        # Some shooting arms extend left of their nominal cell into the gutter.
        left = col * aw // 4 - (aw // 64 if name == 'arm' and operator != 'rook' else 0)
        cell = np.array(atlas.crop((left, row * ah // 2,
                                   (col + 1) * aw // 4, (row + 1) * ah // 2)))
        # Discard the generated translucent halo; retain the single connected opaque piece.
        labels, count = ndimage.label(cell[..., 3] > 150)
        if not count:
            raise ValueError(f'{operator}: missing {name}')
        sizes = np.bincount(labels.ravel()); sizes[0] = 0
        mask = labels == sizes.argmax()
        ys, xs = np.nonzero(mask)
        cell[..., 3] = np.where(mask, 255, 0)
        part = Image.fromarray(cell[ys.min():ys.max()+1, xs.min():xs.max()+1])
        part = Image.fromarray(shrink(np.array(part), height / part.height))
        if operator == 'rook' and part.size != (width, height):
            part = part.resize((width, height), Image.Resampling.NEAREST)
        width = part.width
        key = f'{operator}_rig_{name}'
        part.save(OUT / f'{key}.png')
        keys.append(key)
        preview.paste(part.resize((width * 4, height * 4), Image.Resampling.NEAREST),
                      (col * 192 + 8, row * 112 + 22),
                      part.resize((width * 4, height * 4), Image.Resampling.NEAREST))
        draw.text((col * 192 + 8, row * 112 + 4), f'{name} ({width}x{height})', fill='white')
        print(key, width, height)
    dest = ROOT / 'art/preview' / f'{operator}-rig-parts.png'
    dest.parent.mkdir(parents=True, exist_ok=True)
    preview.save(dest)
    return keys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operator', nargs='?', choices=tuple(ATLASES))
    args = parser.parse_args()
    operators = [args.operator] if args.operator else ATLASES
    keys = {key for operator in operators for key in process(operator)}
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    manifest['images'] = sorted(set(manifest['images']) | keys)
    manifest_path.write_text(json.dumps(manifest, indent=1) + '\n')


if __name__ == '__main__':
    main()
