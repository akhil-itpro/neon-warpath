import Phaser from 'phaser';
import { newRun, run } from '../systems/Run';
import { STAGES } from '../data/stages';

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
    //   &god=1          near-unkillable                 &op=1    operator index     &weapon=rocket
    const q = new URLSearchParams(location.search);
    if (q.has('stage')) {
      newRun(Number(q.get('op') ?? 0));
      const byId = STAGES.findIndex((s) => s.id === q.get('stage')); // ?stage=fungal or ?stage=4
      run.stage = byId >= 0 ? byId : Phaser.Math.Clamp((Number(q.get('stage')) || 1) - 1, 0, STAGES.length - 1);
      const st = STAGES[run.stage];
      if (q.has('boss')) { run.checkpoint = st.encounters.length; run.checkpointX = st.width - 560; }
      if (q.has('god')) { run.stats.maxHp = 9999; run.hp = 9999; }
      if (q.has('weapon')) { run.weapon = q.get('weapon')!; run.ammo = 999; }
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
