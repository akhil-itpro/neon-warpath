// State for one playthrough (survives scene changes) + persistent save data.
import { OPERATORS, OperatorDef } from '../data/operators';
import { createLoadout, type Loadout } from './Loadout';

export interface Stats {
  maxHp: number;
  dmg: number;
  rate: number;
  speed: number;
  jump: number;
  airJumps: number;
  lifesteal: number;
  slideCd: number; // ms
  odGain: number;
  blast: number; // chance-free: kills explode with this radius (0 = off)
  ammo: number; // pickup ammo multiplier
  magnet: number;
  armor: number; // damage multiplier taken
}

export interface PerkDef {
  id: string;
  name: string;
  desc: string;
  apply: (s: Stats) => void;
}

export const PERKS: PerkDef[] = [
  { id: 'plating', name: 'TITANIUM PLATING', desc: '+30 max armor, full heal', apply: (s) => { s.maxHp += 30; } },
  { id: 'hollow', name: 'HOLLOW POINTS', desc: '+25% damage', apply: (s) => { s.dmg *= 1.25; } },
  { id: 'trigger', name: 'HAIR TRIGGER', desc: '+20% fire rate', apply: (s) => { s.rate *= 1.2; } },
  { id: 'boosters', name: 'JUMP BOOSTERS', desc: 'Extra mid-air jump', apply: (s) => { s.airJumps += 1; } },
  { id: 'reflex', name: 'COMBAT REFLEX', desc: 'Slide recharges 45% faster', apply: (s) => { s.slideCd *= 0.55; } },
  { id: 'vampire', name: 'FIELD SURGEON', desc: 'Heal 2 armor per kill', apply: (s) => { s.lifesteal += 2; } },
  { id: 'fury', name: 'WAR FURY', desc: 'Overdrive charges 40% faster', apply: (s) => { s.odGain *= 1.4; } },
  { id: 'chain', name: 'CHAIN REACTION', desc: 'Enemies explode on death', apply: (s) => { s.blast += 44; } },
  { id: 'bandolier', name: 'BANDOLIER', desc: '+60% ammo from weapon crates', apply: (s) => { s.ammo *= 1.6; } },
  { id: 'kevlar', name: 'REACTIVE KEVLAR', desc: 'Take 20% less damage', apply: (s) => { s.armor *= 0.8; } },
  { id: 'sprinter', name: 'ADRENAL PUMP', desc: '+12% move speed', apply: (s) => { s.speed *= 1.12; } },
];

export const newStageStats = () => ({ elapsed: 0, kills: 0, bestCombo: 0, deaths: 0 });
export type StageStats = ReturnType<typeof newStageStats>;

export interface RunState {
  op: OperatorDef;
  stage: number;
  stageStats: StageStats;
  score: number;
  hp: number;
  loadout: Loadout;
  od: number; // 0..100
  perks: string[];
  stats: Stats;
  kills: number;
  maxCombo: number;
  deaths: number;
  checkpoint: number; // index of first encounter not yet cleared in current stage
  checkpointX: number;
  strikes: number; // deaths since the last checkpoint was reached (mercy armor, see Settings.DIFFICULTIES); not saved
  // ---- story (docs/STORY.md): reset on a new run, survive stage restarts
  flags: Record<string, string | boolean>;
  shards: string[];        // lore ids collected this run
  eggsShot: number;        // brood eggs destroyed in the current stage (FUNGAL nest choice-by-action)
  bonusCards: number;      // perk screens left that show a 4th card (ledger = sell)
  heard: string[];         // comms already played this run ('<stage>:<trigger>')
  choices: string[];       // plain-language record of choices, for the results screen
}

export let run: RunState;

export function newRun(opIndex: number) {
  const op = OPERATORS[opIndex] ?? OPERATORS[0];
  run = {
    op, stage: 0, stageStats: newStageStats(), score: 0, hp: op.hp, loadout: createLoadout(op.weapon), od: 0, perks: [],
    stats: { maxHp: op.hp, dmg: op.dmg, rate: op.rate, speed: op.speed, jump: op.jump, airJumps: 1, lifesteal: 0, slideCd: 650, odGain: 1, blast: 0, ammo: 1, magnet: 90, armor: 1 },
    kills: 0, maxCombo: 0, deaths: 0, checkpoint: 0, checkpointX: 80, strikes: 0,
    flags: {}, shards: [], eggsShot: 0, bonusCards: 0, heard: [], choices: [],
  };
  (window as any).__run = run; // debugging / smoke-test handle
}

// ---- persistent save (localStorage) ----
interface SaveData { best: number; cleared: number; muted: boolean; op: number; archive: string[]; endings: string[]; unlocked: string[] }
const KEY = 'neon-warpath-save-v1';

export const save: SaveData = (() => {
  const d: SaveData = { best: 0, cleared: 0, muted: false, op: 0, archive: [], endings: [], unlocked: [] };
  try { Object.assign(d, JSON.parse(localStorage.getItem(KEY) ?? '{}')); } catch { /* corrupt or blocked: use defaults */ }
  if (!Number.isInteger(d.op) || !OPERATORS[d.op]) d.op = 0;
  if (!Number.isSafeInteger(d.best) || d.best < 0) d.best = 0;
  if (!Number.isSafeInteger(d.cleared) || d.cleared < 0) d.cleared = 0;
  if (typeof d.muted !== 'boolean') d.muted = false;
  if (!Array.isArray(d.archive)) d.archive = [];
  if (!Array.isArray(d.endings)) d.endings = [];
  if (!Array.isArray(d.unlocked)) d.unlocked = [];
  return d;
})();

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* storage unavailable */ }
}
