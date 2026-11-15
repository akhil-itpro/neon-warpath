import Phaser from 'phaser';
import { W, H, FONT } from '../config';
import { run, save, persist } from '../systems/Run';
import { audio } from '../systems/Audio';
import { Controls } from '../systems/Controls';
import { LORE } from '../data/story';

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
    // Ending from the story flags (docs/STORY.md section 4). OPEN DOOR needs the Tide Pearl / Halcyon
    // choices of stages that are not built yet, so the 7-stage campaign ends in ASHES or DAWN.
    const mercy = [run.flags.nest_truce === true, run.flags.heard_oracle === true, run.flags.ledger === 'leak'].filter(Boolean).length;
    const ending = mercy === 0
      ? { name: 'ASHES', color: '#ff8060', text: `THE CITY IS SAFE, AND DARK. JUNO: "WE WON. DIDN'T WE?"` }
      : { name: 'DAWN', color: '#80ffb0', text: 'ARCHON IS GONE. VANTAGE STARTS TO REBUILD.' };
    if (!save.endings.includes(ending.name)) { save.endings.push(ending.name); persist(); }
    t(44, 'MISSION COMPLETE', 32, '#80ffb0');
    t(76, `ENDING: ${ending.name}`, 16, ending.color);
    t(96, ending.text, 8, '#c0c8d8');
    t(124, `FINAL SCORE  ${run.score}`, 16, '#ffd040');
    if (record) t(142, 'NEW RECORD', 8, '#ff6050');
    const rank = run.deaths === 0 ? 'S' : run.deaths <= 2 ? 'A' : run.deaths <= 5 ? 'B' : 'C';
    t(162, `OPERATOR  ${run.op.name}     RANK ${rank}`, 8, rank === 'S' ? '#ffd040' : '#ffffff');
    t(176, `KILLS  ${run.kills}     BEST COMBO  ${run.maxCombo}     DEATHS  ${run.deaths}`);
    t(190, `DATA SHARDS  ${run.shards.length} / ${LORE.length}`, 8, '#ff90e0');
    if (run.choices.length) {
      t(212, 'YOUR CHOICES', 8, '#9fe8ff');
      run.choices.slice(0, 6).forEach((c, i) => t(226 + i * 13, c, 8, '#e0e4f0'));
    }
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
