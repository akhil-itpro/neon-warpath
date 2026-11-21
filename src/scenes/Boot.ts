import Phaser from 'phaser';
import { newRun, run } from '../systems/Run';
import { STAGES } from '../data/stages';
import { DROP_WEAPONS } from '../data/weapons';
import { collectWeapon } from '../systems/Loadout';

// Loads every PNG listed in public/assets/manifest.json (written by tools/process_assets.py)
// and draws all the small procedural textures (bullets, glows, tiles, crates, the ARCHON core).
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.json('manifest', 'assets/manifest.json');
    this.load.once('filecomplete-json-manifest', () => {
      const m = this.cache.json.get('manifest') as { images: string[] };
      for (const k of m.images) this.load.image(k, `assets/${k}.png`);
    });
  }

  create() {
    this.makeTextures();
    // Debug shortcuts (used by tools/smoke.mjs and for playtesting):
    //   ?stage=2        start on stage 2 (1-based) or ?stage=furnace (stage id)      &boss=1  jump straight to the boss
    //   &hold=1  the HOLD IT OPEN survival finale
    //   &god=1          near-unkillable                 &op=1    operator index     &weapon=rocket
    const q = new URLSearchParams(location.search);
    if (q.has('stage')) {
      newRun(Number(q.get('op') ?? 0));
      const byId = STAGES.findIndex((s) => s.id === q.get('stage')); // ?stage=fungal or ?stage=4
      run.stage = byId >= 0 ? byId : Phaser.Math.Clamp(Math.trunc(Number(q.get('stage')) || 1) - 1, 0, STAGES.length - 1);
      const st = STAGES[run.stage];
      if (q.has('boss')) { run.checkpoint = st.encounters.length; run.checkpointX = st.width - 560; }
      if (q.has('god')) { run.stats.maxHp = 9999; run.hp = 9999; }
      if (q.get('regen') === '0') (window as any).__noRegen = true;
      const weapon = q.get('weapon');
      if (weapon && DROP_WEAPONS.includes(weapon)) collectWeapon(run.loadout, weapon, 999);
      if (q.has('hold')) { run.flags.rift_choice = 'hold'; this.scene.start('Game', { hold: true }); return; } // &hold=1 : the HOLD IT OPEN finale
      this.scene.start('Game');
      return;
    }
    this.scene.start('Title');
  }

  private canvas(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
    const t = this.textures.createCanvas(key, w, h)!;
    draw(t.getContext());
    t.refresh();
  }

  // Per-stage floor + girder tiles, so no two worlds share the same grey strip.
  // [top highlight, lip, face, face dark, deep, detail, trim stripe]
  private makeStageTiles(px: (c: CanvasRenderingContext2D, col: string, x: number, y: number, w?: number, h?: number) => void) {
    const T: Record<string, string[]> = {
      city:      ['#7a86a4', '#3a4460', '#1a1e2c', '#10131d', '#0a0c14', '#2c3550', '#f0b020'],
      casino:    ['#ffb0e0', '#a02870', '#3a1030', '#240a20', '#14061a', '#6a2058', '#ffd060'],
      furnace:   ['#ffb060', '#8a4a28', '#3a2018', '#241410', '#120a08', '#5a3020', '#ff6a20'],
      fungal:    ['#80ffc0', '#2a8a70', '#14362c', '#0c2420', '#06120f', '#1c5a48', '#a0ff60'],
      abyss:     ['#80d0ff', '#2a6a9a', '#10304a', '#0a2036', '#050f1c', '#1a4a70', '#40e0ff'],
      orbital:   ['#e0f0ff', '#8a9ab8', '#38465c', '#26303f', '#141a24', '#566680', '#60ff90'],
      cathedral: ['#ff9080', '#8a2a38', '#2e1018', '#1c0a10', '#0e0508', '#561a28', '#ffc040'],
      railyard:  ['#a0b0d0', '#4a5a7a', '#1e2638', '#141a28', '#0a0e18', '#34405a', '#ffb040'],
      engine:    ['#ff9a60', '#7a3a20', '#2e1a14', '#1e100c', '#100806', '#4a2418', '#ff4a10'],
      tidal:     ['#90f0e0', '#2a8a8a', '#0e3640', '#08242c', '#041418', '#1a5058', '#40e0d0'],
      prism:     ['#e0d0ff', '#7a6aa8', '#2e2648', '#1e1832', '#0e0a1a', '#4a3e70', '#90e8ff'],
      spire:     ['#c0c0ff', '#5a5aa8', '#1e1c44', '#14122e', '#08061a', '#34306a', '#ff4060'],
    };
    let seed = 7;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (const st of STAGES) {
      const [hi, lip, face, dark, deep, det, trim] = T[st.id] ?? T.city;
      // painted tiles in the manifest (ground_<id>.png, plat_<id>.png) replace these code-drawn ones
      if (!this.textures.exists(`ground_${st.id}`)) this.canvas(`ground_${st.id}`, 32, 40, (c) => {
        px(c, deep, 0, 0, 32, 40); px(c, dark, 0, 7, 32, 14); px(c, face, 0, 2, 32, 6);
        px(c, lip, 0, 1, 32, 1); px(c, hi, 0, 0, 32, 1);
        px(c, hi, 3, 0, 7, 1); px(c, '#ffffff', 5, 0, 2, 1);
        px(c, deep, 15, 8, 1, 13); px(c, det, 16, 8, 1, 13);                     // panel seam
        for (let i = 0; i < 34; i++) px(c, rnd() < 0.5 ? det : dark, Math.floor(rnd() * 32), 9 + Math.floor(rnd() * 30), 1 + Math.floor(rnd() * 2), 1);
        px(c, det, 2, 11, 2, 2); px(c, det, 27, 11, 2, 2);                      // rivets
        px(c, trim, 20, 4, 6, 1);                                                // trim light
        px(c, dark, 0, 21, 32, 1); px(c, deep, 0, 26, 32, 14);
      });
      if (!this.textures.exists(`plat_${st.id}`)) this.canvas(`plat_${st.id}`, 32, 12, (c) => {
        px(c, deep, 0, 0, 32, 12); px(c, hi, 0, 0, 32, 1); px(c, lip, 0, 1, 32, 1); px(c, face, 0, 2, 32, 4); px(c, dark, 0, 6, 32, 6);
        c.strokeStyle = det; c.lineWidth = 1; c.beginPath(); c.moveTo(0.5, 6); c.lineTo(15.5, 11.5); c.lineTo(31.5, 6); c.stroke();
        px(c, trim, 0, 2, 4, 1); px(c, trim, 16, 2, 4, 1); px(c, hi, 8, 3, 1, 1); px(c, hi, 24, 3, 1, 1);
      });
    }
  }

  private makeAtmosphere() {
    // soft fog band (tiles horizontally), street lamp, light cone
    this.canvas('fog', 256, 96, (c) => {
      for (let i = 0; i < 26; i++) {
        const x = (i * 97) % 256, y = 20 + ((i * 53) % 56), r = 26 + ((i * 31) % 30);
        for (const dx of [-256, 0, 256]) {
          const g = c.createRadialGradient(x + dx, y, 0, x + dx, y, r);
          g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = g; c.fillRect(x + dx - r, y - r, r * 2, r * 2);
        }
      }
    });
    this.canvas('lamp', 20, 120, (c) => {
      c.fillStyle = '#05070c'; c.fillRect(8, 14, 3, 106); c.fillRect(6, 112, 7, 8); c.fillRect(8, 8, 12, 3); c.fillRect(2, 4, 8, 5);
      c.fillStyle = '#1a2030'; c.fillRect(8, 14, 1, 104); c.fillStyle = '#fff6d0'; c.fillRect(3, 8, 6, 2);
    });
    this.canvas('cone', 96, 150, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 150);
      g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(44, 0); c.lineTo(52, 0); c.lineTo(96, 150); c.lineTo(0, 150); c.closePath(); c.fill();
    });
  }

  // 48x48 comms/briefing portraits, drawn in one consistent pixel style (no art files needed).
  // Keys: portrait_<operator id> and portrait_<speaker> (see src/data/story.ts).
  private makePortraits(px: (c: CanvasRenderingContext2D, col: string, x: number, y: number, w?: number, h?: number) => void) {
    type Look = { bg: string; rim: string; skin: string; shade: string; suit: string; suitD: string; eye: string };
    const bust = (key: string, k: Look, extra: (c: CanvasRenderingContext2D) => void, wide = 0) => this.textures.exists(key) || this.canvas(key, 48, 48, (c) => {
      px(c, k.bg, 0, 0, 48, 48);
      for (let y = 0; y < 48; y += 3) px(c, 'rgba(255,255,255,0.03)', 0, y, 48, 1);
      px(c, k.rim, 0, 46, 48, 2);
      // shoulders + neck + head
      px(c, k.suit, 6 - wide, 38, 36 + wide * 2, 10); px(c, k.suit, 9 - wide, 36, 30 + wide * 2, 2); px(c, k.suitD, 6 - wide, 44, 36 + wide * 2, 2);
      px(c, k.shade, 20, 30, 8, 7);
      px(c, k.skin, 16, 11, 16, 21); px(c, k.skin, 15, 13, 18, 16); px(c, k.shade, 30, 13, 3, 16); px(c, k.shade, 17, 31, 14, 1);
      px(c, '#10121a', 19, 20, 3, 2); px(c, '#10121a', 26, 20, 3, 2); px(c, k.eye, 20, 20, 1, 1); px(c, k.eye, 27, 20, 1, 1);
      px(c, k.shade, 23, 23, 2, 3); px(c, k.shade, 21, 27, 6, 1);
      extra(c);
      px(c, '#000000', 0, 0, 48, 1); px(c, '#000000', 0, 0, 1, 48); px(c, '#000000', 47, 0, 1, 48);
    });
    bust('portrait_rook', { bg: '#101a26', rim: '#40e0ff', skin: '#c8906a', shade: '#9a6648', suit: '#3a4a3a', suitD: '#243024', eye: '#9fe8ff' }, (c) => {
      px(c, '#1c1a1a', 15, 8, 18, 5); px(c, '#1c1a1a', 14, 11, 3, 6); px(c, '#1c1a1a', 31, 11, 3, 6);
      px(c, '#6a5040', 18, 28, 12, 3);                                 // stubble
      px(c, '#40e0ff', 13, 15, 2, 9); px(c, '#40e0ff', 13, 23, 6, 1); // headset
      px(c, '#1a1e1a', 10, 40, 4, 8); px(c, '#1a1e1a', 34, 40, 4, 8); // vest straps
    });
    bust('portrait_viper', { bg: '#1e0e1a', rim: '#ff50c8', skin: '#e0b090', shade: '#b07a60', suit: '#8a1a5a', suitD: '#5a0e3a', eye: '#ff9ad0' }, (c) => {
      px(c, '#0e0a14', 14, 7, 20, 7); px(c, '#0e0a14', 12, 10, 5, 30); px(c, '#0e0a14', 31, 10, 5, 30);
      px(c, '#ff50c8', 15, 9, 2, 30);                                  // pink streak
      px(c, '#c03060', 21, 27, 6, 1);
    });
    bust('portrait_titan', { bg: '#1e160c', rim: '#ff9a30', skin: '#7a5038', shade: '#5a3826', suit: '#a05a1a', suitD: '#6a3a10', eye: '#ffc070' }, (c) => {
      px(c, '#5a3826', 15, 9, 18, 3);                                  // buzz cut
      px(c, '#2a1e18', 16, 26, 16, 7); px(c, '#2a1e18', 15, 22, 2, 6); px(c, '#2a1e18', 31, 22, 2, 6); // beard
      px(c, '#d08030', 2, 37, 10, 4); px(c, '#d08030', 36, 37, 10, 4); // armour plates
    }, 4);
    bust('portrait_juno', { bg: '#0c1a1e', rim: '#40e0c0', skin: '#e8c0a0', shade: '#b88a70', suit: '#1a6a6a', suitD: '#0e4444', eye: '#406080' }, (c) => {
      px(c, '#9a3a20', 14, 8, 20, 6); px(c, '#9a3a20', 13, 11, 4, 18); px(c, '#9a3a20', 31, 11, 4, 18); px(c, '#c05a30', 16, 9, 8, 2);
      px(c, '#e0f0ff', 18, 19, 5, 4); px(c, '#e0f0ff', 25, 19, 5, 4); px(c, '#10121a', 23, 20, 2, 1); // glasses
      px(c, '#10121a', 19, 20, 3, 2); px(c, '#10121a', 26, 20, 3, 2);
      px(c, '#202830', 33, 16, 2, 10); px(c, '#202830', 27, 27, 7, 1); px(c, '#40e0c0', 26, 27, 2, 1); // headset mic
    });
    bust('portrait_patch', { bg: '#1a1a10', rim: '#ffd040', skin: '#8a8a90', shade: '#606068', suit: '#3a5a8a', suitD: '#243a5a', eye: '#ffd040' }, (c) => {
      px(c, '#505058', 14, 4, 6, 9); px(c, '#505058', 28, 4, 6, 9); px(c, '#d0a0a0', 16, 6, 2, 5); px(c, '#d0a0a0', 30, 6, 2, 5); // ears
      px(c, '#18181e', 16, 18, 16, 6);                                 // bandit mask
      px(c, '#ffd040', 20, 20, 2, 2); px(c, '#ffd040', 26, 20, 2, 2);
      px(c, '#e8e8e8', 19, 24, 10, 7); px(c, '#18181e', 23, 24, 2, 2); // muzzle + nose
      px(c, '#c0a040', 12, 40, 3, 3); px(c, '#c0a040', 33, 40, 3, 3);  // overall buttons
    });
    bust('portrait_croupier', { bg: '#180c1e', rim: '#ff80d0', skin: '#f0d8c8', shade: '#c0a090', suit: '#4a1a6a', suitD: '#2a0e40', eye: '#ffd040' }, (c) => {
      px(c, '#101014', 13, 10, 22, 2); px(c, '#101014', 17, 0, 14, 10); px(c, '#ff80d0', 17, 7, 14, 1); // top hat
      px(c, '#101014', 19, 25, 10, 2);                                 // moustache
      px(c, '#ffffff', 20, 36, 8, 4); px(c, '#ff3080', 21, 37, 6, 2); // shirt + bow tie
    });
    if (!this.textures.exists('portrait_oracle')) this.canvas('portrait_oracle', 48, 48, (c) => {
      px(c, '#140e1e', 0, 0, 48, 48);
      px(c, '#3a2a5a', 8, 6, 32, 30); px(c, '#0a0812', 11, 9, 26, 24);
      for (let y = 10; y < 32; y += 2) for (let x = 12; x < 36; x += 3) if (((x * 7 + y * 13) % 5) < 2) px(c, '#6a5a8a', x, y, 2, 1);
      px(c, '#d0a0ff', 18, 17, 12, 8); px(c, '#ffffff', 21, 18, 6, 6); px(c, '#140e1e', 23, 19, 2, 4);
      px(c, '#3a2a5a', 22, 36, 4, 6); px(c, '#3a2a5a', 12, 42, 24, 6); px(c, '#d0a0ff', 0, 46, 48, 2);
    });
    this.canvas('portrait_archon', 48, 48, (c) => {
      px(c, '#0a0306', 0, 0, 48, 48);
      c.strokeStyle = '#ff4060'; c.lineWidth = 2; c.beginPath(); c.arc(24, 24, 17, 0, 7); c.stroke();
      c.lineWidth = 1; c.beginPath(); c.arc(24, 24, 11, 0, 7); c.stroke();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; px(c, '#ff4060', Math.round(24 + Math.cos(a) * 21) - 1, Math.round(24 + Math.sin(a) * 21) - 1, 2, 2); }
      px(c, '#ff8a40', 19, 19, 10, 10); px(c, '#fff4c0', 22, 22, 4, 4); px(c, '#0a0306', 23, 17, 2, 14);
      for (let y = 1; y < 48; y += 3) px(c, 'rgba(0,0,0,0.35)', 0, y, 48, 1);
    });
    bust('portrait_halcyon', { bg: '#1e1a0c', rim: '#ffe090', skin: '#d0a080', shade: '#a07858', suit: '#4a4a52', suitD: '#2e2e36', eye: '#ffe090' }, (c) => {
      px(c, '#c8c8c8', 15, 8, 18, 4); px(c, '#c8c8c8', 14, 10, 3, 5); px(c, '#c8c8c8', 31, 10, 3, 5); // grey crew cut
      px(c, '#7a5a40', 25, 14, 1, 8); px(c, '#ffe090', 26, 20, 3, 1);                                   // scar + cybernetic eye
      px(c, '#ffe090', 18, 40, 4, 2); px(c, '#ffe090', 26, 40, 4, 2);                                   // commander pips
      px(c, '#40e0ff', 31, 24, 2, 6);                                                                    // neural jack
    });
    bust('portrait_serrik', { bg: '#0c1a10', rim: '#90e0a0', skin: '#5aa070', shade: '#3a7050', suit: '#5a3a3a', suitD: '#3a2424', eye: '#ffd040' }, (c) => {
      px(c, '#5aa070', 16, 8, 16, 4); px(c, '#90e0a0', 18, 4, 2, 5); px(c, '#90e0a0', 23, 2, 2, 7); px(c, '#90e0a0', 28, 4, 2, 5); // crest
      px(c, '#5aa070', 30, 22, 8, 7); px(c, '#3a7050', 30, 27, 8, 2); px(c, '#10121a', 35, 23, 1, 1);          // snout
      px(c, '#ffd040', 20, 20, 2, 2); px(c, '#ffd040', 27, 20, 2, 2);
      px(c, '#203020', 18, 33, 12, 2);                                                                          // broken collar
    });
    bust('portrait_quill', { bg: '#0c1220', rim: '#a0d0ff', skin: '#2a3040', shade: '#1a2030', suit: '#3a5a7a', suitD: '#243a52', eye: '#a0d0ff' }, (c) => {
      px(c, '#2a3040', 14, 6, 20, 8); px(c, '#4a5470', 16, 4, 4, 4); px(c, '#4a5470', 26, 3, 4, 5);            // feathers
      px(c, '#e0b040', 30, 21, 9, 3); px(c, '#b08020', 30, 24, 7, 2);                                          // beak
      px(c, '#a0d0ff', 20, 19, 3, 3); px(c, '#ffffff', 21, 19, 1, 1);
      px(c, '#c0c8d8', 10, 38, 6, 6);                                                                           // satchel
    });
    if (!this.textures.exists('portrait_sovereign')) this.canvas('portrait_sovereign', 48, 48, (c) => {
      px(c, '#0a0c1a', 0, 0, 48, 48);
      c.fillStyle = '#d8c8b0'; c.beginPath(); c.arc(26, 20, 16, 0, 7); c.fill();
      c.strokeStyle = '#a89070'; c.lineWidth = 2; c.beginPath(); c.arc(26, 20, 10, 0, 5); c.stroke(); c.beginPath(); c.arc(26, 20, 4, 0, 5); c.stroke();
      for (let i = 0; i < 5; i++) px(c, '#40a0b0', 10 + i * 6, 30, 4, 12 + (i % 2) * 4);
      px(c, '#ffd060', 14, 26, 4, 4); px(c, '#10121a', 15, 27, 2, 2);
      px(c, '#c0a0ff', 0, 46, 48, 2);
    });
    if (!this.textures.exists('portrait_myrrhkin')) this.canvas('portrait_myrrhkin', 48, 48, (c) => {
      px(c, '#0c0a16', 0, 0, 48, 48);
      px(c, '#5a2a8a', 8, 10, 32, 12); px(c, '#5a2a8a', 12, 6, 24, 4); px(c, '#3a1a5a', 8, 20, 32, 2);
      for (const [x, y] of [[14, 9], [24, 7], [31, 12], [18, 15]]) px(c, '#c0ff80', x, y, 3, 2);
      px(c, '#d8c8b0', 18, 22, 12, 22); px(c, '#a89880', 26, 22, 4, 22);
      px(c, '#b080ff', 20, 27, 3, 3); px(c, '#b080ff', 25, 27, 3, 3);
      px(c, '#b080ff', 0, 46, 48, 2);
    });
  }

  // ---- campaign gimmick props, drawn in code (no art files needed)
  private makeCampaignTextures(px: (c: CanvasRenderingContext2D, col: string, x: number, y: number, w?: number, h?: number) => void) {
    // crusher piston (origin bottom): shaft + heavy head with hazard stripes
    this.canvas('piston', 44, 300, (c) => {
      px(c, '#2a2420', 16, 0, 12, 260); px(c, '#4a4038', 17, 0, 3, 260); px(c, '#14100c', 26, 0, 2, 260);
      px(c, '#1a1410', 0, 260, 44, 40); px(c, '#5a4a3a', 1, 261, 42, 3); px(c, '#3a3028', 1, 264, 42, 26);
      for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#14100c' : '#ffb020'; c.beginPath(); c.moveTo(i * 8, 300); c.lineTo(i * 8 + 8, 300); c.lineTo(i * 8 + 14, 290); c.lineTo(i * 8 + 6, 290); c.fill(); }
      px(c, '#ff6020', 4, 268, 36, 2);
    });
    // railway signal gantry (origin bottom): pole from the top of the screen, beam at head height
    this.canvas('gantry', 70, 300, (c) => {
      px(c, '#10141c', 30, 0, 10, 270); px(c, '#2a3448', 31, 0, 3, 270);
      px(c, '#0a0d14', 0, 270, 70, 30); px(c, '#3a4660', 1, 271, 68, 3); px(c, '#1c2433', 1, 274, 68, 22);
      for (let i = 0; i < 9; i++) px(c, i % 2 ? '#0a0d14' : '#ffc040', 2 + i * 7.4, 290, 7, 4);
      px(c, '#ff3030', 8, 278, 6, 5); px(c, '#ff3030', 56, 278, 6, 5); px(c, '#ffffff', 9, 279, 2, 2); px(c, '#ffffff', 57, 279, 2, 2);
    });
    // freight car roof tile
    this.canvas('traincar', 128, 40, (c) => {
      px(c, '#0a0c12', 0, 0, 128, 40); px(c, '#5a6a86', 0, 0, 120, 2); px(c, '#2a3a52', 0, 2, 120, 8); px(c, '#1a2434', 0, 10, 120, 30);
      for (let x = 6; x < 118; x += 14) { px(c, '#14202e', x, 12, 2, 26); px(c, '#3a4a64', x + 1, 2, 1, 7); }
      px(c, '#ffb040', 10, 4, 18, 2); px(c, '#ffb040', 70, 4, 10, 2);
      px(c, '#05060a', 120, 0, 8, 40); px(c, '#2a2a30', 121, 18, 6, 4); // coupling gap
    });
    // soft light hole for dark stages: opaque black outside a radial falloff
    this.canvas('darkhole', 128, 128, (c) => {
      c.fillStyle = '#000'; c.fillRect(0, 0, 128, 128);
      c.globalCompositeOperation = 'destination-out';
      const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.92)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, 128, 128);
      c.globalCompositeOperation = 'source-over';
    });
    // screen-edge vignette (HUD tints it red while armor is critical): clear centre, solid corners
    this.canvas('vignette', 320, 180, (c) => {
      const g = c.createRadialGradient(160, 90, 70, 160, 90, 190);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.6, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0.95)');
      c.fillStyle = g; c.fillRect(0, 0, 320, 180);
    });
    // ARCHON control collar: a red ring floating over collared species
    this.canvas('collar', 18, 8, (c) => {
      c.strokeStyle = '#ff3050'; c.lineWidth = 2; c.beginPath(); c.ellipse(9, 4, 7.5, 2.6, 0, 0, 7); c.stroke();
      px(c, '#ffd0d8', 8, 1, 2, 1);
    });
  }

  // Stand-in backdrops (1280x360, tiling) for worlds whose painted art is still a Codex request.
  // A real `bg_<id>.png` in public/assets replaces these automatically (they are only drawn when missing).
  private makeBackdrops() {
    const mk = (key: string, draw: (c: CanvasRenderingContext2D, rnd: () => number) => void) => {
      if (this.textures.exists(key)) return;
      let seed = key.length * 977;
      const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
      this.canvas(key, 1280, 360, (c) => draw(c, rnd));
    };
    const sky = (c: CanvasRenderingContext2D, stops: string[]) => {
      const g = c.createLinearGradient(0, 0, 0, 360);
      stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
      c.fillStyle = g; c.fillRect(0, 0, 1280, 360);
    };
    // repeat a shape so the strip tiles seamlessly
    const wrap = (x: number, w: number, f: (x: number) => void) => { f(x); if (x + w > 1280) f(x - 1280); if (x < 0) f(x + 1280); };
    mk('bg_tidal', (c, rnd) => {
      sky(c, ['#04101c', '#0a2a3e', '#0e3c4c', '#061a24']);
      for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(120,220,255,${0.03 + rnd() * 0.05})`; const x = rnd() * 1280, w = 20 + rnd() * 60; wrap(x, w, (xx) => { c.beginPath(); c.moveTo(xx, 0); c.lineTo(xx + w, 0); c.lineTo(xx + w * 2.2, 360); c.lineTo(xx + w * 1.2, 360); c.fill(); }); }
      for (let i = 0; i < 9; i++) { // shell pillars of the throne vault
        const x = i * 142 + rnd() * 30, w = 46 + rnd() * 30, h = 160 + rnd() * 120;
        c.fillStyle = '#0a2230'; c.fillRect(x, 360 - h, w, h);
        c.fillStyle = '#163a4a'; for (let y = 360 - h; y < 360; y += 18) c.fillRect(x + 4, y, w - 8, 3);
        c.fillStyle = '#40e0d0'; c.globalAlpha = 0.35; c.fillRect(x + w / 2 - 2, 360 - h + 10, 4, 10); c.globalAlpha = 1;
      }
      c.fillStyle = '#06141c'; for (let x = 0; x < 1280; x += 64) { c.beginPath(); c.arc(x + 32, 360, 50 + (x % 3) * 10, Math.PI, 0); c.fill(); }
    });
    mk('bg_prism', (c, rnd) => {
      sky(c, ['#1a1030', '#3a2a58', '#6a5a80', '#2a2038']);
      c.fillStyle = 'rgba(255,240,220,0.5)'; c.beginPath(); c.arc(900, 90, 34, 0, 7); c.fill();
      for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 18; i++) { // crystal spires
        const x = rnd() * 1280, w = 18 + rnd() * 40, h = (layer ? 120 : 200) + rnd() * 90;
        c.fillStyle = layer ? '#1a1430' : '#2a2448';
        wrap(x, w, (xx) => { c.beginPath(); c.moveTo(xx, 360); c.lineTo(xx + w / 2, 360 - h); c.lineTo(xx + w, 360); c.fill(); });
        c.fillStyle = layer ? 'rgba(144,232,255,0.18)' : 'rgba(200,180,255,0.12)';
        wrap(x, w, (xx) => { c.beginPath(); c.moveTo(xx + w / 2, 360 - h); c.lineTo(xx + w * 0.62, 360); c.lineTo(xx + w / 2, 360); c.fill(); });
      }
      c.fillStyle = '#120c20'; c.fillRect(0, 300, 1280, 60);
    });
    mk('bg_spire', (c, rnd) => {
      sky(c, ['#05040e', '#0e0c24', '#1a1640', '#08061a']);
      for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(160,160,255,${rnd() * 0.5})`; c.fillRect(rnd() * 1280, rnd() * 360, 1, 1); }
      c.strokeStyle = 'rgba(160,160,255,0.16)'; c.lineWidth = 1; // the lattice
      for (let x = 0; x <= 1280; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 32, 360); c.stroke(); c.beginPath(); c.moveTo(x + 64, 0); c.lineTo(x + 32, 360); c.stroke(); }
      for (let i = 0; i < 7; i++) { // tall data towers
        const x = i * 186 + 40, w = 50 + rnd() * 40, h = 240 + rnd() * 100;
        c.fillStyle = '#0c0a22'; c.fillRect(x, 360 - h, w, h);
        for (let y = 360 - h + 8; y < 350; y += 10) for (let k = 6; k < w - 6; k += 8) if (rnd() < 0.3) { c.fillStyle = rnd() < 0.15 ? '#ff4060' : '#6060d0'; c.fillRect(x + k, y, 4, 2); }
      }
    });
  }

  private makeTextures() {
    const px = (c: CanvasRenderingContext2D, col: string, x: number, y: number, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

    this.canvas('px', 2, 2, (c) => px(c, '#fff', 0, 0, 2, 2));

    // mouse-aim crosshair: white with a dark edge so it reads on any background
    this.canvas('crosshair', 15, 15, (c) => {
      for (const [col, g] of [['#05060a', 1], ['#ffffff', 0]] as const) { // dark pass is 1px fatter
        px(c, col, 7 - g, 0, 1 + g * 2, 5 + g); px(c, col, 7 - g, 10 - g, 1 + g * 2, 5 + g);
        px(c, col, 0, 7 - g, 5 + g, 1 + g * 2); px(c, col, 10 - g, 7 - g, 5 + g, 1 + g * 2);
        px(c, col, 7 - g, 7 - g, 1 + g * 2, 1 + g * 2);
      }
    });

    this.canvas('glow', 64, 64, (c) => {
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    });

    this.canvas('bullet', 12, 4, (c) => { px(c, 'rgba(255,255,255,0.45)', 0, 1, 12, 2); px(c, '#fff', 3, 0, 8, 4); px(c, '#fff', 11, 1, 1, 2); });
    this.canvas('beam', 30, 4, (c) => { px(c, 'rgba(255,255,255,0.5)', 0, 0, 30, 4); px(c, '#fff', 0, 1, 30, 2); });
    this.canvas('rocket', 14, 6, (c) => { px(c, '#555a66', 0, 1, 10, 4); px(c, '#d8dce6', 2, 1, 8, 2); px(c, '#ff5030', 10, 1, 3, 4); px(c, '#ffd0a0', 13, 2, 1, 2); px(c, '#30343c', 0, 0, 3, 6); });
    this.canvas('ebullet', 10, 10, (c) => {
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(5, 5, 5, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(5, 5, 3, 0, 7); c.fill();
    });
    this.canvas('bomb', 8, 12, (c) => { px(c, '#3a3f4a', 1, 3, 6, 8); px(c, '#8a909c', 2, 4, 2, 5); px(c, '#ff4030', 2, 0, 4, 3); px(c, '#3a3f4a', 0, 1, 8, 1); });
    this.canvas('ring', 64, 64, (c) => { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(32, 32, 29, 0, 7); c.stroke(); });
    this.canvas('chip', 7, 7, (c) => { px(c, '#fff', 3, 0); px(c, '#fff', 2, 1, 3); px(c, '#fff', 1, 2, 5); px(c, '#fff', 0, 3, 7); px(c, '#ddd', 1, 4, 5); px(c, '#bbb', 2, 5, 3); px(c, '#999', 3, 6); });
    this.canvas('health', 14, 14, (c) => { px(c, '#10301c', 0, 0, 14, 14); px(c, '#1c5c34', 1, 1, 12, 12); px(c, '#7dffa0', 5, 2, 4, 10); px(c, '#7dffa0', 2, 5, 10, 4); px(c, '#e0ffe8', 6, 3, 1, 3); });
    this.canvas('wcrate', 16, 12, (c) => { px(c, '#0c1420', 0, 0, 16, 12); px(c, '#243850', 1, 1, 14, 10); px(c, '#fff', 3, 5, 9, 2); px(c, '#fff', 3, 7, 2, 2); px(c, '#fff', 10, 4, 3, 1); px(c, '#6fa0d0', 1, 1, 14, 1); });

    this.canvas('crate', 22, 22, (c) => {
      px(c, '#141820', 0, 0, 22, 22); px(c, '#3c4658', 1, 1, 20, 20); px(c, '#566378', 1, 1, 20, 2);
      px(c, '#2a3240', 3, 5, 16, 14); px(c, '#f0b020', 3, 9, 16, 4);
      for (let i = 0; i < 4; i++) { px(c, '#201808', 4 + i * 4, 9, 2, 4); }
      px(c, '#8a96aa', 2, 2, 2, 2); px(c, '#8a96aa', 18, 2, 2, 2); px(c, '#8a96aa', 2, 18, 2, 2); px(c, '#8a96aa', 18, 18, 2, 2);
    });

    // floor: riveted steel deck with a hazard-lit lip
    this.canvas('ground', 32, 40, (c) => {
      px(c, '#0b0d14', 0, 0, 32, 40); px(c, '#4a5266', 0, 0, 32, 2); px(c, '#2a3040', 0, 2, 32, 5); px(c, '#171b26', 0, 7, 32, 1);
      px(c, '#1c2130', 0, 8, 32, 12); px(c, '#12151f', 0, 20, 32, 20);
      px(c, '#0b0d14', 15, 8, 2, 12); px(c, '#343c50', 3, 10, 2, 2); px(c, '#343c50', 27, 10, 2, 2); px(c, '#343c50', 3, 16, 2, 2); px(c, '#343c50', 27, 16, 2, 2);
      px(c, '#6a748c', 2, 0, 6, 1); px(c, '#6a748c', 18, 0, 9, 1);
      for (let i = 0; i < 4; i++) px(c, '#1b2030', i * 8 + 2, 24 + (i % 2) * 6, 5, 3);
    });
    this.canvas('plat', 32, 12, (c) => {
      px(c, '#0b0d14', 0, 0, 32, 12); px(c, '#5a6480', 0, 0, 32, 2); px(c, '#2e3548', 0, 2, 32, 4); px(c, '#141822', 0, 6, 32, 6);
      c.strokeStyle = '#3a4258'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0.5, 6); c.lineTo(15.5, 11.5); c.lineTo(31.5, 6); c.stroke();
      px(c, '#f0b020', 0, 2, 4, 1); px(c, '#f0b020', 16, 2, 4, 1); px(c, '#8a96aa', 7, 3, 1, 1); px(c, '#8a96aa', 24, 3, 1, 1);
    });
    this.makeStageTiles(px);
    this.makeAtmosphere();
    this.makePortraits(px);
    this.makeCampaignTextures(px);
    this.makeBackdrops();
    // data shard: a glowing diamond memory crystal
    this.canvas('shard', 12, 16, (c) => {
      const rows = [[5, 2], [4, 4], [3, 6], [2, 8], [1, 10], [0, 12], [0, 12], [1, 10], [2, 8], [3, 6], [3, 6], [4, 4], [4, 4], [5, 2], [5, 2], [5, 2]];
      rows.forEach(([x, w], y) => { px(c, '#2a1050', x, y, w, 1); if (w > 2) px(c, y < 7 ? '#ff80c0' : '#c040ff', x + 1, y, w - 2, 1); });
      px(c, '#ffffff', 4, 3, 2, 4); px(c, '#ffe0f0', 6, 2, 1, 2);
    });
    this.canvas('lava', 32, 10, (c) => {
      px(c, '#fff0a0', 0, 0, 32, 2); px(c, '#ffb020', 0, 2, 32, 3); px(c, '#ff5a10', 0, 5, 32, 3); px(c, '#a01808', 0, 8, 32, 2);
      px(c, '#ffffff', 4, 0, 5, 1); px(c, '#ffffff', 19, 1, 6, 1); px(c, '#ffd040', 10, 4, 4, 1); px(c, '#ffd040', 25, 5, 4, 1);
    });
    this.canvas('acid', 32, 10, (c) => {
      px(c, '#f0ffb0', 0, 0, 32, 1); px(c, '#a0ff40', 0, 1, 32, 3); px(c, '#40b020', 0, 4, 32, 3); px(c, '#104010', 0, 7, 32, 3);
      px(c, '#ffffff', 5, 1, 3, 1); px(c, '#ffffff', 17, 2, 4, 1); px(c, '#d0ff80', 26, 3, 3, 2); px(c, '#d0ff80', 10, 4, 2, 2);
    });
    // spinning saw blade (BUZZKILL)
    this.canvas('saw', 16, 16, (c) => {
      c.fillStyle = '#fff';
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.beginPath(); c.moveTo(8 + Math.cos(a) * 8, 8 + Math.sin(a) * 8); c.lineTo(8 + Math.cos(a + 0.5) * 5, 8 + Math.sin(a + 0.5) * 5); c.lineTo(8 + Math.cos(a - 0.3) * 5, 8 + Math.sin(a - 0.3) * 5); c.fill(); }
      c.beginPath(); c.arc(8, 8, 6, 0, 7); c.fill();
      c.fillStyle = '#606878'; c.beginPath(); c.arc(8, 8, 2, 0, 7); c.fill();
    });
    this.canvas('volt', 32, 10, (c) => {
      px(c, '#e0ffff', 0, 0, 32, 1); px(c, '#40e0ff', 0, 1, 32, 3); px(c, '#1060c0', 0, 4, 32, 3); px(c, '#081840', 0, 7, 32, 3);
      px(c, '#ffffff', 2, 1, 3, 1); px(c, '#ffffff', 12, 2, 5, 1); px(c, '#ffffff', 24, 1, 4, 1);
    });
    // dark foreground silhouettes that scroll faster than the world (cheap depth)
    this.canvas('pillar', 40, 360, (c) => {
      px(c, '#04050a', 6, 0, 28, 360); px(c, '#0a0d16', 6, 0, 3, 360); px(c, '#04050a', 0, 60, 40, 14); px(c, '#04050a', 0, 230, 40, 10);
      px(c, '#0e1220', 0, 60, 40, 2); px(c, '#0e1220', 0, 230, 40, 2);
    });

    // ARCHON core: armoured sphere with a burning eye (procedural until a painted boss sheet exists)
    this.canvas('core', 96, 96, (c) => {
      const circle = (r: number, col: string) => { c.fillStyle = col; c.beginPath(); c.arc(48, 48, r, 0, 7); c.fill(); };
      circle(47, '#ff5638'); circle(46, '#0c0e16'); circle(43, '#2a3042'); circle(39, '#161a26');
      c.strokeStyle = '#0c0e16'; c.lineWidth = 2;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.beginPath(); c.moveTo(48 + Math.cos(a) * 24, 48 + Math.sin(a) * 24); c.lineTo(48 + Math.cos(a) * 44, 48 + Math.sin(a) * 44); c.stroke(); }
      for (let i = 0; i < 8; i++) { const a = ((i + 0.5) / 8) * Math.PI * 2; px(c, '#40e0ff', Math.round(48 + Math.cos(a) * 34) - 1, Math.round(48 + Math.sin(a) * 34) - 1, 3, 3); }
      circle(24, '#0c0e16'); circle(21, '#7a1010'); circle(16, '#e02818'); circle(10, '#ff8a40'); circle(5, '#fff4c0');
      px(c, '#0c0e16', 46, 26, 4, 44);
      px(c, '#fff4c0', 47, 40, 2, 16);
    });
  }
}
