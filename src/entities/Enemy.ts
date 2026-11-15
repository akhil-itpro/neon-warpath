import Phaser from 'phaser';
import { DEPTH, GROUND_Y, GRAVITY } from '../config';
import type { EnemyDef } from '../data/enemies';
import { audio } from '../systems/Audio';
import type { GameScene } from '../scenes/Game';

const R = Phaser.Math;
const rad = R.DegToRad;

/** Picks final art if present in the asset manifest, else the tinted stand-in (see data/enemies.ts). */
function resolveArt(scene: Phaser.Scene, def: EnemyDef) {
  const multi: string[] = [];
  for (let i = 0; scene.textures.exists(`${def.art}_${i}`); i++) multi.push(`${def.art}_${i}`);
  if (multi.length) return { frames: multi, tint: 0xffffff, scale: def.artScale ?? 1 };
  if (scene.textures.exists(def.art)) return { frames: [def.art], tint: 0xffffff, scale: def.artScale ?? def.fallback.scale ?? 1 };
  return { frames: def.fallback.frames, tint: def.fallback.tint ?? 0xffffff, scale: def.fallback.scale ?? 1 };
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  hp: number;
  maxHp: number;
  dead = false;
  awake = false;
  tag = ''; // 'enc' = belongs to the active encounter
  dir = -1; // -1 facing left, +1 facing right
  arena = { left: 0, right: 0, cx: 0 };
  private frames: string[];
  private baseTint: number;
  private t = 0; // attack timer
  private st = 0; // state timer
  private mode = 'idle';
  private n = 0; // generic counter
  private sub = 0; // sub-step inside a multi-part attack
  private seed = Math.random() * 1000;
  private animT = 0;
  private stun = 0;
  private cold = 0; // ms of freeze tint left (cryo weapon)
  private tx = 0; // remembered target x for multi-step attacks

  constructor(readonly gs: GameScene, readonly def: EnemyDef, x: number, y: number) {
    const art = resolveArt(gs, def);
    super(gs, x, y, art.frames[0]);
    this.frames = art.frames;
    this.baseTint = art.tint;
    this.hp = this.maxHp = def.hp;
    gs.add.existing(this);
    gs.physics.add.existing(this);
    this.setScale(art.scale).setTint(art.tint).setDepth(def.boss ? DEPTH.enemy + 1 : DEPTH.enemy);
    const [bw, bh] = def.body;
    this.body.setSize(bw, bh, false);
    if (def.flying) {
      this.body.setOffset((this.width - bw) / 2, (this.height - bh) / 2);
      this.body.setAllowGravity(false);
    } else {
      this.setOrigin(0.5, 1);
      this.body.setOffset((this.width - bw) / 2, this.height - bh);
    }
    this.t = 600 + Math.random() * (def.fireRate ?? 1500);
    if (def.ai === 'jet' || def.boss) this.awake = true;
    if (def.ai === 'jet') {
      this.dir = x < gs.cameras.main.midPoint.x ? 1 : -1;
      this.setFlipX(this.dir > 0);
      this.body.setVelocityX(this.dir * def.speed);
      audio.sfx('warn');
    }
    if (def.ai === 'boss_heli' || def.ai === 'boss_stomper' || def.ai === 'boss_seer') this.mode = 'enter';
  }

  get cy() { return this.def.flying ? this.y : this.y - this.displayHeight / 2; }

  hurt(dmg: number, srcX: number) {
    if (this.dead) return;
    if (this.def.shield && Math.sign(srcX - this.x) === this.dir) { // shield faces the shooter
      dmg *= this.def.shield;
      this.gs.fx.spark(this.x + this.dir * 16, this.cy, 0x9fd0ff, 4);
    }
    this.hp -= dmg;
    this.awake = true;
    this.setTintFill(0xffffff);
    this.gs.time.delayedCall(55, () => { if (this.active && !this.dead) this.setTint(this.baseTint); });
    if (!this.def.heavy && !this.def.flying) {
      this.body.setVelocityX(Math.sign(this.x - srcX || 1) * 80);
      this.stun = 90;
    }
    if (this.hp <= 0) this.gs.killEnemy(this);
  }

  /** Cryo weapons: freeze in place for a moment. Bosses shrug it off; heavies thaw faster. */
  chill(ms: number) {
    if (this.dead || this.def.boss || this.def.faction === 'prop') return;
    const t = this.def.heavy ? ms * 0.5 : ms;
    this.stun = Math.max(this.stun, t);
    this.cold = Math.max(this.cold, t + 60);
    this.body.setVelocity(0, this.def.flying ? 0 : this.body.velocity.y);
  }

  private get p() { return this.gs.player; }
  private onScreen(pad = 0) { return Math.abs(this.x - this.gs.cameras.main.midPoint.x) < 320 + pad; }
  private shoot(x: number, y: number, angle: number, speed: number, dmg = 10, opts: Parameters<GameScene['enemyShot']>[5] = {}) {
    this.gs.enemyShot(x, y, angle, speed, dmg, opts);
  }
  private later(ms: number, fn: () => void) {
    this.gs.time.delayedCall(ms, () => { if (this.active && !this.dead && !this.p.dead) fn(); });
  }
  private walkAnim(dt: number, moving: boolean) {
    if (this.frames.length < 2) { // single-pose art: rock from foot to foot instead of cycling frames
      if (!this.def.flying) { this.animT += dt; this.setRotation(moving ? Math.sin(this.animT / 95) * 0.06 : 0); }
      return;
    }
    if (!moving) { this.setTexture(this.frames[this.frames.length - 1]); return; }
    this.animT += dt;
    this.setTexture(this.frames[Math.floor(this.animT / 170) % this.frames.length]);
  }
  private face() {
    this.dir = this.p.x >= this.x ? 1 : -1;
    this.setFlipX(this.dir > 0); // source sprites face left
  }
  private hoverTo(tx: number, ty: number, speed: number, ease = 0.06) {
    const b = this.body;
    b.setVelocity(
      b.velocity.x + (R.Clamp((tx - this.x) * 2.5, -speed, speed) - b.velocity.x) * ease,
      b.velocity.y + (R.Clamp((ty - this.y) * 2.5, -speed, speed) - b.velocity.y) * ease,
    );
  }

  tick(dt: number) {
    if (this.dead) return;
    const p = this.p;
    const dx = p.x - this.x;
    if (!this.awake) {
      if (Math.abs(dx) < 370) this.awake = true; else return;
    }
    if (this.cold > 0) { this.cold -= dt; this.setTint(this.cold > 0 ? 0x70c8ff : this.baseTint); }
    if (this.stun > 0) { this.stun -= dt; return; }
    this.t -= dt; this.st -= dt;
    const d = this.def;
    const now = this.gs.time.now;

    switch (d.ai) {
      case 'gunner': {
        const range = d.range ?? 200;
        const far = Math.abs(dx) > range;
        // shield carriers turn slowly, so sliding past them opens their back
        if (!d.shield || this.st <= 0) { const was = this.dir; this.face(); if (d.shield && was !== this.dir) this.st = 1300; }
        this.body.setVelocityX(far ? this.dir * d.speed : 0);
        this.walkAnim(dt, far);
        if (this.t <= 0 && this.onScreen() && Math.abs(dx) < range + 70 && !p.dead) {
          this.t = (d.fireRate ?? 1700) * R.FloatBetween(0.8, 1.25);
          const [fx, fy] = d.muzzle ?? [26, 45];
          const mx = () => this.x + this.dir * fx * this.scale, my = () => this.y - fy * this.scale;
          const wind = d.windup ?? 260, col = d.shotColor ?? 0xff5040;
          this.gs.telegraph(mx(), my(), d.shotColor ?? 0xff4030, wind, wind > 500 ? 0.9 : 0.55);
          for (let i = 0; i < (d.burst ?? 1); i++) {
            this.later(wind + i * 120, () => {
              let a = Math.atan2(p.centerY - my(), p.x - mx());
              const base = this.dir > 0 ? 0 : Math.PI;
              a = base + R.Clamp(R.Angle.Wrap(a - base), -rad(28), rad(28));
              // the Traffic Totem fires its lights in order: red, amber, green
              this.shoot(mx(), my(), a, d.shotSpeed ?? 200, 10, { color: d.id === 'totem' ? [0xff4040, 0xffc030, 0x50ff60][i % 3] : col });
            });
          }
        }
        break;
      }
      case 'rusher': {
        if (this.mode === 'idle') {
          this.face();
          this.body.setVelocityX(this.dir * d.speed);
          this.walkAnim(dt, true);
          if (Math.abs(dx) < 86 && this.st <= 0) { this.mode = 'wind'; this.st = 300; this.body.setVelocityX(0); this.setTintFill(0xffffff); }
        } else if (this.mode === 'wind') {
          if (Math.floor(now / 60) % 2) this.setTint(this.baseTint); else this.setTintFill(0xff8080);
          if (this.st <= 0) { this.mode = 'lunge'; this.st = 330; this.setTint(this.baseTint); this.body.setVelocityX(this.dir * 290); this.gs.fx.dustPuff(this.x, this.y, 4); }
        } else if (this.st <= 0) { this.mode = 'idle'; this.st = 800; }
        break;
      }
      case 'flyer': {
        this.face();
        this.hoverTo(p.x - this.dir * (110 + this.seed % 70), 150 + Math.sin((now + this.seed * 9) / 500) * 34, d.speed); // seed spreads a flock out
        this.setRotation(this.body.velocity.x * 0.0006);
        if (this.t <= 0 && this.onScreen() && !p.dead) {
          this.t = (d.fireRate ?? 1900) * R.FloatBetween(0.8, 1.2);
          const wind = d.windup ?? 300, col = d.shotColor ?? 0xff5040;
          this.gs.telegraph(this.x, this.y + 8, d.shotColor ?? 0xff4030, wind, d.radial ? 0.9 : 0.55);
          this.later(wind, () => {
            if (d.radial) for (let i = 0; i < d.radial; i++) this.shoot(this.x, this.y, (i / d.radial) * Math.PI * 2 + this.seed, d.shotSpeed ?? 140, 10, { color: col });
            else this.shoot(this.x, this.y + 8, Math.atan2(p.centerY - this.y, p.x - this.x), d.shotSpeed ?? 180, 10, { color: col });
          });
        }
        break;
      }
      case 'diver': {
        if (this.mode === 'idle') {
          this.hoverTo(p.x + Math.sin(this.seed) * 90, 110, d.speed, 0.08);
          this.n += dt;
          if (this.n > 900 && Math.abs(dx) < 220) { this.mode = 'lock'; this.st = 380; this.body.setVelocity(0, 0); audio.sfx('warn'); }
        } else if (this.mode === 'lock') {
          if (Math.floor(now / 50) % 2) this.setTintFill(0xff3020); else this.setTint(this.baseTint);
          if (this.st <= 0) {
            this.mode = 'dive'; this.st = 1300;
            const a = Math.atan2(p.centerY - this.y, p.x - this.x);
            this.body.setVelocity(Math.cos(a) * 350, Math.sin(a) * 350);
            this.setRotation(a - Math.PI / 2);
          }
        } else {
          this.gs.fx.puff(this.x, this.y, 1);
          if (this.st <= 0 || this.y > GROUND_Y - 12) this.explode();
        }
        break;
      }
      case 'blinker': {
        this.walkAnim(dt, true);
        this.face();
        this.hoverTo(p.x - this.dir * 140, 190 + Math.sin((now + this.seed * 7) / 420) * 26, d.speed);
        if (this.t <= 0 && this.onScreen(40) && !p.dead) {
          this.t = (d.fireRate ?? 2300) * R.FloatBetween(0.85, 1.2);
          this.gs.fx.ring(this.x, this.y, 0xb070ff, 0.9, 220);
          const side = Math.random() < 0.5 ? -1 : 1;
          this.setPosition(R.Clamp(p.x + side * R.Between(100, 165), this.gs.bounds.left + 20, this.gs.bounds.right - 20), R.Between(165, 250));
          this.body.setVelocity(0, 0);
          this.gs.fx.ring(this.x, this.y, 0xb070ff, 1.1, 260);
          this.gs.fx.glow(this.x, this.y, 0xb070ff, 1.2, 240);
          audio.sfx('blink');
          this.gs.telegraph(this.x, this.y, 0xc080ff, 380);
          this.later(380, () => {
            const a = Math.atan2(p.centerY - this.y, p.x - this.x);
            for (const o of [-0.26, 0, 0.26]) this.shoot(this.x, this.y, a + o, d.shotSpeed ?? 190, 10, { color: 0xc080ff });
          });
        }
        break;
      }
      case 'lobber': {
        this.walkAnim(dt, true);
        this.face();
        this.hoverTo(p.x - this.dir * 150, 185 + Math.sin((now + this.seed * 5) / 600) * 22, d.speed);
        if (this.t <= 0 && this.onScreen() && !p.dead) {
          this.t = (d.fireRate ?? 2000) * R.FloatBetween(0.85, 1.2);
          this.gs.telegraph(this.x, this.y, 0xff7020, 300);
          this.later(300, () => this.lob(p.x + p.body.velocity.x * 0.3, GROUND_Y - 6, 0.95));
        }
        break;
      }
      case 'spitter': { // walks into range, then lobs arcing globs at marked spots on the floor
        this.face();
        const range = d.range ?? 190;
        const far = Math.abs(dx) > range;
        this.body.setVelocityX(far ? this.dir * d.speed : 0);
        this.walkAnim(dt, far);
        if (this.t <= 0 && this.onScreen() && Math.abs(dx) < range + 80 && !p.dead) {
          this.t = (d.fireRate ?? 2400) * R.FloatBetween(0.85, 1.2);
          const col = d.shotColor ?? 0xff7020, wind = d.windup ?? 420;
          const sx = () => this.x + this.dir * 12, sy = () => this.y - this.displayHeight * 0.72;
          this.gs.telegraph(sx(), sy(), col, wind);
          for (let i = 0; i < (d.burst ?? 1); i++) {
            this.later(wind + i * 230, () => {
              const tx = p.x + p.body.velocity.x * 0.3 + (i ? R.Between(-70, 70) : 0);
              this.gs.telegraph(tx, GROUND_Y - 4, col, 900, 0.8);
              this.lob(tx, GROUND_Y - 6, 0.9, sx(), sy(), col);
            });
          }
        }
        break;
      }
      case 'egg': { // hatches when the player gets close; destroy it first for a bonus
        if (this.mode === 'idle') {
          if (Math.abs(dx) < 140) { this.mode = 'hatch'; this.st = 800; audio.sfx('warn'); this.gs.telegraph(this.x, this.cy, 0xc060ff, 800, 1); }
        } else {
          if (Math.floor(now / 60) % 2) this.setTintFill(0xe0a0ff); else this.setTint(this.baseTint);
          this.setRotation(Math.sin(now / 30) * 0.08);
          if (this.st <= 0) {
            const e = this.gs.spawnEnemy(d.adds ?? 'spiderling', this.x, GROUND_Y, this.tag);
            e.awake = true;
            this.gs.killEnemy(this, false);
          }
        }
        break;
      }
      case 'turret': {
        this.face();
        if (this.t <= 0 && this.onScreen() && Math.abs(dx) < (d.range ?? 380) && !p.dead) {
          this.t = (d.fireRate ?? 2500) * R.FloatBetween(0.9, 1.15);
          const mx = () => this.x + this.dir * 32 * this.scale, my = () => this.y - 41 * this.scale;
          this.gs.telegraph(mx(), my(), 0xffa020, 420);
          for (let i = 0; i < (d.burst ?? 5); i++) {
            this.later(420 + i * 85, () => { this.shoot(mx(), my(), this.dir > 0 ? 0 : Math.PI, d.shotSpeed ?? 240); this.gs.fx.muzzle(mx(), my(), 0xffa020); });
          }
        }
        break;
      }
      case 'jet': {
        this.body.setVelocityX(this.dir * d.speed);
        if (this.t <= 0 && Math.abs(dx) < 250) {
          this.t = 200;
          this.shoot(this.x, this.y + 14, Math.PI / 2 - this.dir * 0.7, 120, 14, { tex: 'bomb', gravity: true, blast: 30, color: 0xffffff, life: 3000 });
        }
        const mid = this.gs.cameras.main.midPoint.x;
        if ((this.dir > 0 && this.x > mid + 460) || (this.dir < 0 && this.x < mid - 460)) this.gs.removeEnemy(this);
        break;
      }
      case 'boss_heli': this.heli(dt); break;
      case 'boss_warden': this.warden(); break;
      case 'boss_core': this.core(dt); break;
      case 'boss_stomper': this.stomper(dt); break;
      case 'boss_seer': this.seer(); break;
      case 'crate': case 'barrel': break;
    }
  }

  /** Lob an arcing projectile that lands at (tx, ty) after `time` seconds. */
  private lob(tx: number, ty: number, time: number, sx = this.x, sy = this.y, color = 0xff7020) {
    const vx = (tx - sx) / time;
    const vy = (ty - sy - 0.5 * GRAVITY * time * time) / time;
    this.shoot(sx, sy, Math.atan2(vy, vx), Math.hypot(vx, vy), 14, { gravity: true, blast: 28, color, life: 3000, scale: 1.3 });
  }

  explode() {
    if (this.dead) return;
    this.gs.blastPlayer(this.x, this.y, 46, this.def.contact);
    this.gs.killEnemy(this, false);
  }

  // ---------------------------------------------------------------- BOSS: VULTURE GUNSHIP
  private heli(dt: number) {
    const p = this.p, a = this.arena, now = this.gs.time.now;
    const rage = this.hp < this.maxHp * 0.5;
    this.setRotation(R.Clamp(this.body.velocity.x * 0.0005, -0.2, 0.2));
    const gun = () => ({ x: this.x + this.dir * 70, y: this.y + 22 });
    if (this.mode === 'enter') {
      this.hoverTo(a.cx, 110, 140, 0.1);
      if (Math.abs(this.x - a.cx) < 30) { this.mode = 'hover'; this.st = 900; }
      return;
    }
    if (this.mode === 'swoop') {
      // n: 0 = line up high on one side, 1 = drop low, 2 = rake across the floor, 3 = climb out
      const side = this.dir;
      if (this.sub === 0) { this.hoverTo(side > 0 ? a.left + 70 : a.right - 70, 100, 320, 0.2); if (this.st <= 0) { this.sub = 1; this.st = 520; } }
      else if (this.sub === 1) { this.hoverTo(side > 0 ? a.left + 70 : a.right - 70, GROUND_Y - 70, 300, 0.25); if (this.st <= 0) { this.sub = 2; audio.sfx('rocket'); } }
      else if (this.sub === 2) {
        this.body.setVelocity(side * 400, (GROUND_Y - 70 - this.y) * 4);
        if (Math.random() < 0.4) this.gs.fx.dustPuff(this.x, GROUND_Y, 2);
        if ((side > 0 && this.x > a.right - 80) || (side < 0 && this.x < a.left + 80)) { this.sub = 3; this.st = 700; }
      } else { this.hoverTo(this.x, 110, 220, 0.15); if (this.st <= 0) { this.mode = 'hover'; this.st = 800; } }
      return;
    }
    this.face();
    this.hoverTo(a.cx + Math.sin(now / 1300) * 210, 112 + Math.sin(now / 600) * 14, this.def.speed * (rage ? 1.5 : 1));
    if (this.mode === 'hover' && this.st <= 0 && !p.dead) {
      const pick = this.n++ % 3;
      if (pick === 0) {
        this.mode = 'busy'; this.st = 1700;
        for (let i = 0; i < (rage ? 14 : 9); i++) this.later(300 + i * 90, () => { const g = gun(); this.shoot(g.x, g.y, Math.atan2(p.centerY - g.y, p.x - g.x) + R.FloatBetween(-0.06, 0.06), 250); this.gs.fx.muzzle(g.x, g.y, 0xffa020); });
        this.gs.telegraph(gun().x, gun().y, 0xff4030, 300);
      } else if (pick === 1) {
        this.mode = 'busy'; this.st = 2100;
        for (let v = 0; v < (rage ? 4 : 3); v++) this.later(300 + v * 480, () => { for (let i = 0; i < 7; i++) this.shoot(this.x, this.y + 26, rad(30 + i * 20 + (v % 2) * 10), 165, 10, { color: 0xffa040 }); audio.sfx('eshoot'); });
        if (rage && this.gs.countAlive('drone') < 3) { this.gs.spawnEnemy('drone', a.left + 40, -20, 'enc'); this.gs.spawnEnemy('drone', a.right - 40, -20, 'enc'); }
      } else {
        // start on the far side from the player, then rake across the floor toward them
        this.mode = 'swoop'; this.sub = 0; this.st = 900;
        this.dir = p.x > a.cx ? -1 : 1;
        this.setFlipX(this.dir > 0);
        audio.sfx('warn');
        this.gs.banner('! LOW PASS - GET DOWN !', 1100);
      }
    }
    if (this.mode === 'busy' && this.st <= 0) { this.mode = 'hover'; this.st = rage ? 500 : 900; }
    void dt;
  }

  // ---------------------------------------------------------------- BOSS: FURNACE WARDEN
  private warden() {
    const p = this.p, a = this.arena;
    const hpPct = this.hp / this.maxHp;
    if (this.mode === 'idle' && this.st <= 0 && !p.dead) {
      const pick = this.n++ % (hpPct < 0.45 ? 4 : 3);
      this.mode = 'busy';
      const portX = this.x - 70;
      if (pick === 0) {
        // rows: high = crouch/slide under, low = jump over
        const shots = hpPct < 0.5 ? 9 : 6;
        this.st = 500 + shots * 470;
        for (let i = 0; i < shots; i++) {
          const high = Math.random() < 0.5;
          const y = high ? GROUND_Y - 44 : GROUND_Y - 9;
          this.later(i * 470, () => this.gs.telegraph(portX, y, high ? 0xff4030 : 0xffc020, 300));
          this.later(300 + i * 470, () => { this.shoot(portX, y, Math.PI, 250, 12, { color: high ? 0xff5040 : 0xffc020, scale: 1.3 }); audio.sfx('eshoot'); });
        }
      } else if (pick === 1) {
        this.st = 2600;
        const n = hpPct < 0.5 ? 7 : 5;
        for (let i = 0; i < n; i++) {
          this.later(200 + i * 260, () => {
            const tx = R.Clamp(p.x + R.Between(-70, 70), a.left + 20, this.x - 110);
            this.gs.telegraph(tx, GROUND_Y - 4, 0xff7020, 1150, 1.1);
            this.lob(tx, GROUND_Y - 6, 1.15, this.x - 30, this.y - 130);
            this.gs.fx.muzzle(this.x - 30, this.y - 130, 0xff7020);
            audio.sfx('shotgun');
          });
        }
      } else if (pick === 2) {
        this.st = 1800;
        audio.sfx('warn');
        if (this.gs.countAlive('zombie') < 4) for (let i = 0; i < 3; i++) this.gs.spawnEnemy('zombie', a.left - 30 - i * 34, GROUND_Y, 'add');
        if (hpPct < 0.66 && this.gs.countAlive('brute') < 1) this.gs.spawnEnemy('brute', a.left - 140, GROUND_Y, 'add');
      } else {
        this.st = 2400;
        const bx = this.x - 150, by = this.y - 95;
        this.gs.telegraph(bx, by, 0xff4030, 400, 1.2);
        for (let v = 0; v < 4; v++) this.later(400 + v * 420, () => {
          const ang = Math.atan2(p.centerY - by, p.x - bx);
          for (const o of [-0.3, -0.15, 0, 0.15, 0.3]) this.shoot(bx, by, ang + o, 215);
          this.gs.fx.muzzle(bx, by, 0xff4030); audio.sfx('eshoot');
        });
      }
    }
    if (this.mode === 'busy' && this.st <= 0) { this.mode = 'idle'; this.st = hpPct < 0.5 ? 450 : 850; }
  }

  // ---------------------------------------------------------------- BOSS: ARCHON CORE
  private core(dt: number) {
    const p = this.p, a = this.arena, now = this.gs.time.now;
    const rage = this.hp < this.maxHp * 0.5;
    this.rotation += dt * (rage ? 0.003 : 0.0015);
    if (this.mode === 'idle') {
      // exposed: drifts low so it can be punished
      this.hoverTo(this.x, 205 + Math.sin(now / 300) * 6, 120, 0.1);
      if (this.st <= 0 && !p.dead) {
        this.gs.fx.ring(this.x, this.y, 0xff4040, 1.6, 260);
        const anchors = [a.left + 110, a.cx, a.right - 110].filter((x) => Math.abs(x - this.x) > 60);
        this.setPosition(R.RND.pick(anchors), 140);
        this.body.setVelocity(0, 0);
        this.gs.fx.ring(this.x, this.y, 0xff4040, 2, 320);
        this.gs.fx.glow(this.x, this.y, 0xff4040, 2.4, 300);
        audio.sfx('blink');
        this.mode = 'busy';
        const pick = this.n++ % (rage ? 4 : 3);
        if (pick === 0) {
          const rings = rage ? 5 : 3;
          this.st = 500 + rings * 650;
          for (let r = 0; r < rings; r++) this.later(450 + r * 650, () => { for (let i = 0; i < 14; i++) this.shoot(this.x, this.y, (i / 14) * Math.PI * 2 + r * 0.22, 135, 10, { life: 3200 }); audio.sfx('eshoot'); this.gs.fx.glow(this.x, this.y, 0xff4040, 1.8, 200); });
        } else if (pick === 1) {
          const shots = rage ? 46 : 32;
          this.st = 500 + shots * 70;
          for (let i = 0; i < shots; i++) this.later(450 + i * 70, () => { const ang = i * 0.37; this.shoot(this.x, this.y, ang, 150, 10, { color: 0xff8040, life: 3000 }); this.shoot(this.x, this.y, ang + Math.PI, 150, 10, { color: 0xff8040, life: 3000 }); if (i % 4 === 0) audio.sfx('eshoot'); });
        } else if (pick === 2) {
          const bursts = rage ? 7 : 5;
          this.st = 500 + bursts * 360;
          for (let b = 0; b < bursts; b++) this.later(450 + b * 360, () => { const ang = Math.atan2(p.centerY - this.y, p.x - this.x); for (const o of [-0.2, 0, 0.2]) this.shoot(this.x, this.y, ang + o, 240, 12, { color: 0xffe060 }); audio.sfx('eshoot'); });
        } else {
          this.st = 1600;
          audio.sfx('warn');
          if (this.gs.countAlive('alien') < 3) { this.gs.spawnEnemy('alien', a.left + 60, -20, 'add'); this.gs.spawnEnemy('alien', a.right - 60, -20, 'add'); }
          this.gs.spawnEnemy('jet', 0, 70, 'add');
        }
      }
    } else {
      this.hoverTo(this.x, 140 + Math.sin(now / 250) * 5, 120, 0.1);
      if (this.st <= 0) { this.mode = 'idle'; this.st = rage ? 1300 : 1900; }
    }
  }

  // ---------------------------------------------------------------- BOSS: ground stompers (TEACUP TYRANT, GLASS WIDOW)
  // Walks the player down, then cycles: charge (slide through it), leap slam (leave the marked spot, jump the
  // shockwave), ranged volley (lobs or shard fans), and below half health it also calls helpers.
  private stomper(dt: number) {
    const p = this.p, a = this.arena, d = this.def, b = this.body, now = this.gs.time.now;
    const rage = this.hp < this.maxHp * 0.5;
    const col = d.shotColor ?? 0xff5040;
    const ground = b.blocked.down || b.touching.down;
    const edge = this.displayWidth * 0.35;
    const mouth = () => ({ x: this.x + this.dir * this.displayWidth * 0.3, y: this.y - this.displayHeight * 0.6 });
    if (this.mode === 'enter') {
      if (ground) { this.mode = 'idle'; this.st = 1000; this.gs.fx.shake(9); this.gs.fx.dustPuff(this.x, GROUND_Y, 24); audio.sfx('explode'); }
      return;
    }
    if (this.x < a.left + edge) this.x = a.left + edge; else if (this.x > a.right - edge) this.x = a.right - edge;
    if (this.mode === 'idle') {
      this.face();
      const far = Math.abs(p.x - this.x) > 130;
      b.setVelocityX(far ? this.dir * d.speed * (rage ? 1.35 : 1) : 0);
      this.walkAnim(dt, far);
      if (this.st > 0 || p.dead) return;
      b.setVelocityX(0); this.setRotation(0);
      const pick = this.n++ % (rage ? 4 : 3);
      if (pick === 0) {
        this.mode = 'wind'; this.st = 700;
        audio.sfx('warn');
        this.gs.banner('! CHARGE - SLIDE THROUGH !', 1000);
      } else if (pick === 1) {
        this.mode = 'leap'; this.sub = 0; this.st = 650;
        this.tx = R.Clamp(p.x, a.left + edge, a.right - edge);
        this.gs.telegraph(this.tx, GROUND_Y - 4, col, 1500, 1.6);
        audio.sfx('warn');
      } else if (pick === 2) {
        this.mode = 'busy';
        const m = mouth();
        this.gs.telegraph(m.x, m.y, col, 450, 1);
        if (d.radial) { // fans of shards: stand between the lanes or slide
          const volleys = rage ? 5 : 3;
          this.st = 500 + volleys * 520;
          for (let v = 0; v < volleys; v++) this.later(450 + v * 520, () => {
            const g = mouth(), ang = Math.atan2(p.centerY - g.y, p.x - g.x);
            for (let i = 0; i < d.radial!; i++) this.shoot(g.x, g.y, ang + (i - (d.radial! - 1) / 2) * 0.2 + (v % 2) * 0.1, 215, 10, { color: col });
            this.gs.fx.muzzle(g.x, g.y, col);
          });
        } else { // lobbed bombs on marked spots
          const n = rage ? 7 : 5;
          this.st = 700 + n * 300;
          for (let i = 0; i < n; i++) this.later(450 + i * 300, () => {
            const g = mouth(), tx = R.Clamp(p.x + R.Between(-80, 80), a.left + 20, a.right - 20);
            this.gs.telegraph(tx, GROUND_Y - 4, col, 1100, 1.1);
            this.lob(tx, GROUND_Y - 6, 1.1, g.x, g.y, col);
            this.gs.fx.muzzle(g.x, g.y, col);
            audio.sfx('shotgun');
          });
        }
      } else {
        this.mode = 'busy'; this.st = 1500;
        audio.sfx('warn');
        const id = d.adds ?? 'zombie';
        if (this.gs.countAlive(id) < 3) { this.gs.spawnEnemy(id, a.left - 30, GROUND_Y, 'add').awake = true; this.gs.spawnEnemy(id, a.right + 30, GROUND_Y, 'add').awake = true; }
      }
    } else if (this.mode === 'wind') {
      if (Math.floor(now / 60) % 2) this.setTint(this.baseTint); else this.setTintFill(0xff8080);
      if (this.st <= 0) { this.mode = 'charge'; this.st = 1700; this.setTint(this.baseTint); this.setRotation(this.dir * 0.08); }
    } else if (this.mode === 'charge') {
      b.setVelocityX(this.dir * (rage ? 390 : 330));
      if (Math.random() < 0.5) this.gs.fx.dustPuff(this.x - this.dir * edge, GROUND_Y, 2);
      const wall = this.dir > 0 ? this.x >= a.right - edge - 2 : this.x <= a.left + edge + 2;
      if (wall || this.st <= 0) {
        b.setVelocityX(0); this.setRotation(0);
        if (wall) { this.gs.fx.shake(7); this.gs.fx.dustPuff(this.x + this.dir * edge, GROUND_Y, 14); audio.sfx('explode'); }
        this.mode = 'busy'; this.st = rage ? 600 : 1000; // dazed against the wall: free damage
      }
    } else if (this.mode === 'leap') {
      if (this.sub === 0) {
        if (Math.floor(now / 60) % 2) this.setTint(this.baseTint); else this.setTintFill(0xffffff);
        if (this.st <= 0) {
          const T = 0.85;
          this.setTint(this.baseTint);
          b.setVelocity((this.tx - this.x) / T, -0.5 * GRAVITY * T);
          this.sub = 1; this.st = 2200;
          this.gs.fx.dustPuff(this.x, GROUND_Y, 10);
        }
      } else if ((b.velocity.y >= 0 && ground) || this.st <= 0) {
        b.setVelocityX(0);
        this.gs.fx.shake(9); this.gs.fx.dustPuff(this.x, GROUND_Y, 22); audio.sfx('explode');
        const wave = () => { for (const s of [-1, 1]) this.shoot(this.x + s * edge, GROUND_Y - 9, s > 0 ? 0 : Math.PI, 230, 14, { color: col, scale: 1.4 }); };
        wave();
        if (rage) this.later(380, wave);
        this.mode = 'busy'; this.st = 900;
      }
    } else if (this.st <= 0) { this.mode = 'idle'; this.st = rage ? 700 : 1200; }
  }

  // ---------------------------------------------------------------- BOSS: hovering seers (DROWNED QUEEN, STATIC ORACLE)
  // Drifts low while idle (the damage window), then rises and cycles: a sweeping rain of marked columns,
  // aimed triple bursts, a blink followed by expanding rings, and below half health it calls helpers.
  private seer() {
    const p = this.p, a = this.arena, d = this.def, now = this.gs.time.now;
    const rage = this.hp < this.maxHp * 0.5;
    const col = d.shotColor ?? 0xff5040;
    if (this.mode === 'enter') {
      this.hoverTo(a.cx, 130, 170, 0.1);
      if (this.y > 110) { this.mode = 'idle'; this.st = 900; }
      return;
    }
    this.face();
    this.setRotation(R.Clamp(this.body.velocity.x * 0.0004, -0.12, 0.12));
    if (this.mode === 'idle') {
      this.hoverTo(a.cx + Math.sin(now / 1100) * 200, 196 + Math.sin(now / 400) * 10, d.speed * (rage ? 1.4 : 1));
      if (this.st > 0 || p.dead) return;
      this.mode = 'busy';
      const pick = this.n++ % (rage ? 4 : 3);
      if (pick === 0) {
        const cols = 12, step = rage ? 115 : 150, flip = this.n % 2 === 0;
        this.st = 700 + cols * step;
        audio.sfx('warn');
        for (let i = 0; i < cols; i++) {
          const x = a.left + 30 + (flip ? cols - 1 - i : i) * 52.7;
          this.later(i * step, () => this.gs.telegraph(x, 34, col, 340, 0.7));
          this.later(340 + i * step, () => this.shoot(x, 34, Math.PI / 2, 250, 12, { color: col, scale: 1.2 }));
        }
      } else if (pick === 1) {
        const bursts = rage ? 6 : 4;
        this.st = 600 + bursts * 400;
        this.gs.telegraph(this.x, this.y, col, 450, 1.2);
        for (let k = 0; k < bursts; k++) this.later(450 + k * 400, () => {
          const ang = Math.atan2(p.centerY - this.y, p.x - this.x);
          for (const o of [-0.22, 0, 0.22]) this.shoot(this.x, this.y, ang + o, 235, 12, { color: col });
          this.gs.fx.muzzle(this.x, this.y, col);
        });
      } else if (pick === 2) {
        this.gs.fx.ring(this.x, this.y, col, 1.8, 260);
        const anchors = [a.left + 120, a.cx, a.right - 120].filter((x) => Math.abs(x - this.x) > 70);
        this.setPosition(R.RND.pick(anchors), 130);
        this.body.setVelocity(0, 0);
        this.gs.fx.ring(this.x, this.y, col, 2.2, 320);
        this.gs.fx.glow(this.x, this.y, col, 2.4, 300);
        audio.sfx('blink');
        const rings = rage ? 4 : 2;
        this.st = 700 + rings * 650;
        for (let r = 0; r < rings; r++) this.later(550 + r * 650, () => {
          for (let i = 0; i < 12; i++) this.shoot(this.x, this.y, (i / 12) * Math.PI * 2 + r * 0.26, 140, 10, { color: col, life: 3200 });
          this.gs.fx.glow(this.x, this.y, col, 1.8, 200);
        });
      } else {
        this.st = 1500;
        audio.sfx('warn');
        const id = d.adds ?? 'drone';
        if (this.gs.countAlive(id) < 3) { this.gs.spawnEnemy(id, a.left + 60, -20, 'add').awake = true; this.gs.spawnEnemy(id, a.right - 60, -20, 'add').awake = true; }
      }
    } else {
      this.hoverTo(this.x, 128 + Math.sin(now / 250) * 5, 130, 0.1);
      if (this.st <= 0) { this.mode = 'idle'; this.st = rage ? 1200 : 1800; }
    }
  }
}
