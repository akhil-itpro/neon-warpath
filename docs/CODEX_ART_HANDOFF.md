# CODEX ART + ANIMATION HANDOFF

Rewritten 2026-11-16 (Session 19). Read `CLAUDE.md` and the top entry of `docs/HANDOFF.md` first.

The game is complete in code: 12 stages, 12 bosses, 5 operators, story, saves, options, difficulty levels.
What still makes it look unfinished is **animation** and **how well the characters stand out**. Everything
below already has a stand-in, so nothing is blocked. Work top to bottom; each numbered job is one commit.

Jobs finished earlier (do not redo): three world backdrops (`bg_tidal`, `bg_prism`, `bg_spire`), HALCYON's
eight poses, the cage / pylon / slot machine props, twelve painted portraits, ROOK's eight-part rig.

## Art review before the Session 20 finishing pass

| Part | State | Verdict |
|---|---|---|
| Backdrops (12) | Painted, detailed, consistent | Good. Keep. |
| Portraits (12) | Painted, one style | Good. Keep. |
| ROOK | Eight-part puppet, animated in code | Moves well, but he is small and charcoal on dark streets. Needs brighter colours (job 1). |
| VIPER, TITAN, SERRIK, QUILL | Eight still poses each, four-frame run | Stiff next to ROOK (job 2). |
| 17 enemies + turret, drone, jet | ONE still picture each; they rock or hover | The biggest visible weakness (job 3). |
| 7 older bosses | ONE still picture each | Second biggest (job 4). |
| Floors and girders | Drawn in code, plain | Fine, could be richer (job 6). |
| Depth | One flat backdrop layer per stage | Parallax would add a lot (job 5). |

## Rules for every image (unchanged, they work)

1. Keep the raw generated image in `art/source/<batch>/` and never edit it. Save the exact prompt next to it as `<name>_prompt.txt`.
2. Write a small rebuild script like `tools/process_campaign_finish.py` (copy it): cut, scale to game pixels, harden alpha, reduce colours, bake the outline, write `public/assets/<key>.png`, and add `<key>` to `images` in `public/assets/manifest.json` without touching other entries.
3. Outline: enemies, bosses and props get a near-black 1 px outline `#0b0d14`. Operators get the muted cool rim (83,125,145). No red outlines.
4. Facing: enemies and bosses face **LEFT**. Operators face **RIGHT**.
5. Feet on the bottom edge of the canvas for ground units. Flyers centred.
6. **Generate every frame of one animation in ONE image.** Frames generated separately never match (Session 11 audit). When a still already exists, give it to the image tool as the reference and ask for the same character.
7. In the script, pin the feet baseline and the hip x across frames, and use ONE scale for the whole sheet.
8. Verify: `npm.cmd run check`, the named smoke scenario, then **open** `tools/shots/<scenario>-*.png`.

Style line to end every sprite prompt with:

> Detailed 16-bit pixel art, strict side view, 2D action game sprite, hard pixel edges, no anti-aliasing blur, strong cool rim light on the top and back edges, saturated readable colours that stand out against a dark night background, near-black outline, flat solid magenta #FF00FF background, no glow, no cast shadow, no text, no grid lines, generous empty space between poses, nothing touching or overlapping.

## Job 1. Make ROOK readable (integrated)

ROOK's parts are charcoal navy on dark streets, so the player loses sight of their own character. The code
now puts a soft light behind him, but the sprite itself should carry more colour. Regenerate the eight-part
atlas with the **same layout and proportions**, brighter.

- Source of truth for layout: `art/source/rigs/README.md` and `tools/process_operator_rigs.py`.
- Output keys (unchanged): `rook_rig_head`, `_torso`, `_arm`, `_support`, `_thigh`, `_shin`, `_far_thigh`, `_far_shin`.
- Keep every part the same size and pivot so `src/data/rigs.ts` needs no change. If a part's size changes, re-measure its pivot.

Prompt: use the ROOK prompt in `art/source/rigs/README.md` and replace the colour sentence with:

> mid-grey steel-blue tactical armor that reads clearly against a dark background, BRIGHT teal glowing shoulder stripe, teal visor band, teal knee and boot trims, light skin tones on the face and forearms, pale steel pistol with a bright slide. Value range from near-black shadows to near-white highlights; the character must be the brightest thing in a dark city street.

Check: `npm.cmd run smoke -- rook-rig` and `rules-hints`. ROOK must be clearly visible at a glance in `tools/shots/rules-hints-0.png`.

## Job 2. Eight-part puppets for VIPER, TITAN, SERRIK, QUILL (integrated)

Same method as ROOK, one atlas per operator, 4 columns x 2 rows, 1536x1024, transparent or magenta background.
Cells in order: head, torso (no head, arms or legs), aiming arm with gun (pointing right, horizontal), far
support arm, front thigh, front shin with boot, far thigh (darker), far shin with boot (darker).

The operator registry points to `OPERATOR_RIGS` in `src/data/rigs.ts`, which defines the joint layout and each weapon's barrel point. Rebuild with `python -B tools/process_operator_rigs.py`. The Title screen and gameplay share the same sprites.

Prompt template (fill the brackets):

> Create a production sprite parts atlas for an ORIGINAL 2D side scrolling pixel art action game, character [NAME]: [DESCRIPTION]. Strict SIDE VIEW FACING RIGHT. This is NOT an animation sheet: eight SEPARATE DISCONNECTED puppet pieces, one in each cell of a perfectly regular 4 columns x 2 rows atlas on a 1536x1024 canvas. Every cell contains EXACTLY ONE isolated piece centred with huge clear margins. No assembled full body, no labels. ORDER: top row cell 1 HEAD with neck, upright facing right; cell 2 TORSO with chest, waist and belt, NO HEAD NO ARMS NO LEGS; cell 3 AIMING ARM AND WEAPON, one connected piece from rounded shoulder on the left through a nearly horizontal forearm to the weapon pointing RIGHT, barrel horizontal; cell 4 FAR SUPPORT ARM, bent, horizontal, pointing right, NO GUN. Bottom row cell 1 FRONT THIGH from rounded hip at top to rounded knee at bottom, hanging straight down; cell 2 FRONT SHIN WITH BOOT, knee at top, toe pointing right; cell 3 FAR THIGH same size, darker; cell 4 FAR SHIN WITH BOOT same size, darker. All pieces belong to the SAME character at the SAME scale, as if assembled into a 320px tall figure: head about 70px, torso 130px, thighs 85px, shins with boots 90px, gun arm 170px long. Opaque pieces with complete rounded overlapping ends so rotation never opens holes. No gore. [STYLE LINE]

| Operator | [DESCRIPTION] |
|---|---|
| VIPER | lean female infiltrator, short asymmetric magenta-streaked black hair, fitted dark violet stealth suit with BRIGHT magenta light strips on the arms and thighs, light grey chest rig, twin-barrel machine pistol. Accent colour magenta. |
| TITAN | huge heavy trooper, shaved head, thick orange-and-gunmetal powered armor with BRIGHT amber chest light and shoulder plates, heavy hand cannon held one-handed. Accent colour amber. Parts about 20% wider than a normal human, same heights. |
| SERRIK | Varkesh reptilian soldier (original species): green scaled skin, short snout, head crest of blunt spines, digitigrade look kept simple (thigh + shin still work as two straight pieces), scavenged bronze armor plates, BRIGHT green cloth sash, long rifle. Accent colour green. |
| QUILL | Corvane crow-like scout (original species): black-blue feathers, pale curved beak, bright sky-blue goggles, light padded flight vest with BRIGHT sky-blue straps, slim legs with bird feet shaped like boots, compact carbine. Accent colour sky blue. |

Check: `npm.cmd run smoke -- art-viper`, `art-titan`, `title`, `kit-`. Look at the run in motion (add a
preview GIF like `tools/preview_rook_rig.py`).

## Job 3. Give every one-picture enemy a walk or fly cycle and an attack pose (integrated)

The code needs **no change** for this. For any enemy:

- `<art>_0.png … <art>_3.png` (four frames) are used as a looping walk / fly cycle the moment they are in the manifest (the lone `<art>.png` is then ignored).
- `<art>_atk.png` (optional, one frame) is shown automatically while the enemy winds up and fires.

Keep the **same canvas size and the same body size as the existing still** (table), so hitboxes still fit.
Feed the existing `public/assets/<art>.png` to the image tool as the reference.

Prompt template:

> Using the attached sprite as the exact character reference, create a five-frame animation sheet of the SAME creature, same proportions, same colours, same size in every frame, in ONE row of five equal cells. Frames 1 to 4: a [walk / hover] cycle ([CYCLE NOTES]). Frame 5: ATTACK pose ([ATTACK NOTES]). Facing LEFT. Feet on the same baseline in every frame; the body centre stays in the same place in every cell. [STYLE LINE]

| `<art>` key | Canvas (w x h) | Cycle notes | Attack notes |
|---|---|---|---|
| `riot_bastion` | 68 x 66 | heavy slow shield walk, shield held forward | braces, gun pokes over the shield, muzzle bright |
| `coil_sniper` | 69 x 64 | careful crouched walk, long rifle level | kneels, rifle coil glowing cyan |
| `welder_hound` | 71 x 44 | four-legged gallop: contact, gather, push, stretch | jaws open, welding torch lit |
| `saw_crab` | 63 x 48 | six-leg scuttle, saw arms idle | both saws raised and spinning |
| `bell_drone` | 30 x 44 | hover: bell swings left, centre, right, centre | bell flared, ring of light at the rim |
| `scrap_mantis` | 71 x 60 | fast stalking walk, blades folded | blades spread wide, lunging forward |
| `sporeback` | 63 x 64 | hunched waddle, spore sacs wobble | rears back, sacs swollen and glowing |
| `acid_bellower` | 61 x 58 | slow stomp, throat sac deflated | throat sac inflated, mouth wide open |
| `glass_widow` (spiderling) | 60 x 44 | eight-leg skitter, alternate leg sets | front legs raised, fangs out |
| `cinder_knight` | 67 x 70 | heavy armored march, sword low | sword raised overhead, embers flare |
| `deepjaw` | 66 x 64 | lurching run, arms swinging | jaw unhinged wide, leaning in |
| `lantern_moth` | 55 x 46 | wing flap: up, mid, down, mid | lantern abdomen blazing, wings spread |
| `umbrella_jelly` | 44 x 50 | bell pulse: open, half, closed, half | tentacles spread, core bright |
| `vendotron` | 64 x 66 | waddling walk on short legs | front hatch open, can loaded in the launcher |
| `traffic_totem` | 58 x 66 | stiff hop-walk | all three lamps lit, leaning forward |
| `disco_slug` | 67 x 48 | slug ripple: stretch, bunch, stretch, bunch | mirror-ball back flaring, head raised |
| `drone` | 68 x 36 | hover: rotor blur in four positions, slight tilt | gun barrel extended, red eye bright |
| `turret` | 68 x 64 | (static) idle scan: barrel sweeps four small angles | barrel recoiling, muzzle flash vents open |
| `jet` | 108 x 58 | flight: afterburner flicker in four lengths | bomb bay open |

Check: `npm.cmd run smoke -- art-enemies` plus the stage that uses the enemy (`casino`, `x-engine`, `x-tidal`, `gim-dark`…). Do three or four enemies per commit.

## Job 4. Four state pictures for the seven older bosses (integrated)

The four newest bosses already switch between `<art>_idle`, `<art>_windup`, `<art>_attack`, `<art>_exposed`
(`Enemy.stateArt`). Do the same for the older seven. Then add `states: true` to the boss in
`src/data/enemies.ts` (this also makes "exposed" take 1.4x damage and "attack" 0.75x, so re-check the fight
with `npm.cmd run balance -- <stage id>`).

Prompt template:

> Using the attached boss sprite as the exact reference, create a four-state sheet of the SAME machine/creature at the same size, in ONE row of four equal cells, facing LEFT: 1 IDLE (neutral, menacing), 2 WINDUP (gathering power, warning lights glowing, body pulled back), 3 ATTACK (weapons firing or body lunging forward), 4 EXPOSED (stunned, armor plates open, glowing weak point clearly visible, sparks). The body centre and the ground line stay in the same place in every cell. [STYLE LINE]

| `<art>` key | Boss | Canvas | Weak point for EXPOSED |
|---|---|---|---|
| `vulture` | VULTURE GUNSHIP (stage 1) | 170 x 56 | open engine cowling, orange core |
| `boss_tyrant` | TEACUP TYRANT (stage 2) | 147 x 118 | cracked cup, pink reactor inside |
| `warden` | FURNACE WARDEN (stage 4) | 85 x 64 (drawn at 2.3x) | open furnace door, white-hot grate |
| `boss_widow` | GLASS WIDOW (stage 6) | 142 x 104 | cracked glass abdomen, blue glow |
| `boss_jelly` | DROWNED QUEEN (stage 7) | 108 x 124 | bell folded back, bright heart |
| `boss_oracle` | STATIC ORACLE (stage 9) | 109 x 116 | screen-face shattered, green core |
| `archon` | ARCHON CORE (stage 12) | 96 x 96 | shield segments apart, red eye wide |

Check: `npm.cmd run smoke -- city-boss`, `casino`, `furnace-boss`, `gim-dark`, `x-`, `cathedral-boss`, `story-final`.

## Job 5. Parallax layers (integrated)

The code already supports this, no change needed. For any stage id, add either or both of:

- `bg_<id>_far.png`  — 1280 x 360, **transparent** PNG, distant silhouettes (skyline, far towers). Scrolls at 0.42 of the camera.
- `bg_<id>_near.png` — 1280 x 360, **transparent** PNG, closer structures in the lower two thirds only (pipes, railings, gantries, rubble). Scrolls at 0.7.

Both must tile seamlessly left to right, stay darker than the characters, and leave the top third mostly
empty so the painted sky (`bg_<id>`, unchanged, scrolls at 0.22) shows through. The game tints and shades
them like the main backdrop.

Prompt template:

> A seamless horizontally tiling 2:0.56 wide parallax layer for a 2D pixel art action game, [WORLD DESCRIPTION], ONLY the [far skyline silhouettes / near foreground structures], dark desaturated colours with a few small lights, everything else flat solid magenta #FF00FF, left and right edges match exactly, no characters, no text, detailed 16-bit pixel art.

Do `city` first (far: distant towers and antenna masts; near: rooftop water tanks, railings, neon sign frames),
look at `npm.cmd run smoke -- city`, then the other eleven. Stage ids and looks: `docs/STORY.md` section 3.

## Job 6. Painted floor and girder tiles (integrated)

No code change needed: a PNG in the manifest replaces the code-drawn tile.

- `ground_<id>.png` — 64 x 40, tiles left to right, the top 2 px are the bright walking edge.
- `plat_<id>.png` — 32 x 12, tiles left to right, a metal girder / ledge seen from the side.

Prompt: `A seamless horizontally tiling floor tile strip for a 2D pixel art action game, [WORLD] theme, side view cross-section: a bright worn top edge then dark layered structure below, 16-bit pixel art, no perspective, no text.` Cut one clean repeat from it.

## Job 7. Store and title art (integrated)

| File | Size | Content |
|---|---|---|
| `art/store/cover.png` | 630 x 500 | itch.io cover: ROOK in the foreground firing right, neon city in rain, VULTURE gunship searchlight behind, logo "NEON WARPATH" top |
| `art/store/banner.png` | 960 x 540 | wide key art: all five operators in a line-up, ARCHON's red eye in the sky |
| `art/store/icon.png` | 256 x 256 | ROOK's head in profile, teal rim light, dark background |
| 4 screenshots | 1280 x 720 | take them from `tools/shots/` after jobs 1 to 4 |

These are illustrations, not sprites: painted pixel-art style matching the backdrops, no magenta background.

## What NOT to make

No audio (all sound is synthesised in `src/systems/Audio.ts`). No new enemies, weapons, stages or operators.
Do not recreate any existing game's characters, levels or look; every design here is original and must stay so.
