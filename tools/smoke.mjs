// Automated smoke test: boots the game in a real browser (system Chrome/Edge), plays each stage and boss
// for a few seconds with held inputs, saves screenshots to tools/shots/, and fails on any runtime error.
//   npm run smoke            run everything
//   npm run smoke -- city    only scenarios whose name contains "city"
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const filter = process.argv[2] ?? '';
const SCENARIOS = [
  { name: 'art-pickups', url: '?stage=1&god=1', steps: [
    ['wait', 2800],
    ['eval', `var g = window.__game.scene.getScene('Game');
      for (const e of g.enemies) g.removeEnemy(e);
      window.__weaponDrops = [];
      const seen = new Set();
      for (let i = 0; i < 200 && seen.size < 4; i++) {
        g.dropPickup('weapon', 220 + seen.size * 65, 240);
        const pk = g.pickups.at(-1);
        if (seen.has(pk.wid)) { pk.taken = true; continue; }
        seen.add(pk.wid); window.__weaponDrops.push(pk);
        pk.setVelocity(0, 0); pk.body.setAllowGravity(false);
      }`],
    ['wait', 200], ['shot'],
    ['assert', 'window.__weaponDrops.length === 4 && window.__weaponDrops.every(p => p.texture.key === "pickup_" + p.wid && p.body.width === 16 && p.body.height === 12)'],
    // Real physics overlap, one weapon at a time; verify equipped identity and ammunition.
    ...[0, 1, 2, 3].flatMap(i => [
      ['eval', `var g = window.__game.scene.getScene('Game'); var pk = window.__weaponDrops[${i}]; pk.body.reset(g.player.x, g.player.centerY);`],
      ['wait', 100],
      ['assert', `window.__weaponDrops[${i}].taken && window.__run.weapon === window.__weaponDrops[${i}].wid && window.__run.ammo > 0`],
    ]),
    ['shot'],
  ] },
  ...['viper', 'titan'].map((operator, index) => ({ name: `art-${operator}`, url: `?stage=1&god=1&op=${index + 1}`, steps: [
    ['wait', 2800], ['assert', `window.__game.scene.getScene("Game").player.texture.key === "${operator}_idle"`], ['shot'],
    ['down', 'KeyJ'], ['down', 'KeyD'], ['wait', 400], ['assert', `window.__game.scene.getScene("Game").player.texture.key.startsWith("${operator}_run")`], ['shot'],
    ['up', 'KeyD'], ['tap', 'Space'], ['wait', 120], ['assert', `window.__game.scene.getScene("Game").player.texture.key === "${operator}_jump"`], ['shot'],
    ['wait', 1000], ['down', 'KeyS'], ['wait', 200], ['assert', `window.__game.scene.getScene("Game").player.texture.key === "${operator}_crouch"`], ['shot'],
    ['up', 'KeyS'], ['tap', 'ShiftLeft'], ['wait', 30], ['assert', `window.__game.scene.getScene("Game").player.texture.key === "${operator}_slide"`], ['shot'],
    ['up', 'KeyJ'], ['wait', 500], ['down', 'KeyA'], ['wait', 180], ['up', 'KeyA'], ['wait', 300],
    ['assert', 'window.__game.scene.getScene("Game").player.flipX'], ['shot'],
  ] })),
  { name: 'art-enemies', url: '?stage=furnace&god=1', steps: [
    ['wait', 2800],
    ['eval', `var g = window.__game.scene.getScene('Game');
      for (const e of g.enemies) g.removeEnemy(e);
      window.__artEnemies = ['zombie', 'brute', 'alien', 'demon'].map((id, i) => {
        const e = g.spawnEnemy(id, 240 + i * 90, i < 2 ? g.player.y : 190, 'add');
        e.awake = true; return e;
      });
      window.__artFrames = window.__artEnemies.map(() => new Set());
      window.__artTimer = g.time.addEvent({ delay: 30, loop: true, callback: () => window.__artEnemies.forEach((e, i) => window.__artFrames[i].add(e.texture.key)) });`],
    ['wait', 800], ['shot'],
    ['assert', 'window.__artEnemies.every(e => e.texture.key.startsWith(e.def.art + "_"))'],
    ['assert', 'window.__artFrames.every(frames => frames.size >= 2)'],
    ['assert', 'window.__artEnemies.every(e => Math.abs(e.scaleX - (e.def.fallback.scale ?? 1)) < 0.001)'],
    ['eval', 'window.__artTimer.remove()'],
  ] },
  { name: 'title', url: '', steps: [['wait', 1200], ['shot'], ['tap', 'ArrowRight'], ['wait', 300], ['shot'], ['tap', 'Enter'],
    ['until', 'window.__game.scene.isActive("Briefing")'], ['wait', 1500], ['shot'],
    ['assert', 'window.__run.op.id === "viper" /* VIPER-only briefing lines */'],
    ['down', 'KeyJ'], ['until', 'window.__game.scene.isActive("Game")'], ['up', 'KeyJ'], ['wait', 1500], ['shot']] },
  // ---- story system (docs/STORY.md): comms, shards, choices and consequences, archive, endings
  { name: 'story-comms', url: '?stage=1&god=1', steps: [
    ['until', 'window.__game.scene.getScene("Hud").commsBusy'], ['wait', 1600], ['shot'], // 'start' has no line in stage 1; first line is the gangster sighting
    ['assert', 'window.__run.heard.length >= 1 && window.__game.scene.getScene("Hud").comm.x > 0'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.player.body.reset(1360, 250)'], ['wait', 600], // walks onto shard 2
    ['assert', 'window.__run.shards.includes("city-2") && JSON.parse(localStorage.getItem("neon-warpath-save-v1")).archive.includes("city-2")'], ['wait', 300], ['shot'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.player.invuln = 0; g.hurtPlayer(10000, g.player.x - 20)'],
    ['until', 'window.__game.scene.getScene("Game").canRetry'], ['tap', 'Enter'], ['wait', 2600], ['shot'],
    ['assert', 'window.__run.heard.includes("city:death") && window.__game.scene.getScene("Game").shards.every(s => s.id !== "city-2") /* shard stays collected */'],
  ] },
  { name: 'story-ledger', url: '?stage=casino&boss=1&god=1', steps: [
    ['down', 'KeyD'], ['until', '!!window.__game.scene.getScene("Game").boss'], ['up', 'KeyD'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.boss.hurt(g.boss.maxHp, g.player.x)'],
    ['until', 'window.__game.scene.isActive("Briefing")'],
    ['press', ['Enter', '!!window.__game.scene.getScene("Briefing").choice']], ['wait', 500], ['shot'],
    ['tap', 'ArrowRight'], ['wait', 200], ['shot'], ['tap', 'Enter'], ['wait', 300],
    ['assert', 'window.__run.flags.ledger === "sell" && window.__run.bonusCards === 3 && window.__run.choices.length === 1'],
    ['press', ['Enter', 'window.__game.scene.isActive("Perk")']], ['wait', 900], ['shot'],
    ['assert', 'window.__game.scene.getScene("Perk").cards.length === 4'],
  ] },
  { name: 'story-leak', url: '?stage=furnace&god=1', steps: [
    ['eval', 'window.__run.flags.ledger = "leak"; window.__game.scene.getScene("Game").scene.restart()'], ['wait', 1200],
    ['assert', 'var g = window.__game.scene.getScene("Game"); g.encounters[0].waves.length === 4 && g.enemies.filter(e => e.def.id === "gangster").length === 2'],
  ] },
  { name: 'story-nest', url: '?stage=fungal&boss=1&god=1', steps: [
    ['eval', 'window.__run.eggsShot = 3; window.__game.scene.getScene("Game").scene.restart()'], ['wait', 300],
    ['down', 'KeyD'], ['until', '!!window.__game.scene.getScene("Game").boss'], ['up', 'KeyD'], ['wait', 300],
    ['assert', 'window.__run.flags.nest_truce === false && window.__game.scene.getScene("Game").countAlive("spiderling") >= 4'], ['shot'],
  ] },
  { name: 'story-end', url: '?stage=cathedral&boss=1&god=1', steps: [
    ['eval', 'Object.assign(window.__run.flags, { heard_oracle: true }); window.__run.choices.push("YOU HEARD THE TRUTH ABOUT HALCYON.")'],
    ['down', 'KeyD'], ['until', '!!window.__game.scene.getScene("Game").boss'], ['up', 'KeyD'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.boss.hurt(g.boss.maxHp * 0.55, g.player.x)'], ['wait', 1500], ['shot'],
    ['assert', 'window.__run.heard.includes("cathedral:boss50")'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.boss.hurt(g.boss.maxHp, g.player.x)'],
    ['until', 'window.__game.scene.isActive("End")'], ['wait', 1500], ['shot'],
  ] },
  { name: 'archive', url: '', steps: [
    ['eval', 'localStorage.setItem("neon-warpath-save-v1", JSON.stringify({ archive: ["city-1", "orbital-3"] })); location.reload()'],
    ['until', 'window.__game && window.__game.scene.isActive("Title")'], ['wait', 600], ['tap', 'Tab'],
    ['until', 'window.__game.scene.isActive("Archive")'], ['wait', 500], ['shot'],
    ['tap', 'KeyS'], ['wait', 200], ['shot'], ['tap', 'Escape'], ['until', 'window.__game.scene.isActive("Title")'],
  ] },
  { name: 'city', url: '?stage=1&god=1', steps: [['wait', 800], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 3000], ['shot'], ['tap', 'Space'], ['wait', 400], ['tap', 'ShiftLeft'], ['wait', 5000], ['shot'], ['wait', 9000], ['shot']] },
  { name: 'city-boss', url: '?stage=1&boss=1&god=1&weapon=smg', steps: [['wait', 500], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 6000], ['shot'], ['up', 'KeyD'], ['wait', 9000], ['shot'], ['wait', 30000], ['shot']] },
  { name: 'furnace', url: '?stage=furnace&god=1&weapon=shotgun', steps: [['wait', 800], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 5000], ['shot'], ['wait', 9000], ['shot']] },
  { name: 'furnace-boss', url: '?stage=furnace&boss=1&god=1&weapon=rocket', steps: [['wait', 500], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 7000], ['shot'], ['wait', 12000], ['shot']] },
  { name: 'cathedral', url: '?stage=cathedral&god=1&weapon=rail', steps: [['wait', 800], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 5000], ['shot'], ['wait', 9000], ['shot']] },
  { name: 'cathedral-boss', url: '?stage=cathedral&boss=1&god=1&weapon=smg', steps: [['wait', 500], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 7000], ['shot'], ['up', 'KeyD'], ['wait', 12000], ['shot']] },
  // ---- expansion content
  ...[['casino', 'arc'], ['fungal', 'spore'], ['abyss', 'cryo'], ['orbital', 'tesla']].flatMap(([id, weapon]) => [
    { name: `x-${id}`, url: `?stage=${id}&god=1&weapon=${weapon}`, steps: [['wait', 800], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 4000], ['shot'], ['wait', 6000], ['shot'], ['wait', 9000], ['shot']] },
    { name: `x-${id}-boss`, url: `?stage=${id}&boss=1&god=1&weapon=smg`, steps: [
      ['wait', 500], ['down', 'KeyD'], ['until', '!!window.__game.scene.getScene("Game").boss'], ['up', 'KeyD'],
      ['eval', 'var g = window.__game.scene.getScene("Game"); g.player.x = g.bounds.left + 90'], ['down', 'KeyJ'], // stand on the left, firing right
      ['wait', 2500], ['shot'], ['wait', 5000], ['shot'], ['wait', 6000], ['shot'],
      ['eval', 'var g = window.__game.scene.getScene("Game"); g.boss.hurt(g.boss.hp - g.boss.maxHp * 0.4, g.player.x)'], // push into the rage phase
      ['wait', 7000], ['shot'], ['wait', 7000], ['shot'],
      ['assert', 'var g = window.__game.scene.getScene("Game"); g.state !== "dead" && (!g.boss || g.boss.dead || (g.boss.hp < g.boss.maxHp * 0.6 && g.boss.x > g.bounds.left - 10 && g.boss.x < g.bounds.right + 10 && g.boss.y > 0 && g.boss.y < 330))'],
    ] },
  ]),
  { name: 'x-roster', url: '?stage=casino&god=1', steps: [
    ['wait', 2800],
    ['eval', `var g = window.__game.scene.getScene('Game');
      for (const e of g.enemies) g.removeEnemy(e);
      g.player.x = 80;
      var ids = ['bastion', 'sniper', 'hound', 'sawcrab', 'mantis', 'sporeback', 'bellower', 'spiderling', 'knight', 'deepjaw', 'vendotron', 'totem', 'slug', 'locker', 'medstation', 'barrel', 'egg'];
      window.__roster = ids.map((id, i) => g.spawnEnemy(id, 150 + (i % 9) * 52, i < 9 ? 320 : 248, ''));
      window.__roster.slice(9).forEach((e) => { e.body.setAllowGravity(false); });
      ['bell', 'moth', 'jelly'].forEach((id, i) => window.__roster.push(g.spawnEnemy(id, 250 + i * 110, 120, '')));`],
    ['wait', 300], ['shot'],
    ['assert', 'window.__roster.every(e => e.texture.key === e.def.art && e.scaleX === 1)'],
    ['eval', 'window.__roster.forEach(e => e.awake = true)'], ['wait', 2500], ['shot'], ['wait', 2500], ['shot'],
  ] },
  { name: 'x-weapons', url: '?stage=city&god=1', steps: [
    ['wait', 2800],
    ...['arc', 'cryo', 'scrap', 'sun', 'saw', 'spore', 'grav', 'tesla'].flatMap((w) => [
      ['eval', `var g = window.__game.scene.getScene('Game'); var r = window.__run;
        for (const e of g.enemies) g.removeEnemy(e);
        g.player.x = 120; g.player.body.setVelocity(0, 0);
        window.__targets = [0, 1, 2].map((i) => { const e = g.spawnEnemy('trooper', 260 + i * 50, 320, ''); return e; });
        r.weapon = '${w}'; r.ammo = 999; window.__kills = r.kills;`],
      ['down', 'KeyJ'], ['wait', 700], ['shot'], ['wait', 2600], ['up', 'KeyJ'],
      ['assert', `window.__targets.some(e => e.hp < e.maxHp) /* ${w} must damage */`],
    ]),
  ] },
  // Mouse aim: shots follow the crosshair, the hero faces it, and releasing the button stops the gun.
  // Legacy arm cutter is disabled; whole-body poses and free-aim shooting remain intact.
  { name: 'arm-rig', url: '?stage=city&god=1&weapon=smg&op=1', steps: [
    ['wait', 2800],
    ['eval', `var g = window.__game.scene.getScene('Game'); for (const e of g.enemies) g.removeEnemy(e); g.player.x = 300; g.player.body.setVelocity(0, 0);`],
    ['assert', `var p = window.__game.scene.getScene('Game').player; p.texture.key === 'viper_idle' && p.arm === null && p.rig === null`],
    ['mouse', [1100, 120]], ['wait', 200], ['shot'],
    ['mouse', [200, 380]], ['wait', 200], ['shot'],
    ['assert', `var p = window.__game.scene.getScene('Game').player; p.dir === -1 && p.texture.key === 'viper_idle' && p.arm === null`],
    ['down', 'KeyS'], ['wait', 200], ['shot'], ['up', 'KeyS'],
    ['assert', `window.__game.scene.getScene('Game').player.texture.key === 'viper_crouch'`],
  ] },
  { name: 'rook-rig', url: '?stage=city&god=1&weapon=smg', steps: [
    ['wait', 3000],
    ['eval', `var g = window.__game.scene.getScene('Game'); for (const e of g.enemies) g.removeEnemy(e); g.player.body.reset(300, 320);`],
    ['wait', 400], ['shot'],
    ['assert', `var p = window.__game.scene.getScene('Game').player; p.rig && !p.visible && p.rig.root.visible && p.rig.root.list.length === 8 && p.body.width === 18 && p.body.height === 56`],
    ['mouse', [1100, 120]], ['wait', 400], ['shot'],
    ['assert', `window.__game.scene.getScene('Game').player.rig.parts.arm.rotation < -0.5`],
    ['mdown'], ['wait', 300], ['mup'],
    ['mouse', [200, 100]], ['wait', 400], ['shot'],
    ['assert', `var p = window.__game.scene.getScene('Game').player; p.dir === -1 && p.rig.muzzle().x < p.x && p.rig.muzzle().y < p.centerY`],
    ['tap', 'KeyJ'], ['down', 'KeyD'],
    ...Array.from({ length: 8 }, () => [['wait', 70], ['shot']]).flat(),
    ['up', 'KeyD'], ['tap', 'Space'], ['wait', 80], ['shot'], ['wait', 200], ['shot'],
    ['wait', 1000], ['down', 'KeyS'], ['wait', 160], ['shot'],
    ['assert', `var p = window.__game.scene.getScene('Game').player; p.low && p.rig.parts.head.y > -35 && p.body.height === 32`],
    ['up', 'KeyS'], ['tap', 'ShiftLeft'], ['wait', 30],
    ['assert', `var p = window.__game.scene.getScene('Game').player; p.sliding > 0 && p.invuln > 0`],
    ['shot'], ['wait', 450],
    ['eval', `var g = window.__game.scene.getScene('Game'); g.player.flashWhite(); g.fx.hitstop(100)`],
    ['assert', `Object.values(window.__game.scene.getScene('Game').player.rig.parts).every(p => p.tintFill)`], ['wait', 25], ['shot'],
    ['eval', `var p = window.__game.scene.getScene('Game').player; window.__oldRig = p.rig.root; p.invuln = 0; window.__game.scene.getScene('Game').hurtPlayer(10000, p.x - 20)`],
    ['wait', 120], ['shot'],
    ['assert', `!window.__game.scene.getScene('Game').player.rig.root.visible`],
    ['until', `window.__game.scene.getScene('Game').canRetry`], ['tap', 'Enter'], ['wait', 800], ['shot'],
    ['assert', `var g = window.__game.scene.getScene('Game'); g.state === 'play' && g.player.rig.root.active && !window.__oldRig.active`],
    ['tap', 'Escape'], ['eval', `window.__rigPhase = window.__game.scene.getScene('Game').player.rig.phase`], ['wait', 350],
    ['assert', `window.__game.scene.getScene('Game').player.rig.phase === window.__rigPhase`], ['tap', 'Escape'],
    // A stable eight-position review loop rendered by the real rig; gameplay assertions are above.
    ['wait', 400], ['eval', `var g = window.__game.scene.getScene('Game'); g.scene.pause(); g.aim = null; g.player.dir = 1; g.player.body.setVelocity(170, 0);`],
    ...Array.from({ length: 8 }, (_, i) => [
      ['eval', `var p = window.__game.scene.getScene('Game').player; p.rig.phase = ${i} / 8; p.rig.update(p, 0, false)`], ['shot'],
    ]).flat(),
  ] },
  { name: 'mouse-aim', url: '?stage=city&god=1&weapon=smg', steps: [
    ['wait', 2800],
    ['eval', `var g = window.__game.scene.getScene('Game'); for (const e of g.enemies) g.removeEnemy(e); g.player.x = 300; g.player.body.setVelocity(0, 0);`],
    ['mouse', [1100, 200]], ['wait', 200], ['mdown'], ['wait', 500], ['shot'],
    ['assert', `var g = window.__game.scene.getScene('Game'); var s = g.pShots.getChildren().filter(s => s.active); g.aim && g.player.dir === 1 && s.length > 2 && s.every(s => s.body.velocity.y < -100 && s.body.velocity.x > 0)`],
    ['assert', `var h = window.__game.scene.getScene('Hud'); h.cross.visible && window.__game.canvas.style.cursor === 'none'`],
    ['mouse', [150, 300]], ['wait', 1200], ['shot'],
    ['assert', `var g = window.__game.scene.getScene('Game'); var s = g.pShots.getChildren().filter(s => s.active); g.player.dir === -1 && g.player.flipX && s.length > 2 && s.every(s => s.body.velocity.x < 0)`],
    ['mup'], ['wait', 1300],
    ['assert', `window.__game.scene.getScene('Game').pShots.getChildren().every(s => !s.active) /* fire must stop on release */`],
    ['down', 'KeyD'], ['wait', 500], ['shot'], ['up', 'KeyD'],
    ['assert', `window.__game.scene.getScene('Game').player.dir === -1 /* back-pedals while facing the crosshair */`],
    ['down', 'KeyJ'], ['wait', 300], ['up', 'KeyJ'],
    ['assert', `!window.__game.scene.getScene('Game').aim && !window.__game.scene.getScene('Hud').cross.visible /* fire key returns to auto-aim */`],
  ] },
  { name: 'death', url: '?stage=1', steps: [['eval', 'window.__run.hp = 1'], ['down', 'KeyD'], ['wait', 9000], ['shot']] },
  // Force lethal damage only to exercise transitions, not to claim combat balance is verified.
  ...[1, 2, 3, 4, 5, 6, 7].map((stage) => ({ name: `flow-stage-${stage}`, url: `?stage=${stage}&boss=1&god=1`, steps: [
    ['down', 'KeyD'], ['until', '!!window.__game.scene.getScene("Game").boss'], ['up', 'KeyD'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.boss.hurt(g.boss.maxHp, g.player.x)'],
    ...(stage < 7 ? [['until', 'window.__game.scene.isActive("Briefing")'], ['wait', 900], ['shot'], ['press', ['Enter', 'window.__game.scene.isActive("Perk")']]] : []),
    ['until', `window.__game.scene.isActive("${stage === 7 ? 'End' : 'Perk'}")`], ['wait', 1300], ['shot'],
    ['assert', `window.__run.stage === ${stage}`], ['tap', 'Enter'],
    ['until', `window.__game.scene.isActive("${stage === 7 ? 'Credits' : 'Game'}")`], ['wait', 700], ['shot'],
    ...(stage < 7 ? [['assert', 'window.__run.perks.length === 1']] : [
      ['wait', 6000], ['shot'], // mid-roll
      ['down', 'KeyJ'], ['until', 'window.__game.scene.getScene("Credits").done'], ['up', 'KeyJ'], ['wait', 2200], ['shot'], // THE END
      ['tap', 'Enter'], ['until', 'window.__game.scene.isActive("Title")'], ['wait', 600], ['shot'],
    ]),
  ] })),
  { name: 'flow-retry', url: '?stage=1', steps: [
    ['wait', 800], ['eval', 'window.__run.score = 1000; var g = window.__game.scene.getScene("Game"); g.player.invuln = 0; g.hurtPlayer(10000, g.player.x - 20)'],
    ['until', 'window.__game.scene.getScene("Game").canRetry'], ['wait', 400], ['shot'], ['tap', 'Enter'], ['wait', 1000],
    ['assert', 'window.__game.scene.getScene("Game").state === "play" && window.__run.hp === window.__run.stats.maxHp && window.__run.score === 800 && window.__game.scene.getScene("Game").physics.world.timeScale === 1'],
    ['tap', 'Escape'], ['wait', 300], ['assert', 'window.__game.scene.isPaused("Game")'], ['shot'],
    ['tap', 'Escape'], ['wait', 300], ['assert', 'window.__game.scene.isActive("Game")'], ['shot'],
  ] },
];

mkdirSync('tools/shots', { recursive: true });
const server = await createServer({ server: { port: 5199, strictPort: false }, logLevel: 'error' });
await server.listen();
const base = server.resolvedUrls.local[0];
let browser;
for (const channel of ['chrome', 'msedge']) {
  try { browser = await chromium.launch({ channel, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] }); break; } catch { /* try next */ }
}
if (!browser) { console.error('No Chrome or Edge found'); process.exit(2); }

let failed = false;
for (const sc of SCENARIOS.filter((s) => s.name.includes(filter))) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  await page.goto(base + sc.url);
  await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).some((s) => s.scene.key !== 'Boot'), null, { timeout: 15000 });
  await page.click('canvas');
  let n = 0;
  try {
  for (const [op, arg] of sc.steps) {
    if (op === 'wait') await page.waitForTimeout(arg);
    else if (op === 'down') await page.keyboard.down(arg);
    else if (op === 'up') await page.keyboard.up(arg);
    else if (op === 'tap') await page.keyboard.press(arg, { delay: 60 });
    else if (op === 'mouse') await page.mouse.move(arg[0], arg[1], { steps: 4 });
    else if (op === 'mdown') await page.mouse.down();
    else if (op === 'mup') await page.mouse.up();
    else if (op === 'eval') await page.evaluate(arg);
    else if (op === 'until') await page.waitForFunction(arg, null, { timeout: 20000 });
    else if (op === 'press') { // tap a key every 250 ms until a condition holds (dialogue, menus)
      const [key, cond] = arg, end = Date.now() + 30000;
      while (!await page.evaluate(cond)) { if (Date.now() > end) throw new Error(`press timed out: ${cond}`); await page.keyboard.press(key, { delay: 40 }); await page.waitForTimeout(250); }
    }
    else if (op === 'assert' && !await page.evaluate(arg)) throw new Error(`Assertion failed: ${arg}`);
    else if (op === 'shot') {
      await page.screenshot({ path: `tools/shots/${sc.name}-${n++}.png` });
      if (sc.name === 'rook-rig') {
        const clip = await page.evaluate(() => {
          const g = window.__game.scene.getScene('Game'), p = g.player;
          const rect = window.__game.canvas.getBoundingClientRect();
          const x = rect.x + (p.x - g.cameras.main.scrollX) * rect.width / 640;
          const y = rect.y + (p.y - g.cameras.main.scrollY) * rect.height / 360;
          return { x: Math.max(0, Math.min(innerWidth - 220, x - 110)), y: Math.max(0, Math.min(innerHeight - 200, y - 170)), width: 220, height: 200 };
        });
        await page.screenshot({ path: `tools/shots/${sc.name}-pose-${n - 1}.png`, clip });
      }
    }
  }
  } catch (e) {
    errors.push(String(e));
    await page.screenshot({ path: `tools/shots/${sc.name}-failure.png` });
  }
  const info = await page.evaluate(() => {
    const g = window.__game, r = window.__run;
    return { scenes: g.scene.getScenes(true).map((s) => s.scene.key).join('+'), fps: Math.round(g.loop.actualFps), score: r?.score, kills: r?.kills, hp: r?.hp, stage: r?.stage };
  });
  console.log(`${errors.length ? 'FAIL' : 'ok  '} ${sc.name.padEnd(15)} ${JSON.stringify(info)}`);
  for (const e of errors) console.log('     ', e.split('\n').slice(0, 4).join('\n      '));
  if (errors.length) failed = true;
  await page.close();
}
await browser.close();
await server.close();
process.exit(failed ? 1 : 0);
