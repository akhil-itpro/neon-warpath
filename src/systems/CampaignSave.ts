import { newRun, PERKS, run, type RunState } from './Run';
import { OPERATORS } from '../data/operators';
import { STAGES } from '../data/stages';
import { WEAPONS } from '../data/weapons';

const KEY = 'neon-warpath-campaign-v1';
type Destination = 'Game' | 'Briefing' | 'Perk';
type State = Omit<RunState, 'op' | 'stats'>;
interface Snapshot {
  version: 1;
  operator: string;
  stageId: string;
  scene: Destination;
  data: { next?: string; hold?: boolean; resume?: boolean };
  state: State;
}
const NUMBERS = ['score', 'hp', 'ammo', 'od', 'kills', 'maxCombo', 'deaths', 'checkpoint', 'checkpointX', 'eggsShot', 'bonusCards'] as const;
const LISTS = ['perks', 'shards', 'heard', 'choices'] as const;

/** Snapshots contain plain run data only. Operator definitions and perk functions come from the current build. */
export function campaignSnapshot(): Snapshot | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null'), s = raw?.state;
    if (raw?.version !== 1 || !s || !['Game', 'Briefing', 'Perk'].includes(raw.scene)) return null;
    if (!OPERATORS.some(op => op.id === raw.operator) || !Object.prototype.hasOwnProperty.call(WEAPONS, s.weapon)) return null;
    const final = raw.stageId === 'final';
    const stage = final ? STAGES.length : STAGES.findIndex(st => st.id === raw.stageId);
    if (stage < 0 || (final && raw.scene !== 'Briefing')) return null;
    if (NUMBERS.some(k => typeof s[k] !== 'number' || !Number.isFinite(s[k]) || s[k] < 0 || s[k] > 1e9)) return null;
    if (LISTS.some(k => !Array.isArray(s[k]) || s[k].length > 1000 || s[k].some((v: unknown) => typeof v !== 'string'))) return null;
    if (s.perks.some((id: string) => !PERKS.some(p => p.id === id)) || new Set(s.perks).size !== s.perks.length) return null;
    if (!s.flags || typeof s.flags !== 'object' || Array.isArray(s.flags) || Object.values(s.flags).some(v => typeof v !== 'string' && typeof v !== 'boolean')) return null;
    const data = raw.data;
    if (!data || typeof data !== 'object') return null;
    if (raw.scene === 'Briefing' && !(final ? ['End'] : ['Game', 'Perk']).includes(data.next)) return null;
    const st = STAGES[Math.min(stage, STAGES.length - 1)];
    if (!Number.isInteger(s.checkpoint) || s.checkpoint > st.encounters.length && !(data.hold === true && s.checkpoint === 99)) return null;
    if (s.checkpointX < 10 || s.checkpointX > st.width - 10 || s.od > 100) return null;
    if (data.hold === true && (st.id !== 'cathedral' || s.flags.rift_choice !== 'hold')) return null;
    // Copy an allowlist; never let stored operator/stats fields replace executable definitions.
    const state: State = { stage, weapon: s.weapon, flags: { ...s.flags } } as State;
    for (const k of NUMBERS) state[k] = s[k];
    for (const k of LISTS) state[k] = [...s[k]];
    return { version: 1, operator: raw.operator, stageId: raw.stageId, scene: raw.scene,
      data: raw.scene === 'Briefing' ? { next: data.next } : { hold: data.hold === true, resume: true }, state };
  } catch { return null; }
}

/** Debug URLs never overwrite a real campaign. A denied storage write leaves the prior checkpoint intact. */
export function saveCampaign(scene: Destination, data: Snapshot['data'] = {}): boolean {
  if (!run || new URLSearchParams(location.search).has('stage')) return false;
  const { op, stats: _stats, ...state } = run;
  const snapshot: Snapshot = { version: 1, operator: op.id, stageId: STAGES[run.stage]?.id ?? 'final', scene, data, state };
  try { localStorage.setItem(KEY, JSON.stringify(snapshot)); return true; } catch { return false; }
}

export function restoreCampaign(): Snapshot | null {
  const snapshot = campaignSnapshot();
  if (!snapshot) return null;
  newRun(OPERATORS.findIndex(op => op.id === snapshot.operator));
  for (const id of snapshot.state.perks) PERKS.find(p => p.id === id)!.apply(run.stats);
  Object.assign(run, snapshot.state);
  run.hp = Math.max(1, Math.min(run.hp, run.stats.maxHp));
  return snapshot;
}

export function clearCampaign() {
  if (new URLSearchParams(location.search).has('stage')) return;
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
