// Small helpers that turn story data (src/data/story.ts) into what is shown for the current run.
import { run } from './Run';
import { SPEAKERS, type Cond, type Line, type Speaker } from '../data/story';

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
