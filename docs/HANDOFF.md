# HANDOFF — current state and next steps

Update this file at the end of every working session (any AI agent). Newest session first.

## Session 9 - 2026-11-15 (Codex, requested species library - parked)

### Scope and current priority
- Owner explicitly followed the Frontier pack request with "more species different species as well involve them". Completed a separate art/bestiary library. While this ran, Claude committed Session 8's mouse-aim fixes and quality audit. **Session 8's city-quality priority and integration freeze remain in force: do not integrate this species pack yet.** No live assets, enemy/operator registries or scene code were changed here.

### Completed
- **Twelve original fictional species**, each with a four-frame hostile-variant movement sheet: Varkesh (reptilian), Corvane (avian), Kharrix (insectoid), Ferrivor (segmented rust-eater), Nacreth (shell cephalopod), Cirrid (gas colony), Myrrhkin (fungal), Thren (plant), Vitreon (crystalline tripod), Lithurn (stone quadruped), Geliform (gel colony), Asterid (cosmic echinoderm).
- Two nonhuman operator designs within those species: **SERRIK** (Varkesh) and **QUILL** (Corvane), each with run x4, idle, jump, slide and crouch on the existing 96x72 canvas. These are the same forward-aim eight-pose contract as existing art, not Session 8's proposed separate gun-arm rebuild. Do not substitute them into that rebuild as finished assets.
- Two related boss forms: **NACRETH TIDE SOVEREIGN** and **VITREON PRISM REGENT**, each with idle, windup, attack and exposed-state art. Their signature attack code is not implemented.
- **72 transparent game-sized PNG frames**, 72 unoutlined source-resolution masters, twelve labeled PNG boards and sixteen GIF previews. Browse **`art/library/species/README.md`** or **`art/library/species/previews/bestiary.png`**. Exact paths/sizes/origins/bounds: `art/library/species/inventory.json`.
- Ten immutable original generated sheets and exact built-in image_gen prompts: `art/source/species/manifest.json`. Rebuild this pack only: `python -B tools/process_species.py`. It writes solely to `art/library/species`, reusing existing pipeline helpers. Quill uses silhouette extraction to preserve a slide foot that crosses a nominal source grid gutter.
- **`src/data/speciesPack.ts`** contains the twelve-species ecology/roles/counterplay bestiary, twelve typed EnemyDef proposals, two typed OperatorDef proposals, measured operator muzzle offsets, species palettes for all seven existing stages and boss briefs. No live module imports it. Allied/neutral roles and species-specific boss attacks are proposals, not implemented mechanics.

### Verified / limits
- Visually inspected all ten generated sources and all twelve processed PNG boards. Validated 72 unique frames, twelve species ids, all inventory/source/master paths, canvas sizes, binary alpha, empty borders, origins, one shared scale per animation group, README links and sixteen four-frame GIFs. `npm.cmd run check` passes after Claude's mouse-aim commit.
- Art-only staging: no gameplay smoke run or balance claim. Normal-health combat, in-engine body/muzzle alignment, animation continuity and new boss timing remain unverified. Some strides are similar and centered hover silhouettes can bob. Nacreth boss shell/organ position shifts across states, requiring per-state anchor measurement.
- Generic `flyer` currently does not advance a four-frame cycle; Cirrid/Asterid will need an animation call when integrated. Existing rusher/lobber warning durations are behaviour constants, not overridden by these proposals. Do not assume artwork or unused data implements new mechanics.

### Next
- Follow **Session 8**, starting with the ROOK body/separate-arm rebuild and city-only polish. Keep the species library parked for later, then select a few coherent species rather than adding the entire roster at once. The library README contains the future integration sequence and focused verification needs.

## Session 8 - 2026-11-15 (Claude Code, owner playtest feedback + quality audit) — READ THIS FIRST

### Owner feedback (first real human playtest)
The owner played and said, in short: no mouse pointer to shoot enemies, "the fire is stuck", graphics and animation look bad, wants a professional result, and allowed a tech-stack change if needed. **This overrides the "more assets" direction of Sessions 5-7.** The owner does not want more content; they want what exists to look and feel good.

### Fixed this session
- **Mouse aim.** Moving or clicking the mouse switches to free aim: a crosshair replaces the system arrow during combat, shots go exactly to the crosshair, the hero faces it and back-pedals (run cycle reversed) when moving away. Left click fires, right click slides. Pressing a fire key (J/X/Enter) or gamepad fire switches back to the old auto-aim. Code: `Controls.mouseAim` / `aimPoint()` in `src/systems/Controls.ts`, `GameScene.aim` + `playerFire()`, facing in `Player.tick()`, crosshair in `HudScene.update()`, texture in `Boot.ts`.
- "Fire is stuck" was read as "shots only ever go straight ahead". No bug was found where firing continues after release; the new `mouse-aim` smoke scenario asserts it stops.
- Title: clicking left/right of the operator browses, clicking elsewhere deploys. Perk screen: clicking a card picks it. On-screen control hints updated.
- Foreground pillars are now 40% opaque (four sessions noted they hid enemies).

### Verified
- `npm.cmd run check`, `npm.cmd run build` pass. Smoke: new `mouse-aim` passes (aim up-right, aim left, release stops fire, back-pedal, J returns to auto-aim); `title`, all `art-*`, all eight `flow-*`, `city`, `city-boss` re-run and pass. Looked at both mouse-aim screenshots.
- NOT verified: how mouse aim feels to a human; the reversed run cycle was not reviewed visually; Title/Perk mouse clicks have no automated test; the remaining ~14 smoke scenarios were not re-run (the change does not touch enemies, bosses or weapons data).

### Audit: why it does not look professional (most important first)
1. **Almost nothing is animated.** Each hero has 8 still pictures: a 4-frame run and ONE frame each for idle, jump, slide, crouch. No shooting, hurt or death frames. The 16 expansion enemies and all 7 bosses are single still images that rock or hover. Commercial run-and-guns use 8-12 run frames, breathing idles, separate jump-up/fall, hit reactions and death animations for everything.
2. **The gun does not point where the shots go.** The art only aims forward, so aimed shots leave a sideways gun. Now that the mouse aims, this is the most visible flaw. Standard fix: draw the hero without the gun arm and add a separate arm+gun sprite that rotates to the aim angle (shoulder pivot per pose, replacing `ART_MUZZLES`).
3. **Flat worlds.** Each stage is one flattened picture scrolling at one speed, plus the same grey steel floor strip and the same platform tile in all 7 stages (drawn in code in `Boot.ts`). No parallax layers, no per-stage ground, props do nothing.
4. **Inconsistent art.** ~30 AI sheets made in separate batches: different proportions, palettes and pixel sizes, then shrunk to fit. Heroes are low-contrast against busy backgrounds; the baked outline is the only thing separating them.
5. **Breadth before quality.** 7 stages, 28+ enemies, 13 weapons, 7 bosses, plus two unused packs (Frontier, 26 designs; `art/source/species/`, untracked, origin unknown to this session) — and no stage has ever been completed at normal health. `docs/ROADMAP.md` Milestone 1 ("stage 1 only, perfect") was skipped.
6. All sound is synthesised. Acceptable for now; revisit after the visuals.

### Tech stack decision: keep it
Phaser 3 + TypeScript + Vite is not what makes the game look bad, and it is not limiting anything on the list above. The code is small (~3,000 lines), data-driven and covered by an automated browser playthrough that AI agents can run unattended; a move to Godot or Unity would throw that away and fix none of the six points. Worth doing inside the current stack when the time comes: pack sprites into texture atlases (the game currently downloads ~170 separate PNGs), describe animations in data (frame lists + per-frame pivots) instead of hard-coded `_run0..3` names, and wrap with Tauri/Electron for Steam.

### Rules for the next sessions (both agents)
- **Content freeze.** No new stages, enemies, weapons, bosses or asset packs until stage 1 (city) is finished to shipping quality. Do not integrate Frontier or species art yet.
- One agent works at a time; commit at the end of each session.
- Lock an art style before generating anything: one reference sheet (ROOK), one palette, one pixel density (hero about 56px tall on the 640x360 screen), every new sheet generated against that reference.
- Every session ends with something the owner can play and judge at `npm run dev`. Ask them for one sentence of feedback; it is the only real test this project has had.

### Next tasks, in order
1. **Hero rebuild, ROOK only** (needs image generation — Codex has it, this Claude session did not): gun-arm-less body frames — idle x4, run x8, jump-up, fall, land, slide, crouch, hurt, death x6 — plus one separate arm+gun sprite pointing right. Then code: arm sprite child rotating to `GameScene.aim` (or the auto-aim angle), shoulder pivots per pose, muzzle derived from the arm, recoil kick on the arm.
2. **Stage 1 world:** split the city backdrop into 3-4 parallax layers (sky, far skyline, near buildings, foreground), a city-specific ground and platform tileset, a few animated props (neon flicker, steam).
3. **Stage 1 enemies** (trooper/robot, gangster, drone, turret, VULTURE boss): shooting frame, hit flinch, death animation each.
4. Play stage 1 at normal health and tune it (Session 6's balance list still stands, but only for stage 1).
5. Only then carry the same treatment to stage 2, one stage at a time.

## Session 7 - 2026-11-15 (Codex, animated Frontier asset pack)

### Completed
- Owner requested more original assets while Claude integrated the first expansion. Created a separate **26-design Frontier pack** without changing active gameplay or the live asset manifest. Claude's concurrent integration is preserved in Session 6 below.
- Start at **`art/library/frontier/README.md`**. Ten original source sheets and exact generation prompts: `art/source/frontier/manifest.json`. Generated using built-in image_gen; no API-key workflow required.
- Prepared **56 transparent runtime sprite frames**, **2 world backgrounds** (640x360), **2 mirrored scrolling strips** (1280x360), 56 source-resolution transparent masters, ten labeled PNG boards and eight animation/state GIF previews. Full paths/sizes/bounds/origins: `art/library/frontier/inventory.json`.
- **Operators:** KESTREL and MOTH, eight poses each on the existing 96x72 operator canvas: run x4, idle, jump, slide, crouch. Measured barrel offsets are provided in `FRONTIER_MUZZLES`; MOTH's operator id is `moth_operator`, distinct from the existing Lantern Moth enemy id.
- **Enemies:** Rail Marauder, Storm Kite, Bellows Acolyte and Cinder Skate, four walk/hover frames each. Ground canvases 96x76, flyers 80x64.
- **Bosses:** SWITCHYARD COLOSSUS (locomotive-crab, 224x128) and KILN MATRIARCH (mechanical furnace-moth, 192x160), each with idle, windup, attack and exposed-recovery pictures. These are semantic states, not idle animation loops.
- **Weapons:** Prismbreak, Pinball, Needle Hive, Rivet King, Tidebinder, Echo Fork, Ember Wheel, Star Anvil. **Props:** rail signal, storm battery, pressure vent, cargo drone wreck, furnace shrine, ember egg, coolant pump, salvage cache. **Worlds:** Stormbreak Railyard and The Underworld Engine.
- Optional typed content proposals, muzzle offsets, boss cues/dodge responses, encounter progression and prop roles live in **`src/data/frontierPack.ts`**. Nothing imports this file into live registries. Pinball ricochet and Tidebinder anchoring are explicitly future features; supplied initial WeaponDef versions do not implement those mechanics.
- Reproducible preparation: `python -B tools/process_frontier.py`. It writes only the isolated library, never `public/assets` or game data. Source sheets are immutable; preserve them.

### Verified / limits
- Visually inspected all ten original source images and all ten processed PNG boards. Checked all inventory paths, canvas sizes, binary alpha, transparent borders, sprite origins, prompt/source count, README links and eight four-frame GIFs. `npm.cmd run check` passes against Claude's integrated seven-stage campaign.
- **Staged assets and design proposals only:** no playable operators, new enemies, weapons, bosses or stages were registered in this session. No gameplay changes, campaign smoke run, balance verification or normal-health completion are claimed.
- First-pass generated animation: strides vary slightly in height; silhouette-centered flying frames/boss wings can shift body position. Review GIFs and add body pivots if needed. Muzzle offsets are measured from the PNGs but need in-engine alignment checks. Hitboxes, display scale, boss weak-point positions and state texture changes need deliberate integration.
- Backgrounds are flattened scenery with visibly mirrored repeat strips, not parallax layers, tile sets or collision geometry. Props have no implicit hazard/healing behaviour.

### Next for Claude
1. Browse the Frontier README and choose one operator or enemy. Copy only chosen PNGs into live assets and register their keys. Use existing data-only proposal entries as starting values, not tested balance.
2. For operators, merge matching muzzle values into `ART_MUZZLES` and check every pose facing both ways. For flyers, check centered body alignment; ensure each AI advances its frames.
3. Boss state art needs explicit state-to-texture logic and fair attack/recovery windows. Preserve full warning times, avoid overlapping high/low lanes and never require sliding through the entire wide train boss.
4. Follow Session 6's normal-health campaign tuning priorities. Run check plus focused smoke/screenshots when integrating gameplay; this art-only pack does not require repeating the full suite.

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
