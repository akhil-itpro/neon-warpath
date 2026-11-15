import Phaser from 'phaser';

// One place that turns keyboard / mouse / gamepad into game actions. Rebinding = edit the key lists.
const K = Phaser.Input.Keyboard.KeyCodes;
const BINDS = {
  left: [K.A, K.LEFT],
  right: [K.D, K.RIGHT],
  down: [K.S, K.DOWN],
  jump: [K.SPACE, K.W, K.UP, K.Z],
  fire: [K.J, K.X, K.ENTER],
  slide: [K.SHIFT, K.K, K.C],
  overdrive: [K.Q, K.L, K.V],
  pause: [K.ESC, K.P],
  mute: [K.M],
};
type Action = keyof typeof BINDS;

export class Controls {
  private keys = {} as Record<Action, Phaser.Input.Keyboard.Key[]>;
  private now = {} as Record<Action, boolean>;
  private prev = {} as Record<Action, boolean>;

  constructor(private scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    for (const a of Object.keys(BINDS) as Action[]) {
      this.keys[a] = BINDS[a].map((code) => kb.addKey(code));
      this.now[a] = this.prev[a] = false;
    }
    scene.input.mouse?.disableContextMenu();
  }

  /** Call once per frame before reading. */
  poll() {
    const pad = this.scene.input.gamepad?.pad1;
    const ptr = this.scene.input.activePointer;
    for (const a of Object.keys(BINDS) as Action[]) {
      this.prev[a] = this.now[a];
      this.now[a] = this.keys[a].some((k) => k.isDown);
    }
    if (ptr.isDown) { if (ptr.rightButtonDown()) this.now.slide = true; else this.now.fire = true; }
    if (pad) {
      const sx = pad.leftStick.x, sy = pad.leftStick.y;
      if (pad.left || sx < -0.4) this.now.left = true;
      if (pad.right || sx > 0.4) this.now.right = true;
      if (pad.down || sy > 0.6) this.now.down = true;
      if (pad.A) this.now.jump = true;
      if (pad.X || pad.R2 > 0.3) this.now.fire = true;
      if (pad.B || pad.R1) this.now.slide = true;
      if (pad.Y || pad.L1) this.now.overdrive = true;
      if (pad.buttons[9]?.pressed) this.now.pause = true;
    }
  }

  held(a: Action) { return this.now[a]; }
  pressed(a: Action) { return this.now[a] && !this.prev[a]; }
  get axis() { return (this.now.right ? 1 : 0) - (this.now.left ? 1 : 0); }
}
