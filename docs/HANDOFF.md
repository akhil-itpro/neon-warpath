# HANDOFF — current state and next steps

Update this file at the end of every working session (any AI agent). Newest session first.

## Session 21 - 2026-11-21 (weapon switching and mission debriefs)

The owner played the previous build and said it felt fine. They asked for weapon switching, more polish and a bug hunt.

- Press 1–3 to select a weapon, or Tab / D-pad Up to cycle usable slots. The sidearm and two pickups carry their own ammo through retries, stage transitions and saves. Matching pickups refill their slot. A new weapon uses an empty or spent slot first. When both pickups still have ammo, it replaces the equipped pickup, or slot 3 when the sidearm is equipped.
- Mission debriefs now show S–C grades, elapsed play time, kills, best combo, deaths, and the mission's score bonus. Results count across retries and resumes. Older saves restore their carried weapon and start collecting mission-specific statistics when resumed.
- The area-clear bonus is included in the checkpoint when it is earned. Ammo is protected when the projectile pool is full or the mission is already clear. Left mouse fire and right mouse slide can be held together, and middle click no longer fires. Radio boxes fit long messages and the crosshair clears during story choices. Invalid debug weapon links and fractional debug stage links now fall back safely.
- The updated browser build is `tools/shots/neon-warpath-release-v2.zip`. The production preview is at `http://127.0.0.1:4173/`.

### Verified

- Typecheck and production build passed. Production browser checks covered weapon selection, ammo and retry behavior, older campaign saves, the mission debrief, and mouse input. Inspected the new HUD and debrief screenshots in `tools/shots/`. The ZIP passed an integrity check against the production files.
- All 100 browser smoke scenarios passed across the three partitions and focused reruns. Four initial cases hit Chromium network-change errors. An UPDRAFT assertion missed the launch frame under parallel load and now observes the launch during the game update. All five passed on repeat. Logs are under `tools/smoke-session21-*.log`.

### Open validation

- The D-pad binding has browser input coverage. A physical gamepad check and a human balance run with the expanded loadout are still open.

## Session 20 - 2026-11-21 (Codex takes over development)

Codex took over development and completed the seven art jobs and browser packaging for the existing 12-stage campaign.

### Integrated

- ROOK has brighter steel-blue armor and teal accents. The new atlas preserves the eight original runtime part sizes and aiming pivots.
- VIPER, TITAN, SERRIK and QUILL now use eight-piece rigs for movement and aim. Locked operators keep their silhouette on the title screen. The built-in imagegen originals and exact prompts live under `art/source/rigs/`. Rebuild all five with `python -B tools/process_operator_rigs.py`.
- All 19 designs in art job 3 have four movement poses and an attack pose. Turrets scan and jets show their open bomb bays during a drop. All seven older bosses show combat states, including visible weak points during exposure. Rebuild the sheets with `python -B tools/process_combat_art.py`.
- Cathedral blinkers are now temporary footholds above the permanent route. The Spire keeps its side-scrolling chase, and the story guide describes the route that ships.
- All 12 stages have their own far parallax artwork. Neon Midnight also has a near rooftop layer. The sources and prompts are under `art/source/release_stages/`.
- Each stage has its own painted floor and platform tiles. The store kit contains a cover, banner, icon, and four screenshots captured from the production build.

### Release files

- `tools/shots/neon-warpath-release.zip` contains the 445 production files, with `index.html` at the archive root. The archive integrity check passed and all 433 registered textures are present.
- `art/store/` contains the upload artwork and four 1280×720 screenshots. Original generated images and prompts are under `art/source/`. See `docs/ART_PIPELINE.md` for rebuild commands.

### Verified

- Typecheck passed. Browser smoke covered ROOK and all four new rigs, title selection, the missing-part fallback, and the opening tutorial. Inspected the in-game opening, operator poses and title screen at 1280×720.
- The full browser smoke suite passed all 96 scenarios on the finished gameplay code at `dd77dd9`, including all 12 stage transitions and the credits. The final production build was checked separately with the new stage art installed. The full log is `tools/smoke-session20.log`.
- Normal balance bot cleared city stage and boss with zero deaths. After fixing the probe to release its held fire button before retrying, it reached the Abyss boss with one death and cleared the boss in its separate attempt with zero deaths.
- The Normal sidearm bot hit the Prism stage time cap after two deaths. The rerun using an SMG and the shield skill reached the boss in 118 seconds with zero deaths. The separate Prism boss attempt cleared with zero deaths.
- Browser checks passed for the original and animated enemy roster, the Cathedral platform cycle and survival finale, the Spire chase, and VULTURE's attack and vulnerability multipliers.
- Separate Normal boss attempts with the starting sidearm cleared VULTURE, the Teacup Tyrant, Warden and ARCHON with zero deaths, the Drowned Queen with one, and the Static Oracle with two. The sidearm bot timed out on Glass Widow after six deaths. With an SMG and the shield skill it cleared Glass Widow after three deaths.
- The parallax PNGs for all 12 stages have the expected dimensions, transparent upper areas and matching side edges. The City, Fungal, Tidal, Spire and Cathedral checks passed with the new depth layers loaded.
- All 24 floor and platform tiles match the intended pixel dimensions and repeat at the side edges. The production build passed the City, Casino, Abyss, Tidal and Cathedral browser checks and the live terrain and parallax check.
- The production build booted at a nested path, loaded its bundled font and icon, and entered the first stage with normal armor. Verified local preview at `http://127.0.0.1:4173/`.
- Rebuilding operator, combat, stage and store art from the saved originals produced byte-for-byte matches.

### Open validation

- Normal human playthrough and physical gamepad verification are still open.

## Session 19 - 2026-11-16 (Claude Code, difficulty fix + bug hunt + art handoff)

### Owner said
"Look at the game, fix bugs and design defects. If the game is bad, give handoffs and art and animation prompts for Codex; I will now use Codex for this game sometimes. The game is very difficult; I think it needs Call of Duty style healing or a button to press when enemies are not around. Make the game practical, make sure the graphics are good, commit."

### What changed for the player (all live, all tested)
1. **Armor repairs itself (Call of Duty style).** Take no damage for 4 seconds and the armor bar refills by itself (20% per second on NORMAL). Any hit stops it. No button needed. The bar pulses with a "+" while repairing, and the screen edges glow red while armor is critical. Code: `GameScene.tickRegen`, numbers in `src/systems/Settings.ts` `DIFFICULTIES`.
2. **Difficulty levels** in Options (first row; O on Title or Pause): EASY (0.55x damage, repair after 2.5 s), NORMAL (0.85x, 4 s, the default), HARD (1.15x, repair after 6 s and only to half). The Title and Pause screens show the current level.
3. **Mercy.** Every death at the same checkpoint cuts damage taken by 10% (NORMAL, max 30%; EASY 12% / 36%; HARD none) until that checkpoint is passed. The retry shows "BACKUP PLATING: -20% DAMAGE…". Field `run.strikes`, not saved.
4. **Tutorial tips.** Stage 1, first attempt: four short lines under the radio (slide is invulnerable, armor repairs, your skill key, drop through platforms). The K.I.A. screen shows one rotating tip.
5. **Gamepad right stick aims** (free aim, twin-stick style). **Keyboard / gamepad auto-aim cone widened** from 38 to 58 degrees: flyers hover up and to the side, and more than half of them were outside the old cone, so players without a mouse could not hit them.
6. **Readability.** A soft light behind the hero and a band of stage-coloured haze behind everyone on the floor, so dark sprites stand out from dark backdrops. The hurt flash is now red screen edges plus a light wash (the old 35% full-screen red hid the next bullets).

### Bugs fixed
- **Frozen and hit at the story choice (railyard FREIGHT CARS):** the player cannot move during the slow-motion choice but gantries and bullets still hurt them, and could kill them. The player is now untouchable while a choice is on screen.
- **Slow motion could leak into the retry:** dying during a choice left the scene clock at 1/5 speed after restart. `GameScene.create` now resets the clock and tween speed.
- **Full stage title replayed after every death** before the first checkpoint (it covered the fight). Retries now show a small "BACK IN THE FIGHT".
- **Four-frame flying enemies never animated** (Storm Kite, Cirrid, Asterid stayed on frame 0): the `flyer` AI now advances the cycle.
- **Fungal Depths: pale see-through columns over the darkness** (the foreground pillars were drawn above the dark layer). They are now under it in dark stages.
- **Title controls line and skill description were garbled** (pixel font scaled to 75% / 85%). Now drawn at full size.
- Gamepads without a right stick object no longer crash `Controls.poll` (defensive read).

### For Codex: art hooks that need NO code change
`docs/CODEX_ART_HANDOFF.md` was rewritten with seven prioritised jobs and exact prompts. New hooks, covered by the `art-hooks` smoke scenario:
- `<art>_0..3.png` walk / fly cycle (existing), **`<art>_atk.png`** attack picture shown during wind-up and firing (new).
- **`bg_<id>_far.png` / `bg_<id>_near.png`** transparent parallax layers (new, `GameScene.layers`).
- **`ground_<id>.png` / `plat_<id>.png`** painted tiles replace the code-drawn ones (new, `Boot.makeStageTiles`).
- Boss state sets `<art>_idle/_windup/_attack/_exposed` + `states: true` (existing).

### Tests
- The smoke runner now sets `window.__classic` (original rules: raw damage, no repair, no mercy) for every old scenario, so their exact-damage asserts still hold. New scenarios with `rules: true` test the real rules: `rules-regen`, `rules-difficulty` (EASY / HARD numbers, HARD half cap, mercy, retry notice), `rules-hints`, `rules-choice-safe`, plus `art-hooks`.
- `npm run balance` unchanged in meaning (classic rules, damage a non-dodging bot takes). New: `REAL=1 npm run balance -- <id>` plays with normal armor and the real rules and reports **deaths** (`DIFF=0|1|2`).
- Debug: `&regen=0` turns self-repair off.

### Verified
- `npm run check` and `npm run build` pass.
- These smoke scenarios were run after the changes and pass: `rules-regen`, `rules-difficulty`, `rules-hints`, `rules-choice-safe`, `art-hooks`, `release-options`, `release-pad-bindings`, `kit-quake`, `furnace-boss`, `x-prism-boss`, `gim-dark`. Screenshots looked at: armor critical (red edges), tip line, mercy notice, city with the new haze, fungal darkness, prism boss, parallax test layer.
- **The full smoke suite was NOT re-run after the last edits** (the owner asked to commit and stop). An earlier full run was stopped after 16 scenarios; its one failure (`release-pad-bindings`, fake gamepad without a right stick) is fixed and passes. **First thing next session: `npm.cmd run smoke`** and fix anything red.
- `REAL=1 npm run balance` (bot under the real rules) was started for city / abyss / prism but its results were not recorded before the session ended. Run it once and write the death counts here.

### Not verified / honest limits
- **Still no human playthrough at normal health.** The bot numbers say a player who never dodges can now get through; they do not say the game is fun or fair everywhere. Ask the owner to play stages 1 to 3 on NORMAL and say one sentence.
- The gamepad right stick was not tried on a physical pad (logic only).
- Self-repair makes health pickups and the FIELD SURGEON perk less important. That is accepted for now; if the game becomes too easy on NORMAL, raise `regenDelay` first, not enemy damage.
- The production-build smoke of Session 18 never finished and four of its failures were test-only (`import('/src/...')` does not exist in a built site). Use the dev smoke; `npm run build` is the production check.

### Next (Codex)
1. `docs/CODEX_ART_HANDOFF.md` jobs 1 to 4 (ROOK colours, four operator puppets, enemy walk + attack frames, boss state pictures). These are what the game still visibly lacks.
2. After the owner plays: tune `DIFFICULTIES` in `src/systems/Settings.ts` only. Per-boss tuning (`hp`, `contact` in `src/data/enemies.ts`) only for a boss the owner names.
3. Jobs 5 to 7 (parallax, tiles, store art), then zip `dist/` for itch.io.
4. Open design debts: the Spire is horizontal (STORY says vertical); cathedral "blinking" platforms sit on top of permanent ones (cosmetic); no key remapping.

## Session 18 - 2026-11-16 (Claude Code, finish Codex's interrupted Session 17 verification)

### Owner said
"Codex died; he might have updated the handoff. Check and work on it, and when you are about to die give the handoff to Codex."

### Found
- Working tree was clean. All Session 17 code was already committed (`96e2ffd`, `ba50947`, `65e4d16`). Only the verification step was unfinished.
- Codex's full dev smoke log `tools/smoke-session17.log` (UTF-16; read with `iconv -f UTF-16`) **did finish: 86/86 ok, no FAIL lines.** `flow-retry` is the last scenario. The runner prints no summary line, so a missing summary is normal.

### Done this session
- `npm run build` (typecheck + production build) passes.
- Full smoke against the **production build** (`SMOKE_BUILD=1 node tools/smoke.mjs`): the session ended before it finished (31 of 86 ran, 27 ok). The 4 failures were test-only: those scenarios `import('/src/...')`, which does not exist in a built site. Resolved in Session 19: use the dev smoke.

### Next (if interrupted, continue here)
1. Read the production smoke log; fix any FAIL. Look at gameplay screenshots in `tools/shots/` (kit-*, release-*, story-halcyon, x-*-boss).
2. Zip `dist/` to `tools/shots/neon-warpath-build.zip` (itch.io upload), update this entry, commit.
3. Release limitations from Session 17 item 3 still stand.

## Session 17 - 2026-11-16 (Codex, operator kits + campaign finishing pass) - code committed; verification finished in Session 18

Owner requested completion, missing art/animation, double jump, rechargeable defensive skills and distinct playable character abilities. Preserve the action campaign with RPG-style perk builds; no scope reset.

### Working step: operator kits
- Standard double jump; JUMP BOOSTERS adds a third jump. E/F or gamepad LT activates a distinct skill for all five characters. ROOK AEGIS shield, VIPER PHASE haste/invulnerability, TITAN SHOCKWAVE + damage reduction, SERRIK RALLY heal/damage, QUILL UPDRAFT launch/purge/glide. Values and descriptions in `src/data/abilities.ts`.
- Animated fields, individual synthesized SFX, recharge/active HUD, Title and pause descriptions. Recharge begins after active duration; pause/choices freeze it; death/retry resets it.
- Seven new browser smoke scenarios verify jumps/perk, protection at normal health, real projectile absorption, allied/prop safety, expiry, held input, cooldown, pause and retry. `check` passes. Initial kit run passed 6/7 and exposed a real UPDRAFT bug: Arcade max velocity limits both directions. Fixed with a descent-only clamp and preserving the launch when jump is not held; focused `kit-gale` now passes. Viewed shield and pause screenshots. Full regression pending after assets.
- Integrated 23 finished art textures from five built-in imagegen sources: HALCYON's eight poses, three props, twelve portraits. Originals/exact prompts in `art/source/campaign_finish/`; deterministic rebuild `python -B tools/process_campaign_finish.py`. Preview contact sheet and animated run GIF in `art/preview/` (ignored).
- HALCYON no longer borrows KESTREL. Measured muzzle offsets drive the duel's shots. Full-frame animation, not a part rig. Props preserve the previous physics scale and collision dimensions. ARCHON keeps its glyph.
- Viewed the full processed contact sheet, in-game props/HALCYON and painted radio/briefing portraits. `story-halcyon` passes; all eight focused asset/story scenarios pass (including HALCYON).

### Working step: save/options and campaign gaps
- Added browser checkpoint saves (`CampaignSave.ts`) at combat checkpoints, in-level choice completion, Briefing and Perk. R/Start on Title continues; pause T saves + returns to Title. Restore rebuilds operator/perk stats from current definitions; JSON is validated; malformed saves are ignored. God/debug stage URLs do not overwrite real campaigns. A failed save keeps play paused and shows SAVE UNAVAILABLE. Finished campaigns clear the continue slot.
- Save resumes at a combat checkpoint, not an exact world snapshot. Story and perk screens resume before their unresolved decision; HOLD retries that finale. New runs explicitly replace the campaign slot. No cloud save or save export.
- Options (O on Title/Pause, View on pad Title, Y on pad Pause): independent music/effects volume, camera shake strength, full-screen flash toggle. These settings persist separately. Enemy warning flashes remain visible; this is not a full reduced-motion mode. Fixed the damage flash rectangle whose fill was entirely transparent.
- Found and fixed a late-campaign blocker: the Sovereign bonus can exhaust all 11 unique perks before the last perk screen. It now offers FIELD RESUPPLY (full HP/overdrive), with content in `src/data/supplies.ts`.
- Fixed repeated FREIGHT CARS choices after retry: already-recorded options suppress re-prompting/rewards.
- Seven `release-*` smoke scenarios pass: reload at checkpoints, choices, perks and HOLD; completed-run cleanup; malformed save/settings JSON; denied writes; exhausted perks; repeated choice prevention; options persistence and effect suppression. Simulated pad mapping verifies jump/LT edges only, not physical controller feel. Viewed options, continue, resupply and restore screenshots.

### Next in this session / if interrupted
1. Full smoke is running; log is `tools/smoke-session17.log`. Review failures, check production build and production smoke; inspect gameplay screenshots. Do not infer a full pass from the targeted runs above.
2. Package verified web build, update this entry and commit remaining working steps.
3. Release limitations: human normal-health campaign playthrough, physical gamepad and listening checks; vertical spire/lava layouts still differ from STORY; optional operator/boss rig polish; remappable controls, full reduced-motion and store release work remain. This is a playable campaign build, not a commercially playtested release.

## Session 16 - 2026-11-16 (Claude Code, check Codex's work + HOLD finale + bot-found bugs) — NEXT AGENT START HERE

### Owner said
"Codex created something, check and finish the game."

### Checked
- Codex's Session 15 backdrops (`bg_tidal`, `bg_prism`, `bg_spire`) look right in game (looked at x-tidal / x-prism / x-spire): actors and platforms read clearly. `check` + `build` pass. Full smoke before any change: 67/68, the one failure being `story-final`, which changed on purpose (below).

### Built / fixed
- **HOLD IT OPEN finale (was missing):** picking HOLD now starts a 60-second survival fight in the ARCHON arena (`GameScene` hold mode: `startHold` / `tickHold` / `holdDone`, waves from `HOLD_POOL` that grow over time, Varkesh allies if freed, pale ghost silhouettes of the species walking home through the gate, HUD `holdTimer`). Comms `HOLD.start/half/end` in `story.ts`. Win: +20 000, then End (OPEN DOOR). Dying retries the finale only. Debug: `?stage=cathedral&hold=1`.
- **Difficulty probe `npm run balance` (`tools/balance.mjs`):** a bot with perfect mouse aim that never dodges plays every stage and boss with huge HP and reports damage taken and time. Use it to compare stages, not to prove they can be beaten. It saves `tools/shots/balance-<id>-<part>.png` when a run does not finish.
- **Bugs the probe found (real for human players too):**
  1. **Held fire froze the in-level choice** (railyard FREIGHT CARS) forever: the "wait for release" check returned before the timeout check. Fixed in `Hud.tickChoice`; smoke `story-freight-heldfire`.
  2. **Auto-aim shot over low, wide crawlers** (kharrix): it aimed at the picture's middle, not the hitbox. Now aims at `body.center`.
  3. **Enemies could wander or lunge out of a locked arena** past the screen edge, so the wave never ended. `GameScene.keepInArena` now holds ground encounter enemies inside once they have entered (`Enemy.inArena`).
- **Balance:** the stage 2 boss TEACUP TYRANT was a spike (non-dodging bot took 294 damage vs 70 at stage 1 and about 120 at stages 4-5): HP 1700 -> 1300, contact 20 -> 15. Now 194.

### Probe numbers (after fixes; damage a non-dodging, perfect-aim bot took; ROOK has 100 HP)
Stages: city 124, casino 154, railyard 141 (plus the choice), furnace 172, engine 134, fungal 120, abyss 300, tidal 145, orbital 253, prism 251, spire 119, cathedral 280.
Bosses: vulture 70, tyrant 194, colossus 270 (starts at 60%), warden 122, matriarch 118, widow 378, queen 118, sovereign 234, oracle 204, regent 446, halcyon 240, archon 172.
Stomper-type bosses (colossus, regent) and the widow hit hardest per minute. Run-to-run variance is about +-30%, so only big gaps mean anything.

### Verified
- `npm run check` passes. Full smoke after the aim/arena changes: **70/70 pass**. Afterwards (choice fix + Tyrant numbers) re-ran story-*, gim-*, x-*, casino, flow-stage-2/3: all pass. Looked at the HOLD screenshots (gate, ghost walkers vs solid enemies, allies with blue rings, THE DOOR HOLDS, OPEN DOOR results).

### Still NOT verified / next
1. **A human playthrough at normal health** is still the real test; the probe never dodges, so all its numbers are pessimistic. Abyss stage (300) and the Regent (446) are the next candidates to soften if the owner finds them too hard.
2. Spire is still horizontal (not the vertical climb in STORY.md); furnace lava rises in one section only.
3. Art: Codex next does HALCYON's own frames, then the cage/pylon/slot props and portraits (`docs/CODEX_ART_HANDOFF.md`). ROOK still needs the owner's verdict.

## Session 15 - 2026-11-16 (Codex, three campaign world backdrops)

### Completed
- Followed the newer `docs/CODEX_ART_HANDOFF.md` while the parallel Claude session completed the campaign code. No gameplay code changed in this art batch.
- Generated original painted-pixel backgrounds for **THE TIDAL VAULT**, **PRISM WASTES** and **THE LATTICE SPIRE** with the built-in imagegen tool. Raw outputs and exact prompts are retained in `art/source/campaign_worlds/`.
- Added `tools/process_campaign_worlds.py`: reproducible 640x360 / 160-colour processing, mirrored to seamless 1280x360 RGB strips, plus the ignored `art/preview/campaign-worlds.png` contact sheet. Rebuild: `python -B tools/process_campaign_worlds.py`.
- Registered `bg_tidal`, `bg_prism`, `bg_spire` in the live manifest. Boot automatically uses the PNGs instead of its procedural stand-ins. Stage tints, scenery shading, layout, collision and mechanics are unchanged.
- Updated the art pipeline and marked the three-background request complete in the art handoff.

### Verified
- `npm.cmd run check` and `npm.cmd run build` pass. The production build contains all three images.
- **9/9 focused smoke scenarios pass with no browser errors:** `gim-water`, `gim-pylon`, `gim-chase`, plus `x-tidal`, `x-prism`, `x-spire` and their boss scenarios. Inspected all 30 gameplay screenshots (contact sheet plus full-size mechanic and boss views) and the processed art contact sheet. Platforms, actors and projectiles remain distinguishable from the new scenery. This session did not rerun the full 68-scenario suite.
- Confirmed one registration per key, 1280x360 RGB output and exact matching pixel columns at both the centre and wrapping seams.

### Unverified and next
- These are flattened scrolling backdrops, not separate parallax layers. Their mirrored repetition follows the existing background pipeline.
- Normal-health balance, human playthroughs, gamepad feel and audio remain unverified; the art checks do not establish beatability. Session 14's gameplay limitations still apply.
- **Next art priority: HALCYON's own art** (section 2 of `docs/CODEX_ART_HANDOFF.md`), then cage/pylon/slot props and portraits. ROOK still needs the owner's review before expanding that rig method to every operator.

## Session 14 - 2026-11-16 (Claude Code, full 12-stage campaign: C gimmicks + D new stages + B5/B7/B8 + ARCHON phase 3)

### Owner said
"Continue till you finish this game; if needed write a handoff for Codex for any images or other assets and artwork."
The owner has still not reviewed ROOK. **Art requests for Codex are now in `docs/CODEX_ART_HANDOFF.md`** (replaces the list in Session 13).

### Built this session (the whole STORY.md campaign is now playable start to finish)
- **12 stages in STORY.md order:** city, casino, **railyard**, furnace, **engine**, fungal, abyss, **tidal**, orbital, **prism**, **spire**, cathedral. Stage numbers in `?stage=N` changed; use ids.
- **Art brought in:** `tools/integrate_campaign.py` copies Frontier + species library sprites into `public/assets` and swaps the old red outline to the live near-black / operator rim (114 images, incl. `bg_railyard`, `bg_engine`, 12 species, 4 boss state sets, SERRIK/QUILL poses, KESTREL frames as `halcyon_*`). `bg_tidal`, `bg_prism`, `bg_spire` are procedural stand-ins in `Boot.makeBackdrops` (skipped once a PNG exists).
- **Stage gimmicks** (`src/systems/Gimmicks.ts`, data fields on `StageDef`, documented at the top of `stages.ts`): city swinging billboards (movers), casino roulette floor + slot-machine spawners (`slot` enemy), railyard train with head-height gantries (crouch/slide) + wind, furnace rising lava section, engine crushers + gravity flips every 20 s, fungal darkness with a light radius (wider after a hive truce and in the boss arena; enemy bullets and telegraphs draw above the dark), abyss flooding rooms, tidal 12 s tide over the whole stage (water = slower, floatier, air meter, drowning damage), orbital low gravity, prism crystal pylons (beam the player; shoot one and its beams hit enemies), spire floor deletion chase + data blocks + movers, cathedral blinking data platforms. Player environment multipliers live in `Player.env` (set by Gimmicks each frame; movement constants untouched).
- **New roster** (`enemies.ts`): marauder, kite, acolyte, skate, varkesh, corvane, kharrix, ferrivor, nacreth, cirrid, myrrhkin, thren, vitreon, lithurn, geliform (splits into `gelling`), asterid; gimmick objects slot, pylon, cage. Collared species show a red ring (`collar` trait); allies a blue ring.
- **New bosses:** SWITCHYARD COLOSSUS (stomper), KILN MATRIARCH (seer), TIDE SOVEREIGN (seer), PRISM REGENT (stomper), **HALCYON** (`boss_duel`: keeps distance, rifle -> shotgun -> rail beam by phase, slide charge to jump over, leaps over you when cornered). `states` trait: boss art switches idle/windup/attack/exposed; exposed takes 1.4x damage, attacking 0.75x.
- **ARCHON phase 3** at 33% HP: aimed light beams and gravity inversion added to its cycle; story help per flag (Halcyon drops the shield = double damage 10 s, Corvane dive clears bullets, Varkesh allies, spores stall it 6 s).
- **Story:** all 5 new stages' briefings/comms/boss lines from STORY.md; bridged lines restored (Act I ending now after the railyard, abyss -> Nacreth signal). Choices: C2 FREIGHT CARS is an **in-level slow-motion choice** (B5: world at 1/5 speed, 8 s timer, default = blow the bridge; `CHOICES` in story.ts, HUD `choice()`), C4 SOVEREIGN (finish = +50 000 and a random perk), C6 HALCYON (locked "YOU DON'T KNOW HOW" without the Oracle truth), C7 RIFT after the final boss (Briefing runs once more with `next: 'End'`; HOLD needs the Tide Pearl). Consequences: Colossus starts at 60% if the bridge was blown; freed Varkesh allies in engine arenas 2-3 and at Colossus 50%; otherwise Varkesh join enemy waves in engine and prism; finishing the Sovereign adds Nacreth to prism; Quill's cage on a high girder in orbital (shoot it); Corvane leave the spire if Quill was rescued.
- **Allies (B7):** `ally: true` enemy defs follow the player, shoot hostiles with the player's shot pool, are ignored by player shots/blasts/aim-assist/arena checks, leave after `life` ms.
- **Endings (B8):** `pickEnding()` in `Story.ts` implements ASHES / DAWN / OPEN DOOR exactly per STORY.md (4 mercy flags). Credits open with the ending-specific epilogue and the list of choices; 30+ shards play the secret post-credits shot. 36 shards / 36 lore entries.
- **Unlockable operators:** SERRIK (open the freight cars) and QUILL (free the cage) are saved in `save.unlocked` and selectable on Title (locked ones are greyed with the unlock hint).
- **HUD:** comms panel moved to the **top band** (it covered the hero bottom-left); air meter under the shard counter; portraits now accept painted PNGs of any size with no code change.
- Smoke: `x-<id>` + `x-<id>-boss` for the 5 new stages, `gim-*` (movers, roulette + slot, flip + crushers, dark, water, lava, pylon, chase), `story-freight`, `story-freight-timeout`, `story-allies`, `story-cage`, `story-halcyon`, `story-final` (phase 3 + allies + OPEN DOOR), `flow-stage-1..12`. Runner helper `window.__tp(x, y)` teleports past arena triggers.

### Verified
- `npm run check` passes. All `gim-*`, `story-*` and `x-*` scenarios pass; screenshots looked at for every gimmick, the freight choice overlay, Colossus at 60%, Matriarch, Sovereign, Regent, Halcyon, ARCHON phase 3 with Varkesh allies, the Halcyon choice cards and the OPEN DOOR results screen.
- **Full suite: 68/68 smoke scenarios pass, no browser errors** (one old flaky check in `arm-rig`, crouch asserted after key release, was fixed and passes 3/3). `npm run build` passes. Credits show the ending epilogue (looked at).

### NOT verified / known limits
- **Nobody has played any stage at normal health.** All new tuning (boss HP, crusher timing, tide period, chase speed, gantry spacing, pylon beam damage) is a first guess. The balance bot (E) was not built.
- ~~HOLD IT OPEN does not run the 60-second survival wave~~ (done in Session 16).
- The spire is a horizontal stage with a deletion chase, not the vertical climb STORY.md describes (the camera is horizontal-only). Furnace lava is a rising level in one section, not a vertical climb.
- HALCYON uses KESTREL's frames (Codex request). Pylon, cage and slot machine use tinted stand-ins.
- Gamepad on the in-level choice overlay and audio of new moments are untested.

### Next
1. Owner plays (ideally stages 1-3) and gives one sentence of feedback; also the ROOK verdict.
2. Codex: `docs/CODEX_ART_HANDOFF.md` top to bottom.
3. Balance pass at normal health (a bot that plays without god mode would help), then the HOLD survival wave and the vertical spire if wanted.

## Session 13 - 2026-11-15 (Claude Code, story system B1-B4 + B6 + partial B7/B8)

### Owner said
"Codex has done some work, you continue the rest." Then: "update the handoff; if you need more artwork from Codex, put it here." Session 12 asked for owner review of the new ROOK rig before redoing other characters. The owner chose to continue, so this session did the **code-only story work (B)**, which needs no new art. **The owner has still not given an opinion on ROOK.** Ask again when they next play.

### Built this session (all live in the 7-stage game)
- **`src/data/story.ts`** holds briefings, comms, choices and 21 lore entries for the 7 live stages. They map to STORY.md stages 1, 2, 4, 6, 7, 9 and 12. Lines that pointed at unbuilt stages (railyard, tidal vault, prism, spire) were bridged with small rewrites; restore the originals when those stages exist. Types: `Line { who, text, op?, notOp?, if? }`, `Choice`, `ChoiceOption { set, record, bonusCards?, requires?, locked? }`. Comms trigger keys are documented at the top of the file (`start`, `x:<n>`, `enc:<i>`, `clear:<i>`, `see:<enemyId>`, `boss`, `boss50`, `bossdown`, `death`, `shard`).
- **`src/systems/Story.ts`** has the helpers: `condOk`, `lineOk` (operator overrides plus flag conditions), and portrait and speaker lookups.
- **Run state (`Run.ts`):** `flags`, `shards`, `eggsShot`, `bonusCards`, `heard` (each comm plays once per run), `choices` (result-screen text). Save: `archive` (lore ids, persistent) and `endings`.
- **Comms overlay (HUD):** a portrait plus typewriter text bottom-left, above the boss bar. It queues lines and never pauses. ARCHON gets a static sound and a glitching portrait. A 'death' comm plays after the first retry in a stage (Game is restarted with `{ retry: true }`).
- **Briefing scene (`src/scenes/Briefing.ts`):** flow is now Title → **Briefing** → Game, and Game → **Briefing** → Perk → Game. It shows the previous stage's `after` choice, then the next stage's briefing. Fire advances; holding fire skips to the next choice. After a pick, the button must be released so the replies are not skipped. Choice cards work with keys, mouse and gamepad.
- **Choices live now:** C1 THE LEDGER (after casino). `sell` gives a 4th "NEW STOCK" perk card for 3 perk screens. `leak` adds an extra gangster wave plus 2 roamers in FURNACE and Juno comments on it. C3 THE NEST (by action in FUNGAL): shooting 3 or more brood eggs sets `nest_truce=false`, and 4 extra spiderlings join the GLASS WIDOW fight. The comms change too. C5 THE ORACLE (after orbital) changes the cathedral briefing, ARCHON's mid-fight lines and Patch's lines.
- **`StageDef.variants`** (B7, first cut): `{ if, waves?: [encIndex, ids][], roamers? }` adds content when flags match. Ally NPCs and collars are not built yet.
- **Data shards (B6):** 3 per stage (`StageDef.shards`), 21 total. Each gives +1000 score, a HUD counter, the persistent ARCHIVE unlock and the first-shard comm. **Reachability was tested in the real game:** all 12 high-platform shards can be reached with a plain running jump from the neighbouring lower platform (city-3 and orbital-2 were moved after failing). Mid shards sit on 245/250 girders; low ones need a jump from the floor.
- **ARCHIVE scene** (Title: Tab or click top-left) lists the lore; locked entries show their stage name.
- **Endings (B8, partial):** the results screen shows ENDING ASHES or DAWN, shard count and "YOUR CHOICES". OPEN DOOR needs stages 8 and 11, which are not built. Credits are not ending-specific yet.
- **Portraits:** procedural 48x48 pixel busts drawn in `Boot.makePortraits` (ROOK, VIPER, TITAN, JUNO, PATCH, CROUPIER, ORACLE, ARCHON glyph, MYRRHKIN). They are stand-ins, see the art requests below.
- New sfx `radio`, `static`, `type`, `shard`. Perk and choice cards are no longer shrunk when unselected; the shrinking garbled the pixel font ("FTFID SURGEON").
- Smoke: `title` now goes through Briefing; `flow-stage-*` taps through Briefing; new `story-comms`, `story-ledger`, `story-leak`, `story-nest`, `story-end`, `archive`; new step op `['press', [key, cond]]`.

### Verified
- `npm run check` passes. Focused smoke passed: all `story-*`, `title`, `archive`. Screenshots looked at: comms panel in city, shard counter, briefing with VIPER, ledger choice cards, 4-card perk screen with Patch's new line, ARCHIVE, DAWN results screen. **Full suite: 39/39 smoke scenarios pass, no browser errors** (exit 0), including all 7 flow-stage runs through the new Briefing, credits back to Title.

### NOT verified
- How the story pacing feels to a human (line timings, whether comms distract during fights). Normal-health balance is still untested, as are gamepad on the Briefing and Archive screens and the audio of the new sfx.

### ART REQUESTS FOR CODEX (do these next; they unblock the rest of the plan)
Put sources in `art/source/`, keep exact prompts as before, and process into `public/assets`. Code already falls back gracefully.
1. **Portraits, 64x64 busts, one consistent painted-pixel style** (the procedural busts are placeholders). Keys: `portrait_rook`, `portrait_viper`, `portrait_titan`, `portrait_juno`, `portrait_patch`, `portrait_croupier`, `portrait_oracle`, `portrait_myrrhkin`, plus later `portrait_halcyon`, `portrait_serrik`, `portrait_quill`, `portrait_sovereign`. ARCHON stays a code glyph. To swap: delete the matching `bust(...)`/`canvas(...)` call in `Boot.makePortraits`, or skip it when `this.textures.exists(key)`. The HUD draws portraits at 48x48 and Briefing at 2x; if they are 64px, set the display size to 48 / 96.
2. **A3 rigs for VIPER and TITAN**, the same eight-part method as ROOK (`art/source/rigs/`, `src/data/rigs.ts`). Wait for the owner's ROOK verdict first if possible.
3. **A4 boss part-rigs** (rotor, claws, cannon, weak point) and 2-part rigs for small enemies; the procedural split-into-pieces death can be code (Claude can do that).
4. **A5 parallax layers** (sky / far / near + a foreground silhouette strip), CITY first, then one per stage. Keep them darker than the actors.
5. **New-stage art for D:** Tidal Vault, Prism Wastes and Lattice Spire backdrops as parallax layers; the **HALCYON** rival operator rig (A3 method); and a **QUILL cage** prop plus a **Varkesh collar ring** overlay if drawn rather than coded.

### Next code tasks (Claude or Codex)
- B5 in-level slow-motion choice overlay (needed for C2 on the railyard train).
- B7 ally NPC gunners (`ally: true` enemy defs that target enemies) and collar rings.
- B8 ending-specific credits epilogue and the 30+ shard secret scene.
- C stage gimmicks (moving platforms, lava rise, darkness, water, low gravity). This is the biggest "every stage plays the same" fix.
- D: the 5 new stages, re-inserting the original STORY.md lines for them; E: a balance bot.

## Session 13 - 2026-11-15 (Codex, browser launch)

- Confirmed the existing Vite server serves NEON WARPATH at http://127.0.0.1:5173/. Browser automation and launching a browser were unavailable in this session; open the link to play.
- Existing uncommitted story-related changes were left untouched. `npm.cmd run check` fails because `HudScene` lacks `comms` and `shardGot`, referenced by `Game.ts`; this appears to be ongoing work. No gameplay changes or playtesting were performed. Owner review of ROOK remains next.

## Session 12 - 2026-11-15 (Codex, A1-A3 visual milestone)

### Completed
- Read CLAUDE.md, the current handoff, the full STORY.md, GDD and art pipeline. Followed Session 11's A1-A3 milestone; no new campaign content has gone live.
- **A1:** muted every gameplay backdrop with a 32% ink overlay behind actors/telegraphs. Rebuilt all live main/expansion sprites with near-black hostile outlines and a muted cool operator rim. Both pipelines share outline constants. Original source images remain unchanged.
- **A2:** the legacy rectangle-cut arm rig is retained behind `ARM_RIG = false`. VIPER/TITAN use intact full-body frames and existing muzzle offsets; missing new rig parts also fall back to intact frames.
- **A3 (ROOK only):** generated ONE purpose-drawn eight-piece atlas with built-in image_gen, saved with the exact prompt in `art/source/rigs/`. New `src/data/rigs.ts` holds pivots, leg lengths, barrel point and eight foot positions. `CharacterRig.ts` renders connected limbs, bending knees, distance-driven forward/backward running, breathing, jump/fall poses, crouch/slide, aim/recoil, hurt flinch and procedural no-gore death pieces. It also renders ROOK on Title. Player movement constants, hitbox sizes and slide invulnerability remain unchanged.
- Added ROOK smoke coverage for real-input poses/aim, hitbox sizes, slide invulnerability, immediate white flash during hit-stop, death/retry cleanup and pause. The final eight screenshots deliberately pause the scene to render a stable cycle review (the final diagnostic listing only Hud is expected).

### Verification and artifacts
- A1 check + city/gunship smoke passed; A2 check + arm-rig, art-viper, art-titan and mouse-aim smoke passed. Inspected before/after city and gunship images plus all three operator views.
- A3 focused ROOK/mouse-aim/legacy-arm/title smoke passed; typecheck and production build passed. Full **33/33 smoke scenarios pass with no browser errors**, including all seven stage/boss scenes, pickups/weapons, ROOK, fallback operators, death/retry, pause, perks and credits back to Title.
- Inspected the generated atlas, processed parts, close-up run/aim/crouch/slide/hurt/death screenshots, Title, and representative campaign/boss screenshots. `python -B tools/preview_rook_rig.py` generates the reviewed `art/preview/rook-review.png` and eight-position `rook-run.gif`.
- Rebuild parts: `python -B tools/process_rook_rig.py`. Runtime part PNGs + manifest are committed; preview/shots remain ignored. Source/prompt/rebuild details: `art/source/rigs/README.md`; art docs updated.
- Production output: `dist/`; ready-to-upload archive: `tools/shots/neon-warpath-build.zip`. Local dev preview was started at `http://127.0.0.1:5173/` for owner review.

### Unverified and next
- **Owner review is next:** Session 11 explicitly says "After A1-A3, stop and get the owner's opinion on the new ROOK before redoing every character." Judge animation feel in motion, not only the contact sheet. This is a first cut-out rig, not a claim of final hand-polished art.
- Normal-health balance, human completion of a stage, gamepad feel and audio listening remain unverified. God-mode/forced-death smoke checks do not establish difficulty or beatability.
- Still **7 stages**. The 12-stage story, briefings/comms, choices, shards, allies and endings in STORY.md are a design, not implemented gameplay. No five new stages, enemy/boss rigs, new parallax layers or shared palette have been added.
- After ROOK feedback: refine this rig if needed, then continue A4-A6 and B story systems in Session 11's order; stage gimmicks and the five new stages follow. Keep content data-driven and add focused smoke coverage per feature.

## Session 11 - 2026-11-15 (Claude Code, honest audit + 12-stage story campaign plan) Ã¢â‚¬â€ CODEX: START HERE

### Owner said
"The game is not good and the animations are bad. It needs at least 12 levels, with a storyline and a more interactive story." This session made **no code changes**. It is an audit plus a plan. The story, 12-stage structure, choices and endings are in **`docs/STORY.md`** (new; read it fully). This section is the engineering handoff for Codex.

**This replaces Session 8's content freeze.** The owner now asks for 12 stages. But the order below matters: fix the shared look/animation pipeline first (it improves every stage at once), then the story system (code only, cheap, big impact), then make each stage play differently, then add the 5 new stages.

### Honest audit: why it is not good (looked at code + screenshots in tools/shots/)
1. **Animations look bad because each frame is generated as a separate AI image.** The AI redraws the character every frame, so proportions, gun, face and outline drift between frames, and the 4-frame runs skip the key poses (contact, passing). Example: `art/library/frontier/previews/kestrel_sheet.png`, where run1 and run3 are hops, not strides. Every pack (hero, VIPER, TITAN, Frontier, species) has the same problem. **Making more frames this way will not fix it.**
2. **The arm rig made ROOK worse.** `ArmRig.ts` cuts the arm out of a picture that was never drawn to be cut. In `tools/shots/arm-rig-0.png` / `arm-rig-2.png` ROOK holds the gun at his face and his torso looks chewed. Players notice this more than a gun that only points forward.
3. **The characters get lost against the background.** The backdrops are big, detailed, high-contrast paintings at full brightness. The ~64px characters are dull and have a thin outline. Enemies and bosses have a **red** 1px outline (the gunship in `city-boss-1.png` looks like a sticker). Only one backdrop layer, no parallax, no foreground.
4. **No two stages play differently.** All 7 stages in `src/data/stages.ts` use one template: flat 5,000px strip, ~10 floating girders, 3 arena locks, a boss. Only the backdrop, enemy list and floor colour change. 12 stages built this way would be boring; only gimmicks make 12 work.
5. **No story at all** beyond one tagline per stage and a boss banner. The GDD listed story as out of scope.
6. **Still nobody has finished one stage at normal health.** Balance is untested. Bosses in god mode die in under 30s.
7. Unused art: ~380 PNGs in `art/library/` (expansion, frontier, species). Most of it can be used in the 12-stage plan (STORY.md sections 3 and 6), once fixed by step A.

### Codex work plan, in order. Commit after each numbered task. Each must end with `npm.cmd run check`, the relevant `npm.cmd run smoke -- <name>`, and screenshots you looked at.

**A. Fix the look (all stages benefit)**
- A1. **Readability pass, code only, do this first (about an hour).** In `GameScene` darken and slightly desaturate the backdrop (darker `bgTint`, or a dark overlay at alpha ~0.3) so characters pop. In `tools/process_assets.py` / `integrate_expansion.py` change the baked outline from team red/blue to a near-black outline (e.g. #0b0d14) for every enemy and boss; keep a faint coloured rim only on the hero. Rebuild assets. Compare before/after screenshots.
- A2. **Turn the arm rig off by default** (keep the code behind a flag `ARM_RIG = false` in `Player.ts`) until a real separately drawn arm exists. Restore whole-body frames + `ART_MUZZLES`. Update the `arm-rig` smoke scenario to match.
- A3. **New animation method: cut-out rigs, not frame-by-frame AI images.** For each character, generate ONE clean master in a neutral pose with separable parts (torso, head, upper arm + gun, thighs, shins), or generate the parts as separate pieces on one sheet using the master as reference. Assemble in Phaser as a `Container` of part sprites and animate in code: run cycle by rotating thigh/shin parts (8 positions), breathing idle (1px torso bob), recoil, hurt flinch, death (parts fly off with gravity), jump-up and fall poses. Consistent by construction, and the gun arm rotates naturally to the aim (this replaces A2's flag). Rig data (part pivots) in `src/data/rigs.ts`. Start with **ROOK only**, show the owner, then VIPER and TITAN. If you prefer frame sheets instead, the minimum bar: generate the whole 8-frame run in ONE image from the master, then in the pipeline pin hip x and the feet baseline across frames and reject frames whose height differs by more than 6%.
- A4. **Enemies and bosses:** same cut-out approach for bosses (body + moving parts: rotor, claws, wings, cannon, glowing weak point). Small enemies: a 2-part rig (body + legs/wings) plus squash/stretch is enough. This replaces the "single still that rocks" code (`src/entities/Enemy.ts` around line 107). Add a procedural death for every enemy: split the sprite into 4-6 pieces that fly with gravity, plus the existing flash.
- A5. **Parallax:** generate each backdrop as 3 layers (sky, far, near) + a foreground silhouette strip at ~25% alpha; scroll factors about 0.1 / 0.3 / 0.6 / 1.2. City first. Backgrounds stay darker than characters (A1).
- A6. **Unify art:** in the pipeline, quantize every sprite to one shared palette (32-48 colours, stored as `art/palette.png`) so packs made in different batches match.

**B. Story system (code + data; design in STORY.md section 4)**
- B1. `src/data/story.ts`: per stage `briefing`, `comms` (triggers: x position, encounter start/end, boss HP %, first death, first shard), `bossIntro` / `bossMid` / `bossDefeat`, `choices`, and operator overrides `[V]` / `[T]`. Lines can have a flag condition. Suggested types: `Line { who: Speaker; text: string; op?: 'viper' | 'titan'; if?: Cond }` and `Choice { id; prompt: Line[]; options: { label; hint; set: Partial<Flags>; reply: Line[]; requires?: Cond }[]; timerMs?; defaultIndex? }`.
- B2. `run.flags` and `run.shards` in `src/systems/Run.ts` (reset on a new run, survive scene restarts). `save` keeps unlocked operators, endings seen and archive entries.
- B3. **Comms overlay** in `HudScene`: 48x48 portrait + text box bottom-left, typewriter, never pauses the game, queues lines; ARCHON lines get static/glitch.
- B4. **Briefing scene** `src/scenes/Briefing.ts` between stages, before `Perk`: two portraits, typewriter, hold to skip, choice cards (mouse, keys, gamepad). Flow becomes `Game` Ã¢â€ â€™ `Briefing` Ã¢â€ â€™ `Perk` Ã¢â€ â€™ next `Game`. Stage 1 also gets an opening briefing after Title.
- B5. **In-level choice overlay**: slow motion (time and physics at 0.2), 8 s timer, default = the less merciful option, triggered from stage data. Plus choice-by-action counters (eggs shot in stage 6, cage opened in stage 9).
- B6. **Data shards**: 3 per stage, placed in stage data (`shards: [x, y, loreId][]`), HUD counter, ARCHIVE screen on Title for the lore.
- B7. **Consequences as data**: `StageDef.variants?: { if: Cond; roamers?; encounters?; allies? }[]`; friendly NPC gunners (enemy defs with `ally: true` that target enemies); a collar ring drawn in code on hostile species, removed (blue outline) on allies.
- B8. **Endings**: `End` picks ASHES / DAWN / OPEN DOOR from flags; the results screen lists the choices made; `Credits` shows ending-specific epilogue slides; secret scene at 30+ shards. Unlock SERRIK / QUILL as operators when earned (their art must go through A3 first).
- B9. **Portraits** (64x64 busts, one consistent style): ROOK, VIPER, TITAN, JUNO, PATCH, THE CROUPIER, HALCYON, SERRIK, QUILL, TIDE SOVEREIGN, STATIC ORACLE. ARCHON's portrait is a red glyph drawn in code.

**C. Make each existing stage play differently** (gimmick per stage in STORY.md section 3)
New engine features, each a `StageDef` data field with its own smoke scenario: moving/swinging platforms; auto-scroll (horizontal for the train, vertical for lava and the Spire); rising hazard level (lava, water) with an optional cycle (tide); water zones (slow movement, floaty jumps, oxygen bar); gravity zones (low gravity; timed flip with a siren telegraph); darkness with a light radius (render-texture mask); beat-timed platforms; crystals that reflect beams; destroyable enemy spawners (slot machines). Give stages height too: shards on high platforms, alternate upper routes.

**D. Five new stages**: 3 Stormbreak Railyard, 5 Underworld Engine, 8 Tidal Vault, 10 Prism Wastes, 11 Lattice Spire. Railyard and Underworld Engine worlds and their bosses already exist in `art/library/frontier`; TIDE SOVEREIGN and PRISM REGENT boss art in `art/library/species`. New art needed: Tidal Vault, Prism Wastes and Lattice Spire backdrops (as parallax layers) and HALCYON (a rival operator, built with the A3 rig). Each new boss gets one signature attack (STORY.md). Bring every character through A3/A4 before it goes live. Insert the stages in the order of STORY.md section 3 and add `x-<id>` + `x-<id>-boss` smoke scenarios; update the `flow-stage-*` scenarios to 12.

**E. Final boss phase 3 + balance**
ARCHON phase 3 with the ally-help moments from STORY.md stage 12. Then write a simple bot that plays a stage without god mode (move right, shoot the nearest enemy, slide when a telegraph is close) and reports deaths per stage. Tune with it, then ask the owner to play stages 1-3 and give one sentence of feedback.

### Rules
- One agent at a time; update this file and commit at the end of every session.
- After A1-A3, stop and get the owner's opinion on the new ROOK before redoing every character.
- Content stays data (`src/data/*`). Every enemy attack still needs `telegraph()`. The slide stays invulnerable.
- Do not recreate existing games. The story in STORY.md is original; keep it that way.

### Verified this session
- Read the code, all stage data, the latest screenshots (`city-1`, `city-boss-1`, `arm-rig-0`, `arm-rig-2`, `flow-stage-4-0`) and the Frontier/species preview boards. No code changed, so no tests were run.

## Session 10 - 2026-11-15 (Claude Code, aimable arm + world polish + credits = campaign complete)

### Owner's definition of done
"All levels are built and once the final boss is dead the credits roll - that is the end." **This is now true in code:** 7 stages -> final boss ARCHON dies -> MISSION COMPLETE results -> **credits roll** (over a slideshow of every stage backdrop, lists each stage + boss defeated, run stats, tools, then THE END) -> Title.

### Changed this session
- **Aimable gun arm** (`src/systems/ArmRig.ts`, `Player.ts`). At boot each operator frame is cut into an armless body (`<art>_b_<pose>`) and a rotating arm+gun sprite (`<art>_a_<pose>`) with a shoulder pivot found by pixel analysis. The arm points at the mouse crosshair (or the last shot direction on keyboard/gamepad), has recoil kick, and the muzzle is computed from the arm tip, so shots leave the barrel. Works for ROOK, VIPER, TITAN with no new art. Texture keys changed: Player now shows `hero_b_idle` etc. (smoke asserts updated). Left-facing steep angles look slightly stubby - a proper redrawn gun arm would still be better.
- **World:** per-stage floor + girder tiles (`ground_<id>`, `plat_<id>` in `Boot.makeStageTiles`), floor/girder light spill, two drifting fog layers, flickering street lamps in the city.
- **Combat feel:** enemies now tumble, flash white and fade when killed (`GameScene.corpse`); hero squash/stretch on jump and landing.
- **Credits scene** (`src/scenes/Credits.ts`, registered in `main.ts`; `End` now leads to it). Hold fire/jump to speed up. Put real names in the `CREATOR` array at the top of the file.
- Smoke: new `arm-rig` scenario; `flow-stage-7` now runs through credits to Title. **Full suite: 32/32 pass.**

### Still unverified / honest limits
- No stage has been completed by a human at normal health; balance is a first guess (see Session 6 list). The only end-to-end run is the forced boss-kill flow. A bot that plays stage 1 without god mode would be the best next tool.
- Still no shoot/hit/death animation frames for heroes and no parallax layers (backdrops are flat images). The species/Frontier/expansion art libraries are still parked per the Session 8 content freeze.
- The credits text names no people (generic placeholder).

### Next
1. Owner plays stage 1 to the end and gives one sentence of feedback.
2. Normal-health tuning of stage 1, then stages 2-7 (HP, fire rates, encounter sizes, boss fairness).
3. Redraw ROOK gun arm / death frames when image generation is available; integrate a few species from `art/library/species` afterwards.

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

## Session 8 - 2026-11-15 (Claude Code, owner playtest feedback + quality audit) Ã¢â‚¬â€ READ THIS FIRST

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
5. **Breadth before quality.** 7 stages, 28+ enemies, 13 weapons, 7 bosses, plus two unused packs (Frontier, 26 designs; `art/source/species/`, untracked, origin unknown to this session) Ã¢â‚¬â€ and no stage has ever been completed at normal health. `docs/ROADMAP.md` Milestone 1 ("stage 1 only, perfect") was skipped.
6. All sound is synthesised. Acceptable for now; revisit after the visuals.

### Tech stack decision: keep it
Phaser 3 + TypeScript + Vite is not what makes the game look bad, and it is not limiting anything on the list above. The code is small (~3,000 lines), data-driven and covered by an automated browser playthrough that AI agents can run unattended; a move to Godot or Unity would throw that away and fix none of the six points. Worth doing inside the current stack when the time comes: pack sprites into texture atlases (the game currently downloads ~170 separate PNGs), describe animations in data (frame lists + per-frame pivots) instead of hard-coded `_run0..3` names, and wrap with Tauri/Electron for Steam.

### Rules for the next sessions (both agents)
- **Content freeze.** No new stages, enemies, weapons, bosses or asset packs until stage 1 (city) is finished to shipping quality. Do not integrate Frontier or species art yet.
- One agent works at a time; commit at the end of each session.
- Lock an art style before generating anything: one reference sheet (ROOK), one palette, one pixel density (hero about 56px tall on the 640x360 screen), every new sheet generated against that reference.
- Every session ends with something the owner can play and judge at `npm run dev`. Ask them for one sentence of feedback; it is the only real test this project has had.

### Next tasks, in order
1. **Hero rebuild, ROOK only** (needs image generation Ã¢â‚¬â€ Codex has it, this Claude session did not): gun-arm-less body frames Ã¢â‚¬â€ idle x4, run x8, jump-up, fall, land, slide, crouch, hurt, death x6 Ã¢â‚¬â€ plus one separate arm+gun sprite pointing right. Then code: arm sprite child rotating to `GameScene.aim` (or the auto-aim angle), shoulder pivots per pose, muzzle derived from the arm, recoil kick on the arm.
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

### Owner direction Ã¢â‚¬â€ read this first
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

## Session 1 Ã¢â‚¬â€ 2026-11-15 (Claude Code)

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
- NOT YET VERIFIED: everything after the first seconds of stage 1 Ã¢â‚¬â€ encounters, all three bosses, perk screen, death/retry, victory. The code is written but has not been played or screenshotted. Expect bugs and balance problems.
- Known noise: two 404s logged on the title page (likely favicon + one more). Find and fix; the smoke test treats console errors as failures.

### Next tasks, in order
1. Run `npm run smoke`, read every screenshot in `tools/shots/`, fix crashes and visual problems (sprite facing, muzzle position, HUD overlap, readability against backgrounds, bloom strength in `Game.ts` camera postFX).
2. Play each boss with `?stage=N&boss=1` (without `god`) and tune fairness: every attack must be dodgeable by jump, crouch or slide.
3. Balance pass on `src/data/*` (enemy hp, fire rates, encounter sizes) Ã¢â‚¬â€ target 4-6 minutes per stage, first clear of the game in under an hour for a new player.
4. Real art for stand-in characters: gangster, zombie, brute, alien, demon, operators VIPER and TITAN, boss sheets. Prompts are in `docs/ART_PIPELINE.md`; the owner generates them in ChatGPT and drops them in `art/source/`.
5. Then follow `docs/ROADMAP.md`.

### Decisions made (and why)
- Web stack instead of Godot/Unity: AI agents can build, run and screenshot it unattended; ships to itch.io as-is and to Steam through an Electron/Tauri wrapper.
- Synthesised audio: zero licensing risk, zero files. Replaceable later with recorded tracks.
- Hero art only aims forward, so shots auto-bend toward targets in a forward cone (`playerFire` in `Game.ts`) instead of 8-way aiming.
- Baked 1px outlines (cyan for heroes, red for enemies) because the dark AI sprites vanished on dark backgrounds.
- "Addictive" is pursued through game feel, combos, builds and fast retry Ã¢â‚¬â€ no dark patterns, no monetisation hooks.
