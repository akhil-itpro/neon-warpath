"""Build the store illustrations and game icon from the original generated art."""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/source/store'
OUT = ROOT / 'art/store'
SIZES = {'cover': (630, 500), 'banner': (960, 540), 'icon': (256, 256)}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size in SIZES.items():
        with Image.open(SOURCE / f'{name}.png') as source:
            art = ImageOps.fit(source.convert('RGB'), size, Image.Resampling.LANCZOS)
        art.save(OUT / f'{name}.png', optimize=True)
        if name == 'icon':
            art.resize((64, 64), Image.Resampling.LANCZOS).save(ROOT / 'public/favicon.png', optimize=True)


if __name__ == '__main__':
    main()
