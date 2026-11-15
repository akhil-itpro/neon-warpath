"""Prepare the staged species library; never writes live assets or gameplay registries.

Run: python -B tools/process_species.py
Dependencies: existing asset pipeline's Pillow, NumPy, SciPy.
All source identities, animation groups, scales and anchors are declared in the source manifest.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.dont_write_bytecode = True
from process_assets import components, cut, matte, outline, shrink
from process_frontier import extract_cells, place_sprite

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/species'
OUT = ROOT / 'art/library/species'


def make_board(job, entries):
    cw, ch = (500, 460) if job['kind'] == 'boss' else (340, 300)
    image = Image.new('RGB', (job['cols'] * cw, job['rows'] * ch), '#121c2b')
    draw = ImageDraw.Draw(image)
    for i, entry in enumerate(entries):
        x, y = i % job['cols'] * cw, i // job['cols'] * ch
        draw.text((x + 12, y + 12), entry['key'].upper(), fill='#e1edff')
        sprite = Image.open(OUT / entry['image'])
        zoom = min(3, (cw - 20) // sprite.width, (ch - 65) // sprite.height)
        large = sprite.resize((sprite.width * zoom, sprite.height * zoom), Image.Resampling.NEAREST)
        image.paste(large, (x + (cw - large.width) // 2, y + 36), large)
        draw.text((x + 12, y + ch - 22), f"{sprite.width}x{sprite.height} | {entry['species']} | {entry['anchor']}", fill='#8fa6bf')
    image.save(OUT / 'previews' / f"{job['key']}.png")


def make_gif(group, entries, kind):
    frames = []
    # Operator GIFs preview the run loop; boss GIFs are a slow state showcase.
    for entry in entries[:4]:
        sprite = Image.open(OUT / entry['image'])
        frame = Image.new('RGB', sprite.size, '#121c2b')
        frame.paste(sprite, (0, 0), sprite)
        frames.append(frame.resize((frame.width * 3, frame.height * 3), Image.Resampling.NEAREST))
    frames[0].save(OUT / 'previews' / f"{group['id']}.gif", save_all=True,
                   append_images=frames[1:], duration=1100 if kind == 'boss' else 130,
                   loop=0, disposal=2)


def make_overview(inventory):
    entries = [entry for entry in inventory if entry['kind'] == 'enemy_sheet' and entry['frameIndex'] == 0]
    image = Image.new('RGB', (1280, 840), '#121c2b')
    draw = ImageDraw.Draw(image)
    for i, entry in enumerate(entries):
        x, y = i % 4 * 320, i // 4 * 280
        draw.text((x + 12, y + 12), entry['species'].upper(), fill='#e1edff')
        sprite = Image.open(OUT / entry['image'])
        zoom = min(3, 300 // sprite.width, 210 // sprite.height)
        large = sprite.resize((sprite.width * zoom, sprite.height * zoom), Image.Resampling.NEAREST)
        image.paste(large, (x + (320 - large.width) // 2, y + 40), large)
        draw.text((x + 12, y + 255), entry['group'], fill='#8fa6bf')
    image.save(OUT / 'previews/bestiary.png')


def make_muzzle_grid(inventory):
    entries = [entry for entry in inventory if entry['kind'] == 'operator']
    image = Image.new('RGB', (1536, 1312), '#121c2b')
    draw = ImageDraw.Draw(image)
    for i, entry in enumerate(entries):
        x, y = i % 4 * 384, i // 4 * 328
        sprite = Image.open(OUT / entry['image']).resize((384, 288), Image.Resampling.NEAREST)
        image.paste(sprite, (x, y + 30), sprite)
        draw.text((x + 8, y + 8), entry['key'], fill='white')
        for gx in range(0, 96, 8):
            draw.line((x + gx * 4, y + 30, x + gx * 4, y + 318), fill='#324056')
            draw.text((x + gx * 4 + 2, y + 30), str(gx), fill='#aaaaaa')
        for gy in range(0, 72, 8):
            draw.line((x, y + 30 + gy * 4, x + 384, y + 30 + gy * 4), fill='#324056')
            draw.text((x + 2, y + 30 + gy * 4), str(gy), fill='#aaaaaa')
    image.save(OUT / 'previews/operator_muzzle_grid.png')


def main():
    for folder in ['masters', 'sprites', 'previews']:
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    jobs = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf-8'))
    inventory = []
    for job in jobs:
        print(f"Preparing {job['key']}", flush=True)
        source = SOURCE / f"{job['key']}.png"
        image = Image.open(source)
        if job.get('extraction') == 'components':
            # Quill's slide crosses a nominal grid gutter by a few pixels.
            # Extract whole silhouettes, retaining the source without cropping a foot.
            mask = matte(image, (job['cols'], job['rows']))
            boxes, labels = components(mask, len(job['names']))
            cells = [cut(image, mask, labels, box) for box in boxes]
        else:
            cells = extract_cells(image, job['cols'], job['rows'])
        if len(cells) != len(job['names']):
            raise ValueError(f"Wrong cell count: {job['key']}")
        entries = {}
        for group in job['groups']:
            start, count = group['start'], group['count']
            names = job['names'][start:start + count]
            raw_frames = cells[start:start + count]
            canvas, anchor = tuple(group['canvas']), group['anchor']
            scale = min(group['height'] / raw_frames[group.get('reference', 0)].shape[0],
                        (canvas[0] - 6) / max(raw.shape[1] for raw in raw_frames),
                        (canvas[1] - 6) / max(raw.shape[0] for raw in raw_frames))
            color = (150, 232, 255) if job['kind'] == 'operator' else (255, 86, 56)
            for index, (name, raw) in enumerate(zip(names, raw_frames)):
                Image.fromarray(raw).save(OUT / 'masters' / f'{name}.png')
                frame = place_sprite(outline(shrink(raw, scale), color), canvas, anchor)
                frame.save(OUT / 'sprites' / f'{name}.png')
                entries[name] = dict(key=name, kind=job['kind'], group=group['id'],
                                     species=group.get('species', group['id']), frameIndex=index,
                                     image=f'sprites/{name}.png', master=f'masters/{name}.png',
                                     size=list(canvas), anchor=anchor,
                                     origin=[.5, 1] if anchor == 'feet' else [.5, .5],
                                     bounds=list(frame.getbbox()), sourceScale=round(scale, 6),
                                     facing='right' if job['kind'] == 'operator' else 'left',
                                     source=source.relative_to(ROOT).as_posix(),
                                     status='staged art; not registered in active gameplay')
            make_gif(group, [entries[name] for name in names], job['kind'])
        ordered = [entries[name] for name in job['names']]
        make_board(job, ordered)
        inventory.extend(ordered)
    make_overview(inventory)
    make_muzzle_grid(inventory)
    (OUT / 'inventory.json').write_text(json.dumps(inventory, indent=2) + '\n', encoding='utf-8')
    print(f'Prepared {len(inventory)} sprite frames; live files untouched: {OUT}')


if __name__ == '__main__':
    main()
