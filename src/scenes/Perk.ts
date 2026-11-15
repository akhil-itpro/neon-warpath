import Phaser from 'phaser';
import { W, H, FONT } from '../config';
import { run, PERKS, PerkDef } from '../systems/Run';
import { STAGES } from '../data/stages';
import { audio } from '../systems/Audio';
import { Controls } from '../systems/Controls';

// Between stages: pick 1 of 3 upgrades. This is the "build" layer that makes every run different.
export class PerkScene extends Phaser.Scene {
  private controls!: Controls;
  private picks: PerkDef[] = [];
  private cards: Phaser.GameObjects.Container[] = [];
  private sel = 1;
  private done = false;

  constructor() { super('Perk'); }

  private txt(x: number, y: number, s: string, size = 8, color = '#ffffff', wrap = 0) {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 3, align: 'center', wordWrap: wrap ? { width: wrap } : undefined, lineSpacing: 4 }).setOrigin(0.5);
  }

  create() {
    this.done = false; this.sel = 1; this.cards = [];
    this.controls = new Controls(this);
    const next = STAGES[run.stage];
    this.add.tileSprite(0, 0, W, H, next.bg).setOrigin(0).setTint(0x30344a);
    this.txt(W / 2, 40, 'FIELD UPGRADE', 24, '#ffd040');
    this.txt(W / 2, 66, 'CHOOSE ONE', 8, '#c0c8d8');
    if (this.textures.exists('npc_patch')) {
      const patch = this.add.image(58, H - 2, 'npc_patch').setOrigin(0.5, 1);
      this.tweens.add({ targets: patch, scaleY: 1.03, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const lines = ['PATCH: PICK ONE, HOTSHOT.', 'PATCH: ALL SALES FINAL.', 'PATCH: TRY NOT TO BREAK IT.', 'PATCH: I FIXED IT. MOSTLY.'];
      this.txt(118, H - 46, Phaser.Utils.Array.GetRandom(lines), 8, '#ffd040').setOrigin(0, 0.5);
    }
    this.txt(W / 2, H - 22, `NEXT: STAGE ${run.stage + 1} - ${next.name}`, 8, '#9fe8ff');

    this.picks = Phaser.Utils.Array.Shuffle(PERKS.filter((p) => !run.perks.includes(p.id))).slice(0, 3);
    this.picks.forEach((p, i) => {
      const x = W / 2 + (i - 1) * 190;
      const g = this.add.graphics();
      g.fillStyle(0x0c1018, 0.92).fillRect(-82, -80, 164, 160);
      g.lineStyle(2, 0x40e0ff).strokeRect(-82, -80, 164, 160);
      g.fillStyle(0x40e0ff, 0.2).fillRect(-82, -80, 164, 30);
      const card = this.add.container(x, 185, [g, this.txt(0, -64, `0${i + 1}`, 8, '#40e0ff'), this.txt(0, -20, p.name, 8, '#ffffff', 150), this.txt(0, 30, p.desc, 8, '#ffd040', 150)]);
      this.cards.push(card);
    });
    this.cameras.main.fadeIn(300);
    this.highlight();
  }

  private highlight() {
    this.cards.forEach((c, i) => { c.setScale(i === this.sel ? 1.08 : 0.94).setAlpha(i === this.sel ? 1 : 0.55); });
  }

  update() {
    const c = this.controls;
    c.poll();
    if (this.done) return;
    const move = (c.pressed('right') ? 1 : 0) - (c.pressed('left') ? 1 : 0);
    if (move) { this.sel = Phaser.Math.Clamp(this.sel + move, 0, this.picks.length - 1); this.highlight(); audio.sfx('ui'); }
    if (c.pressed('fire') || c.pressed('jump')) {
      this.done = true;
      const p = this.picks[this.sel];
      p.apply(run.stats);
      run.perks.push(p.id);
      if (p.id === 'plating') run.hp = run.stats.maxHp;
      audio.sfx('weapon');
      this.tweens.add({ targets: this.cards[this.sel], scale: 1.3, alpha: 0, duration: 350 });
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(420, () => this.scene.start('Game'));
    }
  }
}
