import Phaser from 'phaser';
import { W, H, FONT } from '../config';
import { run } from '../systems/Run';
import { WEAPONS } from '../data/weapons';
import { audio } from '../systems/Audio';
import { Controls } from '../systems/Controls';
import type { Line, Choice, ChoiceOption } from '../data/story';
import { condOk, filterLines, portraitKey, speakerColor, speakerName } from '../systems/Story';
import type { GameScene } from './Game';

const gsStage = (s: Phaser.Scene) => (s.scene.get('Game') as GameScene).stage;
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
  private cross!: Phaser.GameObjects.Image;
  // comms (radio chatter): queued story lines with a portrait and typewriter text; never pauses the game
  private comm!: Phaser.GameObjects.Container;
  private commPic!: Phaser.GameObjects.Image;
  private commName!: Phaser.GameObjects.Text;
  private commText!: Phaser.GameObjects.Text;
  private commQ: Line[] = [];
  private commLine: Line | null = null;
  private commShown = 0;  // characters typed so far
  private commHold = 0;   // ms left before the next line
  private shardTxt!: Phaser.GameObjects.Text;
  private shardIcon!: Phaser.GameObjects.Image;
  private airTxt!: Phaser.GameObjects.Text;
  // in-level slow-motion choice
  private pick: { c: Choice; cb: (o: ChoiceOption) => void; box: Phaser.GameObjects.Container; cards: Phaser.GameObjects.Container[]; sel: number; left: number; tick: number; bar: Phaser.GameObjects.Rectangle; release: boolean } | null = null;

  private holdTxt?: Phaser.GameObjects.Text;
  constructor() { super('Hud'); }

  private get gs() { return this.scene.get('Game') as GameScene; }
  private txt(x: number, y: number, s: string, size = 8, color = '#ffffff') {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: size >= 16 ? 5 : 3 });
  }

  create() {
    this.intro = undefined;
    this.holdTxt = undefined;
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
    this.cross = this.add.image(0, 0, 'crosshair').setDepth(200).setVisible(false);
    // comms panel, bottom-left above the boss bar
    this.commQ = []; this.commLine = null; this.commShown = 0; this.commHold = 0;
    const cx = 200; // top band, clear of the HP bar and score: the hero stands bottom-left, so comms must not sit there
    const box = this.add.graphics();
    box.fillStyle(0x05060a, 0.86).fillRect(0, 0, 316, 58);
    box.lineStyle(1, 0x40e0ff, 0.7).strokeRect(0.5, 0.5, 315, 57);
    box.fillStyle(0x40e0ff, 0.15).fillRect(1, 1, 314, 2);
    this.commPic = this.add.image(5, 5, 'portrait_juno').setOrigin(0);
    this.commName = this.txt(60, 6, '', 8, '#9fe8ff');
    this.commText = this.add.text(60, 20, '', { fontFamily: FONT, fontSize: '8px', color: '#ffffff', stroke: '#000000', strokeThickness: 2, wordWrap: { width: 250 }, lineSpacing: 4 });
    this.comm = this.add.container(cx, -70, [box, this.commPic, this.commName, this.commText]).setDepth(50);
    // data shards found in this stage
    const st = gsStage(this);
    this.shardIcon = this.add.image(16, 72, 'shard').setScale(0.75).setVisible(!!st?.shards?.length);
    this.shardTxt = this.txt(26, 68, '', 8, '#ff90e0').setVisible(!!st?.shards?.length);
    this.shardGot(false);
    this.airTxt = this.txt(12, 84, 'AIR', 8, '#9fe8ff').setVisible(false);
    this.pick = null;
    this.events.once('shutdown', () => this.input.setDefaultCursor('default'));
  }

  update(_t: number, delta: number) {
    const gs = this.gs;
    this.controls.poll();
    // Mouse aim: the system arrow is swapped for a crosshair while fighting, and comes back on pause / death / tally screens.
    const aiming = Controls.mouseAim && !this.paused && gs.state === 'play';
    const ptr = this.controls.pointer;
    this.cross.setVisible(aiming).setPosition(Math.round(ptr.x), Math.round(ptr.y)).setTint(run.od >= 100 ? 0xffd040 : 0xffffff);
    this.input.setDefaultCursor(aiming ? 'none' : 'default');
    if (this.paused) {
      if (this.controls.pressed('pause') || this.controls.pressed('fire')) this.setPaused(false);
      return;
    }
    if (this.pick) this.tickChoice(delta);
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

    // air meter (water stages), top centre, only while it is not full
    const air = gs.gimmicks?.oxygen ?? 100;
    this.airTxt.setVisible(air < 100);
    if (air < 100) {
      const lowAir = air < 30 && Math.floor(this.time.now / 140) % 2 === 0;
      g.fillStyle(0x000000, 0.75).fillRect(42, 84, 104, 8);
      g.fillStyle(lowAir ? 0xff4040 : 0x60c8ff).fillRect(44, 86, air, 4);
    }

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
    this.tickComms(delta);
  }

  // ---- comms
  comms(lines: Line[]) {
    this.commQ.push(...lines);
    if (!this.commLine) this.nextComm();
  }

  get commsBusy() { return !!this.commLine || this.commQ.length > 0; }

  private nextComm() {
    const l = this.commQ.shift();
    this.commLine = l ?? null;
    this.tweens.killTweensOf(this.comm);
    if (!l) { this.tweens.add({ targets: this.comm, y: -70, duration: 220, ease: 'Quad.in' }); return; }
    this.commShown = 0;
    this.commHold = 1700 + l.text.length * 35;
    this.commPic.setTexture(portraitKey(l.who)).setDisplaySize(48, 48); // painted 64px portraits shrink to fit
    this.commName.setText(speakerName(l.who)).setColor(speakerColor(l.who));
    this.commText.setText('').setColor(l.who === 'archon' ? '#ffb0b8' : l.who === 'myrrhkin' || l.who === 'oracle' ? '#e0c8ff' : '#ffffff');
    this.tweens.add({ targets: this.comm, y: 4, duration: 200, ease: 'Quad.out' });
    audio.sfx(l.who === 'archon' ? 'static' : 'radio');
  }

  private tickComms(delta: number) {
    const l = this.commLine;
    if (!l) return;
    if (this.commShown < l.text.length) {
      const before = Math.floor(this.commShown);
      this.commShown = Math.min(l.text.length, this.commShown + delta / 28);
      if (Math.floor(this.commShown) !== before) {
        this.commText.setText(l.text.slice(0, Math.floor(this.commShown)));
        if (before % 3 === 0) audio.sfx('type');
      }
    } else if ((this.commHold -= delta) <= 0) this.nextComm();
    // ARCHON breaks into the channel: the portrait jitters and flickers like a bad signal
    if (l.who === 'archon') {
      const glitch = Math.random() < 0.12;
      this.commPic.setPosition(5 + (glitch ? Phaser.Math.Between(-2, 2) : 0), 5).setAlpha(glitch ? 0.55 : 1);
    } else this.commPic.setPosition(5, 5).setAlpha(1);
  }

  // ---- in-level choice (slow motion; the world keeps moving at 1/5 speed behind the cards)
  choice(c: Choice, cb: (o: ChoiceOption) => void) {
    const box = this.add.container(0, 0).setDepth(150);
    box.add(this.add.rectangle(0, 0, W, H, 0x000010, 0.45).setOrigin(0));
    box.add(this.txt(W / 2, 86, '- DECIDE -', 16, '#ffd040').setOrigin(0.5));
    filterLines(c.prompt).slice(0, 3).forEach((l, i) => {
      box.add(this.add.image(60, 118 + i * 26, portraitKey(l.who)).setDisplaySize(22, 22));
      box.add(this.txt(78, 110 + i * 26, speakerName(l.who), 8, speakerColor(l.who)));
      box.add(this.add.text(78, 122 + i * 26, l.text, { fontFamily: FONT, fontSize: '8px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }));
    });
    const cards = c.options.map((o, i) => {
      const ok = condOk(o.requires);
      const x = W / 2 + (i - (c.options.length - 1) / 2) * 230;
      const gr = this.add.graphics();
      gr.fillStyle(0x0c1018, 0.95).fillRect(-104, -46, 208, 92);
      gr.lineStyle(2, ok ? 0xffd040 : 0x404858).strokeRect(-104, -46, 208, 92);
      gr.fillStyle(ok ? 0xffd040 : 0x404858, 0.18).fillRect(-104, -46, 208, 24);
      const title = this.txt(0, -40, ok ? o.label : (o.locked ?? o.label), 8, ok ? '#ffd040' : '#606878').setOrigin(0.5, 0);
      const hint = this.add.text(0, 6, ok ? o.hint : 'LOCKED', { fontFamily: FONT, fontSize: '8px', color: ok ? '#c0c8d8' : '#505868', align: 'center', wordWrap: { width: 180 }, lineSpacing: 5 }).setOrigin(0.5);
      const card = this.add.container(x, 236, [gr, title, hint]).setData('ok', ok);
      box.add(card);
      return card;
    });
    box.add(this.add.rectangle(W / 2 - 150, 296, 300, 6, 0x000000, 0.8).setOrigin(0, 0.5));
    const bar = this.add.rectangle(W / 2 - 149, 296, 298, 4, 0xffd040).setOrigin(0, 0.5);
    box.add(bar);
    box.add(this.txt(W / 2, 306, 'LEFT / RIGHT + FIRE', 8, '#70788c').setOrigin(0.5, 0));
    const def = c.defaultIndex ?? c.options.length - 1;
    this.pick = { c, cb, box, cards, sel: def, left: c.timerMs ?? 8000, tick: 1000, bar, release: this.controls.held('fire') || this.controls.held('jump') };
    this.highlightPick();
    box.setAlpha(0);
    this.tweens.add({ targets: box, alpha: 1, duration: 160 });
  }

  get choosing() { return !!this.pick; }

  private highlightPick() {
    const k = this.pick!;
    k.cards.forEach((card, i) => card.setScale(i === k.sel ? 1.06 : 1).setAlpha(i === k.sel ? 1 : card.getData('ok') ? 0.6 : 0.4));
  }

  private tickChoice(delta: number) {
    const k = this.pick!, c = this.controls;
    k.left -= delta; k.tick -= delta;
    k.bar.width = 298 * Math.max(0, k.left / (k.c.timerMs ?? 8000));
    if (k.tick <= 0) { k.tick = 1000; audio.sfx('ui'); }
    const held = c.held('fire') || c.held('jump');
    if (k.release) { if (!held) k.release = false; return; }
    const move = (c.pressed('right') ? 1 : 0) - (c.pressed('left') ? 1 : 0);
    if (move) {
      let s = k.sel;
      for (let n = 0; n < k.cards.length; n++) { s = (s + move + k.cards.length) % k.cards.length; if (k.cards[s].getData('ok')) break; }
      if (s !== k.sel) { k.sel = s; this.highlightPick(); audio.sfx('ui'); }
    }
    const ptr = c.pointer;
    let chosen = -1;
    if ((c.pressed('fire') || c.pressed('jump'))) {
      if (ptr.isDown) {
        const hit = k.cards.findIndex((card) => Math.abs(ptr.x - card.x) < 108 && Math.abs(ptr.y - card.y) < 50);
        if (hit >= 0 && k.cards[hit].getData('ok')) chosen = hit;
      } else chosen = k.sel;
    }
    if (k.left <= 0) chosen = k.c.defaultIndex ?? k.cards.length - 1; // not choosing is a choice
    if (chosen < 0) return;
    const o = k.c.options[chosen];
    this.pick = null;
    audio.sfx('select');
    this.tweens.add({ targets: k.box, alpha: 0, duration: 200, onComplete: () => k.box.destroy() });
    k.cb(o);
  }

  shardGot(pop = true) {
    const st = gsStage(this);
    const all = st?.shards ?? [];
    const got = all.filter(([id]) => run.shards.includes(id)).length;
    this.shardTxt.setText(`${got}/${all.length}`);
    if (pop) this.tweens.add({ targets: this.shardTxt, scale: { from: 1.8, to: 1 }, duration: 260, ease: 'Back.out' });
  }

  // ---- called by GameScene (all optional-chained there because this scene starts a frame later)
  /** HOLD IT OPEN countdown under the comms band; null removes it. */
  holdTimer(ms: number | null) {
    if (ms === null) { this.holdTxt?.destroy(); this.holdTxt = undefined; return; }
    this.holdTxt ??= this.txt(W / 2, 66, '', 16, '#80ffe0').setOrigin(0.5, 0);
    const s = Math.ceil(ms / 1000);
    this.holdTxt.setText(`HOLD  ${s}`).setColor(s <= 10 ? '#ffd040' : '#80ffe0');
  }

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
      this.panel([['PAUSED', 24, '#ffffff'], ['MOVE  A/D   JUMP  SPACE', 8, '#c0c8d8'], ['AIM + FIRE  MOUSE   (OR J = AUTO-AIM)', 8, '#c0c8d8'], ['SLIDE  SHIFT / RIGHT CLICK', 8, '#c0c8d8'], ['OVERDRIVE  Q   MUTE  M', 8, '#c0c8d8'], ['PRESS ESC TO RESUME', 8, '#9fe8ff']]);
    } else {
      this.overlay.setVisible(false);
      this.scene.resume('Game');
    }
  }
}
