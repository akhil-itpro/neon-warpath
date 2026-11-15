import Phaser from 'phaser';
import { W, H, FONT } from '../config';
import { STAGES } from '../data/stages';
import { ENEMIES } from '../data/enemies';
import { run } from '../systems/Run';
import { audio, TrackDef } from '../systems/Audio';
import { Controls } from '../systems/Controls';

// The very end of the game: after the final boss dies and the results screen is dismissed, the credits
// roll over a slideshow of every stage, finish on THE END, then return to the title screen.
// Edit the text in CREATOR / SPECIAL below to put real names in.
const CREATOR = ['A ONE-PERSON INDIE GAME', 'DIRECTED AND DESIGNED BY', 'THE PLAYER-DEVELOPER'];
const N = null;
const CREDITS_TRACK: TrackDef = {
  bpm: 82, root: 38,
  bass: [0, N, N, N, 7, N, N, N, 5, N, N, N, 3, N, 7, N],
  lead: [12, N, 15, N, 19, N, N, 15, 17, N, 15, N, 12, N, N, N],
  prog: [0, -2, -4, -5],
};

type Line = { text: string; size: number; color: string; gap: number };

export class CreditsScene extends Phaser.Scene {
  private controls!: Controls;
  private roll!: Phaser.GameObjects.Container;
  private rollH = 0;
  done = false;
  private slides: Phaser.GameObjects.TileSprite[] = [];
  private slideIx = 0;
  private theEnd!: Phaser.GameObjects.Text;
  private doneAt = 0;

  constructor() { super('Credits'); }

  private lines(): Line[] {
    const L: Line[] = [];
    const add = (text: string, size = 8, color = '#c0c8d8', gap = 10) => L.push({ text, size, color, gap });
    const head = (text: string) => add(text, 16, '#ffd040', 26);
    add('NEON WARPATH', 32, '#40e0ff', 16);
    add('THE SYNDICATE SOLD THE CITY TO THE MACHINES.', 8, '#c0c8d8', 6);
    add('YOU TOOK IT BACK.', 8, '#ffffff', 70);

    head('TARGETS DESTROYED');
    for (const s of STAGES) {
      add(s.name, 8, '#ffffff', 4);
      add(`${ENEMIES[s.boss]?.name?.toUpperCase() ?? s.boss.toUpperCase()}`, 8, '#ff6050', 18);
    }
    add('', 8, '#fff', 30);

    head('OPERATOR');
    add(run.op.name, 16, '#80ffb0', 8);
    add(run.op.role, 8, '#c0c8d8', 30);
    add(`KILLS  ${run.kills}`, 8, '#ffffff', 6);
    add(`BEST COMBO  ${run.maxCombo}`, 8, '#ffffff', 6);
    add(`FINAL SCORE  ${run.score}`, 8, '#ffd040', 60);

    head('CREATED BY');
    for (const c of CREATOR) add(c, 8, '#ffffff', 8);
    add('', 8, '#fff', 30);

    head('MADE WITH');
    for (const c of ['PHASER 3', 'TYPESCRIPT', 'VITE']) add(c, 8, '#ffffff', 6);
    add('', 8, '#fff', 20);
    add('ART, CODE AND DESIGN WITH AI PARTNERS', 8, '#c0c8d8', 6);
    add('CLAUDE  ·  CODEX', 8, '#ffffff', 6);
    add('ALL SOUND AND MUSIC SYNTHESISED LIVE', 8, '#c0c8d8', 70);

    head('THANK YOU FOR PLAYING');
    add('', 8, '#fff', 120);
    return L;
  }

  create() {
    this.done = false; this.slides = []; this.slideIx = 0;
    this.controls = new Controls(this);
    audio.playMusic(CREDITS_TRACK);

    // backdrop slideshow: every stage's backdrop, drifting, crossfading
    STAGES.forEach((s, i) => {
      const t = this.add.tileSprite(0, 0, W, H, s.bg).setOrigin(0).setTint(0x8890b0).setAlpha(i === 0 ? 1 : 0);
      this.slides.push(t);
    });
    const shade = this.add.graphics();
    shade.fillStyle(0x000000, 0.55).fillRect(0, 0, W, H);
    shade.fillGradientStyle(0, 0, 0, 0, 1, 1, 0, 0).fillRect(0, 0, W, 60);
    shade.fillGradientStyle(0, 0, 0, 0, 0, 0, 1, 1).fillRect(0, H - 60, W, 60);

    // the roll
    this.roll = this.add.container(W / 2, H + 10);
    let y = 0;
    for (const l of this.lines()) {
      if (l.text) {
        const t = this.add.text(0, y, l.text, { fontFamily: FONT, fontSize: `${l.size}px`, color: l.color, stroke: '#000000', strokeThickness: l.size >= 16 ? 5 : 3, align: 'center' }).setOrigin(0.5, 0);
        this.roll.add(t);
        y += t.height;
      }
      y += l.gap;
    }
    this.rollH = y;

    this.theEnd = this.add.text(W / 2, H / 2, 'THE END', { fontFamily: FONT, fontSize: '32px', color: '#ffffff', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5).setAlpha(0);
    this.cameras.main.fadeIn(800);
    this.time.addEvent({ delay: 7000, loop: true, callback: () => this.nextSlide() });
  }

  private nextSlide() {
    const cur = this.slides[this.slideIx];
    this.slideIx = (this.slideIx + 1) % this.slides.length;
    const nxt = this.slides[this.slideIx];
    this.children.bringToTop(nxt); this.children.bringToTop(this.shadeLayer());
    this.tweens.add({ targets: nxt, alpha: 1, duration: 1400 });
    this.tweens.add({ targets: cur, alpha: 0, duration: 1400, delay: 1400 });
    this.children.bringToTop(this.roll); this.children.bringToTop(this.theEnd);
  }
  private shadeLayer() { return this.children.list.find((c) => c instanceof Phaser.GameObjects.Graphics)!; }

  update(_t: number, delta: number) {
    this.controls.poll();
    this.slides.forEach((s) => (s.tilePositionX += delta * 0.012));
    const fast = this.controls.held('fire') || this.controls.held('jump');
    if (!this.done) {
      this.roll.y -= delta * (fast ? 0.14 : 0.032);
      if (this.roll.y < -this.rollH) {
        this.done = true;
        this.doneAt = this.time.now;
        this.tweens.add({ targets: this.theEnd, alpha: 1, duration: 1500 });
        audio.sfx('clear');
      }
    } else if (this.time.now - this.doneAt > 4500 || (this.time.now - this.doneAt > 1800 && (this.controls.pressed('fire') || this.controls.pressed('jump')))) {
      this.done = false; // fire once
      this.cameras.main.fadeOut(700);
      this.time.delayedCall(720, () => { audio.playMusic(null); this.scene.start('Title'); });
    }
  }
}
