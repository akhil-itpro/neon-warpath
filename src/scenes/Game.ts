import Phaser from 'phaser';
import { W, H, GROUND_Y, DEPTH } from '../config';
import { STAGES, StageDef, Encounter } from '../data/stages';
import { ENEMIES } from '../data/enemies';
import { WEAPONS, DROP_WEAPONS } from '../data/weapons';
import { collectWeapon, cycleWeapon, equipped, selectWeapon } from '../systems/Loadout';
import { run, save, persist, newStageStats } from '../systems/Run';
import { audio } from '../systems/Audio';
import { Controls } from '../systems/Controls';
import { Fx } from '../systems/Fx';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Shot } from '../entities/Shot';
import { STORY, CHOICES, HOLD, type Line } from '../data/story';
import { condOk, filterLines, applyChoice } from '../systems/Story';
import { Gimmicks } from '../systems/Gimmicks';
import { saveCampaign } from '../systems/CampaignSave';
import { difficulty } from '../systems/Settings';
import type { HudScene } from './Hud';

const R = Phaser.Math;
type Pickup = Phaser.Physics.Arcade.Image & { kind: string; wid?: string; age: number; taken?: boolean; glow?: Phaser.GameObjects.Image };
type Shard = { id: string; img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image; y0: number };
// HOLD IT OPEN finale (docs/STORY.md C7): survive this long in the ARCHON arena while the species walk home
const HOLD_MS = 60000;
const HOLD_POOL = ['alien', 'trooper', 'kamikaze', 'drone', 'zombie', 'elite', 'alien', 'demon', 'jet', 'kamikaze', 'brute', 'elite']; // unlocks left to right over time
const WALKERS = ['varkesh', 'kharrix', 'ferrivor', 'myrrhkin', 'thren', 'vitreon', 'lithurn', 'corvane', 'nacreth', 'cirrid', 'asterid'];
const FLYING_WALKERS = new Set(['nacreth', 'cirrid', 'asterid']);
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
  canRetry = false;
  aim: { x: number; y: number } | null = null; // world point under the mouse crosshair; null = keyboard/gamepad auto-aim
  gimmicks!: Gimmicks;
  choosing = false; // an in-level slow-motion choice is on screen
  hold = false; // HOLD IT OPEN survival finale (Briefing starts Game with { hold: true })
  holdT = 0;
  private holdSpawn = 0;
  private holdHalf = false;
  private walkT = 0;
  private gateX = 0;
  pShots!: Phaser.Physics.Arcade.Group;
  eShots!: Phaser.Physics.Arcade.Group;

  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private oneways!: Phaser.Physics.Arcade.StaticGroup;
  private hazards!: Phaser.Physics.Arcade.StaticGroup;
  private bg!: Phaser.GameObjects.TileSprite;
  private layers: { img: Phaser.GameObjects.TileSprite; k: number }[] = []; // optional parallax art: bg_<id>_far / bg_<id>_near
  private flows: Phaser.GameObjects.TileSprite[] = [];
  private fogs: Phaser.GameObjects.TileSprite[] = [];
  private encounters: (Encounter & { boss?: boolean })[] = [];
  private encIndex = 0;
  private locked = false;
  private wave = 0;
  private waveGap = 0;
  private shards: Shard[] = [];
  private xTriggers: number[] = [];
  private seeIds = new Set<string>();
  private seeT = 0;
  private bossMarks = new Set<string>();
  private bgDrift = 0;
  private allyWaves: Record<number, string[]> = {};
  private sinceHurt = 0;   // ms since the player last took damage (armor self-repair, CoD style)
  private regenAcc = 0;    // fractional armor carried between frames so run.hp stays a whole number
  regenerating = false;    // read by the HUD
  private hints: [number, string][] = [];

  constructor() { super('Game'); }

  private get hud() { return this.scene.get('Hud') as HudScene; }
  banner(text: string, ms = 1600, color = '#ffffff') { this.hud.banner?.(text, ms, color); }

  create(data?: { retry?: boolean; hold?: boolean; resume?: boolean }) {
    this.hold = !!data?.hold;
    if (this.hold) { // the finale reuses the cathedral's boss arena
      run.stage = STAGES.length - 1;
      run.checkpoint = 99; // past every encounter: no camera locks, no roamers
      run.checkpointX = STAGES[run.stage].width - W + 140;
    }
    const st = (this.stage = STAGES[run.stage]);
    this.enemies = []; this.pickups = []; this.flows = []; this.fogs = []; this.shards = [];
    this.bossMarks = new Set(); this.seeT = 0; this.bgDrift = 0; this.choosing = false;
    if (run.checkpoint === 0 && !data?.retry && !data?.resume) run.eggsShot = 0;
    if (st.id === 'fungal') run.flags.nest_truce = run.eggsShot < 3;
    const comms = STORY[st.id]?.comms ?? [];
    this.xTriggers = comms.filter((c) => c.on.startsWith('x:')).map((c) => Number(c.on.slice(2)));
    this.seeIds = new Set(comms.filter((c) => c.on.startsWith('see:')).map((c) => c.on.slice(4)));
    if (this.hold) { this.xTriggers = []; this.seeIds = new Set(); }
    this.state = 'play'; this.combo = 0; this.comboT = 0; this.mult = 1;
    this.aim = null;
    this.boss = null; this.bossActive = false; this.locked = false; this.canRetry = false;
    this.wave = 0; this.waveGap = 0;
    this.sinceHurt = 0; this.regenAcc = 0; this.regenerating = false;
    this.physics.world.resume();
    this.physics.world.timeScale = 1;
    this.time.timeScale = 1; this.tweens.timeScale = 1; // a death during a slow-motion choice must not leave the retry in slow motion
    this.physics.world.setBounds(-800, -400, st.width + 1600, H + 800);
    this.controls = new Controls(this);
    this.fx = new Fx(this);

    // ---- backdrop
    this.bg = this.add.tileSprite(0, 0, W, H, st.bg).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.bg).setTint(st.bgTint);
    // optional parallax layers (transparent 1280x360 PNGs, docs/CODEX_ART_HANDOFF.md job 5): they sit between the sky and the shade
    this.layers = ([['far', 0.42], ['near', 0.7]] as const).filter(([n]) => this.textures.exists(`${st.bg}_${n}`))
      .map(([n, k], i) => ({ k, img: this.add.tileSprite(0, 0, W, H, `${st.bg}_${n}`).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.bg + 0.2 + i * 0.2).setTint(st.bgTint) }));
    const shade = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.bg + 1);
    // Quiet the painted scenery without dimming actors, projectiles or telegraphs.
    shade.fillStyle(0x0b0d14, 0.32).fillRect(0, 0, W, H);
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
    // ground haze: a band of stage-coloured light behind everyone standing on the floor, so dark sprites read as silhouettes
    this.add.image(W / 2, GROUND_Y - 6, 'glow').setDisplaySize(W * 1.7, 190).setScrollFactor(0).setTint(st.accent).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.bg + 4);
    // foreground silhouettes scroll faster than the world for depth
    for (let x = 500; x < st.width * 1.6; x += R.Between(620, 980)) {
      this.add.image(x, 0, 'pillar').setOrigin(0.5, 0).setScrollFactor(1.6, 1).setDepth(st.dark ? DEPTH.fx - 2 : DEPTH.front).setAlpha(0.4); // see-through so it never hides a threat; under the darkness in dark stages (it showed as a pale column on top of it)
    }
    this.makeWeather(st);

    // ---- actors
    this.pShots = this.physics.add.group({ classType: Shot, maxSize: 110, runChildUpdate: true });
    this.eShots = this.physics.add.group({ classType: Shot, maxSize: 320, runChildUpdate: true });
    this.player = new Player(this, run.checkpointX, GROUND_Y - 1);
    this.bounds = { left: 0, right: st.width };

    // story consequences (StageDef.variants) add waves / roamers when their flag condition holds
    const variants = (st.variants ?? []).filter((v) => condOk(v.if));
    const encs = st.encounters.map((e) => ({ ...e, waves: [...e.waves] }));
    for (const v of variants) for (const [i, wave] of v.waves ?? []) encs[i]?.waves.unshift(wave);
    this.allyWaves = {};
    for (const v of variants) for (const [i, ids] of v.allies ?? []) this.allyWaves[i] = [...(this.allyWaves[i] ?? []), ...ids];
    this.encounters = [...encs, { x: st.width - 430, waves: [], boss: true }];
    this.encIndex = run.checkpoint;
    for (const [id, x, y] of [...st.roamers, ...variants.flatMap((v) => v.roamers ?? [])] as [string, number, number?][]) {
      if (x < run.checkpointX + 260 && run.checkpoint > 0) continue; // already fought on a previous attempt
      if (id === 'cage' && run.flags.quill_rescued) continue;
      const e = this.spawnEnemy(id, x, y ?? (ENEMIES[id].flying ? 150 : GROUND_Y), '');
      if (y !== undefined) e.body.setAllowGravity(false); // pinned up on a girder
    }
    this.gimmicks = new Gimmicks(this, st);

    // ---- data shards (collected ones stay collected through retries)
    for (const [id, x, y] of st.shards ?? []) {
      if (run.shards.includes(id) || this.hold) continue;
      const glow = this.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xff60d0).setScale(0.8).setAlpha(0.7).setDepth(DEPTH.shot - 1);
      const img = this.add.image(x, y, 'shard').setDepth(DEPTH.shot);
      this.shards.push({ id, img, glow, y0: y });
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
    saveCampaign('Game', { hold: this.hold });
    if (this.hold) { this.startHold(); return; }
    this.time.delayedCall(350, () => {
      if (data?.retry) this.banner(run.checkpoint === 0 ? 'BACK IN THE FIGHT' : 'CHECKPOINT', 1200, '#80ffb0'); // the full stage title plays once, not after every death
      else if (run.checkpoint === 0) this.hud.stageIntro?.(`STAGE ${run.stage + 1}`, st.name, st.tagline);
      else this.banner('CHECKPOINT', 1200, '#80ffb0');
    });
    this.time.delayedCall(data?.retry ? 1200 : 2900, () => { this.comm('start'); if (data?.retry) this.comm('death'); });
    // first stage, first attempt: teach the three things that keep a new player alive
    const d = difficulty();
    this.hints = run.stage === 0 && run.checkpoint === 0 && !data?.retry && !data?.resume ? [
      [3600, 'SHIFT / RIGHT CLICK: SLIDE - NOTHING CAN HIT YOU WHILE SLIDING'],
      [9500, d.regenRate > 0 ? 'HURT? STAY OUT OF FIRE A FEW SECONDS - YOUR ARMOR REPAIRS ITSELF' : 'S / DOWN: CROUCH UNDER HIGH SHOTS'],
      [15500, `E: ${run.op.ability.name} - YOUR EMERGENCY SKILL, IT RECHARGES`],
      [21500, 'HOLD S + SPACE: DROP THROUGH A PLATFORM'],
    ] : [];
    const cut = Math.min(d.mercyMax, run.strikes * d.mercy);
    if (data?.retry && cut > 0) this.time.delayedCall(1500, () => this.hud.hint?.(`BACKUP PLATING: -${Math.round(cut * 100)}% DAMAGE UNTIL YOU GET PAST THIS`, 4200, '#80ffb0'));
  }

  /** Armor repairs itself after a few seconds without taking a hit (rates per difficulty in Settings.ts). */
  private tickRegen(dt: number) {
    const d = difficulty(), s = run.stats;
    this.sinceHurt += dt;
    const cap = Math.ceil(s.maxHp * d.regenCap);
    if ((window as any).__noRegen || this.player.dead || this.sinceHurt < d.regenDelay || run.hp >= cap) { this.regenerating = false; this.regenAcc = 0; return; }
    if (!this.regenerating) { this.regenerating = true; audio.sfx('regen'); }
    this.regenAcc += s.maxHp * d.regenRate / 100 * dt / 1000;
    const whole = Math.floor(this.regenAcc);
    if (whole > 0) { this.regenAcc -= whole; run.hp = Math.min(cap, run.hp + whole); }
    if (run.hp >= cap) { this.regenerating = false; this.fx.ring(this.player.x, this.player.centerY, 0x60ff90, 1, 240); audio.sfx('ready'); }
  }

  /** Plays a story comms trigger once per run (radio overlay in the HUD; never pauses play). */
  comm(trigger: string) {
    if (this.state === 'dead') return;
    const global = trigger === 'shard'; // the first shard of the run, whichever stage it is in
    const key = global ? trigger : `${this.stage.id}:${trigger}`;
    if (run.heard.includes(key)) return;
    const src = global ? STORY.city : STORY[this.stage.id];
    const lines: Line[] = (src?.comms ?? []).filter((c) => c.on === trigger).flatMap((c) => filterLines(c.lines));
    if (!lines.length) return;
    run.heard.push(key);
    this.hud.comms?.(lines);
  }

  private tickStory(dt: number) {
    const p = this.player;
    for (const x of this.xTriggers) if (p.x >= x) this.comm(`x:${x}`);
    if (this.seeIds.size && (this.seeT -= dt) <= 0) {
      this.seeT = 200;
      const cx = this.cameras.main.midPoint.x;
      for (const e of this.enemies) if (!e.dead && this.seeIds.has(e.def.id) && Math.abs(e.x - cx) < 300) { this.seeIds.delete(e.def.id); this.comm(`see:${e.def.id}`); }
    }
    const b = this.boss;
    if (b && !b.dead) for (const [k, f] of [['boss66', 0.66], ['boss50', 0.5], ['boss33', 0.33]] as const) {
      if (!this.bossMarks.has(k) && b.hp < b.maxHp * f) { this.bossMarks.add(k); this.comm(k); this.bossMark(k, b); }
    }
    // shards: bob, and collect when the player's body touches one
    for (const sh of this.shards) {
      if (!sh.img.visible) continue;
      const y = sh.y0 + Math.sin(this.time.now / 300 + sh.y0) * 3;
      sh.img.setY(y); sh.glow.setY(y).setScale(0.75 + Math.sin(this.time.now / 160) * 0.08);
      if (!p.dead && Math.abs(p.x - sh.img.x) < 16 && y > p.body.top - 6 && y < p.body.bottom + 6) this.takeShard(sh);
    }
  }

  private takeShard(sh: Shard) {
    sh.img.setVisible(false); sh.glow.setVisible(false);
    run.shards.push(sh.id);
    if (!save.archive.includes(sh.id)) { save.archive.push(sh.id); persist(); }
    const got = (this.stage.shards ?? []).filter(([id]) => run.shards.includes(id)).length;
    this.fx.ring(sh.img.x, sh.img.y, 0xff60d0, 1.4);
    this.fx.popup(sh.img.x, sh.img.y - 20, `DATA SHARD ${got}/${this.stage.shards?.length ?? 3}`, '#ff90e0');
    this.addScore(1000, sh.img.x, sh.img.y - 34);
    audio.sfx('shard');
    this.hud.shardGot?.();
    this.comm('shard');
  }

  private makeWeather(st: StageDef) {
    const base = { x: { min: 0, max: W + 120 }, emitting: true };
    let cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;
    if (st.weather === 'rain') cfg = { ...base, y: -10, speedY: { min: 480, max: 600 }, speedX: -130, lifespan: 760, scaleX: 0.5, scaleY: { min: 3, max: 6 }, alpha: 0.32, tint: 0x9ac4ff, quantity: 2, frequency: 16 };
    else if (st.weather === 'embers') cfg = { ...base, y: H + 6, speedY: { min: -110, max: -40 }, speedX: { min: -40, max: 40 }, lifespan: 3200, scale: { start: 1.2, end: 0 }, alpha: 0.9, tint: [0xff8030, 0xffc040, 0xff5020], blendMode: 'ADD', frequency: 70 };
    else if (st.weather === 'spores') cfg = { ...base, y: H + 6, speedY: { min: -46, max: -14 }, speedX: { min: -24, max: 24 }, lifespan: 6000, scale: { start: 1.4, end: 0.2 }, alpha: { start: 0.8, end: 0 }, tint: [0x40ffc0, 0x80ffa0, 0xc0ff60], blendMode: 'ADD', frequency: 90 };
    else if (st.weather === 'bubbles') cfg = { ...base, y: H + 6, speedY: { min: -90, max: -40 }, speedX: { min: -12, max: 12 }, lifespan: 4200, scale: { min: 0.6, max: 1.8 }, alpha: { start: 0.5, end: 0 }, tint: [0x60b0ff, 0xa0e0ff], frequency: 110 };
    else if (st.weather === 'glints') cfg = { ...base, y: { min: 0, max: H }, speedX: { min: -20, max: 20 }, speedY: { min: -10, max: 10 }, lifespan: 1600, scale: { start: 1.4, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0x90e8ff, 0xd0b0ff, 0xffffff], blendMode: 'ADD', frequency: 70 };
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
    if (this.state === 'play' && !this.choosing) {
      const slot = c.weaponSlot;
      const changed = slot >= 0 ? selectWeapon(run.loadout, slot)
        : c.pressed('nextWeapon') && cycleWeapon(run.loadout);
      if (changed) audio.sfx('ui');
    }
    if (this.fx.frozen(delta)) return;
    const dt = Math.min(delta, 34) * (this.choosing ? 0.2 : 1);
    const cam = this.cameras.main;

    this.bg.tilePositionX = cam.scrollX * 0.22 + this.bgDrift;
    for (const l of this.layers) l.img.tilePositionX = cam.scrollX * l.k + this.bgDrift * (l.k / 0.22);
    for (const f of this.flows) f.tilePositionX += dt * 0.03;
    this.fogs.forEach((f, i) => { f.tilePositionX = cam.scrollX * (0.35 + i * 0.25) + this.time.now * (0.012 + i * 0.01); });

    // sweep things that died during the physics step
    for (let i = this.enemies.length - 1; i >= 0; i--) if (this.enemies[i].dead && !this.enemies[i].def.boss) { this.enemies[i].destroy(); this.enemies.splice(i, 1); }
    for (let i = this.pickups.length - 1; i >= 0; i--) if (this.pickups[i].taken) { this.pickups[i].glow?.destroy(); this.pickups[i].destroy(); this.pickups.splice(i, 1); }

    const p = this.player;
    this.aim = c.aimPoint(cam, p.x, p.centerY);
    this.gimmicks.tick(dt);
    if (!this.choosing) p.tick(dt, c);
    if (!p.dead) {
      p.x = R.Clamp(p.x, this.bounds.left + 10, this.bounds.right - 10);
      cam.setFollowOffset(R.Linear(cam.followOffset.x, -p.dir * 44, 0.035), 0);
    }
    for (const e of this.enemies) e.tick(dt);
    if (this.locked) this.keepInArena();
    this.tickPickups(dt);
    this.tickShots();

    if (this.state !== 'play') return;
    run.stageStats.elapsed += dt;
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) { this.combo = 0; this.mult = 1; } }
    if (!this.choosing) this.tickRegen(dt);
    while (this.hints.length && run.stageStats.elapsed >= this.hints[0][0]) this.hud.hint?.(this.hints.shift()![1]);
    if (this.hold) return this.tickHold(dt);
    this.tickEncounter(dt);
    this.tickStory(dt);
  }

  /** Arena walls work both ways: once a ground enemy has walked into a locked arena it cannot wander or lunge
   *  back out past the screen edge, where the player could not reach it and the wave would never end. */
  private keepInArena() {
    const { left, right } = this.bounds;
    for (const e of this.enemies) {
      if (e.dead || e.def.flying || e.def.boss || e.def.ally || e.tag !== 'enc') continue;
      const half = Math.min(e.body.width / 2, 40), lo = left + half + 4, hi = right - half - 4;
      if (!e.inArena) { if (e.x > lo && e.x < hi) e.inArena = true; else continue; }
      if (e.x < lo || e.x > hi) { e.x = R.Clamp(e.x, lo, hi); e.body.setVelocityX(0); }
    }
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
        saveCampaign('Game');
        this.bossActive = true;
        audio.intense = true;
        this.hud.bossWarning?.(st.bossIntro);
        this.time.delayedCall(2200, () => { if (this.state === 'play') this.spawnBoss(); });
      } else {
        this.banner('HOSTILES INBOUND', 1100, '#ff6050');
        audio.sfx('warn');
        this.comm(`enc:${this.encIndex}`);
        const allies = this.allyWaves[this.encIndex];
        if (allies) this.time.delayedCall(900, () => allies.forEach((id, k) => this.spawnAlly(id, left + 50 + k * 45)));
      }
      return;
    }
    const enc = this.encounters[this.encIndex];
    if (enc.boss) return; // ends via killEnemy -> bossDeath
    const alive = this.enemies.some((e) => !e.dead && e.tag === 'enc' && e.def.ai !== 'jet' && !e.def.ally);
    if (alive) return;
    this.waveGap -= dt;
    if (this.waveGap > 0) return;
    if (this.wave < enc.waves.length) {
      this.spawnWave(enc.waves[this.wave++]);
      this.waveGap = 700;
      return;
    }
    // cleared
    this.comm(`clear:${this.encIndex}`);
    this.locked = false;
    this.encIndex++;
    run.checkpoint = this.encIndex;
    run.checkpointX = this.player.x;
    run.strikes = 0;
    this.bounds = { left: 0, right: st.width };
    cam.setBounds(0, 0, st.width, H);
    this.hud.go?.();
    audio.sfx('select');
    this.addScore(500 * this.mult, this.player.x, this.player.y - 80, 'AREA CLEAR');
    saveCampaign('Game');
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
    const pos: Record<string, [number, number]> = { vulture: [right + 130, 70], warden: [right - 95, -160], archon: [mid, -70], tyrant: [right - 130, -40], widow: [right - 130, -40], queen: [mid, -90], oracle: [mid, -90], colossus: [right - 160, -60], matriarch: [mid, -90], sovereign: [mid, -100], regent: [right - 130, -80], halcyon: [right - 80, -40] };
    const [x, y] = pos[id] ?? [right - 100, GROUND_Y];
    const b = this.spawnEnemy(id, x, y, 'enc');
    b.arena = { left, right, cx: (left + right) / 2 };
    this.boss = b;
    // STORY C2: blowing the bridge under the Colossus leaves it a wreck
    if (id === 'colossus' && !run.flags.varkesh_freed) b.hp = Math.round(b.maxHp * 0.6);
    this.comm('boss');
    // FUNGAL nest choice-by-action: burn enough eggs and the hive sends its young after you
    if (this.stage.id === 'fungal' && !run.flags.nest_truce) {
      for (let i = 0; i < 4; i++) this.spawnEnemy('spiderling', i % 2 ? left - 30 - i * 20 : right + 30 + i * 20, GROUND_Y, 'add').awake = true;
    }
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
    if (this.state !== 'play' || this.choosing || this.player.dead) return;
    const slot = equipped(run.loadout);
    const p = this.player, s = run.stats, w = WEAPONS[slot.id];
    const m = p.muzzle();
    const firstShot = this.pShots.get(m.x, m.y) as Shot | null;
    if (!firstShot) return;
    const od = p.overdrive > 0;
    p.fireCd = w.rate / s.rate / (od ? 1.8 : 1) / (p.ability?.rate ?? 1);
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
      if (e.dead || e.def.ally || (e.x - m.x) * p.dir < 12) continue;
      const ty = e.body.center.y; // aim at the hitbox, not the picture: low wide crawlers (kharrix) were shot over
      const dist = R.Distance.Between(m.x, m.y, e.x, ty);
      const off = Math.abs(R.Angle.Wrap(Math.atan2(ty - m.y, e.x - m.x) - base));
      if (dist < best && off < R.DegToRad(58) && Math.abs(e.x - this.cameras.main.midPoint.x) < 330) { best = dist; target = e; }
    }
    if (target) base = Math.atan2(target.body.center.y - m.y, target.x - m.x);
    p.noteShot(base);
    const spread = R.DegToRad(w.spread);
    for (let i = 0; i < w.pellets; i++) {
      const shot = i === 0 ? firstShot : this.pShots.get(m.x, m.y) as Shot | null;
      if (!shot) break;
      const a = base + (w.pellets > 1 ? R.Linear(-spread / 2, spread / 2, i / (w.pellets - 1)) : R.FloatBetween(-spread / 2, spread / 2));
      shot.fire(w.tex, m.x, m.y, a - (w.gravity ? 0.2 : 0) * (Math.cos(a) < 0 ? -1 : 1), w.speed * R.FloatBetween(0.95, 1.05), w.dmg * s.dmg * (od ? 1.5 : 1) * (p.ability?.damage ?? 1), od ? 0xffd040 : w.color, { pierce: w.pierce, blast: w.explosive, smoke: w.id === 'rocket', life: w.life ?? (w.pellets > 1 ? 420 : 950), scale: w.scale, gravity: w.gravity, chain: w.chain, chill: w.chill, pull: w.pull, rehit: w.rehit });
    }
    this.fx.muzzle(m.x, m.y, od ? 0xffd040 : w.color);
    this.fx.spark(m.x - p.dir * 16, m.y - 2, 0xffd070, 1); // shell casing
    this.fx.shake(w.kick * 0.45);
    p.body.velocity.x -= p.dir * w.kick * 14;
    audio.sfx(w.sfx);
    if (w.ammo > 0 && --slot.ammo === 0) {
      selectWeapon(run.loadout, 0);
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
    if (!shot.active || e.dead || shot.hit.has(e) || e.def.ally) return;
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
      if (e.dead || e.def.heavy || e.def.boss || e.def.ally || R.Distance.Between(x, y, e.x, e.cy) > blast * 2.2) continue;
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
        if (e.dead || shot.hit.has(e) || e.def.faction === 'prop' || e.def.ally) continue;
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
      if (!e.dead && !e.def.ally && R.Distance.Between(x, y, e.x, e.cy) < r + Math.max(e.body.width, e.body.height) / 2) e.hurt(dmg, x);
    }
  }

  blastPlayer(x: number, y: number, r: number, dmg: number) {
    this.fx.explosion(x, y, r);
    const p = this.player;
    if (R.Distance.Between(x, y, p.x, p.centerY) < r + 14) this.hurtPlayer(dmg, x);
  }

  // ================================================================= damage / death
  private onTouch(e: Enemy) {
    if (e.dead || this.player.dead || e.def.ally) return;
    if (e.def.ai === 'diver') { if (this.player.invuln <= 0) e.explode(); return; }
    if (e.def.contact > 0) this.hurtPlayer(e.def.contact, e.x);
  }

  private onHazard() { this.hazardHit(15, true); }

  /** Burning / electrified ground: bounces the player up. `skim` = a slide passes over it safely. */
  hazardHit(dmg: number, skim: boolean) {
    const p = this.player;
    if (p.dead || (skim && p.sliding > 0)) return;
    if (p.invuln > 0) { if (p.body.velocity.y > -200) p.body.setVelocityY(-260); return; } // still bounce out while blinking
    p.body.setVelocityY(-330);
    this.hurtPlayer(dmg, p.x - p.dir);
    this.fx.spark(p.x, p.y, 0xffa030, 8);
  }

  hurtPlayer(dmg: number, srcX: number) {
    const p = this.player;
    if (p.dead || p.invuln > 0 || this.state !== 'play' || this.choosing) return; // frozen at a story choice = untouchable
    const protection = p.ability?.damageTaken ?? 1;
    if (protection === 0) {
      this.fx.spark(p.x, p.centerY, run.op.ability.color, 3);
      audio.sfx('shieldHit');
      return;
    }
    const d = difficulty();
    const mercy = 1 - Math.min(d.mercyMax, run.strikes * d.mercy);
    run.hp -= Math.max(1, Math.round(dmg * run.stats.armor * protection * d.dmg * mercy));
    this.sinceHurt = 0; this.regenerating = false;
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
      run.stageStats.deaths++;
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
    run.strikes++;
    run.hp = run.stats.maxHp;
    this.scene.restart({ retry: true, hold: this.hold });
  }

  killEnemy(e: Enemy, byPlayer = true) {
    if (e.dead) return;
    const d = e.def;
    if (d.boss) return this.bossDeath(e);
    if (d.id === 'cage') {
      run.flags.quill_rescued = true;
      run.choices.push('YOU FREED QUILL FROM THE CAGE.');
      if (!save.unlocked.includes('quill')) { save.unlocked.push('quill'); persist(); }
      this.comm('cage');
      this.fx.ring(e.x, e.cy, 0x80c0ff, 2.4, 400);
    }
    if (d.splits && byPlayer) for (const sd of [-1, 1]) { const k = this.spawnEnemy(d.splits, e.x + sd * 14, e.y, e.tag); k.awake = true; k.body.setVelocity(sd * 120, -200); }
    if (d.ai === 'egg' && byPlayer) {
      run.eggsShot++;
      if (this.stage.id === 'fungal') run.flags.nest_truce = run.eggsShot < 3;
    }
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
    run.stageStats.bestCombo = Math.max(run.stageStats.bestCombo, this.combo);
    run.kills++; run.stageStats.kills++;
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
    this.comm('bossdown');
    if (this.stage.id === 'fungal') run.choices.push(run.flags.nest_truce ? 'YOU SPARED THE MYRRHKIN NEST.' : 'YOU BURNED THE MYRRHKIN NEST.');
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
    const stats = run.stageStats;
    const secs = Math.floor(stats.elapsed / 1000);
    const bonus = Math.max(0, 3000 - secs * 10) + stats.bestCombo * 50;
    run.score += bonus;
    this.hud.tally?.(this.stage.name, secs, stats, bonus);
    this.time.delayedCall(4200, () => {
      run.stage++;
      run.stageStats = newStageStats();
      run.checkpoint = 0;
      run.checkpointX = 80;
      run.strikes = 0;
      run.hp = Math.min(run.stats.maxHp, run.hp + Math.round(run.stats.maxHp * 0.3));
      save.cleared = Math.max(save.cleared, run.stage);
      save.best = Math.max(save.best, run.score);
      persist();
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(420, () => {
        this.scene.stop('Hud');
        this.scene.start('Briefing', { next: run.stage >= STAGES.length ? 'End' : 'Perk' });
      });
    });
  }

  // ================================================================= HOLD IT OPEN finale
  private startHold() {
    const left = this.stage.width - W;
    this.locked = true; this.bossActive = true;
    this.bounds = { left, right: left + W };
    this.cameras.main.setBounds(left, 0, W, H);
    this.holdT = HOLD_MS; this.holdSpawn = 3000; this.holdHalf = false; this.walkT = 600;
    // the Rift, held still by the Tide Pearl: a pale gate at the arena's left edge
    const gx = (this.gateX = left + 40), gy = GROUND_Y - 78;
    const halo = this.add.image(gx, gy, 'glow').setDisplaySize(120, 230).setTint(0x60ffd0).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.world - 2);
    const core = this.add.ellipse(gx, gy, 30, 156, 0xd0fff4, 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.world - 2);
    this.add.ellipse(gx, gy, 40, 166).setStrokeStyle(2, 0x80ffe0, 0.8).setDepth(DEPTH.world - 2);
    this.tweens.add({ targets: [halo, core], alpha: { from: 0.75, to: 0.35 }, scaleX: { from: 1, to: 1.12 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    audio.intense = true;
    this.time.delayedCall(350, () => { this.hud.holdTimer?.(this.holdT); this.banner('HOLD THE DOOR', 1800, '#80ffe0'); audio.sfx('warn'); });
    this.time.delayedCall(1500, () => this.hud.comms?.(filterLines(HOLD.start)));
    this.time.delayedCall(2500, () => { if (run.flags.varkesh_freed) [0, 1].forEach((k) => this.spawnAlly('varkesh_ally', left + 90 + k * 50)); });
  }

  private tickHold(dt: number) {
    this.holdT -= dt;
    this.hud.holdTimer?.(Math.max(0, this.holdT));
    if ((this.walkT -= dt) <= 0) { this.walkT = R.Between(450, 850); this.spawnWalker(); }
    if (!this.holdHalf && this.holdT < HOLD_MS / 2) { this.holdHalf = true; this.hud.comms?.(filterLines(HOLD.half)); }
    if (this.holdT <= 0) return this.holdDone();
    if ((this.holdSpawn -= dt) > 0) return;
    const elapsed = HOLD_MS - this.holdT;
    const alive = this.enemies.filter((e) => !e.dead && e.tag === 'enc').length;
    if (alive >= 5 + Math.floor(elapsed / 20000)) { this.holdSpawn = 400; return; }
    const pool = HOLD_POOL.slice(0, 4 + Math.floor(elapsed / 10000) * 2);
    const n = 1 + Math.floor(elapsed / 25000) + (Math.random() < 0.35 ? 1 : 0);
    this.spawnWave(Array.from({ length: n }, () => R.RND.pick(pool)));
    this.holdSpawn = R.Linear(2800, 1600, elapsed / HOLD_MS);
  }

  /** A freed species walking (or drifting) home through the gate, behind the fight. Pure scenery, no physics. */
  private spawnWalker(fast = false) {
    const ids = WALKERS.filter((k) => this.textures.exists(`sp_${k}_0`));
    if (!ids.length) return;
    const k = R.RND.pick(ids), fly = FLYING_WALKERS.has(k);
    const x0 = this.bounds.right + 40, y = fly ? R.Between(120, 190) : GROUND_Y + 1;
    const img = this.add.image(x0, y, `sp_${k}_0`).setOrigin(0.5, fly ? 0.5 : 1).setDepth(DEPTH.bg + 2).setTintFill(0x80ffe0).setAlpha(0.22).setScale(0.75); // a pale far-off silhouette, never mistaken for a target
    const dur = ((x0 - this.gateX) / (fast ? 140 : R.Between(55, 80))) * 1000;
    this.tweens.add({
      targets: img, x: this.gateX, duration: dur,
      onUpdate: () => img.setTexture(`sp_${k}_${Math.floor(this.time.now / 140) % 4}`),
      onComplete: () => {
        this.fx.ring(this.gateX, img.y - (fly ? 0 : img.displayHeight / 2), 0x80ffe0, 0.8, 250);
        this.tweens.add({ targets: img, alpha: 0, scaleX: 0.05, duration: 260, onComplete: () => img.destroy() });
      },
    });
  }

  private holdDone() {
    const p = this.player;
    this.state = 'clear';
    run.flags.hold_done = true;
    this.hud.holdTimer?.(null);
    for (const e of this.enemies) if (!e.dead && !e.def.ally) { this.fx.explosion(e.x, e.cy, 22); this.removeEnemy(e); }
    for (const s of this.eShots.getChildren() as Shot[]) if (s.active) s.kill();
    this.fx.flash(0xd0fff4, 500);
    this.fx.shake(5);
    audio.sfx('clear');
    audio.intense = false;
    this.banner('THE DOOR HOLDS', 2800, '#80ffe0');
    this.addScore(20000, p.x, p.y - 80, 'THEY MADE IT HOME');
    for (let i = 0; i < 10; i++) this.time.delayedCall(i * 260, () => this.spawnWalker(true));
    this.time.delayedCall(1200, () => this.hud.comms?.(filterLines(HOLD.end)));
    this.time.delayedCall(8500, () => {
      run.stage = STAGES.length;
      save.best = Math.max(save.best, run.score);
      persist();
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(420, () => { this.scene.stop('Hud'); this.scene.start('End'); });
    });
  }

  // ================================================================= overdrive
  tryAbility() {
    const p = this.player, a = run.op.ability;
    if (p.dead || this.state !== 'play' || this.choosing || p.abilityCd > 0) return;
    p.abilityTime = a.duration;
    p.abilityCd = a.duration + a.recharge;
    if (a.heal) run.hp = Math.min(run.stats.maxHp, run.hp + a.heal);
    if (a.lift) {
      p.sliding = 0;
      p.body.setVelocityY(-a.lift * p.env.jump);
      p.refreshAirJumps();
    }
    if (a.radius) {
      for (const s of this.eShots.getChildren() as Shot[]) {
        if (s.active && R.Distance.Between(s.x, s.y, p.x, p.centerY) < a.radius) {
          this.fx.spark(s.x, s.y, a.color, 2); s.kill();
        }
      }
      // Props and friendly characters are never damaged by emergency skills.
      for (const e of [...this.enemies]) {
        if (e.dead || e.def.ally || e.def.faction === 'prop' || R.Distance.Between(e.x, e.cy, p.x, p.centerY) > a.radius) continue;
        if (a.pulseDamage) e.hurt(a.pulseDamage * run.stats.dmg, p.x);
        if (!e.dead && !e.def.boss) {
          if (a.stagger) e.chill(a.stagger);
          if (a.knockback && !e.def.heavy) e.body.setVelocityX(Math.sign(e.x - p.x || p.dir) * a.knockback);
        }
      }
    }
    this.fx.ring(p.x, p.centerY, a.color, (a.radius ?? 70) / 32, 400);
    this.fx.popup(p.x, p.y - 88, a.name, Phaser.Display.Color.IntegerToColor(a.color).rgba);
    audio.sfx(a.id);
  }

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
    for (const e of [...this.enemies]) if (!e.dead && Math.abs(e.x - p.x) < 340 && e.def.faction !== 'prop' && !e.def.ally) e.hurt(20, p.x);
  }

  // ================================================================= pickups
  dropPickup(kind: 'chip' | 'health' | 'weapon', x: number, y: number) {
    const tex = kind === 'chip' ? 'chip' : kind === 'health' ? 'health' : 'wcrate';
    const pk = this.physics.add.image(x, y, tex) as Pickup;
    pk.kind = kind; pk.age = 0;
    pk.setDepth(DEPTH.shot).setBounce(0.45).setDragX(120).setVelocity(R.Between(-110, 110), R.Between(-260, -120));
    if (kind === 'chip') pk.setTint(this.stage.accent);
    if (kind === 'weapon') {
      pk.wid = R.RND.pick(DROP_WEAPONS.filter(id => {
        const carried = run.loadout.slots.find(slot => slot?.id === id);
        return !carried || carried.ammo < Math.round(WEAPONS[id].ammo * run.stats.ammo);
      }));
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
    if (pk.taken || this.player.dead || pk.age < 150 || this.choosing ||
        (pk.kind === 'weapon' && this.state !== 'play')) return;
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
      const first = !run.loadout.slots[1] && !run.loadout.slots[2];
      const { added, replaced } = collectWeapon(run.loadout, w.id, Math.round(w.ammo * s.ammo));
      const label = added === null ? w.name : added > 0 ? `+${added} ${w.name} AMMO` : `${w.name} AMMO FULL`;
      this.fx.popup(p.x, p.y - 80, label, '#ffffff', added === null ? 16 : 8);
      if (replaced) this.fx.popup(p.x, p.y - 100, `REPLACED ${WEAPONS[replaced].name}`, '#ffe9a0');
      if (first) this.hud.hint?.('1 / 2 / 3 SELECT WEAPON   TAB / D-PAD UP CYCLE', 4000);
      this.fx.ring(p.x, p.centerY, w.color, 1.4);
      audio.sfx('weapon');
    }
  }

  // ================================================================= campaign systems
  get isLocked() { return this.locked; }

  /** Extra backdrop scroll (the train is moving even when the player is not). */
  drift(px: number) { this.bgDrift += px; }

  /** Friendly gunner (STORY: freed Varkesh). Drops in from above, fights for a while, then leaves. */
  spawnAlly(id: string, x: number) {
    if (this.state !== 'play') return;
    const e = this.spawnEnemy(id, x, GROUND_Y - 160, 'ally');
    e.awake = true;
    this.fx.ring(x, GROUND_Y - 60, 0x60d0ff, 1.6, 300);
    return e;
  }

  /** Shot fired by an ally: uses the player's projectile pool so it hits enemies. */
  allyShot(x: number, y: number, angle: number, speed: number, dmg: number, color: number) {
    const shot = this.pShots.get(x, y) as Shot | null;
    if (!shot) return;
    shot.fire('bullet', x, y, angle, speed, dmg, color, { life: 900 });
    this.fx.muzzle(x, y, color);
  }

  /**
   * A light beam from (x, y) toward (tx, ty): a flickering aim line for `warnMs`, then a short burst.
   * Hostile beams hurt the player; friendly ones (a pylon you shot, STORY stage 10) burn every enemy on the line.
   */
  beam(x: number, y: number, tx: number, ty: number, friendly: boolean, warnMs = 700, dmg = friendly ? 60 : 14) {
    const ang = Math.atan2(ty - y, tx - x), len = 420;
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    const col = friendly ? 0x60f0ff : 0xff5070;
    const g = this.add.graphics().setDepth(DEPTH.fx).setBlendMode(Phaser.BlendModes.ADD);
    let t = 0;
    const ev = this.time.addEvent({ delay: 40, loop: true, callback: () => {
      t += 40; g.clear();
      if (t < warnMs) { g.lineStyle(1, col, Math.floor(t / 80) % 2 ? 0.9 : 0.35).lineBetween(x, y, ex, ey); return; }
      g.lineStyle(7, col, 0.85).lineBetween(x, y, ex, ey); g.lineStyle(2, 0xffffff, 1).lineBetween(x, y, ex, ey);
      if (t >= warnMs + 160) { ev.remove(); g.destroy(); }
    } });
    this.time.delayedCall(warnMs, () => {
      if (this.state === 'dead') return;
      audio.sfx('rail');
      const line = new Phaser.Geom.Line(x, y, ex, ey);
      const near = (px: number, py: number, r: number) => Phaser.Geom.Intersects.LineToCircle(line, new Phaser.Geom.Circle(px, py, r));
      if (friendly) {
        for (const e of [...this.enemies]) if (!e.dead && !e.def.ally && e.def.faction !== 'prop' && near(e.x, e.cy, 16)) { e.hurt(e.def.boss ? dmg * 1.5 : dmg, x); this.fx.spark(e.x, e.cy, col, 6); }
      } else if (near(this.player.x, this.player.centerY, 12)) this.hurtPlayer(dmg, x);
    });
  }

  /** In-level choice (STORY B5): the world drops to slow motion, the HUD shows two cards and a timer. */
  slowChoice(id: string) {
    const c = CHOICES[id];
    if (!c || this.choosing || c.options.some(o => run.choices.includes(o.record))) return;
    this.choosing = true;
    this.physics.world.timeScale = 5; // Arcade: higher = slower
    this.time.timeScale = 0.2; this.tweens.timeScale = 0.2;
    this.player.body.setVelocityX(0);
    audio.sfx('warn');
    this.hud.choice?.(c, (o) => {
      applyChoice(o);
      this.choosing = false;
      this.physics.world.timeScale = 1;
      this.time.timeScale = 1; this.tweens.timeScale = 1;
      saveCampaign('Game', { hold: this.hold });
      this.hud.comms?.(filterLines(o.reply));
    });
  }

  /** Story beats tied to boss health (after the matching comm has been queued). */
  private bossMark(k: string, b: Enemy) {
    const id = b.def.id, a = b.arena;
    if (id === 'colossus' && k === 'boss50' && run.flags.varkesh_freed) this.time.delayedCall(1500, () => this.spawnAlly('varkesh_ally', a.left + 60));
    if (id !== 'archon' || k !== 'boss33') return;
    // ARCHON phase 3: everyone you saved shows up (docs/STORY.md stage 12)
    b.phase3 = true;
    if (run.flags.halcyon_saved) this.time.delayedCall(2500, () => {
      if (b.dead) return;
      b.vuln = this.time.now + 10000;
      this.banner('SHIELD DOWN - DOUBLE DAMAGE', 1600, '#80ffb0');
      this.fx.ring(b.x, b.y, 0x80ffb0, 4, 500);
    });
    if (run.flags.quill_rescued) this.time.delayedCall(5000, () => {
      if (b.dead || this.state !== 'play') return;
      this.banner('CORVANE DIVE!', 1200, '#9fd0ff');
      this.fx.flash(0xc0e0ff, 250);
      for (const s of this.eShots.getChildren() as Shot[]) if (s.active) { this.fx.spark(s.x, s.y, 0x9fd0ff, 2); s.kill(); }
      for (let i = 0; i < 6; i++) this.time.delayedCall(i * 90, () => this.fx.explosion(R.Between(a.left + 60, a.right - 60), R.Between(80, 240), 30, 0x9fd0ff));
      b.hurt(b.maxHp * 0.06, b.x);
    });
    if (run.flags.varkesh_freed) this.time.delayedCall(7500, () => { this.spawnAlly('varkesh_ally', a.left + 50); this.spawnAlly('varkesh_ally', a.right - 50); });
    if (run.flags.nest_truce) this.time.delayedCall(10000, () => {
      if (b.dead) return;
      b.stall(6000);
      this.banner('SPORES BLIND ITS TARGETING', 1400, '#c0ff80');
      for (let i = 0; i < 30; i++) this.time.delayedCall(i * 60, () => this.fx.spark(b.x + R.Between(-60, 60), b.y + R.Between(-40, 40), 0xc0ff80, 2));
    });
  }


  /** True when the player stands on a drop-through platform rather than the floor. */
  onOneWay(p: Player) { return p.y < GROUND_Y - 6; }
}
