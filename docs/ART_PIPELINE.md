# Art pipeline — how new art gets into the game

## For the owner (no coding needed)

**Second pack - animated Frontier assets:** start at `art/library/frontier/README.md`. It adds two eight-pose operators, four animated enemies, two four-state bosses, eight weapons, eight props and two worlds. Sources and exact prompts: `art/source/frontier/manifest.json`. Rebuild only this isolated library with `python -B tools/process_frontier.py`. Optional typed content proposals and measured operator muzzle offsets are in `src/data/frontierPack.ts`; no live registry imports them yet. See Session 7 in HANDOFF for verification and integration limits.

**New expansion library:** 44 staged designs are available at `art/library/expansion/README.md`, with previews, transparent cutouts, game-sized sprites and world backgrounds. Originals and exact prompts are in `art/source/expansion/`. Rebuild with `python tools/process_expansion.py`. This library is separate from the live game manifest; Claude should select assets and integrate them deliberately. Character/enemy concepts contain one pose each, not full animations.

1. Generate a sheet in ChatGPT using a prompt below.
2. Save the PNG into `art/source/` with the suggested file name.
3. Tell the AI agent: "new art in art/source, add it to the game". The agent adds a `MANIFEST` entry in `tools/process_assets.py`, runs `npm run assets`, and checks `art/preview/contact.png`.

## Rules that make AI sheets usable
- **Flat magenta background (#FF00FF), no glow, no shadows, no gradients.** (The first sheets had dark glowing backgrounds, which needs slow neural matting.)
- One row or a clean grid, generous empty space between poses, nothing touching or overlapping.
- Same character, outfit and proportions in every pose; full body in frame.
- Enemies face LEFT. Playable characters face RIGHT.
- Side view, 2D game sprite, same style line every time (below).

Style line to paste into every prompt:
> 16-bit style detailed pixel art, side view 2D game sprite, dark sci-fi action, hard pixel edges, strong rim lighting, limited palette, no anti-aliasing blur, flat solid magenta #FF00FF background, no glow, no shadow, no text.

## Prompts

**Playable operator (8 poses, 4 columns x 2 rows, facing right)** — file `viper_sheet.png`, `titan_sheet.png`
> [style line] Sprite sheet of ONE character in 8 poses arranged 4 columns by 2 rows: row 1 = four frames of a run cycle while aiming a pistol forward; row 2 = standing aiming, jumping with knees tucked aiming, sliding on one knee aiming, crouching aiming. Character: [VIPER: athletic woman, late 20s, sleek black-and-crimson tactical bodysuit with armored shoulders, long dark ponytail, confident, holding a compact pistol] / [TITAN: huge muscular man, heavy grey armor plating, shaved head, beard, holding a massive hand cannon].

**Enemy with walk cycle (4 frames in one row, facing left)** — files `gangster_sheet.png`, `zombie_sheet.png`, `brute_sheet.png`
> [style line] Sprite sheet, 4 frames in one row, walk cycle, facing left, of: [a cyberpunk gangster in a long coat and fedora with a neon tie firing a submachine gun] / [a rotting factory-worker zombie in torn overalls with glowing green eyes, arms reaching forward] / [a hulking armored zombie brute with chains and molten cracks in its skin].

**Flying enemy (2-4 frames in one row, facing left)** — `alien_sheet.png`, `demon_sheet.png`
> [style line] Sprite sheet, 4 frames in one row, hover cycle, facing left, of: [a biomechanical alien stalker with purple glowing sacs and bladed limbs, floating] / [a winged red demon imp with horns holding a ball of fire].

**Boss (single large sprite, facing left)** — `vulture.png`, `warden.png`, `archon.png`
> [style line] One very large, highly detailed boss sprite facing left: [description].

**Background (16:9)** — `bg_<name>.png`
> Detailed 16-bit pixel art side-scrolling game background, 16:9, [scene], no characters, no text, lower third darker and less detailed so gameplay reads clearly.

## Naming the outputs (what the game looks for)
- Operator `viper`: `viper_run0..3`, `viper_idle`, `viper_jump`, `viper_slide`, `viper_crouch` (canvas 96x72, idle 66px tall).
- Enemy `zombie`: `zombie_0`, `zombie_1`, … (animation) or just `zombie`.
- Boss: `vulture`, `warden`, `archon` (replace the stand-ins automatically).
- Heights in game pixels: humanoids ~66-70, drones ~34, bosses 75-150.

## Licensing note
Keep the original prompts and outputs in `art/source/`. Before selling the game, check the current terms of the image tool used and the disclosure rules of the store (Steam requires declaring AI-generated content).

## First-time guide: making an asset variant

You do not need to write code or pay for an API key for this workflow. This session generated and integrated the gangster directly with the built-in image tool.

The zombie base sheet is now integrated. To practice making a variant yourself, send ChatGPT this entire message:

> Create a sprite sheet for my original side-scrolling game. Exactly four full-body poses in one horizontal row: a walk cycle of the same factory-worker zombie in torn overalls, glowing green eyes, arms reaching LEFT. Every pose faces LEFT. Same outfit and proportions in every frame, alternating leg strides, generous empty space around each character. 16-bit detailed pixel art, strict side view, hard pixel edges, limited palette, no anti-aliasing blur. Flat solid magenta #FF00FF background, no glow, no shadows, no floor, no text, no grid lines. Nothing cropped or overlapping.

Save the resulting image as `zombie_sheet_v2.png` in `D:\Game1\art\source`, then tell the coding agent: "Review zombie_sheet_v2.png as an alternative and test it if it is an improvement." Keep the existing original sheet. You can also attach the image to the coding conversation. The agent handles background removal, sizing, animation, and checks. Do not just rename a JPEG to PNG; keep the downloaded original and let the agent convert it if needed.

For agents: `npm.cmd run assets -- --only gangster_sheet.png` rebuilds just that sheet and preserves other outputs. The preview in this mode shows only the rebuilt sheet. Omit `--only` for a full rebuild. On Windows PowerShell use `npm.cmd` if `npm` is blocked by execution policy.


## Integrated campaign batch - 2026-11-15

### Weapon pickups (follow-up batch)

`art/source/weapon_pickups.png` contains four original weapon silhouettes generated with built-in image_gen; the exact prompt is in `art/source/weapon_pickups_prompt.md`. Outputs are `pickup_smg`, `pickup_shotgun`, `pickup_rail`, and `pickup_rocket`, each on a centered 38x22 canvas with a cyan-white outline. Rebuild with `npm.cmd run assets -- --only weapon_pickups.png`.

Weapon data selects these via `pickupArt`. Drops retain their original 16x12 collision body, colored glow, lifetime and collection behavior; missing art falls back to the tinted crate. `npm.cmd run smoke -- art-pickups` checks all four textures, collision dimensions, and actual overlap collection/equipping. The sidearm has no pickup because it is the default infinite-ammo weapon.

The nine previously missing designs are now generated and integrated. These are usable first-pass game assets; future animation polish can improve repeated strides.

| Source in art/source | Runtime keys | Frames |
|---|---|---|
| viper_sheet.png | viper_run0..3, viper_idle/jump/slide/crouch | 8 |
| titan_sheet.png | titan_run0..3, titan_idle/jump/slide/crouch | 8 |
| zombie_sheet.png | zombie_0..3 | 4 |
| brute_sheet.png | brute_0..3 | 4 |
| alien_sheet.png | alien_0..3 | 4 |
| demon_sheet.png | demon_0..3 | 4 |
| vulture.png | vulture | 1 |
| warden.png | warden | 1 |
| archon.png | archon | 1 |

35 runtime images total in this batch, in addition to the earlier gangster frames. Exact prompts are in `art/source/campaign_prompts.md`. All nine sources used the built-in image_gen tool. Source images are immutable; processed images live in `public/assets/` and load via its manifest.

Rebuild one with `npm.cmd run assets -- --only viper_sheet.png` (substitute any source filename above). Flyers use shared centered canvases; walkers/operators use feet anchoring. All animation frames use a common source scale, so flapping wings do not change body size. The gunship has a width cap to fit the existing arena. WARDEN retains its existing 2.3 display scale, so its source is processed at 62 pixels tall.

`artScale` in `src/data/enemies.ts` preserves the previous zombie/brute/alien/demon collision scale when loading animated art. Alien and demon AI now advance their hover/wingbeat frames. `src/data/artMuzzles.ts` contains the measured barrel tips for the new operator frames; revisit those coordinates if their art is replaced. ROOK retains his existing muzzle calculation.

Run `npm.cmd run smoke -- art` to inspect both operators in idle, run, jump, crouch, slide and left-facing poses, plus all four enemy cycles. Full smoke includes all boss scenes. The batch does not add boss attack/death animation sheets or change combat balance. Suggested next art: death/boss-breakup animation, richer machine variants, props, and weapon pickup icons after gameplay priorities are handled.
