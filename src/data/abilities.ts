// Recharge starts after the active window. All tuning lives here, not in scenes.
export interface AbilityDef {
  id: 'aegis' | 'phase' | 'quake' | 'rally' | 'gale';
  name: string;
  desc: string;
  duration: number;
  recharge: number;
  color: number;
  damageTaken: number;
  speed?: number;
  rate?: number;
  damage?: number;
  radius?: number;
  pulseDamage?: number;
  stagger?: number;
  knockback?: number;
  heal?: number;
  lift?: number;
  fallSpeed?: number;
}

export const ABILITIES: Record<AbilityDef['id'], AbilityDef> = {
  aegis: { id: 'aegis', name: 'AEGIS', desc: '3s shield + bullet purge / 12s recharge', duration: 3000, recharge: 12000, color: 0x64ddff, damageTaken: 0, radius: 100 },
  phase: { id: 'phase', name: 'PHASE', desc: '1.5s invincible haste / 10s recharge', duration: 1500, recharge: 10000, color: 0xff89cf, damageTaken: 0, speed: 1.6, rate: 1.5 },
  quake: { id: 'quake', name: 'SHOCKWAVE', desc: 'Blast + 4s half damage / 14s recharge', duration: 4000, recharge: 14000, color: 0xffbc64, damageTaken: 0.5, radius: 170, pulseDamage: 65, stagger: 1000, knockback: 290 },
  rally: { id: 'rally', name: 'RALLY', desc: 'Heal 25 + 5s damage boost / 18s recharge', duration: 5000, recharge: 18000, color: 0x91ee9e, damageTaken: 1, heal: 25, damage: 1.4 },
  gale: { id: 'gale', name: 'UPDRAFT', desc: 'Leap + 3s glide + purge / 9s recharge', duration: 3000, recharge: 9000, color: 0xc2b0ff, damageTaken: 1, radius: 145, stagger: 1600, knockback: 190, lift: 480, fallSpeed: 100 },
};
