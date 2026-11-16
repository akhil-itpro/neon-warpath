"""Rebuild the three campaign backdrops from immutable built-in imagegen sources.

    python -B tools/process_campaign_worlds.py

Matches the existing world pipeline: resize to 640x360, reduce to 160 colours,
then mirror into a seamless 1280x360 RGB strip. Only these three asset keys are
added to the live manifest; existing campaign registrations are preserved.
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/campaign_worlds'
OUT = ROOT / 'public/assets'
PREVIEW = ROOT / 'art/preview'


def main():
    jobs = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    board = Image.new('RGB', (1280, len(jobs) * 390), '#0b0d14')
    draw = ImageDraw.Draw(board)
    for i, job in enumerate(jobs):
        key = job['key']
        with Image.open(SOURCE / f'{key}.png') as original:
            bg = original.convert('RGB').resize((640, 360), Image.Resampling.LANCZOS)
        bg = bg.quantize(colors=160, dither=Image.Dither.NONE).convert('RGB')
        strip = Image.new('RGB', (1280, 360))
        strip.paste(bg, (0, 0))
        strip.paste(bg.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (640, 0))
        strip.save(OUT / f'{key}.png')
        draw.text((12, i * 390 + 10), key.upper(), fill='#bbc4d8')
        board.paste(strip, (0, i * 390 + 30))
        print(f'{key}: 1280x360 RGB, mirrored seamless strip')
    board.save(PREVIEW / 'campaign-worlds.png')

    # Read at the last possible moment so other asset integrations are retained.
    path = OUT / 'manifest.json'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    manifest['images'] = sorted(set(manifest['images']) | {job['key'] for job in jobs})
    path.write_text(json.dumps(manifest, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
