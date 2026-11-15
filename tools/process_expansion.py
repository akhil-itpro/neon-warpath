"""Rebuild the staged expansion library; does not modify the live game or its manifest."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from process_assets import matte, components, cut, shrink, outline

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/expansion'
OUT = ROOT / 'art/library/expansion'


def main():
    for folder in ['masters', 'sprites', 'worlds', 'previews']:
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    jobs = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf-8'))
    inventory = []
    for job in jobs:
        source = SOURCE / (job['key'] + '.png')
        img = Image.open(source)
        if job['kind'] == 'world':
            key = job['names'][0]
            bg = img.convert('RGB').resize((640, 360), Image.Resampling.LANCZOS)
            bg = bg.quantize(colors=160, dither=Image.Dither.NONE).convert('RGB')
            bg.save(OUT / 'worlds' / f'{key}.png')
            strip = Image.new('RGB', (1280, 360))
            strip.paste(bg, (0, 0))
            strip.paste(bg.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (640, 0))
            strip.save(OUT / 'worlds' / f'{key}_strip.png')
            inventory.append(dict(key=key, kind='world', source=source.relative_to(ROOT).as_posix(),
                                  image=f'worlds/{key}.png', strip=f'worlds/{key}_strip.png',
                                  size=[640, 360], status='flattened backdrop; mirrored strip, not separate parallax layers'))
            continue
        mask = matte(img, (job['cols'], job['rows']))
        boxes, labels = components(mask, len(job['names']))
        if len(boxes) != len(job['names']):
            raise ValueError(f"Wrong sprite count in {source}")
        kind = job['kind']
        target_h, canvas = {'weapon': (22, (48, 28)), 'character': (66, (112, 80)),
                            'enemy': (68, (128, 96)), 'prop': (62, (96, 80))}[kind]
        color = (150, 232, 255) if kind in ['character', 'weapon'] else (255, 86, 56) if kind == 'enemy' else (130, 155, 180)
        preview = Image.new('RGB', (job['cols'] * 300, job['rows'] * 280), '#141d2c')
        draw = ImageDraw.Draw(preview)
        for i, (key, box) in enumerate(zip(job['names'], boxes)):
            raw = cut(img, mask, labels, box)
            Image.fromarray(raw).save(OUT / 'masters' / f'{key}.png')
            scale = min(target_h / raw.shape[0], (canvas[0] - 6) / raw.shape[1])
            sprite = outline(shrink(raw, scale), color)
            # Center all pixels instead of torso-based alignment, avoiding wide-weapon cropping.
            h, w = sprite.shape[:2]
            frame = np.zeros((canvas[1], canvas[0], 4), dtype=np.uint8)
            x = (canvas[0] - w) // 2
            y = (canvas[1] - h) // 2 if kind == 'weapon' else canvas[1] - h - 2
            frame[y:y+h, x:x+w] = sprite
            sprite_img = Image.fromarray(frame)
            sprite_img.save(OUT / 'sprites' / f'{key}.png')
            px, py = (i % job['cols']) * 300, (i // job['cols']) * 280
            draw.text((px + 12, py + 12), key.upper().replace('_', ' '), fill='#d6ecff')
            large = sprite_img.resize((canvas[0] * 2, canvas[1] * 2), Image.Resampling.NEAREST)
            preview.paste(large, (px + (300-large.width)//2, py+45), large)
            draw.text((px + 12, py + 250), f'{canvas[0]}x{canvas[1]} | single pose', fill='#8ba0b8')
            inventory.append(dict(key=key, kind=kind, source=source.relative_to(ROOT).as_posix(),
                                  master=f'masters/{key}.png', image=f'sprites/{key}.png', size=list(canvas),
                                  frames=1, status='staged art; not wired to gameplay'))
        preview.save(OUT / 'previews' / f"{job['key']}.png")
    worlds = [item for item in inventory if item['kind'] == 'world']
    board = Image.new('RGB', (1280, 780), '#141d2c')
    draw = ImageDraw.Draw(board)
    for i, item in enumerate(worlds):
        x, y = (i % 2) * 640, (i // 2) * 390
        draw.text((x+12, y+10), item['key'].upper(), fill='white')
        board.paste(Image.open(OUT / item['image']), (x, y+30))
    board.save(OUT / 'previews/worlds.png')
    (OUT / 'inventory.json').write_text(json.dumps(inventory, indent=2) + '\n', encoding='utf-8')
    print(f'Built {len(inventory)} designs in {OUT}')


if __name__ == '__main__':
    main()
