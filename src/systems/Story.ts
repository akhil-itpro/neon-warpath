// Small helpers that turn story data (src/data/story.ts) into what is shown for the current run.
import { run, save, persist, PERKS } from './Run';
import { SPEAKERS, type Cond, type Line, type Speaker, type ChoiceOption } from '../data/story';

export function condOk(c?: Cond) {
  if (!c) return true;
  return Object.entries(c).every(([k, v]) => (run.flags[k] ?? false) === v);
}

/** True when this line plays for the current operator and flags. */
export function lineOk(l: Line) {
  const id = run.op.id;
  if (l.op && l.op !== id) return false;
  if (l.notOp?.includes(id)) return false;
  return condOk(l.if);
}

export const filterLines = (lines: Line[]) => lines.filter(lineOk);

export function speakerName(who: Speaker) { return who === 'op' ? run.op.name : SPEAKERS[who].name; }
export function speakerColor(who: Speaker) { return who === 'op' ? '#ffffff' : SPEAKERS[who].color; }
/** Texture key of the 48x48 portrait drawn in Boot. */
export function portraitKey(who: Speaker) { return `portrait_${who === 'op' ? run.op.id : who}`; }

/** Applies a picked choice card: flags, the results-screen record and any rewards. */
export function applyChoice(o: ChoiceOption) {
  Object.assign(run.flags, o.set);
  run.choices.push(o.record);
  if (o.bonusCards) run.bonusCards = o.bonusCards;
  if (o.score) run.score += o.score;
  if (o.perk) {
    const pool = PERKS.filter((p) => !run.perks.includes(p.id));
    const pk = pool[Math.floor(Math.random() * pool.length)];
    if (pk) { pk.apply(run.stats); run.perks.push(pk.id); if (pk.id === 'plating') run.hp = run.stats.maxHp; }
  }
  if (o.unlock && !save.unlocked.includes(o.unlock)) { save.unlocked.push(o.unlock); persist(); }
}

export interface Ending { name: string; color: string; text: string; epilogue: string[] }

/** The three endings of docs/STORY.md section 4, picked from the run's flags. */
export function pickEnding(): Ending {
  const f = run.flags;
  const mercy = [f.varkesh_freed, f.sovereign_spared, f.quill_rescued, f.nest_truce].filter((v) => v === true).length;
  if (f.rift_choice === 'hold' && f.halcyon_saved === true && mercy >= 2) return {
    name: 'OPEN DOOR', color: '#ffe090', text: 'THE RIFT IS A DOOR NOW. EVERYONE GOES HOME.',
    epilogue: [
      'THE TIDE PEARL HOLDS THE RIFT STILL.', 'A DOOR, NOT A WOUND.', '',
      'TWELVE SPECIES WALK HOME THROUGH IT.',
      ...(f.varkesh_freed ? ['SERRIK SALUTES AT THE THRESHOLD.'] : []),
      'HALCYON, WEAK, STANDS WITH THE SQUAD AT SUNRISE.',
      'PATCH DECIDES TO STAY.',
    ],
  };
  if (f.rift_choice !== 'hold' && f.halcyon_saved !== true && mercy < 2) return {
    name: 'ASHES', color: '#ff8060', text: `THE CITY IS SAFE, AND DARK. JUNO: "WE WON. DIDN'T WE?"`,
    epilogue: [
      'THE RIFT FOLDED SHUT', 'WITH EVERYTHING STILL INSIDE IT.', '',
      'VANTAGE IS SAFE. AND DARK.',
      'THE OPERATOR SITS ALONE ON THE MIDTOWN ROOFTOP.', '',
      `JUNO: "WE WON. DIDN'T WE?"`,
    ],
  };
  return {
    name: 'DAWN', color: '#80ffb0', text: 'ARCHON IS GONE. VANTAGE STARTS TO REBUILD.',
    epilogue: [
      'ARCHON IS GONE. VANTAGE REBUILDS.', '',
      f.halcyon_saved ? 'HALCYON IS RECOVERING. SLOWLY.' : 'HALCYON WAS BURIED WITH FULL HONOURS.',
      'THE SPECIES STILL IN THE CITY ARE STRANDED,', 'BUT ALIVE.', '',
      'PATCH OPENS A REAL SHOP. ALL SALES STILL FINAL.',
    ],
  };
}
