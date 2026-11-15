import Phaser from 'phaser';
import { W, H, FONT } from '../config';
import { save } from '../systems/Run';
import { LORE } from '../data/story';
import { STAGES } from '../data/stages';
import { audio } from '../systems/Audio';
import { Controls } from '../systems/Controls';

// ARCHIVE (from Title): the lore entries unlocked by data shards, saved across runs.
// Up/down (or W/S, mouse wheel) to browse; fire, Esc or a click on BACK returns to the title.
export class ArchiveScene extends Phaser.Scene {
  private controls!: Controls;
  private sel = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private title!: Phaser.GameObjects.Text;
  private body!: Phaser.GameObjects.Text;
  private wait = 0;

  constructor() { super('Archive'); }

  private txt(x: number, y: number, s: string, size = 8, color = '#ffffff') {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 3 });
  }

  create() {
    this.controls = new Controls(this);
    this.sel = 0; this.rows = []; this.wait = 300;
    this.add.tileSprite(0, 0, W, H, 'bg_cathedral').setOrigin(0).setTint(0x202438);
    this.txt(W / 2, 14, 'ARCHIVE', 16, '#ff90e0').setOrigin(0.5, 0);
    this.txt(W / 2, 36, `${save.archive.length} / ${LORE.length} DATA SHARDS RECOVERED`, 8, '#c0c8d8').setOrigin(0.5, 0);
    const g = this.add.graphics();
    g.fillStyle(0x05060a, 0.85).fillRect(16, 54, 230, 284).fillRect(256, 54, 368, 284);
    g.lineStyle(1, 0xff90e0, 0.6).strokeRect(16.5, 54.5, 229, 283).strokeRect(256.5, 54.5, 367, 283);
    LORE.forEach((l, i) => {
      const open = save.archive.includes(l.id);
      const stage = STAGES.find((s) => l.id.startsWith(s.id + '-'));
      const row = this.txt(24, 60 + i * 13, open ? l.title : `??? ${stage ? stage.name : ''}`, 8, open ? '#ffffff' : '#505868').setScale(0.85);
      row.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.sel = i; this.refresh(); audio.sfx('ui'); });
      this.rows.push(row);
    });
    this.title = this.txt(268, 66, '', 8, '#ffd040');
    this.body = this.add.text(268, 90, '', { fontFamily: FONT, fontSize: '8px', color: '#e0e4f0', stroke: '#000000', strokeThickness: 2, wordWrap: { width: 344 }, lineSpacing: 8 });
    const back = this.txt(W / 2, H - 16, 'ESC / FIRE: BACK', 8, '#9fe8ff').setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.leave());
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => { this.sel = Phaser.Math.Wrap(this.sel + Math.sign(dy), 0, LORE.length); this.refresh(); });
    this.refresh();
    this.cameras.main.fadeIn(250);
  }

  private refresh() {
    const l = LORE[this.sel];
    const open = save.archive.includes(l.id);
    this.rows.forEach((r, i) => r.setBackgroundColor(i === this.sel ? '#40204a' : ''));
    this.title.setText(open ? l.title : 'LOCKED');
    this.body.setText(open ? l.text : 'Find this data shard in its stage to read it. Shards hide on high platforms.');
  }

  private leave() {
    if (this.wait > 0) return;
    this.wait = 9999;
    audio.sfx('ui');
    this.scene.start('Title');
  }

  update(_t: number, dt: number) {
    const c = this.controls;
    c.poll();
    if (this.wait > 0) { this.wait -= dt; return; }
    const up = c.pressed('jump') && !c.held('fire'); // W / Up are jump keys; Space too, which is fine for browsing
    const move = (c.pressed('down') ? 1 : 0) - (up ? 1 : 0);
    if (move) { this.sel = Phaser.Math.Wrap(this.sel + move, 0, LORE.length); this.refresh(); audio.sfx('ui'); }
    if (c.pressed('pause') || (c.pressed('fire') && !c.pointer.isDown)) this.leave();
  }
}
