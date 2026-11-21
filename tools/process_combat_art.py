"""Fit immutable combat animation sheets onto the original sprite canvases.

python -B tools/process_combat_art.py [art_key ...]
With no keys, rebuild all PNG sheets under art/source/combat.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

from process_assets import ENEMY_OUTLINE, outline, shrink
from process_campaign_finish import cutout

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/combat'
OUT = ROOT / 'public/assets'
PREVIEW = ROOT / 'art/preview/combat'
ENEMY_POSES = ('0', '1', '2', '3', 'atk')
CENTERED = {'bell_drone', 'lantern_moth', 'umbrella_jelly', 'drone', 'jet'}


def process(key):
    with Image.open(OUT / f'{key}.png') as original:
        canvas_width, canvas_height = original.size
    with Image.open(SOURCE / f'{key}.png') as sheet:
        sheet = sheet.convert('RGBA')
        coverage = np.count_nonzero(np.asarray(sheet)[..., 3] >= 160, axis=0)
        cell_width = sheet.width / len(ENEMY_POSES)
        edges = [0]
        # Prefer an empty gutter near each nominal boundary. Raised weapons
        # sometimes extend a few pixels beyond the generated cell.
        radius = round(cell_width / 6)
        for i in range(1, len(ENEMY_POSES)):
            middle = round(i * cell_width)
            edges.append(min(range(middle - radius, middle + radius + 1),
                             key=lambda x: (coverage[x - 1] + coverage[x], abs(x - middle))))
        edges.append(sheet.width)
        crops = [cutout(sheet.crop((left, 0, right, sheet.height)))
                 for left, right in zip(edges, edges[1:])]
    if any(not frame.width or not frame.height for frame in crops):
        raise ValueError(f'{key}: a pose is missing or outside its cell')
    scale = min((canvas_width - 2) / max(frame.width for frame in crops),
                (canvas_height - 2) / max(frame.height for frame in crops))
    keys = []
    preview = Image.new('RGB', (canvas_width * len(crops) * 2, canvas_height * 2), '#252936')
    for index, (pose, frame) in enumerate(zip(ENEMY_POSES, crops)):
        sprite = Image.fromarray(outline(shrink(np.asarray(frame), scale), ENEMY_OUTLINE))
        sprite = sprite.quantize(colors=96, method=Image.Quantize.FASTOCTREE,
                                 dither=Image.Dither.NONE).convert('RGBA')
        canvas = Image.new('RGBA', (canvas_width, canvas_height))
        x = (canvas.width - sprite.width) // 2
        y = canvas.height - sprite.height
        if key in CENTERED:
            y //= 2
        canvas.alpha_composite(sprite, (x, y))
        name = f'{key}_{pose}'
        canvas.save(OUT / f'{name}.png')
        keys.append(name)
        zoom = canvas.resize((canvas.width * 2, canvas.height * 2), Image.Resampling.NEAREST)
        preview.paste(zoom, (index * zoom.width, 0), zoom)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    preview.save(PREVIEW / f'{key}.png')
    return keys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('keys', nargs='*')
    args = parser.parse_args()
    keys = args.keys or sorted(path.stem for path in SOURCE.glob('*.png'))
    generated = {frame for key in keys for frame in process(key)}
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest['images'] = sorted(set(manifest['images']) | generated)
    manifest_path.write_text(json.dumps(manifest, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
