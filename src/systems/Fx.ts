import Phaser from 'phaser';
import { DEPTH, FONT } from '../config';
import { audio } from './Audio';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;
const ADD = Phaser.BlendModes.ADD;

// "Juice": every hit, shot and kill should produce light, particles, shake and sound.
// Game code calls these helpers and never builds effects by hand.
export class Fx {
  private sparks: Emitter;
  private debris: Emitter;
  private smoke: Emitter;
  private dust: Emitter;
  private freeze = 0;

  constructor(private scene: Phaser.Scene) {
    const p = (cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig, depth = DEPTH.fx) =>
      scene.add.particles(0, 0, 'px', { emitting: false, ...cfg }).setDepth(depth);
    this.sparks = p({ speed: { min: 60, max: 260 }, lifespan: { min: 120, max: 380 }, scale: { start: 1.2, end: 0 }, gravityY: 300, blendMode: ADD });
    this.debris = p({ speed: { min: 50, max: 240 }, angle: { min: 200, max: 340 }, lifespan: { min: 400, max: 900 }, scale: { start: 1.6, end: 0.6 }, gravityY: 700, rotate: { min: 0, max: 360 }, tint: 0x30343e });
    this.smoke = p({ speed: { min: 8, max: 46 }, lifespan: { min: 400, max: 900 }, scale: { start: 2, end: 7 }, alpha: { start: 0.45, end: 0 }, gravityY: -40, tint: 0x40434c });
    this.dust = p({ speed: { min: 10, max: 60 }, angle: { min: 180, max: 360 }, lifespan: { min: 180, max: 420 }, scale: { start: 1.5, end: 3 }, alpha: { start: 0.5, end: 0 }, tint: 0x8890a0 }, DEPTH.player - 1);
  }

  spark(x: number, y: number, color = 0xffd070, n = 6) {
    this.sparks.setParticleTint(color);
    this.sparks.explode(n, x, y);
  }

  dustPuff(x: number, y: number, n = 5) { this.dust.explode(n, x, y); }
  puff(x: number, y: number, n = 2) { this.smoke.explode(n, x, y); }

  glow(x: number, y: number, color: number, scale = 1, dur = 160) {
    const g = this.scene.add.image(x, y, 'glow').setBlendMode(ADD).setTint(color).setScale(scale).setDepth(DEPTH.fx);
    this.scene.tweens.add({ targets: g, alpha: 0, scale: scale * 1.6, duration: dur, onComplete: () => g.destroy() });
  }

  ring(x: number, y: number, color: number, to = 2, dur = 280) {
    const r = this.scene.add.image(x, y, 'ring').setBlendMode(ADD).setTint(color).setScale(0.2).setDepth(DEPTH.fx);
    this.scene.tweens.add({ targets: r, alpha: 0, scale: to, duration: dur, ease: 'Cubic.out', onComplete: () => r.destroy() });
  }

  muzzle(x: number, y: number, color: number) {
    this.glow(x, y, color, 0.5, 70);
    this.glow(x, y, 0xffffff, 0.22, 50);
  }

  explosion(x: number, y: number, radius = 30, color = 0xff9a30, big = false) {
    const s = radius / 22;
    this.glow(x, y, 0xffffff, s * 1.1, 120);
    this.glow(x, y, color, s * 2, 320);
    this.ring(x, y, color, s * 1.5, 300);
    this.spark(x, y, 0xfff0b0, big ? 26 : 12);
    this.spark(x, y, color, big ? 20 : 8);
    this.debris.explode(big ? 16 : 7, x, y);
    this.smoke.explode(big ? 12 : 5, x, y);
    this.shake(big ? 7 : 3);
    audio.sfx(big ? 'bigexplode' : 'explode');
  }

  popup(x: number, y: number, text: string, color = '#ffffff', size = 8) {
    const t = this.scene.add.text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(DEPTH.fx + 5);
    this.scene.tweens.add({ targets: t, y: y - 22, alpha: { from: 1, to: 0 }, duration: 700, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  shake(power: number) {
    this.scene.cameras.main.shake(60 + power * 22, power * 0.0022, false);
  }

  flash(color = 0xffffff, dur = 90) {
    const c = Phaser.Display.Color.IntegerToColor(color);
    this.scene.cameras.main.flash(dur, c.red, c.green, c.blue, false);
  }

  /** Hit-stop: freeze the simulation for a few frames so heavy hits land with weight. */
  hitstop(ms: number) {
    if (this.freeze <= 0) this.scene.physics.world.pause();
    this.freeze = Math.max(this.freeze, ms);
  }

  /** Returns true while frozen; the scene should skip its update. */
  frozen(delta: number) {
    if (this.freeze <= 0) return false;
    this.freeze -= delta;
    if (this.freeze <= 0) { this.scene.physics.world.resume(); return false; }
    return true;
  }
}
