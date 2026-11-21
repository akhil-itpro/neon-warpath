import { WEAPONS } from '../data/weapons';

interface WeaponSlot {
  id: string;
  ammo: number;
}

export interface Loadout {
  slots: [WeaponSlot, WeaponSlot | null, WeaponSlot | null];
  active: number;
}

export function createLoadout(sidearm: string): Loadout {
  return { slots: [{ id: sidearm, ammo: 0 }, null, null], active: 0 };
}

export function equipped(loadout: Loadout): WeaponSlot {
  return loadout.slots[loadout.active] ?? loadout.slots[0];
}

export function selectWeapon(loadout: Loadout, index: number): boolean {
  if (index === loadout.active || (index !== 0 && !loadout.slots[index]?.ammo)) return false;
  loadout.active = index;
  return true;
}

export function cycleWeapon(loadout: Loadout): boolean {
  for (let step = 1; step < loadout.slots.length; step++) {
    if (selectWeapon(loadout, (loadout.active + step) % loadout.slots.length)) return true;
  }
  return false;
}

export function collectWeapon(loadout: Loadout, id: string, ammo: number) {
  const carried = loadout.slots.findIndex(slot => slot?.id === id);
  if (carried > 0) {
    const slot = loadout.slots[carried]!;
    const added = Math.max(0, ammo - slot.ammo);
    slot.ammo += added;
    return { replaced: null, added };
  }
  const empty = loadout.slots.indexOf(null);
  const spent = loadout.slots.findIndex((slot, index) => index > 0 && slot?.ammo === 0);
  const index = empty >= 0 ? empty : spent >= 0 ? spent : loadout.active || 2;
  const replaced = loadout.slots[index]?.id ?? null;
  loadout.slots[index] = { id, ammo };
  loadout.active = index;
  return { replaced, added: null };
}

/** Upgrade the single-weapon v1 save and validate both carried slots in current saves. */
export function readLoadout(sidearm: string, value: unknown, legacyId: unknown, legacyAmmo: unknown): Loadout | null {
  const loadout = createLoadout(sidearm);
  const validSpecial = (id: unknown): id is string => typeof id === 'string'
    && Object.prototype.hasOwnProperty.call(WEAPONS, id) && WEAPONS[id].ammo > 0;
  const validAmmo = (ammo: unknown): ammo is number => typeof ammo === 'number'
    && Number.isInteger(ammo) && ammo >= 0 && ammo <= 1e9;
  if (value === undefined) {
    if (!validAmmo(legacyAmmo) || (legacyId !== sidearm && !validSpecial(legacyId))) return null;
    if (validSpecial(legacyId)) {
      loadout.slots[1] = { id: legacyId, ammo: legacyAmmo };
      if (legacyAmmo) loadout.active = 1;
    }
    return loadout;
  }
  const source = value as Partial<Loadout> | null;
  const active = source?.active;
  if (!source || !Array.isArray(source.slots) || source.slots.length !== loadout.slots.length ||
      typeof active !== 'number' || !Number.isInteger(active) || active < 0 || active >= loadout.slots.length ||
      source.slots[0]?.id !== sidearm || source.slots[0].ammo !== 0) return null;
  for (const index of [1, 2]) {
    const slot = source.slots[index];
    if (slot === null) continue;
    if (!slot || !validSpecial(slot.id) || !validAmmo(slot.ammo) ||
        loadout.slots.some(other => other?.id === slot.id)) return null;
    loadout.slots[index] = { id: slot.id, ammo: slot.ammo };
  }
  selectWeapon(loadout, active);
  return loadout;
}
