import Phaser from 'phaser';
import { DEPTH } from '../config';
import { ART_MUZZLES } from '../data/artMuzzles';
import { run } from '../systems/Run';
import { audio } from '../systems/Audio';
import type { Controls } from '../systems/Controls';
import type { GameScene } from '../scenes/Game';

const FRAME_W = 96, FRAME_H = 72;
const STAND: [number, number] = [18, 56];
const LOW: [number, number] = [18, 32];

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
  private coyote = 0;
  private buffer = 0;
  private airJumps = 0;
  private wasGround = true;
  private art: string;
  private baseTint: number;
  private aura: Phaser.GameObjects.Image;

  constructor(private gs: GameScene, x: number, y: number) {
    const op = run.op;
    const hasArt = gs.textures.exists(`${op.art}_idle`);
    const art = hasArt ? op.art : 'hero';
    super(gs, x, y, `${art}_idle`);
    this.art = art;
    this.baseTint = hasArt ? 0xffffff : op.tint;
    gs.add.existing(this);
    gs.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(DEPTH.player).setTint(this.baseTint);
    this.setSize2(STAND);
    this.body.setMaxVelocityY(900);
    this.aura = gs.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc040).setDepth(DEPTH.player - 1).setVisible(false);

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
    const tip = ART_MUZZLES[this.texture.key];
    if (tip) return { x: this.x + this.dir * tip[0], y: this.y - tip[1] };
    const y = this.low ? this.y - 31 : this.onGround ? this.y - 51 : this.y - 44;
    return { x: this.x + this.dir * 34, y };
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

    const ground = this.onGround;
    if (ground) { this.coyote = COYOTE; this.airJumps = s.airJumps; } else this.coyote -= dt;
    if (ground && !this.wasGround) { this.gs.fx.dustPuff(this.x, this.y, 5); audio.sfx('land'); }
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
      const target = crouch ? 0 : axis * s.speed;
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

    // --- jump (buffered + coyote time + variable height) ---
    if (this.buffer > 0) {
      if (c.held('down') && ground && this.gs.onOneWay(this)) {
        this.dropThrough = 220; this.buffer = 0;
      } else if (this.coyote > 0 || this.airJumps > 0) {
        if (this.coyote <= 0) { this.airJumps--; this.gs.fx.ring(this.x, this.y, 0x80e0ff, 0.6, 200); }
        body.setVelocityY(-s.jump);
        this.coyote = 0; this.buffer = 0; this.sliding = Math.min(this.sliding, 0);
        audio.sfx('jump');
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
    else if (Math.abs(body.velocity.x) > 20) this.play(`${this.art}-run`, true);
    else this.pose('idle');

    // --- blink while invulnerable after a hit ---
    this.setAlpha(this.invuln > 0 && this.sliding <= 0 ? (Math.floor(this.gs.time.now / 50) % 2 ? 0.35 : 1) : 1);

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
    const g = this.gs.add.image(this.x, this.y, this.texture.key).setOrigin(0.5, 1).setFlipX(this.flipX).setTintFill(0x40d0ff).setAlpha(0.5).setDepth(DEPTH.player - 1);
    this.gs.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
  }

  flashWhite() {
    this.setTintFill(0xffffff);
    this.gs.time.delayedCall(70, () => { if (!this.dead) this.setTint(this.baseTint); });
  }

  die() {
    this.dead = true;
    this.aura.setVisible(false);
    this.overdrive = 0;
    this.anims.stop();
    this.setTexture(`${this.art}_slide`).setTint(0xff6060).setAlpha(1);
    this.body.setVelocity(-this.dir * 160, -320);
    this.body.setAccelerationX(0);
    this.body.setDragX(300);
  }
}
