# Art pipeline — how new art gets into the game

## For the owner (no coding needed)
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
