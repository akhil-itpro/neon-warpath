# Campaign world backdrops

Original artwork generated with the built-in `image_gen` tool on 2026-11-16.
The unmodified outputs and exact prompts (`manifest.json`) are retained here.

- `bg_tidal.png`: ancient underwater shell throne room.
- `bg_prism.png`: depleted grey-violet crystal world.
- `bg_spire.png`: lattice data tower above the clouds at night.

Rebuild from the project root:

```powershell
python -B tools/process_campaign_worlds.py
npm.cmd run check
```

The processor follows the existing world pipeline: 640x360 image, 160 colours,
mirrored to 1280x360 for exact left/right and centre seam continuity. The raw
sources remain unchanged. Outputs go to `public/assets/`; preview goes to the
ignored `art/preview/campaign-worlds.png`. The live asset manifest receives only
these three additional keys and retains all other registrations.

These are flattened scrolling backdrops. They do not add separate parallax
layers or change stage layout, physics, collision, enemies or stage tint.
Boot automatically skips its procedural stand-ins when these keys are loaded.

Verify in the live campaign with `npm.cmd run smoke -- gim-water`, `gim-pylon`
and `gim-chase`, and inspect their screenshots in `tools/shots/`.
