// Purpose-drawn pieces from ONE master atlas. All coordinates are game pixels.
export type RigPart = 'head' | 'torso' | 'arm' | 'support' | 'thigh' | 'shin' | 'far_thigh' | 'far_shin';
export interface RigDef {
  parts: Record<RigPart, { texture: string; pivot: readonly [number, number] }>;
  hip: readonly [number, number];
  shoulder: readonly [number, number];
  head: readonly [number, number];
  muzzle: readonly [number, number]; // pixel coordinate on arm texture
  upperLeg: number;
  lowerLeg: number;
  stride: number; // distance travelled per eight-key run cycle
  // Foot targets relative to the hip: contact -> compression -> passing -> flight.
  runFeet: readonly (readonly [number, number])[];
}

function operatorRig(id: string, muzzle: RigDef['muzzle'], shoulderX = 4): RigDef {
  const part = (name: RigPart, x: number, y: number) => ({ texture: `${id}_rig_${name}`, pivot: [x, y] as const });
  return {
    parts: {
      head: part('head', 0.45, 0.9), torso: part('torso', 0.5, 0.91),
      arm: part('arm', 0.14, 0.28), support: part('support', 0.15, 0.28),
      thigh: part('thigh', 0.5, 0.1), shin: part('shin', 0.28, 0.12),
      far_thigh: part('far_thigh', 0.5, 0.1), far_shin: part('far_shin', 0.28, 0.12),
    },
    hip: [0, -31], shoulder: [shoulderX, -49], head: [0, -52], muzzle,
    upperLeg: 14, lowerLeg: 17, stride: 92,
    runFeet: [[12, 28], [6, 30], [-1, 31], [-9, 29], [-14, 24], [-9, 19], [1, 18], [12, 23]],
  };
}

export const OPERATOR_RIGS = {
  rook: operatorRig('rook', [31, 3]),
  viper: operatorRig('viper', [29, 3]),
  titan: operatorRig('titan', [29, 3], 5),
  serrik: operatorRig('serrik', [29, 4]),
  quill: operatorRig('quill', [28, 4]),
};
