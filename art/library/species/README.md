# Species pack - 2026-11-15

**Twelve distinct fictional species**, two nonhuman operator designs and two related boss forms for NEON WARPATH. Created with built-in image_gen. These assets extend the expansion and Frontier libraries; they do not replace them or modify live gameplay.

Start with the **[visual bestiary](previews/bestiary.png)**. This pack contains **72 transparent sprite frames**: twelve four-frame enemy cycles, two eight-pose operators and two four-state bosses. There are also 72 transparent source-resolution masters, twelve PNG review boards and sixteen GIF previews.

## Species and where to involve them

Each species has its own body plan, ecology and encounter role. Hostile sprites are specific combat variants; the species need not all be enemies. Serrik and Quill provide two allied/player character options. Friendly and ambient uses below are design proposals, not implemented NPC systems.

| Species | Body plan | Suggested habitat | Combat variant | Friendly / ambient option |
|---|---|---|---|---|
| Varkesh | Reptilian sapient with crest and tail | City, casino, furnace | Two-shot skirmisher | Serrik operator; storm-route couriers |
| Corvane | Avian sapient with beak and feather mantle | City, casino, orbital | Fast fragile long-range scout | Quill operator; salvage mechanics |
| Kharrix | Six-legged chitin insectoid | Fungal, furnace | Low fast lunging hunter | Distant tunnel fauna |
| Ferrivor | Many-footed segmented mineral-plated annelid | Furnace, city | Slow durable ground-lane crawler | Scrap recyclers beyond the play area |
| Nacreth | Spiral-shell cephalopod | Abyss | Hovering slow-lob drifter | Reef life behind station windows |
| Cirrid | Gas colony inside a natural mineral cage | Orbital, cathedral | Floating aimed-shot harasser | Ambient ion colonies behind glass |
| Myrrhkin | Broad mushroom cap on four root feet | Fungal | Two-shot ground lobber | Safe-route fungal landmarks |
| Thren | Plant seedpod on woody legs | Fungal, orbital | Fragile wandering single-lob shooter | Greenhouse gardeners |
| Vitreon | Living crystalline tripod | Orbital, cathedral | Slow precision shooter | Neutral resonant sentinels |
| Lithurn | Basalt quadruped with quartz ridges | Furnace, fungal | Heavy ground melee obstacle | Distant mineral-grazer herds |
| Geliform | Gel colony with nucleus and pseudopods | Abyss, fungal | Low short-range ground lobber | Waste-cleaning colonies in tanks |
| Asterid | Floating six-armed cosmic echinoderm | Orbital, abyss, cathedral | Sparse slow radial-shot pattern | Harmless hull-filtering colonies |

These classifications are separate from the existing engine `Faction` enum. No new faction switch cases are needed merely to describe a species.

## Browse every frame

| Sheet | Contents | PNG | Animation previews |
|---|---|---|---|
| Sapients | Varkesh x4, Corvane x4 | [Frames](previews/species_sapients.png) | [Varkesh](previews/varkesh.gif), [Corvane](previews/corvane.gif) |
| Crawlers | Kharrix x4, Ferrivor x4 | [Frames](previews/species_crawlers.png) | [Kharrix](previews/kharrix.gif), [Ferrivor](previews/ferrivor.gif) |
| Floaters | Nacreth x4, Cirrid x4 | [Frames](previews/species_floaters.png) | [Nacreth](previews/nacreth.gif), [Cirrid](previews/cirrid.gif) |
| Garden life | Myrrhkin x4, Thren x4 | [Frames](previews/species_garden.png) | [Myrrhkin](previews/myrrhkin.gif), [Thren](previews/thren.gif) |
| Mineral life | Vitreon x4, Lithurn x4 | [Frames](previews/species_minerals.png) | [Vitreon](previews/vitreon.gif), [Lithurn](previews/lithurn.gif) |
| Exotic life | Geliform x4, Asterid x4 | [Frames](previews/species_exotics.png) | [Geliform](previews/geliform.gif), [Asterid](previews/asterid.gif) |
| SERRIK operator | Varkesh: run x4, idle, jump, slide, crouch | [Poses](previews/operator_serrik.png) | [Run](previews/serrik.gif) |
| QUILL operator | Corvane: run x4, idle, jump, slide, crouch | [Poses](previews/operator_quill.png) | [Run](previews/quill.gif) |
| NACRETH TIDE SOVEREIGN | Same species as Nacreth drifter; idle, warning, attack, exposed | [States](previews/boss_nacreth_sovereign.png) | [State showcase](previews/nacreth_sovereign.gif) |
| VITREON PRISM REGENT | Same species as Vitreon resonator; idle, warning, attack, exposed | [States](previews/boss_vitreon_regent.png) | [State showcase](previews/vitreon_regent.gif) |

## Files Claude can use

- [`inventory.json`](inventory.json): every frame's exact filename, species, frame index, shared scale, canvas size, visible bounds, facing and recommended origin. Image/master paths are relative to this library; source paths are relative to the repository.
- `sprites/`: 72 game-sized RGBA PNGs. Enemies/bosses have a red outline, operators a cyan outline; alpha is hard 0/255.
- `masters/`: 72 unoutlined transparent cutouts at source resolution.
- [`art/source/species/manifest.json`](../../source/species/manifest.json): all ten immutable source images, exact generation prompts, animation groups, extraction and sizing settings.
- [`src/data/speciesPack.ts`](../../../src/data/speciesPack.ts): species bestiary, **twelve typed EnemyDef proposals**, **two typed OperatorDef proposals**, measured operator muzzle offsets, suggestions for all seven existing stages, and two boss briefs. Nothing imports these proposals into live registries.
- [Operator muzzle grid](previews/operator_muzzle_grid.png): coordinates used to measure the barrel offsets. Values use the same center-X / feet-Y convention as `ART_MUZZLES`.

Rebuild only this isolated library:

```powershell
python -B tools/process_species.py
npm.cmd run check
```

The processor reuses existing pipeline functions from `process_assets.py` and `process_frontier.py`. It writes only `art/library/species`; no source art, game data or live asset manifest is overwritten. Most sheets use declared grid cells; Quill uses connected silhouettes because a slide foot crosses a nominal grid gutter.

## Integration plan

**Current priority:** Session 8 in `docs/HANDOFF.md` freezes new gameplay content while the city vertical slice is polished. This pack completes the owner's explicit species-art request and remains parked outside live gameplay. The steps below are for when that freeze is lifted; they do not supersede the city-quality work.

1. **Choose a small stage-specific subset.** Use `SPECIES_STAGE_PALETTES` as a starting proposal. Introduce one species alone before combining it with one complementary threat. Do not add all twelve species to every stage or silently increase existing wave sizes.
2. Copy chosen `sprites/*.png` into `public/assets` and register their exact keys in the live manifest. Enemy keys are `sp_<species>_0..3`, matching the existing multi-frame resolver. Add the selected `SPECIES_ENEMIES` entries to the live enemy registry and deliberately place them in stage data.
3. **Check animation advancement.** Merely loading four textures does not animate every AI path. At pack creation the generic `flyer` case does not call `walkAnim`; Cirrid/Asterid need that small engine integration to show their pulse cycles. Ground gunner/spitter/rusher and lobber behaviour already have animation calls. Do not change unrelated active scene code while another agent is editing it.
4. Ground creatures have feet-anchored canvases; Nacreth, Cirrid and Asterid are centered flyers. Sizes vary by body plan; read the inventory rather than imposing humanoid dimensions on a worm. Preserve the proposed small torso hitboxes as a starting point, then inspect alignment. Wings, tails, tentacles and caps should not automatically become damaging bodies.
5. For operators, copy all eight frames, add the selected `SPECIES_OPERATORS` entry, and merge matching `SPECIES_MUZZLES` into `ART_MUZZLES`. They use the existing 96x72 canvas and `op_serrik` / `op_quill` texture prefixes. Check every pose and both facing directions. No extra aiming directions or unique species passive is provided.
6. Boss keys end in `_idle`, `_windup`, `_attack`, `_exposed`. Treat these as **semantic states**, not an idle animation. The Tide Sovereign is 208x160 centered; Prism Regent is 176x192 feet anchored. The state art is present, but the siphon/refraction attacks, core hitboxes, warning geometry and recovery timing need code. Keep current stage bosses until an optional encounter or replacement is deliberately implemented.
7. To use a species as friendly fauna or an NPC, create a noncombat actor. These `EnemyDef` templates remain hostile even if contact damage is zero; they are not neutral/NPC implementations.
8. Keep chosen content numbers in `src/data/*`. Run `npm.cmd run check`, add focused smoke cases for gameplay integration, run smoke and inspect its screenshots. Normal-health play is needed before calling these values balanced.

## Encounter and boss guidance

- **Ground plus air:** a Geliform can push the player to move while one Nacreth arc provides a second readable decision. Keep the floor open and landing markers visible.
- **Fast plus deliberate:** pair one Kharrix with one Thren. The plant's slow marked shot creates a timing choice while the crawler pressures position. Introduce them separately first.
- **Precision plus drift:** pair a Vitreon with a Cirrid in an open orbital arena. Avoid overlapping warnings that leave no escape side.
- **Sparse rings:** start with one Asterid and its slow six-ray pattern. Multiple synchronized rings can close the dodge gaps; restrict them in narrow arenas.
- **Tide Sovereign:** mantle seams glow before separated siphon arcs. Aim locks before firing. A clear cyan mantle organ follows during a quiet recovery; no attacks or summons in that window.
- **Prism Regent:** mark either one high beam lane or one low beam lane. Crouch counters high, jump counters low. Never cover both lanes together. The cyan chest facet then marks a quiet punish window.

Existing AI prototypes do not implement every species-specific visual cue. In particular, rusher lunge timing and lobber warning duration are fixed in behaviour code; their data files do not override those times. New signature timings in the boss briefs are proposals, not active mechanics.

## Verification and limits

All ten source sheets and all twelve PNG boards were visually inspected. Extraction yielded all 72 expected frames; inventories, source paths, dimensions, transparent borders, binary alpha, shared animation scales, origins, README links and sixteen four-frame GIFs were checked. `npm.cmd run check` passes.

This is first-pass generated animation. Similar strides, subtle body-size changes and silhouette-centered hover bob remain; review the GIFs and add per-frame body pivots if needed. Nacreth boss shell position shifts between states, so its eye/core anchors need explicit per-state measurement. Operator barrel offsets are measured from images but unverified in engine.

No active enemies, operators, NPCs, bosses or encounters were registered. No normal-health balance, gameplay smoke test, species passive, immunity, splitting mechanic, audio, portrait set or new world background is claimed. The pack is staged for Claude while the concurrent game-development work continues.
