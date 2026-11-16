// Optional species pack for Claude. No live module imports these proposals.
// Artwork is present; stats, encounters, ally roles and signature attacks need playtesting/integration.
import type { EnemyDef } from './enemies';
import type { OperatorDef } from './operators';
import { ABILITIES } from './abilities';

export interface SpeciesDesign {
  id: string;
  name: string;
  bodyPlan: string;
  habitats: string[];
  ecology: string;
  combatRole: string;
  cue: string;
  counterplay: string;
  allyOrNeutralUse: string;
}

export const SPECIES_PACK = {
  status: 'staged-art-and-content-proposals',
  library: 'art/library/species', inventory: 'art/library/species/inventory.json',
  sourcesAndPrompts: 'art/source/species/manifest.json',
  // This classification is separate from the engine's Faction union.
  // These enemy templates describe hostile individuals, not an entire species' allegiance.
} as const;

export const SPECIES: SpeciesDesign[] = [
  { id: 'varkesh', name: 'VARKESH', bodyPlan: 'Reptilian sapient; biped, crest and muscular tail',
    habitats: ['city', 'casino', 'furnace'], ecology: 'Heat-tolerant industrial settlers and storm-route couriers.',
    combatRole: 'Mobile mid-range two-shot skirmisher', cue: 'Amber gun flash before a short burst.',
    counterplay: 'Keep moving, change height, or slide past the committed firing line.',
    allyOrNeutralUse: 'Serrik operator; neutral couriers can explain routes through visual signs.' },
  { id: 'corvane', name: 'CORVANE', bodyPlan: 'Avian sapient; feather mantle, beak, two arms and clawed feet',
    habitats: ['city', 'casino', 'orbital'], ecology: 'Salvagers build compact tools from abandoned station machinery.',
    combatRole: 'Fragile fast shooter with longer reach', cue: 'Pale muzzle warning; isolated deliberate shot.',
    counterplay: 'Close distance during its long recovery; do not stand in its firing lane.',
    allyOrNeutralUse: 'Quill operator; a mechanic or evacuation scout is a future NPC option.' },
  { id: 'kharrix', name: 'KHARRIX', bodyPlan: 'Six-legged chitin insectoid with scissor mouthparts',
    habitats: ['fungal', 'furnace'], ecology: 'Tunnel predators follow heat and machinery vibration.',
    combatRole: 'Low fast melee pressure', cue: 'Existing rusher flash and brief stop before a lunge.',
    counterplay: 'Jump its low body or time the invulnerable slide through the lunge.',
    allyOrNeutralUse: 'Distant unarmed tunnel fauna; avoid treating background wildlife as a combat target.' },
  { id: 'ferrivor', name: 'FERRIVOR', bodyPlan: 'Low segmented annelid with many feet and mineral dorsal plates',
    habitats: ['furnace', 'city'], ecology: 'Consumes rusted scrap and leaves clean mineral seams behind.',
    combatRole: 'Slow durable crawler occupying a ground lane', cue: 'Same rusher flash; plates brighten before the short lunge.',
    counterplay: 'Use height or piercing shots; keep an escape gap instead of stacking crawlers wall to wall.',
    allyOrNeutralUse: 'Noncombat scrap-recycling colonies in distant factory scenery.' },
  { id: 'nacreth', name: 'NACRETH', bodyPlan: 'Shell-backed cephalopod; spiral mantle and thick tentacles',
    habitats: ['abyss'], ecology: 'Pressure-adapted reef grazers gather around leaking station vents.',
    combatRole: 'Hovering slow-lob pressure', cue: 'Existing lobber warning, then an arcing projectile.',
    counterplay: 'Move before the arc lands; keep one route between separated impacts.',
    allyOrNeutralUse: 'Peaceful reef life beyond windows; Tide Sovereign is an optional boss individual.' },
  { id: 'cirrid', name: 'CIRRID', bodyPlan: 'Gas colony inside a natural rib-like mineral cage',
    habitats: ['orbital', 'cathedral'], ecology: 'Feeds on ionized air inside old air-conditioning conduits.',
    combatRole: 'Slow floating aimed-shot harasser', cue: 'Bright center warning before firing.',
    counterplay: 'Move out of its aim, then attack its small central body.',
    allyOrNeutralUse: 'Ambient drifting colonies behind glass; no collision or contact damage.' },
  { id: 'myrrhkin', name: 'MYRRHKIN', bodyPlan: 'Fungal stalk organism; broad gilled cap and four root feet',
    habitats: ['fungal'], ecology: 'Turns organic waste into a subterranean nutrient network.',
    combatRole: 'Two separated arcing shots that make the player relocate', cue: 'Spitter warning and explicit landing circles.',
    counterplay: 'Step between marked impacts; the cap must not hide warning circles.',
    allyOrNeutralUse: 'Noncombat fungal landmarks along safe routes.' },
  { id: 'thren', name: 'THREN', bodyPlan: 'Armored plant seedpod on four woody roots with a flower sensory face',
    habitats: ['fungal', 'orbital'], ecology: 'Mobile seed carriers restore soil in abandoned greenhouses.',
    combatRole: 'Fragile wandering single-lob shooter', cue: 'Flower warning followed by one marked landing spot.',
    counterplay: 'Advance between its widely spaced shots; avoid crowding the landing marker.',
    allyOrNeutralUse: 'Safe greenhouse gardeners; future noncombat seed delivery objective.' },
  { id: 'vitreon', name: 'VITREON', bodyPlan: 'Living sapphire prism on three articulated crystal legs',
    habitats: ['orbital', 'cathedral'], ecology: 'Stores charge in facets and communicates through resonant vibration.',
    combatRole: 'Tall slow precision shooter', cue: 'Long amber eye-seam warning before the shot.',
    counterplay: 'Change position during the warning; punish the recovery rather than trading hits.',
    allyOrNeutralUse: 'Neutral resonant sentinels; Prism Regent is an optional boss individual.' },
  { id: 'lithurn', name: 'LITHURN', bodyPlan: 'Heavy basalt quadruped; tortoise-like shell and quartz ridges',
    habitats: ['furnace', 'fungal'], ecology: 'Slow mineral grazers burrow through cooling industrial slag.',
    combatRole: 'Heavy ground melee obstacle', cue: 'Rusher flash announces its committed lunge.',
    counterplay: 'Jump the low silhouette or slide past; never fill an entire narrow arena with them.',
    allyOrNeutralUse: 'Distant harmless migrating herds; no armor immunities are implied by the art.' },
  { id: 'geliform', name: 'GELIFORM', bodyPlan: 'Gelatinous low colony with a visible nucleus and pseudopods',
    habitats: ['abyss', 'fungal'], ecology: 'Absorbs waste liquids and shelters a dense symbiotic nucleus.',
    combatRole: 'Low short-range lobber on the ground', cue: 'Nucleus warning and marked impact circle.',
    counterplay: 'Aim down or use the existing aim assist; jump over its low body.',
    allyOrNeutralUse: 'Waste-cleaning organisms in station tanks; no splitting mechanic is implemented.' },
  { id: 'asterid', name: 'ASTERID', bodyPlan: 'Floating cosmic echinoderm with six curling arms and one lateral eye',
    habitats: ['orbital', 'abyss', 'cathedral'], ecology: 'Clings to hulls and slowly filters charged dust.',
    combatRole: 'Slow six-shot radial pattern', cue: 'Large center warning before a sparse ring.',
    counterplay: 'Read the gaps and move between rays; avoid simultaneous rings in tight spaces.',
    allyOrNeutralUse: 'Harmless distant hull colonies; hostile ones are explicitly marked encounters.' },
];

// Prototype EnemyDef values use existing AI, not new species-specific engine behaviours.
// Body sizes are initial candidates; verify offsets at scale 1 against each declared canvas.
export const SPECIES_ENEMIES: EnemyDef[] = [
  { id: 'sp_varkesh', name: 'Varkesh Skirmisher', faction: 'syndicate', ai: 'gunner',
    hp: 40, score: 150, speed: 80, contact: 0, art: 'sp_varkesh', artScale: 1,
    fallback: { frames: ['gangster_0'] }, body: [22, 60], burst: 2, range: 190,
    fireRate: 2100, shotSpeed: 200, windup: 650, muzzle: [36, 53], shotColor: 0xffc060, gore: 0x70c686 },
  { id: 'sp_corvane', name: 'Corvane Outrider', faction: 'syndicate', ai: 'gunner',
    hp: 28, score: 160, speed: 95, contact: 0, art: 'sp_corvane', artScale: 1,
    fallback: { frames: ['gangster_0'] }, body: [22, 58], burst: 1, range: 250,
    fireRate: 2300, shotSpeed: 250, windup: 800, muzzle: [30, 46], shotColor: 0xd4ebff, gore: 0x96b9db },
  { id: 'sp_kharrix', name: 'Kharrix Tunnel Hunter', faction: 'alien', ai: 'rusher',
    hp: 34, score: 130, speed: 105, contact: 12, art: 'sp_kharrix', artScale: 1,
    fallback: { frames: ['robot_walk'] }, body: [64, 30], gore: 0xffba60 },
  { id: 'sp_ferrivor', name: 'Ferrivor Rustgrazer', faction: 'mutant', ai: 'rusher',
    hp: 90, score: 220, speed: 35, contact: 12, art: 'sp_ferrivor', artScale: 1,
    fallback: { frames: ['robot_walk'] }, body: [94, 25], heavy: true, gore: 0xd48569 },
  { id: 'sp_nacreth', name: 'Nacreth Reef Drifter', faction: 'alien', ai: 'lobber',
    hp: 46, score: 210, speed: 60, contact: 0, art: 'sp_nacreth', artScale: 1,
    fallback: { frames: ['drone'] }, body: [44, 42], flying: true,
    fireRate: 2700, shotSpeed: 0, gore: 0x75d3db },
  { id: 'sp_cirrid', name: 'Cirrid Ion Colony', faction: 'alien', ai: 'flyer',
    hp: 25, score: 170, speed: 55, contact: 0, art: 'sp_cirrid', artScale: 1,
    fallback: { frames: ['drone'] }, body: [42, 36], flying: true,
    fireRate: 2500, shotSpeed: 150, windup: 700, shotColor: 0xd3aeff, gore: 0xc4a7ff },
  { id: 'sp_myrrhkin', name: 'Myrrhkin Capwalker', faction: 'mutant', ai: 'spitter',
    hp: 65, score: 210, speed: 30, contact: 0, art: 'sp_myrrhkin', artScale: 1,
    fallback: { frames: ['robot_walk'] }, body: [46, 42], burst: 2, range: 190,
    fireRate: 2900, windup: 750, shotColor: 0xffb25c, gore: 0xd7b9ee },
  { id: 'sp_thren', name: 'Thren Seedrunner', faction: 'mutant', ai: 'spitter',
    hp: 32, score: 140, speed: 65, contact: 0, art: 'sp_thren', artScale: 1,
    fallback: { frames: ['robot_walk'] }, body: [54, 40], burst: 1, range: 180,
    fireRate: 2400, windup: 650, shotColor: 0xb6e680, gore: 0x91c76c },
  { id: 'sp_vitreon', name: 'Vitreon Resonator', faction: 'alien', ai: 'gunner',
    hp: 50, score: 230, speed: 28, contact: 0, art: 'sp_vitreon', artScale: 1,
    fallback: { frames: ['robot_walk'] }, body: [26, 64], burst: 1, range: 280,
    fireRate: 2700, shotSpeed: 270, windup: 900, muzzle: [10, 55], shotColor: 0xffc970, gore: 0x9fc7ff },
  { id: 'sp_lithurn', name: 'Lithurn Slagback', faction: 'mutant', ai: 'rusher',
    hp: 120, score: 280, speed: 28, contact: 16, art: 'sp_lithurn', artScale: 1,
    fallback: { frames: ['robot_walk'] }, body: [76, 42], heavy: true, gore: 0x8fb2be },
  { id: 'sp_geliform', name: 'Geliform Wastegrazer', faction: 'mutant', ai: 'spitter',
    hp: 40, score: 130, speed: 35, contact: 0, art: 'sp_geliform', artScale: 1,
    fallback: { frames: ['robot_walk'] }, body: [64, 30], burst: 1, range: 140,
    fireRate: 2500, windup: 650, shotColor: 0x72dbed, gore: 0x6ce4eb },
  { id: 'sp_asterid', name: 'Asterid Hullwatcher', faction: 'alien', ai: 'flyer',
    hp: 38, score: 230, speed: 45, contact: 0, art: 'sp_asterid', artScale: 1,
    fallback: { frames: ['drone'] }, body: [38, 38], flying: true, radial: 6,
    fireRate: 3200, shotSpeed: 110, windup: 950, shotColor: 0xffc789, gore: 0xbb8bef },
];

export const SPECIES_OPERATORS: OperatorDef[] = [
  { id: 'serrik', name: 'SERRIK', role: 'VARKESH VANGUARD',
    blurb: 'Storm-route courier. Cold aim, warm heart.', art: 'op_serrik', tint: 0xffffff,
    hp: 115, speed: 160, dmg: 1.1, rate: .95, jump: 440, weapon: 'pistol', ability: ABILITIES.rally },
  { id: 'quill', name: 'QUILL', role: 'CORVANE SCOUT',
    blurb: 'Salvage pilot. Always finds another route.', art: 'op_quill', tint: 0xffffff,
    hp: 90, speed: 185, dmg: .95, rate: 1.1, jump: 475, weapon: 'pistol', ability: ABILITIES.gale },
];

// Measured against processed 96x72 PNGs. x forward from center; y above feet.
// Merge selected entries into ART_MUZZLES and confirm shots in every pose/facing in engine.
export const SPECIES_MUZZLES: Record<string, readonly [number, number]> = {
  op_serrik_run0: [24, 52], op_serrik_run1: [24, 52],
  op_serrik_run2: [24, 50], op_serrik_run3: [24, 52],
  op_serrik_idle: [24, 55], op_serrik_jump: [24, 41],
  op_serrik_slide: [27, 32], op_serrik_crouch: [25, 36],
  op_quill_run0: [24, 47], op_quill_run1: [25, 47],
  op_quill_run2: [23, 47], op_quill_run3: [24, 47],
  op_quill_idle: [24, 55], op_quill_jump: [25, 44],
  op_quill_slide: [26, 37], op_quill_crouch: [27, 32],
};

// Authored small encounter suggestions, not inserted into stages.ts.
// Introduce a species alone before combining roles; do not add all species to every stage.
export const SPECIES_STAGE_PALETTES = [
  { stage: 'city', first: ['sp_corvane'], later: ['sp_varkesh'],
    pairing: ['sp_corvane', 'sp_varkesh'], maxSimultaneousNewThreats: 2 },
  { stage: 'casino', first: ['sp_varkesh'], later: ['sp_corvane'],
    pairing: ['sp_varkesh', 'sp_corvane'], maxSimultaneousNewThreats: 2 },
  { stage: 'furnace', first: ['sp_ferrivor'], later: ['sp_lithurn'],
    pairing: ['sp_ferrivor', 'sp_varkesh'], maxSimultaneousNewThreats: 2 },
  { stage: 'fungal', first: ['sp_thren'], later: ['sp_myrrhkin', 'sp_kharrix'],
    pairing: ['sp_thren', 'sp_kharrix'], maxSimultaneousNewThreats: 2 },
  { stage: 'abyss', first: ['sp_geliform'], later: ['sp_nacreth'],
    pairing: ['sp_geliform', 'sp_nacreth'], maxSimultaneousNewThreats: 2 },
  { stage: 'orbital', first: ['sp_vitreon'], later: ['sp_cirrid', 'sp_asterid'],
    pairing: ['sp_vitreon', 'sp_cirrid'], maxSimultaneousNewThreats: 2 },
  { stage: 'cathedral', first: ['sp_cirrid'], later: ['sp_asterid', 'sp_vitreon'],
    pairing: ['sp_vitreon', 'sp_asterid'], maxSimultaneousNewThreats: 2 },
] as const;

// Boss state pictures are complete. Signature attack code / damage timing is not implemented.
export const SPECIES_BOSSES = [
  { id: 'nacreth_sovereign', species: 'nacreth', name: 'NACRETH TIDE SOVEREIGN', stage: 'abyss',
    canvas: [208, 160], origin: [.5, .5], proposedBody: [100, 80],
    states: ['idle', 'windup', 'attack', 'exposed'],
    windupMs: 1000, recoveryMs: 1800,
    signature: 'Siphon barrage: mark separated impact spots, lock aim, then send slow arcs.',
    response: 'Move between marked spots. Leave one full safe side of the arena.',
    punish: 'Open cyan mantle organ; suspend attacks and summons throughout recovery.',
    bounds: 'Tentacles are decorative until explicitly given warning and damage geometry.',
    prototype: 'Static idle art may use existing boss_seer for a prototype; this does not implement the siphon attack.' },
  { id: 'vitreon_regent', species: 'vitreon', name: 'VITREON PRISM REGENT', stage: 'orbital',
    canvas: [176, 192], origin: [.5, 1], proposedBody: [75, 130],
    states: ['idle', 'windup', 'attack', 'exposed'],
    windupMs: 1100, recoveryMs: 1700,
    signature: 'Refraction sweep: show one fixed high or low beam lane, then fire only that lane.',
    response: 'Crouch under the high lane or jump the low lane. Never cover both at once.',
    punish: 'Open cyan chest facet; halt beam tracking and clear prior hazards before recovery.',
    bounds: 'Three legs do not imply three contact hurtboxes. Keep one readable central body.',
    prototype: 'Needs explicit state-to-texture and lane attack code; an idle frame is only visual staging.' },
] as const;
