import Phaser from 'phaser';
import { W, H, GROUND_Y, DEPTH } from '../config';
import { audio } from './Audio';
import { run } from './Run';
import type { StageDef, Flood } from '../data/stages';
import type { GameScene } from '../scenes/Game';
import type { Shot } from '../entities/Shot';

const R = Phaser.Math;
type Mover = { obj: Phaser.GameObjects.TileSprite; glow: Phaser.GameObjects.Image; cx: number; cy: number; dx: number; dy: number; ms: number };
type Blinker = { obj: Phaser.GameObjects.TileSprite; line: Phaser.GameObjects.Rectangle; group: number };
type FloodRt = Flood & { body: Phaser.GameObjects.Rectangle; surf: Phaser.GameObjects.Rectangle; glow?: Phaser.GameObjects.Image; level: number; clock: number; warned: boolean };
type Crusher = { x: number; period: number; offset: number; img: Phaser.GameObjects.Image; warned: boolean; slammed: boolean };
type Section = { cx: number; rect: Phaser.GameObjects.Rectangle; glow: Phaser.GameObjects.Image; t: number; state: 'off' | 'warn' | 'hot' };
type Gantry = { img: Phaser.GameObjects.Image; x: number };

const DRY = GROUND_Y + 14; // flood level when drained (just under the floor surface)
const FLIP_WARN = 1600;

// Stage gimmicks: the one mechanic per stage that makes it play differently (docs/STORY.md section 3).
// Everything here is driven by optional StageDef fields; a stage without them pays nothing.
// Damage goes through the scene (hazardHit / hurtPlayer) so i-frames, slide invulnerability and feedback stay consistent.
export class Gimmicks {
  oxygen = 100;               // air meter (0..100), shown by the HUD while below 100
  private movers: Mover[] = [];
  private blinkers: Blinker[] = [];
  private floods: FloodRt[] = [];
  private crushers: Crusher[] = [];
  private sections: Section[] = [];
  private rouletteT = 0;
  private gantries: Gantry[] = [];
  private gantryT = 0;
  private gantryWarned = false;
  private flipT = 0;
  private flipLeft = 0;
  private flipWarned = false;
  private chaseX = -1;
  private chaseG?: Phaser.GameObjects.Graphics;
  private choiceDone = false;
  private dark?: { hole: Phaser.GameObjects.Image; rects: Phaser.GameObjects.Rectangle[]; r: number };
  private drownT = 0;
  private trainLines?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(private gs: GameScene, private st: StageDef) {
    const scene = gs;
    const p = gs.player;
    // ---- moving platforms (one-way, riders are carried by the immovable body's friction)
    for (const [x, y, n, dx, dy, ms] of st.movers ?? []) {
      const obj = scene.add.tileSprite(x + n * 16, y + 6, n * 32, 12, `plat_${st.id}`).setDepth(DEPTH.world).setTint(0xd8e0ff);
      scene.physics.add.existing(obj);
      const b = obj.body as Phaser.Physics.Arcade.Body;
      b.setAllowGravity(false).setImmovable(true);
      b.checkCollision.down = b.checkCollision.left = b.checkCollision.right = false;
      const glow = scene.add.image(obj.x, y + 22, 'glow').setDisplaySize(n * 36 + 30, 38).setTint(st.accent).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.world - 1);
      this.movers.push({ obj, glow, cx: obj.x, cy: obj.y, dx, dy, ms });
    }
    if (this.movers.length) scene.physics.add.collider(p, this.movers.map((m) => m.obj), undefined, () => p.dropThrough <= 0 && p.body.velocity.y >= -20);

    // ---- data platforms that take turns existing
    for (const [x, y, n, group] of st.blinkers ?? []) {
      const obj = scene.add.tileSprite(x + n * 16, y + 6, n * 32, 12, `plat_${st.id}`).setDepth(DEPTH.world).setTint(0xa0c0ff);
      scene.physics.add.existing(obj, true);
      const b = obj.body as Phaser.Physics.Arcade.StaticBody;
      b.checkCollision.down = b.checkCollision.left = b.checkCollision.right = false;
      const line = scene.add.rectangle(obj.x, y + 13, n * 32 - 6, 2, st.accent, 0.8).setDepth(DEPTH.world).setBlendMode(Phaser.BlendModes.ADD);
      this.blinkers.push({ obj, line, group });
    }
    if (this.blinkers.length) scene.physics.add.collider(p, this.blinkers.map((m) => m.obj), undefined, () => p.dropThrough <= 0);

    // ---- floods (water / lava levels)
    for (const f of st.floods ?? []) {
      const water = f.kind === 'water';
      const cx = (f.x0 + f.x1) / 2, w = f.x1 - f.x0;
      const body = scene.add.rectangle(cx, DRY, w, 420, water ? 0x1a6ab0 : 0xff4a10, water ? 0.34 : 0.88).setOrigin(0.5, 0).setDepth(water ? DEPTH.shot + 1 : DEPTH.world + 3);
      const surf = scene.add.rectangle(cx, DRY, w, 2, water ? 0x9fe8ff : 0xffd060, 0.9).setOrigin(0.5, 0.5).setDepth(body.depth + 0.1).setBlendMode(Phaser.BlendModes.ADD);
      const glow = water ? undefined : scene.add.image(cx, DRY, 'glow').setDisplaySize(w * 1.1, 90).setTint(0xff6a20).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(body.depth - 0.1);
      this.floods.push({ ...f, body, surf, glow, level: DRY, clock: f.offset ?? 0, warned: false });
    }

    // ---- crushers
    for (const [x, period, offset] of st.crushers ?? []) {
      const img = scene.add.image(x, 40, 'piston').setOrigin(0.5, 1).setDepth(DEPTH.world + 4);
      this.crushers.push({ x, period, offset, img, warned: false, slammed: false });
    }

    // ---- roulette floor
    for (const [x0, x1] of st.roulette ?? []) {
      for (let x = x0; x + 96 <= x1; x += 96) {
        const cx = x + 48;
        const rect = scene.add.rectangle(cx, GROUND_Y + 2, 92, 5, 0xff2040, 0).setDepth(DEPTH.world + 2);
        const glow = scene.add.image(cx, GROUND_Y, 'glow').setDisplaySize(130, 50).setTint(0xff3020).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.world + 2);
        this.sections.push({ cx, rect, glow, t: 0, state: 'off' });
      }
    }
    this.rouletteT = 2500;

    // ---- train: roof tiles from x0, wind streaks while aboard
    if (st.train) {
      const x0 = st.train.x0, w = st.width + 800 - x0;
      scene.add.tileSprite(x0 + w / 2, GROUND_Y + 20, w, 40, 'traincar').setDepth(DEPTH.world + 0.5);
      this.trainLines = scene.add.particles(0, 0, 'px', { x: W + 20, y: { min: 20, max: GROUND_Y - 10 }, speedX: { min: -900, max: -600 }, lifespan: 900, scaleX: { min: 6, max: 14 }, scaleY: 0.5, alpha: { start: 0.35, end: 0 }, tint: 0xc0d8ff, frequency: 45, emitting: false }).setScrollFactor(0).setDepth(DEPTH.bg + 4);
      this.gantryT = st.train.every;
    }

    // ---- gravity flips need a ceiling to land on
    if (st.flips) {
      const ceil = scene.add.zone(st.width / 2, -10, st.width + 1600, 20);
      scene.physics.add.existing(ceil, true);
      scene.physics.add.collider(p, ceil);
      this.flipT = st.flips.every;
    }

    // ---- darkness: a soft hole of light around the player, everything else dimmed (telegraphs draw above it)
    if (st.dark) {
      const a = 0.86, d = DEPTH.fx - 1;
      const hole = scene.add.image(0, 0, 'darkhole').setScrollFactor(0).setDepth(d).setAlpha(a);
      const rects = [0, 1, 2, 3].map(() => scene.add.rectangle(0, 0, 1, 1, 0x000000, a).setOrigin(0).setScrollFactor(0).setDepth(d));
      this.dark = { hole, rects, r: st.dark };
    }

    if (st.chase) this.chaseG = scene.add.graphics().setDepth(DEPTH.world + 3);
  }

  /** Surface y of water at world x (Infinity when there is none). */
  waterAt(x: number) {
    let y = Infinity;
    for (const f of this.floods) if (f.kind === 'water' && x >= f.x0 && x <= f.x1 && f.level < DRY - 2) y = Math.min(y, f.level);
    return y;
  }

  /** Gravity reverses now for `ms` (also used by ARCHON's last phase). */
  flipGravity(ms: number) {
    this.flipLeft = ms;
    this.gs.fx.flash(0xff3050, 200);
    audio.sfx('blink');
  }

  get flipping() { return this.flipLeft > 0; }

  tick(dt: number) {
    const gs = this.gs, p = gs.player, st = this.st, now = gs.time.now;
    const cam = gs.cameras.main;
    const view = { l: cam.scrollX - 80, r: cam.scrollX + W + 80 };
    const env = p.env;
    env.grav = st.gravity ?? 1; env.speed = 1; env.jump = 1; env.water = false;

    // movers: steer the body toward the swing position (velocity, so riders are carried)
    for (const m of this.movers) {
      const ph = (now % m.ms) / m.ms;
      const k = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2);
      const tx = m.cx + m.dx * k, ty = m.cy + m.dy * k;
      const b = m.obj.body as Phaser.Physics.Arcade.Body;
      const sp = (Math.PI / m.ms) * 1000 * Math.sin(ph * Math.PI * 2);
      b.setVelocity(m.dx * sp + (tx - m.obj.x) * 6, m.dy * sp + (ty - m.obj.y) * 6);
      m.glow.setPosition(m.obj.x, m.obj.y + 16);
    }

    // blinkers: groups swap every 2.4 s; the leaving group flickers for its last 0.6 s
    if (this.blinkers.length) {
      const cyc = now % 4800, active = cyc < 2400 ? 0 : 1, left = 2400 - (cyc % 2400);
      for (const bl of this.blinkers) {
        const on = bl.group === active;
        const b = bl.obj.body as Phaser.Physics.Arcade.StaticBody;
        b.enable = on;
        const flick = on && left < 600 && Math.floor(now / 70) % 2 === 0;
        bl.obj.setAlpha(on ? (flick ? 0.35 : 1) : 0.12);
        bl.line.setAlpha(on ? 0.8 : 0.15);
      }
    }

    // floods
    for (const f of this.floods) {
      const near = p.x > f.x0 - 260 && p.x < f.x1 + 260;
      const lavaPause = f.kind === 'lava' && (gs.isLocked || gs.bossActive || !near);
      if (!lavaPause) f.clock += dt;
      const ph = (f.clock % f.period) / f.period;
      let level: number;
      if (lavaPause && f.kind === 'lava') level = Math.min(DRY, f.level + dt * 0.08); // drain while you fight elsewhere
      else if (ph < 0.35) level = DRY;
      else if (ph < 0.5) level = R.Linear(DRY, f.top, (ph - 0.35) / 0.15);
      else if (ph < 0.85) level = f.top;
      else level = R.Linear(f.top, DRY, (ph - 0.85) / 0.15);
      // warning: rumble + banner before each rise (every hazard is telegraphed)
      if (!lavaPause && ph > 0.25 && ph < 0.35 && !f.warned && near) {
        f.warned = true;
        gs.banner(f.kind === 'lava' ? '! LAVA RISING - CLIMB !' : '! TIDE RISING !', 1300, f.kind === 'lava' ? '#ff8040' : '#80e0ff');
        audio.sfx('warn'); gs.fx.shake(4);
        gs.comm('flood');
      }
      if (ph < 0.2) f.warned = false;
      f.level = level;
      const wave = Math.sin(now / 260 + f.x0) * 1.5;
      f.body.setY(level + wave); f.surf.setY(level + wave);
      f.glow?.setY(level).setAlpha(level < DRY - 4 ? 0.5 : 0);
      if (p.dead || p.x < f.x0 || p.x > f.x1) continue;
      if (f.kind === 'lava') { if (p.y > level + 3) gs.hazardHit(16, false); }
      else if (p.centerY > level) env.water = true;
    }

    // water: floaty, slow; the air meter drains while the head is under
    if (env.water) { env.grav *= 0.42; env.speed *= 0.72; env.jump *= 0.8; }
    const headUnder = env.water && p.y - p.body.height + 6 > this.waterAt(p.x);
    if (headUnder && !p.dead && gs.state === 'play') {
      this.oxygen = Math.max(0, this.oxygen - dt * 0.012);
      if (this.oxygen <= 0 && (this.drownT -= dt) <= 0) { this.drownT = 800; gs.hurtPlayer(6, p.x - p.dir); }
    } else { this.oxygen = Math.min(100, this.oxygen + dt * 0.05); this.drownT = 0; }

    // gravity flips: siren + red tint, then up is down for a few seconds
    if (st.flips && gs.state === 'play') {
      this.flipT -= dt;
      if (this.flipT < FLIP_WARN && !this.flipWarned) {
        this.flipWarned = true;
        gs.banner('! GRAVITY ANOMALY !', 1400, '#ff6070');
        audio.sfx('warn'); gs.time.delayedCall(500, () => audio.sfx('warn'));
        gs.fx.flash(0xff2040, 300);
      }
      if (this.flipT <= 0) { this.flipT = st.flips.every; this.flipWarned = false; this.flipGravity(st.flips.dur); gs.comm('flip'); }
    }
    if (this.flipLeft > 0) {
      this.flipLeft -= dt;
      env.grav = -0.45;
      if (Math.random() < 0.3) gs.fx.spark(p.x + R.Between(-20, 20), p.y, 0xff6080, 1);
    }

    // crushers
    for (const c of this.crushers) {
      const t = (now + c.offset) % c.period, S = c.period * 0.6;
      let bottom = 40 + Math.sin(now / 200 + c.x) * 2;
      if (t >= S - 900 && t < S) {
        if (!c.warned) { c.warned = true; if (c.x > view.l && c.x < view.r) { gs.telegraph(c.x, GROUND_Y - 6, 0xff6020, 880, 1.1); audio.sfx('warn'); } }
        bottom += R.Between(-2, 2) + ((t - (S - 900)) / 900) * 10;
      } else if (t >= S && t < S + 80) bottom = R.Linear(50, GROUND_Y, (t - S) / 80);
      else if (t >= S + 80 && t < S + 420) {
        bottom = GROUND_Y;
        if (!c.slammed) { c.slammed = true; if (c.x > view.l && c.x < view.r) { gs.fx.shake(5); gs.fx.dustPuff(c.x, GROUND_Y, 10); audio.sfx('explode'); } }
      } else if (t >= S + 420 && t < S + 900) bottom = R.Linear(GROUND_Y, 40, (t - S - 420) / 480);
      else { c.warned = false; c.slammed = false; }
      c.img.setY(bottom);
      if (t >= S + 40 && t < S + 420 && !p.dead && Math.abs(p.x - c.x) < 24 && p.y - p.body.height < bottom) gs.hurtPlayer(18, c.x);
    }

    // roulette: two floor sections near the player light up, then burn
    if (this.sections.length && gs.state === 'play') {
      const nearSec = this.sections.filter((s) => Math.abs(s.cx - p.x) < 300);
      if (nearSec.length && (this.rouletteT -= dt) <= 0) {
        this.rouletteT = 4200;
        for (const s of Phaser.Utils.Array.Shuffle(nearSec.filter((q) => q.state === 'off')).slice(0, 2)) { s.state = 'warn'; s.t = 1300; audio.sfx('ui'); }
      }
      for (const s of this.sections) {
        if (s.state === 'off') continue;
        s.t -= dt;
        if (s.state === 'warn') {
          const on = Math.floor(now / 110) % 2 === 0;
          s.rect.setFillStyle(0xff2040, on ? 0.8 : 0.2); s.glow.setAlpha(on ? 0.3 : 0.05);
          if (s.t <= 0) { s.state = 'hot'; s.t = 1800; }
        } else {
          s.rect.setFillStyle(0xff7020, 0.95); s.glow.setAlpha(0.6 + Math.sin(now / 60) * 0.1);
          if (Math.random() < 0.25) gs.fx.spark(s.cx + R.Between(-44, 44), GROUND_Y - 2, 0xff8030, 1);
          if (!p.dead && Math.abs(p.x - s.cx) < 46 && p.onGround && p.y >= GROUND_Y - 3) gs.hazardHit(14, true);
          if (s.t <= 0) { s.state = 'off'; s.rect.setFillStyle(0xff2040, 0); s.glow.setAlpha(0); }
        }
      }
    }

    // train: wind, faster backdrop, gantries that sweep in at head height (crouch or slide under)
    if (st.train) {
      const aboard = p.x > st.train.x0;
      this.trainLines!.emitting = aboard;
      if (aboard) gs.drift(dt * 0.35);
      const inBoss = gs.bossActive || p.x > st.width - 560;
      if (aboard && !inBoss && gs.state === 'play') {
        this.gantryT -= dt;
        if (this.gantryT < 950 && !this.gantryWarned) {
          this.gantryWarned = true;
          gs.telegraph(cam.scrollX + W - 18, GROUND_Y - 52, 0xffc040, 900, 0.9);
          audio.sfx('warn');
          gs.comm('gantry');
        }
        if (this.gantryT <= 0) {
          this.gantryT = st.train.every * (gs.isLocked ? 1.5 : 1);
          this.gantryWarned = false;
          const x = cam.scrollX + W + 40;
          this.gantries.push({ x, img: gs.add.image(x, GROUND_Y - 34, 'gantry').setOrigin(0.5, 1).setDepth(DEPTH.front - 1) });
        }
      }
      for (let i = this.gantries.length - 1; i >= 0; i--) {
        const g = this.gantries[i];
        g.x -= dt * 0.34;
        g.img.setX(g.x);
        if (!p.dead && Math.abs(p.x - g.x) < 34 && !p.low && p.sliding <= 0) gs.hurtPlayer(14, g.x + 40);
        if (g.x < cam.scrollX - 80) { g.img.destroy(); this.gantries.splice(i, 1); }
      }
    }

    // chase: the floor behind you is being deleted
    if (st.chase && this.chaseG) {
      if (this.chaseX < 0 && p.x >= st.chase.x0) { this.chaseX = st.chase.x0 - 300; gs.banner('! FLOOR DELETION - KEEP MOVING !', 1400, '#a0a0ff'); audio.sfx('warn'); gs.comm('chase'); }
      if (this.chaseX >= 0) {
        if (!gs.isLocked && gs.state === 'play') this.chaseX = Math.min(st.width - W - 30, this.chaseX + dt * st.chase.speed / 1000);
        const g = this.chaseG, x = this.chaseX;
        g.clear();
        g.fillStyle(0x05040c, 1).fillRect(x - 2000, GROUND_Y - 1, 2000, 44);
        for (let i = 0; i < 14; i++) g.fillStyle(i % 2 ? 0xff4060 : 0xa0a0ff, 0.7).fillRect(x - R.Between(0, 60), GROUND_Y - R.Between(2, 60), R.Between(2, 10), 2);
        g.fillStyle(0xa0a0ff, 0.25 + Math.random() * 0.2).fillRect(x - 3, 0, 3, GROUND_Y);
        if (!p.dead && p.x < x + 6 && p.y > GROUND_Y - 6) { gs.hazardHit(12, false); p.x = Math.max(p.x, x + 10); }
      }
    }

    // in-level choice (slow motion, story C2)
    if (st.choiceAt && !this.choiceDone && p.x >= st.choiceAt.x && gs.state === 'play') { this.choiceDone = true; gs.slowChoice(st.choiceAt.id); }

    // darkness follows the player; the boss arena and a hive truce are lit wider
    if (this.dark) {
      const truce = run.flags.nest_truce === true && run.heard.includes(`${st.id}:clear:1`);
      const want = gs.bossActive ? 200 : truce ? 170 : this.dark.r;
      const r = (this.dark.r += (want - this.dark.r) * 0.05) + Math.sin(now / 140) * 2;
      const cx = R.Clamp(p.x - cam.scrollX, 0, W), cy = R.Clamp(p.centerY - cam.scrollY, 0, H);
      this.dark.hole.setPosition(cx, cy).setDisplaySize(r * 2, r * 2);
      const [top, bot, left, right] = this.dark.rects;
      top.setPosition(-10, -10).setSize(W + 20, Math.max(0, cy - r + 10));
      bot.setPosition(-10, cy + r).setSize(W + 20, Math.max(0, H - cy - r + 10));
      left.setPosition(-10, cy - r).setSize(Math.max(0, cx - r + 10), r * 2);
      right.setPosition(cx + r, cy - r).setSize(Math.max(0, W - cx - r + 10), r * 2);
      for (const s of gs.eShots.getChildren() as Shot[]) if (s.active) s.setDepth(DEPTH.fx + 1); // enemy bullets glow through the dark
    }
  }
}
