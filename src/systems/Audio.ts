// All sound is synthesised at runtime with WebAudio: no audio files, no licences, tiny download.
// SFX are short recipes in `sfx()`. Music is a 16-step sequencer driven by TrackDef data.
import { settings } from './Settings';

export interface TrackDef {
  bpm: number;
  root: number; // midi note of the bass root
  bass: (number | null)[]; // 16 steps, semitone offsets from root
  lead: (number | null)[]; // 16 steps, semitone offsets (played 2 octaves up)
  prog: number[]; // per-bar transposition, loops
}

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class AudioSys {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private timer: number | null = null;
  private track: TrackDef | null = null;
  private step = 0;
  private nextTime = 0;
  private last: Record<string, number> = {};
  muted = false;
  intense = false; // boss / overdrive layer

  /** Must be called from a user gesture (browsers block audio until then). Safe to call repeatedly. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.55 * settings.effects;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.32 * settings.music;
      this.musicBus.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, len);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.setMuted(this.muted);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.value = m ? 0 : 1;
  }

  applySettings() {
    if (!this.ctx) return;
    this.sfxBus.gain.setTargetAtTime(0.55 * settings.effects, this.ctx.currentTime, 0.02);
    this.musicBus.gain.setTargetAtTime(0.32 * settings.music, this.ctx.currentTime, 0.02);
  }

  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, bus = this.sfxBus, at = 0) {
    const c = this.ctx!;
    const t = (at || c.currentTime) + 0.001;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, f0: number, f1: number, type: BiquadFilterType = 'lowpass', bus = this.sfxBus, at = 0) {
    const c = this.ctx!;
    const t = (at || c.currentTime) + 0.001;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(bus);
    s.start(t, Math.random());
    s.stop(t + dur + 0.02);
  }

  sfx(name: string) {
    if (!this.ctx || this.muted) return;
    const now = performance.now();
    if (now - (this.last[name] ?? 0) < 28) return; // don't stack identical sounds in one frame
    this.last[name] = now;
    const r = 0.94 + Math.random() * 0.12; // slight pitch variation keeps repeated sounds alive
    switch (name) {
      case 'pistol': this.tone('square', 620 * r, 110, 0.09, 0.3); this.noise(0.07, 0.35, 5000, 600); break;
      case 'smg': this.tone('square', 480 * r, 140, 0.05, 0.22); this.noise(0.045, 0.3, 6500, 900); break;
      case 'shotgun': this.noise(0.26, 0.75, 3600, 180); this.tone('sawtooth', 190 * r, 38, 0.2, 0.45); break;
      case 'rail': this.tone('sawtooth', 1900 * r, 90, 0.34, 0.32); this.tone('square', 95, 50, 0.3, 0.3); break;
      case 'rocket': this.noise(0.4, 0.5, 900, 3200, 'bandpass'); this.tone('sawtooth', 130, 55, 0.3, 0.3); break;
      case 'eshoot': this.tone('sawtooth', 300 * r, 600, 0.09, 0.14); break;
      case 'hit': this.tone('square', 240 * r, 90, 0.05, 0.22); this.noise(0.04, 0.2, 4000, 1200); break;
      case 'explode': this.noise(0.5, 0.85, 2600, 70); this.tone('sine', 150 * r, 28, 0.45, 0.8); break;
      case 'bigexplode': this.noise(1.3, 1, 3200, 40); this.tone('sine', 110, 20, 1.1, 1); this.tone('sawtooth', 70, 24, 0.9, 0.4); break;
      case 'jump': this.tone('square', 250, 520, 0.11, 0.13); break;
      case 'land': this.noise(0.07, 0.25, 500, 100); break;
      case 'slide': this.noise(0.24, 0.3, 900, 3800, 'bandpass'); break;
      case 'hurt': this.tone('sawtooth', 210, 55, 0.26, 0.5); this.noise(0.14, 0.4, 1600, 300); break;
      case 'chip': this.tone('square', 1200 * r, 1900, 0.05, 0.1); break;
      case 'health': this.tone('square', 520, 1040, 0.16, 0.2); this.tone('square', 780, 1560, 0.2, 0.14); break;
      case 'weapon': this.tone('square', 330, 660, 0.09, 0.24); this.tone('square', 660, 1320, 0.2, 0.2); this.noise(0.1, 0.2, 5000, 2000, 'highpass'); break;
      case 'ui': this.tone('square', 700, 700, 0.04, 0.14); break;
      case 'select': this.tone('square', 520, 1040, 0.08, 0.2); this.tone('square', 1040, 2080, 0.16, 0.16); break;
      case 'warn': this.tone('sawtooth', 440, 430, 0.24, 0.3); this.tone('sawtooth', 660, 650, 0.24, 0.2); break;
      case 'overdrive': this.tone('sawtooth', 70, 1400, 0.6, 0.45); this.noise(0.6, 0.4, 300, 7000, 'bandpass'); break;
      case 'aegis': this.tone('sine', 180, 720, 0.4, 0.32); this.tone('triangle', 360, 1440, 0.3, 0.14); break;
      case 'phase': this.noise(0.25, 0.22, 600, 6000, 'bandpass'); this.tone('sine', 1600, 300, 0.22, 0.18); break;
      case 'quake': this.tone('sine', 140, 32, 0.5, 0.5); this.noise(0.3, 0.3, 2200, 120); break;
      case 'rally': [0, 4, 7].forEach((n, i) => this.tone('triangle', midi(67 + n), midi(67 + n), 0.3, 0.18, this.sfxBus, this.ctx!.currentTime + i * 0.08)); break;
      case 'gale': this.noise(0.45, 0.22, 500, 4200, 'highpass'); this.tone('sine', 350, 1050, 0.35, 0.18); break;
      case 'shieldHit': this.tone('sine', 1100, 400, 0.08, 0.12); break;
      case 'ready': this.tone('triangle', 660, 1320, 0.15, 0.1); break;
      case 'death': this.tone('sawtooth', 380, 28, 0.95, 0.6); this.noise(0.6, 0.5, 2200, 80); break;
      case 'clear': [0, 4, 7, 12, 16].forEach((n, i) => this.tone('square', midi(64 + n), midi(64 + n), 0.2, 0.2, this.sfxBus, this.ctx!.currentTime + i * 0.09)); break;
      case 'combo': this.tone('triangle', 880 * r, 1760, 0.1, 0.2); break;
      case 'blink': this.tone('sine', 1500, 240, 0.16, 0.22); break;
      case 'radio': this.noise(0.06, 0.18, 3000, 1500, 'bandpass'); this.tone('square', 1320, 1320, 0.05, 0.1); break;
      case 'static': this.noise(0.28, 0.3, 6000, 800, 'bandpass'); this.tone('sawtooth', 90, 60, 0.2, 0.15); break;
      case 'type': this.tone('square', 900 * r, 900 * r, 0.015, 0.05); break;
      case 'shard': [0, 7, 12, 19].forEach((n, i) => this.tone('triangle', midi(76 + n), midi(76 + n), 0.18, 0.18, this.sfxBus, this.ctx!.currentTime + i * 0.06)); break;
    }
  }

  playMusic(track: TrackDef | null) {
    this.track = track;
    this.step = 0;
    this.intense = false;
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    if (!track) return;
    this.nextTime = 0;
    this.timer = window.setInterval(() => this.schedule(), 30);
  }

  private schedule() {
    const c = this.ctx;
    const tr = this.track;
    if (!c || !tr || c.state !== 'running') return;
    const stepDur = 60 / tr.bpm / 4;
    if (this.nextTime < c.currentTime) this.nextTime = c.currentTime + 0.05;
    while (this.nextTime < c.currentTime + 0.14) {
      const t = this.nextTime;
      const s = this.step % 16;
      const tp = tr.prog[Math.floor(this.step / 16) % tr.prog.length];
      const b = tr.bass[s];
      if (b !== null) {
        const f = midi(tr.root + tp + b);
        this.bassNote(f, t, stepDur * 0.9);
      }
      if (s % 4 === 0) { this.tone('sine', 140, 38, 0.16, 0.9, this.musicBus, t); }
      if (s === 4 || s === 12) this.noise(0.13, 0.5, 2400, 900, 'bandpass', this.musicBus, t);
      if (s % 2 === 0 || this.intense) this.noise(0.03, 0.12, 9000, 7000, 'highpass', this.musicBus, t);
      const l = tr.lead[s];
      if (l !== null && (this.intense || Math.floor(this.step / 32) % 2 === 1)) {
        const f = midi(tr.root + 24 + tp + l);
        this.tone('square', f, f, stepDur * 1.6, this.intense ? 0.13 : 0.08, this.musicBus, t);
      }
      this.step++;
      this.nextTime += stepDur;
    }
  }

  private bassNote(f: number, t: number, dur: number) {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(this.intense ? 1500 : 900, t);
    lp.frequency.exponentialRampToValueAtTime(140, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(lp).connect(g).connect(this.musicBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
}

export const audio = new AudioSys();
