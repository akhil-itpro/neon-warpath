// Stage layouts. A stage is a long horizontal strip with:
//   - platforms: one-way girders [x, y, widthInTiles(32px)]
//   - hazards:   damaging floor strips [x, width]
//   - roamers:   enemies placed in the world [enemyId, x] that wake when the player gets close
//   - encounters: when the player crosses `x` the camera locks and `waves` spawn one after another
//   - boss:      final locked arena at the right end of the stage
// Enemy ids come from src/data/enemies.ts.
import type { TrackDef } from '../systems/Audio';

export interface Encounter { x: number; waves: string[][] }

export interface StageDef {
  id: string;
  name: string;
  tagline: string;
  bg: string;
  bgTint: number;
  accent: number; // UI / light colour for the stage
  weather: 'rain' | 'embers' | 'data';
  width: number;
  platforms: [number, number, number][];
  hazards: [number, number][];
  roamers: [string, number][];
  encounters: Encounter[];
  boss: string;
  bossIntro: string;
  music: TrackDef;
}

const N = null;

export const STAGES: StageDef[] = [
  {
    id: 'city', name: 'NEON MIDNIGHT', tagline: 'The Syndicate sold the city to the machines.',
    bg: 'bg_city', bgTint: 0x9aa4c8, accent: 0x40e0ff, weather: 'rain', width: 5200,
    platforms: [[420, 250, 4], [700, 200, 3], [1280, 250, 5], [1600, 190, 3], [2350, 250, 4], [2600, 200, 4], [3500, 250, 5], [3760, 190, 3], [4680, 240, 3], [4960, 240, 3]],
    hazards: [],
    roamers: [['gangster', 520], ['crate', 640], ['gangster', 760], ['trooper', 1350], ['drone', 1500], ['gangster', 1650], ['crate', 1700], ['trooper', 2450], ['gangster', 2550], ['drone', 2700], ['turret', 3560], ['gangster', 3650], ['crate', 3800], ['trooper', 3900]],
    encounters: [
      { x: 1000, waves: [['gangster', 'gangster', 'gangster'], ['trooper', 'gangster', 'drone', 'drone']] },
      { x: 2050, waves: [['trooper', 'trooper', 'drone'], ['gangster', 'gangster', 'gangster', 'kamikaze', 'kamikaze'], ['elite', 'drone']] },
      { x: 3150, waves: [['drone', 'drone', 'drone', 'gangster'], ['elite', 'trooper', 'trooper', 'jet']] },
    ],
    boss: 'vulture', bossIntro: 'SYNDICATE AIR SUPPORT INBOUND',
    music: { bpm: 128, root: 40, bass: [0, 0, 12, 0, 0, 0, 10, 0, 0, 0, 12, 0, 3, 3, 5, 7], lead: [12, N, 15, N, 19, N, 15, 12, N, 10, N, 12, N, 15, N, N], prog: [0, 0, -4, -2] },
  },
  {
    id: 'furnace', name: 'FURNACE DISTRICT', tagline: 'The dead still work the night shift.',
    bg: 'bg_furnace', bgTint: 0xa89a9a, accent: 0xff8a30, weather: 'embers', width: 5600,
    platforms: [[380, 250, 3], [900, 245, 3], [1040, 185, 3], [1750, 250, 6], [2500, 245, 3], [2680, 185, 3], [2860, 245, 3], [3700, 250, 6], [4300, 245, 3], [5060, 240, 3], [5360, 240, 3]],
    hazards: [[860, 300], [2480, 480], [4260, 180]],
    roamers: [['zombie', 450], ['zombie', 520], ['crate', 600], ['zombie', 700], ['demon', 1000], ['turret', 1300], ['zombie', 1500], ['zombie', 1560], ['crate', 1800], ['kamikaze', 1900], ['brute', 2300], ['demon', 2700], ['turret', 3150], ['zombie', 3550], ['zombie', 3600], ['zombie', 3650], ['crate', 3760], ['demon', 4350]],
    encounters: [
      { x: 1500, waves: [['zombie', 'zombie', 'zombie', 'zombie'], ['zombie', 'zombie', 'demon', 'kamikaze'], ['brute', 'zombie', 'zombie']] },
      { x: 3350, waves: [['turret', 'zombie', 'zombie', 'zombie'], ['demon', 'demon', 'zombie', 'zombie', 'zombie'], ['brute', 'brute', 'kamikaze', 'kamikaze']] },
      { x: 4600, waves: [['zombie', 'zombie', 'zombie', 'zombie', 'zombie', 'zombie'], ['elite', 'demon', 'demon']] },
    ],
    boss: 'warden', bossIntro: 'THE FOUNDRY DEFENDS ITSELF',
    music: { bpm: 140, root: 38, bass: [0, 0, 0, 12, 0, 0, 3, 0, 0, 0, 0, 12, 0, 7, 6, 3], lead: [12, 15, N, 12, 18, N, 15, N, 12, 15, N, 12, 19, N, 18, N], prog: [0, 0, 3, -2] },
  },
  {
    id: 'cathedral', name: 'SERVER CATHEDRAL', tagline: 'It called them from the void. End it.',
    bg: 'bg_cathedral', bgTint: 0x9a9ab0, accent: 0xff4060, weather: 'data', width: 6000,
    platforms: [[400, 250, 4], [640, 190, 3], [1200, 250, 3], [1400, 190, 3], [1600, 250, 3], [2400, 245, 5], [3300, 250, 3], [3480, 190, 4], [3700, 250, 3], [4500, 245, 5], [5400, 235, 3], [5600, 170, 3], [5800, 235, 3]],
    hazards: [[1180, 460], [3280, 460]],
    roamers: [['alien', 500], ['trooper', 620], ['crate', 700], ['elite', 900], ['alien', 1300], ['alien', 1500], ['turret', 1900], ['demon', 2100], ['crate', 2450], ['elite', 2600], ['alien', 2800], ['turret', 3100], ['alien', 3500], ['demon', 3600], ['crate', 4520], ['elite', 4300], ['brute', 4700]],
    encounters: [
      { x: 1000, waves: [['alien', 'alien', 'trooper', 'trooper'], ['elite', 'alien', 'kamikaze', 'kamikaze']] },
      { x: 2300, waves: [['alien', 'alien', 'alien'], ['turret', 'elite', 'demon', 'jet'], ['brute', 'alien', 'alien', 'zombie', 'zombie']] },
      { x: 4000, waves: [['elite', 'elite', 'drone', 'drone'], ['demon', 'demon', 'alien', 'alien', 'jet'], ['brute', 'elite', 'kamikaze', 'kamikaze', 'kamikaze']] },
    ],
    boss: 'archon', bossIntro: 'ARCHON IS AWAKE',
    music: { bpm: 150, root: 37, bass: [0, 12, 0, 12, 0, 12, 1, 13, 0, 12, 0, 12, 5, 17, 3, 15], lead: [12, N, 13, N, 12, N, 17, 15, N, 13, N, 12, N, 8, 10, N], prog: [0, 0, 1, -2] },
  },
];
