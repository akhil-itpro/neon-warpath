// Enemy roster. Behaviour lives in src/entities/Enemy.ts keyed by `ai`; everything else is data.
//
// ART CONVENTION: `art` is the preferred texture key. If public/assets has `<art>_0.png, <art>_1.png…`
// they are used as a walk/fly cycle; else `<art>.png`; else the `fallback` (an existing sprite, tinted).
// So factions without final art are already playable, and upgrade automatically when the PNGs arrive.

export type AiKind =
  | 'gunner' | 'rusher' | 'flyer' | 'diver' | 'blinker' | 'lobber' | 'turret' | 'jet' | 'crate'
  | 'boss_heli' | 'boss_warden' | 'boss_core';

export type Faction = 'machine' | 'syndicate' | 'undead' | 'alien' | 'demon' | 'prop';

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
  zombie: { id: 'zombie', name: 'Furnace Ghoul', faction: 'undead', ai: 'rusher', hp: 28, score: 80, speed: 78, contact: 12, art: 'zombie', fallback: { frames: ROBOT, tint: 0x8cd96a, scale: 0.95 }, body: [20, 58], gore: 0x70c040 },
  brute: { id: 'brute', name: 'Ghoul Brute', faction: 'undead', ai: 'rusher', hp: 130, score: 350, speed: 52, contact: 20, art: 'brute', fallback: { frames: ROBOT, tint: 0x5fae58, scale: 1.35 }, body: [24, 62], heavy: true, gore: 0x70c040 },

  // --- ALIENS ---
  alien: { id: 'alien', name: 'Void Stalker', faction: 'alien', ai: 'blinker', hp: 40, score: 220, speed: 90, contact: 0, art: 'alien', fallback: { frames: ['drone'], tint: 0xb48cff, scale: 0.95 }, body: [40, 24], flying: true, fireRate: 2300, shotSpeed: 190, gore: 0xb070ff },

  // --- UNDERWORLD (demons) ---
  demon: { id: 'demon', name: 'Ash Imp', faction: 'demon', ai: 'lobber', hp: 48, score: 240, speed: 70, contact: 14, art: 'demon', fallback: { frames: ['drone'], tint: 0xff5a4a, scale: 1.2 }, body: [42, 24], flying: true, fireRate: 2000, shotSpeed: 0, gore: 0xff5030 },

  // --- PROPS ---
  crate: { id: 'crate', name: 'Supply Crate', faction: 'prop', ai: 'crate', hp: 16, score: 0, speed: 0, contact: 0, art: 'crate', fallback: { frames: ['crate'] }, body: [20, 20], heavy: true, gore: 0xd0a060 },

  // --- BOSSES ---
  vulture: { id: 'vulture', name: 'VULTURE GUNSHIP', faction: 'machine', ai: 'boss_heli', hp: 900, score: 5000, speed: 110, contact: 20, art: 'vulture', fallback: { frames: ['heli'] }, body: [120, 40], flying: true, heavy: true, boss: true, gore: 0xffb040 },
  warden: { id: 'warden', name: 'FURNACE WARDEN', faction: 'machine', ai: 'boss_warden', hp: 1250, score: 8000, speed: 0, contact: 20, art: 'warden', fallback: { frames: ['turret'], scale: 2.3 }, body: [42, 58], heavy: true, boss: true, gore: 0xffb040 },
  archon: { id: 'archon', name: 'ARCHON CORE', faction: 'machine', ai: 'boss_core', hp: 1600, score: 15000, speed: 0, contact: 20, art: 'archon', fallback: { frames: ['core'] }, body: [70, 70], flying: true, heavy: true, boss: true, gore: 0xff4040 },
};
