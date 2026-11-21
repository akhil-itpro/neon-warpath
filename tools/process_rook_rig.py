"""Extract ROOK's one generated parts atlas; never infer joints from whole-body poses.

python -B tools/process_rook_rig.py
Outputs eight native-size parts plus a labeled preview; original source is immutable.
Runtime pivots and animation poses live in src/data/rigs.ts.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from process_assets import shrink

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/rigs/rook_parts_bright.png'
OUT = ROOT / 'public/assets'
# The runtime rig is calibrated to these part dimensions.
PARTS = [('head', 13, 16), ('torso', 18, 25), ('arm', 33, 15), ('support', 28, 14),
         ('thigh', 8, 17), ('shin', 11, 20), ('far_thigh', 8, 17), ('far_shin', 11, 20)]


def main():
    atlas = Image.open(SOURCE).convert('RGBA')
    aw, ah = atlas.size
    preview = Image.new('RGB', (768, 224), '#232939')
    draw = ImageDraw.Draw(preview)
    keys = []
    for i, (name, width, height) in enumerate(PARTS):
        col, row = i % 4, i // 4
        cell = np.array(atlas.crop((col * aw // 4, row * ah // 2,
                                   (col + 1) * aw // 4, (row + 1) * ah // 2)))
        # Discard the generated translucent halo; retain the single connected opaque piece.
        labels, count = ndimage.label(cell[..., 3] > 150)
        if not count:
            raise ValueError(f'Missing part: {name}')
        sizes = np.bincount(labels.ravel()); sizes[0] = 0
        mask = labels == sizes.argmax()
        ys, xs = np.nonzero(mask)
        cell[..., 3] = np.where(mask, 255, 0)
        part = Image.fromarray(cell[ys.min():ys.max()+1, xs.min():xs.max()+1])
        part = Image.fromarray(shrink(np.array(part), height / part.height))
        if part.size != (width, height):
            part = part.resize((width, height), Image.Resampling.NEAREST)
        key = f'rook_rig_{name}'
        part.save(OUT / f'{key}.png')
        keys.append(key)
        preview.paste(part.resize((width * 4, height * 4), Image.Resampling.NEAREST),
                      (col * 192 + 8, row * 112 + 22),
                      part.resize((width * 4, height * 4), Image.Resampling.NEAREST))
        draw.text((col * 192 + 8, row * 112 + 4), f'{name} ({width}x{height})', fill='white')
        print(key, width, height)
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    manifest['images'] = sorted(set(manifest['images']) | set(keys))
    manifest_path.write_text(json.dumps(manifest, indent=1) + '\n')
    dest = ROOT / 'art/preview/rook-rig-parts.png'
    dest.parent.mkdir(parents=True, exist_ok=True)
    preview.save(dest)


if __name__ == '__main__':
    main()
