import Phaser from 'phaser';
import { DEPTH } from '../config';

// Pooled projectile used by both sides. Configure with fire(); the scene owns collision results.
export class Shot extends Phaser.Physics.Arcade.Image {
  dmg = 0;
  life = 0;
  pierce = false;
  blast = 0;
  color = 0xffffff;
  smoke = false; // leaves a smoke trail (rockets)
  chain = 0; // lightning jumps left
  chill = 0; // ms of freeze applied on hit
  pull = false; // implodes before exploding
  rehit = 0; // ms between repeat hits on the same enemy (saw blades spin while this is set)
  private rehitT = 0;
  hit = new Set<object>(); // enemies already damaged by a piercing shot
  private glowImg?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet');
  }

  fire(tex: string, x: number, y: number, angle: number, speed: number, dmg: number, color: number, opts: { life?: number; pierce?: boolean; blast?: number; gravity?: boolean; smoke?: boolean; scale?: number; chain?: number; chill?: number; pull?: boolean; rehit?: number } = {}) {
    this.setTexture(tex);
    this.enableBody(true, x, y, true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(!!opts.gravity);
    const r = Math.max(3, Math.min(this.width, this.height) / 2);
    body.setCircle(r, this.width / 2 - r, this.height / 2 - r);
    this.setScale(opts.scale ?? 1).setTint(color).setDepth(DEPTH.shot).setRotation(angle);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.dmg = dmg;
    this.color = color;
    this.life = opts.life ?? 1400;
    this.pierce = !!opts.pierce;
    this.blast = opts.blast ?? 0;
    this.smoke = !!opts.smoke;
    this.chain = opts.chain ?? 0;
    this.chill = opts.chill ?? 0;
    this.pull = !!opts.pull;
    this.rehit = this.rehitT = opts.rehit ?? 0;
    this.hit.clear();
    if (!this.glowImg) this.glowImg = this.scene.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.shot - 1);
    this.glowImg.setVisible(true).setTint(color).setScale(0.38 * (opts.scale ?? 1)).setAlpha(0.8).setPosition(x, y);
    return this;
  }

  kill() {
    this.disableBody(true, true);
    this.glowImg?.setVisible(false);
  }

  // called by the owning group (runChildUpdate)
  update(_t: number, dt: number) {
    if (!this.active) return;
    this.life -= dt;
    this.glowImg?.setPosition(this.x, this.y);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.allowGravity) this.setRotation(Math.atan2(body.velocity.y, body.velocity.x));
    if (this.rehit) {
      this.rotation += dt * 0.03;
      if ((this.rehitT -= dt) <= 0) { this.hit.clear(); this.rehitT = this.rehit; }
    }
    if (this.life <= 0) this.kill();
  }
}
