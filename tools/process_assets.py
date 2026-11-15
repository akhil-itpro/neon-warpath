"""
Asset pipeline: turns AI-generated sheets in art/source/ into game-ready sprites in public/assets/.

Usage:  python tools/process_assets.py            (process everything in MANIFEST)
        python tools/process_assets.py --preview  (also write art/preview/contact.png)

How it works
  1. Background removal. If the sheet border is a flat colour (e.g. magenta #FF00FF) we chroma-key it.
     Otherwise we fall back to the `rembg` neural matting model (needed for the original dark/glow sheets).
  2. Connected components -> one bounding box per sprite, sorted row-major (top-left to bottom-right).
  3. Each sprite is downscaled to its target pixel height, alpha is hardened (pixel art has no soft edges),
     and a 1px outline is baked in (cool for heroes, hot for enemies) so sprites read on busy backgrounds.
  4. Frames of an animated character share one canvas size and are anchored feet-bottom / torso-centre.

To add art: drop the PNG in art/source/, add an entry to MANIFEST below, run the script,
then reference the output key in src/data/*.ts. See docs/ART_PIPELINE.md.
"""
import sys, os, json, argparse
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "art", "source")
OUT = os.path.join(ROOT, "public", "assets")
PREVIEW = os.path.join(ROOT, "art", "preview")

HERO_OUTLINE = (150, 232, 255)
ENEMY_OUTLINE = (255, 86, 56)

# sheet -> list of sprites in row-major order. h = target height in game pixels (game is 640x360).
# canvas = shared (w, h) frame for animated characters (feet anchored bottom-centre).
MANIFEST = {
    "weapon_pickups.png": {
        "outline": HERO_OUTLINE, "grid": (2, 2), "max_width": 34,
        "canvas": (38, 22), "anchor": "center",
        "sprites": [{"name": f"pickup_{key}", "h": 18}
                    for key in ["smg", "shotgun", "rail", "rocket"]],
    },
    **{f"{key}_sheet.png": {
        "outline": HERO_OUTLINE, "grid": (4, 2),
        "scale_ref": {"index": 4, "h": 66}, "canvas": (96, 72),
        "names": [f"{key}_{pose}" for pose in
                  ["run0", "run1", "run2", "run3", "idle", "jump", "slide", "crouch"]],
    } for key in ["viper", "titan"]},
    **{f"{key}_sheet.png": {
        "outline": ENEMY_OUTLINE, "grid": (4, 1),
        "scale_ref": {"index": 0, "h": height}, "canvas": canvas,
        "anchor": anchor,
        "names": [f"{key}_{i}" for i in range(4)],
    } for key, height, canvas, anchor in [
        ("zombie", 68, (96, 72), "feet"),
        ("brute", 68, (96, 72), "feet"),
        ("alien", 34, (72, 48), "center"),
        ("demon", 40, (72, 48), "center"),
    ]},
    **{f"{key}.png": {
        "outline": ENEMY_OUTLINE,
        "sprites": [{"name": key, "h": height}],
        "max_width": width,
    } for key, height, width in [
        ("vulture", 74, 168), ("warden", 62, 100), ("archon", 94, 94),
    ]},
    "gangster_sheet.png": {
        "outline": ENEMY_OUTLINE,
        "grid": (4, 1),
        "scale_ref": {"index": 0, "h": 66},
        "canvas": (96, 72),
        "names": ["gangster_0", "gangster_1", "gangster_2", "gangster_3"],
    },
    "Tactical Hero Eight-Frame Sprite Sheet.png": {
        "outline": HERO_OUTLINE,
        "grid": (4, 2),  # columns, rows of sprites on the sheet
        "scale_ref": {"index": 4, "h": 66},  # sprite #4 (idle) defines the scale for the whole sheet
        "canvas": (96, 72),
        "names": ["hero_run0", "hero_run1", "hero_run2", "hero_run3",
                  "hero_idle", "hero_jump", "hero_slide", "hero_crouch"],
    },
    "Neon sci-fi combat sprite atlas.png": {
        "outline": ENEMY_OUTLINE,
        "grid": (3, 2),
        "sprites": [
            {"name": "robot_aim", "h": 68},
            {"name": "drone", "h": 34},
            {"name": "heli", "h": 74},
            {"name": "turret", "h": 62},
            {"name": "robot_walk", "h": 68},
            {"name": "jet", "h": 56},
        ],
    },
}

# backgrounds: resized to 640x360 and mirrored into a seamless 1280x360 strip
BACKGROUNDS = {
    "Neon Midnight Metropolis.png": "bg_city",
    "Stormlit Furnace District.png": "bg_furnace",
    "Rogue AI Server Cathedral.png": "bg_cathedral",
}

_session = None


def matte(img: Image.Image, grid=(1, 1)) -> np.ndarray:
    """Return a boolean foreground mask for a sheet."""
    rgb = np.asarray(img.convert("RGB")).astype(np.int32)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    med = np.median(border, axis=0)
    if np.mean(np.abs(border - med).sum(axis=1) < 40) > 0.97 and med.max() > 90:
        # flat, bright key colour -> chroma key
        return np.abs(rgb - med).sum(axis=2) > 110
    global _session
    from rembg import remove, new_session
    if _session is None:
        _session = new_session("isnet-general-use")
    # Matting the whole sheet at once drops the least salient sprites, so matte overlapping grid
    # cells (each roughly one sprite) and merge the results.
    cols, rows = grid
    W, H = img.size
    mask = np.zeros((H, W), bool)
    cw, ch = W / cols, H / rows
    for r in range(rows):
        for c in range(cols):
            x0, x1 = int(max(0, (c - 0.18) * cw)), int(min(W, (c + 1.18) * cw))
            y0, y1 = int(max(0, (r - 0.12) * ch)), int(min(H, (r + 1.12) * ch))
            cell = np.asarray(remove(img.crop((x0, y0, x1, y1)), session=_session, only_mask=True)) > 110
            mask[y0:y1, x0:x1] |= cell
    return mask


def components(mask: np.ndarray, expected: int):
    """Bounding boxes of the `expected` largest blobs, row-major order."""
    grown = ndimage.binary_dilation(mask, iterations=10)
    lab, n = ndimage.label(grown)
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    keep = np.argsort(sizes)[::-1][:expected] + 1
    boxes = []
    for k in keep:
        ys, xs = np.where((lab == k) & mask)
        boxes.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1, k))
    # cluster into rows by vertical centre, then left-to-right inside each row
    med_h = np.median([b[3] - b[1] for b in boxes])
    boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows, last = [], None
    for b in boxes:
        cy = (b[1] + b[3]) / 2
        if last is None or cy - last > med_h * 0.5:
            rows.append([])
        rows[-1].append(b)
        last = cy
    return [b for r in rows for b in sorted(r, key=lambda b: b[0])], lab


def shrink(rgba: np.ndarray, scale: float) -> np.ndarray:
    """Downscale with premultiplied alpha, then harden the alpha edge."""
    h, w = rgba.shape[:2]
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    f = rgba.astype(np.float32) / 255
    f[..., :3] *= f[..., 3:4]
    small = np.asarray(Image.fromarray((f * 255).astype(np.uint8), "RGBA").resize((nw, nh), Image.LANCZOS)).astype(np.float32) / 255
    a = small[..., 3:4]
    rgb = np.where(a > 0.01, small[..., :3] / np.maximum(a, 0.01), 0)
    out = np.zeros((nh, nw, 4), np.uint8)
    out[..., :3] = np.clip(rgb * 255, 0, 255)
    out[..., 3] = np.where(a[..., 0] > 0.5, 255, 0)
    # lift contrast a touch: AI sheets are very dark and get lost on dark stages
    rgbf = out[..., :3].astype(np.float32) / 255
    rgbf = np.clip(rgbf ** 0.82 * 1.12, 0, 1)
    out[..., :3] = (rgbf * 255).astype(np.uint8)
    return out


def outline(spr: np.ndarray, colour) -> np.ndarray:
    p = np.pad(spr, ((1, 1), (1, 1), (0, 0)))
    solid = p[..., 3] > 0
    edge = ndimage.binary_dilation(solid, structure=ndimage.generate_binary_structure(2, 1)) & ~solid
    p[edge, :3] = colour
    p[edge, 3] = 255
    return p


def cut(img, mask, lab, box):
    x0, y0, x1, y1, k = box
    rgba = np.dstack([np.asarray(img.convert("RGB"))[y0:y1, x0:x1],
                      (((lab[y0:y1, x0:x1] == k) & mask[y0:y1, x0:x1]) * 255).astype(np.uint8)])
    return rgba


def place(spr: np.ndarray, canvas, anchor="feet"):
    """Feet at bottom, torso (top 40% of rows) centred horizontally."""
    cw, ch = canvas
    h, w = spr.shape[:2]
    top = spr[: max(1, int(h * 0.4)), :, 3] > 0
    cx = np.where(top.any(axis=0))[0]
    cx = int(np.median(np.where(top)[1])) if len(cx) else w // 2
    out = np.zeros((ch, cw, 4), np.uint8)
    ox, oy = cw // 2 - cx, ch - h
    if anchor == "center":
        ox, oy = (cw - w) // 2, (ch - h) // 2
    sx0, sy0 = max(0, -ox), max(0, -oy)
    dx0, dy0 = max(0, ox), max(0, oy)
    ww, hh = min(w - sx0, cw - dx0), min(h - sy0, ch - dy0)
    out[dy0:dy0 + hh, dx0:dx0 + ww] = spr[sy0:sy0 + hh, sx0:sx0 + ww]
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--only", choices=list(MANIFEST), help="Rebuild one sprite sheet; preserve other assets")
    args = parser.parse_args()
    os.makedirs(OUT, exist_ok=True)
    made = []
    for sheet, spec in MANIFEST.items():
        if args.only and sheet != args.only:
            continue
        path = os.path.join(SRC, sheet)
        if not os.path.exists(path):
            print("skip (missing):", sheet)
            continue
        img = Image.open(path)
        names = spec.get("names") or [s["name"] for s in spec["sprites"]]
        mask = matte(img, spec.get("grid", (1, 1)))
        boxes, lab = components(mask, len(names))
        if len(boxes) != len(names):
            sys.exit(f"ERROR {sheet}: expected {len(names)} sprites, found {len(boxes)}")
        ref = spec.get("scale_ref")
        sheet_scale = ref["h"] / (boxes[ref["index"]][3] - boxes[ref["index"]][1]) if ref else None
        for i, (name, box) in enumerate(zip(names, boxes)):
            raw = cut(img, mask, lab, box)
            scale = sheet_scale or spec["sprites"][i]["h"] / raw.shape[0]
            if spec.get("max_width"):
                scale = min(scale, spec["max_width"] / raw.shape[1])
            spr = outline(shrink(raw, scale), spec["outline"])
            if spec.get("canvas"):
                spr = place(spr, spec["canvas"], spec.get("anchor", "feet"))
            Image.fromarray(spr, "RGBA").save(os.path.join(OUT, name + ".png"))
            made.append((name, spr))
            print(f"{name:12s} {spr.shape[1]}x{spr.shape[0]}")
    for sheet, key in BACKGROUNDS.items():
        if args.only:
            continue
        path = os.path.join(SRC, sheet)
        if not os.path.exists(path):
            continue
        bg = Image.open(path).convert("RGB").resize((640, 360), Image.LANCZOS)
        strip = Image.new("RGB", (1280, 360))
        strip.paste(bg, (0, 0))
        strip.paste(bg.transpose(Image.FLIP_LEFT_RIGHT), (640, 0))
        strip = strip.quantize(colors=160, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
        strip.save(os.path.join(OUT, key + ".png"), optimize=True)
        print(key, "1280x360")
    # the game loads whatever is listed here, so new art shows up without touching loader code
    keys = sorted(f[:-4] for f in os.listdir(OUT) if f.endswith(".png"))
    with open(os.path.join(OUT, "manifest.json"), "w") as fh:
        json.dump({"images": keys}, fh, indent=1)
    if args.preview and made:
        os.makedirs(PREVIEW, exist_ok=True)
        W = sum(s.shape[1] + 6 for _, s in made)
        H = max(s.shape[0] for _, s in made) + 12
        sheet = Image.new("RGBA", (W, H), (40, 44, 70, 255))
        x = 3
        for _, s in made:
            sheet.alpha_composite(Image.fromarray(s, "RGBA"), (x, H - 6 - s.shape[0]))
            x += s.shape[1] + 6
        sheet.resize((W * 3, H * 3), Image.NEAREST).save(os.path.join(PREVIEW, "contact.png"))


if __name__ == "__main__":
    main()
