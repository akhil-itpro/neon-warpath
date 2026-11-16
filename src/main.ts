import Phaser from 'phaser';
import '@fontsource/press-start-2p';
import { W, H, GRAVITY } from './config';
import { BootScene } from './scenes/Boot';
import { TitleScene } from './scenes/Title';
import { GameScene } from './scenes/Game';
import { HudScene } from './scenes/Hud';
import { PerkScene } from './scenes/Perk';
import { EndScene } from './scenes/End';
import { CreditsScene } from './scenes/Credits';
import { BriefingScene } from './scenes/Briefing';
import { ArchiveScene } from './scenes/Archive';
import { OptionsScene } from './scenes/Options';

async function start() {
  // Canvas text is drawn once and cached, so the pixel font must be ready before any scene runs.
  try { await document.fonts.load('8px "Press Start 2P"'); } catch { /* fall back to default font */ }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: '#05060a',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: GRAVITY }, debug: false } },
    input: { gamepad: true },
    scene: [BootScene, TitleScene, GameScene, HudScene, BriefingScene, PerkScene, EndScene, CreditsScene, ArchiveScene, OptionsScene],
  });
  (window as any).__game = game; // handle for tools/smoke.mjs and console debugging
}

void start();
