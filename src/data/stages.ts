// Stage layouts. A stage is a long horizontal strip with:
//   - platforms: one-way girders [x, y, widthInTiles(32px)]
//   - hazards:   damaging floor strips [x, width]
//   - roamers:   enemies placed in the world [enemyId, x, y?] that wake when the player gets close
//                (a given y pins the enemy in the air, e.g. a cage on a high girder)
//   - encounters: when the player crosses `x` the camera locks and `waves` spawn one after another
//   - boss:      final locked arena at the right end of the stage
//   - shards:    data-shard collectibles [loreId, x, y] (lore text in src/data/story.ts)
//   - variants:  story consequences; when `if` matches run.flags, extra waves / roamers / allies are added
//   - gimmick fields (one or two per stage so no two stages play the same; code in src/systems/Gimmicks.ts):
//       movers [x, y, tiles, dx, dy, ms]   platforms that swing back and forth by (dx, dy) every ms
//       blinkers [x, y, tiles, group]      data platforms; group 0 and group 1 take turns existing
//       floods                             water / lava that rises and falls in a range (water = slow + air meter)
//       gravity                            player gravity multiplier (low gravity < 1)
//       flips { every, dur }               gravity reverses for `dur` ms every `every` ms (siren first)
//       dark                               light radius around the player in pixels
//       crushers [x, period, offset]       pistons that slam to the floor on a rhythm
//       roulette [x0, x1]                  floor sections in the range light up, then burn
//       train { x0, every }                from x0 the floor is a moving train; low gantries sweep in (crouch / slide)
//       chase { x0, speed }                the floor behind the player is deleted at `speed` px/s
//       choiceAt { x, id }                 in-level slow-motion choice (story.ts CHOICES[id])
// Enemy ids come from src/data/enemies.ts.
import type { TrackDef } from '../systems/Audio';
import type { Cond } from './story';

export interface Encounter { x: number; waves: string[][] }
export interface Flood { x0: number; x1: number; kind: 'water' | 'lava'; top: number; period: number; offset?: number }

export interface StageDef {
  id: string;
  name: string;
  tagline: string;
  bg: string;
  bgTint: number;
  accent: number; // UI / light colour for the stage
  weather: 'rain' | 'embers' | 'data' | 'spores' | 'bubbles' | 'petals' | 'glints';
  hazard?: 'lava' | 'volt' | 'acid'; // floor hazard look (default: volt in 'data' weather, else lava)
  decor?: [string, number][]; // scenery sprites standing on the floor [textureKey, x]
  width: number;
  platforms: [number, number, number][];
  hazards: [number, number][];
  roamers: ([string, number] | [string, number, number])[];
  encounters: Encounter[];
  boss: string;
  bossIntro: string;
  shards?: [string, number, number][];
  variants?: { if: Cond; waves?: [number, string[]][]; roamers?: [string, number][]; allies?: [number, string[]][] }[];
  movers?: [number, number, number, number, number, number][];
  blinkers?: [number, number, number, number][];
  floods?: Flood[];
  gravity?: number;
  flips?: { every: number; dur: number };
  dark?: number;
  crushers?: [number, number, number][];
  roulette?: [number, number][];
  train?: { x0: number; every: number };
  chase?: { x0: number; speed: number };
  choiceAt?: { x: number; id: string };
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
    shards: [['city-1', 590, 240], ['city-2', 1360, 222], ['city-3', 3808, 165]],
    movers: [[2000, 220, 3, 160, 0, 3200], [2950, 200, 3, 0, 70, 2600], [4300, 215, 3, 140, 0, 2800]],
    music: { bpm: 128, root: 40, bass: [0, 0, 12, 0, 0, 0, 10, 0, 0, 0, 12, 0, 3, 3, 5, 7], lead: [12, N, 15, N, 19, N, 15, 12, N, 10, N, 12, N, 15, N, N], prog: [0, 0, -4, -2] },
  },
  {
    id: 'casino', name: 'NEON CASINO', tagline: 'The house always wins. Burn the house down.',
    bg: 'bg_casino', bgTint: 0x9a94c0, accent: 0xff50c8, weather: 'rain', width: 5400,
    platforms: [[460, 250, 4], [760, 195, 3], [1500, 250, 5], [1760, 190, 3], [2600, 250, 4], [2840, 195, 4], [3700, 250, 5], [4000, 190, 3], [4860, 240, 3], [5160, 240, 3]],
    hazards: [],
    decor: [['street_terminal', 300], ['scrap_barricade', 900], ['street_terminal', 1400], ['scrap_barricade', 2250], ['street_terminal', 2950], ['scrap_barricade', 3600], ['street_terminal', 4450]],
    roamers: [['totem', 520], ['gangster', 640], ['crate', 720], ['slot', 900], ['barrel', 1180], ['gangster', 1250], ['totem', 1560], ['locker', 1700], ['bell', 1850], ['slug', 2500], ['gangster', 2600], ['barrel', 2700], ['totem', 2780], ['slot', 3550], ['medstation', 3760], ['bastion', 3900], ['gangster', 4000]],
    encounters: [
      { x: 1050, waves: [['totem', 'totem', 'gangster'], ['vendotron', 'gangster', 'gangster', 'drone']] },
      { x: 2150, waves: [['gangster', 'gangster', 'totem', 'bell'], ['slug', 'totem', 'kamikaze', 'kamikaze'], ['bastion', 'gangster', 'gangster']] },
      { x: 3250, waves: [['vendotron', 'totem', 'totem', 'bell'], ['bastion', 'slug', 'drone', 'drone'], ['elite', 'vendotron', 'jet']] },
    ],
    boss: 'tyrant', bossIntro: 'THE HOUSE SENDS ITS CHAMPION',
    shards: [['casino-1', 1300, 240], ['casino-2', 1580, 222], ['casino-3', 1808, 165]],
    roulette: [[560, 980], [1240, 2100], [2700, 3200], [3820, 4600]],
    music: { bpm: 124, root: 43, bass: [0, 12, 0, 12, 3, 15, 0, 12, 5, 17, 0, 12, 7, 19, 10, 22], lead: [12, N, 12, 15, N, 12, 19, N, 17, N, 15, 12, N, 10, 12, N], prog: [0, 0, 5, 3] },
  },
  {
    id: 'railyard', name: 'STORMBREAK RAILYARD', tagline: 'Living cargo. Heavy security. One train.',
    bg: 'bg_railyard', bgTint: 0x9aa4c8, accent: 0xffb040, weather: 'rain', width: 5600,
    platforms: [[380, 250, 3], [640, 200, 3], [1300, 250, 4], [1560, 195, 3], [2100, 250, 3], [2300, 195, 3], [2500, 250, 3], [3300, 245, 4], [3600, 200, 3], [4300, 245, 4]],
    hazards: [],
    decor: [['rail_signal', 300], ['cargo_drone_wreck', 900], ['storm_battery', 1750], ['rail_signal', 2650], ['salvage_cache', 2800]],
    roamers: [['marauder', 520], ['crate', 600], ['kite', 760], ['marauder', 900], ['varkesh', 1400], ['kite', 1600], ['ferrivor', 1850], ['locker', 2000], ['marauder', 2250], ['varkesh', 2600], ['crate', 3200], ['kite', 3450], ['marauder', 3700], ['varkesh', 3800], ['medstation', 4400], ['kite', 4500]],
    encounters: [
      { x: 1100, waves: [['marauder', 'marauder', 'kite'], ['varkesh', 'varkesh', 'marauder']] },
      { x: 2350, waves: [['ferrivor', 'kite', 'kite'], ['varkesh', 'varkesh', 'varkesh', 'drone'], ['elite', 'marauder', 'marauder']] },
      { x: 3950, waves: [['kite', 'kite', 'marauder', 'marauder'], ['varkesh', 'varkesh', 'ferrivor', 'jet']] },
    ],
    boss: 'colossus', bossIntro: 'SOMETHING HUGE IS ON THE TRACK',
    shards: [['railyard-1', 688, 175], ['railyard-2', 1608, 170], ['railyard-3', 3648, 175]],
    variants: [{ if: { ledger: 'leak' }, waves: [[0, ['gangster', 'gangster', 'gangster']], [2, ['gangster', 'gangster', 'elite']]] }],
    train: { x0: 2900, every: 2900 },
    choiceAt: { x: 4820, id: 'freight' },
    music: { bpm: 136, root: 41, bass: [0, 0, 12, 0, 0, 12, 0, 10, 0, 0, 12, 0, 7, 7, 5, 3], lead: [12, N, 15, 17, N, 15, 12, N, 19, N, 17, 15, N, 12, 10, N], prog: [0, 0, -2, 3] },
  },
  {
    id: 'furnace', name: 'FURNACE DISTRICT', tagline: 'The dead still work the night shift.',
    bg: 'bg_furnace', bgTint: 0xa89a9a, accent: 0xff8a30, weather: 'embers', width: 5600,
    platforms: [[380, 250, 3], [900, 245, 3], [1040, 185, 3], [1750, 250, 6], [2500, 245, 3], [2680, 185, 3], [2860, 245, 3], [3700, 250, 4], [3880, 205, 3], [4050, 165, 3], [4220, 210, 3], [4400, 245, 3], [5060, 240, 3], [5360, 240, 3]],
    hazards: [[860, 300], [2480, 480], [4260, 180]],
    roamers: [['zombie', 450], ['zombie', 520], ['crate', 600], ['zombie', 700], ['demon', 1000], ['turret', 1300], ['zombie', 1500], ['zombie', 1560], ['crate', 1800], ['kamikaze', 1900], ['brute', 2300], ['demon', 2700], ['turret', 3150], ['zombie', 3550], ['zombie', 3600], ['zombie', 3650], ['crate', 3760], ['demon', 4350]],
    encounters: [
      { x: 1500, waves: [['zombie', 'zombie', 'zombie', 'zombie'], ['zombie', 'zombie', 'demon', 'kamikaze'], ['brute', 'zombie', 'zombie']] },
      { x: 3350, waves: [['turret', 'zombie', 'zombie', 'zombie'], ['demon', 'demon', 'zombie', 'zombie', 'zombie'], ['brute', 'brute', 'kamikaze', 'kamikaze']] },
      { x: 4600, waves: [['zombie', 'zombie', 'zombie', 'zombie', 'zombie', 'zombie'], ['elite', 'demon', 'demon']] },
    ],
    boss: 'warden', bossIntro: 'THE FOUNDRY DEFENDS ITSELF',
    shards: [['furnace-1', 948, 218], ['furnace-2', 1088, 160], ['furnace-3', 2728, 160]],
    variants: [{ if: { ledger: 'leak' }, waves: [[0, ['gangster', 'gangster', 'gangster', 'elite']]], roamers: [['gangster', 2200], ['gangster', 2260]] }],
    floods: [{ x0: 3680, x1: 4380, kind: 'lava', top: 262, period: 15000 }],
    music: { bpm: 140, root: 38, bass: [0, 0, 0, 12, 0, 0, 3, 0, 0, 0, 0, 12, 0, 7, 6, 3], lead: [12, 15, N, 12, 18, N, 15, N, 12, 15, N, 12, 19, N, 18, N], prog: [0, 0, 3, -2] },
  },
  {
    id: 'engine', name: 'THE UNDERWORLD ENGINE', tagline: 'It tears holes into other worlds. Shut it down.',
    bg: 'bg_engine', bgTint: 0xa89a9a, accent: 0xff6a30, weather: 'embers', hazard: 'lava', width: 5700,
    platforms: [[400, 250, 3], [640, 195, 3], [1250, 250, 4], [1500, 190, 3], [2150, 250, 3], [2360, 195, 3], [2560, 250, 3], [3300, 250, 4], [3560, 195, 3], [4250, 250, 3], [4500, 195, 3], [5160, 240, 3], [5460, 240, 3]],
    hazards: [[1800, 220], [3900, 220]],
    decor: [['furnace_shrine', 320], ['pressure_vent', 1100], ['coolant_pump', 2000], ['pressure_vent', 3100], ['furnace_shrine', 4100]],
    roamers: [['acolyte', 520], ['crate', 600], ['skate', 760], ['kharrix', 950], ['demon', 1350], ['acolyte', 1600], ['locker', 1700], ['lithurn', 2250], ['skate', 2450], ['kharrix', 2800], ['crate', 3250], ['acolyte', 3500], ['demon', 3700], ['medstation', 4300], ['lithurn', 4500]],
    encounters: [
      { x: 1050, waves: [['acolyte', 'kharrix', 'kharrix'], ['skate', 'skate', 'demon']] },
      { x: 2650, waves: [['kharrix', 'kharrix', 'kharrix', 'skate'], ['lithurn', 'acolyte', 'demon'], ['brute', 'kharrix', 'kharrix', 'kamikaze']] },
      { x: 4700, waves: [['acolyte', 'acolyte', 'skate', 'skate'], ['lithurn', 'lithurn', 'demon', 'jet']] },
    ],
    boss: 'matriarch', bossIntro: 'THE ENGINE KEEPER WAKES',
    shards: [['engine-1', 688, 170], ['engine-2', 1548, 165], ['engine-3', 3608, 170]],
    variants: [
      { if: { varkesh_freed: true }, allies: [[1, ['varkesh_ally', 'varkesh_ally']], [2, ['varkesh_ally', 'varkesh_ally']]] },
      { if: { varkesh_freed: false }, waves: [[1, ['varkesh', 'varkesh', 'varkesh']], [2, ['varkesh', 'varkesh', 'varkesh', 'varkesh']]] },
    ],
    crushers: [[880, 2400, 0], [2080, 2000, 400], [3000, 2200, 0], [3150, 2200, 1100], [4200, 2000, 600]],
    flips: { every: 20000, dur: 3000 },
    music: { bpm: 132, root: 36, bass: [0, 0, 0, 12, 0, 0, 1, 0, 0, 0, 0, 12, 0, 6, 5, 1], lead: [12, N, 13, N, 12, 18, N, 15, 12, N, 13, N, 19, N, 18, 13], prog: [0, 1, -2, 0] },
  },
  {
    id: 'fungal', name: 'FUNGAL DEPTHS', tagline: 'Something grew down here. It is hungry.',
    bg: 'bg_fungal', bgTint: 0xa0b0b8, accent: 0x40ffc0, weather: 'spores', hazard: 'acid', width: 5600,
    platforms: [[400, 250, 3], [940, 245, 3], [1090, 185, 3], [1800, 250, 6], [2560, 245, 3], [2740, 185, 3], [2920, 245, 3], [3760, 250, 6], [4380, 245, 3], [5060, 240, 3], [5360, 240, 3]],
    hazards: [[900, 320], [2540, 500], [4340, 200]],
    decor: [['rift_anchor', 320], ['rift_anchor', 2200], ['rift_anchor', 4100]],
    roamers: [['spiderling', 460], ['spiderling', 520], ['egg', 640], ['sporeback', 760], ['crate', 820], ['moth', 1100], ['egg', 1320], ['egg', 1380], ['barrel', 1450], ['bellower', 1560], ['spiderling', 1900], ['locker', 2000], ['zombie', 2100], ['zombie', 2160], ['sporeback', 2300], ['moth', 2750], ['bellower', 3200], ['egg', 3560], ['barrel', 3620], ['egg', 3680], ['medstation', 3800], ['sporeback', 3950], ['moth', 4400]],
    encounters: [
      { x: 1600, waves: [['spiderling', 'spiderling', 'spiderling', 'spiderling'], ['sporeback', 'sporeback', 'moth'], ['bellower', 'spiderling', 'spiderling', 'zombie', 'zombie']] },
      { x: 3400, waves: [['sporeback', 'spiderling', 'spiderling', 'moth'], ['bellower', 'bellower', 'kamikaze', 'kamikaze'], ['brute', 'sporeback', 'spiderling', 'spiderling', 'spiderling']] },
      { x: 4620, waves: [['moth', 'moth', 'spiderling', 'spiderling', 'spiderling', 'spiderling'], ['bellower', 'sporeback', 'sporeback', 'moth']] },
    ],
    boss: 'widow', bossIntro: 'THE NEST IS AWAKE',
    shards: [['fungal-1', 988, 218], ['fungal-2', 1138, 160], ['fungal-3', 2788, 160]],
    dark: 118,
    music: { bpm: 112, root: 36, bass: [0, N, 0, 3, N, 0, 7, N, 0, N, 0, 3, N, 6, 5, 3], lead: [N, 12, N, 15, 13, N, 12, N, N, 18, N, 15, 13, N, 12, N], prog: [0, 1, 0, -2] },
  },
  {
    id: 'abyss', name: 'ABYSS STATION', tagline: 'Six miles down. The hull is not the only thing leaking.',
    bg: 'bg_abyss', bgTint: 0xa0acc8, accent: 0x40a0ff, weather: 'bubbles', hazard: 'volt', width: 5800,
    platforms: [[420, 250, 4], [680, 190, 3], [1260, 250, 3], [1460, 190, 3], [1660, 250, 3], [2460, 245, 5], [3360, 250, 3], [3540, 190, 4], [3760, 250, 3], [4560, 245, 5], [5260, 240, 3], [5560, 240, 3]],
    hazards: [[1240, 480], [3340, 480]],
    decor: [['power_cell', 260], ['power_cell', 1000], ['street_terminal', 2100], ['power_cell', 2900], ['street_terminal', 4200], ['power_cell', 4900]],
    roamers: [['deepjaw', 500], ['jelly', 650], ['crate', 740], ['hound', 900], ['hound', 960], ['seaegg', 1100], ['jelly', 1350], ['jelly', 1560], ['turret', 1950], ['deepjaw', 2100], ['locker', 2480], ['sawcrab', 2650], ['seaegg', 2800], ['bell', 2950], ['turret', 3150], ['jelly', 3500], ['deepjaw', 3900], ['deepjaw', 3960], ['medstation', 4100], ['sawcrab', 4300], ['barrel', 4380], ['hound', 4700]],
    encounters: [
      { x: 1040, waves: [['deepjaw', 'deepjaw', 'jelly', 'jelly'], ['sawcrab', 'hound', 'hound', 'bell']] },
      { x: 2360, waves: [['hound', 'hound', 'hound', 'jelly'], ['turret', 'deepjaw', 'deepjaw', 'bell'], ['sawcrab', 'sawcrab', 'jelly', 'jelly', 'kamikaze']] },
      { x: 4060, waves: [['deepjaw', 'deepjaw', 'deepjaw', 'bell', 'bell'], ['bastion', 'hound', 'hound', 'jelly', 'jelly'], ['sawcrab', 'deepjaw', 'deepjaw', 'jet']] },
    ],
    boss: 'queen', bossIntro: 'PRESSURE ALARM - SOMETHING IS INSIDE',
    shards: [['abyss-1', 1000, 240], ['abyss-2', 1508, 165], ['abyss-3', 3604, 165]],
    floods: [{ x0: 2300, x1: 3240, kind: 'water', top: 232, period: 16000 }, { x0: 4400, x1: 5000, kind: 'water', top: 232, period: 16000, offset: 6000 }],
    music: { bpm: 118, root: 35, bass: [0, 0, N, 0, 0, N, 7, 0, 0, 0, N, 0, 8, N, 7, 5], lead: [12, N, N, 19, N, 15, N, 14, 12, N, N, 20, N, 19, 15, N], prog: [0, -4, -2, 0] },
  },
  {
    id: 'tidal', name: 'THE TIDAL VAULT', tagline: 'A throne room under the sea. The tide obeys its queen.',
    bg: 'bg_tidal', bgTint: 0xa0b4c8, accent: 0x40e0d0, weather: 'bubbles', hazard: 'volt', width: 5700,
    platforms: [[380, 240, 4], [620, 190, 3], [1000, 235, 3], [1250, 190, 4], [1600, 235, 3], [2200, 235, 4], [2460, 185, 3], [2760, 235, 3], [3300, 235, 4], [3560, 185, 3], [3860, 235, 3], [4400, 235, 4], [4680, 185, 3], [5160, 240, 3], [5460, 240, 3]],
    hazards: [],
    decor: [['power_cell', 260], ['rift_anchor', 1500], ['power_cell', 3000], ['rift_anchor', 4200]],
    roamers: [['nacreth', 520], ['geliform', 700], ['crate', 800], ['cirrid', 1100], ['jelly', 1350], ['geliform', 1700], ['locker', 2250], ['nacreth', 2500], ['deepjaw', 2700], ['cirrid', 3000], ['geliform', 3400], ['medstation', 3600], ['jelly', 3900], ['nacreth', 4500], ['deepjaw', 4700]],
    encounters: [
      { x: 1050, waves: [['geliform', 'geliform', 'nacreth'], ['cirrid', 'cirrid', 'deepjaw', 'deepjaw']] },
      { x: 2350, waves: [['nacreth', 'nacreth', 'jelly', 'jelly'], ['geliform', 'geliform', 'cirrid', 'bell'], ['sawcrab', 'deepjaw', 'deepjaw', 'nacreth']] },
      { x: 4050, waves: [['cirrid', 'cirrid', 'cirrid', 'geliform'], ['bastion', 'nacreth', 'nacreth', 'jelly'], ['sawcrab', 'geliform', 'geliform', 'jet']] },
    ],
    boss: 'sovereign', bossIntro: 'THE TIDE HAS A QUEEN',
    shards: [['tidal-1', 668, 165], ['tidal-2', 2508, 160], ['tidal-3', 4728, 160]],
    floods: [{ x0: -800, x1: 6500, kind: 'water', top: 250, period: 12000 }],
    music: { bpm: 108, root: 38, bass: [0, N, 0, 7, N, 0, 10, N, 0, N, 0, 7, N, 5, 3, N], lead: [12, N, N, 15, N, 19, N, 17, 15, N, N, 12, N, 14, 15, N], prog: [0, -4, -2, -5] },
  },
  {
    id: 'orbital', name: 'ORBITAL GARDEN', tagline: 'The machines are growing something up here.',
    bg: 'bg_orbital', bgTint: 0xa8a4c0, accent: 0xff6080, weather: 'petals', hazard: 'volt', width: 5900,
    platforms: [[420, 250, 4], [660, 190, 3], [1220, 250, 3], [1420, 190, 3], [1620, 250, 3], [2420, 245, 5], [2700, 185, 3], [3320, 250, 3], [3500, 190, 4], [3720, 250, 3], [4520, 245, 5], [5360, 240, 3], [5660, 240, 3]],
    hazards: [[1200, 460], [3300, 460]],
    decor: [['rift_anchor', 300], ['power_cell', 1050], ['rift_anchor', 2150], ['power_cell', 3000], ['rift_anchor', 4250], ['power_cell', 5000]],
    roamers: [['mantis', 500], ['thren', 640], ['sniper', 700], ['crate', 760], ['moth', 950], ['mantis', 1100], ['sniper', 1480], ['bell', 1650], ['knight', 1950], ['locker', 2440], ['cage', 2748, 160], ['sniper', 2860], ['cirrid', 3300], ['mantis', 2850], ['mantis', 2900], ['turret', 3120], ['alien', 3500], ['bastion', 3900], ['medstation', 4050], ['knight', 4350], ['sniper', 4700], ['moth', 4800]],
    encounters: [
      { x: 1020, waves: [['mantis', 'mantis', 'sniper', 'moth'], ['elite', 'mantis', 'bell', 'bell']] },
      { x: 2320, waves: [['sniper', 'sniper', 'mantis', 'mantis'], ['knight', 'moth', 'moth', 'alien'], ['bastion', 'mantis', 'mantis', 'kamikaze', 'kamikaze']] },
      { x: 4060, waves: [['mantis', 'mantis', 'mantis', 'bell', 'alien'], ['knight', 'sniper', 'sniper', 'moth', 'jet'], ['knight', 'bastion', 'elite', 'kamikaze', 'kamikaze']] },
    ],
    boss: 'oracle', bossIntro: 'THE ORACLE HAS SEEN YOUR DEATH',
    shards: [['orbital-1', 980, 240], ['orbital-2', 1468, 165], ['orbital-3', 3564, 165]],
    gravity: 0.62,
    music: { bpm: 144, root: 39, bass: [0, 0, 12, 0, 7, 0, 12, 0, 0, 0, 12, 0, 8, 8, 7, 5], lead: [19, N, 15, N, 12, 15, N, 19, 20, N, 19, N, 15, 12, N, 14], prog: [0, -4, 3, -2] },
  },
  {
    id: 'prism', name: 'PRISM WASTES', tagline: 'The world on the other side. It used to be green.',
    bg: 'bg_prism', bgTint: 0xb0a8c8, accent: 0x90e8ff, weather: 'glints', hazard: 'volt', width: 5800,
    platforms: [[420, 250, 4], [680, 190, 3], [1300, 250, 3], [1500, 190, 3], [1700, 250, 3], [2450, 245, 5], [2720, 185, 3], [3400, 250, 3], [3600, 190, 4], [3820, 250, 3], [4560, 245, 5], [5260, 240, 3], [5560, 240, 3]],
    hazards: [[1280, 440], [3380, 460]],
    decor: [['rift_anchor', 300], ['rift_anchor', 2200], ['rift_anchor', 4300]],
    roamers: [['vitreon', 560], ['pylon', 760], ['crate', 820], ['asterid', 1000], ['lithurn', 1150], ['pylon', 1900], ['vitreon', 2100], ['locker', 2470], ['asterid', 2800], ['pylon', 3050], ['vitreon', 3200], ['medstation', 3650], ['lithurn', 3900], ['pylon', 4400], ['asterid', 4700], ['pylon', 5300], ['pylon', 5560]],
    encounters: [
      { x: 1050, waves: [['vitreon', 'vitreon', 'asterid'], ['lithurn', 'vitreon', 'asterid']] },
      { x: 2350, waves: [['asterid', 'asterid', 'vitreon', 'vitreon'], ['lithurn', 'lithurn', 'asterid'], ['knight', 'vitreon', 'vitreon', 'kamikaze']] },
      { x: 4100, waves: [['vitreon', 'vitreon', 'vitreon', 'asterid'], ['lithurn', 'asterid', 'asterid', 'jet'], ['knight', 'lithurn', 'vitreon', 'vitreon']] },
    ],
    boss: 'regent', bossIntro: 'THE LIGHT HAS A RULER',
    shards: [['prism-1', 728, 165], ['prism-2', 1548, 165], ['prism-3', 3664, 165]],
    variants: [
      { if: { varkesh_freed: false }, waves: [[1, ['varkesh', 'varkesh', 'varkesh']]] },
      { if: { sovereign_spared: false }, waves: [[2, ['nacreth', 'nacreth', 'nacreth']]] },
    ],
    music: { bpm: 126, root: 40, bass: [0, 7, 12, 7, 0, 7, 12, 7, 3, 10, 15, 10, 5, 12, 17, 12], lead: [19, N, 24, N, 22, N, 19, 17, N, 15, N, 17, 19, N, 12, N], prog: [0, 3, 5, -2] },
  },
  {
    id: 'spire', name: 'THE LATTICE SPIRE', tagline: 'The floor deletes itself. Keep moving.',
    bg: 'bg_spire', bgTint: 0xa8a4c8, accent: 0xa0a0ff, weather: 'data', hazard: 'volt', width: 5600,
    platforms: [[420, 250, 3], [660, 195, 3], [1700, 250, 4], [2500, 245, 4], [3500, 250, 4], [4300, 245, 4], [5060, 240, 3], [5360, 240, 3]],
    hazards: [],
    roamers: [['elite', 560], ['crate', 700], ['asterid', 900], ['sniper', 1300], ['elite', 1800], ['locker', 2000], ['asterid', 2300], ['sniper', 2900], ['elite', 3300], ['medstation', 3600], ['asterid', 3900], ['elite', 4500]],
    encounters: [
      { x: 1100, waves: [['elite', 'trooper', 'trooper'], ['asterid', 'asterid', 'sniper']] },
      { x: 2700, waves: [['elite', 'elite', 'drone', 'drone'], ['sniper', 'sniper', 'asterid', 'asterid'], ['bastion', 'elite', 'kamikaze', 'kamikaze']] },
      { x: 4100, waves: [['elite', 'elite', 'asterid', 'asterid'], ['bastion', 'sniper', 'sniper', 'jet'], ['elite', 'elite', 'elite', 'kamikaze', 'kamikaze']] },
    ],
    boss: 'halcyon', bossIntro: 'LIFE SIGN AT THE TOP',
    shards: [['spire-1', 708, 170], ['spire-2', 2050, 115], ['spire-3', 3850, 115]],
    variants: [{ if: { quill_rescued: false }, waves: [[0, ['corvane', 'corvane']], [1, ['corvane', 'corvane', 'corvane']], [2, ['corvane', 'corvane', 'corvane']]], roamers: [['corvane', 1500], ['corvane', 3100]] }],
    movers: [[1000, 220, 3, 0, 60, 2600], [2200, 200, 3, 120, 0, 3000], [3100, 210, 3, 0, 70, 2400], [3950, 200, 3, 130, 0, 2800]],
    blinkers: [[1280, 225, 3, 0], [1450, 185, 3, 1], [1950, 180, 3, 0], [2050, 140, 2, 1], [2900, 200, 3, 1], [3700, 175, 3, 0], [3820, 140, 2, 1], [4700, 210, 3, 0]],
    chase: { x0: 700, speed: 58 },
    music: { bpm: 146, root: 37, bass: [0, 12, 0, 12, 7, 19, 0, 12, 0, 12, 0, 12, 8, 20, 7, 19], lead: [12, 15, 19, N, 24, N, 22, 19, 15, N, 12, N, 14, 15, N, N], prog: [0, -4, -2, 1] },
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
    shards: [['cathedral-1', 980, 240], ['cathedral-2', 1448, 165], ['cathedral-3', 3544, 165]],
    blinkers: [[1270, 203, 3, 0], [1460, 140, 3, 1], [1540, 205, 3, 0], [3360, 203, 3, 1], [3530, 140, 4, 0], [3640, 205, 3, 1]],
    music: { bpm: 150, root: 37, bass: [0, 12, 0, 12, 0, 12, 1, 13, 0, 12, 0, 12, 5, 17, 3, 15], lead: [12, N, 13, N, 12, N, 17, 15, N, 13, N, 12, N, 8, 10, N], prog: [0, 0, 1, -2] },
  },
];
