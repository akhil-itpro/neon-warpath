# NEON WARPATH — Game Design Document

## Pitch
A lone operator tears through a city sold out to a rogue AI: gangsters in the streets, the undead in the foundries, aliens and demons in the server cathedral. 80s action-movie power fantasy as a tight, loud, pixel-art run-and-gun with roguelite builds.

Audience: players of fast 2D action games on PC (Steam/itch.io), gamepad or keyboard. Session length 15-40 minutes.

## Pillars (use these to settle every design argument)
1. **Power you can feel.** Every shot, hit and kill answers with light, sound, shake and hit-stop.
2. **Fair but brutal.** Every attack is telegraphed and avoidable with jump, crouch or slide. Deaths feel like the player's mistake; retry is instant.
3. **Always moving forward.** No backtracking, no menus mid-action, no waiting.
4. **One more run.** Combos, ranks, perks and operators make each attempt different.

## Core loop
- Second to second: move, slide through danger, shoot, grab chips.
- Minute to minute: roam → camera locks → survive waves → "GO" → next arena → boss.
- Run to run: pick a perk after each stage, chase score/rank, try another operator.

## What keeps players coming back (healthy retention, no dark patterns)
- Combo multiplier (x1-x8) that decays in 3.6s and resets on damage: rewards aggression.
- Overdrive meter filled by kills: a 6.5s super that also wipes enemy bullets (a comeback button).
- Perk choice of 3 after each stage: builds and synergies.
- Checkpoints at every cleared arena and at the boss door; death costs 20% score, never progress.
- End rank (S/A/B/C) and best score saved locally.
- Planned: daily seeded run, unlockable operators and weapons, hard mode, boss rush, online leaderboards.

## Controls
Move A/D or arrows · Jump Space/W · Crouch S · Fire J/X/mouse · Slide Shift/K/right-click · Overdrive Q · Pause Esc · Mute M. Gamepad: stick, A jump, X/RT fire, B/RB slide, Y overdrive.

## Player kit
- Slide: 0.3s, fast, fully invulnerable, skims over hazards, 0.65s cooldown. The signature move.
- Crouch: ducks under high shots and the gunship's low pass.
- Down+Jump drops through girders.
- Weapons: SIDEARM (infinite), RIPPER smg, BREACHER shotgun, RAILSPIKE piercing, HELLFIRE rockets.

## Operators
| Name | Role | Notes | Art |
|---|---|---|---|
| ROOK | Assault | balanced | done |
| VIPER | Infiltrator (female lead) | fast, fragile, high fire rate | stand-in tint — needs sheet |
| TITAN | Heavy | slow, tanky, high damage | stand-in tint — needs sheet |

Female characters are leads and rivals with their own strength and style (confident, athletic, striking), designed to be as cool as the men rather than decoration.

## Factions and enemies
| Faction | Units | Behaviour | Art |
|---|---|---|---|
| Machine Legion | Trooper, Enforcer, Seeker Drone, Burner Drone, Sentry Cannon, Razor Jet | ranged, bursts, dive-bombs, strafing runs | done |
| Syndicate (gangsters) | Gunman | fast, close-range bursts | four-frame walk sheet integrated |
| Undead | Furnace Ghoul, Ghoul Brute | rush and lunge in packs | four-frame walk sheets integrated |
| Aliens | Void Stalker | teleports, 3-way plasma | four-frame hover sheet integrated |
| Underworld (demons) | Ash Imp | lobs arcing fireballs | four-frame wingbeat sheet integrated |

Planned: Syndicate biker and femme-fatale lieutenant (mini-boss), zombie spitter, alien brood-mother, demon knight, underworld and alien-hive stages.

All three bosses now have dedicated processed sprites (VULTURE, WARDEN, ARCHON). Their attack patterns remain the existing implementation.

## Stages
1. **NEON MIDNIGHT** — rooftops in the rain; gangsters + machines. Boss: VULTURE GUNSHIP (gun strafes, bullet fans, low pass you must duck).
2. **FURNACE DISTRICT** — lava floors; zombies + demons. Boss: FURNACE WARDEN (high/low shot rows, mortars, zombie waves).
3. **SERVER CATHEDRAL** — electric floors; aliens + elites. Boss: ARCHON CORE (rings, spirals, aimed bursts, reinforcements).

Planned stages 4-6: Syndicate Casino, The Underworld, Alien Hive / orbital finale.

## Tone and look
Dark steel, neon rim light, rain, embers. Heavy weapons, big explosions, short one-liners. No gore beyond sparks and coloured splatter. Internal resolution 640x360; characters about 66px tall.

## Out of scope (for now)
Multiplayer, story cutscenes, mobile touch controls, monetisation.
