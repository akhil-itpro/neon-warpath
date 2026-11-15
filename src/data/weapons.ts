// Weapons are pure data. Add a new entry here and it can drop from crates immediately.

export interface WeaponDef {
  id: string;
  name: string;
  color: number;
  rate: number; // ms between shots
  dmg: number;
  speed: number;
  pellets: number;
  spread: number; // degrees, total cone for pellets / random jitter for single shots
  ammo: number; // 0 = infinite
  pierce?: boolean;
  explosive?: number; // blast radius
  tex: string;
  pickupArt?: string;
  sfx: string;
  kick: number; // screen shake + recoil strength
  // --- optional special behaviour (implemented in Game.ts / Shot.ts) ---
  life?: number; // ms the projectile lives
  scale?: number;
  gravity?: boolean; // arcs and falls
  chain?: number; // lightning jumps to this many nearby enemies
  chill?: number; // ms the target is frozen
  pull?: boolean; // explosion drags enemies inward first
  rehit?: number; // piercing shot damages the same enemy again every N ms (saw blades)
}

export const WEAPONS: Record<string, WeaponDef> = {
  pistol: { id: 'pistol', name: 'SIDEARM', color: 0xffe9a0, rate: 150, dmg: 10, speed: 620, pellets: 1, spread: 2, ammo: 0, tex: 'bullet', sfx: 'pistol', kick: 1 },
  smg: { id: 'smg', pickupArt: 'pickup_smg', name: 'RIPPER', color: 0x8ff6ff, rate: 62, dmg: 7, speed: 700, pellets: 1, spread: 7, ammo: 160, tex: 'bullet', sfx: 'smg', kick: 1 },
  shotgun: { id: 'shotgun', pickupArt: 'pickup_shotgun', name: 'BREACHER', color: 0xffb060, rate: 520, dmg: 9, speed: 560, pellets: 7, spread: 26, ammo: 28, tex: 'bullet', sfx: 'shotgun', kick: 4 },
  rail: { id: 'rail', pickupArt: 'pickup_rail', name: 'RAILSPIKE', color: 0xc9a0ff, rate: 480, dmg: 55, speed: 1100, pellets: 1, spread: 0, ammo: 22, pierce: true, tex: 'beam', sfx: 'rail', kick: 3 },
  rocket: { id: 'rocket', pickupArt: 'pickup_rocket', name: 'HELLFIRE', color: 0xff7040, rate: 640, dmg: 60, speed: 380, pellets: 1, spread: 0, ammo: 14, explosive: 56, tex: 'rocket', sfx: 'rocket', kick: 4 },
  // --- expansion arsenal ---
  arc: { id: 'arc', pickupArt: 'pickup_arc', name: 'ARC CASTER', color: 0x60c8ff, rate: 190, dmg: 13, speed: 760, pellets: 1, spread: 3, ammo: 70, chain: 2, tex: 'beam', sfx: 'smg', kick: 1 },
  cryo: { id: 'cryo', pickupArt: 'pickup_cryo', name: 'CRYO JET', color: 0xa0f0ff, rate: 55, dmg: 4, speed: 430, pellets: 1, spread: 12, ammo: 220, chill: 420, life: 400, scale: 0.8, tex: 'ebullet', sfx: 'smg', kick: 0 },
  scrap: { id: 'scrap', pickupArt: 'pickup_scrap', name: 'SCRAPSTORM', color: 0xffc060, rate: 720, dmg: 11, speed: 600, pellets: 11, spread: 40, ammo: 20, tex: 'bullet', sfx: 'shotgun', kick: 6 },
  sun: { id: 'sun', pickupArt: 'pickup_sun', name: 'SUNLANCE', color: 0xffe890, rate: 105, dmg: 12, speed: 1000, pellets: 1, spread: 0, ammo: 110, pierce: true, tex: 'beam', sfx: 'pistol', kick: 1 },
  saw: { id: 'saw', pickupArt: 'pickup_saw', name: 'BUZZKILL', color: 0xffb050, rate: 560, dmg: 30, speed: 175, pellets: 1, spread: 0, ammo: 18, pierce: true, rehit: 100, life: 2600, tex: 'saw', sfx: 'shotgun', kick: 3 },
  spore: { id: 'spore', pickupArt: 'pickup_spore', name: 'SPORE SPRAYER', color: 0x9cf060, rate: 260, dmg: 24, speed: 430, pellets: 1, spread: 6, ammo: 40, gravity: true, explosive: 32, life: 2000, tex: 'ebullet', sfx: 'pistol', kick: 2 },
  grav: { id: 'grav', pickupArt: 'pickup_grav', name: 'SINGULARITY', color: 0xc070ff, rate: 900, dmg: 85, speed: 300, pellets: 1, spread: 0, ammo: 8, explosive: 80, pull: true, scale: 1.6, life: 1600, tex: 'ebullet', sfx: 'rocket', kick: 5 },
  tesla: { id: 'tesla', pickupArt: 'pickup_tesla', name: 'TESLA BOLT', color: 0xff6080, rate: 420, dmg: 38, speed: 900, pellets: 1, spread: 0, ammo: 26, pierce: true, chain: 3, tex: 'beam', sfx: 'rail', kick: 3 },
};

export const DROP_WEAPONS = ['smg', 'shotgun', 'rail', 'rocket', 'arc', 'cryo', 'scrap', 'sun', 'saw', 'spore', 'grav', 'tesla'];
