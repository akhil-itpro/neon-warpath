// Frontier art pack: OPTIONAL PROPOSALS for Claude, deliberately not imported by the game.
// Numeric values are initial playtest candidates, not verified balance.
// Copy selected entries into the live registries only after loading their staged PNGs.
import type { OperatorDef } from './operators';
import { ABILITIES } from './abilities';
import type { WeaponDef } from './weapons';
import type { EnemyDef } from './enemies';

export const FRONTIER_PACK = {
  status: 'staged-art-and-design-proposals',
  library: 'art/library/frontier',
  inventory: 'art/library/frontier/inventory.json',
  source: 'art/source/frontier/manifest.json',
  operatorAnimationFps: 8,
  enemyAnimationFps: 8,
} as const;

// Existing OperatorDef contract; no unimplemented passive is promised.
// The MOTH operator id is distinct from the existing Lantern Moth enemy id `moth`.
export const FRONTIER_OPERATORS: OperatorDef[] = [
  { id: 'kestrel', name: 'KESTREL', role: 'AIR ASSAULT',
    blurb: 'Former storm courier. Takes the high route.', art: 'kestrel', tint: 0xffffff,
    hp: 85, speed: 180, dmg: 1.05, rate: 1, jump: 500, weapon: 'pistol', ability: ABILITIES.gale },
  { id: 'moth_operator', name: 'MOTH', role: 'SALVAGER',
    blurb: 'Built his own arm. Breaks everyone else\'s machines.', art: 'moth', tint: 0xffffff,
    hp: 110, speed: 165, dmg: 1.15, rate: .95, jump: 425, weapon: 'pistol', ability: ABILITIES.quake },
];

// Barrel tips measured from processed 96x72 frames using previews/operator_muzzle_grid.png.
// Same convention as ART_MUZZLES: x forward from center, y above feet. Confirm in engine.
export const FRONTIER_MUZZLES: Record<string, readonly [number, number]> = {
  kestrel_run0: [23, 52], kestrel_run1: [23, 51],
  kestrel_run2: [23, 51], kestrel_run3: [23, 52],
  kestrel_idle: [23, 57], kestrel_jump: [22, 42],
  kestrel_slide: [23, 31], kestrel_crouch: [23, 35],
  moth_run0: [27, 53], moth_run1: [26, 53],
  moth_run2: [27, 53], moth_run3: [27, 53],
  moth_idle: [27, 57], moth_jump: [27, 43],
  moth_slide: [27, 38], moth_crouch: [27, 35],
};

// Data-only starting versions using mechanics present at pack creation.
// PINBALL and TIDEBINDER have optional upgrades below; these versions do not bounce or tether.
export const FRONTIER_WEAPONS: WeaponDef[] = [
  { id: 'prismbreak', name: 'PRISMBREAK', pickupArt: 'prismbreak', color: 0xba89ff,
    rate: 360, dmg: 11, speed: 900, pellets: 3, spread: 10, ammo: 30,
    pierce: true, tex: 'beam', sfx: 'rail', kick: 2 },
  { id: 'pinball', name: 'PINBALL', pickupArt: 'pinball', color: 0xffd34e,
    rate: 64, dmg: 6, speed: 650, pellets: 1, spread: 11, ammo: 180,
    tex: 'bullet', sfx: 'smg', kick: 1 },
  { id: 'needle_hive', name: 'NEEDLE HIVE', pickupArt: 'needle_hive', color: 0xb3d879,
    rate: 130, dmg: 5, speed: 780, pellets: 3, spread: 8, ammo: 90,
    life: 900, tex: 'bullet', sfx: 'smg', kick: 1 },
  { id: 'rivet_king', name: 'RIVET KING', pickupArt: 'rivet_king', color: 0xff9b4f,
    rate: 470, dmg: 44, speed: 740, pellets: 1, spread: 0, ammo: 24,
    pierce: true, tex: 'beam', sfx: 'rail', kick: 3 },
  { id: 'tidebinder', name: 'TIDEBINDER', pickupArt: 'tidebinder', color: 0x70d9d1,
    rate: 550, dmg: 35, speed: 630, pellets: 1, spread: 0, ammo: 26,
    pierce: true, tex: 'beam', sfx: 'rail', kick: 2 },
  { id: 'echo_fork', name: 'ECHO FORK', pickupArt: 'echo_fork', color: 0x9dd9ff,
    rate: 500, dmg: 10, speed: 540, pellets: 5, spread: 24, ammo: 26,
    life: 250, chill: 150, tex: 'ebullet', sfx: 'shotgun', kick: 3 },
  { id: 'ember_wheel', name: 'EMBER WHEEL', pickupArt: 'ember_wheel', color: 0xff8f4a,
    rate: 60, dmg: 6, speed: 470, pellets: 1, spread: 9, ammo: 200,
    life: 360, tex: 'ebullet', sfx: 'smg', kick: 1 },
  { id: 'star_anvil', name: 'STAR ANVIL', pickupArt: 'star_anvil', color: 0xd5a0ff,
    rate: 820, dmg: 55, speed: 330, pellets: 1, spread: 0, ammo: 14,
    gravity: true, explosive: 64, life: 1800, tex: 'rocket', sfx: 'rocket', kick: 4 },
];

export const FRONTIER_ADVANCED_WEAPON_IDEAS = [
  { id: 'pinball', status: 'requires-projectile-code', feature: 'One terrain ricochet',
    maxBounces: 1, afterBounceDamageMultiplier: .7,
    safeguards: ['Use terrain normals, not enemy bodies.', 'Track victims per shot to prevent duplicate overlap damage.',
      'Keep original projectile expiry; no infinite bounce loops.'],
    appeal: 'Bank a shot around cover; skilled positioning changes the best firing angle.' },
  { id: 'tidebinder', status: 'requires-enemy-status-code', feature: 'Brief enemy anchor',
    anchorMs: 450, bossAnchorMs: 0,
    safeguards: ['Anchor normal enemies only.', 'Never drag the player or immobilize a boss.',
      'Refresh duration without stacking damage or pulling through walls.'],
    appeal: 'Hold a dangerous ground target briefly while sliding to its other side.' },
] as const;

// Initial hitboxes fit the visible torso, not the full canvas / wing silhouette.
// Confirm Phaser body offsets against these new canvases during integration.
export const FRONTIER_ENEMIES: EnemyDef[] = [
  { id: 'rail_marauder', name: 'Rail Marauder', faction: 'syndicate', ai: 'gunner',
    hp: 38, score: 160, speed: 72, contact: 0, art: 'rail_marauder', artScale: 1,
    fallback: { frames: ['gangster_0'] }, body: [22, 56], burst: 2, range: 195,
    fireRate: 2100, shotSpeed: 205, windup: 600, shotColor: 0xffc050, gore: 0xffa050 },
  { id: 'storm_kite', name: 'Storm Kite', faction: 'machine', ai: 'flyer',
    hp: 26, score: 150, speed: 85, contact: 0, art: 'storm_kite', artScale: 1,
    fallback: { frames: ['drone'] }, body: [38, 20], flying: true,
    fireRate: 2300, shotSpeed: 170, windup: 650, shotColor: 0xffdb70, gore: 0xffc060 },
  { id: 'bellows_acolyte', name: 'Bellows Acolyte', faction: 'demon', ai: 'spitter',
    hp: 68, score: 240, speed: 40, contact: 10, art: 'bellows_acolyte', artScale: 1,
    fallback: { frames: ['demon_0'] }, body: [32, 48], burst: 1, range: 180,
    fireRate: 2600, shotSpeed: 160, windup: 750, shotColor: 0xff9b40, gore: 0xff8a40 },
  { id: 'cinder_skate', name: 'Cinder Skate', faction: 'demon', ai: 'lobber',
    hp: 32, score: 190, speed: 70, contact: 0, art: 'cinder_skate', artScale: 1,
    fallback: { frames: ['demon_0'] }, body: [38, 18], flying: true,
    fireRate: 2600, shotSpeed: 0, windup: 700, shotColor: 0xff9050, gore: 0xff8a40 },
];

// Dedicated boss state art needs a state machine / texture selection, NOT an idle loop.
// Times and sizes below are encounter proposals; they are not live boss definitions.
export const FRONTIER_BOSSES = [
  { id: 'switchyard_colossus', name: 'SWITCHYARD COLOSSUS', world: 'stormbreak',
    states: ['idle', 'windup', 'attack', 'exposed'], canvas: [224, 128],
    proposedBody: [150, 65], hp: 1500, windupMs: 900, exposedMs: 1600,
    phaseThresholds: [.65, .3],
    attacks: [
      { name: 'Track sweep', cue: 'Coil brightens; paint a single narrow lane before firing.',
        response: 'Jump the floor lane or crouch under the upper lane. Never fire both together.' },
      { name: 'Plow advance', cue: 'Front braces and floor chevrons mark a short charge.',
        response: 'Stop before the player safe area; leave a jump route. Do not require a slide through the entire boss.' },
    ],
    recovery: 'Open cyan reactor. Stop charging and shooting throughout this punish window.',
    escalation: 'Shorten pauses modestly; keep the full warning and clear old bullets before a charge.',
    avoid: 'No homing during the charge, unavoidable corner traps or overlapping high/low sweeps.' },
  { id: 'kiln_matriarch', name: 'KILN MATRIARCH', world: 'underworld_engine',
    states: ['idle', 'windup', 'attack', 'exposed'], canvas: [192, 160],
    proposedBody: [70, 65], hp: 1350, windupMs: 1000, exposedMs: 1800,
    phaseThresholds: [.65, .3],
    attacks: [
      { name: 'Cinder arc', cue: 'Wings rise; mark three separated landing circles.',
        response: 'Move between landing circles, then fire during recovery.' },
      { name: 'Furnace breath', cue: 'Shutter glows and a horizontal band appears at a fixed height.',
        response: 'Crouch beneath the upper band; jump over the floor band. Attack aim locks before firing.' },
    ],
    recovery: 'Open cyan heart. Hold altitude and suspend adds/fire during this punish window.',
    escalation: 'Alternate attacks more often; never cover both dodge lanes simultaneously.',
    avoid: 'No ceiling-height forced jumps, unmarked landing damage or adds hiding the heart.' },
] as const;

export const FRONTIER_WORLDS = [
  { id: 'stormbreak', name: 'STORMBREAK RAILYARD', art: 'bg_stormbreak',
    palette: ['cobalt', 'teal', 'copper', 'amber'], boss: 'switchyard_colossus',
    enemies: ['rail_marauder', 'storm_kite'], weapons: ['prismbreak', 'rivet_king', 'pinball'],
    encounters: [
      'Introduce one marauder on flat safe ground; teach the mask flash before a burst.',
      'Introduce one kite above an open floor; teach moving out of its aimed shot.',
      'Combine two ground shooters with one kite; maintain an open escape side.',
      'Optional raised salvage cache rewards a jump route before the boss checkpoint.',
    ],
    hazards: 'Storm batteries/rails are decoration until explicit telegraphs and collision are implemented.',
    quietPlayArea: 'Lower third; build all platforms and floor collisions independently.' },
  { id: 'underworld_engine', name: 'THE UNDERWORLD ENGINE', art: 'bg_underworld_engine',
    palette: ['charcoal', 'obsidian', 'bronze', 'ember'], boss: 'kiln_matriarch',
    enemies: ['bellows_acolyte', 'cinder_skate'], weapons: ['echo_fork', 'ember_wheel', 'star_anvil'],
    encounters: [
      'Meet one acolyte with space to pass its slow lob.',
      'Meet one skate over a broad platform; mark projectile landing spots.',
      'Alternate ground and air waves before combining them; avoid simultaneous landing carpets.',
      'Place a coolant pump and guaranteed supply cache before the boss checkpoint.',
    ],
    hazards: 'Pressure vents stay decorative unless a separate warning, active and cooldown cycle is added.',
    quietPlayArea: 'Lower third; the backdrop furnace is scenery, not a collision hazard.' },
] as const;

export const FRONTIER_PROPS = [
  { id: 'rail_signal', role: 'Arena direction marker', integration: 'Static decoration; show direction through HUD too.' },
  { id: 'storm_battery', role: 'Optional destructible', integration: 'Start as scenery; any blast needs a warning and readable radius.' },
  { id: 'pressure_vent', role: 'Future timed hazard', integration: 'Decorative first. Add a warning/active/cooldown cycle before damaging the player.' },
  { id: 'cargo_drone_wreck', role: 'Background storytelling', integration: 'Non-solid; place behind the action.' },
  { id: 'furnace_shrine', role: 'Boss-door landmark', integration: 'Non-solid, subdued brightness. Never obscure the operator.' },
  { id: 'ember_egg', role: 'Optional destroy-before-hatch enemy', integration: 'Only use egg AI after choosing and loading its hatchling.' },
  { id: 'coolant_pump', role: 'Checkpoint landmark', integration: 'Art only. Does not heal until explicit interaction is implemented.' },
  { id: 'salvage_cache', role: 'Guaranteed supply reward', integration: 'Use crate AI with one authored reward; avoid loot roulette or grinding.' },
] as const;
