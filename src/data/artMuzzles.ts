// Barrel tips measured from the processed 96x72 operator frames.
// Offsets are from the sprite origin (center X, feet Y); positive Y means above feet.
export const ART_MUZZLES: Record<string, readonly [number, number]> = {
  // Dedicated HALCYON sheet, campaign_finish; measured at the opaque barrel tip.
  halcyon_run0: [22, 36], halcyon_run1: [22, 36], halcyon_run2: [22, 36], halcyon_run3: [21, 36],
  halcyon_idle: [17, 44], halcyon_jump: [20, 32], halcyon_slide: [20, 26], halcyon_crouch: [21, 26],
  viper_run0: [24, 48],
  viper_run1: [24, 49],
  viper_run2: [24, 48],
  viper_run3: [24, 49],
  viper_idle: [24, 56],
  viper_jump: [25, 37],
  viper_slide: [23, 23],
  viper_crouch: [21, 22],
  titan_run0: [30, 52],
  titan_run1: [30, 52],
  titan_run2: [30, 52],
  titan_run3: [30, 52],
  titan_idle: [30, 55],
  titan_jump: [29, 43],
  titan_slide: [29, 32],
  titan_crouch: [29, 32],
  // species operators (measured in src/data/speciesPack.ts)
  serrik_run0: [24, 52], serrik_run1: [24, 52], serrik_run2: [24, 50], serrik_run3: [24, 52],
  serrik_idle: [24, 55], serrik_jump: [24, 41], serrik_slide: [27, 32], serrik_crouch: [25, 36],
  quill_run0: [24, 47], quill_run1: [25, 47], quill_run2: [23, 47], quill_run3: [24, 47],
  quill_idle: [24, 55], quill_jump: [25, 44], quill_slide: [26, 37], quill_crouch: [27, 32],
};
