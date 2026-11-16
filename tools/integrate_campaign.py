"""Bring the Frontier and species libraries into the live game for the 12-stage campaign.

  python tools/integrate_campaign.py

Sources stay untouched in art/library/frontier and art/library/species. The library `sprites/` are already
game-sized with one shared scale per animation group, so they are copied as they are; only the baked outline
is swapped to the live style (near-black on enemies and bosses, muted cool rim on operators, see Session 12 A1).
Every copied key is added to public/assets/manifest.json.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
from process_assets import ENEMY_OUTLINE, HERO_OUTLINE

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets'
FRONTIER = ROOT / 'art/library/frontier'
SPECIES = ROOT / 'art/library/species'

OLD_RED, OLD_CYAN = (255, 86, 56), (150, 232, 255)

ANIM = lambda base: [f'{base}_{i}' for i in range(4)]
STATES = lambda base: [f'{base}_{s}' for s in ('idle', 'windup', 'attack', 'exposed')]
POSES = lambda base: [f'{base}_{p}' for p in ('run0', 'run1', 'run2', 'run3', 'idle', 'jump', 'slide', 'crouch')]

# library file name -> live key (same name unless renamed)
JOBS: dict[Path, dict[str, str]] = {
    FRONTIER / 'sprites': {
        **{k: k for k in ANIM('rail_marauder') + ANIM('storm_kite') + ANIM('bellows_acolyte') + ANIM('cinder_skate')},
        **{k: k for k in STATES('switchyard_colossus') + STATES('kiln_matriarch')},
        # HALCYON's combat frame borrows the Frontier operator KESTREL until his own rig exists (Codex request)
        **{f'kestrel_{p}': f'halcyon_{p}' for p in ('run0', 'run1', 'run2', 'run3', 'idle', 'jump', 'slide', 'crouch')},
        **{k: k for k in ('rail_signal', 'storm_battery', 'pressure_vent', 'furnace_shrine', 'coolant_pump', 'cargo_drone_wreck', 'salvage_cache', 'ember_egg')},
    },
    SPECIES / 'sprites': {
        **{k: k for sp in ('varkesh', 'corvane', 'kharrix', 'ferrivor', 'nacreth', 'cirrid', 'myrrhkin', 'thren', 'vitreon', 'lithurn', 'geliform', 'asterid') for k in ANIM(f'sp_{sp}')},
        **{k: k for k in STATES('nacreth_sovereign') + STATES('vitreon_regent')},
        # playable species operators (unlocked by story choices). Operator art convention: <art>_run0..3, _idle...
        **{f'op_serrik_{p}': f'serrik_{p}' for p in ('run0', 'run1', 'run2', 'run3', 'idle', 'jump', 'slide', 'crouch')},
        **{f'op_quill_{p}': f'quill_{p}' for p in ('run0', 'run1', 'run2', 'run3', 'idle', 'jump', 'slide', 'crouch')},
    },
}
WORLDS = {'bg_railyard': FRONTIER / 'worlds/bg_stormbreak_strip.png', 'bg_engine': FRONTIER / 'worlds/bg_underworld_engine_strip.png'}


def restyle(a: np.ndarray) -> np.ndarray:
    a = a.copy()
    solid = a[..., 3] > 0
    edge = solid & ~ndimage.binary_erosion(solid)
    rgb = a[..., :3]
    for old, new in ((OLD_RED, ENEMY_OUTLINE), (OLD_CYAN, HERO_OUTLINE)):
        m = edge & np.all(rgb == old, axis=-1)
        a[m, :3] = new
    return a


def main():
    keys = []
    for folder, jobs in JOBS.items():
        for src, key in jobs.items():
            a = np.asarray(Image.open(folder / f'{src}.png').convert('RGBA'))
            Image.fromarray(restyle(a)).save(OUT / f'{key}.png')
            keys.append(key)
    for key, path in WORLDS.items():
        Image.open(path).convert('RGB').save(OUT / f'{key}.png')
        keys.append(key)
    path = OUT / 'manifest.json'
    manifest = json.loads(path.read_text())
    manifest['images'] = sorted(set(manifest['images']) | set(keys))
    path.write_text(json.dumps(manifest, indent=1) + '\n')
    print(f'Integrated {len(keys)} images into {OUT}')


if __name__ == '__main__':
    main()
