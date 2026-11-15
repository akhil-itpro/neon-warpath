# HANDOFF — current state and next steps

Update this file at the end of every working session (any AI agent). Newest session first.

## Session 6 - 2026-11-15 (Claude Code, expansion library integrated into the game)

### Completed
- The campaign is now **7 stages**: city, **casino**, furnace, **fungal**, **abyss**, **orbital**, cathedral (ARCHON stays the finale). Stage data in `src/data/stages.ts`; new optional fields `hazard` (lava/volt/acid) and `decor` (scenery sprites), new weather kinds spores/bubbles/petals.
- **38 of the 44 library designs are live.** `python tools/integrate_expansion.py` re-cuts them from `art/library/expansion/masters/` at in-game sizes (trimmed canvases, bosses cut large natively) into `public/assets/` and registers them in the manifest. Edit the `JOBS` table there to resize or add.
- **16 new enemies** (`src/data/enemies.ts`, "EXPANSION ROSTER"): bastion (front shield, turns slowly - slide behind it), sniper (long warning, fast shot), hound, sawcrab, bell (ring of shots), mantis, sporeback/bellower/vendotron/slug (new `spitter` AI: lobs at marked floor spots), spiderling, knight, deepjaw, moth, jelly, totem (red/amber/green burst). Single-pose art: ground units rock side to side while walking, flyers hover.
- **Props as enemies-array entries:** `locker` (always a weapon), `medstation` (always health), `barrel` (explodes, hurts both sides, chains), `egg`/`seaegg` (hatch a spiderling/deepjaw if you get close; shoot first). Scenery-only: street_terminal, scrap_barricade, power_cell, rift_anchor.
- **4 new bosses, 2 new boss AIs** in `src/entities/Enemy.ts`: `boss_stomper` (TEACUP TYRANT, GLASS WIDOW: charge you must slide through, marked leap slam with floor shockwaves, lobs or shard fans, summons below 50%) and `boss_seer` (DROWNED QUEEN, STATIC ORACLE: sweeping rain of marked columns, aimed bursts, blink + rings, summons below 50%; drifts low between attacks as the damage window).
- **8 new weapons** (`src/data/weapons.ts`), all in the drop pool with their pickup art: ARC CASTER (chain lightning), CRYO JET (freezes), SCRAPSTORM (11 pellets), SUNLANCE (rapid pierce), BUZZKILL (slow saw that re-hits), SPORE SPRAYER (arcing explosive), SINGULARITY (pulls enemies in, then bursts), TESLA BOLT (pierce + chain). New optional weapon fields: life, scale, gravity, chain, chill, pull, rehit.
- PATCH the raccoon mechanic hosts the perk screen. `?stage=` now also accepts a stage id (`?stage=fungal&boss=1&god=1`); smoke tests use ids.

### Verified
- `npm.cmd run check` and `npm.cmd run build` pass. Full smoke: **30 scenarios pass** with no browser errors, including new `x-<stage>`, `x-<stage>-boss` (boss takes real fire, is pushed into rage phase), `x-roster` (every new enemy/prop uses its own art at scale 1), `x-weapons` (each new weapon damages targets) and boss-death transitions for all 7 stages. Reviewed the new-content screenshots.

### Not verified / limits
- **Balance is a first guess.** No normal-health playthrough of any stage. New boss HP (1700-2200) was set after seeing held SMG fire kill them in under 30s in god mode. Stages 2-6 difficulty ordering and perk scaling over 6 picks are untested.
- Each boss AI is shared by two bosses; they differ by stats, colours, helpers and (stompers) lob vs fan volley. Good candidates for a unique third attack each.
- Not used yet: the 5 extra operators (NOVA, MAKO, VESPER, FLINT, ECHO) - one pose each, they need full 8-pose sheets + muzzle offsets before they can be playable - and CRT Oracle/Teacup/Jelly small sprites (bosses only).
- New weapons reuse existing SFX. Foreground pillars still hide action at times.
- **Another session was adding `art/source/frontier/`, `art/library/frontier/`, `tools/process_frontier.py`, `src/data/frontierPack.ts` while this ran.** Left untouched and uncommitted by this session.

### Next
1. Play stages at normal health (`?stage=casino` etc. without `god`) and tune enemy HP/fire rates and encounter sizes.
2. Give each boss one signature attack; add dedicated SFX for new weapons.
3. Animation sheets for chosen new operators, then add them to `src/data/operators.ts`.

## Session 5 - 2026-11-15 (Codex, expansion asset library for Claude)

### Owner direction — read this first
- Owner explicitly requested less testing and more asset creation: lots of weapons, characters, worlds, enemies and weird characters, staged so Claude can pick them up. This session prioritizes that request over earlier gameplay-first priority notes. Avoid repeating the full smoke suite just for this art-only library.

### Completed
- Generated **44 original designs across 10 source images** with built-in image_gen: 8 weapons, 6 character concepts, 6 machines, 6 mutants, 6 weird enemies, 8 props and 4 worlds.
- Start at **`art/library/expansion/README.md`** for the complete inventory, seven labeled preview boards, integration caveats and suggested world/character combinations. Machine-readable paths and dimensions: `art/library/expansion/inventory.json`.
- Original sources and exact prompts: `art/source/expansion/` and its `manifest.json`. Do not regenerate or overwrite these unnecessarily.
- Prepared 40 separate transparent source-resolution cutouts in `masters/`, 40 outlined game-sized PNGs in `sprites/`, and 4 world backgrounds (640x360) plus mirrored strips (1280x360) in `worlds/`, all under `art/library/expansion/`.
- Added reproducible extraction/catalog script: `python tools/process_expansion.py`. It does not modify live assets or their loader manifest.
- Highlights: arc/frost/gravity/spore weapons; Nova, Mako, Vesper, Flint, Echo and Patch; riot robot, welding hound, crystal spider, shark diver; vending-machine walker, CRT oracle, teacup tyrant, umbrella jellyfish, traffic-light robot, disco slug. Worlds: Neon Casino, Fungal Depths, Abyss Station, Orbital Garden.

### Verified / limits
- Visually inspected all source images and all seven processed boards. Extraction produced all 44 designs. `npm.cmd run check` passes. No smoke suite was run for this batch, per owner direction.
- **These are staged art assets, not implemented game content.** Characters/enemies each have ONE pose. They are not animation-ready replacements for the existing operator sheets. No weapon mechanics, enemy behavior or new stages were added.
- Character canvases 112x80; enemies 128x96; weapons 48x28; props 96x80. Explicit collision sizes, sprite origins, scale and muzzle points are needed during integration. Some weird enemies are front/three-quarter views. Backgrounds are flattened and mirrored, not layered parallax or level geometry.

### Next for Claude
- Browse the README/boards, choose assets, then copy selected runtime PNGs into `public/assets/` and add data/manifest entries. Keep content definitions in `src/data/*`.
- Generate matching animation poses only for chosen playable characters/enemies; use original sources as visual references. Decide display sizes for small characters and flying creatures.
- If the owner continues requesting art, expand this library without spending the session on campaign tests. When actually changing gameplay, use focused verification appropriate to the change.

## Session 4 - 2026-11-15 (Codex, weapon pickup assets)

### Completed
- Continued asset work at the owner's request. Created four original weapon pickup sprites with built-in image_gen: RIPPER, BREACHER, RAILSPIKE and HELLFIRE. Source and exact prompt: `art/source/weapon_pickups.png` and `weapon_pickups_prompt.md`.
- Added targeted pipeline support; output keys are `pickup_smg`, `pickup_shotgun`, `pickup_rail`, `pickup_rocket` (38x22 centered canvases). Rebuild: `npm.cmd run assets -- --only weapon_pickups.png`.
- Connected pickup art through `src/data/weapons.ts`. Weapon drops keep their 16x12 collision body, colored glow, existing random selection, lifetime and ammo behavior. Missing art retains the tinted crate fallback. The sidearm is not a drop and needs no pickup sprite.
- Added `art-pickups` smoke coverage for all four loaded textures, preserved hitboxes, and real physics-overlap collection that verifies the matching weapon/ammo. Reviewed the processed contact sheet and both targeted screenshots.

### Verification and next work
- Typecheck, targeted pickup smoke and production build pass. Full 16-scenario campaign smoke passes without browser errors. Reviewed all 42 screenshots via contact sheets, plus the new pickup views at full size.
- This is a visual asset addition; combat balance, normal-health campaign completion, controller feel and audio listening remain unverified.
- Next asset candidates: dedicated machine variants, environmental props, death/boss attack animations. Normal-health combat/readability playtesting remains the overall project priority. Foreground pillars still obscure objects in places.

## Previous resume notes - handback to Claude Code (2026-11-15)

- Read `CLAUDE.md`, then **Session 3** below. Earlier missing-art notes are historical: VIPER, TITAN, zombie, brute, alien, demon and all three bosses now have dedicated art, in addition to the gangster.
- Latest asset/engine commit: `68703e1`. Previous work: `98aa234` (gangster), `d257dbe` (HUD and transition coverage), `9b00201` (earlier handback).
- Do not regenerate this batch unnecessarily. Sources and exact prompts are in `art/source/`; runtime outputs are in `public/assets/`; visual catalog is `art/campaign-roster.png`.
- Next priority remains normal-health combat/encounter/boss playtesting. Forced boss-death tests verify transitions, not campaign difficulty or beatability.
- Windows commands: use `npm.cmd run ...` because PowerShell blocks npm.ps1. Run `npm.cmd run smoke -- art` for the new art checks; full `npm.cmd run smoke` also covers the campaign. Inspect screenshots in `tools/shots/`.
- Owner wants agents to create and integrate assets, not merely provide prompts. If your session lacks image generation, explain that limitation and use the prompts in ART_PIPELINE. Do not assume Codex's image tool exists in Claude.

## Session 3 - 2026-11-15 (Codex, campaign art batch)

### Completed
- Generated nine original source images with built-in image_gen: two eight-pose operator sheets, four four-frame enemy sheets, and three single-sprite bosses. All original PNGs and exact prompts retained in `art/source/campaign_prompts.md` and neighboring files.
- Processed/integrated **35 runtime PNGs**: VIPER 8, TITAN 8, zombie 4, brute 4, alien 4, demon 4, VULTURE 1, WARDEN 1, ARCHON 1. No new stages or enemies were invented; this replaces the planned stand-ins.
- Added manifest specs, centered flyer canvases, and a gunship width cap in the asset processor. Animated frames keep one common scale rather than resizing each pose independently.
- Added optional `artScale` in enemy data to preserve the existing world collision sizes of zombie (.95), brute (1.35), alien (.95), and demon (1.2). WARDEN retains the existing static-art display scale of 2.3; its processed height is 64 including outline. ARCHON is 96x96; VULTURE is 170x56 including outline.
- Enabled frame cycling in blinker/lobber AI (alien/demon); before this those behaviors never advanced an animation.
- Added measured per-frame operator muzzle offsets in `src/data/artMuzzles.ts`, consumed by `Player.muzzle()`. VIPER/TITAN shots now originate at their new weapon barrels. If replacing their art, remeasure these values. ROOK still uses the original logic.
- Added `art-viper`, `art-titan`, and `art-enemies` smoke scenarios. Operator cases assert idle/run/jump/crouch/slide textures and facing left. Enemy case asserts each faction is using its own frames, at least two animation frames advance, and prior entity scale is retained. Test explicitly wakes preview enemies so distance-based sleeping cannot cause false animation failures.
- Added a labeled catalog `art/campaign-roster.png`, reproducible with `python tools/preview_campaign.py`. Updated GDD art status and ART_PIPELINE inventory/rebuild instructions.

### Verification
- `npm.cmd run check` and `npm.cmd run build` pass.
- All three targeted art scenarios pass. Reviewed all nine processed contact sheets, the catalog, operator screenshots for every pose, and the combined enemy scene.
- Full **15-scenario** `npm.cmd run smoke` run passed with no browser errors, including the three new art scenarios, all stage/boss scenes, perk/victory transitions, death/retry and pause/resume. Reviewed all 40 screenshots from the successful suite via contact sheets and full-size boss views.

### Limits and next work
- This is usable first-pass art, not hand-polished animation. Some run-cycle contact poses are similar; operator running silhouettes are a little shorter than idle. Review animation continuity during a real play session before further polish.
- Bosses have one dedicated static sprite each; movement, rotation, damage flashes, and breakup effects remain procedural. No attack/death sprite animations were added.
- Normal-health combat, controller feel, audio listening, complete input-driven arena progression, and boss balance remain unverified. Existing boss tests hold fire and often do not defeat bosses; transition tests deliberately deal lethal damage.
- Foreground pillars still obscure some sprites. Prioritize normal playtesting/readability before creating more stages. Boss muzzle/attack port alignment can be refined when adding boss attack poses (WARDEN's existing high/low firing rows are intentionally independent of its static barrel).
- Next art after gameplay verification: operator/enemy death frames, boss attack/breakup frames, dedicated machine variants, environmental props and weapon pickup icons. All previously listed missing faction/operator base sheets are now present.

### Rebuild and review
- One source: `npm.cmd run assets -- --only viper_sheet.png` (substitute any source from the ART_PIPELINE inventory).
- Entire existing pipeline: `npm.cmd run assets` (rematting the original dark source sheets can be slow).
- Catalog: `python tools/preview_campaign.py`.
- Tests: `npm.cmd run check`, `npm.cmd run smoke -- art`, `npm.cmd run smoke`, `npm.cmd run build`.
- `art/preview/` and `tools/shots/` remain ignored by git; source PNGs, prompts, runtime art, and the catalog are committed.

## Session 2 - 2026-11-15 (Codex)

### Completed
- Read the project instructions, design, art pipeline, and roadmap; prioritised verification of the existing campaign.
- Generated an original four-frame Syndicate Gunman sheet with the built-in image tool, retained the original and exact prompt in `art/source/gangster_sheet.png` and `gangster_prompt.md`, and integrated `gangster_0..3` through the existing art resolver. Visually checked the processed contact sheet and the character facing both ways in the city.
- Added `--only <sheet>` to the asset processor so one new sheet can be rebuilt without rematting the old sheets. Existing outputs remain in the asset manifest. Added a beginner-friendly zombie prompt and Windows command guidance to `docs/ART_PIPELINE.md`.
- Added an inline empty favicon; the updated browser run no longer reports the initial missing-resource errors. Smoke diagnostics now include failing HTTP URLs.
- Capped the HUD armor bar at 180 pixels so god mode / high-health builds do not extend across the screen.
- Screenshot review caught early pause/death panels overlapping the stage introduction. Panels now clear the introduction and render above transient HUD objects. Fixed the stage intro underline by animating scale instead of changing rectangle width (which left its origin offset).
- Expanded smoke coverage with three boss-death transition scenarios and a death/retry/pause/resume scenario. Failures save screenshots and assertions fail the command.

### Verification and limits
- `npm.cmd run check` passes; production build passes.
- Full 12-scenario smoke run passed with no browser errors: title, three stages, three bosses, natural death, three forced boss-death transitions, retry/pause/resume. Inspected all 27 screenshots in `tools/shots/` via review sheets plus full-size city views.
- After the final intro/panel fixes, reran all four `flow` scenarios successfully and inspected the corrected death, pause, and stage introduction screenshots; check and build passed again.
- Transition checks verify both perk menus, one selected perk being applied, entry to the next stage, final victory, return to title, restored health and physics speed on retry, the 20% score penalty, and pause/resume.
- These tests do NOT constitute a complete combat playthrough. Boss transitions deliberately apply lethal damage via the debug scene handle. Held-right/held-fire boss scenarios generally do not defeat bosses; they are runtime/visual checks. Boss fairness, full arena progression, controller feel, audio listening, and target stage times remain unverified.
- The new gangster passing poses are similar; the art is usable, but a later animation polish pass can improve the alternating stride. Other faction/operator/boss art still uses stand-ins.
- Foreground pillars can obscure combat briefly; assess their opacity during the next human-style playtest.

### Next priorities
1. Play stage 1 and each boss without god mode; evaluate telegraphs, dodging, aim assistance, and complete encounter progression before adjusting balance.
2. Improve smoke navigation so it clears encounters and damages bosses through player input, in addition to the explicit transition tests.
3. Generate/integrate zombie, brute, VIPER, TITAN, alien, demon, and boss art, one validated sheet at a time. Owner can use the copy/paste prompt in ART_PIPELINE; no coding required.
4. Continue the stage-1 vertical slice roadmap; do not add stages before the existing combat is verified.

### Environment
- On this Windows setup, PowerShell blocks `npm.ps1`; use `npm.cmd run ...` without changing execution policy.
- Generated preview/contact sheets and smoke screenshots are intentionally ignored by git. Original art, prompts, and runtime assets are committed.

## Session 1 — 2026-11-15 (Claude Code)

### What exists
- Full project scaffold: Vite + TypeScript + Phaser 3.90, git repo, docs.
- Asset pipeline (`tools/process_assets.py`): the owner's 5 ChatGPT images are processed into 14 clean sprites + 3 seamless backgrounds in `public/assets/`.
- Game code for a complete 3-stage campaign:
  - Player: run, variable jump (coyote time + buffer), crouch, invulnerable slide, drop-through platforms, aim-assisted shooting, Overdrive super.
  - 5 weapons (sidearm, SMG, shotgun, railgun, rockets) from crates/elite drops.
  - 12 enemy types across 5 factions (machines, gangsters, zombies, aliens, demons) with 8 AI behaviours.
  - 3 bosses with multi-phase patterns: VULTURE gunship, FURNACE WARDEN, ARCHON CORE.
  - Combo multiplier, score, chips, health/weapon pickups, checkpoints, perk choice (11 perks) between stages, 3 operators, save data.
  - Synthesised SFX + per-stage music, HUD, title, pause, death/retry, stage tally, victory screen.

### Verification status (be honest about this)
- VERIFIED: `npm run check` passes. Game boots to title, operator select works, starts stage 1 at ~120 fps (smoke scenario `title`).
- NOT YET VERIFIED: everything after the first seconds of stage 1 — encounters, all three bosses, perk screen, death/retry, victory. The code is written but has not been played or screenshotted. Expect bugs and balance problems.
- Known noise: two 404s logged on the title page (likely favicon + one more). Find and fix; the smoke test treats console errors as failures.

### Next tasks, in order
1. Run `npm run smoke`, read every screenshot in `tools/shots/`, fix crashes and visual problems (sprite facing, muzzle position, HUD overlap, readability against backgrounds, bloom strength in `Game.ts` camera postFX).
2. Play each boss with `?stage=N&boss=1` (without `god`) and tune fairness: every attack must be dodgeable by jump, crouch or slide.
3. Balance pass on `src/data/*` (enemy hp, fire rates, encounter sizes) — target 4-6 minutes per stage, first clear of the game in under an hour for a new player.
4. Real art for stand-in characters: gangster, zombie, brute, alien, demon, operators VIPER and TITAN, boss sheets. Prompts are in `docs/ART_PIPELINE.md`; the owner generates them in ChatGPT and drops them in `art/source/`.
5. Then follow `docs/ROADMAP.md`.

### Decisions made (and why)
- Web stack instead of Godot/Unity: AI agents can build, run and screenshot it unattended; ships to itch.io as-is and to Steam through an Electron/Tauri wrapper.
- Synthesised audio: zero licensing risk, zero files. Replaceable later with recorded tracks.
- Hero art only aims forward, so shots auto-bend toward targets in a forward cone (`playerFire` in `Game.ts`) instead of 8-way aiming.
- Baked 1px outlines (cyan for heroes, red for enemies) because the dark AI sprites vanished on dark backgrounds.
- "Addictive" is pursued through game feel, combos, builds and fast retry — no dark patterns, no monetisation hooks.
