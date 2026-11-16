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
  ability: [K.E, K.F],
  pause: [K.ESC, K.P],
  mute: [K.M],
  settings: [K.O],
  resume: [K.R],
  quit: [K.T],
  menuUp: [K.UP, K.W],
  menuDown: [K.DOWN, K.S],
};
type Action = keyof typeof BINDS;

export class Controls {
  /** True while the player is aiming with the mouse (it moved or clicked more recently than a fire key / gamepad was used). Shared by all scenes. */
  static mouseAim = false;
  private lastX = 0;
  private lastY = 0;
  private stick: { x: number; y: number } | null = null; // gamepad right stick, when pushed: free aim direction
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
    const ptr = scene.input.activePointer;
    this.lastX = ptr.x; this.lastY = ptr.y;
  }

  /** Call once per frame before reading. */
  poll() {
    const pad = this.scene.input.gamepad?.pad1;
    const ptr = this.scene.input.activePointer;
    for (const a of Object.keys(BINDS) as Action[]) {
      this.prev[a] = this.now[a];
      this.now[a] = this.keys[a].some((k) => k.isDown);
    }
    // Whichever device was used last decides how shots are aimed: mouse = free aim at the crosshair, keys/pad = auto-aim.
    if (this.now.fire) Controls.mouseAim = false;
    if (ptr.isDown || ptr.x !== this.lastX || ptr.y !== this.lastY) Controls.mouseAim = true;
    this.lastX = ptr.x; this.lastY = ptr.y;
    if (ptr.isDown) { if (ptr.rightButtonDown()) this.now.slide = true; else this.now.fire = true; }
    this.stick = null;
    if (pad) {
      const sx = pad.leftStick.x, sy = pad.leftStick.y;
      const rx = pad.rightStick?.x ?? 0, ry = pad.rightStick?.y ?? 0;
      if (Math.hypot(rx, ry) > 0.45) { this.stick = { x: rx, y: ry }; Controls.mouseAim = false; }
      if (pad.left || sx < -0.4) this.now.left = true;
      if (pad.right || sx > 0.4) this.now.right = true;
      if (pad.down || sy > 0.6) this.now.down = true;
      if (pad.down || sy > 0.6) this.now.menuDown = true;
      if (pad.up || sy < -0.6) this.now.menuUp = true;
      if (pad.A) this.now.jump = true;
      if (pad.X || pad.R2 > 0.3) { this.now.fire = true; Controls.mouseAim = false; }
      if (pad.B || pad.R1) this.now.slide = true;
      if (pad.Y || pad.L1) this.now.overdrive = true;
      if (pad.L2 > 0.3) this.now.ability = true;
      if (pad.buttons[9]?.pressed) this.now.pause = true;
      if (pad.buttons[8]?.pressed) this.now.settings = true;
    }
  }

  /** Where the player is aiming in the world: the mouse crosshair, or a point along the gamepad right stick
   *  measured from (ox, oy). Null = no free aim, shots use the auto-aim cone. */
  aimPoint(cam: Phaser.Cameras.Scene2D.Camera, ox = 0, oy = 0) {
    if (this.stick) { const m = Math.hypot(this.stick.x, this.stick.y); return { x: ox + this.stick.x / m * 170, y: oy + this.stick.y / m * 170 }; }
    if (!Controls.mouseAim) return null;
    const v = this.scene.input.activePointer.positionToCamera(cam) as Phaser.Math.Vector2;
    return { x: v.x, y: v.y };
  }
  /** Mouse position in screen (game pixel) coordinates. */
  get pointer() { return this.scene.input.activePointer; }

  held(a: Action) { return this.now[a]; }
  pressed(a: Action) { return this.now[a] && !this.prev[a]; }
  get axis() { return (this.now.right ? 1 : 0) - (this.now.left ? 1 : 0); }
}
