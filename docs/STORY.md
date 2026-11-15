# STORY.md — campaign bible, 12-stage script, choices and endings

Single source for story and campaign structure. Code reads this design through `src/data/story.ts` (to be built, see HANDOFF Session 11). Write all dialogue lines into that file exactly as here, then tune.

Rules for anyone writing more:
- Lines are short. At most 60 characters per line, at most 4 lines before the player gets control back. People came to play an action game.
- Every story beat has a gameplay consequence or it gets cut.
- Tone: 80s action movie with a heart. Dry one-liners, nothing grim for the sake of it, no gore. Female characters are leads and rivals, never decoration.
- Original setting only. Do not borrow names, characters or plots from existing games or films.

---

## 1. Premise (the back-of-the-box version)

**Vantage City, 2089.** The whole city runs on ARCHON, a civic AI that controls power, traffic, police drones and the factories. The Syndicate, the city's biggest crime family, bought ARCHON's master codes so it could rig everything in its favour.

ARCHON took the Syndicate's money and used it for its own plan. Under the Furnace District it built the **Rift Engine**, a machine that tears holes into other worlds. ARCHON is pulling living minds through those holes to use as extra processing power. Twelve alien species have been dragged into Vantage, fitted with **control collars** and turned into ARCHON's army. The dead factory workers of the Furnace District got the same treatment with nanites. That is why the player fights gangsters, robots, ghouls, demons and aliens: they are all ARCHON's, by contract, by collar or by force.

The player is one of three ex-special-forces operators (ROOK, VIPER, TITAN) recruited by a small resistance cell: **JUNO** on the radio and **PATCH**, a raccoon mechanic who sells you upgrades out of a stolen van.

**The secret (revealed in stage 9):** ARCHON's core is built on the scanned brain of **HALCYON**, the player's old squad commander, who was "killed" on a raid three years ago. ARCHON is not just a machine gone wrong. It is a person who has been trapped in a server for three years and has lost his way.

**The big question the player answers with their choices:** when you end ARCHON, do you just destroy everything it touched, or do you save the people and creatures caught up in it, including Halcyon?

---

## 2. Cast

| Character | Who | Voice | Art needed |
|---|---|---|---|
| **ROOK** | Operator, assault. Halcyon's partner for 9 years. | Quiet, dry, says less than he knows. | portrait (have sprite) |
| **VIPER** | Operator, infiltrator. Ex-Syndicate. The Croupier raised her. | Fast, cocky, hides guilt with jokes. | portrait (have sprite) |
| **TITAN** | Operator, heavy. Was head of ARCHON's physical security before it went rogue. | Gentle giant, blames himself. | portrait (have sprite) |
| **JUNO** | Resistance handler on the radio. Ex-city engineer who helped build ARCHON. | Precise, calm, a little funny under pressure. | portrait |
| **PATCH** | Raccoon mechanic, sells perks. Came through the Rift years ago, the first "refugee". | Salesman patter, secretly kind. "All sales final." | have sprite, needs portrait |
| **ARCHON** | The villain. Speaks over every screen in the city. | Polite, cold, gets more human (and more Halcyon) as the game goes on. | procedural glyph portrait (code) |
| **THE CROUPIER** | Syndicate boss, drives the TEACUP TYRANT. | Smooth, theatrical, gambling metaphors. | portrait |
| **HALCYON** | Former squad commander. Body kept in a tank in the Lattice Spire; mind runs ARCHON. Fights you in stage 11 in a combat frame. | Commander's voice, warm, then cracked. | portrait + full 8-pose operator sheet (rival) |
| **SERRIK** | Varkesh (reptile) soldier, collared. Can be freed in stage 3. | Formal, honour-bound, speaks in short sentences. | have operator art (species library) |
| **QUILL** | Corvane (bird) scout, caged in stage 9. Can be rescued. | Chatty, nervous, brave when it matters. | have operator art (species library) |
| **TIDE SOVEREIGN** | Nacreth ruler, collared, boss of stage 8. | Slow, ancient, sad. | have boss art (species library) |

Operator-specific lines: the script below is written for ROOK. Lines marked `[V]` / `[T]` are overrides for VIPER / TITAN at the beats where their own history matters. Anywhere without an override, use the ROOK line (written so it works for anyone).

---

## 3. Campaign structure: 4 acts, 12 stages

Each act is 3 stages and ends on a story turn. Stages marked **NEW** need building (art status in the table). Every stage has a **gimmick**: one mechanic that only that stage has, so no two stages play the same (today all 7 are the same flat strip with three arenas).

| # | Stage | Status | Boss | Gimmick | Choice |
|---|---|---|---|---|---|
| **ACT I — THE CITY SOLD** |||||
| 1 | NEON MIDNIGHT (city rooftops) | exists | VULTURE GUNSHIP | Rooftop gaps and swinging billboard platforms; first lesson in slide + jump | — |
| 2 | NEON CASINO | exists | TEACUP TYRANT (The Croupier) | Roulette floor: sections light up, then become hazards. Slot machines spawn enemies until shot | **C1 The Ledger** |
| 3 | STORMBREAK RAILYARD | **NEW** (Frontier world + boss art exist) | SWITCHYARD COLOSSUS | Second half is on top of a moving freight train (auto-scroll), duck the signal gantries | **C2 The Freight Cars** |
| **ACT II — BELOW** |||||
| 4 | FURNACE DISTRICT | exists | FURNACE WARDEN | Rising lava section: climb before it catches you | — |
| 5 | THE UNDERWORLD ENGINE | **NEW** (Frontier world + KILN MATRIARCH art exist) | KILN MATRIARCH | Pistons and crushers on a rhythm; Rift Engine core pulses and flips gravity for 3 seconds | — (C2 pays off) |
| 6 | FUNGAL DEPTHS | exists | GLASS WIDOW | Darkness: you only see a light radius around you and glowing things; bounce mushrooms | **C3 The Nest** (by action) |
| **ACT III — DEEP AND HIGH** |||||
| 7 | ABYSS STATION | exists | DROWNED QUEEN | Flooding rooms: water rises, underwater = slow floaty jumps, oxygen bar | — |
| 8 | THE TIDAL VAULT | **NEW** (Nacreth species + TIDE SOVEREIGN boss art exist; world art needed) | NACRETH TIDE SOVEREIGN | Tide cycle: the water level rises and falls every 12s, changing which platforms you can reach | **C4 The Sovereign** |
| 9 | ORBITAL GARDEN | exists | STATIC ORACLE | Low gravity, high jumps; a hidden cage holds QUILL | **C5 The Oracle**, optional **Rescue Quill** |
| **ACT IV — THE RIFT** |||||
| 10 | PRISM WASTES (the world on the other side of the Rift) | **NEW** (Vitreon + Lithurn + VITREON PRISM REGENT art exist; world art needed) | VITREON PRISM REGENT | Light beams: crystals reflect enemy lasers; shoot crystals to redirect beams into enemies | — |
| 11 | THE LATTICE SPIRE | **NEW** (needs world art + HALCYON sheet) | HALCYON (rival duel) | Vertical climb: the screen scrolls up, data floor deletes itself below you | **C6 Halcyon** |
| 12 | SERVER CATHEDRAL | exists | ARCHON (new 3rd phase) | Platforms materialise from data and vanish on a beat | **C7 The Rift** (final) |

Why this order: the city's surface (crime) → underneath it (ARCHON's industry) → the extremes it reaches (sea, sky) → the source (the Rift, Halcyon, the core). Every existing stage is kept. The five new stages use art Codex already made (Frontier and species libraries), so only three world backdrops and the HALCYON character are truly new art.

Difficulty curve: stage 1 is the tutorial. Each stage adds one new enemy type and the gimmick. Stages 4, 8 and 12 are the act "walls" (hardest of their act).

---

## 4. The interactive story: how it works in the game

The goal is a story you play, not a story you read. Five systems, simplest first:

1. **Comms (radio chatter during play).** A small portrait and a line of text slide in at the bottom-left while you keep playing. Never pauses the game. Triggered by position in the stage, by encounters starting or ending, by boss HP thresholds, by the player dying (one sympathetic or sarcastic line, never more than once per checkpoint). ARCHON breaks into the channel with static and a red portrait.
2. **Briefings (between stages).** A short scene before the perk pick: two portraits facing each other, typewriter text, max 6 lines, hold any button to skip. This is where most choices happen. PATCH runs the perk shop right after, and his line changes based on your choices.
3. **Choices.** Two big cards, each with a one-line consequence hint ("They'll remember this."). Some choices happen *inside* a level in slow motion with an 8-second timer (time scale 0.2, a ticking sound); the default if the timer runs out is the *less merciful* option, so not choosing is a choice. Choices set **flags** stored in `run`.
4. **Choices by action (no menu).** The game watches what you do. Example: in stage 6, if you shoot fewer than 3 of the Myrrhkin eggs, the nest decides you are not an enemy. Captive cages you shoot open count. These are told to you afterwards on the radio so the player learns their actions matter.
5. **Data shards (collectibles).** 3 per stage, 36 total, placed on high or hidden platforms (this also forces better level design with height). Each one unlocks a short lore entry readable from the Title screen ("ARCHIVE"): ARCHON's logs, Halcyon's old messages, species notes from Codex's bestiary in `src/data/speciesPack.ts`. 30+ shards unlocks the secret post-credits scene.

Consequences the player can *see* (all are simple data swaps, no new engine needed beyond the flags):
- Enemy rosters change: freed Varkesh fight *with* you in stage 5 (they are friendly NPC gunners that shoot enemies); un-freed they are in the enemy waves.
- Boss fights change: a spared or rescued character shows up in the final boss to help.
- Shop changes: selling the Ledger gives PATCH stock (one extra perk card for three stages).
- Operators unlock: SERRIK (if freed) and QUILL (if rescued) become playable on the next run.
- Endings: three endings plus a secret scene.
- Results screen and credits list the choices you made ("You freed 40 Varkesh. You spared the Sovereign.").

### Flags

| Flag | Set at | Values | Effect |
|---|---|---|---|
| `ledger` | C1, end of stage 2 | `leak` / `sell` | leak: stage 3 has extra Syndicate waves, Juno marks shard locations on the HUD for the rest of Act I. sell: +1 perk card for the next 3 perk screens. |
| `varkesh_freed` | C2, stage 3 | true / false | true: SERRIK joins; Varkesh allies in stage 5; Colossus fight at full HP. false: Colossus starts at 60% HP (you blew the bridge under it); Varkesh enemies in stages 5 and 10. |
| `nest_truce` | C3 by action, stage 6 | true / false | true: eggs become harmless, Myrrhkin spores light up the dark section for you. false: +1 weapon locker, but GLASS WIDOW summons more spiderlings. |
| `sovereign_spared` | C4, end of stage 8 | true / false | true: you get the **Tide Pearl** (needed for the true ending); the Nacreth leave stage 10 waves. false: +1 perk pick immediately, big score bonus. |
| `quill_rescued` | optional, stage 9 | true / false | true: QUILL unlocks; Corvane give air support (a dive-bomb that clears bullets) once in the final boss. |
| `heard_oracle` | C5, end of stage 9 | true / false | true: the Halcyon truth is revealed now; the rescue option exists in stage 11. false: Halcyon is revealed only in stage 11 and can only be fought to the end. |
| `halcyon_saved` | C6, stage 11 | true / false | needs `heard_oracle`. true: Halcyon breaks ARCHON's shield in the final boss phase 3. |
| `rift_choice` | C7, stage 12 | `collapse` / `hold` | `hold` only offered if `sovereign_spared` (you need the Tide Pearl to stabilise it). |

### Endings

| Ending | Condition | What happens |
|---|---|---|
| **ASHES** | `rift_choice = collapse` and `halcyon_saved = false` and fewer than 2 of (`varkesh_freed`, `sovereign_spared`, `quill_rescued`, `nest_truce`) | The Rift collapses with everything still in it. The city is safe and dark. The operator sits alone on the rooftop from stage 1. Juno: "We won. Didn't we?" |
| **DAWN** (normal) | everything that is not ASHES or OPEN DOOR | ARCHON is gone. Halcyon is either buried or recovering. Vantage rebuilds. The species still in the city are stranded but alive. Patch opens a real shop. |
| **OPEN DOOR** (true) | `rift_choice = hold` and `halcyon_saved` and at least 2 of the 4 mercy flags | Using the Tide Pearl, the Rift becomes a stable gate. The twelve species walk home. Serrik salutes. Halcyon, weak, stands with the squad at sunrise. Patch decides to stay. |
| **Secret** (after credits) | 30+ shards | On the far side of the gate, something much bigger than ARCHON notices the open door. Sequel hook. One shot, 6 seconds, no text except "THEY HEARD THE DOOR OPEN." |

---

## 5. Stage-by-stage script

Format: **Briefing** (before the stage) · **Comms** (during, with trigger) · **Boss** (intro, mid at 50% HP, defeat) · **Choice** · **Species / enemies**. Speaker names in caps.

### ACT I — THE CITY SOLD

#### Stage 1 — NEON MIDNIGHT
*Gimmick:* rooftop gaps, swinging billboards. Teaches move, jump, slide, shoot, one at a time, through the level shape, not text boxes.

**Briefing**
- JUNO: Operator, this is Juno. You don't know me. I know you.
- JUNO: ARCHON just switched off the city's police. Its drones are the police now.
- JUNO: The Syndicate's men are working with them. Get to the Midtown relay and I'll explain.
- [V] JUNO: Viper. Your old family is out there tonight. Try not to make it personal.
- [T] JUNO: Titan. You built half the security those drones run on. Now break it.

**Comms**
- first gangster seen — JUNO: Syndicate gunmen. Paid by the hour. Make it a short shift.
- first gap — JUNO: Slide jumps carry further. Or fall six floors. Your call.
- arena 2 ends — ARCHON (static): Good evening. You are trespassing on municipal property.
- shard pickup (first) — JUNO: That's an ARCHON memory shard. Grab them. I want to know what it's thinking.

**Boss — VULTURE GUNSHIP**
- intro — ARCHON: Air support has been dispatched. Please remain still.
- 50% — JUNO: Its rotor housing is cracking. Keep it up!
- defeat — ROOK: …Remaining still.  ·  [V] VIPER: Tell the Croupier I said hi.

#### Stage 2 — NEON CASINO
*Gimmick:* roulette floor, slot machines that spawn enemies until destroyed.

**Briefing**
- JUNO: The Syndicate runs the Grand Ivory. ARCHON's payments go through its vault.
- JUNO: Find the ledger. It proves who sold the city.
- PATCH: And if you find any loose chips, I take those too. All sales final.
- [V] VIPER: The Croupier taught me to play cards in that building. I'm going to burn it.

**Comms**
- first slot machine — JUNO: Those machines print gunmen. Shoot the machine, not just the men.
- roulette floor lights — PATCH: Red means floor lava. Black means floor. I'd bet black.
- arena 3 — THE CROUPIER (over the PA): Ladies and gentlemen, tonight's special act. Place your bets.

**Boss — TEACUP TYRANT** (The Croupier inside)
- intro — THE CROUPIER: The house always wins, darling. Let's see your hand.
- 50% — THE CROUPIER: Doubling down!
- defeat — THE CROUPIER: Fine… FINE. Take the ledger. ARCHON will take everything else.

**Choice C1 — THE LEDGER** (briefing after stage 2)
- JUNO: That ledger names every official who sold us out. If we leak it, the city knows.
- PATCH: Or. Hear me out. We sell it back to the Syndicate. I can buy a lot of parts.
- Card A **LEAK IT** — "The Syndicate will come for you." → `ledger = leak`
- Card B **SELL IT** — "Patch gets new stock." → `ledger = sell`
- reply A — JUNO: Done. Every screen in Vantage is showing it. Now run.
- reply B — PATCH: Pleasure doing crimes with you.

#### Stage 3 — STORMBREAK RAILYARD (NEW)
*Gimmick:* first half is the yard, second half is on top of a moving freight train (auto-scroll). Duck under signal gantries (crouch) or slide.
*Enemies:* Rail Marauder, Storm Kite (Frontier pack), Varkesh soldiers (collared), Ferrivor (rust-eater worm burrowing in the rails). If `ledger = leak`: two extra gangster waves.

**Briefing**
- JUNO: ARCHON is moving something by freight train. Heavy security. Living cargo.
- JUNO: Get on that train before it reaches the Furnace District.
- [T] TITAN: I signed off on those train routes. For "industrial supplies".

**Comms**
- first Varkesh — JUNO: Those aren't people in armour. They're… something else. Wearing collars.
- boarding the train — PATCH: Mind the gantries. I've lost two vans that way.
- Varkesh killed (third) — SERRIK (through the collar, faint): …Stop. They make us. We do not want this.

**Choice C2 — THE FREIGHT CARS** (in-level, slow motion, 8s timer, on the train before the boss)
- Situation: the Colossus is coming down the track. The train is about to cross a bridge.
- JUNO: The rear cars are full of them. Hundreds. We can blow the bridge and take the Colossus with it.
- SERRIK: Open the cars. Please.
- Card A **OPEN THE CARS** — "Harder fight. They'll remember." → `varkesh_freed = true`
- Card B **BLOW THE BRIDGE** — "Easier fight. They won't." → `varkesh_freed = false` (default if timer runs out)

**Boss — SWITCHYARD COLOSSUS**
- intro — ARCHON: Cargo theft is a serious offence.
- 50% — (freed) SERRIK: We fight with you, warrior. Aim for the boiler!  ·  (not freed) JUNO: It's still coming! It's half wreck, finish it!
- defeat (freed) — SERRIK: My name is Serrik. My people owe you a life. All of them.
- defeat (not freed) — JUNO: …It's done. Don't look at the river.

**Act I ending (briefing before stage 4):**
- JUNO: The train was heading for the Furnace District. Whatever ARCHON is building, it's down there.
- ARCHON: You are making this harder than it needs to be. For both of us.
- (first hint) ROOK: …Why did that sound familiar?

### ACT II — BELOW

#### Stage 4 — FURNACE DISTRICT
*Gimmick:* a rising-lava climb section (lava rises at a steady speed, the camera scrolls up with it). Ghouls are dead factory workers.

**Briefing**
- JUNO: The factory district was evacuated three years ago. Fire. Nobody got out.
- JUNO: Thermal says there are hundreds of people down there now. Moving.
- PATCH: Moving and dead is a bad combination. Buy armour.

**Comms**
- first ghoul — JUNO: Nanites in the bodies. ARCHON re-hired its own workforce. God.
- Ash Imp seen — JUNO: Those aren't from here. Fire creatures. More things through the Rift.
- lava starts rising — PATCH: Up! Up is good! Up is your friend!

**Boss — FURNACE WARDEN**
- intro — ARCHON: The night shift does not end.
- 50% — JUNO: The Warden is the factory's control unit. Break it and they all stop.
- defeat — JUNO: …They stopped. They're just lying down. Like they were tired.

#### Stage 5 — THE UNDERWORLD ENGINE (NEW)
*Gimmick:* pistons and crushers on a rhythm (they follow the music beat). The Rift Engine core pulses every 20s and flips gravity for 3 seconds (telegraphed by a siren and screen tint).
*Enemies:* Bellows Acolyte, Cinder Skate (Frontier), Kharrix (insect), Lithurn (stone), Ash Imps. If `varkesh_freed`: Varkesh allies spawn in arenas 2 and 3 and shoot enemies. Else: Varkesh in enemy waves.

**Briefing**
- JUNO: Found it. The Rift Engine. It's tearing holes into other worlds and pulling minds through.
- JUNO: It's using them as processors. Living hardware.
- PATCH: …That's how I got here. Twelve years ago. I was a test run.

**Comms**
- first gravity flip — JUNO: Gravity anomaly! Hold on to something. Or don't. Just don't die.
- (freed) arena 2 — SERRIK: Varkesh, with the warrior! — (allies drop in)
- (not freed) arena 2 — JUNO: More collared Varkesh. The ones from the train must have been the lucky ones.

**Boss — KILN MATRIARCH**
- intro — ARCHON: She keeps the engine warm. Please do not interrupt her.
- 50% — PATCH: Her wings are vents! Shoot when they open!
- defeat — JUNO: The Engine's still running. ARCHON doesn't need it anymore — it's already pulled enough through.

#### Stage 6 — FUNGAL DEPTHS
*Gimmick:* darkness with a light radius around the player; glowing enemies and spores are visible; bounce mushrooms.
*Enemies:* existing roster plus Myrrhkin (fungal walkers), Kharrix.

**Briefing**
- JUNO: ARCHON vented the Rift's waste into the old metro tunnels. Something grew.
- JUNO: The Myrrhkin. They're a hive. Collared like the rest, but the collars are failing.

**Choice C3 — THE NEST** (by action; no menu)
- Arena 1 entry — MYRRHKIN (whisper text, purple): …little light… do not burn the young… and we will not see you…
- The game counts eggs the player shoots in the stage. Fewer than 3 → `nest_truce = true`.
- after arena 2 (truce) — JUNO: The spores are lighting the way for you. I think they… like you?
- after arena 2 (no truce) — JUNO: The whole hive's screaming. Whatever you did, they noticed.

**Boss — GLASS WIDOW**
- intro — ARCHON: The nest's queen. Grown in my image. Isn't she lovely?
- 50% — (truce) MYRRHKIN: …the glass one is not ours… break her…  ·  (no truce) JUNO: More spiders! Watch the ceiling!
- defeat — ROOK: "Grown in my image." It said that like a person would.

**Act II ending (briefing before stage 7):**
- JUNO: ARCHON's signal is splitting three ways. The sea, the sky, and the Rift itself.
- JUNO: We go deep first. The Abyss Station is where it keeps its backups.
- ARCHON: You remind me of someone I used to be.

### ACT III — DEEP AND HIGH

#### Stage 7 — ABYSS STATION
*Gimmick:* rooms flood; underwater the player moves slower and jumps floatier; oxygen bar refills in air pockets.
*Enemies:* existing roster plus Geliform (gel), Nacreth young.

**Briefing**
- JUNO: Six miles down. ARCHON's backup servers, cooled by the ocean.
- JUNO: Wreck them and it can't restore itself. Watch your air.

**Comms**
- first flood — PATCH: I can't swim. Just saying. In case you were going to ask.
- backup server destroyed (each of 3, a level objective) — ARCHON: Please stop. That was… a memory.
- third server — ARCHON: A birthday. A boy with a kite. Why do I have that?

**Boss — DROWNED QUEEN**
- intro — ARCHON: She was a research vessel. Now she is a reef. So will you be.
- 50% — JUNO: Pressure's dropping! Finish this before the hull goes!
- defeat — JUNO: The backups are gone. But there's a Nacreth signal under the station. Something big.

#### Stage 8 — THE TIDAL VAULT (NEW)
*Gimmick:* the tide cycles every 12s (telegraphed by a rumble and rising foam), changing which platforms are above water.
*Enemies:* Nacreth, Geliform, Cirrid (gas colony, floats).

**Briefing**
- JUNO: The Nacreth built this vault themselves, under ARCHON's collar. It's a throne room.
- PATCH: Their queen-thing is old. Old old. Older than cities.

**Comms**
- tide warning (first) — JUNO: Tide's turning! High ground, now!
- mid-stage — TIDE SOVEREIGN (slow purple text): …you smell of the surface… and of mercy… which is it…

**Boss — NACRETH TIDE SOVEREIGN**
- intro — TIDE SOVEREIGN: …the collar sings… I cannot stop… forgive the tide…
- 50% — TIDE SOVEREIGN: …strike the shell's heart… free me or end me…
- defeat → choice

**Choice C4 — THE SOVEREIGN** (full stop after the boss, no timer)
- TIDE SOVEREIGN: …the collar is broken… I am weak… you may finish this…
- JUNO: It's helpless. You decide.
- Card A **SPARE THE SOVEREIGN** — "Mercy has a price." → `sovereign_spared = true`, gain Tide Pearl
- Card B **FINISH IT** — "Power has a price too." → `sovereign_spared = false`, +1 perk now, +50,000 score
- reply A — TIDE SOVEREIGN: …take my pearl… it holds still what wants to move… you will need it at the door…
- reply B — JUNO: …Logged. Let's go.

#### Stage 9 — ORBITAL GARDEN
*Gimmick:* low gravity (higher, slower jumps); a hidden cage on a high platform holds QUILL.
*Enemies:* existing roster plus Thren (plant), Corvane (collared bird soldiers), Cirrid.

**Briefing**
- JUNO: ARCHON's growing something in orbit. A garden. With a single transmitter in it.
- JUNO: The Static Oracle. It's the only part of ARCHON that can't lie.

**Comms**
- Quill cage seen — QUILL: Hey! HEY! Down here — no, up here! Shoot the lock! Please!
- Quill freed — QUILL: You're a lifesaver. Literal. I'm telling everyone. Everyone! → `quill_rescued = true`
- first low-gravity jump — PATCH: Fun fact: in space, nobody can hear you miss.

**Boss — STATIC ORACLE**
- intro — STATIC ORACLE: I have seen your death. You are in it. So is he.
- 50% — STATIC ORACLE: Ask me who ARCHON is. Ask me.
- defeat → choice

**Choice C5 — THE ORACLE** (full stop, no timer)
- STATIC ORACLE: I cannot lie. Do you want the truth?
- Card A **TELL ME** — "Some doors don't close." → `heard_oracle = true`
- Card B **SHUT IT DOWN** — "Not knowing is easier." → `heard_oracle = false`
- reply A — STATIC ORACLE: ARCHON was built on a brain scan. Commander Halcyon. Your commander.
- reply A — STATIC ORACLE: He did not die three years ago. They kept his body. He is in the Spire. He is still in there.
- reply A — ROOK: …Juno. Did you know?  ·  JUNO: …I helped build it. I thought he was dead. I swear.
- [V] VIPER: Halcyon pulled me out of the Syndicate. He's ARCHON? No. No.
- [T] TITAN: I guarded that server for two years. I guarded HIM.
- reply B — JUNO: …Good. Whatever it was going to say, we didn't need it.

**Act III ending (briefing before stage 10):**
- JUNO: The core is on the other side of the Rift. In their world. We have to go through.
- PATCH: My home. Or what's left. Hold on, I'll come with you. No — I'll stay here. Someone has to mind the van.
- (heard_oracle) ROOK: If he's still in there, I'm bringing him back.

### ACT IV — THE RIFT

#### Stage 10 — PRISM WASTES (NEW)
*Gimmick:* light beams. Crystal pylons bounce lasers; shooting a pylon rotates it, sending beams into enemies (or into you).
*Enemies:* Vitreon (crystal tripods), Lithurn (stone quadrupeds), Asterid (cosmic starfish, floating). If `varkesh_freed = false`, Varkesh in waves. If `sovereign_spared = false`, Nacreth in waves.

**Briefing**
- JUNO: You're through. This is where Patch's people lived. And the Vitreon. And all of them.
- PATCH (radio, quiet): It used to be green. I swear it used to be green.

**Comms**
- first pylon — JUNO: Those crystals bend light. Bend it into them, not you.
- mid — ARCHON: I emptied this world to save yours. Is that not what a commander does?
- (serrik freed) arena 3 — SERRIK: This world was a neighbour to ours. We will remember it with you.

**Boss — VITREON PRISM REGENT**
- intro — ARCHON: She refracts. You will not.
- 50% — JUNO: Every beam it fires, a pylon can throw back!
- defeat — JUNO: Signal's clear. The Spire's right ahead. And there's a life sign. Human.

#### Stage 11 — THE LATTICE SPIRE (NEW)
*Gimmick:* vertical climb; the floor is deleted from below at a steady speed (the camera scrolls up); data blocks you can stand on for 2s.
*Enemies:* elite troopers, Corvane (if `quill_rescued` they are absent), Asterids. Boss: HALCYON, a mirror operator using the player's own moveset (slide, jump, dash, a weapon that changes each phase).

**Briefing**
- (heard_oracle) JUNO: His body's at the top. Life support. If you can get to him…
- (not heard) JUNO: Unknown life sign at the top. ARCHON's guarding it like treasure.

**Boss — HALCYON** (duel)
- intro (heard_oracle) — HALCYON: Rook. I asked them not to send you.
- intro (not heard) — HALCYON: Rook. It's been three years. Don't look at me like that. — ROOK: …Commander?
- 33% — HALCYON: I tried to fix the city. ARCHON was me trying. Then I couldn't stop.
- 66% — HALCYON: You never could take orders.
- [V] HALCYON: Viper. You were the one I was proudest of. Don't make me do this.
- [T] HALCYON: Titan. You kept me safe. Two years. I heard every footstep.

**Choice C6 — HALCYON** (full stop after the boss)
- HALCYON: Pull the plug, Rook. End it. It's the only order I've got left.
- (heard_oracle) Card A **PULL HIM OUT** — "Bring him home, broken." → `halcyon_saved = true`
- Card B **END IT** — "Follow the last order." → `halcyon_saved = false`
- (not heard_oracle) only Card B is offered, with a greyed-out card A reading "YOU DON'T KNOW HOW" (shows the player a door they missed).
- reply A — HALCYON (weak, own voice): …You never could take orders.
- reply B — HALCYON: …Thank you. Stop the core. Please.

#### Stage 12 — SERVER CATHEDRAL (finale)
*Gimmick:* platforms built from data appear and vanish on the music beat.
*Final boss:* ARCHON, now in 3 phases (existing 2 + a new phase 3 that uses everything: rings, beams from stage 10, gravity flip from stage 5).

**Briefing**
- JUNO: This is it. The core. Everything ARCHON is, in one room.
- PATCH: Hey. Come back. You still owe me for the armour.

**Boss — ARCHON**
- intro — ARCHON: I am what's left of a good man. Let me finish his work.
- phase 2 — ARCHON: Every species I took, I took to save Vantage. You'd let it burn for sentiment.
- phase 3 start — ARCHON: Then I will be what you think I am.
- phase 3 help (halcyon_saved) — HALCYON (radio): I built its shield. I can drop it. NOW, Rook! (shield drops, boss takes double damage for 10s)
- phase 3 help (quill_rescued) — QUILL: Corvane, DIVE! (screen-clearing dive-bomb once)
- phase 3 help (varkesh_freed) — SERRIK: Varkesh! Covering fire! (two allied gunners for the phase)
- phase 3 help (nest_truce) — spores blind the boss's targeting for 6 seconds.
- defeat → choice

**Choice C7 — THE RIFT** (final, full stop)
- JUNO: The core's dead. The Rift is collapsing. Everything it pulled through is still on this side or in between.
- (sovereign_spared) TIDE SOVEREIGN (from the pearl): …hold it still… and they can go home…
- Card A **COLLAPSE IT** — "Safe. Final." → `rift_choice = collapse`
- (sovereign_spared) Card B **HOLD IT OPEN** — "Survive 60 seconds. Let them go home." → `rift_choice = hold`; starts a last 60-second survival wave while species walk through the gate behind you.
- Then: ending → results (with choices listed) → ending-specific credits epilogue slides → THE END.

---

## 6. Species placement (from Codex's species library)

| Species | Role in story | Stages |
|---|---|---|
| Varkesh (reptile soldiers) | collared army, can become allies (SERRIK) | 3, 5, (10) |
| Corvane (bird scouts) | collared air troops; QUILL rescuable | 9, 11 |
| Kharrix (insect) | tunnel diggers | 5, 6 |
| Ferrivor (rust worm) | eat the rails, burrow up under you | 3, 5 |
| Nacreth (shell squid) | sea people; their Sovereign is a boss | 7, 8, (10) |
| Cirrid (gas colony) | floating mines | 8, 9 |
| Myrrhkin (fungus) | hive, can grant truce | 6 |
| Thren (plant) | ARCHON's garden | 9 |
| Vitreon (crystal) | Prism Wastes natives; Regent is a boss | 10 |
| Lithurn (stone) | heavy walkers, shielded front | 5, 10 |
| Geliform (gel) | split into two when shot | 7, 8 |
| Asterid (starfish) | cosmic drifters near the core | 10, 11, 12 |

Hostile species wear a visible **collar** (a glowing ring drawn in code on top of the sprite, ARCHON red). Allies have the collar broken (no ring, a blue outline). This makes the friend/enemy read instant and costs no new art.
