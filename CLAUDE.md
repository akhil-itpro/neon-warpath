# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Read `docs/HANDOFF.md` first** — it holds the current state, what is verified vs. unverified, and the next tasks. Update it at the end of every session. `AGENTS.md` points other AI agents (Codex etc.) here; keep this file the single source of truth.

## Project

NEON WARPATH (working title): a 2D pixel-art run-and-gun action game for PC/web. Side-scrolling stages, wave encounters with camera locks, a boss per stage, a perk pick between stages. The owner is a non-technical first-time indie developer: make design and technical decisions yourself, explain outcomes in plain language, and never ask them to edit code.

Stack: TypeScript + Phaser 3.90 (Arcade physics) + Vite. Internal resolution 640x360, scaled up. No audio files — all SFX and music are synthesised in `src/systems/Audio.ts`.

## Commands

```bash
npm run dev      # play at http://localhost:5173 (hot reload)
npm run check    # typecheck (tsc --noEmit) — run after every change
npm run build    # typecheck + production build to dist/ (zip dist/ for itch.io)
npm run assets   # python tools/process_assets.py --preview : rebuild public/assets from art/source
npm run smoke    # headless playthrough of every stage/boss in system Chrome/Edge; screenshots -> tools/shots/
npm run smoke -- city-boss   # one scenario (substring match on the names in tools/smoke.mjs)
```

There is no unit-test suite. Verification = `npm run check` + `npm run smoke` + **looking at the screenshots in `tools/shots/`** (read them as images). Add a scenario to `tools/smoke.mjs` when you add a stage or boss.

Debug URL params (handled in `src/scenes/Boot.ts`): `?stage=2` start on stage 2, `&boss=1` jump to the boss, `&god=1` near-unkillable, `&op=1` operator index, `&weapon=rocket`. Console handles: `window.__game`, `window.__run`.

Python deps for the asset pipeline: `pip install pillow numpy scipy "rembg[cpu]"`.

## Architecture

**Content is data, behaviour is code.** Adding content should rarely need engine changes:

- `src/data/stages.ts` — stage layouts: platforms, hazards, roaming enemies, encounters (wave lists), boss id, music track.
- `src/data/enemies.ts` — enemy roster. Each entry picks an `ai` kind; the AI kinds are implemented in the `switch` in `src/entities/Enemy.ts` (bosses are the `heli` / `warden` / `core` methods there).
- `src/data/weapons.ts`, `src/data/operators.ts` (playable characters), perks in `src/systems/Run.ts`.

**Scene flow:** `Boot` (loads `public/assets/manifest.json`, draws procedural textures) → `Title` (operator select) → `Game` + `Hud` in parallel → `Perk` (pick 1 of 3) → next `Game` … → `End`.

**`GameScene` is the hub.** Entities never touch each other; they call the scene: `enemyShot`, `spawnEnemy`, `killEnemy`, `hurtPlayer`, `blastPlayer`, `telegraph`, `banner`. The scene owns collisions, encounters/camera locks, scoring/combo, pickups, checkpoints. `HudScene` is a separate scene so the HUD is unaffected by camera bloom/shake; `GameScene` calls its methods with `?.` because the HUD starts one frame later.

**`run` (`src/systems/Run.ts`)** is the single mutable state of a playthrough (score, hp, weapon, perks, stats, checkpoint) and survives scene restarts. `save` is the localStorage record.

**Art fallback convention (important).** Enemies and operators name a preferred texture (`art`). If `public/assets` has `<art>_0.png…` (animation) or `<art>.png` it is used; otherwise a tinted stand-in sprite. So gangsters/zombies/aliens/demons/extra operators are already playable with stand-ins and upgrade automatically once real art is processed. Operators need `<art>_run0..3, _idle, _jump, _slide, _crouch`. See `docs/ART_PIPELINE.md`.

**Asset pipeline.** Raw AI sheets live in `art/source/` (never edit them). `tools/process_assets.py` removes backgrounds (chroma key if flat colour, else `rembg` per grid cell), finds sprites, downsizes to game pixels, bakes a 1px team-coloured outline, and writes `public/assets/*.png` + `manifest.json`. New sheets need a `MANIFEST` entry in that script. Enemy source sprites face LEFT, hero faces RIGHT.

## Gotchas

- Scenes are reused on restart: reset every field in `create()`, not in property initialisers.
- Never add enemies/pickups to a Phaser physics **Group** — group defaults overwrite body settings (gravity, velocity). They live in plain arrays (`enemies`, `pickups`) passed to colliders; mark `dead`/`taken` and let `update()` sweep them (never splice during a collision callback).
- Overlap callbacks may receive arguments in either order; use `instanceof` as existing callbacks do.
- Projectiles are pooled `Shot` objects in groups with `runChildUpdate`; always `shot.kill()`, never `destroy()`.
- Hit-stop pauses the physics world via `fx.hitstop(ms)`; `GameScene.update` early-outs while `fx.frozen()`.
- Design rules that must hold (see `docs/GDD.md`): every enemy attack is telegraphed (`telegraph()`); every hit/kill gets feedback through `Fx`; the slide is invulnerable; movement constants at the top of `src/entities/Player.ts` define the game feel — change only with playtesting.
- Do not recreate specific existing games (names, characters, levels, look). Genre mechanics are fine.
