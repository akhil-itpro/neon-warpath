# Expansion art library — 2026-11-15

44 original designs generated using built-in image_gen: 8 weapons, 6 character concepts, 18 enemies/oddities, 8 props, 4 worlds.

**Staged for Claude integration, not active gameplay content.** These are single-pose sprites, not animation sheets. No new weapon behavior, AI, operators, encounters, or stages were added.

## Browse

- [Weapons](previews/arsenal.png)
- [Characters](previews/operators.png)
- [Machines](previews/machines.png)
- [Mutants](previews/mutants.png)
- [Weird creatures](previews/oddities.png)
- [Props](previews/props.png)
- [Worlds](previews/worlds.png)

## Files and rebuild

- Original immutable images and exact prompts: `art/source/expansion/`; `manifest.json` records each source's row-major names and exact generation prompt.
- `masters/`: 40 individual transparent cutouts at source resolution, no added outline.
- `sprites/`: 40 small outlined transparent sprites; see `inventory.json` for dimensions and paths.
- `worlds/`: four 640x360 backgrounds plus four 1280x360 mirrored strips.
- `previews/`: seven labeled review boards.
- Rebuild from repository root: `python tools/process_expansion.py`. Uses the existing pipeline's matting/downscaling helpers; requires Pillow, NumPy, SciPy.
- These files intentionally stay outside `public/assets` and its loader manifest until chosen for integration.

## Inventory

| Source sheet | Kind | Asset keys in reading order |
|---|---|---|
| arsenal | weapon | arc_caster, cryo_projector, scrap_cannon, sunlance, buzzsaw_launcher, spore_sprayer, gravity_mortar, tesla_crossbow |
| operators | character | nova, mako, vesper, flint, echo, patch |
| machines | enemy | riot_bastion, coil_sniper, welder_hound, saw_crab, bell_drone, scrap_mantis |
| mutants | enemy | sporeback, acid_bellower, glass_widow, cinder_knight, deepjaw, lantern_moth |
| oddities | enemy | vendotron, crt_oracle, teacup_tyrant, umbrella_jelly, traffic_totem, disco_slug |
| props | prop | power_cell, ammo_locker, med_station, toxic_barrel, alien_egg, rift_anchor, street_terminal, scrap_barricade |
| world_neon_casino | world | bg_neon_casino |
| world_fungal_depths | world | bg_fungal_depths |
| world_abyss_station | world | bg_abyss_station |
| world_orbital_garden | world | bg_orbital_garden |

## Integration notes for Claude

1. Pick assets from this library instead of regenerating them. Copy selected small sprites into `public/assets/`, add their keys to the runtime manifest, and define content in `src/data/*`. Preserve sources.
2. Characters face right; enemies mostly face left. Vendotron, CRT Oracle, Traffic Totem and Bell Drone are front/three-quarter designs, not perfect directional side views. Treat them as such when flipping or designing attacks.
3. Character canvases are 112x80 with a target 66px figure height. They are **not** drop-in replacements for the existing 96x72 eight-pose operator contract. Generate matching run/jump/crouch/slide poses and measure muzzle offsets before making them playable. PATCH was normalized to the same height as other concepts; choose a smaller display scale if desired.
4. Enemy canvases are 128x96, target art height 68px (width cap can reduce it). These are static poses. Define explicit visual scale, collision bodies, origin and muzzle points; do not let the larger canvas silently enlarge hitboxes. Bell Drone, CRT Oracle, Umbrella Jelly and Lantern Moth are suitable hover concepts but their current canvases use the same bottom anchoring as other enemies.
5. Weapon sprites are 48x28, target height 22px. These are pickup/display art only. Each new weapon still needs data, projectiles, ammo rules and any special behavior.
6. Props are 96x80 with target height 62px and a neutral outline. Choose in-world display scales separately; they were normalized for browsing, not physical proportions.
7. Worlds are flattened backdrops, not tile sets, collision maps or separate parallax layers. Mirrored strips follow the existing background convention and repeat continuously, but their symmetry will be visible. Use the 640x360 image for a fixed arena or the strip for a scrolling prototype. Align platforms/floor independently.
8. Sources are first-pass AI pixel-style illustrations, downsampled to game resolution. No hand-polished animation or in-engine validation is claimed.

## Suggested combinations (ideas, not implemented mechanics)

- Neon Casino: Vendotron, Traffic Totem, Disco Slug; Nova/Vesper; Arc Caster and Tesla Crossbow.
- Fungal Depths: Sporeback, Acid Bellower, Glass Widow; Spore Sprayer; alien eggs and toxic barrels.
- Abyss Station: Deepjaw, Umbrella Jelly, Bell Drone; Mako; Cryo Projector.
- Orbital Garden: Coil Sniper, Scrap Mantis, Lantern Moth, CRT Oracle; Echo; Sunlance and Gravity Mortar.
- Teacup Tyrant can be a rare comic mini-boss; Patch can be a mechanic NPC or future operator.

## Verification

All ten source images and seven processed boards were visually inspected; count and extraction succeeded for all 44 designs. `npm.cmd run check` passes. Per the owner's request, no full smoke suite or gameplay integration was performed for this art-only batch.
