import Phaser from 'phaser';
import { DEPTH } from '../config';
import type { RigDef, RigPart } from '../data/rigs';

export interface RigActor {
  x: number; y: number; dir: number; scaleX: number; scaleY: number; alpha: number;
  body: { velocity: { x: number; y: number } };
  onGround: boolean; sliding: number;
}

/** A visual puppet only. Player retains its original physics, movement and combat rules. */
export class CharacterRig {
  readonly root: Phaser.GameObjects.Container;
  readonly parts: Record<RigPart, Phaser.GameObjects.Image>;
  phase = 0;
  private aim = 0;
  private recoil = 0;
  private flinch = 0;
  private whiteUntil = 0;
  private dead = false;
  private lastShot = 0;
  private shotUntil = 0;

  static available(scene: Phaser.Scene, def: RigDef) {
    return Object.values(def.parts).every(p => scene.textures.exists(p.texture));
  }

  constructor(private scene: Phaser.Scene, readonly def: RigDef) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH.player);
    const parts = {} as Record<RigPart, Phaser.GameObjects.Image>;
    // Draw order is intentional: far limbs, chest, near limbs, then gun.
    for (const name of ['far_thigh', 'far_shin', 'support', 'torso', 'thigh', 'shin', 'head', 'arm'] as RigPart[]) {
      const p = def.parts[name];
      parts[name] = scene.add.image(0, 0, p.texture).setOrigin(...p.pivot);
      this.root.add(parts[name]);
    }
    this.parts = parts;
  }

  noteShot(angle: number) {
    this.recoil = 1;
    this.lastShot = angle;
    this.shotUntil = this.scene.time.now + 320;
  }

  flash() {
    this.whiteUntil = this.scene.time.now + 70;
    this.flinch = 1;
    // Hit-stop skips Player.tick: show the flash immediately, even while physics is frozen.
    for (const part of Object.values(this.parts)) part.setTintFill(0xffffff);
  }

  private foot(phase: number): [number, number] {
    const frames = this.def.runFeet, n = frames.length;
    const frame = ((phase % 1) + 1) % 1 * n;
    const a = frames[Math.floor(frame)], b = frames[(Math.floor(frame) + 1) % n];
    const t = frame % 1;
    return [Phaser.Math.Linear(a[0], b[0], t), Phaser.Math.Linear(a[1], b[1], t)];
  }

  /** Two-bone leg solution: the foot target is stable while each piece rotates at its joint. */
  private leg(far: boolean, hx: number, hy: number, target: readonly [number, number]) {
    const a = this.def.upperLeg, b = this.def.lowerLeg;
    const [dx, dy] = target;
    const dist = Phaser.Math.Clamp(Math.hypot(dx, dy), 1, a + b - 0.05);
    const angle = Math.atan2(dy, dx);
    const bend = Math.acos(Phaser.Math.Clamp((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1));
    const upper = angle - bend; // knees bend forward, never backwards
    const kx = hx + Math.cos(upper) * a, ky = hy + Math.sin(upper) * a;
    const fx = hx + Math.cos(angle) * dist, fy = hy + Math.sin(angle) * dist;
    this.parts[far ? 'far_thigh' : 'thigh'].setPosition(hx, hy).setRotation(upper - Math.PI / 2);
    this.parts[far ? 'far_shin' : 'shin'].setPosition(kx, ky).setRotation(Math.atan2(fy - ky, fx - kx) - Math.PI / 2);
  }

  update(p: RigActor, dt: number, crouched: boolean) {
    if (this.dead) return;
    const time = this.scene.time.now;
    const vx = p.body.velocity.x;
    const moving = p.onGround && !crouched && Math.abs(vx) > 20;
    if (moving) this.phase += vx * p.dir * dt / (1000 * this.def.stride);
    const bob = moving ? -Math.abs(Math.sin(this.phase * Math.PI * 2)) : Math.sin(time / 360) * 0.5;
    let hx = this.def.hip[0], hy = this.def.hip[1] + bob;
    if (crouched) { hx -= p.sliding > 0 ? 5 : 2; hy += 23; }
    this.root.setPosition(p.x, p.y).setScale(p.dir * p.scaleX, p.scaleY).setAlpha(p.alpha);
    if (p.sliding > 0) {
      this.leg(true, hx - 3, hy, [-18, 1]); this.leg(false, hx + 3, hy, [17, 5]);
    } else if (crouched) {
      this.leg(true, hx - 3, hy, [-9, 6]); this.leg(false, hx + 3, hy, [8, 6]);
    } else if (!p.onGround) {
      const falling = p.body.velocity.y > 0;
      this.leg(true, hx - 3, hy, [-10, falling ? 26 : 17]);
      this.leg(false, hx + 3, hy, [8, falling ? 28 : 20]);
    } else {
      this.leg(true, hx - 3, hy, moving ? this.foot(this.phase + 0.5) : [-4, 30]);
      this.leg(false, hx + 3, hy, moving ? this.foot(this.phase) : [4, 30]);
    }
    const lean = moving ? Math.sign(vx) * p.dir * 0.09 : p.sliding > 0 ? 0.3 : 0;
    const hurt = this.flinch * 2;
    const drop = hy - this.def.hip[1];
    this.parts.torso.setPosition(hx - hurt, hy).setRotation(lean - this.flinch * 0.12);
    this.parts.head.setPosition(hx + this.def.head[0] - hurt, this.def.head[1] + drop).setRotation(lean * 0.4);
    const sx = hx + this.def.shoulder[0] - hurt, sy = this.def.shoulder[1] + drop;
    const aim = (this.scene as Phaser.Scene & { aim: { x: number; y: number } | null }).aim;
    let want = 0;
    if (aim) want = Math.atan2(aim.y - (p.y + sy * p.scaleY), (aim.x - (p.x + sx * p.dir * p.scaleX)) * p.dir);
    else if (time < this.shotUntil) want = p.dir > 0 ? this.lastShot : Math.PI - this.lastShot;
    want = Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(want), p.sliding > 0 ? -0.35 : -1.5, p.sliding > 0 ? 0.35 : 1.5);
    this.aim += Phaser.Math.Angle.Wrap(want - this.aim) * Math.min(1, dt / 45);
    this.recoil = Math.max(0, this.recoil - dt / 130);
    this.flinch = Math.max(0, this.flinch - dt / 180);
    const kick = this.recoil * this.recoil;
    this.parts.arm.setPosition(sx - Math.cos(this.aim) * kick * 2, sy - Math.sin(this.aim) * kick * 2).setRotation(this.aim - kick * 0.06);
    this.parts.support.setPosition(sx - 4, sy + 2).setRotation(this.aim + 0.07);
    for (const part of Object.values(this.parts)) {
      if (time < this.whiteUntil) part.setTintFill(0xffffff);
      else part.clearTint();
    }
  }

  muzzle() {
    const arm = this.parts.arm;
    return arm.getWorldTransformMatrix().transformPoint(this.def.muzzle[0] - arm.displayOriginX, this.def.muzzle[1] - arm.displayOriginY);
  }

  ghost() {
    this.fragments(false);
  }

  die() {
    if (this.dead) return;
    this.fragments(true);
    this.dead = true;
    this.root.setVisible(false);
  }

  private fragments(death: boolean) {
    for (const part of Object.values(this.parts)) {
      const matrix = part.getWorldTransformMatrix();
      const fragment = this.scene.add.image(matrix.tx, matrix.ty, part.texture.key)
        .setOrigin(part.originX, part.originY).setScale(Math.abs(this.root.scaleX), this.root.scaleY)
        .setFlipX(this.root.scaleX < 0).setRotation(part.rotation * Math.sign(this.root.scaleX))
        .setDepth(DEPTH.player - 1).setAlpha(death ? 1 : 0.4);
      if (death) {
        this.scene.physics.add.existing(fragment);
        (fragment.body as Phaser.Physics.Arcade.Body).setVelocity(Phaser.Math.Between(-130, 130), Phaser.Math.Between(-320, -150));
        this.scene.tweens.add({ targets: fragment, angle: fragment.angle + Phaser.Math.Between(-160, 160), alpha: 0, duration: 950, onComplete: () => fragment.destroy() });
      } else {
        fragment.setTintFill(0x40d0ff);
        this.scene.tweens.add({ targets: fragment, alpha: 0, duration: 220, onComplete: () => fragment.destroy() });
      }
    }
  }

  destroy() { this.root.destroy(); }
}
