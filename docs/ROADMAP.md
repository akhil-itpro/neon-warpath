# Roadmap

Current implementation status (2026-11-16); detailed evidence is in HANDOFF.md.

## Playable campaign - implemented, release playtesting pending

- Twelve stages and bosses, interactive choices, three endings, HOLD survival finale.
- Five operators with double jump, distinct rechargeable skills, weapon drops and perk builds.
- Browser checkpoint save/continue; music/effects, shake and full-screen flash options.
- Painted worlds, operator/enemy art, HALCYON's own animation, campaign props and cast portraits.
- Automated browser coverage of every stage/boss and story flow. Smoke tests do not establish
  normal-health beatability or replace a full human playthrough.

## Release gates

1. Play the complete campaign at normal health with several outside testers. Focus on the Widow,
   Regent, Abyss and late stages; the new defensive skills need balance feedback.
2. Check physical gamepads, audio mix, low-end performance and keyboard/mouse comfort.
3. Decide whether to retain the implemented horizontal Spire and local lava section or build the
   vertical camera/levels described in STORY. The vertical versions are not implemented.
4. Add control remapping and fuller reduced-motion support. Current screen-flash setting suppresses
   camera and damage flashes; attack warnings still animate.
5. Final title/credits, store presentation, distribution testing and platform packaging.

## Optional polish after release gates

- Review ROOK's part rig before extending the approach to all operators/bosses.
- More parallax depth, palette unification and richer boss breakup animations.
- Boss rush, hard mode, daily runs, achievements, localisation or leaderboards only after the core
  campaign is comfortable to finish. No new content volume is needed before playtesting.

See README for running the game and docs/ART_PIPELINE.md for reproducible asset processing.
