export interface Settings { music: number; effects: number; shake: number; flashes: boolean; difficulty: number }
const KEY = 'neon-warpath-settings-v1';
export const settings: Settings = { music: 0.6, effects: 0.8, shake: 1, flashes: true, difficulty: 1 };

/**
 * Difficulty levels (Options screen). All survivability tuning lives here.
 *   dmg         multiplier on every hit the player takes
 *   regenDelay  ms without taking damage before armor starts repairing itself
 *   regenRate   % of max armor repaired per second once it starts
 *   regenCap    armor repairs itself up to this fraction of max (health pickups go above it)
 *   mercy       each death at the same checkpoint cuts damage taken by this much (up to mercyMax) until you get past it
 */
export const DIFFICULTIES = [
  { name: 'EASY', desc: 'Half damage. Armor repairs fast.', dmg: 0.55, regenDelay: 2500, regenRate: 30, regenCap: 1, mercy: 0.12, mercyMax: 0.36 },
  { name: 'NORMAL', desc: 'Armor repairs when you avoid fire.', dmg: 0.85, regenDelay: 4000, regenRate: 20, regenCap: 1, mercy: 0.1, mercyMax: 0.3 },
  { name: 'HARD', desc: 'Full damage. Armor repairs to half.', dmg: 1.15, regenDelay: 6000, regenRate: 12, regenCap: 0.5, mercy: 0, mercyMax: 0 },
] as const;
/** Automated tests written against the original rules set window.__classic: raw damage, no self-repair, no mercy. */
const CLASSIC = { name: 'CLASSIC', desc: '', dmg: 1, regenDelay: Infinity, regenRate: 0, regenCap: 0, mercy: 0, mercyMax: 0 };
export const difficulty = (): (typeof DIFFICULTIES)[number] | typeof CLASSIC =>
  (globalThis as { __classic?: boolean }).__classic ? CLASSIC : DIFFICULTIES[settings.difficulty] ?? DIFFICULTIES[1];

try {
  const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  for (const key of ['music', 'effects', 'shake'] as const) {
    if (typeof raw?.[key] === 'number' && Number.isFinite(raw[key])) settings[key] = Math.max(0, Math.min(1, raw[key]));
  }
  if (typeof raw?.flashes === 'boolean') settings.flashes = raw.flashes;
  if (Number.isInteger(raw?.difficulty) && raw.difficulty >= 0 && raw.difficulty < DIFFICULTIES.length) settings.difficulty = raw.difficulty;
} catch { /* defaults when storage is unavailable or invalid */ }

export function persistSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* session-only settings still work */ }
}
