// Playable characters. ART CONVENTION: `<art>_run0..3`, `<art>_idle`, `<art>_jump`, `<art>_slide`,
// `<art>_crouch` (same layout as the hero sheet). Operators whose sheet is not in public/assets yet
// borrow ROOK's frames with a tint, so they are playable today and upgrade when art lands.

import { ROOK_RIG, type RigDef } from './rigs';

export interface OperatorDef {
  id: string;
  name: string;
  role: string;
  blurb: string;
  art: string;
  rig?: RigDef;
  tint: number; // only used while borrowing ROOK's frames
  hp: number;
  speed: number;
  dmg: number; // multiplier
  rate: number; // fire-rate multiplier (higher = faster)
  jump: number;
  weapon: string;
}

export const OPERATORS: OperatorDef[] = [
  { id: 'rook', name: 'ROOK', role: 'ASSAULT', blurb: 'Ex-special forces. Balanced. Never misses.', art: 'hero', rig: ROOK_RIG, tint: 0xffffff, hp: 100, speed: 170, dmg: 1, rate: 1, jump: 440, weapon: 'pistol' },
  { id: 'viper', name: 'VIPER', role: 'INFILTRATOR', blurb: 'Syndicate defector. Fastest gun alive.', art: 'viper', tint: 0xff9ad0, hp: 80, speed: 200, dmg: 0.9, rate: 1.3, jump: 470, weapon: 'pistol' },
  { id: 'titan', name: 'TITAN', role: 'HEAVY', blurb: 'Walking tank. Hits like a freight train.', art: 'titan', tint: 0xffc070, hp: 140, speed: 145, dmg: 1.35, rate: 0.85, jump: 420, weapon: 'pistol' },
];
