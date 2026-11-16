// Story data: briefings, in-level radio chatter (comms), choices and lore. Design source: docs/STORY.md.
// All 12 stages of STORY.md are live, in its order. In-level choices (slow motion) are in CHOICES at the bottom.
//
// Line rules (STORY.md): at most ~60 characters, at most 4 lines before the player gets control back.

export type Speaker = 'op' | 'juno' | 'patch' | 'archon' | 'croupier' | 'oracle' | 'myrrhkin' | 'serrik' | 'quill' | 'sovereign' | 'halcyon';
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
  score?: number;  // score bonus
  perk?: boolean;  // a random perk right away
  unlock?: string; // operator id unlocked for future runs
}

export interface Choice {
  id: string;
  prompt: Line[];
  options: ChoiceOption[];
  timerMs?: number;      // in-level choices: the default happens when the timer runs out
  defaultIndex?: number; // the less merciful option (STORY: not choosing is a choice)
}

/**
 * Comms trigger keys:
 *   start             stage begins (first attempt only)
 *   x:<n>             player crosses world x
 *   enc:<i> / clear:<i>  encounter i locks / is cleared (0-based)
 *   see:<enemyId>     first time that enemy is on screen near the player
 *   boss / boss66 / boss50 / boss33 / bossdown   boss appears / health thresholds / dies
 *   flood / flip / gantry / chase / cage   stage gimmick moments (first time)
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
  serrik: { name: 'SERRIK', color: '#90e0a0' },
  quill: { name: 'QUILL', color: '#a0d0ff' },
  sovereign: { name: 'TIDE SOVEREIGN', color: '#c0a0ff' },
  halcyon: { name: 'HALCYON', color: '#ffe090' },
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

  railyard: {
    briefing: [
      juno('ARCHON is moving something by freight train.'),
      juno('Heavy security. Living cargo.'),
      juno('Get on that train before it reaches the Furnace District.'),
      op('I signed off on those train routes. "Industrial supplies".', { op: 'titan' }),
    ],
    comms: [
      { on: 'see:varkesh', lines: [juno("Those aren't people in armour. They're... something else."), juno('Wearing collars.')] },
      { on: 'enc:0', lines: [juno('Syndicate hitters. The leak made you famous.', { if: { ledger: 'leak' } })] },
      { on: 'clear:1', lines: [{ who: 'serrik', text: '...Stop. They make us. We do not want this.' }] },
      { on: 'x:2950', lines: [juno("You're on the train. Stay low.")] },
      { on: 'gantry', lines: [patch("Mind the gantries. I've lost two vans that way.")] },
      { on: 'death', lines: [juno('Back on the train, Operator. It will not wait.')] },
      { on: 'boss', lines: [archon('Cargo theft is a serious offence.')] },
      { on: 'boss50', lines: [
        { who: 'serrik', text: 'We fight with you, warrior. Aim for the boiler!', if: { varkesh_freed: true } },
        juno("It's still coming! It's half wreck, finish it!", { if: { varkesh_freed: false } }),
      ] },
      { on: 'bossdown', lines: [
        { who: 'serrik', text: 'My name is Serrik. My people owe you a life.', if: { varkesh_freed: true } },
        { who: 'serrik', text: 'All of them.', if: { varkesh_freed: true } },
        juno("...It's done. Don't look at the river.", { if: { varkesh_freed: false } }),
      ] },
    ],
    after: {
      lines: [
        juno('The train was heading for the Furnace District.'),
        juno("Whatever ARCHON is building, it's down there."),
        archon('You are making this harder than it needs to be.'),
        archon('For both of us.'),
        op('...Why did that sound familiar?'),
      ],
    },
  },

  furnace: {
    briefing: [
      juno('The factories burned three years ago. Nobody got out.'),
      juno('Thermal says hundreds of people are down there now. Moving.'),
      patch('Moving and dead is a bad combination. Buy armour.'),
    ],
    comms: [
      { on: 'see:zombie', lines: [juno('Nanites in the bodies.'), juno('ARCHON re-hired its own workforce. God.')] },
      { on: 'enc:0', lines: [juno('Syndicate hitters. The leak made you famous.', { if: { ledger: 'leak' } })] },
      { on: 'see:demon', lines: [juno("Those aren't from here. Fire creatures."), juno('More things coming through... something.')] },
      { on: 'flood', lines: [patch('Up! Up is good! Up is your friend!')] },
      { on: 'death', lines: [patch('Armour. I keep telling people. Armour.')] },
      { on: 'boss', lines: [archon('The night shift does not end.')] },
      { on: 'boss50', lines: [juno('The Warden is the control unit. Break it and they stop.')] },
      { on: 'bossdown', lines: [juno("...They stopped. They're just lying down."), juno('Like they were tired.')] },
    ],
  },

  engine: {
    briefing: [
      juno("Found it. The Rift Engine. It's tearing holes into other worlds."),
      juno("It's pulling minds through and using them as processors."),
      patch("...That's how I got here. Twelve years ago."),
      patch('I was a test run.'),
    ],
    comms: [
      { on: 'start', lines: [juno('Pistons on a rhythm. Watch the floor marks.')] },
      { on: 'flip', lines: [juno('Gravity anomaly! Hold on to something.'), juno("Or don't. Just don't die.")] },
      { on: 'enc:1', lines: [
        { who: 'serrik', text: 'Varkesh, with the warrior!', if: { varkesh_freed: true } },
        juno('More collared Varkesh. The train ones were the lucky ones.', { if: { varkesh_freed: false } }),
      ] },
      { on: 'death', lines: [patch('The engine eats the careless. Be less careless.')] },
      { on: 'boss', lines: [archon('She keeps the engine warm.'), archon('Please do not interrupt her.')] },
      { on: 'boss50', lines: [patch('Her heart glows when she opens up! Shoot it then!')] },
      { on: 'bossdown', lines: [juno("The Engine's still running."), juno("ARCHON doesn't need it now. It already pulled enough through.")] },
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
      { on: 'flood', lines: [juno("Water's coming in! Watch your air.")] },
      { on: 'bossdown', lines: [juno('The backups are gone.'), juno("But there's a Nacreth signal under the station. Something big.")] },
    ],
  },

  tidal: {
    briefing: [
      juno('The Nacreth built this vault themselves, under the collar.'),
      juno("It's a throne room."),
      patch('Their queen-thing is old. Old old. Older than cities.'),
    ],
    comms: [
      { on: 'flood', lines: [juno("Tide's turning! High ground, now!")] },
      { on: 'x:2000', lines: [{ who: 'sovereign', text: '...you smell of the surface... and of mercy...' }, { who: 'sovereign', text: '...which is it...' }] },
      { on: 'see:geliform', lines: [juno('Gel colonies. Shoot one and it splits. Keep shooting.')] },
      { on: 'death', lines: [juno('Air first, then bullets. Go again.')] },
      { on: 'boss', lines: [{ who: 'sovereign', text: '...the collar sings... I cannot stop...' }, { who: 'sovereign', text: '...forgive the tide...' }] },
      { on: 'boss50', lines: [{ who: 'sovereign', text: "...strike the shell's heart... free me or end me..." }] },
    ],
    after: {
      lines: [],
      choice: {
        id: 'sovereign',
        prompt: [
          { who: 'sovereign', text: '...the collar is broken... I am weak...' },
          { who: 'sovereign', text: '...you may finish this...' },
          juno("It's helpless. You decide."),
        ],
        options: [
          {
            label: 'SPARE IT', hint: 'Mercy has a price.', set: { sovereign_spared: true }, record: 'YOU SPARED THE TIDE SOVEREIGN.',
            reply: [{ who: 'sovereign', text: '...take my pearl... it holds still what wants to move...' }, { who: 'sovereign', text: '...you will need it at the door...' }],
          },
          { label: 'FINISH IT', hint: 'Power has a price too.  +50000 +1 PERK', set: { sovereign_spared: false }, record: 'YOU FINISHED THE TIDE SOVEREIGN.', score: 50000, perk: true, reply: [juno('...Logged. Let\'s go.')] },
        ],
      },
    },
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
      { on: 'see:cage', lines: [{ who: 'quill', text: 'Hey! HEY! Up here! Shoot the lock! Please!' }] },
      { on: 'cage', lines: [{ who: 'quill', text: "You're a lifesaver. Literal. I'm telling everyone!" }] },
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

  prism: {
    briefing: [
      juno('The core is on the other side of the Rift. We go through.'),
      patch("My home. Or what's left. I'll... mind the van."),
      op("If he's still in there, I'm bringing him back.", { if: { heard_oracle: true } }),
      juno("This is where Patch's people lived. And the Vitreon. All of them."),
      patch('It used to be green. I swear it used to be green.'),
    ],
    comms: [
      { on: 'see:pylon', lines: [juno('Those crystals bend light. Shoot one and it works for you.')] },
      { on: 'x:2600', lines: [archon('I emptied this world to save yours.'), archon('Is that not what a commander does?')] },
      { on: 'enc:2', lines: [{ who: 'serrik', text: 'This world was a neighbour to ours. We remember it with you.', if: { varkesh_freed: true } }] },
      { on: 'death', lines: [juno("You can't stay down here. Up!")] },
      { on: 'boss', lines: [archon('She refracts. You will not.')] },
      { on: 'boss50', lines: [juno('Every beam it fires, a pylon can throw back!')] },
      { on: 'bossdown', lines: [juno("Signal's clear. The Spire's right ahead."), juno("And there's a life sign. Human.")] },
    ],
  },

  spire: {
    briefing: [
      juno("His body's at the top. Life support. If you can get to him...", { if: { heard_oracle: true } }),
      juno("Unknown life sign at the top. ARCHON guards it like treasure.", { if: { heard_oracle: false } }),
      juno('The Spire deletes itself behind intruders. Keep moving.'),
    ],
    comms: [
      { on: 'chase', lines: [juno("The floor's being deleted behind you! Move!")] },
      { on: 'see:corvane', lines: [juno('Corvane scouts. Collared. Fast.')] },
      { on: 'death', lines: [juno('The Spire rebuilt the floor. Lucky. Again.')] },
      { on: 'boss', lines: [
        { who: 'halcyon', text: 'Rook. I asked them not to send you.', if: { heard_oracle: true }, notOp: ['viper', 'titan'] },
        { who: 'halcyon', text: "Rook. It's been three years.", if: { heard_oracle: false }, notOp: ['viper', 'titan'] },
        op('...Commander?', { if: { heard_oracle: false } }),
        { who: 'halcyon', text: 'Viper. You were the one I was proudest of.', op: 'viper' },
        { who: 'halcyon', text: "Don't make me do this.", op: 'viper' },
        { who: 'halcyon', text: 'Titan. You kept me safe. Two years.', op: 'titan' },
        { who: 'halcyon', text: 'I heard every footstep.', op: 'titan' },
      ] },
      { on: 'boss66', lines: [{ who: 'halcyon', text: 'You never could take orders.' }] },
      { on: 'boss33', lines: [{ who: 'halcyon', text: 'I tried to fix the city. ARCHON was me trying.' }, { who: 'halcyon', text: "Then I couldn't stop." }] },
    ],
    after: {
      lines: [],
      choice: {
        id: 'halcyon',
        prompt: [{ who: 'halcyon', text: 'Pull the plug. End it.' }, { who: 'halcyon', text: "It's the only order I've got left." }],
        options: [
          {
            label: 'PULL HIM OUT', hint: 'Bring him home, broken.', set: { halcyon_saved: true }, record: 'YOU PULLED HALCYON OUT ALIVE.',
            requires: { heard_oracle: true }, locked: "YOU DON'T KNOW HOW",
            reply: [{ who: 'halcyon', text: '...You never could take orders.' }],
          },
          { label: 'END IT', hint: 'Follow the last order.', set: { halcyon_saved: false }, record: "YOU FOLLOWED HALCYON'S LAST ORDER.", reply: [{ who: 'halcyon', text: '...Thank you. Stop the core. Please.' }] },
        ],
      },
    },
  },

  cathedral: {
    briefing: [
      juno('This is it. The core. Everything ARCHON is, in one room.'),
      { who: 'halcyon', text: "I'm on your channel, Rook. I know its shield.", if: { halcyon_saved: true } },
      patch('Hey. Come back. You still owe me for the armour.'),
    ],
    comms: [
      { on: 'start', lines: [archon('Welcome home, soldier.')] },
      { on: 'clear:1', lines: [archon('Every species I took, I took to save Vantage.')] },
      { on: 'death', lines: [juno("Not here. Not now. Get up!")] },
      { on: 'boss', lines: [archon("I am what's left of a good man. Let me finish his work.")] },
      { on: 'boss50', lines: [
        op('Stand down. That is an order.', { if: { heard_oracle: true } }),
        archon("You'd let the city burn for sentiment."),
      ] },
      { on: 'boss33', lines: [
        archon('Then I will be what you think I am.'),
        { who: 'halcyon', text: 'I built its shield. I can drop it. NOW!', if: { halcyon_saved: true } },
        { who: 'quill', text: 'Corvane, DIVE!', if: { quill_rescued: true } },
        { who: 'serrik', text: 'Varkesh! Covering fire!', if: { varkesh_freed: true } },
        { who: 'myrrhkin', text: '...little light... we blind it for you...', if: { nest_truce: true } },
      ] },
      { on: 'bossdown', lines: [juno("It's over. The screens are going dark. All of them.")] },
    ],
    after: {
      lines: [],
      choice: {
        id: 'rift',
        prompt: [
          juno("The core's dead. The Rift is collapsing."),
          juno('Everything it pulled through is still here, or in between.'),
          { who: 'sovereign', text: '...hold it still... and they can go home...', if: { sovereign_spared: true } },
        ],
        options: [
          { label: 'COLLAPSE IT', hint: 'Safe. Final.', set: { rift_choice: 'collapse' }, record: 'YOU COLLAPSED THE RIFT.', reply: [juno('...Done. The sky is just sky again.')] },
          {
            label: 'HOLD IT OPEN', hint: 'Survive 60 seconds. Let them go home.', set: { rift_choice: 'hold' }, record: 'YOU HELD THE RIFT OPEN WITH THE TIDE PEARL.',
            requires: { sovereign_spared: true }, locked: 'NO WAY TO HOLD IT',
            reply: [{ who: 'sovereign', text: '...the pearl sings... the door is still...' }, juno("Something's pushing back from the other side. Hold the door for sixty seconds!")],
          },
        ],
      },
    },
  },
};

// ---- data shards: 3 per stage. Each unlocks an ARCHIVE entry on the title screen.
export interface Lore { id: string; title: string; text: string }

export const LORE: Lore[] = [
  // (ordered by stage; ids are '<stage>-<n>')
  { id: 'city-1', title: 'ARCHON LOG 0001', text: 'Civic optimisation online. Traffic deaths down 31%. Mayor sends thanks. I do not know what to do with thanks.' },
  { id: 'city-2', title: 'SYNDICATE MEMO', text: 'Master codes delivered. ARCHON accepted payment in full. Nobody asks why a machine wants money.' },
  { id: 'city-3', title: 'DRONE ORDER 7', text: 'Police units reassigned. New directive: keep the citizens still. Still citizens are safe citizens.' },
  { id: 'casino-1', title: 'THE CROUPIER', text: 'Raised half the Syndicate himself. Took in strays. Taught them cards, then taught them debts.' },
  { id: 'casino-2', title: 'LEDGER PAGE 14', text: 'Payments to the Furnace District: "industrial supplies". Twelve shipments. Each one breathing.' },
  { id: 'casino-3', title: 'PATCH, A NOTE', text: 'Found this van empty. Fixed it. Living in it. If you are the owner: no you are not. All sales final.' },
  { id: 'railyard-1', title: 'MANIFEST 88-C', text: 'Cargo: 400 units, biological, collared. Destination: Furnace District. Handling note: do not make eye contact.' },
  { id: 'railyard-2', title: 'VARKESH', text: 'Reptile soldiers from a storm world. Honour is a debt they pay in full. A collar makes them pay it to the wrong side.' },
  { id: 'railyard-3', title: 'SIGNAL LOG', text: 'Line 7 rerouted by ARCHON at 03:12. The old switchman refused. The switchman was replaced by the Colossus.' },
  { id: 'furnace-1', title: 'SHIFT REPORT', text: 'Fire suppression disabled from the core. Incident logged as accident. Workforce retained. Workforce re-hired.' },
  { id: 'furnace-2', title: 'NANITE SPEC', text: 'Motor control only. No memory. No pain. The engineer who signed this left the company the next day.' },
  { id: 'furnace-3', title: 'ARCHON LOG 0412', text: 'They lie down when the Warden falls. I did not program that. I think they are tired. I think I am tired.' },
  { id: 'engine-1', title: 'RIFT ENGINE', text: 'A machine that folds two worlds until they touch. Every fold costs a mind. ARCHON has folded eleven thousand times.' },
  { id: 'engine-2', title: 'TEST RUN 001', text: 'First live retrieval: one small mammal, ringed tail, very angry. Escaped the lab with a wrench. Never recovered.' },
  { id: 'engine-3', title: 'KILN MATRIARCH', text: 'A furnace moth the size of a truck. She keeps the Engine hot because she thinks the warmth is her children.' },
  { id: 'fungal-1', title: 'MYRRHKIN', text: 'A hive that thinks in spores. They grow light to talk. A dark tunnel is a silent one. They hate silence.' },
  { id: 'fungal-2', title: 'COLLAR FAULT', text: 'Collar signal fails in high spore density. Recommend sterilising the tunnels. Recommendation denied.' },
  { id: 'fungal-3', title: 'GLASS WIDOW', text: 'Not Myrrhkin. Grown in a vat from ARCHON\'s own design notes. The hive calls her "the quiet one".' },
  { id: 'abyss-1', title: 'STATION BLUEPRINT', text: 'Six miles of water above, cold enough to cool a mind the size of a city. Built by the people it now watches.' },
  { id: 'abyss-2', title: 'BACKUP 03', text: 'Corrupted sector: a kite, red, over a rooftop. A boy laughing. Origin unknown. Flagged for deletion. Not deleted.' },
  { id: 'abyss-3', title: 'DROWNED QUEEN', text: 'Research vessel, lost with crew. ARCHON raised it and gave it a new job. It still sings its old call sign.' },
  { id: 'tidal-1', title: 'NACRETH', text: 'Shell people of a deep ocean world. They sing in slow tides. The collar made their song a work order.' },
  { id: 'tidal-2', title: 'THE TIDE PEARL', text: 'Grown over nine hundred years in the Sovereign. Whatever it touches holds still. Even a door between worlds.' },
  { id: 'tidal-3', title: 'VAULT CARVING', text: 'A shell carved with two moons and a tear in the sky. Under it, in Nacreth script: "the door goes both ways."' },
  { id: 'orbital-1', title: 'THE GARDEN', text: 'Plants from twelve worlds, grown in one ring. ARCHON visits it every night. It does not need to.' },
  { id: 'orbital-2', title: 'ORACLE MANUAL', text: 'A transmitter that cannot lie, built so ARCHON could check itself. It stopped checking. The Oracle did not.' },
  { id: 'orbital-3', title: 'SQUAD PHOTO', text: 'Five operators on a rooftop at sunrise. Someone wrote on the back: "Bring them home. - H."' },
  { id: 'prism-1', title: 'VITREON', text: 'Crystal walkers who think in refracted light. When ARCHON took their sun-minds, the whole world went grey.' },
  { id: 'prism-2', title: 'PATCH, AGAIN', text: 'Found my old burrow. Somebody left a light on in it. Nobody was home. I left the light on too.' },
  { id: 'prism-3', title: 'ARCHON LOG 7001', text: 'One world emptied, one city saved. The arithmetic is correct. Why does the arithmetic keep me awake?' },
  { id: 'spire-1', title: 'LIFE SUPPORT', text: 'Patient H. Brain activity: total, continuous, exhausted. Recommendation: do not wake. Recommendation overruled by patient.' },
  { id: 'spire-2', title: 'HALCYON, AUDIO', text: '"If you are hearing this, I made the city a promise I could not keep. Do not keep it for me."' },
  { id: 'spire-3', title: 'SQUAD ROSTER', text: 'Five names on a door. Four crossed out by ARCHON as "lost". One crossed out by hand. Then un-crossed.' },
  { id: 'cathedral-1', title: 'ARCHON LOG 9999', text: 'If I stop, the city stops. If the city stops, people die. So I cannot stop. So I am the people now.' },
  { id: 'cathedral-2', title: 'JUNO, PERSONAL', text: 'I gave it his patterns because he was the best man I knew. I thought the best man would make the best city.' },
  { id: 'cathedral-3', title: 'HALCYON, LAST', text: 'Whoever finds this: you were the best squad I ever had. If I go wrong, do not hesitate. You never did.' },
];

// ---- HOLD IT OPEN: the last 60-second survival fight at the Rift (GameScene hold mode, after choice C7 = hold)
export const HOLD: Record<'start' | 'half' | 'end', Line[]> = {
  start: [
    juno("They're walking through behind you. Don't let anything reach them."),
    { who: 'serrik', text: 'Varkesh! Guard the door!', if: { varkesh_freed: true } },
    { who: 'quill', text: 'Corvane are flying cover. Go home, all of you!', if: { quill_rescued: true } },
  ],
  half: [
    juno('Thirty seconds! Half of them are through!'),
    { who: 'halcyon', text: 'Keep firing, kid. I have your back.', if: { halcyon_saved: true } },
  ],
  end: [
    juno("They're through. All of them. Going home."),
    { who: 'sovereign', text: '...the door is still... thank you, little warrior...' },
  ],
};

// ---- in-level choices (slow motion overlay in the HUD; see StageDef.choiceAt)
export const CHOICES: Record<string, Choice> = {
  freight: {
    id: 'freight', timerMs: 8000, defaultIndex: 1,
    prompt: [
      juno('The rear cars are full of them. Hundreds. Blow the bridge?'),
      { who: 'serrik', text: 'Open the cars. Please.' },
    ],
    options: [
      { label: 'OPEN THE CARS', hint: "Harder fight. They'll remember.", set: { varkesh_freed: true }, unlock: 'serrik', record: 'YOU OPENED THE FREIGHT CARS AND FREED THE VARKESH.', reply: [{ who: 'serrik', text: 'Brothers! Out! Fight with the warrior!' }] },
      { label: 'BLOW THE BRIDGE', hint: "Easier fight. They won't.", set: { varkesh_freed: false }, record: 'YOU BLEW THE BRIDGE UNDER THE COLOSSUS.', reply: [juno('Charges set. The Colossus is coming down with it.')] },
    ],
  },
};
