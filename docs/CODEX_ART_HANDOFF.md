# CODEX ART HANDOFF — images still needed for the 12-stage game

Written 2026-11-16 (Claude Code, Session 14). The full 12-stage campaign is now playable end to end in code.
Everything below already has a **stand-in** in the game, so nothing is blocked; each item makes the game look
finished. Work top to bottom. Read `CLAUDE.md` and `docs/ART_PIPELINE.md` first.

## How to install any image (same for every item)

1. Keep the raw generated sheet in `art/source/` (never edit it) and save the exact prompt next to it, as before.
2. Produce the game-sized PNG at `public/assets/<key>.png` (transparent background for sprites, RGB for backdrops).
3. Add `<key>` to the `images` list in `public/assets/manifest.json`. The game loads every key in that list.
4. Easiest route: add a line to `JOBS` in `tools/integrate_campaign.py` (copies library sprites and swaps the outline)
   or to `JOBS` in `tools/integrate_expansion.py` (cuts from a high-resolution master at a given height), then run it.
5. Outline rule (Session 12 A1): enemies, bosses and props get a near-black 1 px outline `#0b0d14`
   (`ENEMY_OUTLINE`); operators get the muted cool rim `HERO_OUTLINE` (83,125,145). No red outlines.
6. Facing rule: enemy and boss source sprites face **LEFT**; operators (including HALCYON) face **RIGHT**.
7. Verify: `npm.cmd run check`, then the named smoke scenario, then **look at** `tools/shots/<scenario>-*.png`.

The code picks the real art automatically once the key exists (stand-ins are only used when it is missing).

## 1. Three world backdrops (highest impact)

**Completed 2026-11-16 (Codex):** all three PNGs are live. Immutable sources and exact prompts are in
`art/source/campaign_worlds/`; rebuild with `python -B tools/process_campaign_worlds.py`. The outputs are
1280 x 360 RGB mirrored strips, following the existing world pipeline. Separate parallax layers remain optional.
`Boot.makeBackdrops` retains procedural fallbacks for missing PNGs. **Next art priority: HALCYON (section 2).**

| Key | World | Look | Smoke to check |
|---|---|---|---|
| `bg_tidal` | THE TIDAL VAULT (stage 8) | Underwater throne room built by shell people: tall carved shell pillars, god-rays from far above, teal and deep blue, bioluminescent dots. | `x-tidal`, `gim-water` |
| `bg_prism` | PRISM WASTES (stage 10) | The alien world on the far side of the Rift: grey-violet crystal spires, a pale dying sun, drained colours ("it used to be green"), a few faint green remnants. | `x-prism`, `gim-pylon` |
| `bg_spire` | THE LATTICE SPIRE (stage 11) | A data tower above the clouds at night: lattice girders, server towers with blinking red and violet lights, stars. | `x-spire`, `gim-chase` |

- Size **1280 x 360**, must tile seamlessly left-to-right (it scrolls). Same painted-pixel style as `public/assets/bg_city.png`.
- Keep the lower 60 px dark and plain: the floor strip is drawn on top of it. Keep everything **darker and less
  saturated than the characters** (the game also darkens it by 32%).
- Optional later (A5): each world as 3 parallax layers (`bg_<id>_sky`, `_far`, `_near`) plus a foreground strip. That
  needs a small code change; ask Claude.

## 2. HALCYON — the rival operator / stage 11 boss

Today HALCYON borrows the Frontier operator KESTREL's frames (`public/assets/halcyon_*.png`, copied by
`tools/integrate_campaign.py`). Story: male squad commander in his 50s, grey crew cut, a cybernetic eye with a scar,
neural jack at the neck, long dark combat coat over armour, gold commander pips, a rifle. Warm, tired face.

- Eight poses on a **96 x 72** canvas each, feet on the bottom edge, facing **RIGHT**, same pixel density as ROOK
  (about 56 px tall): `halcyon_run0`, `halcyon_run1`, `halcyon_run2`, `halcyon_run3`, `halcyon_idle`, `halcyon_jump`,
  `halcyon_slide`, `halcyon_crouch`. Generate the whole run in ONE image from one master (Session 11 audit: separate
  generations drift). Remove the KESTREL lines for `halcyon_*` from `tools/integrate_campaign.py` when you add these.
- Best option: an eight-part cut-out rig like ROOK (`art/source/rigs/`, `src/data/rigs.ts`); then tell Claude so the
  boss can use `CharacterRig`.
- Check with `npm.cmd run smoke -- story-halcyon` and `x-spire-boss`.

## 3. Three props (small, quick)

| Key | What | Size (game px) | Stand-in today | Smoke |
|---|---|---|---|---|
| `quill_cage` | A hanging bird cage / cell with a glowing red lock. QUILL (a crow-like Corvane scout) visible inside. | about 40 x 56 | tinted ammo locker | `story-cage` |
| `prism_pylon` | A crystal pylon on a stone base, cyan facets, that bends light beams. | about 28 x 64 | tinted rift anchor | `gim-pylon` |
| `slot_machine` | A tall neon casino slot machine with a gun-barrel coin slot, pink and gold. Faces LEFT. | about 36 x 64 | tinted street terminal | `gim-roulette` |

Neutral prop outline is fine for these (`GREY` in `integrate_expansion.py`), or `#0b0d14`.

## 4. Portraits (comms panel + briefings)

Procedural 48 x 48 busts are drawn in `Boot.makePortraits`. Replace with **64 x 64** painted-pixel busts in one
consistent style, shoulders up, facing slightly right, plain dark background with a thin coloured rim.

Keys: `portrait_rook`, `portrait_viper`, `portrait_titan`, `portrait_serrik`, `portrait_quill` (the operators),
`portrait_juno`, `portrait_patch`, `portrait_croupier`, `portrait_oracle`, `portrait_myrrhkin`, `portrait_sovereign`,
`portrait_halcyon`. ARCHON stays a code glyph (`portrait_archon`, do not replace).

To swap: just add the PNG (any size, square) and its manifest key. The code already skips the procedural bust when the texture exists and scales portraits to 48 px (HUD) and 96 px (Briefing).
Character notes are in `docs/STORY.md` section 2. Check with `story-comms` and `title`.

## 5. Animation rigs still on the old method (A3/A4)

- **VIPER and TITAN**: eight-part rigs like ROOK. The owner has still not reviewed ROOK; ask first if possible.
- **SERRIK and QUILL** (now unlockable operators): they use the species library's four-frame stills
  (`public/assets/serrik_*`, `quill_*`). Rigs would make them match ROOK.
- **Bosses (A4)**: the four new bosses already have four state pictures each (idle / windup / attack / exposed) and the
  code switches between them (`Enemy.stateArt`). Part rigs (rotor, claws, wings, cannon, weak point) would still look better.

## 6. Nice to have

- A5 parallax layers for all 12 worlds (see 1).
- A6 shared palette (`art/palette.png`, 32 to 48 colours) and a pass that quantises every sprite to it.
- Stage-specific floor/girder tiles are drawn in code (`Boot.makeStageTiles`); painted 32 x 40 floor and 32 x 12
  girder tiles per stage (`ground_<id>`, `plat_<id>`) would replace them if added to the manifest (code change: skip the
  canvas when the texture exists).

## What NOT to make

No audio (all sound is synthesised). No new enemies or weapons. Do not recreate existing games' characters or levels.
