"""Copy the chosen expansion-library art into public/assets at in-game sizes and register it in manifest.json.

  python tools/integrate_expansion.py

Sources stay untouched in art/library/expansion. Everything is re-cut from the high-resolution `masters/`
so bosses and props get their own native size instead of being stretched in the engine.
Canvases are trimmed to the art, so the engine's centred hitboxes line up without per-sprite offsets.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from process_assets import shrink, outline

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / 'art/library/expansion'
OUT = ROOT / 'public/assets'

RED, CYAN, GREY = (255, 86, 56), (150, 232, 255), (130, 155, 180)

# output key -> (master name, art height in game pixels, max width, outline colour)
JOBS = {
    # enemies (a standing trooper is ~64px tall)
    'riot_bastion': ('riot_bastion', 66, 90, RED), 'coil_sniper': ('coil_sniper', 64, 90, RED),
    'welder_hound': ('welder_hound', 44, 96, RED), 'saw_crab': ('saw_crab', 48, 90, RED),
    'bell_drone': ('bell_drone', 44, 60, RED), 'scrap_mantis': ('scrap_mantis', 60, 90, RED),
    'sporeback': ('sporeback', 64, 90, RED), 'acid_bellower': ('acid_bellower', 58, 90, RED),
    'cinder_knight': ('cinder_knight', 70, 96, RED), 'deepjaw': ('deepjaw', 64, 90, RED),
    'lantern_moth': ('lantern_moth', 46, 70, RED), 'vendotron': ('vendotron', 66, 90, RED),
    'umbrella_jelly': ('umbrella_jelly', 50, 60, RED), 'traffic_totem': ('traffic_totem', 66, 90, RED),
    'disco_slug': ('disco_slug', 48, 90, RED), 'glass_widow': ('glass_widow', 44, 80, RED),
    # bosses, cut large from the masters
    'boss_tyrant': ('teacup_tyrant', 118, 190, RED), 'boss_widow': ('glass_widow', 104, 190, RED),
    'boss_jelly': ('umbrella_jelly', 124, 160, RED), 'boss_oracle': ('crt_oracle', 116, 160, RED),
    # props at believable physical sizes
    'toxic_barrel': ('toxic_barrel', 34, 60, GREY), 'alien_egg': ('alien_egg', 40, 60, RED),
    'ammo_locker': ('ammo_locker', 44, 60, GREY), 'med_station': ('med_station', 38, 60, GREY),
    'power_cell': ('power_cell', 40, 60, GREY), 'rift_anchor': ('rift_anchor', 58, 60, GREY),
    'street_terminal': ('street_terminal', 46, 60, GREY), 'scrap_barricade': ('scrap_barricade', 30, 80, GREY),
    # weapon pickups
    'pickup_arc': ('arc_caster', 20, 40, CYAN), 'pickup_cryo': ('cryo_projector', 20, 40, CYAN),
    'pickup_scrap': ('scrap_cannon', 20, 40, CYAN), 'pickup_sun': ('sunlance', 20, 40, CYAN),
    'pickup_saw': ('buzzsaw_launcher', 20, 40, CYAN), 'pickup_spore': ('spore_sprayer', 20, 40, CYAN),
    'pickup_grav': ('gravity_mortar', 20, 40, CYAN), 'pickup_tesla': ('tesla_crossbow', 20, 40, CYAN),
    # Patch the mechanic appears on the upgrade screen
    'npc_patch': ('patch', 96, 140, CYAN),
}
WORLDS = {'bg_casino': 'bg_neon_casino_strip', 'bg_fungal': 'bg_fungal_depths_strip',
          'bg_abyss': 'bg_abyss_station_strip', 'bg_orbital': 'bg_orbital_garden_strip'}


def main():
    keys = []
    for key, (master, height, max_w, colour) in JOBS.items():
        raw = np.asarray(Image.open(LIB / 'masters' / f'{master}.png').convert('RGBA'))
        ys, xs = np.nonzero(raw[..., 3] > 8)
        raw = raw[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        scale = min((height - 2) / raw.shape[0], (max_w - 2) / raw.shape[1])
        Image.fromarray(outline(shrink(raw, scale), colour)).save(OUT / f'{key}.png')
        keys.append(key)
    for key, strip in WORLDS.items():
        Image.open(LIB / 'worlds' / f'{strip}.png').save(OUT / f'{key}.png')
        keys.append(key)
    path = OUT / 'manifest.json'
    manifest = json.loads(path.read_text())
    manifest['images'] = sorted(set(manifest['images']) | set(keys))
    path.write_text(json.dumps(manifest, indent=1) + '\n')
    print(f'Integrated {len(keys)} images into {OUT}')


if __name__ == '__main__':
    main()
