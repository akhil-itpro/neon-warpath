import Phaser from 'phaser';
import { DEPTH, GRAVITY } from '../config';
import { ART_MUZZLES } from '../data/artMuzzles';
import { ARMS, buildArmRig } from '../systems/ArmRig';
import { CharacterRig } from '../systems/CharacterRig';
import { run } from '../systems/Run';
import { audio } from '../systems/Audio';
import type { Controls } from '../systems/Controls';
import type { GameScene } from '../scenes/Game';

const FRAME_W = 96, FRAME_H = 72;
const STAND: [number, number] = [18, 56];
const LOW: [number, number] = [18, 32];
// Legacy rectangle-cut arms stay opt-in until an operator has purpose-drawn parts.
const ARM_RIG = false;

// Movement feel constants. These numbers ARE the game feel; tune with care and playtest.
const ACCEL = 1700, AIR_ACCEL = 1150, FRICTION = 2100;
const COYOTE = 90, JUMP_BUFFER = 110; // ms of forgiveness
const SLIDE_TIME = 300, SLIDE_SPEED = 400;

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  dir = 1;
  dead = false;
  invuln = 0;
  sliding = 0;
  slideCd = 0;
  dropThrough = 0;
  fireCd = 0;
  overdrive = 0; // ms remaining
  /** Stage environment, set every frame by Gimmicks: gravity / speed / jump multipliers (water, low gravity, flips). */
  env = { grav: 1, speed: 1, jump: 1, water: false };
  private coyote = 0;
  private buffer = 0;
  private airJumps = 0;
  private wasGround = true;
  private art: string;     // texture prefix of the body frames (`rook_b` when the arm is rigged, else `rook`)
  private baseTint: number;
  private aura: Phaser.GameObjects.Image;
  arm: Phaser.GameObjects.Image | null = null;
  rig: CharacterRig | null = null;
  armAng = 0;       // current (smoothed) world angle of the gun arm
  private shotAng = 0;      // keyboard/gamepad: angle of the last shot, held briefly
  private shotUntil = 0;
  private recoil = 0;       // 0..1 kick, decays
  private squash = 0;      // + = stretched tall (jump), - = squashed (landing); decays to 0

  constructor(private gs: GameScene, x: number, y: number) {
    const op = run.op;
    const hasArt = gs.textures.exists(`${op.art}_idle`);
    const baseArt = hasArt ? op.art : 'hero';
    const rigged = ARM_RIG && buildArmRig(gs, baseArt);
    const art = rigged ? `${baseArt}_b` : baseArt;
    super(gs, x, y, `${art}_idle`);
    this.art = art;
    this.baseTint = hasArt ? 0xffffff : op.tint;
    gs.add.existing(this);
    gs.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(DEPTH.player).setTint(this.baseTint);
    this.setSize2(STAND);
    this.body.setMaxVelocityY(900);
    this.aura = gs.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc040).setDepth(DEPTH.player - 1).setVisible(false);

    if (op.rig && CharacterRig.available(gs, op.rig)) {
      this.rig = new CharacterRig(gs, op.rig);
      this.setVisible(false); // the intact fallback sprite remains the physics actor
      this.rig.update(this, 0, false);
    }

    if (rigged) {
      this.arm = gs.add.image(x, y, `${baseArt}_a_idle`).setDepth(DEPTH.player + 0.1).setTint(this.baseTint);
    }
    const key = `${art}-run`;
    if (!gs.anims.exists(key)) {
      gs.anims.create({ key, frames: [0, 1, 2, 3].map((i) => ({ key: `${art}_run${i}` })), frameRate: 12, repeat: -1 });
    }
  }

  private setSize2([w, h]: [number, number]) {
    if (this.body.height === h) return;
    this.body.setSize(w, h, false);
    this.body.setOffset((FRAME_W - w) / 2, FRAME_H - h);
  }

  get onGround() { return this.body.blocked.down || this.body.touching.down; }
  get low() { return this.body.height === LOW[1]; }
  get centerY() { return this.y - this.body.height / 2; }

  /** World position of the gun muzzle for the current pose. */
  muzzle() {
    if (this.rig) return this.rig.muzzle();
    const g = ARMS[this.texture.key];
    if (g && this.arm) {
      const p = this.pivot(g);
      const a = this.armAng, c = Math.cos(a), sn = Math.sin(a);
      const dy = this.dir > 0 ? g.dy : -g.dy; // mirrored arm flips the barrel offset
      return { x: p.x + c * g.len - sn * dy, y: p.y + sn * g.len + c * dy };
    }
    const tip = ART_MUZZLES[this.texture.key];
    if (tip) return { x: this.x + this.dir * tip[0], y: this.y - tip[1] };
    const y = this.low ? this.y - 31 : this.onGround ? this.y - 51 : this.y - 44;
    return { x: this.x + this.dir * 34, y };
  }

  /** World position of the shoulder pivot for the current frame. */
  private pivot(g: { px: number; py: number }) {
    return { x: this.x + this.dir * (g.px - FRAME_W / 2) * this.scaleX, y: this.y + (g.py - FRAME_H) * this.scaleY };
  }

  /** Called by the scene when a shot is fired so the arm snaps to the shot direction (keyboard/gamepad). */
  noteShot(angle: number) {
    this.shotAng = angle; this.shotUntil = this.gs.time.now + 320; this.recoil = 1;
    this.rig?.noteShot(angle);
  }

  /** Keep the arm sprite glued to the body and pointed at the aim target. */
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    const arm = this.arm;
    if (!arm) return;
    const g = ARMS[this.texture.key];
    if (!g) { arm.setVisible(false); return; }
    const pose = this.texture.key.split('_b_')[1];
    const piv = this.pivot(g);
    const fwd = this.dir > 0 ? 0 : Math.PI;
    let want = fwd;
    if (!this.dead) {
      const aim = this.gs.aim;
      if (aim) want = Math.atan2(aim.y - piv.y, aim.x - piv.x);
      else if (time < this.shotUntil) want = this.shotAng;
      else if (pose === 'run0' || pose === 'run1' || pose === 'run2' || pose === 'run3') want = fwd; // arm stays forward
    }
    // limit how far the arm can swing away from the facing direction (tighter while sliding)
    const lim = this.sliding > 0 ? 0.35 : this.low ? 1.1 : 1.75;
    const rel = Phaser.Math.Angle.Wrap(want - fwd);
    want = fwd + Phaser.Math.Clamp(rel, -lim, lim);
    const k = Math.min(1, delta / 55);
    this.armAng += Phaser.Math.Angle.Wrap(want - this.armAng) * k;
    this.recoil = Math.max(0, this.recoil - delta / 130);
    const kick = this.recoil * this.recoil;
    const a = this.armAng - this.dir * kick * 0.07;
    arm.setVisible(true)
      .setTexture(`${this.art.slice(0, -2)}_a_${pose}`)
      .setOrigin(g.ox, g.oy)
      .setFlipX(this.dir < 0)
      .setPosition(piv.x - Math.cos(this.armAng) * kick * 2.5, piv.y - Math.sin(this.armAng) * kick * 2.5)
      .setRotation(this.dir > 0 ? a : a - Math.PI)
      .setScale(this.scaleX, this.scaleY)
      .setAlpha(this.alpha);
  }

  tick(dt: number, c: Controls) {
    const s = run.stats;
    const body = this.body;
    this.invuln -= dt; this.slideCd -= dt; this.dropThrough -= dt; this.fireCd -= dt; this.buffer -= dt;
    if (this.overdrive > 0) {
      this.overdrive -= dt;
      this.aura.setVisible(true).setPosition(this.x, this.centerY).setScale(1.5 + Math.sin(this.gs.time.now / 60) * 0.15).setAlpha(0.55);
      if (this.overdrive <= 0) { this.aura.setVisible(false); audio.intense = this.gs.bossActive; }
    }
    if (this.dead) return;
    const env = this.env;
    body.setGravityY(GRAVITY * (env.grav - 1));
    body.setMaxVelocityY(env.water ? 360 : 900);

    const ground = this.onGround;
    if (ground) { this.coyote = COYOTE; this.airJumps = s.airJumps; } else this.coyote -= dt;
    if (ground && !this.wasGround) { this.gs.fx.dustPuff(this.x, this.y, 5); audio.sfx('land'); this.squash = -1; }
    this.wasGround = ground;

    const axis = c.axis;
    if (c.pressed('jump')) this.buffer = JUMP_BUFFER;

    // --- slide / dash: fast, low, invulnerable. The core defensive move. ---
    if (c.pressed('slide') && this.slideCd <= 0 && this.sliding <= 0) {
      if (axis !== 0) this.dir = axis;
      this.sliding = SLIDE_TIME;
      this.slideCd = s.slideCd;
      this.invuln = Math.max(this.invuln, SLIDE_TIME);
      body.setVelocityX(this.dir * SLIDE_SPEED);
      if (!ground) body.setVelocityY(Math.min(body.velocity.y, 40));
      audio.sfx('slide');
      this.gs.fx.dustPuff(this.x, this.y, 8);
    }

    if (this.sliding > 0) {
      this.sliding -= dt;
      body.setAccelerationX(0);
      body.setVelocityX(this.dir * SLIDE_SPEED * (0.55 + 0.45 * Math.max(0, this.sliding / SLIDE_TIME)));
      if (Math.random() < 0.5 && ground) this.gs.fx.dustPuff(this.x - this.dir * 10, this.y, 1);
      this.ghost();
    } else {
      const crouch = ground && c.held('down');
      const target = crouch ? 0 : axis * s.speed * env.speed;
      const a = ground ? ACCEL : AIR_ACCEL;
      const vx = body.velocity.x;
      if (target !== 0) {
        body.setVelocityX(Phaser.Math.Clamp(vx + Math.sign(target - vx) * a * dt / 1000, -Math.abs(target), Math.abs(target)));
        this.dir = axis;
      } else {
        const drop = FRICTION * dt / 1000 * (ground ? 1 : 0.35);
        body.setVelocityX(Math.abs(vx) <= drop ? 0 : vx - Math.sign(vx) * drop);
      }
    }

    // --- mouse aim: face the crosshair, so you can back away from a target while shooting it ---
    const aim = this.gs.aim;
    if (aim && this.sliding <= 0 && Math.abs(aim.x - this.x) > 6) this.dir = aim.x > this.x ? 1 : -1;

    // --- jump (buffered + coyote time + variable height) ---
    if (this.buffer > 0) {
      if (c.held('down') && ground && this.gs.onOneWay(this)) {
        this.dropThrough = 220; this.buffer = 0;
      } else if (this.coyote > 0 || this.airJumps > 0) {
        if (this.coyote <= 0) { this.airJumps--; this.gs.fx.ring(this.x, this.y, 0x80e0ff, 0.6, 200); }
        body.setVelocityY(-s.jump * env.jump);
        this.coyote = 0; this.buffer = 0; this.sliding = Math.min(this.sliding, 0);
        audio.sfx('jump'); this.squash = 1;
        this.gs.fx.dustPuff(this.x, this.y, 4);
      }
    }
    if (!c.held('jump') && body.velocity.y < -170) body.setVelocityY(-170);

    // --- pose ---
    const lowPose = this.sliding > 0 || (ground && c.held('down'));
    this.setSize2(lowPose ? LOW : STAND);
    this.setFlipX(this.dir < 0);
    if (this.sliding > 0) this.pose('slide');
    else if (!ground) this.pose('jump');
    else if (lowPose) this.pose('crouch');
    else if (Math.abs(body.velocity.x) > 20) {
      this.play(`${this.art}-run`, true);
      const backwards = Math.sign(body.velocity.x) !== this.dir; // back-pedalling plays the run cycle in reverse
      if (this.anims.inReverse !== backwards) this.anims.reverse();
    }
    else this.pose('idle');

    // --- squash & stretch (decays back to 1:1) ---
    this.squash *= Math.pow(0.0025, dt / 1000);
    if (Math.abs(this.squash) < 0.02) this.squash = 0;
    this.setScale(1 - this.squash * 0.07, 1 + this.squash * 0.1);

    // --- blink while invulnerable after a hit ---
    this.setAlpha(this.invuln > 0 && this.sliding <= 0 ? (Math.floor(this.gs.time.now / 50) % 2 ? 0.35 : 1) : 1);

    this.rig?.update(this, dt, lowPose);

    if (c.held('fire') && this.fireCd <= 0) this.gs.playerFire();
    if (c.pressed('overdrive')) this.gs.tryOverdrive();
  }

  private pose(name: string) {
    this.anims.stop();
    this.setTexture(`${this.art}_${name}`);
  }

  private ghostT = 0;
  /** After-image trail during slides. */
  private ghost() {
    if (this.gs.time.now < this.ghostT) return;
    this.ghostT = this.gs.time.now + 40;
    if (this.rig) { this.rig.ghost(); return; }
    const g = this.gs.add.image(this.x, this.y, this.texture.key).setOrigin(0.5, 1).setFlipX(this.flipX).setTintFill(0x40d0ff).setAlpha(0.5).setDepth(DEPTH.player - 1);
    this.gs.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
  }

  flashWhite() {
    this.rig?.flash();
    this.setTintFill(0xffffff); this.arm?.setTintFill(0xffffff);
    this.gs.time.delayedCall(70, () => { if (!this.dead) { this.setTint(this.baseTint); this.arm?.setTint(this.baseTint); } });
  }

  die() {
    this.dead = true;
    this.rig?.die();
    this.aura.setVisible(false);
    this.overdrive = 0;
    this.anims.stop();
    this.setTexture(`${this.art}_slide`).setTint(0xff6060).setAlpha(1);
    this.arm?.setTint(0xff6060);
    this.body.setGravityY(0).setMaxVelocityY(900);
    this.body.setVelocity(-this.dir * 160, -320);
    this.body.setAccelerationX(0);
    this.body.setDragX(300);
  }

  destroy(fromScene?: boolean) {
    this.rig?.destroy();
    this.rig = null;
    this.arm?.destroy();
    this.aura?.destroy();
    super.destroy(fromScene);
  }
}
