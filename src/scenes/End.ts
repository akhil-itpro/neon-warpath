import Phaser from 'phaser';
import { W, H, FONT } from '../config';
import { run, save, persist } from '../systems/Run';
import { audio } from '../systems/Audio';
import { Controls } from '../systems/Controls';

// Victory screen after the last stage.
export class EndScene extends Phaser.Scene {
  private controls!: Controls;
  private ready = false;

  constructor() { super('End'); }

  create() {
    this.ready = false;
    this.controls = new Controls(this);
    audio.playMusic(null);
    const record = run.score >= save.best;
    save.best = Math.max(save.best, run.score);
    persist();
    this.add.tileSprite(0, 0, W, H, 'bg_cathedral').setOrigin(0).setTint(0x404860);
    const t = (y: number, s: string, size = 8, color = '#ffffff') =>
      this.add.text(W / 2, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: size >= 16 ? 6 : 3 }).setOrigin(0.5);
    t(60, 'MISSION COMPLETE', 32, '#80ffb0');
    t(96, 'ARCHON IS SILENT. THE CITY IS YOURS.', 8, '#c0c8d8');
    t(140, `FINAL SCORE  ${run.score}`, 16, '#ffd040');
    if (record) t(162, 'NEW RECORD', 8, '#ff6050');
    t(190, `OPERATOR  ${run.op.name}`);
    t(206, `KILLS  ${run.kills}     BEST COMBO  ${run.maxCombo}     DEATHS  ${run.deaths}`);
    const rank = run.deaths === 0 ? 'S' : run.deaths <= 2 ? 'A' : run.deaths <= 5 ? 'B' : 'C';
    t(246, `RANK ${rank}`, 32, rank === 'S' ? '#ffd040' : '#ffffff');
    const press = t(320, 'PRESS FIRE FOR THE CREDITS');
    this.tweens.add({ targets: press, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
    this.cameras.main.fadeIn(500);
    audio.sfx('clear');
    this.time.delayedCall(1200, () => (this.ready = true));
  }

  update() {
    this.controls.poll();
    if (this.ready && (this.controls.pressed('fire') || this.controls.pressed('jump'))) this.scene.start('Credits');
  }
}
