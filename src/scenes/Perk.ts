import Phaser from 'phaser';
import { W, H, FONT } from '../config';
import { run, PERKS, PerkDef } from '../systems/Run';
import { STAGES } from '../data/stages';
import { audio } from '../systems/Audio';
import { Controls } from '../systems/Controls';
import { saveCampaign } from '../systems/CampaignSave';
import { RESUPPLY } from '../data/supplies';

// Between stages: pick 1 of 3 upgrades. This is the "build" layer that makes every run different.
export class PerkScene extends Phaser.Scene {
  private controls!: Controls;
  private picks: (PerkDef | typeof RESUPPLY)[] = [];
  private cards: Phaser.GameObjects.Container[] = [];
  private sel = 1;
  private done = false;

  constructor() { super('Perk'); }

  private txt(x: number, y: number, s: string, size = 8, color = '#ffffff', wrap = 0) {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 3, align: 'center', wordWrap: wrap ? { width: wrap } : undefined, lineSpacing: 4 }).setOrigin(0.5);
  }

  create() {
    saveCampaign('Perk');
    this.done = false; this.sel = 1; this.cards = [];
    this.controls = new Controls(this);
    // A held skip button from the briefing must be released before it selects an upgrade.
    this.controls.poll();
    const next = STAGES[run.stage];
    this.add.tileSprite(0, 0, W, H, next.bg).setOrigin(0).setTint(0x30344a);
    this.txt(W / 2, 40, 'FIELD UPGRADE', 24, '#ffd040');
    this.txt(W / 2, 66, 'CHOOSE ONE', 8, '#c0c8d8');
    if (this.textures.exists('npc_patch')) {
      const patch = this.add.image(58, H - 2, 'npc_patch').setOrigin(0.5, 1);
      this.tweens.add({ targets: patch, scaleY: 1.03, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      // Patch's patter reacts to the story so far
      const lines = run.bonusCards > 0 ? ['PATCH: NEW STOCK! SYNDICATE MONEY.', 'PATCH: FOUR CARDS. YOU EARNED IT.']
        : run.flags.ledger === 'leak' && run.stage <= 3 ? ["PATCH: YOU'RE ON EVERY SCREEN.", 'PATCH: FAME IS BAD FOR BUSINESS.']
        : run.flags.heard_oracle ? ['PATCH: GO GET HIM BACK.', 'PATCH: ON THE HOUSE. ...MOSTLY.']
        : ['PATCH: PICK ONE, HOTSHOT.', 'PATCH: ALL SALES FINAL.', 'PATCH: TRY NOT TO BREAK IT.', 'PATCH: I FIXED IT. MOSTLY.'];
      this.txt(118, H - 46, Phaser.Utils.Array.GetRandom(lines), 8, '#ffd040').setOrigin(0, 0.5);
    }
    this.txt(W / 2, H - 22, `NEXT: STAGE ${run.stage + 1} - ${next.name}`, 8, '#9fe8ff');

    const count = run.bonusCards > 0 ? 4 : 3; // selling the ledger stocks Patch's van for three perk screens
    this.picks = Phaser.Utils.Array.Shuffle(PERKS.filter((p) => !run.perks.includes(p.id))).slice(0, count);
    if (!this.picks.length) this.picks = [RESUPPLY];
    const hw = count === 4 ? 66 : 82, gap = count === 4 ? 146 : 190;
    this.sel = Math.floor((this.picks.length - 1) / 2);
    this.picks.forEach((p, i) => {
      const x = W / 2 + (i - (this.picks.length - 1) / 2) * gap;
      const g = this.add.graphics();
      const col = i === 3 ? 0xffd040 : 0x40e0ff;
      g.fillStyle(0x0c1018, 0.92).fillRect(-hw, -80, hw * 2, 160);
      g.lineStyle(2, col).strokeRect(-hw, -80, hw * 2, 160);
      g.fillStyle(col, 0.2).fillRect(-hw, -80, hw * 2, 30);
      const card = this.add.container(x, 185, [g, this.txt(0, -64, i === 3 ? 'NEW STOCK' : `0${i + 1}`, 8, i === 3 ? '#ffd040' : '#40e0ff'), this.txt(0, -20, p.name, 8, '#ffffff', hw * 2 - 14), this.txt(0, 30, p.desc, 8, '#ffd040', hw * 2 - 14)]);
      this.cards.push(card);
    });
    this.cameras.main.fadeIn(300);
    this.highlight();
  }

  private highlight() {
    this.cards.forEach((c, i) => { c.setScale(i === this.sel ? 1.08 : 1).setAlpha(i === this.sel ? 1 : 0.55); });
  }

  update() {
    const c = this.controls;
    c.poll();
    if (this.done) return;
    const move = (c.pressed('right') ? 1 : 0) - (c.pressed('left') ? 1 : 0);
    if (move) { this.sel = Phaser.Math.Clamp(this.sel + move, 0, this.picks.length - 1); this.highlight(); audio.sfx('ui'); }
    // clicking a card picks that card
    const ptr = c.pointer;
    if (c.pressed('fire') && ptr.isDown) {
      const hit = this.cards.findIndex((card) => Math.abs(ptr.x - card.x) < (this.cards.length === 4 ? 70 : 88) && Math.abs(ptr.y - card.y) < 86);
      if (hit < 0) return;
      this.sel = hit; this.highlight();
    }
    if (c.pressed('fire') || c.pressed('jump')) {
      this.done = true;
      const p = this.picks[this.sel];
      if ('apply' in p) { p.apply(run.stats); run.perks.push(p.id); }
      else { run.hp = run.stats.maxHp; run.od = 100; }
      if (run.bonusCards > 0) run.bonusCards--;
      if (p.id === 'plating') run.hp = run.stats.maxHp;
      audio.sfx('weapon');
      this.tweens.add({ targets: this.cards[this.sel], scale: 1.3, alpha: 0, duration: 350 });
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(420, () => this.scene.start('Game'));
    }
  }
}
