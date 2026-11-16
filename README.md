# NEON WARPATH (working title)

Pixel-art run-and-gun action game. TypeScript + Phaser 3 + Vite.

## Play it
1. Install Node.js (already installed on the dev machine).
2. In this folder run `npm install` once, then `npm run dev`.
3. Open http://localhost:5173

Controls: A/D move · Space double jump · S crouch · J fire · Shift slide · Q overdrive · Esc pause · M mute.

Every character has a rechargeable skill. ROOK has a three-second shield; VIPER phases, TITAN blasts, SERRIK heals and QUILL launches into a glide. Gamepad: A double jump, LT skill, Y overdrive.

The game autosaves combat checkpoints, story briefings and perk screens in this browser. Press **R** on the title screen to continue. In the pause menu, **T** saves and returns to the title; it resumes from your last combat checkpoint, not your exact position. Starting a new run replaces that campaign save. Debug stage links never overwrite your campaign.

Press **O** on the title or pause screen for music/effects volume, camera shake and full-screen flash settings. Gamepad: View/Back opens options from Title; Y opens them from Pause; Start continues a saved run from Title. Options persist on this device. Attack warnings still animate with screen flashes disabled.

## Build and verification

`npm run check` checks types. `npm run smoke` exercises the campaign and saves screenshots in `tools/shots/`. `npm run build` creates the web build in `dist/`. Serve it with `npm run preview`; opening `index.html` directly as a local file is not supported.

## Docs
- `docs/HANDOFF.md` — current state and next steps (start here)
- `docs/GDD.md` — game design
- `docs/ART_PIPELINE.md` — how to add art (with ChatGPT prompts)
- `docs/ROADMAP.md` — path to release
- `CLAUDE.md` / `AGENTS.md` — instructions for AI coding agents
