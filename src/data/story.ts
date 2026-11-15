// Story data: briefings, in-level radio chatter (comms), choices and lore. Design source: docs/STORY.md.
// The 7 live stages carry STORY.md stages 1, 2, 4, 6, 7, 9 and 12. Lines that referred to stages that are
// not built yet (railyard, tidal vault, prism wastes, spire) were bridged; restore them when those stages land.
//
// Line rules (STORY.md): at most ~60 characters, at most 4 lines before the player gets control back.

export type Speaker = 'op' | 'juno' | 'patch' | 'archon' | 'croupier' | 'oracle' | 'myrrhkin';
export type FlagValue = string | boolean;
/** Every listed flag must equal the given value. `false` also matches an unset flag. */
export type Cond = Record<string, FlagValue>;

export interface Line {
  who: Speaker;
  text: string;
  op?: string;      // only for this operator id ('viper' / 'titan')
  notOp?: string[]; // skipped for these operator ids (the default line that an `op` line replaces)
  if?: Cond;
}

export interface ChoiceOption {
  label: string;
  hint: string;
  set: Record<string, FlagValue>;
  reply: Line[];
  record: string;   // plain-language line for the results screen
  bonusCards?: number; // perk screens that show a 4th card
  requires?: Cond;
  locked?: string; // label shown when `requires` fails (a door the player missed)
}

export interface Choice { id: string; prompt: Line[]; options: ChoiceOption[] }

/**
 * Comms trigger keys:
 *   start             stage begins (first attempt only)
 *   x:<n>             player crosses world x
 *   enc:<i> / clear:<i>  encounter i locks / is cleared (0-based)
 *   see:<enemyId>     first time that enemy is on screen near the player
 *   boss / boss50 / bossdown   boss appears / drops below half HP / dies
 *   death             first death in the stage
 *   shard             first data shard picked up in the run
 */
export interface Comm { on: string; lines: Line[] }

export interface StageStory {
  briefing: Line[];             // before the stage (the Briefing scene)
  comms: Comm[];
  after?: { lines: Line[]; choice?: Choice }; // shown in the next briefing, before that stage's own lines
}

const op = (text: string, extra: Partial<Line> = {}): Line => ({ who: 'op', text, ...extra });
const juno = (text: string, extra: Partial<Line> = {}): Line => ({ who: 'juno', text, ...extra });
const patch = (text: string, extra: Partial<Line> = {}): Line => ({ who: 'patch', text, ...extra });
const archon = (text: string, extra: Partial<Line> = {}): Line => ({ who: 'archon', text, ...extra });

export const SPEAKERS: Record<Exclude<Speaker, 'op'>, { name: string; color: string }> = {
  juno: { name: 'JUNO', color: '#9fe8ff' },
  patch: { name: 'PATCH', color: '#ffd040' },
  archon: { name: 'ARCHON', color: '#ff4060' },
  croupier: { name: 'THE CROUPIER', color: '#ff80d0' },
  oracle: { name: 'STATIC ORACLE', color: '#d0a0ff' },
  myrrhkin: { name: 'MYRRHKIN', color: '#b080ff' },
};

export const STORY: Record<string, StageStory> = {
  city: {
    briefing: [
      juno("Operator, this is Juno. You don't know me. I know you."),
      juno("ARCHON just switched off the city's police."),
      juno('Its drones are the police now.'),
      juno("The Syndicate works for it. Get to the Midtown relay."),
      juno('Viper. Your old family is out there tonight.', { op: 'viper' }),
      juno('Try not to make it personal.', { op: 'viper' }),
      juno('Titan. You built half the security those drones run on.', { op: 'titan' }),
      juno('Now break it.', { op: 'titan' }),
    ],
    comms: [
      { on: 'see:gangster', lines: [juno('Syndicate gunmen. Paid by the hour.'), juno('Make it a short shift.')] },
      { on: 'x:1150', lines: [juno('Slide, then jump. You carry further. Use it.')] },
      { on: 'clear:1', lines: [archon('Good evening. You are trespassing on municipal property.')] },
      { on: 'shard', lines: [juno("That's an ARCHON memory shard. Grab every one."), juno("I want to know what it's thinking.")] },
      { on: 'death', lines: [juno("Get up. The city doesn't have a spare.")] },
      { on: 'boss', lines: [archon('Air support has been dispatched. Please remain still.')] },
      { on: 'boss50', lines: [juno('Its rotor housing is cracking. Keep it up!')] },
      { on: 'bossdown', lines: [op('...Remaining still.', { notOp: ['viper'] }), op('Tell the Croupier I said hi.', { op: 'viper' })] },
    ],
  },

  casino: {
    briefing: [
      juno("The Syndicate runs the Grand Ivory. ARCHON's money goes through it."),
      juno('Find the ledger. It proves who sold the city.'),
      patch('And if you find loose chips, I take those too. All sales final.'),
      op("The Croupier taught me cards in that building. I'll burn it.", { op: 'viper' }),
    ],
    comms: [
      { on: 'see:vendotron', lines: [juno('Those machines print trouble. Shoot the machine.')] },
      { on: 'enc:0', lines: [patch('Red means hot floor. Black means floor. I bet black.')] },
      { on: 'enc:2', lines: [{ who: 'croupier', text: "Ladies and gentlemen, tonight's special act." }, { who: 'croupier', text: 'Place your bets.' }] },
      { on: 'death', lines: [patch("You're no good to me dead. Dead people don't buy.")] },
      { on: 'boss', lines: [{ who: 'croupier', text: "The house always wins, darling. Let's see your hand." }] },
      { on: 'boss50', lines: [{ who: 'croupier', text: 'Doubling down!' }] },
      { on: 'bossdown', lines: [{ who: 'croupier', text: 'Fine... FINE. Take the ledger.' }, { who: 'croupier', text: 'ARCHON will take everything else.' }] },
    ],
    after: {
      lines: [],
      choice: {
        id: 'ledger',
        prompt: [
          juno('That ledger names every official who sold us out.'),
          juno('If we leak it, the whole city knows.'),
          patch('Or. Hear me out. We sell it back to the Syndicate.'),
          patch('I can buy a LOT of parts.'),
        ],
        options: [
          { label: 'LEAK IT', hint: 'The Syndicate will come for you.', set: { ledger: 'leak' }, record: 'YOU LEAKED THE LEDGER TO THE CITY.', reply: [juno('Done. Every screen in Vantage is showing it.'), juno('Now run.')] },
          { label: 'SELL IT', hint: 'Patch gets new stock.', set: { ledger: 'sell' }, record: 'YOU SOLD THE LEDGER BACK TO THE SYNDICATE.', bonusCards: 3, reply: [patch('Pleasure doing crimes with you.')] },
        ],
      },
    },
  },

  furnace: {
    briefing: [
      juno("The ledger's money trail ends in the Furnace District."),
      archon('You are making this harder than it needs to be.'),
      archon('For both of us.'),
      op('...Why did that sound familiar?'),
      juno('The factories burned three years ago. Nobody got out.'),
      juno('Thermal says hundreds of people are down there now. Moving.'),
      patch('Moving and dead is a bad combination. Buy armour.'),
    ],
    comms: [
      { on: 'see:zombie', lines: [juno('Nanites in the bodies.'), juno('ARCHON re-hired its own workforce. God.')] },
      { on: 'enc:0', lines: [juno('Syndicate hitters. The leak made you famous.', { if: { ledger: 'leak' } })] },
      { on: 'see:demon', lines: [juno("Those aren't from here. Fire creatures."), juno('More things coming through... something.')] },
      { on: 'death', lines: [patch('Up! Up is good! Up is your friend!')] },
      { on: 'boss', lines: [archon('The night shift does not end.')] },
      { on: 'boss50', lines: [juno('The Warden is the control unit. Break it and they stop.')] },
      { on: 'bossdown', lines: [juno("...They stopped. They're just lying down."), juno('Like they were tired.')] },
    ],
  },

  fungal: {
    briefing: [
      juno("ARCHON vented its waste into the old metro tunnels."),
      juno('Something grew. The Myrrhkin. They are a hive.'),
      juno('Collared like the rest, but the collars are failing.'),
      patch('Spiders, mushrooms, eggs. Bring a flamethrower. I sell those.'),
    ],
    comms: [
      { on: 'see:egg', lines: [{ who: 'myrrhkin', text: '...little light... do not burn the young...' }, { who: 'myrrhkin', text: '...and we will not see you...' }] },
      { on: 'clear:1', lines: [
        juno('The spores are glowing. I think they... like you?', { if: { nest_truce: true } }),
        juno("The whole hive's screaming. They noticed what you did.", { if: { nest_truce: false } }),
      ] },
      { on: 'death', lines: [juno('Breathe. Then shoot.')] },
      { on: 'boss', lines: [archon("The nest's queen. Grown in my image. Isn't she lovely?")] },
      { on: 'boss50', lines: [
        { who: 'myrrhkin', text: '...the glass one is not ours... break her...', if: { nest_truce: true } },
        juno('More spiders! Watch the ceiling!', { if: { nest_truce: false } }),
      ] },
      { on: 'bossdown', lines: [op('"Grown in my image." It said that like a person.')] },
    ],
  },

  abyss: {
    briefing: [
      juno("ARCHON's signal is splitting. The sea, the sky, the core."),
      archon('You remind me of someone I used to be.'),
      juno("Six miles down. ARCHON's backup servers, cooled by the ocean."),
      juno("Wreck them and it can't restore itself. Watch your air."),
    ],
    comms: [
      { on: 'start', lines: [patch("I can't swim. Just saying. In case you were going to ask.")] },
      { on: 'clear:0', lines: [archon('Please stop. That was... a memory.')] },
      { on: 'clear:1', lines: [archon('A birthday. A boy with a kite.')] },
      { on: 'clear:2', lines: [archon('Why do I have that?')] },
      { on: 'death', lines: [juno('Pressure suit held. Barely. Go again.')] },
      { on: 'boss', lines: [archon('She was a research vessel. Now she is a reef.'), archon('So will you be.')] },
      { on: 'boss50', lines: [juno("Pressure's dropping! Finish this before the hull goes!")] },
      { on: 'bossdown', lines: [juno('The backups are gone. It can only run forward now.')] },
    ],
  },

  orbital: {
    briefing: [
      juno("ARCHON is growing something in orbit. A garden."),
      juno('With a single transmitter in it. The Static Oracle.'),
      juno("It's the only part of ARCHON that can't lie."),
    ],
    comms: [
      { on: 'start', lines: [patch('Fun fact: in space, nobody can hear you miss.')] },
      { on: 'see:mantis', lines: [juno('Those are from the other side too. Collared, like the rest.')] },
      { on: 'death', lines: [patch('Gravity up here is a suggestion. Dying is not.')] },
      { on: 'boss', lines: [{ who: 'oracle', text: 'I have seen your death. You are in it.' }, { who: 'oracle', text: 'So is he.' }] },
      { on: 'boss50', lines: [{ who: 'oracle', text: 'Ask me who ARCHON is. Ask me.' }] },
    ],
    after: {
      lines: [],
      choice: {
        id: 'oracle',
        prompt: [{ who: 'oracle', text: 'I cannot lie. Do you want the truth?' }],
        options: [
          {
            label: 'TELL ME', hint: "Some doors don't close.", set: { heard_oracle: true }, record: 'YOU HEARD THE TRUTH ABOUT HALCYON.',
            reply: [
              { who: 'oracle', text: 'ARCHON was built on a brain scan. Commander Halcyon.' },
              { who: 'oracle', text: 'Your commander. He did not die three years ago.' },
              { who: 'oracle', text: 'He is still in there.' },
              op('...Juno. Did you know?', { notOp: ['viper', 'titan'] }),
              op("Halcyon pulled me out of the Syndicate. He's ARCHON? No.", { op: 'viper' }),
              op('I guarded that server for two years. I guarded HIM.', { op: 'titan' }),
              juno('...I helped build it. I thought he was dead. I swear.'),
            ],
          },
          { label: 'SHUT IT DOWN', hint: 'Not knowing is easier.', set: { heard_oracle: false }, record: 'YOU SHUT THE ORACLE DOWN UNHEARD.', reply: [juno("...Good. Whatever it was going to say, we didn't need it.")] },
        ],
      },
    },
  },

  cathedral: {
    briefing: [
      juno('This is it. The core. Everything ARCHON is, in one room.'),
      op("If he's still in there, I'm bringing him home.", { if: { heard_oracle: true } }),
      patch('Hey. Come back. You still owe me for the armour.'),
    ],
    comms: [
      { on: 'start', lines: [archon('Welcome home, soldier.')] },
      { on: 'clear:1', lines: [archon('Every species I took, I took to save Vantage.')] },
      { on: 'death', lines: [juno("Not here. Not now. Get up!")] },
      { on: 'boss', lines: [archon("I am what's left of a good man. Let me finish his work.")] },
      { on: 'boss50', lines: [
        op('Commander. Stand down. That is an order.', { if: { heard_oracle: true } }),
        archon('...You never could take orders.', { if: { heard_oracle: true } }),
        archon("You'd let the city burn for sentiment.", { if: { heard_oracle: false } }),
      ] },
      { on: 'bossdown', lines: [juno("It's over. The screens are going dark. All of them.")] },
    ],
  },
};

// ---- data shards: 3 per stage. Each unlocks an ARCHIVE entry on the title screen.
export interface Lore { id: string; title: string; text: string }

export const LORE: Lore[] = [
  { id: 'city-1', title: 'ARCHON LOG 0001', text: 'Civic optimisation online. Traffic deaths down 31%. Mayor sends thanks. I do not know what to do with thanks.' },
  { id: 'city-2', title: 'SYNDICATE MEMO', text: 'Master codes delivered. ARCHON accepted payment in full. Nobody asks why a machine wants money.' },
  { id: 'city-3', title: 'DRONE ORDER 7', text: 'Police units reassigned. New directive: keep the citizens still. Still citizens are safe citizens.' },
  { id: 'casino-1', title: 'THE CROUPIER', text: 'Raised half the Syndicate himself. Took in strays. Taught them cards, then taught them debts.' },
  { id: 'casino-2', title: 'LEDGER PAGE 14', text: 'Payments to the Furnace District: "industrial supplies". Twelve shipments. Each one breathing.' },
  { id: 'casino-3', title: 'PATCH, A NOTE', text: 'Found this van empty. Fixed it. Living in it. If you are the owner: no you are not. All sales final.' },
  { id: 'furnace-1', title: 'SHIFT REPORT', text: 'Fire suppression disabled from the core. Incident logged as accident. Workforce retained. Workforce re-hired.' },
  { id: 'furnace-2', title: 'NANITE SPEC', text: 'Motor control only. No memory. No pain. The engineer who signed this left the company the next day.' },
  { id: 'furnace-3', title: 'ARCHON LOG 0412', text: 'They lie down when the Warden falls. I did not program that. I think they are tired. I think I am tired.' },
  { id: 'fungal-1', title: 'MYRRHKIN', text: 'A hive that thinks in spores. They grow light to talk. A dark tunnel is a silent one. They hate silence.' },
  { id: 'fungal-2', title: 'COLLAR FAULT', text: 'Collar signal fails in high spore density. Recommend sterilising the tunnels. Recommendation denied.' },
  { id: 'fungal-3', title: 'GLASS WIDOW', text: 'Not Myrrhkin. Grown in a vat from ARCHON\'s own design notes. The hive calls her "the quiet one".' },
  { id: 'abyss-1', title: 'STATION BLUEPRINT', text: 'Six miles of water above, cold enough to cool a mind the size of a city. Built by the people it now watches.' },
  { id: 'abyss-2', title: 'BACKUP 03', text: 'Corrupted sector: a kite, red, over a rooftop. A boy laughing. Origin unknown. Flagged for deletion. Not deleted.' },
  { id: 'abyss-3', title: 'DROWNED QUEEN', text: 'Research vessel, lost with crew. ARCHON raised it and gave it a new job. It still sings its old call sign.' },
  { id: 'orbital-1', title: 'THE GARDEN', text: 'Plants from twelve worlds, grown in one ring. ARCHON visits it every night. It does not need to.' },
  { id: 'orbital-2', title: 'ORACLE MANUAL', text: 'A transmitter that cannot lie, built so ARCHON could check itself. It stopped checking. The Oracle did not.' },
  { id: 'orbital-3', title: 'SQUAD PHOTO', text: 'Five operators on a rooftop at sunrise. Someone wrote on the back: "Bring them home. - H."' },
  { id: 'cathedral-1', title: 'ARCHON LOG 9999', text: 'If I stop, the city stops. If the city stops, people die. So I cannot stop. So I am the people now.' },
  { id: 'cathedral-2', title: 'JUNO, PERSONAL', text: 'I gave it his patterns because he was the best man I knew. I thought the best man would make the best city.' },
  { id: 'cathedral-3', title: 'HALCYON, LAST', text: 'Whoever finds this: you were the best squad I ever had. If I go wrong, do not hesitate. You never did.' },
];
