# AGENTS.md (for Codex and any other AI coding agent)

This project is developed mainly with Claude Code; you are covering for it. Work the same way:

1. Read `CLAUDE.md` (commands, architecture, gotchas) — it is the source of truth for how this repo works.
2. Read `docs/HANDOFF.md` (current state, verified vs. unverified, prioritised next tasks).
3. Skim `docs/GDD.md` before changing gameplay and `docs/ART_PIPELINE.md` before touching art.

Rules:
- The owner is non-technical. Decide for them, explain results in plain language, never ask them to edit code.
- After every change run `npm run check`; for gameplay changes run `npm run smoke` and look at `tools/shots/*.png`.
- Commit small, working steps to git with clear messages. Never commit a build that fails `npm run check`.
- Before you stop, update `docs/HANDOFF.md`: what you did, what is unverified, what is next.
- Keep content in `src/data/*`; do not hardcode stage/enemy numbers inside scenes.
