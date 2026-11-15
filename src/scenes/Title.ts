import Phaser from 'phaser';
import { W, H, FONT } from '../config';
import { OPERATORS } from '../data/operators';
import { newRun, save, persist } from '../systems/Run';
import { audio } from '../systems/Audio';
import { Controls } from '../systems/Controls';

export class TitleScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private controls!: Controls;
  private sel = 0;
  private hero!: Phaser.GameObjects.Image;
  private info!: Phaser.GameObjects.Text[];
  private started = false;

  constructor() { super('Title'); }

  private txt(x: number, y: number, s: string, size = 8, color = '#ffffff') {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: size >= 16 ? 6 : 3 }).setOrigin(0.5);
  }

  create() {
    this.started = false;
    this.sel = Phaser.Math.Clamp(save.op, 0, OPERATORS.length - 1);
    audio.setMuted(save.muted);
    this.controls = new Controls(this);
    this.bg = this.add.tileSprite(0, 0, W, H, 'bg_city').setOrigin(0).setTint(0x8088b0);
    const shade = this.add.graphics();
    shade.fillGradientStyle(0, 0, 0, 0, 0.1, 0.1, 0.9, 0.9).fillRect(0, 0, W, H);

    this.add.image(W / 2, 70, 'glow').setDisplaySize(620, 150).setTint(0xff3050).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
    const logo = this.txt(W / 2, 58, 'NEON WARPATH', 40, '#ffffff').setShadow(0, 4, '#ff2050', 0, true, true);
    logo.setTint(0xffffff, 0xffffff, 0xff7090, 0xff7090);
    this.txt(W / 2, 92, 'ONE MAN ARMY  ·  ZERO MERCY', 8, '#ffd040');
    this.tweens.add({ targets: logo, scale: { from: 1, to: 1.03 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.add.image(W / 2, 250, 'glow').setDisplaySize(260, 60).setTint(0x40e0ff).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    this.hero = this.add.image(W / 2, 250, 'hero_idle').setOrigin(0.5, 1).setScale(2);
    this.txt(W / 2 - 120, 200, '<', 16, '#9fe8ff');
    this.txt(W / 2 + 120, 200, '>', 16, '#9fe8ff');
    this.info = [this.txt(W / 2, 264, '', 16, '#9fe8ff'), this.txt(W / 2, 282, '', 8, '#ffd040'), this.txt(W / 2, 296, '', 8, '#c0c8d8')];
    this.refresh();

    const press = this.txt(W / 2, 322, 'PRESS ENTER OR J TO DEPLOY', 8);
    this.tweens.add({ targets: press, alpha: 0.15, duration: 500, yoyo: true, repeat: -1 });
    this.txt(W / 2, 344, 'A/D MOVE  SPACE JUMP  J FIRE  SHIFT SLIDE  Q OVERDRIVE  M MUTE', 8, '#70788c').setScale(0.75);
    if (save.best > 0) this.add.text(W - 8, 8, `BEST ${save.best}`, { fontFamily: FONT, fontSize: '8px', color: '#ffd040', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0);
    this.cameras.main.fadeIn(400);
  }

  private refresh() {
    const op = OPERATORS[this.sel];
    const has = this.textures.exists(`${op.art}_idle`);
    this.hero.setTexture(has ? `${op.art}_idle` : 'hero_idle').setTint(has ? 0xffffff : op.tint);
    this.info[0].setText(op.name);
    this.info[1].setText(`${op.role}   ARMOR ${op.hp}   SPEED ${op.speed}`);
    this.info[2].setText(op.blurb);
  }

  update(_t: number, dt: number) {
    this.bg.tilePositionX += dt * 0.012;
    const c = this.controls;
    c.poll();
    if (this.started) return;
    if (c.pressed('mute')) { audio.unlock(); audio.setMuted(!audio.muted); save.muted = audio.muted; persist(); }
    const move = (c.pressed('right') ? 1 : 0) - (c.pressed('left') ? 1 : 0);
    if (move) {
      audio.unlock();
      this.sel = (this.sel + move + OPERATORS.length) % OPERATORS.length;
      this.refresh();
      audio.sfx('ui');
    }
    if (c.pressed('fire') || c.pressed('jump')) {
      this.started = true;
      audio.unlock();
      audio.sfx('select');
      save.op = this.sel; persist();
      newRun(this.sel);
      this.cameras.main.fadeOut(350);
      this.time.delayedCall(360, () => this.scene.start('Game'));
    }
  }
}
