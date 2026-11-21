"""Build original stage parallax strips and tile pairs from art/source/release_stages.

python -B tools/process_stage_art.py [source_stem ...]
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

from process_campaign_finish import cutout

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/release_stages'
OUT = ROOT / 'public/assets'


def seamless(half):
    result = Image.new(half.mode, (half.width * 2, half.height))
    result.paste(half, (0, 0))
    result.paste(ImageOps.mirror(half), (half.width, 0))
    return result


def parallax(source):
    half = Image.new('RGBA', (640, 360))
    height = min(240, round(640 * source.height / source.width))
    strip = source.resize((640, height), Image.Resampling.LANCZOS)
    strip.putalpha(strip.getchannel('A').point(lambda a: round(a * 0.82) if a >= 32 else 0))
    half.alpha_composite(strip, (0, half.height - height))
    return seamless(half)


def tiles(source, stage_id):
    coverage = np.count_nonzero(np.asarray(source)[..., 3] >= 160, axis=1)
    middle = min(range(source.height // 3, source.height * 3 // 4),
                 key=lambda y: (coverage[y - 1] + coverage[y], abs(y - source.height // 2)))
    samples = [cutout(source.crop(rect)) for rect in (
        (0, 0, source.width, middle), (0, middle, source.width, source.height))]
    if any(not sample.width or not sample.height for sample in samples):
        raise ValueError(f'{stage_id}: expected a ground sample above a platform sample')
    for kind, size, sample in zip(('ground', 'plat'), ((32, 40), (16, 12)), samples):
        # The whole material cross-section contributes to each repeat. Mirroring
        # the repeat keeps both the top edge and the underside continuous.
        half = ImageOps.fit(sample, size, Image.Resampling.LANCZOS)
        result = Image.new('RGB', size, '#11131c')
        result.paste(half, (0, 0), half)
        yield f'{kind}_{stage_id}', seamless(result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stems', nargs='*')
    args = parser.parse_args()
    stems = args.stems or sorted(path.stem for path in SOURCE.glob('*.png'))
    keys = set()
    for stem in stems:
        with Image.open(SOURCE / f'{stem}.png') as original:
            source = original.convert('RGBA')
        outputs = tiles(source, stem.removeprefix('tiles_')) if stem.startswith('tiles_') else [(stem, parallax(source))]
        for name, tile in outputs:
            tile.save(OUT / f'{name}.png', optimize=True)
            keys.add(name)
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest['images'] = sorted(set(manifest['images']) | keys)
    manifest_path.write_text(json.dumps(manifest, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
