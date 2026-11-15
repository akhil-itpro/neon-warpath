"""Prepare the isolated Frontier art pack. Never writes to public/assets or live data.

Run: python -B tools/process_frontier.py
Requires the same Pillow, NumPy and SciPy packages as process_assets.py.
Sources/prompts are immutable; each grid cell has a declared identity, so extraction
cannot silently reorder a low crouch or wide wing into a neighbouring animation.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.dont_write_bytecode = True
from process_assets import components, cut, matte, outline, shrink

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/frontier'
OUT = ROOT / 'art/library/frontier'
COOL = (150, 232, 255)
HOT = (255, 86, 56)
NEUTRAL = (130, 155, 180)


def extract_cells(image, cols, rows):
    """Chroma-key within declared cells, preserving all pieces of each object."""
    rgb = np.asarray(image.convert('RGB')).astype(np.int16)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    key = np.median(border, axis=0)
    if np.mean(np.abs(border - key).sum(axis=1) < 40) < .97:
        raise ValueError('Expected a flat chroma background; inspect source before extracting')
    mask = np.abs(rgb - key).sum(axis=2) > 110
    cells = []
    for row in range(rows):
        for col in range(cols):
            x0, x1 = round(col * image.width / cols), round((col + 1) * image.width / cols)
            y0, y1 = round(row * image.height / rows), round((row + 1) * image.height / rows)
            cell = mask[y0:y1, x0:x1]
            ys, xs = np.where(cell)
            if len(xs) < 100:
                raise ValueError(f'Empty/undersized cell {col}, {row}')
            bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
            if min(bx0, by0, cell.shape[1] - bx1, cell.shape[0] - by1) == 0:
                raise ValueError(f'Foreground touches a cell edge at {col}, {row}; inspect cropping')
            rgba = np.dstack([rgb[y0:y1, x0:x1].astype(np.uint8), (cell * 255).astype(np.uint8)])
            cells.append(rgba[by0:by1, bx0:bx1])
    return cells


def groups_for(job):
    kind, names = job['kind'], job['names']
    if kind == 'operator':
        return [(names, (96, 72), 66, 4, 'feet', COOL)]
    if kind == 'enemy_sheet':
        return [(names[:4], (96, 76), 66, 0, 'feet', HOT),
                (names[4:], (80, 64), 54, 0, 'center', HOT)]
    if kind == 'boss':
        canvas = (224, 128) if job['key'].startswith('switchyard') else (192, 160)
        return [(names, canvas, canvas[1] - 10, 0, 'feet' if canvas[0] == 224 else 'center', HOT)]
    canvas, height, color = ((48, 28), 22, COOL) if kind == 'weapon' else ((96, 80), 70, NEUTRAL)
    return [([name], canvas, height, 0, 'center' if kind == 'weapon' else 'feet', color) for name in names]


def place_sprite(sprite, canvas, anchor):
    height, width = sprite.shape[:2]
    x = (canvas[0] - width) // 2
    y = (canvas[1] - height) // 2 if anchor == 'center' else canvas[1] - height - 2
    # Align feet on one baseline; align operators by the upper torso like the live pipeline.
    if canvas == (96, 72):
        upper = sprite[:max(1, round(height * .4)), :, 3] > 0
        torso = int(np.median(np.where(upper)[1]))
        x = max(2, min(canvas[0] // 2 - torso, canvas[0] - width - 2))
    if x < 1 or y < 1 or x + width >= canvas[0] or y + height >= canvas[1]:
        raise ValueError('Sprite does not fit canvas with an empty edge')
    frame = np.zeros((canvas[1], canvas[0], 4), dtype=np.uint8)
    frame[y:y+height, x:x+width] = sprite
    return Image.fromarray(frame)


def board(job, entries):
    cols, rows = job['cols'], job['rows']
    cell_w, cell_h = (480, 370) if job['kind'] == 'boss' else (300, 255)
    image = Image.new('RGB', (cols * cell_w, rows * cell_h), '#121c2b')
    draw = ImageDraw.Draw(image)
    for i, entry in enumerate(entries):
        x, y = i % cols * cell_w, i // cols * cell_h
        draw.text((x + 12, y + 10), entry['key'].upper(), fill='#e1edff')
        sprite = Image.open(OUT / entry['image'])
        zoom = min(3, (cell_w - 20) // sprite.width, (cell_h - 55) // sprite.height)
        large = sprite.resize((sprite.width * zoom, sprite.height * zoom), Image.Resampling.NEAREST)
        image.paste(large, (x + (cell_w - large.width) // 2, y + 30), large)
        draw.text((x + 12, y + cell_h - 20), f"{sprite.width} x {sprite.height} | {entry['anchor']}", fill='#8fa6bf')
    image.save(OUT / 'previews' / f"{job['key']}.png")


def animation_preview(key, paths, duration):
    frames = []
    for path in paths:
        sprite = Image.open(OUT / path)
        bg = Image.new('RGB', sprite.size, '#121c2b')
        bg.paste(sprite, (0, 0), sprite)
        frames.append(bg.resize((bg.width * 3, bg.height * 3), Image.Resampling.NEAREST))
    frames[0].save(OUT / 'previews' / f'{key}.gif', save_all=True,
                   append_images=frames[1:], duration=duration, loop=0, disposal=2)


def muzzle_grid(inventory):
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
    for folder in ['masters', 'sprites', 'worlds', 'previews']:
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    jobs = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf-8'))
    inventory = []
    for job in jobs:
        source = SOURCE / f"{job['key']}.png"
        image = Image.open(source)
        if job['kind'] == 'world':
            key = job['names'][0]
            bg = image.convert('RGB').resize((640, 360), Image.Resampling.LANCZOS)
            bg = bg.quantize(colors=160, dither=Image.Dither.NONE).convert('RGB')
            bg.save(OUT / 'worlds' / f'{key}.png')
            strip = Image.new('RGB', (1280, 360))
            strip.paste(bg, (0, 0))
            strip.paste(bg.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (640, 0))
            strip.save(OUT / 'worlds' / f'{key}_strip.png')
            inventory.append(dict(key=key, kind='world', image=f'worlds/{key}.png',
                                  strip=f'worlds/{key}_strip.png', size=[640, 360],
                                  source=source.relative_to(ROOT).as_posix(), frames=1,
                                  status='staged flattened backdrop; mirrored strip; no level geometry'))
            continue
        if job['kind'] == 'prop':
            # This static sheet has uneven gutters: use complete silhouettes rather
            # than slicing a shrine tip / coolant pipe at a nominal grid boundary.
            mask = matte(image, (job['cols'], job['rows']))
            boxes, labels = components(mask, len(job['names']))
            if len(boxes) != len(job['names']):
                raise ValueError(f"Wrong prop count: {job['key']}")
            cells = [cut(image, mask, labels, box) for box in boxes]
        else:
            cells = extract_cells(image, job['cols'], job['rows'])
        raw_by_name = dict(zip(job['names'], cells))
        entries = {}
        for names, canvas, target_h, ref, anchor, color in groups_for(job):
            raw_frames = [raw_by_name[name] for name in names]
            # One scale for an entire character/state group. Never stretch short poses to idle height.
            scale = min(target_h / raw_frames[ref].shape[0],
                        (canvas[0] - 6) / max(raw.shape[1] for raw in raw_frames),
                        (canvas[1] - 6) / max(raw.shape[0] for raw in raw_frames))
            for name, raw in zip(names, raw_frames):
                Image.fromarray(raw).save(OUT / 'masters' / f'{name}.png')
                frame = place_sprite(outline(shrink(raw, scale), color), canvas, anchor)
                frame.save(OUT / 'sprites' / f'{name}.png')
                entries[name] = dict(key=name, kind=job['kind'], group=names[0],
                                     image=f'sprites/{name}.png', master=f'masters/{name}.png',
                                     size=list(canvas), anchor=anchor,
                                     origin=[.5, 1] if anchor == 'feet' else [.5, .5],
                                     sourceScale=round(scale, 6), bounds=list(frame.getbbox()),
                                     source=source.relative_to(ROOT).as_posix(),
                                     facing='right' if job['kind'] in ['operator', 'weapon'] else 'left' if job['kind'] in ['enemy_sheet', 'boss'] else 'neutral',
                                     status='staged art; no runtime registration or collision definition')
            if len(names) > 1:
                preview_names = names[:4] if job['kind'] == 'operator' else names
                animation_preview(names[0].rsplit('_', 1)[0], [entries[n]['image'] for n in preview_names],
                                  1000 if job['kind'] == 'boss' else 120)
        ordered = [entries[name] for name in job['names']]
        inventory.extend(ordered)
        board(job, ordered)
    worlds = [entry for entry in inventory if entry['kind'] == 'world']
    world_board = Image.new('RGB', (1280, 390), '#121c2b')
    draw = ImageDraw.Draw(world_board)
    for i, entry in enumerate(worlds):
        draw.text((i * 640 + 12, 10), entry['key'].upper(), fill='white')
        world_board.paste(Image.open(OUT / entry['image']), (i * 640, 30))
    world_board.save(OUT / 'previews/worlds.png')
    muzzle_grid(inventory)
    (OUT / 'inventory.json').write_text(json.dumps(inventory, indent=2) + '\n', encoding='utf-8')
    print(f'Prepared {len(inventory)} frame/background records; live assets untouched: {OUT}')


if __name__ == '__main__':
    main()
