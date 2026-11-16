import Phaser from 'phaser';
import { W, H, FONT } from '../config';
import { Controls } from '../systems/Controls';
import { audio } from '../systems/Audio';
import { settings, persistSettings, DIFFICULTIES } from '../systems/Settings';

const ROW_Y = 104, ROW_H = 30, ROWS = 6;

// Launched over Title or the pause HUD. Closing returns to the same screen.
export class OptionsScene extends Phaser.Scene {
  private controls!: Controls;
  private rows: Phaser.GameObjects.Text[] = [];
  private sel = 0;
  private wait = 0;
  private back = 'Title';
  private note!: Phaser.GameObjects.Text;
  constructor() { super('Options'); }

  create(data: { back?: string }) {
    this.back = data?.back ?? 'Title'; this.sel = 0; this.wait = 200; this.rows = [];
    this.controls = new Controls(this);
    this.input.setDefaultCursor('default');
    this.add.rectangle(0, 0, W, H, 0x050810, 0.97).setOrigin(0);
    const text = (y: number, value: string, size = 8, color = '#d0d8e8') => this.add.text(W / 2, y, value,
      { fontFamily: FONT, fontSize: `${size}px`, color, align: 'center' }).setOrigin(0.5);
    text(45, 'OPTIONS', 24, '#9fe8ff');
    text(70, 'Changes are saved on this device.');
    for (let i = 0; i < ROWS; i++) this.rows.push(text(ROW_Y + i * ROW_H, ''));
    text(296, 'ARROWS / STICK: SELECT + CHANGE   FIRE: CYCLE');
    text(318, 'CLICK A ROW TO CHANGE   ESC / O: BACK', 8, '#9fe8ff');
    this.note = text(340, '', 8, '#8995ab');
    this.refresh();
  }

  private refresh() {
    const pct = (n: number) => `${Math.round(n * 100)}%`;
    const level = DIFFICULTIES[settings.difficulty];
    const labels = [`DIFFICULTY       ${level.name}`, `MUSIC VOLUME     ${pct(settings.music)}`, `EFFECTS VOLUME   ${pct(settings.effects)}`,
      `CAMERA SHAKE     ${pct(settings.shake)}`, `SCREEN FLASHES   ${settings.flashes ? 'ON' : 'OFF'}`, 'BACK'];
    this.rows.forEach((row, i) => row.setText(`${i === this.sel ? '> ' : '  '}${labels[i]}${i === this.sel ? ' <' : '  '}`).setColor(i === this.sel ? '#ffd070' : '#d0d8e8'));
    this.note.setText(this.sel === 0 ? level.desc : 'Screen flashes controls full-screen flashes; attack cues stay visible.');
  }

  private change(dir: number) {
    if (this.sel === ROWS - 1) return this.close();
    if (this.sel === 0) settings.difficulty = (settings.difficulty + dir + DIFFICULTIES.length) % DIFFICULTIES.length;
    else if (this.sel === 4) settings.flashes = !settings.flashes;
    else {
      const key = (['music', 'effects', 'shake'] as const)[this.sel - 1];
      const next = Math.round(settings[key] * 10) + dir * 2;
      settings[key] = (next > 10 ? 0 : next < 0 ? 10 : next) / 10;
    }
    persistSettings(); audio.applySettings(); audio.sfx('ui'); this.refresh();
  }

  private close() { this.scene.resume(this.back); this.scene.stop(); }

  update(_time: number, dt: number) {
    const c = this.controls; c.poll();
    if ((this.wait -= dt) > 0) return;
    if (c.pressed('pause') || c.pressed('settings') || c.pressed('slide')) return this.close();
    const move = (c.pressed('menuDown') ? 1 : 0) - (c.pressed('menuUp') ? 1 : 0);
    if (move) { this.sel = (this.sel + move + this.rows.length) % this.rows.length; this.refresh(); }
    const dir = (c.pressed('right') ? 1 : 0) - (c.pressed('left') ? 1 : 0);
    if (dir) this.change(dir);
    if (c.pressed('fire') || (c.pressed('jump') && !c.held('menuUp'))) {
      if (c.pointer.isDown) {
        const i = Math.round((c.pointer.y - ROW_Y) / ROW_H);
        if (i < 0 || i >= ROWS || Math.abs(c.pointer.x - W / 2) > 230 || Math.abs(c.pointer.y - (ROW_Y + i * ROW_H)) > 13) return;
        this.sel = i;
      }
      this.change(1);
    }
  }
}
