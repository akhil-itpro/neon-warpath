import Phaser from 'phaser';
import { W, H, FONT } from '../config';
import { run } from '../systems/Run';
import { STAGES } from '../data/stages';
import { STORY, type Choice, type ChoiceOption, type Line } from '../data/story';
import { applyChoice, condOk, filterLines, portraitKey, speakerColor, speakerName } from '../systems/Story';
import { audio } from '../systems/Audio';
import { Controls } from '../systems/Controls';

type Step = { line: Line } | { choice: Choice };
const HOLD_SKIP = 600; // ms of holding fire/jump that skips to the next choice (or the end)

// Between stages (and after Title): two portraits, typewriter dialogue, and the story choices.
// Shows the previous stage's `after` (its choice) and then the next stage's `briefing`. See docs/STORY.md.
export class BriefingScene extends Phaser.Scene {
  private controls!: Controls;
  private next = 'Perk';
  private steps: Step[] = [];
  private line: Line | null = null;
  private shown = 0;
  private hold = 0;
  private wait = 0; // input guard so a key still held from the last scene does not skip
  private leaving = false;
  private needRelease = false; // after a choice, a held button must be let go before it can skip again
  private choice: Choice | null = null;
  private sel = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private left!: Phaser.GameObjects.Image;
  private right!: Phaser.GameObjects.Image;
  private leftFrame!: Phaser.GameObjects.Rectangle;
  private rightFrame!: Phaser.GameObjects.Rectangle;
  private nameTxt!: Phaser.GameObjects.Text;
  private bodyTxt!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private box!: Phaser.GameObjects.Container;

  constructor() { super('Briefing'); }

  private txt(x: number, y: number, s: string, size = 8, color = '#ffffff') {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 3 });
  }

  create(data: { next?: string }) {
    this.next = data?.next ?? 'Perk';
    this.line = null; this.choice = null; this.cards = []; this.leaving = false; this.needRelease = false;
    this.shown = 0; this.hold = 0; this.wait = 450; this.sel = 0;
    this.controls = new Controls(this);

    const prev = STAGES[run.stage - 1];
    const final = run.stage >= STAGES.length; // after the last boss: only the final choice remains
    const st = STAGES[Math.min(run.stage, STAGES.length - 1)];
    const after = prev ? STORY[prev.id]?.after : undefined;
    this.steps = [
      ...filterLines(after?.lines ?? []).map((line) => ({ line })),
      ...(after?.choice ? [...filterLines(after.choice.prompt).map((line) => ({ line })), { choice: after.choice }] : []),
      ...(final ? [] : filterLines(STORY[st.id]?.briefing ?? []).map((line) => ({ line }))),
    ];
    if (!this.steps.length) { this.scene.start(this.next); return; }

    this.add.tileSprite(0, 0, W, H, st.bg).setOrigin(0).setTint(0x283048);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.55).fillRect(0, 0, W, 40).fillRect(0, H - 40, W, 40);
    this.txt(W / 2, 14, final ? 'DEBRIEF' : `BRIEFING  -  STAGE ${run.stage + 1}`, 8, '#9fe8ff').setOrigin(0.5, 0);
    this.txt(W / 2, 26, final ? 'THE RIFT' : st.name, 8, '#ffd040').setOrigin(0.5, 0);

    // portraits: the operator on the left, whoever they are talking to on the right
    this.leftFrame = this.add.rectangle(110, 130, 100, 100).setStrokeStyle(2, 0x40e0ff);
    this.left = this.add.image(110, 130, portraitKey('op')).setDisplaySize(96, 96);
    this.rightFrame = this.add.rectangle(W - 110, 130, 100, 100).setStrokeStyle(2, 0x40e0ff);
    this.right = this.add.image(W - 110, 130, portraitKey('juno')).setDisplaySize(96, 96).setFlipX(true);
    const firstOther = this.steps.find((s): s is { line: Line } => 'line' in s && s.line.who !== 'op');
    if (firstOther) this.right.setTexture(portraitKey(firstOther.line.who)).setDisplaySize(96, 96);

    const bg = this.add.graphics();
    bg.fillStyle(0x05060a, 0.9).fillRect(0, 0, 560, 84);
    bg.lineStyle(1, 0x40e0ff, 0.8).strokeRect(0.5, 0.5, 559, 83);
    this.nameTxt = this.txt(14, 10, '', 8);
    this.bodyTxt = this.add.text(14, 28, '', { fontFamily: FONT, fontSize: '8px', color: '#ffffff', stroke: '#000000', strokeThickness: 2, wordWrap: { width: 532 }, lineSpacing: 6 });
    this.box = this.add.container(40, 196, [bg, this.nameTxt, this.bodyTxt]);
    this.hint = this.txt(W / 2, H - 24, 'FIRE: NEXT     HOLD FIRE: SKIP', 8, '#70788c').setOrigin(0.5, 0);

    this.cameras.main.fadeIn(300);
    this.advance();
  }

  /** Moves to the next step: a line (typed out) or a choice (cards). */
  private advance() {
    const step = this.steps.shift();
    if (!step) return this.finish();
    if ('choice' in step) return this.showChoice(step.choice);
    const l = step.line;
    this.line = l;
    this.shown = 0;
    this.nameTxt.setText(speakerName(l.who)).setColor(speakerColor(l.who));
    this.bodyTxt.setText('');
    const me = l.who === 'op';
    if (!me) this.right.setTexture(portraitKey(l.who)).setDisplaySize(96, 96);
    this.left.setAlpha(me ? 1 : 0.4); this.leftFrame.setStrokeStyle(2, me ? 0x40e0ff : 0x303848);
    this.right.setAlpha(me ? 0.4 : 1); this.rightFrame.setStrokeStyle(2, me ? 0x303848 : l.who === 'archon' ? 0xff4060 : 0x40e0ff);
    const pic = me ? this.left : this.right;
    this.tweens.killTweensOf(pic); pic.setDisplaySize(96, 96);
    const s0 = pic.scaleX;
    this.tweens.add({ targets: pic, scaleX: { from: s0 * 1.05, to: s0 }, scaleY: { from: s0 * 1.05, to: s0 }, duration: 160 });
    audio.sfx(l.who === 'archon' ? 'static' : 'radio');
  }

  private showChoice(c: Choice) {
    this.choice = c;
    this.line = null;
    this.hint.setText('CHOOSE:  LEFT / RIGHT  +  FIRE');
    [this.left, this.right, this.leftFrame, this.rightFrame].forEach((o) => this.tweens.add({ targets: o, alpha: 0.15, duration: 200 }));
    const n = c.options.length;
    c.options.forEach((o, i) => {
      const ok = condOk(o.requires);
      const x = W / 2 + (i - (n - 1) / 2) * 236;
      const gr = this.add.graphics();
      gr.fillStyle(0x0c1018, 0.95).fillRect(-108, -58, 216, 116);
      gr.lineStyle(2, ok ? 0xffd040 : 0x404858).strokeRect(-108, -58, 216, 116);
      gr.fillStyle(ok ? 0xffd040 : 0x404858, 0.18).fillRect(-108, -58, 216, 26);
      const title = this.txt(0, -45, ok ? o.label : (o.locked ?? o.label), 8, ok ? '#ffd040' : '#606878').setOrigin(0.5, 0);
      const hint = this.add.text(0, 0, ok ? o.hint : 'LOCKED', { fontFamily: FONT, fontSize: '8px', color: ok ? '#c0c8d8' : '#505868', align: 'center', wordWrap: { width: 190 }, lineSpacing: 6 }).setOrigin(0.5);
      const card = this.add.container(x, 112, [gr, title, hint]).setData('ok', ok).setAlpha(0);
      this.tweens.add({ targets: card, alpha: 1, duration: 200, delay: i * 80 });
      this.cards.push(card);
    });
    this.sel = Math.max(0, c.options.findIndex((o) => condOk(o.requires)));
    this.highlight();
    audio.sfx('warn');
  }

  private highlight() {
    this.cards.forEach((c, i) => c.setScale(i === this.sel ? 1.06 : 1).setAlpha(i === this.sel ? 1 : c.getData('ok') ? 0.6 : 0.4));
  }

  private pick(o: ChoiceOption) {
    this.hold = 0; this.needRelease = true; // the replies are the payoff: a held button must not skip them
    applyChoice(o);
    audio.sfx('select');
    this.cards.forEach((card, i) => this.tweens.add({ targets: card, alpha: 0, scale: i === this.sel ? 1.25 : 0.8, duration: 300, onComplete: () => card.destroy() }));
    this.cards = [];
    this.choice = null;
    [this.left, this.right, this.leftFrame, this.rightFrame].forEach((obj) => this.tweens.add({ targets: obj, alpha: 1, duration: 200 }));
    this.hint.setText('FIRE: NEXT     HOLD FIRE: SKIP');
    this.steps.unshift(...filterLines(o.reply).map((line) => ({ line })));
    this.time.delayedCall(320, () => this.advance());
  }

  private finish() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(350);
    // HOLD IT OPEN: one last 60-second survival fight at the Rift before the ending
    const hold = this.next === 'End' && run.flags.rift_choice === 'hold' && !run.flags.hold_done;
    this.time.delayedCall(370, () => (hold ? this.scene.start('Game', { hold: true }) : this.scene.start(this.next)));
  }

  update(_t: number, dt: number) {
    const c = this.controls;
    c.poll();
    if (this.leaving) return;
    if (this.wait > 0) { this.wait -= dt; return; }
    const press = c.pressed('fire') || c.pressed('jump');
    let held = c.held('fire') || c.held('jump');
    if (this.needRelease) { if (held) held = false; else this.needRelease = false; }

    if (this.choice) {
      const opts = this.choice.options;
      const move = (c.pressed('right') ? 1 : 0) - (c.pressed('left') ? 1 : 0);
      if (move) {
        let s = this.sel;
        for (let k = 0; k < opts.length; k++) { s = (s + move + opts.length) % opts.length; if (this.cards[s].getData('ok')) break; }
        if (s !== this.sel) { this.sel = s; this.highlight(); audio.sfx('ui'); }
      }
      const ptr = c.pointer;
      if (press && ptr.isDown) {
        const hit = this.cards.findIndex((card) => Math.abs(ptr.x - card.x) < 112 && Math.abs(ptr.y - card.y) < 62);
        if (hit < 0 || !this.cards[hit].getData('ok')) return;
        this.sel = hit; this.highlight();
      }
      if (press) this.pick(opts[this.sel]);
      return;
    }

    const l = this.line;
    if (!l) return;
    // holding skips every line up to the next choice
    this.hold = held ? this.hold + dt : 0;
    if (this.hold > HOLD_SKIP) {
      this.hold = HOLD_SKIP - 120; // keep skipping while held, one step every ~120 ms
      const idx = this.steps.findIndex((s) => 'choice' in s);
      this.steps.splice(0, idx < 0 ? this.steps.length : idx);
      this.line = null;
      return this.advance();
    }
    if (this.shown < l.text.length) {
      const before = Math.floor(this.shown);
      this.shown = Math.min(l.text.length, this.shown + dt / 26);
      if (Math.floor(this.shown) !== before) { this.bodyTxt.setText(l.text.slice(0, Math.floor(this.shown))); if (before % 3 === 0) audio.sfx('type'); }
      if (press) { this.shown = l.text.length; this.bodyTxt.setText(l.text); }
      return;
    }
    if (press) this.advance();
  }
}
