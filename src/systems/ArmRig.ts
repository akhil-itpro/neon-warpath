import type Phaser from 'phaser';
import { ART_MUZZLES } from '../data/artMuzzles';

// Splits each operator frame into an ARMLESS BODY and a separate ARM+GUN sprite, at boot, from the
// existing art. The arm can then rotate about the shoulder to point where the player is aiming
// (before this, the gun always pointed straight ahead while shots went elsewhere).
//
// New textures per pose:   `<art>_b_<pose>`   body without the aiming arm
//                          `<art>_a_<pose>`   arm + gun, origin at the shoulder pivot
// ARMS[`<art>_b_<pose>`] holds the pivot / barrel geometry used by Player.

export interface ArmGeom {
  px: number; py: number; // shoulder pivot in frame pixels (frame is FRAME_W x FRAME_H, origin = bottom centre)
  len: number;            // pivot -> muzzle distance along the arm
  dy: number;             // muzzle offset perpendicular to the arm axis (frame pixels, +down)
  ox: number; oy: number; // normalised origin of the arm texture (the shoulder pivot)
}
export const ARMS: Record<string, ArmGeom> = {};
export const POSES = ['idle', 'run0', 'run1', 'run2', 'run3', 'jump', 'slide', 'crouch'] as const;

const FRAME_W = 96, FRAME_H = 72, ARM_LEN = 15, OVERLAP = 3;

/** Returns true when the operator `art` now has a rig (all eight poses split). */
export function buildArmRig(scene: Phaser.Scene, art: string): boolean {
  if (POSES.some((p) => !scene.textures.exists(`${art}_${p}`))) return false;
  if (scene.textures.exists(`${art}_b_idle`)) return true;
  for (const pose of POSES) if (!split(scene, art, pose)) return false;
  return true;
}

function split(scene: Phaser.Scene, art: string, pose: string): boolean {
  const key = `${art}_${pose}`;
  const src = scene.textures.get(key).getSourceImage() as CanvasImageSource;
  const cv = document.createElement('canvas'); cv.width = FRAME_W; cv.height = FRAME_H;
  const cx = cv.getContext('2d', { willReadFrequently: true })!;
  cx.drawImage(src, 0, 0);
  const img = cx.getImageData(0, 0, FRAME_W, FRAME_H);
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < FRAME_W && y < FRAME_H && img.data[(y * FRAME_W + x) * 4 + 3] > 20;

  // --- find the gun tip: measured value when we have one, else the right-most pixel above the legs
  let tx = 0, ty = 0;
  const m = ART_MUZZLES[key];
  if (m) { tx = FRAME_W / 2 + m[0]; ty = FRAME_H - m[1]; }
  else {
    for (let y = 0; y < 52; y++) for (let x = 0; x < FRAME_W; x++) if (solid(x, y) && x >= tx) { if (x > tx) ty = y; tx = x; }
  }
  // snap to the nearest solid pixel in the tip column
  let best = -1;
  for (let d = 0; d < 8 && best < 0; d++) for (const y of [ty - d, ty + d]) if (best < 0 && solid(tx, y)) best = y;
  if (best < 0) for (let x = tx - 1; x > tx - 6 && best < 0; x--) for (let d = 0; d < 6 && best < 0; d++) for (const y of [ty - d, ty + d]) if (best < 0 && solid(x, y)) { best = y; tx = x; }
  if (best < 0) return false;
  ty = best;

  // --- vertical band of the arm: contiguous rows around the tip row over the last ARM_LEN columns
  const px = tx - ARM_LEN;
  let top = ty, bot = ty;
  for (let x = px; x <= tx; x++) {
    let y0 = -1;
    for (let d = 0; d < 4 && y0 < 0; d++) for (const y of [ty - d, ty + d]) if (y0 < 0 && solid(x, y)) y0 = y;
    if (y0 < 0) continue;
    let a = y0, b = y0;
    while (solid(x, a - 1) && ty - (a - 1) <= 9) a--;
    while (solid(x, b + 1) && (b + 1) - ty <= 9) b++;
    top = Math.min(top, a); bot = Math.max(bot, b);
  }
  top = Math.max(0, top - 1); bot = Math.min(FRAME_H - 1, bot + 1);
  const bandH = bot - top + 1;
  const py = Math.round((top + bot) / 2);

  // --- arm texture (includes OVERLAP px of the shoulder so no seam shows when rotated)
  const aw = tx - px + 1 + OVERLAP;
  const aKey = `${art}_a_${pose}`;
  const ac = scene.textures.createCanvas(aKey, aw, bandH)!;
  ac.getContext().drawImage(cv, px - OVERLAP, top, aw, bandH, 0, 0, aw, bandH);
  ac.refresh();

  // --- body texture: original minus the arm rectangle
  cx.clearRect(px, top, FRAME_W - px, bandH);
  const bKey = `${art}_b_${pose}`;
  const bc = scene.textures.createCanvas(bKey, FRAME_W, FRAME_H)!;
  bc.getContext().drawImage(cv, 0, 0);
  bc.refresh();

  ARMS[bKey] = { px, py, len: tx - px, dy: ty - py, ox: (OVERLAP + 0.5) / aw, oy: (py - top + 0.5) / bandH };
  return true;
}
