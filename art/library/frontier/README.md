# Frontier asset pack - 2026-11-15

**Claude: start here.** This second pack adds 26 original designs, with 56 transparent sprite frames, two backgrounds and two mirrored scrolling strips. It supplements `art/library/expansion`; it does not replace that pack or register anything in the live game. Created using the built-in image_gen tool.

All ten original generated sheets and their exact prompts are preserved in [`art/source/frontier`](../../source/frontier/manifest.json). No API key or regeneration is needed to use these files.

## Browse the art

| Category | Designs and frames | Preview |
|---|---|---|
| Operator | KESTREL: run x4, idle, jump, slide, crouch | [Sheet](previews/kestrel_sheet.png), [run loop](previews/kestrel.gif) |
| Operator | MOTH: run x4, idle, jump, slide, crouch | [Sheet](previews/moth_sheet.png), [run loop](previews/moth.gif) |
| Rail enemies | Rail Marauder walk x4; Storm Kite hover x4 | [Sheet](previews/rail_enemies.png), [marauder](previews/rail_marauder.gif), [kite](previews/storm_kite.gif) |
| Underworld enemies | Bellows Acolyte walk x4; Cinder Skate hover x4 | [Sheet](previews/kiln_enemies.png), [acolyte](previews/bellows_acolyte.gif), [skate](previews/cinder_skate.gif) |
| Rail boss | Switchyard Colossus: idle, windup, attack, exposed | [States](previews/switchyard_colossus_sheet.png), [state showcase](previews/switchyard_colossus.gif) |
| Underworld boss | Kiln Matriarch: idle, windup, attack, exposed | [States](previews/kiln_matriarch_sheet.png), [state showcase](previews/kiln_matriarch.gif) |
| Weapons | Prismbreak, Pinball, Needle Hive, Rivet King, Tidebinder, Echo Fork, Ember Wheel, Star Anvil | [Arsenal](previews/frontier_arsenal.png) |
| Props | Rail Signal, Storm Battery, Pressure Vent, Cargo Drone Wreck, Furnace Shrine, Ember Egg, Coolant Pump, Salvage Cache | [Props](previews/frontier_props.png) |
| Worlds | Stormbreak Railyard; The Underworld Engine | [Worlds](previews/worlds.png) |

## Prepared files

- [`inventory.json`](inventory.json): exact file paths, dimensions, frame groups, facing, visible bounds, scale and recommended origins. Paths in this inventory are relative to this directory; source paths are relative to the repository.
- `masters/`: 56 transparent source-resolution cutouts, without added outlines.
- `sprites/`: 56 hard-alpha game-sized PNGs with cyan operator/weapon, red enemy/boss, or neutral prop outlines.
- `worlds/`: two 640x360 flattened backgrounds and two 1280x360 mirrored strips.
- `previews/`: ten labeled PNG review boards (including a [muzzle coordinate grid](previews/operator_muzzle_grid.png)) and eight animation/state GIFs. GIFs are previews, not runtime assets.
- [`src/data/frontierPack.ts`](../../../src/data/frontierPack.ts): optional typed operator, weapon and enemy proposals, measured operator muzzle offsets, boss attack briefs, world encounter order and prop roles. No live file imports it. Its exports are not automatically added to drop pools, enemy waves or operator selection.

Rebuild everything in this isolated pack from the repository root:

```powershell
python -B tools/process_frontier.py
npm.cmd run check
```

The processor uses the existing pipeline's resize/outline helpers. Grid extraction preserves declared animation order; the static prop sheet uses silhouette extraction because a few props cross nominal cell boundaries. It never writes `public/assets`, its manifest, or any game data file.

## Design intent

These are proposals for satisfying mastery and replay variety, not a claim of tested retention or balance. Give each enemy one readable threat, teach it alone, then combine two threats with an escape route. Keep checkpoint retries quick and rewards authored. No grinding, paid randomness or compulsory daily tasks.

**Stormbreak Railyard:** cobalt rain, amber electricity and teal freight machines. Introduce a telegraphed ground burst, then a hovering aimed shot, then combine them. The locomotive-crab boss lights its coil before a fixed attack lane and opens a cyan reactor afterward. Its charge must stop short of the escape area; never demand sliding through a boss wider than the slide can cover.

**The Underworld Engine:** bronze pistons and obsidian wings around a distant furnace. Introduce slow lobs and separated landing markers. The mechanical moth queen raises its wings before attacking and exposes a cyan heart during a quiet recovery window. Never fill both crouch and jump lanes at once.

**Weapons:** narrow beam fans, rapid suppression, flechettes, piercing rivets, harpoons, short sonic bursts, close-range heat and arcing explosives create different positioning decisions. Initial versions in the data file use current mechanics. Pinball ricochet and Tidebinder anchoring are explicitly separate future features requiring code; their prototype definitions do not implement them.

**Operators:** Kestrel offers a higher jump with less armor; Moth trades some pace for stronger shots and durability. Both have standard eight-pose sheets. Moth's id is `moth_operator`, avoiding confusion with the existing Lantern Moth enemy id `moth`. No new operator passive has been implemented.

## Integration order for Claude

1. Pick one operator or one enemy first. Copy only its chosen PNGs into `public/assets` and add the keys to the existing loader manifest. Keep immutable source sheets in place; do not add them to the live `process_assets.py` manifest unless you deliberately port their extraction settings.
2. Operators already use the current **96x72** canvas and `_run0..3`, `_idle`, `_jump`, `_slide`, `_crouch` names. Register the selected typed entry in `operators.ts`; merge its measured `FRONTIER_MUZZLES` values into `ART_MUZZLES` and confirm the gun barrel in both directions. Do not change movement constants to fit artwork.
3. Enemy ground frames use **96x76**, feet anchored; flyers use **80x64**, centered. Their `_0..3` keys match the existing resolver. Start with the candidate entries in the data file, then check visible torso/body alignment and muzzle positions. Enemy AI must actually advance walk/hover frames; do not assume loading four textures animates every behaviour.
4. Switchyard Colossus uses **224x128** frames, feet anchored. Kiln Matriarch uses **192x160**, centered. Their four state names are semantic, **not** a four-frame idle loop. Add explicit state-to-texture selection if implementing the proposed attacks; otherwise use only `_idle` as a static prototype. Damage timing, warning geometry and weak-point collisions still require implementation.
5. Weapon sprites are **48x28**, centered. Match the candidate `pickupArt` to the exact PNG basename. Preserve small pickup collision bodies rather than adopting the image size. Do not advertise ricochet or anchoring until that mechanic exists and is verified.
6. Props use **96x80** canvases and deliberately retain a common browse scale, not realistic physical proportions. Choose display scale and collision separately. Decorative orange windows and cyan lights do not imply a hazard, heal or interaction.
7. World PNGs are flattened scenery, not platform layouts, collision maps, modular tile sets or separate parallax layers. The mirrored strips repeat by reflection and have visible symmetry. Build level geometry independently; reserve the dark lower portion for action.
8. Keep all chosen content numbers in `src/data/*`. Run `npm.cmd run check`; after gameplay integration, add focused smoke coverage, run it and inspect `tools/shots/*.png` as required by the repo. Verify normal-health play before calling the proposals balanced.

## Verification and remaining polish

- All ten source sheets and all ten PNG review boards were visually inspected. Extraction produced all 56 sprite frames and two backgrounds; output canvases, binary alpha, empty borders and inventory paths were checked.
- Animation groups share one scale. Feet remain on a common baseline. Flying sprites and the moth boss are silhouette-centered; changing wing bounds can move the body between frames. Review the GIFs and add per-frame body pivots if the bob is distracting. Run silhouettes also vary slightly in height. These are first-pass generated animations, not hand-polished final loops.
- Barrel offsets were measured against the processed operator coordinate grid; in-engine shot alignment remains unverified.
- `npm.cmd run check` passes. This pack changes no active gameplay, so no campaign smoke run or combat/boss balancing is claimed. Claude's concurrent changes remain separate.
- No death cycles, directional aiming sets, audio, projectiles, terrain tiles or implemented stages are included. Boss attack pictures are present; the attacks themselves are proposals.
