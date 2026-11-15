import Phaser from 'phaser';
import { W, H, FONT } from '../config';
import { run } from '../systems/Run';
import { WEAPONS } from '../data/weapons';
import { audio } from '../systems/Audio';
import { Controls } from '../systems/Controls';
import type { GameScene } from './Game';

const RANKS = ['', 'ROOKIE', 'DEADLY', 'SAVAGE', 'BRUTAL', 'WARLORD', 'UNSTOPPABLE', 'GODLIKE', 'LEGEND'];

// Runs on top of GameScene with its own camera, so the HUD stays crisp (no bloom, no shake).
export class HudScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private score!: Phaser.GameObjects.Text;
  private weapon!: Phaser.GameObjects.Text;
  private comboTxt!: Phaser.GameObjects.Text;
  private rankTxt!: Phaser.GameObjects.Text;
  private odTxt!: Phaser.GameObjects.Text;
  private bossTxt!: Phaser.GameObjects.Text;
  private bannerTxt!: Phaser.GameObjects.Text;
  private goTxt!: Phaser.GameObjects.Text;
  private red!: Phaser.GameObjects.Rectangle;
  private overlay!: Phaser.GameObjects.Container;
  private intro?: Phaser.GameObjects.Container;
  private controls!: Controls;
  private paused = false;
  private shownScore = 0;
  private hpLag = 0;

  constructor() { super('Hud'); }

  private get gs() { return this.scene.get('Game') as GameScene; }
  private txt(x: number, y: number, s: string, size = 8, color = '#ffffff') {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: size >= 16 ? 5 : 3 });
  }

  create() {
    this.intro = undefined;
    this.paused = false;
    this.shownScore = run.score;
    this.hpLag = run.hp;
    this.controls = new Controls(this);
    this.red = this.add.rectangle(0, 0, W, H, 0xff0000, 0).setOrigin(0);
    this.g = this.add.graphics();
    this.txt(12, 8, run.op.name, 8, '#9fe8ff');
    this.weapon = this.txt(12, 40, '');
    this.odTxt = this.txt(12, 52, '', 8, '#ffd040');
    this.score = this.txt(W - 12, 8, '', 8).setOrigin(1, 0);
    this.comboTxt = this.txt(W - 12, 24, '', 16, '#ffd040').setOrigin(1, 0);
    this.rankTxt = this.txt(W - 12, 46, '', 8, '#ff8040').setOrigin(1, 0);
    this.bossTxt = this.txt(W / 2, H - 34, '', 8, '#ff6050').setOrigin(0.5, 0);
    this.bannerTxt = this.txt(W / 2, 110, '', 16).setOrigin(0.5).setAlpha(0);
    this.goTxt = this.txt(W - 16, H / 2 - 30, 'GO >', 16, '#80ffb0').setOrigin(1, 0.5).setVisible(false);
    this.overlay = this.add.container(0, 0).setDepth(100).setVisible(false);
  }

  update(_t: number, delta: number) {
    const gs = this.gs;
    this.controls.poll();
    if (this.paused) {
      if (this.controls.pressed('pause') || this.controls.pressed('fire')) this.setPaused(false);
      return;
    }
    const s = run.stats, g = this.g;
    g.clear();

    // armor bar with a white "damage lag" strip
    const bw = Math.min(180, Math.round(s.maxHp * 0.9));
    this.hpLag = Math.max(run.hp, this.hpLag - delta * 0.04);
    g.fillStyle(0x000000, 0.75).fillRect(10, 19, bw + 4, 12);
    g.fillStyle(0xffffff, 0.9).fillRect(12, 21, bw * (this.hpLag / s.maxHp), 8);
    const low = run.hp < s.maxHp * 0.3;
    g.fillStyle(low ? (Math.floor(this.time.now / 120) % 2 ? 0xff3030 : 0xff8080) : 0x40e0a0).fillRect(12, 21, bw * (run.hp / s.maxHp), 8);
    g.fillStyle(0xffffff, 0.25).fillRect(12, 21, bw * (run.hp / s.maxHp), 2);

    // overdrive meter
    const p = gs.player;
    const odActive = p && p.overdrive > 0;
    const od = odActive ? p.overdrive / 6500 : run.od / 100;
    g.fillStyle(0x000000, 0.75).fillRect(10, 32, 94, 6);
    g.fillStyle(odActive || od >= 1 ? (Math.floor(this.time.now / 90) % 2 ? 0xffffff : 0xffd040) : 0xc08020).fillRect(12, 33, 90 * od, 4);
    this.odTxt.setText(odActive ? 'OVERDRIVE!' : od >= 1 ? 'OVERDRIVE READY [Q]' : '');

    // slide cooldown pip
    if (p) { g.fillStyle(p.slideCd <= 0 ? 0x40d0ff : 0x304050).fillRect(108, 33, 6, 4); }

    const w = WEAPONS[run.weapon];
    this.weapon.setText(`${w.name} ${w.ammo ? run.ammo : ''}`).setColor(Phaser.Display.Color.IntegerToColor(w.color).rgba);

    this.shownScore += Math.ceil((run.score - this.shownScore) * 0.2);
    this.score.setText(`SCORE ${String(this.shownScore).padStart(7, '0')}`);

    if (gs.combo > 1) {
      this.comboTxt.setText(`x${gs.mult}`);
      this.rankTxt.setText(`${gs.combo} KILLS ${RANKS[gs.mult]}`);
      g.fillStyle(0x000000, 0.7).fillRect(W - 76, 58, 64, 4);
      g.fillStyle(0xffd040).fillRect(W - 75, 59, 62 * Math.max(0, gs.comboT / 3600), 2);
    } else { this.comboTxt.setText(''); this.rankTxt.setText(''); }

    const b = gs.boss;
    if (b && !b.dead) {
      this.bossTxt.setText(b.def.name);
      g.fillStyle(0x000000, 0.8).fillRect(W / 2 - 152, H - 22, 304, 10);
      g.fillStyle(0xff3030).fillRect(W / 2 - 150, H - 20, 300 * Math.max(0, b.hp / b.maxHp), 6);
      g.fillStyle(0xffffff, 0.3).fillRect(W / 2 - 150, H - 20, 300 * Math.max(0, b.hp / b.maxHp), 2);
    } else this.bossTxt.setText('');

    if (this.goTxt.visible) this.goTxt.setAlpha(Math.floor(this.time.now / 220) % 2 ? 1 : 0.2);
  }

  // ---- called by GameScene (all optional-chained there because this scene starts a frame later)
  banner(text: string, ms = 1600, color = '#ffffff') {
    this.tweens.killTweensOf(this.bannerTxt);
    this.bannerTxt.setText(text).setColor(color).setAlpha(1).setScale(1.5);
    this.tweens.add({ targets: this.bannerTxt, scale: 1, duration: 160, ease: 'Back.out' });
    this.tweens.add({ targets: this.bannerTxt, alpha: 0, delay: ms, duration: 300 });
  }

  stageIntro(top: string, name: string, tagline: string) {
    const a = this.txt(W / 2, 96, top, 8, '#9fe8ff').setOrigin(0.5);
    const b = this.txt(W / 2, 120, name, 24).setOrigin(0.5);
    const c = this.txt(W / 2, 146, tagline, 8, '#c0c8d8').setOrigin(0.5);
    const line = this.add.rectangle(W / 2, 134, 360, 2, 0xffffff).setScale(0, 1);
    const intro = this.intro = this.add.container(0, 0, [a, b, c, line]);
    this.tweens.add({ targets: line, scaleX: 1, duration: 300 });
    this.tweens.add({ targets: intro, alpha: 0, delay: 2200, duration: 400, onComplete: () => {
      intro.destroy();
      if (this.intro === intro) this.intro = undefined;
    } });
    audio.sfx('select');
  }

  bossWarning(text: string) {
    const bar = this.add.rectangle(0, 104, W, 44, 0xff0000, 0.3).setOrigin(0);
    const t1 = this.txt(W / 2, 116, '! WARNING !', 16, '#ff4040').setOrigin(0.5);
    const t2 = this.txt(W / 2, 136, text, 8).setOrigin(0.5);
    this.tweens.add({ targets: [bar, t1], alpha: { from: 1, to: 0.25 }, duration: 220, yoyo: true, repeat: 4, onComplete: () => [bar, t1, t2].forEach((o) => o.destroy()) });
    for (let i = 0; i < 3; i++) this.time.delayedCall(i * 500, () => audio.sfx('warn'));
  }

  go() {
    this.goTxt.setVisible(true);
    this.time.delayedCall(2600, () => this.goTxt.setVisible(false));
  }

  comboUp() {
    this.tweens.add({ targets: this.comboTxt, scale: { from: 1.8, to: 1 }, duration: 220, ease: 'Back.out' });
  }

  hurtFlash() {
    this.red.setAlpha(0.35);
    this.tweens.add({ targets: this.red, alpha: 0, duration: 320 });
  }

  private panel(lines: [string, number, string][]) {
    if (this.intro) {
      this.tweens.killTweensOf(this.intro);
      this.tweens.killTweensOf(this.intro.list);
      this.intro.destroy();
      this.intro = undefined;
    }
    this.overlay.removeAll(true);
    this.overlay.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0));
    let y = H / 2 - lines.length * 9;
    for (const [s, size, color] of lines) { this.overlay.add(this.txt(W / 2, y, s, size, color).setOrigin(0.5)); y += size + 12; }
    this.overlay.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.overlay, alpha: 1, duration: 250 });
  }

  dead() {
    this.time.delayedCall(700, () => this.panel([
      ['K.I.A.', 32, '#ff3030'],
      ['-20% SCORE', 8, '#ff9080'],
      ['PRESS FIRE TO GET BACK IN THE FIGHT', 8, '#ffffff'],
    ]));
  }

  tally(name: string, secs: number, kills: number, combo: number, bonus: number) {
    this.panel([
      [`${name} CLEARED`, 16, '#80ffb0'],
      [`TIME  ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, 8, '#ffffff'],
      [`KILLS  ${kills}`, 8, '#ffffff'],
      [`BEST COMBO  ${combo}`, 8, '#ffd040'],
      [`BONUS  +${bonus}`, 8, '#ffd040'],
    ]);
  }

  setPaused(on: boolean) {
    this.paused = on;
    if (on) {
      this.panel([['PAUSED', 24, '#ffffff'], ['MOVE  A/D   JUMP  SPACE   FIRE  J', 8, '#c0c8d8'], ['SLIDE  SHIFT   OVERDRIVE  Q   MUTE  M', 8, '#c0c8d8'], ['PRESS ESC TO RESUME', 8, '#9fe8ff']]);
    } else {
      this.overlay.setVisible(false);
      this.scene.resume('Game');
    }
  }
}
