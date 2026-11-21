// Enemy roster. Behaviour lives in src/entities/Enemy.ts keyed by `ai`; everything else is data.
//
// ART CONVENTION: `art` is the preferred texture key. If public/assets has `<art>_0.png, <art>_1.png…`
// they are used as a walk/fly cycle; else `<art>.png`; else the `fallback` (an existing sprite, tinted).
// So factions without final art are already playable, and upgrade automatically when the PNGs arrive.

export type AiKind =
  | 'gunner' | 'rusher' | 'flyer' | 'diver' | 'blinker' | 'lobber' | 'spitter' | 'turret' | 'jet'
  | 'crate' | 'barrel' | 'egg' | 'pylon' | 'spawner'
  | 'boss_heli' | 'boss_warden' | 'boss_core' | 'boss_stomper' | 'boss_seer' | 'boss_duel';

export type Faction = 'machine' | 'syndicate' | 'undead' | 'alien' | 'demon' | 'mutant' | 'prop';

export interface EnemyDef {
  id: string;
  name: string;
  faction: Faction;
  ai: AiKind;
  hp: number;
  score: number;
  speed: number;
  contact: number; // damage on touch (0 = harmless to touch)
  art: string;
  artScale?: number; // animation scale; preserve the existing collision size when replacing stand-ins
  fallback: { frames: string[]; tint?: number; scale?: number };
  body: [number, number]; // hitbox w,h in unscaled sprite pixels
  flying?: boolean;
  heavy?: boolean; // ignores knockback
  boss?: boolean;
  burst?: number;
  range?: number;
  fireRate?: number; // ms between attacks
  shotSpeed?: number;
  gore: number; // particle colour when hit
  // --- optional traits (all behaviour for them lives in Enemy.ts / Game.ts) ---
  muzzle?: [number, number]; // gunner gun tip: px forward, px above the feet
  windup?: number; // ms of warning light before an attack (default depends on the AI)
  shotColor?: number;
  shield?: number; // damage multiplier for hits from the front (slide past and shoot the back)
  radial?: number; // flyer: fires a ring of this many shots / stomper boss: fires fans instead of lobs
  adds?: string; // enemy id this one hatches or summons
  drops?: 'health' | 'weapon'; // guaranteed drop when destroyed
  states?: boolean; // boss art has <art>_idle/_windup/_attack/_exposed; exposed takes extra damage, attacking takes less
  collar?: boolean; // ARCHON control collar ring drawn in code (species under its control, docs/STORY.md)
  ally?: boolean; // fights for the player: shoots enemies, ignores the player's shots, never blocks an arena
  splits?: string; // spawns two of this enemy id when killed
  facesRight?: boolean; // source art faces right (operator-style frames) instead of the enemy convention
  life?: number; // ms before an ally leaves
}

const ROBOT = ['robot_walk', 'robot_aim'];

export const ENEMIES: Record<string, EnemyDef> = {
  // --- MACHINE LEGION (final art in place) ---
  trooper: { id: 'trooper', name: 'Legion Trooper', faction: 'machine', ai: 'gunner', hp: 34, score: 100, speed: 62, contact: 0, art: 'trooper', fallback: { frames: ROBOT }, body: [22, 60], burst: 1, range: 210, fireRate: 1700, shotSpeed: 200, gore: 0xffb040 },
  elite: { id: 'elite', name: 'Legion Enforcer', faction: 'machine', ai: 'gunner', hp: 95, score: 300, speed: 50, contact: 0, art: 'elite', fallback: { frames: ROBOT, tint: 0xff8a8a, scale: 1.18 }, body: [24, 62], heavy: true, burst: 3, range: 250, fireRate: 2100, shotSpeed: 230, gore: 0xff6040 },
  drone: { id: 'drone', name: 'Seeker Drone', faction: 'machine', ai: 'flyer', hp: 22, score: 120, speed: 120, contact: 0, art: 'drone', fallback: { frames: ['drone'] }, body: [44, 24], flying: true, fireRate: 1900, shotSpeed: 180, gore: 0xffb040 },
  kamikaze: { id: 'kamikaze', name: 'Burner Drone', faction: 'machine', ai: 'diver', hp: 14, score: 150, speed: 150, contact: 18, art: 'kamikaze', fallback: { frames: ['drone'], tint: 0xffb060, scale: 0.8 }, body: [40, 22], flying: true, gore: 0xffd060 },
  turret: { id: 'turret', name: 'Sentry Cannon', faction: 'machine', ai: 'turret', hp: 85, score: 250, speed: 0, contact: 0, art: 'turret', fallback: { frames: ['turret'] }, body: [40, 56], heavy: true, burst: 5, range: 380, fireRate: 2500, shotSpeed: 240, gore: 0xffb040 },
  jet: { id: 'jet', name: 'Razor Jet', faction: 'machine', ai: 'jet', hp: 45, score: 400, speed: 330, contact: 0, art: 'jet', fallback: { frames: ['jet'] }, body: [80, 26], flying: true, heavy: true, gore: 0xffb040 },

  // --- SYNDICATE (gangsters) — art pending, uses tinted stand-ins ---
  gangster: { id: 'gangster', name: 'Syndicate Gunman', faction: 'syndicate', ai: 'gunner', hp: 24, score: 90, speed: 88, contact: 0, art: 'gangster', fallback: { frames: ROBOT, tint: 0xd9c08a, scale: 0.92 }, body: [20, 58], burst: 2, range: 180, fireRate: 1500, shotSpeed: 210, gore: 0xc03030 },

  // --- UNDEAD (zombies) ---
  zombie: { id: 'zombie', name: 'Furnace Ghoul', faction: 'undead', ai: 'rusher', hp: 28, score: 80, speed: 78, contact: 12, art: 'zombie', artScale: 0.95, fallback: { frames: ROBOT, tint: 0x8cd96a, scale: 0.95 }, body: [20, 58], gore: 0x70c040 },
  brute: { id: 'brute', name: 'Ghoul Brute', faction: 'undead', ai: 'rusher', hp: 130, score: 350, speed: 52, contact: 20, art: 'brute', artScale: 1.35, fallback: { frames: ROBOT, tint: 0x5fae58, scale: 1.35 }, body: [24, 62], heavy: true, gore: 0x70c040 },

  // --- ALIENS ---
  alien: { id: 'alien', name: 'Void Stalker', faction: 'alien', ai: 'blinker', hp: 40, score: 220, speed: 90, contact: 0, art: 'alien', artScale: 0.95, fallback: { frames: ['drone'], tint: 0xb48cff, scale: 0.95 }, body: [40, 24], flying: true, fireRate: 2300, shotSpeed: 190, gore: 0xb070ff },

  // --- UNDERWORLD (demons) ---
  demon: { id: 'demon', name: 'Ash Imp', faction: 'demon', ai: 'lobber', hp: 48, score: 240, speed: 70, contact: 14, art: 'demon', artScale: 1.2, fallback: { frames: ['drone'], tint: 0xff5a4a, scale: 1.2 }, body: [42, 24], flying: true, fireRate: 2000, shotSpeed: 0, gore: 0xff5030 },

  // --- PROPS ---
  crate: { id: 'crate', name: 'Supply Crate', faction: 'prop', ai: 'crate', hp: 16, score: 0, speed: 0, contact: 0, art: 'crate', fallback: { frames: ['crate'] }, body: [20, 20], heavy: true, gore: 0xd0a060 },

  // --- EXPANSION ROSTER (single-pose art from art/library/expansion; they waddle/hover procedurally) ---
  // machines
  bastion: { id: 'bastion', name: 'Riot Bastion', faction: 'machine', ai: 'gunner', hp: 120, score: 320, speed: 40, contact: 0, art: 'riot_bastion', fallback: { frames: ROBOT, tint: 0x8090ff }, body: [30, 60], heavy: true, shield: 0.2, burst: 2, range: 170, fireRate: 2200, shotSpeed: 220, muzzle: [30, 40], gore: 0x9fd0ff },
  sniper: { id: 'sniper', name: 'Coil Sniper', faction: 'machine', ai: 'gunner', hp: 30, score: 260, speed: 55, contact: 0, art: 'coil_sniper', fallback: { frames: ROBOT, tint: 0xfff0d0 }, body: [20, 58], burst: 1, range: 300, fireRate: 2900, shotSpeed: 430, windup: 750, shotColor: 0x60d0ff, muzzle: [34, 43], gore: 0x60d0ff },
  hound: { artScale: 1, id: 'hound', name: 'Welder Hound', faction: 'machine', ai: 'rusher', hp: 36, score: 140, speed: 125, contact: 14, art: 'welder_hound', fallback: { frames: ROBOT, tint: 0xffa040, scale: 0.7 }, body: [50, 34], gore: 0xffb040 },
  sawcrab: { artScale: 1, id: 'sawcrab', name: 'Saw Crab', faction: 'machine', ai: 'rusher', hp: 90, score: 260, speed: 60, contact: 18, art: 'saw_crab', fallback: { frames: ROBOT, tint: 0xc06050, scale: 0.8 }, body: [46, 36], heavy: true, gore: 0xffb040 },
  bell: { id: 'bell', name: 'Bell Drone', faction: 'machine', ai: 'flyer', hp: 34, score: 200, speed: 80, contact: 0, art: 'bell_drone', fallback: { frames: ['drone'], tint: 0xffd070 }, body: [26, 36], flying: true, radial: 8, fireRate: 2600, shotSpeed: 130, windup: 520, shotColor: 0xffc040, gore: 0xffc040 },
  mantis: { id: 'mantis', name: 'Scrap Mantis', faction: 'machine', ai: 'rusher', hp: 55, score: 240, speed: 105, contact: 18, art: 'scrap_mantis', fallback: { frames: ROBOT, tint: 0xb0e060 }, body: [34, 50], gore: 0xb0e060 },
  // mutants
  sporeback: { id: 'sporeback', name: 'Sporeback', faction: 'mutant', ai: 'spitter', hp: 60, score: 220, speed: 50, contact: 12, art: 'sporeback', fallback: { frames: ROBOT, tint: 0x90c050 }, body: [30, 56], burst: 1, range: 190, fireRate: 2300, shotColor: 0xffa030, gore: 0x90d040 },
  bellower: { id: 'bellower', name: 'Acid Bellower', faction: 'mutant', ai: 'spitter', hp: 110, score: 340, speed: 34, contact: 14, art: 'acid_bellower', fallback: { frames: ROBOT, tint: 0xc070d0 }, body: [38, 48], heavy: true, burst: 3, range: 230, fireRate: 3000, shotColor: 0xc0ff30, gore: 0xc0ff30 },
  spiderling: { artScale: 1, id: 'spiderling', name: 'Glass Spiderling', faction: 'mutant', ai: 'rusher', hp: 20, score: 110, speed: 135, contact: 10, art: 'glass_widow', fallback: { frames: ROBOT, tint: 0x80a0ff, scale: 0.6 }, body: [44, 32], gore: 0x80c0ff },
  knight: { artScale: 1, id: 'knight', name: 'Cinder Knight', faction: 'demon', ai: 'rusher', hp: 150, score: 420, speed: 64, contact: 22, art: 'cinder_knight', fallback: { frames: ROBOT, tint: 0xff7040, scale: 1.1 }, body: [26, 62], heavy: true, drops: 'weapon', gore: 0xff6020 },
  deepjaw: { id: 'deepjaw', name: 'Deepjaw', faction: 'mutant', ai: 'rusher', hp: 62, score: 230, speed: 96, contact: 16, art: 'deepjaw', fallback: { frames: ROBOT, tint: 0x70a0c0 }, body: [30, 56], gore: 0x60c0e0 },
  moth: { id: 'moth', name: 'Lantern Moth', faction: 'mutant', ai: 'lobber', hp: 38, score: 230, speed: 80, contact: 0, art: 'lantern_moth', fallback: { frames: ['drone'], tint: 0x60ffc0 }, body: [40, 30], flying: true, fireRate: 2300, shotSpeed: 0, gore: 0xffd040 },
  jelly: { id: 'jelly', name: 'Umbrella Jelly', faction: 'mutant', ai: 'flyer', hp: 30, score: 180, speed: 70, contact: 12, art: 'umbrella_jelly', fallback: { frames: ['drone'], tint: 0x8080ff }, body: [34, 40], flying: true, fireRate: 2200, shotSpeed: 160, windup: 420, shotColor: 0x60a0ff, gore: 0x8060ff },
  // oddities
  vendotron: { id: 'vendotron', name: 'Vendotron', faction: 'machine', ai: 'spitter', hp: 100, score: 300, speed: 42, contact: 14, art: 'vendotron', fallback: { frames: ROBOT, tint: 0x70d0e0 }, body: [36, 60], heavy: true, burst: 2, range: 210, fireRate: 2600, shotColor: 0xff60c0, drops: 'health', gore: 0x70d0e0 },
  totem: { id: 'totem', name: 'Traffic Totem', faction: 'machine', ai: 'gunner', hp: 48, score: 190, speed: 58, contact: 0, art: 'traffic_totem', fallback: { frames: ROBOT, tint: 0xffe060 }, body: [28, 60], burst: 3, range: 220, fireRate: 2300, shotSpeed: 200, windup: 450, shotColor: 0x60ff60, muzzle: [8, 50], gore: 0xffc040 },
  slug: { artScale: 1, id: 'slug', name: 'Disco Slug', faction: 'mutant', ai: 'spitter', hp: 140, score: 360, speed: 24, contact: 16, art: 'disco_slug', fallback: { frames: ROBOT, tint: 0x60e090, scale: 0.8 }, body: [50, 38], heavy: true, burst: 4, range: 260, fireRate: 3400, shotColor: 0xff70e0, gore: 0x60e090 },

  // --- EXPANSION PROPS ---
  locker: { id: 'locker', name: 'Ammo Locker', faction: 'prop', ai: 'crate', hp: 26, score: 0, speed: 0, contact: 0, art: 'ammo_locker', fallback: { frames: ['crate'], tint: 0xffd040 }, body: [26, 42], heavy: true, drops: 'weapon', gore: 0xf0c040 },
  medstation: { id: 'medstation', name: 'Med Station', faction: 'prop', ai: 'crate', hp: 26, score: 0, speed: 0, contact: 0, art: 'med_station', fallback: { frames: ['crate'], tint: 0x80ffa0 }, body: [30, 36], heavy: true, drops: 'health', gore: 0x80ffa0 },
  barrel: { id: 'barrel', name: 'Toxic Barrel', faction: 'prop', ai: 'barrel', hp: 12, score: 0, speed: 0, contact: 0, art: 'toxic_barrel', fallback: { frames: ['crate'], tint: 0xa0ff40 }, body: [22, 32], heavy: true, gore: 0xa0ff40 },
  egg: { id: 'egg', name: 'Brood Egg', faction: 'alien', ai: 'egg', hp: 30, score: 150, speed: 0, contact: 0, art: 'alien_egg', fallback: { frames: ['crate'], tint: 0xc060ff }, body: [30, 36], heavy: true, adds: 'spiderling', gore: 0xc060ff },
  seaegg: { id: 'seaegg', name: 'Brood Egg', faction: 'alien', ai: 'egg', hp: 30, score: 150, speed: 0, contact: 0, art: 'alien_egg', fallback: { frames: ['crate'], tint: 0xc060ff }, body: [30, 36], heavy: true, adds: 'deepjaw', gore: 0xc060ff },

  // --- CAMPAIGN STAGES 3/5/8/10/11 (Frontier + species libraries; see tools/integrate_campaign.py) ---
  marauder: { id: 'marauder', name: 'Rail Marauder', faction: 'syndicate', ai: 'gunner', hp: 38, score: 160, speed: 72, contact: 0, art: 'rail_marauder', artScale: 1, fallback: { frames: ROBOT, tint: 0xd9a060 }, body: [22, 56], burst: 2, range: 195, fireRate: 2100, shotSpeed: 205, windup: 600, shotColor: 0xffc050, muzzle: [30, 44], gore: 0xffa050 },
  kite: { id: 'kite', name: 'Storm Kite', faction: 'machine', ai: 'flyer', hp: 26, score: 150, speed: 85, contact: 0, art: 'storm_kite', artScale: 1, fallback: { frames: ['drone'], tint: 0xffe070 }, body: [38, 20], flying: true, fireRate: 2300, shotSpeed: 170, windup: 650, shotColor: 0xffdb70, gore: 0xffc060 },
  acolyte: { id: 'acolyte', name: 'Bellows Acolyte', faction: 'demon', ai: 'spitter', hp: 68, score: 240, speed: 40, contact: 10, art: 'bellows_acolyte', artScale: 1, fallback: { frames: ROBOT, tint: 0xff8040 }, body: [32, 48], burst: 1, range: 180, fireRate: 2600, windup: 750, shotColor: 0xff9b40, gore: 0xff8a40 },
  skate: { id: 'skate', name: 'Cinder Skate', faction: 'demon', ai: 'lobber', hp: 32, score: 190, speed: 70, contact: 0, art: 'cinder_skate', artScale: 1, fallback: { frames: ['drone'], tint: 0xff9050 }, body: [38, 18], flying: true, fireRate: 2600, shotSpeed: 0, gore: 0xff8a40 },
  varkesh: { id: 'varkesh', name: 'Varkesh Skirmisher', faction: 'alien', ai: 'gunner', hp: 40, score: 150, speed: 80, contact: 0, art: 'sp_varkesh', artScale: 1, fallback: { frames: ROBOT, tint: 0x70c686 }, body: [22, 60], burst: 2, range: 190, fireRate: 2100, shotSpeed: 200, windup: 650, muzzle: [36, 53], shotColor: 0xffc060, collar: true, gore: 0x70c686 },
  varkesh_ally: { id: 'varkesh_ally', name: 'Varkesh Ally', faction: 'alien', ai: 'gunner', hp: 9999, score: 0, speed: 90, contact: 0, art: 'sp_varkesh', artScale: 1, fallback: { frames: ROBOT, tint: 0x70c686 }, body: [22, 60], burst: 3, range: 260, fireRate: 900, shotSpeed: 420, windup: 120, muzzle: [36, 53], shotColor: 0x60d0ff, ally: true, heavy: true, life: 26000, gore: 0x70c686 },
  corvane: { id: 'corvane', name: 'Corvane Outrider', faction: 'alien', ai: 'gunner', hp: 28, score: 160, speed: 95, contact: 0, art: 'sp_corvane', artScale: 1, fallback: { frames: ROBOT, tint: 0x96b9db }, body: [22, 58], burst: 1, range: 250, fireRate: 2300, shotSpeed: 250, windup: 800, muzzle: [30, 46], shotColor: 0xd4ebff, collar: true, gore: 0x96b9db },
  kharrix: { id: 'kharrix', name: 'Kharrix Tunnel Hunter', faction: 'alien', ai: 'rusher', hp: 34, score: 130, speed: 105, contact: 12, art: 'sp_kharrix', artScale: 1, fallback: { frames: ROBOT, tint: 0xffba60, scale: 0.7 }, body: [64, 30], collar: true, gore: 0xffba60 },
  ferrivor: { id: 'ferrivor', name: 'Ferrivor Rustgrazer', faction: 'mutant', ai: 'rusher', hp: 90, score: 220, speed: 38, contact: 12, art: 'sp_ferrivor', artScale: 1, fallback: { frames: ROBOT, tint: 0xd48569, scale: 0.7 }, body: [94, 25], heavy: true, collar: true, gore: 0xd48569 },
  nacreth: { id: 'nacreth', name: 'Nacreth Reef Drifter', faction: 'alien', ai: 'lobber', hp: 46, score: 210, speed: 60, contact: 0, art: 'sp_nacreth', artScale: 1, fallback: { frames: ['drone'], tint: 0x75d3db }, body: [44, 42], flying: true, fireRate: 2700, shotSpeed: 0, collar: true, gore: 0x75d3db },
  cirrid: { id: 'cirrid', name: 'Cirrid Ion Colony', faction: 'alien', ai: 'flyer', hp: 25, score: 170, speed: 55, contact: 0, art: 'sp_cirrid', artScale: 1, fallback: { frames: ['drone'], tint: 0xd3aeff }, body: [42, 36], flying: true, radial: 6, fireRate: 2900, shotSpeed: 120, windup: 750, shotColor: 0xd3aeff, collar: true, gore: 0xc4a7ff },
  myrrhkin: { id: 'myrrhkin', name: 'Myrrhkin Capwalker', faction: 'mutant', ai: 'spitter', hp: 65, score: 210, speed: 30, contact: 0, art: 'sp_myrrhkin', artScale: 1, fallback: { frames: ROBOT, tint: 0xd7b9ee }, body: [46, 42], burst: 2, range: 190, fireRate: 2900, windup: 750, shotColor: 0xffb25c, collar: true, gore: 0xd7b9ee },
  thren: { id: 'thren', name: 'Thren Seedrunner', faction: 'mutant', ai: 'spitter', hp: 32, score: 140, speed: 65, contact: 0, art: 'sp_thren', artScale: 1, fallback: { frames: ROBOT, tint: 0x91c76c }, body: [54, 40], burst: 1, range: 180, fireRate: 2400, windup: 650, shotColor: 0xb6e680, collar: true, gore: 0x91c76c },
  vitreon: { id: 'vitreon', name: 'Vitreon Resonator', faction: 'alien', ai: 'gunner', hp: 50, score: 230, speed: 28, contact: 0, art: 'sp_vitreon', artScale: 1, fallback: { frames: ROBOT, tint: 0x9fc7ff }, body: [26, 64], burst: 1, range: 280, fireRate: 2700, shotSpeed: 270, windup: 900, muzzle: [10, 55], shotColor: 0xffc970, collar: true, gore: 0x9fc7ff },
  lithurn: { id: 'lithurn', name: 'Lithurn Slagback', faction: 'mutant', ai: 'rusher', hp: 120, score: 280, speed: 30, contact: 16, art: 'sp_lithurn', artScale: 1, fallback: { frames: ROBOT, tint: 0x8fb2be }, body: [76, 42], heavy: true, shield: 0.25, collar: true, gore: 0x8fb2be },
  geliform: { id: 'geliform', name: 'Geliform Wastegrazer', faction: 'mutant', ai: 'spitter', hp: 40, score: 130, speed: 35, contact: 10, art: 'sp_geliform', artScale: 1, fallback: { frames: ROBOT, tint: 0x6ce4eb }, body: [64, 30], burst: 1, range: 140, fireRate: 2500, windup: 650, shotColor: 0x72dbed, collar: true, splits: 'gelling', gore: 0x6ce4eb },
  gelling: { id: 'gelling', name: 'Geliform Bud', faction: 'mutant', ai: 'rusher', hp: 14, score: 60, speed: 90, contact: 8, art: 'sp_geliform', artScale: 0.5, fallback: { frames: ROBOT, tint: 0x6ce4eb, scale: 0.5 }, body: [64, 30], gore: 0x6ce4eb },
  asterid: { id: 'asterid', name: 'Asterid Hullwatcher', faction: 'alien', ai: 'flyer', hp: 38, score: 230, speed: 45, contact: 0, art: 'sp_asterid', artScale: 1, fallback: { frames: ['drone'], tint: 0xbb8bef }, body: [38, 38], flying: true, radial: 6, fireRate: 3200, shotSpeed: 110, windup: 950, shotColor: 0xffc789, collar: true, gore: 0xbb8bef },
  // stage gimmick objects
  slot: { id: 'slot', name: 'Gunman Slot Machine', faction: 'machine', ai: 'spawner', hp: 110, score: 400, speed: 0, contact: 0, art: 'slot_machine', fallback: { frames: ['street_terminal'], tint: 0xff70d0, scale: 1.3 }, body: [30, 56], heavy: true, adds: 'gangster', fireRate: 4200, gore: 0xff70d0 },
  pylon: { id: 'pylon', name: 'Prism Pylon', faction: 'prop', ai: 'pylon', hp: 1, score: 0, speed: 0, contact: 0, art: 'prism_pylon', fallback: { frames: ['rift_anchor'], tint: 0x80f0ff }, body: [24, 56], heavy: true, fireRate: 3600, gore: 0x80f0ff },
  cage: { id: 'cage', name: 'Corvane Cage', faction: 'prop', ai: 'crate', hp: 40, score: 0, speed: 0, contact: 0, art: 'quill_cage', fallback: { frames: ['ammo_locker'], tint: 0x80c0ff, scale: 1.2 }, body: [30, 50], heavy: true, gore: 0x80c0ff },
  // campaign bosses
  colossus: { id: 'colossus', name: 'SWITCHYARD COLOSSUS', faction: 'machine', ai: 'boss_stomper', hp: 1700, score: 7000, speed: 50, contact: 20, art: 'switchyard_colossus', artScale: 1, fallback: { frames: ['turret'], tint: 0x70a0c0, scale: 2.2 }, body: [150, 80], heavy: true, boss: true, states: true, adds: 'marauder', shotColor: 0xffc050, gore: 0xffa050 },
  matriarch: { id: 'matriarch', name: 'KILN MATRIARCH', faction: 'demon', ai: 'boss_seer', hp: 1700, score: 9000, speed: 120, contact: 20, art: 'kiln_matriarch', artScale: 1, fallback: { frames: ['core'], tint: 0xff8040 }, body: [90, 80], flying: true, heavy: true, boss: true, states: true, adds: 'skate', shotColor: 0xff8a30, gore: 0xff8a40 },
  sovereign: { id: 'sovereign', name: 'NACRETH TIDE SOVEREIGN', faction: 'alien', ai: 'boss_seer', hp: 2200, score: 12000, speed: 90, contact: 20, art: 'nacreth_sovereign', artScale: 1, fallback: { frames: ['core'], tint: 0x75d3db }, body: [110, 90], flying: true, heavy: true, boss: true, states: true, adds: 'nacreth', shotColor: 0x70e0f0, gore: 0x75d3db },
  regent: { id: 'regent', name: 'VITREON PRISM REGENT', faction: 'alien', ai: 'boss_stomper', hp: 2400, score: 14000, speed: 58, contact: 20, art: 'vitreon_regent', artScale: 1, fallback: { frames: ['turret'], tint: 0x9fc7ff, scale: 2.2 }, body: [75, 120], heavy: true, boss: true, states: true, radial: 7, adds: 'asterid', shotColor: 0x90e8ff, gore: 0x9fc7ff },
  halcyon: { id: 'halcyon', name: 'HALCYON', faction: 'machine', ai: 'boss_duel', hp: 2400, score: 15000, speed: 175, contact: 12, art: 'halcyon', artScale: 1, fallback: { frames: ['hero_idle'], tint: 0xffe0a0 }, body: [18, 56], heavy: true, boss: true, facesRight: true, shotColor: 0xffe070, gore: 0xffd060 },

  // --- BOSSES ---
  tyrant: { artScale: 1, id: 'tyrant', name: 'THE TEACUP TYRANT', faction: 'machine', ai: 'boss_stomper', hp: 1300, score: 6000, speed: 46, contact: 15, art: 'boss_tyrant', fallback: { frames: ['turret'], tint: 0xffe0a0, scale: 2 }, body: [84, 92], heavy: true, boss: true, states: true, adds: 'slug', shotColor: 0xff70c0, gore: 0xffd060 },
  widow: { artScale: 1, id: 'widow', name: 'GLASS WIDOW', faction: 'mutant', ai: 'boss_stomper', hp: 2200, score: 9000, speed: 62, contact: 20, art: 'boss_widow', fallback: { frames: ['turret'], tint: 0x80a0ff, scale: 2 }, body: [96, 72], heavy: true, boss: true, states: true, radial: 5, adds: 'spiderling', shotColor: 0x80d0ff, gore: 0x80c0ff },
  queen: { id: 'queen', name: 'THE DROWNED QUEEN', faction: 'mutant', ai: 'boss_seer', hp: 1700, score: 11000, speed: 110, contact: 20, art: 'boss_jelly', fallback: { frames: ['core'], tint: 0x8080ff }, body: [78, 92], flying: true, heavy: true, boss: true, states: true, adds: 'jelly', shotColor: 0x60b0ff, gore: 0x8060ff },
  oracle: { id: 'oracle', name: 'STATIC ORACLE', faction: 'machine', ai: 'boss_seer', hp: 2000, score: 13000, speed: 135, contact: 20, art: 'boss_oracle', fallback: { frames: ['core'], tint: 0x60ff80 }, body: [62, 92], flying: true, heavy: true, boss: true, states: true, adds: 'bell', shotColor: 0x60ff80, gore: 0x60ff80 },
  vulture: { id: 'vulture', name: 'VULTURE GUNSHIP', faction: 'machine', ai: 'boss_heli', hp: 900, score: 5000, speed: 110, contact: 20, art: 'vulture', fallback: { frames: ['heli'] }, body: [120, 40], flying: true, heavy: true, boss: true, states: true, gore: 0xffb040 },
  warden: { id: 'warden', name: 'FURNACE WARDEN', faction: 'machine', ai: 'boss_warden', hp: 1250, score: 8000, speed: 0, contact: 20, art: 'warden', fallback: { frames: ['turret'], scale: 2.3 }, body: [42, 58], heavy: true, boss: true, states: true, gore: 0xffb040 },
  archon: { id: 'archon', name: 'ARCHON CORE', faction: 'machine', ai: 'boss_core', hp: 1600, score: 15000, speed: 0, contact: 20, art: 'archon', fallback: { frames: ['core'] }, body: [70, 70], flying: true, heavy: true, boss: true, states: true, gore: 0xff4040 },
};
