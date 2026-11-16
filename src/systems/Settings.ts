export interface Settings { music: number; effects: number; shake: number; flashes: boolean }
const KEY = 'neon-warpath-settings-v1';
export const settings: Settings = { music: 0.6, effects: 0.8, shake: 1, flashes: true };
try {
  const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  for (const key of ['music', 'effects', 'shake'] as const) {
    if (typeof raw?.[key] === 'number' && Number.isFinite(raw[key])) settings[key] = Math.max(0, Math.min(1, raw[key]));
  }
  if (typeof raw?.flashes === 'boolean') settings.flashes = raw.flashes;
} catch { /* defaults when storage is unavailable or invalid */ }

export function persistSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* session-only settings still work */ }
}
