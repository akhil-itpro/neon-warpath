"""Build HALCYON and the three campaign props from immutable imagegen originals.

python -B tools/process_campaign_finish.py
Only this batch's texture keys are replaced; other manifest entries are preserved.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/campaign_finish'
OUT = ROOT / 'public/assets'
PREVIEW = ROOT / 'art/preview'
OUTLINE = (11, 13, 20, 255)
POSES = ('run0', 'run1', 'run2', 'run3', 'idle', 'jump', 'slide', 'crouch')
PORTRAITS = ('rook', 'viper', 'titan', 'serrik', 'quill', 'juno', 'patch', 'croupier', 'oracle', 'myrrhkin', 'sovereign', 'halcyon')
# The slide's coat extends across the nominal column boundary; measured from the original.
BOXES = [(i * 384, 0, (i + 1) * 384, 500) for i in range(4)] + [
    (0, 500, 360, 1024), (370, 500, 705, 1024),
    (705, 500, 1155, 1024), (1160, 500, 1536, 1024),
]


def cutout(im):
    a = np.array(im.convert('RGBA'))
    mask = a[:, :, 3] >= 160
    labels, n = ndimage.label(mask)
    areas = np.bincount(labels.ravel())
    # Remove isolated alpha speckles, retain meaningful detached detail.
    keep = areas >= max(12, areas[1:].max() * 0.001) if n else areas > 0
    keep[0] = False
    a[:, :, 3] = np.where(keep[labels], 255, 0)
    im = Image.fromarray(a)
    return im.crop(im.getbbox())


def canvas(im, size, canvas_size):
    im = im.resize(size, Image.Resampling.LANCZOS)
    a = np.array(im)
    a[:, :, :3] = np.clip(a[:, :, :3].astype(float) * 1.12, 0, 255).astype('uint8')
    a[:, :, 3] = np.where(a[:, :, 3] >= 128, 255, 0)
    im = Image.fromarray(a).quantize(colors=96, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert('RGBA')
    out = Image.new('RGBA', canvas_size)
    out.alpha_composite(im, ((canvas_size[0] - im.width) // 2, canvas_size[1] - im.height - 1))
    a = np.array(out)
    solid = a[:, :, 3] > 0
    border = ndimage.binary_dilation(solid) & ~solid
    a[border] = OUTLINE
    return Image.fromarray(a)


def main():
    images = {}
    sheet = Image.open(SOURCE / 'halcyon_sheet.png')
    crops = [cutout(sheet.crop(box)) for box in BOXES]
    scale = 56 / crops[4].height  # one shared scale: no pose-by-pose stretching
    for pose, crop in zip(POSES, crops):
        size = tuple(max(1, round(v * scale)) for v in crop.size)
        images[f'halcyon_{pose}'] = canvas(crop, size, (96, 72))
    for key, cw, ch in [('quill_cage', 40, 56), ('prism_pylon', 28, 64), ('slot_machine', 40, 64)]:
        crop = cutout(Image.open(SOURCE / f'{key}.png'))
        scale = min((cw - 2) / crop.width, (ch - 2) / crop.height)
        images[key] = canvas(crop, tuple(max(1, round(v * scale)) for v in crop.size), (cw, ch))
    for key, im in images.items():
        im.save(OUT / f'{key}.png')
        print(key, im.size, im.getbbox())
    portraits = Image.open(SOURCE / 'portraits.png').convert('RGB')
    for i, name in enumerate(PORTRAITS):
        x, y = i % 4, i // 4
        # Inset two source pixels to remove atlas separator lines.
        box = (round(x * portraits.width / 4) + 2, round(y * portraits.height / 3) + 2,
               round((x + 1) * portraits.width / 4) - 2, round((y + 1) * portraits.height / 3) - 2)
        face = portraits.crop(box).resize((64, 64), Image.Resampling.LANCZOS)
        face = face.quantize(colors=96, dither=Image.Dither.NONE).convert('RGB')
        key = f'portrait_{name}'
        face.save(OUT / f'{key}.png')
        images[key] = face
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest['images'] = sorted(set(manifest['images']) | set(images))
    manifest_path.write_text(json.dumps(manifest, indent=1) + '\n', encoding='utf-8')
    board = Image.new('RGB', (1152, ((len(images) + 3) // 4) * 266), '#283040')
    draw = ImageDraw.Draw(board)
    for i, (key, im) in enumerate(images.items()):
        x, y = (i % 4) * 288, (i // 4) * 266
        draw.text((x + 10, y + 10), key, fill='#e0e8ff')
        im = im.resize((im.width * 3, im.height * 3), Image.Resampling.NEAREST)
        board.paste(im, (x + (288 - im.width) // 2, y + 40), im if im.mode == 'RGBA' else None)
    PREVIEW.mkdir(exist_ok=True)
    board.save(PREVIEW / 'campaign-finish.png')
    frames = [images[f'halcyon_run{i}'].resize((384, 288), Image.Resampling.NEAREST) for i in range(4)]
    frames[0].save(PREVIEW / 'halcyon-run.gif', save_all=True, append_images=frames[1:], duration=100, loop=0, disposal=2)


if __name__ == '__main__':
    main()
