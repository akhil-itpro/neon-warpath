# HANDOFF — current state and next steps

Update this file at the end of every working session (any AI agent). Newest session first.

## Resume here - handback to Claude Code (2026-11-15)

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
