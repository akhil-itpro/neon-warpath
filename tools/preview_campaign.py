"""Build a labeled review sheet from the processed campaign art (no source edits)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
OUT = ROOT / "art" / "campaign-roster.png"


def main():
    image = Image.new("RGB", (1600, 1200), "#101624")
    draw = ImageDraw.Draw(image)
    try:
        title = ImageFont.truetype("arialbd.ttf", 32)
        label = ImageFont.truetype("arial.ttf", 22)
    except OSError:
        title = label = ImageFont.load_default()
    draw.text((28, 22), "NEON WARPATH / CAMPAIGN ART", font=title, fill="#e9f5ff")
    draw.text((28, 66), "9 designs / 35 runtime sprites / November 15, 2026", font=label, fill="#92b3c9")

    def row(name, keys, x, y, slot, scale=2):
        draw.text((x, y), name, font=label, fill="#65e3e9")
        for i, key in enumerate(keys):
            sprite = Image.open(ASSETS / f"{key}.png").convert("RGBA")
            sprite = sprite.resize((round(sprite.width * scale), round(sprite.height * scale)), Image.Resampling.NEAREST)
            image.paste(sprite, (x + i * slot + (slot - sprite.width) // 2, y + 42), sprite)

    poses = ["run0", "run1", "run2", "run3", "idle", "jump", "slide", "crouch"]
    row("VIPER / RUN - IDLE - JUMP - SLIDE - CROUCH", [f"viper_{p}" for p in poses], 24, 115, 194)
    row("TITAN / RUN - IDLE - JUMP - SLIDE - CROUCH", [f"titan_{p}" for p in poses], 24, 325, 194)
    row("FURNACE GHOUL", [f"zombie_{i}" for i in range(4)], 24, 535, 194)
    row("GHOUL BRUTE", [f"brute_{i}" for i in range(4)], 810, 535, 194)
    row("VOID STALKER", [f"alien_{i}" for i in range(4)], 24, 745, 194)
    row("ASH IMP", [f"demon_{i}" for i in range(4)], 810, 745, 194)
    row("VULTURE GUNSHIP", ["vulture"], 24, 920, 520, 3)
    row("FURNACE WARDEN", ["warden"], 610, 920, 300, 3)
    row("ARCHON CORE", ["archon"], 1110, 920, 300, 2)
    draw.text((28, 1160), "Original sources and exact prompts: art/source/ | Runtime sprites: public/assets/", font=label, fill="#92b3c9")
    image.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
