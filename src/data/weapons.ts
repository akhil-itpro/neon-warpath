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
}

export const WEAPONS: Record<string, WeaponDef> = {
  pistol: { id: 'pistol', name: 'SIDEARM', color: 0xffe9a0, rate: 150, dmg: 10, speed: 620, pellets: 1, spread: 2, ammo: 0, tex: 'bullet', sfx: 'pistol', kick: 1 },
  smg: { id: 'smg', pickupArt: 'pickup_smg', name: 'RIPPER', color: 0x8ff6ff, rate: 62, dmg: 7, speed: 700, pellets: 1, spread: 7, ammo: 160, tex: 'bullet', sfx: 'smg', kick: 1 },
  shotgun: { id: 'shotgun', pickupArt: 'pickup_shotgun', name: 'BREACHER', color: 0xffb060, rate: 520, dmg: 9, speed: 560, pellets: 7, spread: 26, ammo: 28, tex: 'bullet', sfx: 'shotgun', kick: 4 },
  rail: { id: 'rail', pickupArt: 'pickup_rail', name: 'RAILSPIKE', color: 0xc9a0ff, rate: 480, dmg: 55, speed: 1100, pellets: 1, spread: 0, ammo: 22, pierce: true, tex: 'beam', sfx: 'rail', kick: 3 },
  rocket: { id: 'rocket', pickupArt: 'pickup_rocket', name: 'HELLFIRE', color: 0xff7040, rate: 640, dmg: 60, speed: 380, pellets: 1, spread: 0, ammo: 14, explosive: 56, tex: 'rocket', sfx: 'rocket', kick: 4 },
};

export const DROP_WEAPONS = ['smg', 'shotgun', 'rail', 'rocket'];
