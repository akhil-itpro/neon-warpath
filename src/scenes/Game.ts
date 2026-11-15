import Phaser from 'phaser';
import { W, H, GROUND_Y, DEPTH } from '../config';
import { STAGES, StageDef, Encounter } from '../data/stages';
import { ENEMIES } from '../data/enemies';
import { WEAPONS, DROP_WEAPONS } from '../data/weapons';
import { run, save, persist } from '../systems/Run';
import { audio } from '../systems/Audio';
import { Controls } from '../systems/Controls';
import { Fx } from '../systems/Fx';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Shot } from '../entities/Shot';
import type { HudScene } from './Hud';

const R = Phaser.Math;
type Pickup = Phaser.Physics.Arcade.Image & { kind: string; wid?: string; age: number; taken?: boolean; glow?: Phaser.GameObjects.Image };
type ShotOpts = { tex?: string; color?: number; gravity?: boolean; blast?: number; life?: number; scale?: number };

// The whole stage: world building, combat rules, encounters, scoring.
// Entities ask this scene to do things (enemyShot, spawnEnemy, killEnemy…) instead of touching each other.
export class GameScene extends Phaser.Scene {
  player!: Player;
  fx!: Fx;
  controls!: Controls;
  stage!: StageDef;
  enemies: Enemy[] = [];
  pickups: Pickup[] = [];
  bounds = { left: 0, right: 0 }; // where the player may currently walk (camera lock)
  state: 'play' | 'dead' | 'clear' = 'play';
  combo = 0;
  comboT = 0;
  mult = 1;
  boss: Enemy | null = null;
  bossActive = false;
  stageKills = 0;
  stageTime = 0;
  canRetry = false;
  aim: { x: number; y: number } | null = null; // world point under the mouse crosshair; null = keyboard/gamepad auto-aim

  private pShots!: Phaser.Physics.Arcade.Group;
  private eShots!: Phaser.Physics.Arcade.Group;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private oneways!: Phaser.Physics.Arcade.StaticGroup;
  private hazards!: Phaser.Physics.Arcade.StaticGroup;
  private bg!: Phaser.GameObjects.TileSprite;
  private flows: Phaser.GameObjects.TileSprite[] = [];
  private fogs: Phaser.GameObjects.TileSprite[] = [];
  private encounters: (Encounter & { boss?: boolean })[] = [];
  private encIndex = 0;
  private locked = false;
  private wave = 0;
  private waveGap = 0;

  constructor() { super('Game'); }

  private get hud() { return this.scene.get('Hud') as HudScene; }
  banner(text: string, ms = 1600, color = '#ffffff') { this.hud.banner?.(text, ms, color); }

  create() {
    const st = (this.stage = STAGES[run.stage]);
    this.enemies = []; this.pickups = []; this.flows = []; this.fogs = [];
    this.state = 'play'; this.combo = 0; this.comboT = 0; this.mult = 1;
    this.aim = null;
    this.boss = null; this.bossActive = false; this.locked = false; this.canRetry = false;
    this.stageKills = 0; this.stageTime = 0; this.wave = 0; this.waveGap = 0;
    this.physics.world.resume();
    this.physics.world.timeScale = 1;
    this.physics.world.setBounds(-800, -400, st.width + 1600, H + 800);
    this.controls = new Controls(this);
    this.fx = new Fx(this);

    // ---- backdrop
    this.bg = this.add.tileSprite(0, 0, W, H, st.bg).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.bg).setTint(st.bgTint);
    const shade = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.bg + 1);
    shade.fillGradientStyle(0, 0, 0, 0, 0, 0, 0.8, 0.8).fillRect(0, 150, W, H - 150);
    shade.fillGradientStyle(0, 0, 0, 0, 0.5, 0.5, 0, 0).fillRect(0, 0, W, 70);

    // ---- solid world
    this.solids = this.physics.add.staticGroup();
    this.oneways = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    const floor = this.add.zone(st.width / 2, GROUND_Y + 20, st.width + 1600, 40);
    this.physics.add.existing(floor, true);
    this.solids.add(floor);
    this.add.tileSprite(st.width / 2, GROUND_Y + 20, st.width + 1600, 40, `ground_${st.id}`).setDepth(DEPTH.world);
    this.add.rectangle(st.width / 2, GROUND_Y + 1, st.width + 1600, 1, st.accent, 0.35).setDepth(DEPTH.world + 1).setBlendMode(Phaser.BlendModes.ADD);

    for (const [x, y, n] of st.platforms) {
      const p = this.add.tileSprite(x + n * 16, y + 6, n * 32, 12, `plat_${st.id}`).setDepth(DEPTH.world);
      this.physics.add.existing(p, true);
      const b = p.body as Phaser.Physics.Arcade.StaticBody;
      b.checkCollision.down = b.checkCollision.left = b.checkCollision.right = false; // jump up through, land on top
      this.oneways.add(p);
      this.add.rectangle(x + n * 16, y + 13, n * 32 - 6, 2, st.accent, 0.5).setDepth(DEPTH.world).setBlendMode(Phaser.BlendModes.ADD);
    }
    const hazKind = st.hazard ?? (st.weather === 'data' ? 'volt' : 'lava');
    const hazTex = hazKind;
    const hazCol = { volt: 0x40e0ff, lava: 0xff7a20, acid: 0x80ff40 }[hazKind];
    for (const [x, w] of st.hazards) {
      const t = this.add.tileSprite(x + w / 2, GROUND_Y + 3, w, 10, hazTex).setDepth(DEPTH.world + 2);
      this.flows.push(t);
      this.add.image(x + w / 2, GROUND_Y, 'glow').setDisplaySize(w * 1.3, 70).setTint(hazCol).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.world + 2);
      const z = this.add.zone(x + w / 2, GROUND_Y - 4, w - 10, 10);
      this.physics.add.existing(z, true);
      this.hazards.add(z);
    }
    // scenery props: no collision, drawn behind the action
    for (const [key, x] of st.decor ?? []) {
      if (this.textures.exists(key)) this.add.image(x, GROUND_Y + 1, key).setOrigin(0.5, 1).setDepth(DEPTH.world - 1).setTint(0xa8b0c8);
    }
    // light spilling onto the floor and under girders (additive glow in the stage colour)
    this.add.image(st.width / 2, GROUND_Y + 2, 'glow').setDisplaySize(st.width + 1600, 46).setTint(st.accent).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.world + 1);
    for (const [x, y, n] of st.platforms) this.add.image(x + n * 16, y + 22, 'glow').setDisplaySize(n * 36 + 30, 38).setTint(st.accent).setAlpha(0.28).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.world - 1);
    // street lamps with a flickering light cone (city only)
    if (st.id === 'city') {
      for (let x = 260; x < st.width; x += R.Between(520, 760)) {
        this.add.image(x, GROUND_Y + 1, 'lamp').setOrigin(0.5, 1).setDepth(DEPTH.world - 1).setTint(0xb0b8d0);
        const cone = this.add.image(x - 10, GROUND_Y - 112, 'cone').setOrigin(0.5, 0).setTint(0xfff0c0).setAlpha(0.22).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.world - 1);
        this.add.image(x - 10, GROUND_Y - 112, 'glow').setScale(0.9).setTint(0xfff0c0).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.world - 1);
        this.tweens.add({ targets: cone, alpha: { from: 0.22, to: 0.12 }, duration: R.Between(900, 2400), yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    }
    // two drifting fog layers at different speeds, in front of the backdrop and behind the action
    this.fogs = [0.35, 0.6].map((sf, i) => this.add.tileSprite(0, H - 150 + i * 20, W, 96, 'fog').setOrigin(0).setScrollFactor(0).setTint(st.accent).setAlpha(0.13 + i * 0.05).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.bg + 2 + i));
    // foreground silhouettes scroll faster than the world for depth
    for (let x = 500; x < st.width * 1.6; x += R.Between(620, 980)) {
      this.add.image(x, 0, 'pillar').setOrigin(0.5, 0).setScrollFactor(1.6, 1).setDepth(DEPTH.front).setAlpha(0.4); // see-through so it never hides a threat
    }
    this.makeWeather(st);

    // ---- actors
    this.pShots = this.physics.add.group({ classType: Shot, maxSize: 110, runChildUpdate: true });
    this.eShots = this.physics.add.group({ classType: Shot, maxSize: 320, runChildUpdate: true });
    this.player = new Player(this, run.checkpointX, GROUND_Y - 1);
    this.bounds = { left: 0, right: st.width };

    this.encounters = [...st.encounters, { x: st.width - 430, waves: [], boss: true }];
    this.encIndex = run.checkpoint;
    for (const [id, x] of st.roamers) {
      if (x < run.checkpointX + 260 && run.checkpoint > 0) continue; // already fought on a previous attempt
      this.spawnEnemy(id, x, ENEMIES[id].flying ? 150 : GROUND_Y - (id === 'crate' ? 0 : 0), '');
    }

    // ---- collisions
    const ph = this.physics;
    ph.add.collider(this.player, this.solids);
    ph.add.collider(this.player, this.oneways, undefined, () => this.player.dropThrough <= 0);
    ph.add.collider(this.enemies, this.solids);
    ph.add.collider(this.pickups, this.solids);
    ph.add.collider(this.pickups, this.oneways);
    ph.add.overlap(this.pShots, this.enemies, (a, b) => this.onShotEnemy(a, b));
    ph.add.overlap(this.pShots, this.solids, (a, b) => this.onShotWall(a, b, true));
    ph.add.overlap(this.eShots, this.solids, (a, b) => this.onShotWall(a, b, false));
    ph.add.overlap(this.player, this.eShots, (a, b) => this.onShotPlayer((a instanceof Shot ? a : b) as Shot));
    ph.add.overlap(this.player, this.enemies, (a, b) => this.onTouch((a instanceof Enemy ? a : b) as Enemy));
    ph.add.overlap(this.player, this.pickups, (a, b) => this.onPickup((a === this.player ? b : a) as Pickup));
    ph.add.overlap(this.player, this.hazards, () => this.onHazard());

    // ---- camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, st.width, H);
    cam.startFollow(this.player, true, 0.14, 1, 0, 0);
    cam.fadeIn(350);
    if (this.game.renderer.type === Phaser.WEBGL) {
      cam.postFX.clear();
      cam.postFX.addBloom(0xffffff, 1, 1, 1, 0.85, 4);
      cam.postFX.addVignette(0.5, 0.5, 0.95, 0.32);
    }

    this.scene.launch('Hud');
    audio.playMusic(st.music);
    this.time.delayedCall(350, () => {
      if (run.checkpoint === 0) this.hud.stageIntro?.(`STAGE ${run.stage + 1}`, st.name, st.tagline);
      else this.banner('CHECKPOINT', 1200, '#80ffb0');
    });
  }

  private makeWeather(st: StageDef) {
    const base = { x: { min: 0, max: W + 120 }, emitting: true };
    let cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;
    if (st.weather === 'rain') cfg = { ...base, y: -10, speedY: { min: 480, max: 600 }, speedX: -130, lifespan: 760, scaleX: 0.5, scaleY: { min: 3, max: 6 }, alpha: 0.32, tint: 0x9ac4ff, quantity: 2, frequency: 16 };
    else if (st.weather === 'embers') cfg = { ...base, y: H + 6, speedY: { min: -110, max: -40 }, speedX: { min: -40, max: 40 }, lifespan: 3200, scale: { start: 1.2, end: 0 }, alpha: 0.9, tint: [0xff8030, 0xffc040, 0xff5020], blendMode: 'ADD', frequency: 70 };
    else if (st.weather === 'spores') cfg = { ...base, y: H + 6, speedY: { min: -46, max: -14 }, speedX: { min: -24, max: 24 }, lifespan: 6000, scale: { start: 1.4, end: 0.2 }, alpha: { start: 0.8, end: 0 }, tint: [0x40ffc0, 0x80ffa0, 0xc0ff60], blendMode: 'ADD', frequency: 90 };
    else if (st.weather === 'bubbles') cfg = { ...base, y: H + 6, speedY: { min: -90, max: -40 }, speedX: { min: -12, max: 12 }, lifespan: 4200, scale: { min: 0.6, max: 1.8 }, alpha: { start: 0.5, end: 0 }, tint: [0x60b0ff, 0xa0e0ff], frequency: 110 };
    else if (st.weather === 'petals') cfg = { ...base, y: -10, speedY: { min: 26, max: 70 }, speedX: { min: -60, max: -10 }, lifespan: 6500, scale: { min: 0.8, max: 1.6 }, rotate: { min: 0, max: 360 }, alpha: { start: 0.8, end: 0.2 }, tint: [0xff5070, 0xff90a0, 0xc03050], frequency: 120 };
    else cfg = { ...base, y: -10, speedY: { min: 60, max: 150 }, lifespan: 3600, scaleX: 0.5, scaleY: { min: 2, max: 8 }, alpha: { start: 0.55, end: 0 }, tint: [0x40e0ff, 0xff4060], blendMode: 'ADD', frequency: 60 };
    this.add.particles(0, 0, 'px', cfg).setScrollFactor(0).setDepth(DEPTH.weather);
  }

  // ================================================================= frame
  update(_time: number, delta: number) {
    const c = this.controls;
    c.poll();
    if (c.pressed('mute')) { audio.setMuted(!audio.muted); save.muted = audio.muted; persist(); }
    if (c.pressed('pause') && this.state === 'play') { this.hud.setPaused?.(true); this.scene.pause(); return; }
    if (this.state === 'dead' && this.canRetry && (c.pressed('fire') || c.pressed('jump'))) return this.retry();
    if (this.fx.frozen(delta)) return;
    const dt = Math.min(delta, 34);
    const cam = this.cameras.main;

    this.bg.tilePositionX = cam.scrollX * 0.22;
    for (const f of this.flows) f.tilePositionX += dt * 0.03;
    this.fogs.forEach((f, i) => { f.tilePositionX = cam.scrollX * (0.35 + i * 0.25) + this.time.now * (0.012 + i * 0.01); });

    // sweep things that died during the physics step
    for (let i = this.enemies.length - 1; i >= 0; i--) if (this.enemies[i].dead && !this.enemies[i].def.boss) { this.enemies[i].destroy(); this.enemies.splice(i, 1); }
    for (let i = this.pickups.length - 1; i >= 0; i--) if (this.pickups[i].taken) { this.pickups[i].glow?.destroy(); this.pickups[i].destroy(); this.pickups.splice(i, 1); }

    const p = this.player;
    this.aim = c.aimPoint(cam);
    p.tick(dt, c);
    if (!p.dead) {
      p.x = R.Clamp(p.x, this.bounds.left + 10, this.bounds.right - 10);
      cam.setFollowOffset(R.Linear(cam.followOffset.x, -p.dir * 44, 0.035), 0);
    }
    for (const e of this.enemies) e.tick(dt);
    this.tickPickups(dt);
    this.tickShots();

    if (this.state !== 'play') return;
    this.stageTime += dt;
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) { this.combo = 0; this.mult = 1; } }
    this.tickEncounter(dt);
  }

  private tickShots() {
    for (const s of this.pShots.getChildren() as Shot[]) if (s.active && s.smoke) this.fx.puff(s.x, s.y, 1);
  }

  // ================================================================= encounters
  private tickEncounter(dt: number) {
    const cam = this.cameras.main;
    const st = this.stage;
    if (!this.locked) {
      const enc = this.encounters[this.encIndex];
      if (!enc || this.player.x < enc.x) return;
      this.locked = true;
      const left = R.Clamp(enc.boss ? st.width - W : cam.scrollX, 0, st.width - W);
      this.bounds = { left, right: left + W };
      cam.setBounds(left, 0, W, H);
      this.wave = 0; this.waveGap = 500;
      if (enc.boss) {
        run.checkpointX = enc.x - 120;
        this.bossActive = true;
        audio.intense = true;
        this.hud.bossWarning?.(st.bossIntro);
        this.time.delayedCall(2200, () => { if (this.state === 'play') this.spawnBoss(); });
      } else {
        this.banner('HOSTILES INBOUND', 1100, '#ff6050');
        audio.sfx('warn');
      }
      return;
    }
    const enc = this.encounters[this.encIndex];
    if (enc.boss) return; // ends via killEnemy -> bossDeath
    const alive = this.enemies.some((e) => !e.dead && e.tag === 'enc' && e.def.ai !== 'jet');
    if (alive) return;
    this.waveGap -= dt;
    if (this.waveGap > 0) return;
    if (this.wave < enc.waves.length) {
      this.spawnWave(enc.waves[this.wave++]);
      this.waveGap = 700;
      return;
    }
    // cleared
    this.locked = false;
    this.encIndex++;
    run.checkpoint = this.encIndex;
    run.checkpointX = this.player.x;
    this.bounds = { left: 0, right: st.width };
    cam.setBounds(0, 0, st.width, H);
    this.hud.go?.();
    audio.sfx('select');
    this.addScore(500 * this.mult, this.player.x, this.player.y - 80, 'AREA CLEAR');
  }

  private spawnWave(ids: string[]) {
    const { left, right } = this.bounds;
    ids.forEach((id, k) => {
      const d = ENEMIES[id];
      const fromRight = left < 60 || k % 2 === 0;
      let x: number, y: number;
      if (d.ai === 'turret') { x = R.Between(left + W * 0.45, right - 50); y = -40; }
      else if (d.flying) { x = R.Between(left + 60, right - 60); y = -20 - k * 14; }
      else { x = fromRight ? right + 30 + k * 20 : left - 30 - k * 20; y = GROUND_Y; }
      const e = this.spawnEnemy(id, x, y, 'enc');
      e.awake = true;
    });
  }

  private spawnBoss() {
    const { left, right } = this.bounds;
    const id = this.stage.boss;
    const mid = (left + right) / 2;
    const pos: Record<string, [number, number]> = { vulture: [right + 130, 70], warden: [right - 95, -160], archon: [mid, -70], tyrant: [right - 130, -40], widow: [right - 130, -40], queen: [mid, -90], oracle: [mid, -90] };
    const [x, y] = pos[id] ?? [right - 100, GROUND_Y];
    const b = this.spawnEnemy(id, x, y, 'enc');
    b.arena = { left, right, cx: (left + right) / 2 };
    this.boss = b;
    if (id === 'warden') this.time.delayedCall(620, () => { this.fx.shake(9); this.fx.dustPuff(b.x, GROUND_Y, 24); audio.sfx('explode'); });
  }

  spawnEnemy(id: string, x: number, y: number, tag: string) {
    const d = ENEMIES[id];
    if (d.ai === 'jet') {
      const mid = this.cameras.main.midPoint.x;
      x = mid + (Math.random() < 0.5 ? -420 : 420); y = 62;
    }
    const e = new Enemy(this, d, x, y);
    e.tag = tag;
    this.enemies.push(e);
    return e;
  }

  countAlive(id: string) { return this.enemies.filter((e) => !e.dead && e.def.id === id).length; }
  removeEnemy(e: Enemy) { e.dead = true; e.disableBody(true, true); }

  // ================================================================= shooting
  playerFire() {
    const p = this.player, s = run.stats, w = WEAPONS[run.weapon];
    const od = p.overdrive > 0;
    p.fireCd = w.rate / s.rate / (od ? 1.8 : 1);
    const m = p.muzzle();
    let base = p.dir > 0 ? 0 : Math.PI;
    const aim = this.aim;
    if (aim) {
      // Mouse aim: shots go exactly where the crosshair is. Very close to the gun the angle is taken from the body so it cannot flip backwards.
      const near = R.Distance.Between(m.x, m.y, aim.x, aim.y) < 40;
      base = near ? Math.atan2(aim.y - p.centerY, aim.x - p.x) : Math.atan2(aim.y - m.y, aim.x - m.x);
    }
    // Keyboard / gamepad aim assist: shots bend toward the nearest target in a forward cone.
    let best = 420, target: Enemy | null = null;
    for (const e of aim ? [] : this.enemies) {
      if (e.dead || (e.x - m.x) * p.dir < 12) continue;
      const dist = R.Distance.Between(m.x, m.y, e.x, e.cy);
      const off = Math.abs(R.Angle.Wrap(Math.atan2(e.cy - m.y, e.x - m.x) - base));
      if (dist < best && off < R.DegToRad(38) && Math.abs(e.x - this.cameras.main.midPoint.x) < 330) { best = dist; target = e; }
    }
    if (target) base = Math.atan2(target.cy - m.y, target.x - m.x);
    p.noteShot(base);
    const spread = R.DegToRad(w.spread);
    for (let i = 0; i < w.pellets; i++) {
      const shot = this.pShots.get(m.x, m.y) as Shot | null;
      if (!shot) break;
      const a = base + (w.pellets > 1 ? R.Linear(-spread / 2, spread / 2, i / (w.pellets - 1)) : R.FloatBetween(-spread / 2, spread / 2));
      shot.fire(w.tex, m.x, m.y, a - (w.gravity ? 0.2 : 0) * (Math.cos(a) < 0 ? -1 : 1), w.speed * R.FloatBetween(0.95, 1.05), w.dmg * s.dmg * (od ? 1.5 : 1), od ? 0xffd040 : w.color, { pierce: w.pierce, blast: w.explosive, smoke: w.id === 'rocket', life: w.life ?? (w.pellets > 1 ? 420 : 950), scale: w.scale, gravity: w.gravity, chain: w.chain, chill: w.chill, pull: w.pull, rehit: w.rehit });
    }
    this.fx.muzzle(m.x, m.y, od ? 0xffd040 : w.color);
    this.fx.spark(m.x - p.dir * 16, m.y - 2, 0xffd070, 1); // shell casing
    this.fx.shake(w.kick * 0.45);
    p.body.velocity.x -= p.dir * w.kick * 14;
    audio.sfx(w.sfx);
    if (w.ammo > 0 && --run.ammo <= 0) {
      run.weapon = run.op.weapon;
      this.fx.popup(p.x, p.y - 80, 'AMMO OUT', '#ff8060');
    }
  }

  enemyShot(x: number, y: number, angle: number, speed: number, dmg = 10, o: ShotOpts = {}) {
    const shot = this.eShots.get(x, y) as Shot | null;
    if (!shot) return;
    shot.fire(o.tex ?? 'ebullet', x, y, angle, speed, dmg, o.color ?? 0xff5040, { gravity: o.gravity, blast: o.blast, life: o.life ?? 2600, scale: o.scale });
    if (!o.gravity) audio.sfx('eshoot');
  }

  /** Warning light that swells before an attack. Every enemy attack must be telegraphed (fairness rule). */
  telegraph(x: number, y: number, color: number, ms: number, scale = 0.55) {
    const g = this.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(color).setScale(0.05).setDepth(DEPTH.fx);
    this.tweens.add({ targets: g, scale, duration: ms, ease: 'Quad.in', onComplete: () => g.destroy() });
  }

  private onShotEnemy(a: object, b: object) {
    const shot = (a instanceof Shot ? a : b) as Shot, e = (a instanceof Enemy ? a : b) as Enemy;
    if (!shot.active || e.dead || shot.hit.has(e)) return;
    shot.hit.add(e);
    this.fx.spark(shot.x, shot.y, e.def.gore, 5);
    this.fx.glow(shot.x, shot.y, shot.color, 0.35, 90);
    audio.sfx('hit');
    if (shot.blast) { this.detonate(shot); return; }
    e.hurt(shot.dmg, shot.x);
    if (shot.chill) e.chill(shot.chill);
    if (shot.chain) this.chainZap(e, shot);
    if (!shot.pierce) shot.kill();
  }

  /** Player explosive goes off. Singularity rounds drag nearby enemies in first, then burst. */
  private detonate(shot: Shot) {
    const { x, y, blast, dmg, color } = shot;
    shot.kill();
    if (!shot.pull) return this.blastEnemies(x, y, blast, dmg);
    this.fx.glow(x, y, color, 2.6, 260);
    this.fx.ring(x, y, color, 0.1, 10);
    audio.sfx('blink');
    for (const e of this.enemies) {
      if (e.dead || e.def.heavy || e.def.boss || R.Distance.Between(x, y, e.x, e.cy) > blast * 2.2) continue;
      const a = Math.atan2(y - e.cy, x - e.x);
      e.body.setVelocity(Math.cos(a) * 330, e.def.flying ? Math.sin(a) * 330 : e.body.velocity.y);
      e.chill(240);
    }
    this.time.delayedCall(240, () => { if (this.state !== 'dead') this.blastEnemies(x, y, blast, dmg); });
  }

  /** Lightning from a chain weapon hops between the closest enemies that have not been hit yet. */
  private chainZap(from: Enemy, shot: Shot) {
    let last = from;
    for (let hop = 0; hop < shot.chain; hop++) {
      let next: Enemy | null = null, best = 150;
      for (const e of this.enemies) {
        if (e.dead || shot.hit.has(e) || e.def.faction === 'prop') continue;
        const d = R.Distance.Between(last.x, last.cy, e.x, e.cy);
        if (d < best) { best = d; next = e; }
      }
      if (!next) break;
      shot.hit.add(next);
      this.fx.bolt(last.x, last.cy, next.x, next.cy, shot.color);
      next.hurt(shot.dmg * 0.6, last.x);
      last = next;
    }
  }

  private onShotWall(a: object, b: object, mine: boolean) {
    const shot = (a instanceof Shot ? a : b) as Shot;
    if (!shot.active) return;
    if (shot.blast) {
      if (mine) return this.detonate(shot);
      this.blastPlayer(shot.x, shot.y, shot.blast, shot.dmg);
    } else this.fx.spark(shot.x, shot.y, shot.color, 3);
    shot.kill();
  }

  private onShotPlayer(shot: Shot) {
    const p = this.player;
    if (!shot.active || p.dead || p.invuln > 0) return; // slide i-frames let bullets pass through
    if (shot.blast) this.fx.explosion(shot.x, shot.y, shot.blast);
    this.hurtPlayer(shot.dmg, shot.x);
    shot.kill();
  }

  blastEnemies(x: number, y: number, r: number, dmg: number) {
    this.fx.explosion(x, y, r);
    for (const e of this.enemies) {
      if (!e.dead && R.Distance.Between(x, y, e.x, e.cy) < r + Math.max(e.body.width, e.body.height) / 2) e.hurt(dmg, x);
    }
  }

  blastPlayer(x: number, y: number, r: number, dmg: number) {
    this.fx.explosion(x, y, r);
    const p = this.player;
    if (R.Distance.Between(x, y, p.x, p.centerY) < r + 14) this.hurtPlayer(dmg, x);
  }

  // ================================================================= damage / death
  private onTouch(e: Enemy) {
    if (e.dead || this.player.dead) return;
    if (e.def.ai === 'diver') { if (this.player.invuln <= 0) e.explode(); return; }
    if (e.def.contact > 0) this.hurtPlayer(e.def.contact, e.x);
  }

  private onHazard() {
    const p = this.player;
    if (p.dead || p.sliding > 0) return; // sliding skims over hazards
    p.body.setVelocityY(-330);
    this.hurtPlayer(15, p.x - p.dir);
    this.fx.spark(p.x, p.y, 0xffa030, 8);
  }

  hurtPlayer(dmg: number, srcX: number) {
    const p = this.player;
    if (p.dead || p.invuln > 0 || this.state !== 'play') return;
    run.hp -= Math.max(1, Math.round(dmg * run.stats.armor));
    this.combo = 0; this.mult = 1; this.comboT = 0;
    p.invuln = 900;
    p.flashWhite();
    p.body.setVelocity(Math.sign(p.x - srcX || -p.dir) * 190, Math.min(p.body.velocity.y, -150));
    this.fx.shake(6);
    this.fx.hitstop(70);
    this.fx.spark(p.x, p.centerY, 0xff4040, 10);
    this.hud.hurtFlash?.();
    audio.sfx('hurt');
    if (run.hp <= 0) {
      run.hp = 0;
      this.state = 'dead';
      run.deaths++;
      p.die();
      audio.sfx('death');
      audio.playMusic(null);
      this.fx.explosion(p.x, p.centerY, 34, 0xff4040, true);
      this.physics.world.timeScale = 2.4; // slow-motion fall
      this.hud.dead?.();
      this.time.delayedCall(900, () => (this.canRetry = true));
    }
  }

  private retry() {
    run.score = Math.floor(run.score * 0.8);
    run.hp = run.stats.maxHp;
    run.weapon = run.op.weapon;
    run.ammo = 0;
    this.scene.restart();
  }

  killEnemy(e: Enemy, byPlayer = true) {
    if (e.dead) return;
    const d = e.def;
    if (d.boss) return this.bossDeath(e);
    this.corpse(e, byPlayer);
    this.removeEnemy(e);
    const x = e.x, y = e.cy;
    this.fx.explosion(x, y, Math.min(46, 20 * e.scale + d.hp * 0.08), d.faction === 'undead' || d.faction === 'mutant' ? 0x80e040 : d.faction === 'alien' ? 0xb070ff : 0xff9a30);
    if (d.ai === 'crate') {
      this.dropPickup(d.drops ?? (Math.random() < 0.72 ? 'weapon' : 'health'), x, y);
      for (let i = 0; i < 3; i++) this.dropPickup('chip', x, y);
      return;
    }
    if (d.ai === 'barrel') { // toxic barrels hurt everyone nearby, and set off their neighbours
      this.time.delayedCall(70, () => {
        if (this.state === 'dead') return;
        this.fx.explosion(x, y, 62, 0xa0ff40, true);
        this.blastEnemies(x, y, 62, 70);
        const p = this.player;
        if (R.Distance.Between(x, y, p.x, p.centerY) < 62) this.hurtPlayer(15, x);
      });
      return;
    }
    if (!byPlayer) return;
    if (d.drops) this.dropPickup(d.drops, x, y);
    this.fx.hitstop(d.heavy ? 60 : 28);
    this.combo++;
    this.comboT = 3600;
    const m = Math.min(8, 1 + Math.floor(this.combo / 4));
    if (m > this.mult) { audio.sfx('combo'); this.hud.comboUp?.(); }
    this.mult = m;
    run.maxCombo = Math.max(run.maxCombo, this.combo);
    run.kills++; this.stageKills++;
    this.addScore(d.score * this.mult, x, y - 14);
    const s = run.stats;
    if (this.player.overdrive <= 0) run.od = Math.min(100, run.od + (d.heavy ? 12 : 6) * s.odGain);
    if (s.lifesteal) run.hp = Math.min(s.maxHp, run.hp + s.lifesteal);
    for (let i = R.Between(1, 3); i > 0; i--) this.dropPickup('chip', x, y);
    const low = run.hp < s.maxHp * 0.35;
    if (Math.random() < (low ? 0.2 : 0.06)) this.dropPickup('health', x, y);
    if ((d.id === 'elite' || d.id === 'brute' || d.id === 'bastion' || d.id === 'slug') && Math.random() < 0.4) this.dropPickup('weapon', x, y);
    if (s.blast) this.time.delayedCall(90, () => this.blastEnemies(x, y, s.blast, 26));
  }

  /** Death animation: the sprite flashes white, is thrown away from the player, tumbles and fades. */
  private corpse(e: Enemy, byPlayer: boolean) {
    const d = e.def;
    if (d.ai === 'crate' || d.ai === 'barrel' || d.faction === 'prop' || !byPlayer) return;
    const dir = e.x >= this.player.x ? 1 : -1;
    const c = this.add.image(e.x, e.y, e.texture.key, e.frame.name).setOrigin(e.originX, e.originY).setScale(e.scaleX, e.scaleY).setFlipX(e.flipX).setDepth(DEPTH.enemy + 1).setTintFill(0xffffff);
    const heavy = d.heavy ? 0.6 : 1;
    const air = !!d.flying;
    const dist = (air ? 40 : 70) * heavy, rise = (air ? 10 : 34) * heavy;
    this.time.delayedCall(60, () => c.clearTint());
    this.tweens.add({ targets: c, x: c.x + dir * dist, angle: dir * (air ? 200 : 80) * heavy, duration: 520, ease: 'Quad.out' });
    this.tweens.add({ targets: c, y: { value: c.y - rise, duration: 190, ease: 'Quad.out' } });
    this.tweens.add({ targets: c, y: { value: air ? c.y + 90 : GROUND_Y + 2, duration: 330, delay: 190, ease: 'Quad.in' }, alpha: { value: 0, duration: 260, delay: 260 }, onComplete: () => c.destroy() });
  }

  addScore(n: number, x: number, y: number, label = '') {
    run.score += n;
    this.fx.popup(x, y, label ? `${label} +${n}` : `+${n}`, this.mult >= 4 ? '#ffd040' : '#ffffff');
  }

  private bossDeath(b: Enemy) {
    b.dead = true; // stops its AI; stays on screen while it breaks apart
    b.body.enable = false;
    this.state = 'clear';
    this.bossActive = false;
    audio.playMusic(null);
    for (const e of this.enemies) if (e !== b && !e.dead) { this.fx.explosion(e.x, e.cy, 22); this.removeEnemy(e); }
    for (const s of this.eShots.getChildren() as Shot[]) if (s.active) { this.fx.spark(s.x, s.y, 0xffffff, 2); s.kill(); }
    this.fx.hitstop(180);
    this.tweens.add({ targets: b, x: b.x + 3, duration: 40, yoyo: true, repeat: 44 });
    const w = b.displayWidth / 2, h = b.displayHeight / 2, by = b.cy;
    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(150 + i * 150, () => this.fx.explosion(b.x + R.Between(-w, w) * 0.8, by + R.Between(-h, h) * 0.8, R.Between(22, 40)));
    }
    this.time.delayedCall(2100, () => {
      this.fx.explosion(b.x, by, 90, 0xffe0a0, true);
      this.fx.flash(0xffffff, 400);
      this.addScore(b.def.score, b.x, by - 30, 'TARGET DESTROYED');
      for (let i = 0; i < 24; i++) this.dropPickup('chip', b.x + R.Between(-40, 40), by);
      b.setVisible(false);
      this.boss = null;
      audio.sfx('clear');
    });
    this.time.delayedCall(3600, () => this.stageClear());
  }

  private stageClear() {
    const secs = Math.round(this.stageTime / 1000);
    const bonus = Math.max(0, 3000 - secs * 10) + run.maxCombo * 50;
    run.score += bonus;
    this.hud.tally?.(this.stage.name, secs, this.stageKills, run.maxCombo, bonus);
    this.time.delayedCall(4200, () => {
      run.stage++;
      run.checkpoint = 0;
      run.checkpointX = 80;
      run.hp = Math.min(run.stats.maxHp, run.hp + Math.round(run.stats.maxHp * 0.3));
      save.cleared = Math.max(save.cleared, run.stage);
      save.best = Math.max(save.best, run.score);
      persist();
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(420, () => {
        this.scene.stop('Hud');
        if (run.stage >= STAGES.length) this.scene.start('End'); else this.scene.start('Perk');
      });
    });
  }

  // ================================================================= overdrive
  tryOverdrive() {
    const p = this.player;
    if (run.od < 100 || p.overdrive > 0 || this.state !== 'play') return;
    run.od = 0;
    p.overdrive = 6500;
    audio.sfx('overdrive');
    audio.intense = true;
    this.fx.flash(0xffd040, 160);
    this.fx.ring(p.x, p.centerY, 0xffd040, 9, 500);
    this.fx.hitstop(130);
    this.fx.shake(6);
    this.banner('OVERDRIVE', 900, '#ffd040');
    // shockwave: wipes enemy bullets and staggers everything on screen
    for (const s of this.eShots.getChildren() as Shot[]) if (s.active) { this.fx.spark(s.x, s.y, 0xffd040, 3); s.kill(); }
    for (const e of [...this.enemies]) if (!e.dead && Math.abs(e.x - p.x) < 340 && e.def.faction !== 'prop') e.hurt(20, p.x);
  }

  // ================================================================= pickups
  dropPickup(kind: 'chip' | 'health' | 'weapon', x: number, y: number) {
    const tex = kind === 'chip' ? 'chip' : kind === 'health' ? 'health' : 'wcrate';
    const pk = this.physics.add.image(x, y, tex) as Pickup;
    pk.kind = kind; pk.age = 0;
    pk.setDepth(DEPTH.shot).setBounce(0.45).setDragX(120).setVelocity(R.Between(-110, 110), R.Between(-260, -120));
    if (kind === 'chip') pk.setTint(this.stage.accent);
    if (kind === 'weapon') {
      pk.wid = R.RND.pick(DROP_WEAPONS.filter((w) => w !== run.weapon));
      const weapon = WEAPONS[pk.wid!];
      if (weapon.pickupArt && this.textures.exists(weapon.pickupArt)) {
        // Keep the original crate's collision footprint while showing the wider weapon.
        const body = pk.body as Phaser.Physics.Arcade.Body;
        const { width, height } = body;
        pk.setTexture(weapon.pickupArt);
        body.setSize(width, height, true);
      } else pk.setTint(weapon.color);
    }
    if (kind !== 'chip') pk.glow = this.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(kind === 'health' ? 0x60ff90 : WEAPONS[pk.wid!].color).setScale(0.7).setAlpha(0.6).setDepth(DEPTH.shot - 1);
    this.pickups.push(pk);
  }

  private tickPickups(dt: number) {
    const p = this.player;
    for (const pk of this.pickups) {
      if (pk.taken) continue;
      pk.age += dt;
      pk.glow?.setPosition(pk.x, pk.y).setScale(0.6 + Math.sin(pk.age / 150) * 0.12);
      if (pk.kind === 'chip' && pk.age > 320 && !p.dead) {
        const d = R.Distance.Between(pk.x, pk.y, p.x, p.centerY);
        if (d < run.stats.magnet || this.state === 'clear') {
          (pk.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
          const a = Math.atan2(p.centerY - pk.y, p.x - pk.x);
          pk.setVelocity(Math.cos(a) * 420, Math.sin(a) * 420);
        }
      }
      const ttl = pk.kind === 'chip' ? 7000 : 14000;
      if (pk.age > ttl - 1500) pk.setAlpha(Math.floor(pk.age / 80) % 2 ? 0.3 : 1);
      if (pk.age > ttl) pk.taken = true;
    }
  }

  private onPickup(pk: Pickup) {
    if (pk.taken || this.player.dead || pk.age < 150) return;
    pk.taken = true;
    pk.disableBody(true, true);
    pk.glow?.setVisible(false);
    const s = run.stats, p = this.player;
    if (pk.kind === 'chip') {
      run.score += 20 * this.mult;
      if (p.overdrive <= 0) run.od = Math.min(100, run.od + 1.2 * s.odGain);
      audio.sfx('chip');
    } else if (pk.kind === 'health') {
      run.hp = Math.min(s.maxHp, run.hp + 25);
      this.fx.popup(p.x, p.y - 80, '+25 ARMOR', '#80ffb0');
      this.fx.ring(p.x, p.centerY, 0x60ff90, 1.2);
      audio.sfx('health');
    } else {
      const w = WEAPONS[pk.wid!];
      run.weapon = w.id;
      run.ammo = Math.round(w.ammo * s.ammo);
      this.fx.popup(p.x, p.y - 80, w.name, '#ffffff', 16);
      this.fx.ring(p.x, p.centerY, w.color, 1.4);
      audio.sfx('weapon');
    }
  }

  /** True when the player stands on a drop-through platform rather than the floor. */
  onOneWay(p: Player) { return p.y < GROUND_Y - 6; }
}
