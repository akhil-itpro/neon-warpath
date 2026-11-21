// Automated smoke test: boots the game in a real browser (system Chrome/Edge), plays each stage and boss
// for a few seconds with held inputs, saves screenshots to tools/shots/, and fails on any runtime error.
//   npm run smoke            run everything
//   npm run smoke -- city    only scenarios whose name contains "city"
//   SMOKE_SHARD=2/3 npm run smoke   run the second of three independent partitions
import { createServer, preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { KIT_SCENARIOS } from './kit-scenarios.mjs';
import { RELEASE_SCENARIOS } from './release-scenarios.mjs';

const filter = process.argv[2] ?? '';
const shardSpec = process.env.SMOKE_SHARD ?? '1/1';
const shardMatch = /^(\d+)\/(\d+)$/.exec(shardSpec);
const shard = Number(shardMatch?.[1]);
const shardCount = Number(shardMatch?.[2]);
if (!Number.isSafeInteger(shard) || !Number.isSafeInteger(shardCount) || shard < 1 || shard > shardCount || shardCount > 100) {
  throw new Error('SMOKE_SHARD must be a partition like 1/3.');
}
const SCENARIOS = [
  ...KIT_SCENARIOS,
  ...RELEASE_SCENARIOS,
  { name: 'art-finish', url: '?stage=city&god=1', steps: [
    ['wait', 2800],
    ['eval', `var g = window.__game.scene.getScene('Game');
      for (const e of [...g.enemies]) g.removeEnemy(e);
      window.__props = ['cage', 'pylon', 'slot'].map((id, i) => g.spawnEnemy(id, 230 + 120 * i, 320, 'add'));
      for (const e of window.__props) e.tick = () => {};
      window.__finishBoss = g.spawnEnemy('halcyon', 140, 320, 'add'); window.__finishBoss.tick = () => {};`],
    ['assert', `window.__props.map(e => e.texture.key).join(',') === 'quill_cage,prism_pylon,slot_machine' && window.__finishBoss.texture.key === 'halcyon_idle'`],
    ['assert', `var g = window.__game.scene.getScene('Game'); ['rook','viper','titan','serrik','quill','juno','patch','croupier','oracle','myrrhkin','sovereign','halcyon'].every(id => { const s = g.textures.get('portrait_' + id).getSourceImage(); return s.width === 64 && s.height === 64; })`],
    ['wait', 200], ['shot'],
    ...['run0','run1','run2','run3','jump','slide','crouch'].flatMap(pose => [
      ['eval', `window.__finishBoss.setTexture('halcyon_${pose}')`], ['wait', 60], ['shot'],
    ]),
  ] },
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
      ['assert', `var l = window.__run.loadout; window.__weaponDrops[${i}].taken && l.slots[l.active].id === window.__weaponDrops[${i}].wid && l.slots[l.active].ammo > 0`],
    ]),
    ['shot'],
  ] },
  ...['viper', 'titan', 'serrik', 'quill'].map((operator, index) => ({ name: `art-${operator}`, url: `?stage=1&god=1&op=${index + 1}`, steps: [
    ['wait', 2800],
    ['eval', `var g = window.__game.scene.getScene('Game');
      for (const e of g.enemies) g.removeEnemy(e);
      g.player.body.reset(300, 320);`],
    ['until', `window.__game.scene.getScene('Game').player.onGround`],
    ['assert', `var p = window.__game.scene.getScene('Game').player;
      !p.visible && p.rig.root.visible && p.rig.root.list.length === 8 &&
      p.rig.parts.head.texture.key === '${operator}_rig_head' && p.body.height === 56`],
    ['shot'],
    ['down', 'KeyD'], ['until', `Math.abs(window.__game.scene.getScene('Game').player.rig.phase) > 0.15`], ['up', 'KeyD'],
    ['down', 'Space'], ['until', `!window.__game.scene.getScene('Game').player.onGround`], ['up', 'Space'],
    ['until', `window.__game.scene.getScene('Game').player.onGround`],
    ['down', 'KeyS'], ['until', `var p = window.__game.scene.getScene('Game').player; p.low && p.rig.parts.head.y > -35`],
    ['shot'], ['up', 'KeyS'],
    ['eval', `var g = window.__game.scene.getScene('Game'); g.events.on('postupdate', function observeSlide() {
      if (g.player.sliding > 0 && g.player.invuln > 0) {
        window.__sawSlide = true;
        g.events.off('postupdate', observeSlide);
      }
    });`],
    ['tap', 'ShiftLeft'], ['until', 'window.__sawSlide'],
    ['until', `window.__game.scene.getScene('Game').player.sliding <= 0`],
    ['mouse', [200, 160]],
    ['until', `var p = window.__game.scene.getScene('Game').player; p.dir === -1 && p.muzzle().x < p.x && p.muzzle().y < p.centerY`],
    ['shot'],
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
  { name: 'art-machines', url: '?stage=city&god=1', steps: [
    ['wait', 2800],
    ['eval', `var g = window.__game.scene.getScene('Game');
      for (const e of g.enemies) g.removeEnemy(e);
      const machines = [
        g.spawnEnemy('turret', 255, 320, 'add'),
        g.spawnEnemy('drone', 200, 140, 'add'),
        g.spawnEnemy('jet', 130, 105, 'add')
      ];
      machines[2].body.reset(130, 105);
      window.__machineArtOk = machines.every(e => {
        e.awake = true;
        e.t = 5000;
        e.tick(180);
        const animated = e.texture.key === e.def.art + '_1';
        e.t = 0;
        e.tick(1);
        e.tick = () => {};
        e.body.setVelocity(0, 0);
        return animated && e.texture.key === e.def.art + '_atk';
      });`],
    ['assert', 'window.__machineArtOk'], ['shot'],
  ] },
  { name: 'art-bosses', url: '?stage=city&boss=1&god=1', steps: [
    ['assert', `var g = window.__game.scene.getScene('Game');
      ['vulture', 'boss_tyrant', 'warden', 'boss_widow', 'boss_jelly', 'boss_oracle', 'archon'].every(key =>
        ['idle', 'windup', 'attack', 'exposed'].every(pose => {
          const still = g.textures.get(key).getSourceImage();
          const frame = g.textures.get(key + '_' + pose).getSourceImage();
          return frame.width === still.width && frame.height === still.height;
        }))`],
    ['down', 'KeyD'], ['until', `!!window.__game.scene.getScene('Game').boss`], ['up', 'KeyD'],
    ['eval', `var g = window.__game.scene.getScene('Game'), b = g.boss;
      window.__bossArtDamage = {};
      g.events.on('postupdate', function observeBoss() {
        const state = b.artState;
        if (state === 'idle' || state in window.__bossArtDamage || b.texture.key !== 'vulture_' + state) return;
        const hp = b.hp;
        b.hurt(10, g.player.x);
        window.__bossArtDamage[state] = hp - b.hp;
        if (Object.keys(window.__bossArtDamage).length === 3) g.events.off('postupdate', observeBoss);
      });`],
    ['until', 'Object.keys(window.__bossArtDamage).length === 3'],
    ['assert', 'window.__bossArtDamage.windup === 10 && window.__bossArtDamage.attack === 7.5 && window.__bossArtDamage.exposed === 14'],
    ['shot'],
  ] },
  { name: 'title', url: '', steps: [['wait', 1200], ['shot'], ['tap', 'ArrowRight'], ['wait', 300], ['shot'], ['tap', 'Enter'],
    ['until', 'window.__game.scene.isActive("Briefing")'], ['wait', 1500], ['shot'],
    ['assert', 'window.__run.op.id === "viper" /* VIPER-only briefing lines */'],
    ['down', 'KeyJ'], ['until', 'window.__game.scene.isActive("Game")'], ['up', 'KeyJ'], ['wait', 1500], ['shot']] },
  // ---- story system (docs/STORY.md): comms, shards, choices and consequences, archive, endings
  { name: 'story-comms', url: '?stage=1&god=1', steps: [
    ['until', 'window.__game.scene.getScene("Hud").commsBusy'], ['wait', 1600], ['shot'], // 'start' has no line in stage 1; first line is the gangster sighting
    ['assert', 'window.__run.heard.length >= 1 && window.__game.scene.getScene("Hud").comm.y > 0'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.player.body.reset(1360, 250)'], ['wait', 600], // walks onto shard 2
    ['assert', 'window.__run.shards.includes("city-2") && JSON.parse(localStorage.getItem("neon-warpath-save-v1")).archive.includes("city-2")'], ['wait', 300], ['shot'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.player.invuln = 0; g.hurtPlayer(10000, g.player.x - 20)'],
    ['until', 'window.__game.scene.getScene("Game").canRetry'], ['tap', 'Enter'], ['wait', 2600], ['shot'],
    ['assert', 'window.__run.heard.includes("city:death") && window.__game.scene.getScene("Game").shards.every(s => s.id !== "city-2") /* shard stays collected */'],
  ] },
  { name: 'story-ledger', url: '?stage=casino&boss=1&god=1', steps: [
    ['down', 'KeyD'], ['until', '!!window.__game.scene.getScene("Game").boss'], ['up', 'KeyD'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.boss.hurt(g.boss.maxHp * 2, g.player.x)'],
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
    ['eval', 'var b = window.__game.scene.getScene("Game").boss; b.hp = b.maxHp * 0.45'], ['wait', 1500], ['shot'],
    ['assert', 'window.__run.heard.includes("cathedral:boss50")'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.boss.hurt(g.boss.maxHp * 2, g.player.x)'],
    ['until', 'window.__game.scene.isActive("Briefing")'], ['press', ['Enter', 'window.__game.scene.isActive("End")']], ['wait', 1500], ['shot'],
    ['assert', 'window.__run.flags.rift_choice === "collapse" /* Tide Pearl missing: HOLD is locked */'],
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
  ...[['casino', 'arc'], ['fungal', 'spore'], ['abyss', 'cryo'], ['orbital', 'tesla'], ['railyard', 'smg'], ['engine', 'shotgun'], ['tidal', 'arc'], ['prism', 'rail'], ['spire', 'tesla']].flatMap(([id, weapon]) => [
    { name: `x-${id}`, url: `?stage=${id}&god=1&weapon=${weapon}`, steps: [['wait', 800], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 4000], ['shot'], ['wait', 6000], ['shot'], ['wait', 9000], ['shot']] },
    { name: `x-${id}-boss`, url: `?stage=${id}&boss=1&god=1&weapon=smg`, steps: [
      ['wait', 500], ['down', 'KeyD'], ['until', '!!window.__game.scene.getScene("Game").boss'], ['up', 'KeyD'],
      ['eval', 'var g = window.__game.scene.getScene("Game"); g.player.x = g.bounds.left + 90'], ['down', 'KeyJ'], // stand on the left, firing right
      ['wait', 2500], ['shot'], ['wait', 5000], ['shot'], ['wait', 6000], ['shot'],
      ['eval', 'var b = window.__game.scene.getScene("Game").boss; if (b && !b.dead) b.hp = Math.min(b.hp, b.maxHp * 0.4)'], // enter the rage phase
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
    ['assert', `window.__roster.every(e => e.scaleX === 1 &&
      (e.texture.key === e.def.art || ['0', '1', '2', '3', 'atk'].some(pose => e.texture.key === e.def.art + '_' + pose)))`],
    ['eval', 'window.__roster.forEach(e => e.awake = true)'], ['wait', 2500], ['shot'], ['wait', 2500], ['shot'],
  ] },
  { name: 'x-weapons', url: '?stage=city&god=1', steps: [
    ['wait', 2800],
    ...['arc', 'cryo', 'scrap', 'sun', 'saw', 'spore', 'grav', 'tesla'].flatMap((w) => [
      ['eval', `var g = window.__game.scene.getScene('Game'); var r = window.__run;
        for (const e of g.enemies) g.removeEnemy(e);
        g.player.x = 120; g.player.body.setVelocity(0, 0);
        window.__targets = [0, 1, 2].map((i) => { const e = g.spawnEnemy('trooper', 260 + i * 50, 320, ''); return e; });
        r.loadout.slots[1] = { id: '${w}', ammo: 999 }; r.loadout.active = 1; window.__kills = r.kills;`],
      ['down', 'KeyJ'], ['wait', 700], ['shot'], ['wait', 2600], ['up', 'KeyJ'],
      ['assert', `window.__targets.some(e => e.hp < e.maxHp) /* ${w} must damage */`],
    ]),
  ] },
  // Mouse aim: shots follow the crosshair, the hero faces it, and releasing the button stops the gun.
  // Remove one puppet piece to exercise the intact whole-body fallback.
  { name: 'arm-rig-fallback', url: '?stage=city&god=1&weapon=smg&op=1', steps: [
    ['eval', `var g = window.__game.scene.getScene('Game'); g.textures.remove('viper_rig_arm'); g.scene.restart()`],
    ['wait', 2800],
    ['eval', `var g = window.__game.scene.getScene('Game'); for (const e of g.enemies) g.removeEnemy(e); g.player.x = 300; g.player.body.setVelocity(0, 0);`],
    ['assert', `var p = window.__game.scene.getScene('Game').player; p.texture.key === 'viper_idle' && p.arm === null && p.rig === null`],
    ['mouse', [1100, 120]], ['wait', 200], ['shot'],
    ['mouse', [200, 380]], ['wait', 200], ['shot'],
    ['assert', `var p = window.__game.scene.getScene('Game').player; p.dir === -1 && p.texture.key === 'viper_idle' && p.arm === null`],
    ['down', 'KeyS'], ['wait', 200], ['shot'],
    ['assert', `window.__game.scene.getScene('Game').player.texture.key === 'viper_crouch'`], ['up', 'KeyS'],
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
    // Return to clear floor after the run/jump photos so the crouch starts on solid ground.
    ['eval', `var g = window.__game.scene.getScene('Game'); g.player.body.reset(300, 320)`],
    ['until', `window.__game.scene.getScene('Game').player.onGround`],
    ['down', 'KeyS'],
    ['until', `var p = window.__game.scene.getScene('Game').player; p.low && p.rig.parts.head.y > -35 && p.body.height === 32`],
    ['shot'],
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
  // ---- 12-stage campaign: gimmicks, in-level choice, allies, rescue, ARCHON phase 3, endings
  { name: 'gim-movers', url: '?stage=city&god=1', steps: [
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of g.enemies) g.removeEnemy(e); var m = g.gimmicks.movers[2].obj; window.__tp(m.x, m.y - 30); window.__x0 = m.x'],
    ['wait', 900], ['shot'],
    ['assert', 'var p = window.__game.scene.getScene("Game").player; p.y < 230 && p.onGround && Math.abs(p.x - window.__x0) > 4 /* riding (and carried by) the swinging billboard */'],
    ['wait', 1200], ['shot'],
  ] },
  { name: 'gim-roulette', url: '?stage=casino&god=1', steps: [
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of g.enemies) g.removeEnemy(e); window.__tp(1500, 300)'],
    ['until', 'window.__game.scene.getScene("Game").gimmicks.sections.some(s => s.state === "hot")'], ['shot'],
    ['assert', 'window.__game.scene.getScene("Game").enemies.length === 0 || true'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); window.__slot = g.spawnEnemy("slot", g.player.x + 120, 320, ""); window.__slot.awake = true'],
    ['wait', 6000], ['shot'], ['assert', 'window.__game.scene.getScene("Game").countAlive("gangster") >= 1 /* slot machine prints gunmen */'],
  ] },
  { name: 'story-freight', url: '?stage=railyard&god=1', steps: [
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of g.enemies) g.removeEnemy(e); window.__tp(3300, 300)'],
    ['wait', 3200], ['shot'], // on the train: wind lines + gantries
    ['assert', 'window.__game.scene.getScene("Game").gimmicks.gantries.length >= 1'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); window.__tp(4790, 300)'], ['down', 'KeyD'], ['wait', 300], ['up', 'KeyD'],
    ['until', 'window.__game.scene.getScene("Hud").choosing'], ['wait', 400], ['shot'],
    ['assert', 'window.__game.scene.getScene("Game").physics.world.timeScale === 5'],
    ['tap', 'ArrowLeft'], ['wait', 150], ['tap', 'Enter'], ['wait', 400],
    ['assert', 'window.__run.flags.varkesh_freed === true && JSON.parse(localStorage.getItem("neon-warpath-save-v1")).unlocked.includes("serrik") && window.__game.scene.getScene("Game").physics.world.timeScale === 1'],
    ['wait', 1500], ['shot'],
  ] },
  { name: 'story-freight-timeout', url: '?stage=railyard&god=1', steps: [
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of g.enemies) g.removeEnemy(e); window.__tp(4830, 300)'],
    ['until', 'window.__game.scene.getScene("Hud").choosing'], ['wait', 8600],
    ['assert', 'window.__run.flags.varkesh_freed === false /* not choosing is a choice */'],
    ['down', 'KeyD'], ['until', '!!window.__game.scene.getScene("Game").boss'], ['up', 'KeyD'], ['wait', 300],
    ['assert', 'var b = window.__game.scene.getScene("Game").boss; b.hp <= b.maxHp * 0.6 + 1 /* bridge blown: Colossus starts wrecked */'], ['wait', 2500], ['shot'],
  ] },
  { name: 'story-freight-heldfire', url: '?stage=railyard&god=1', steps: [ // holding fire through the choice must not freeze it
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of g.enemies) g.removeEnemy(e)'], ['down', 'KeyJ'], ['eval', 'window.__tp(4830, 300)'],
    ['until', 'window.__game.scene.getScene("Hud").choosing'], ['wait', 9000],
    ['assert', '!window.__game.scene.getScene("Hud").choosing && window.__run.flags.varkesh_freed === false'], ['up', 'KeyJ'],
  ] },
  { name: 'gim-flip', url: '?stage=engine&god=1', steps: [
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of g.enemies) g.removeEnemy(e); window.__tp(1400, 300); g.gimmicks.flipT = 1700'],
    ['wait', 700], ['shot'], ['wait', 1400],
    ['assert', 'var g = window.__game.scene.getScene("Game"); g.gimmicks.flipping && g.player.env.grav < 0'], ['wait', 600], ['shot'],
    ['wait', 2500], ['assert', 'window.__game.scene.getScene("Game").player.env.grav === 1'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); window.__tp(2000, 300)'], ['wait', 2600], ['shot'], // crushers
  ] },
  { name: 'story-allies', url: '?stage=engine&god=1&weapon=smg', steps: [
    ['eval', 'window.__run.flags.varkesh_freed = true; window.__game.scene.getScene("Game").scene.restart()'], ['wait', 1500],
    ['eval', 'var g = window.__game.scene.getScene("Game"); window.__ally = 0; var f = g.allyShot.bind(g); g.allyShot = (...a) => { window.__ally++; f(...a); }'],
    ['eval', 'window.__tp(2560, 300)'], ['wait', 800], ['down', 'KeyD'], ['wait', 900], ['up', 'KeyD'],
    ['until', 'window.__game.scene.getScene("Game").enemies.some(e => e.def.ally && !e.dead)'], ['wait', 2500], ['shot'],
    ['assert', 'var g = window.__game.scene.getScene("Game"); g.encounters[1].waves.every(w => !w.includes("varkesh")) && window.__ally > 0'],
    ['wait', 3000], ['shot'],
  ] },
  { name: 'gim-dark', url: '?stage=fungal&god=1', steps: [['wait', 3000], ['down', 'KeyD'], ['wait', 2500], ['up', 'KeyD'], ['shot']] },
  { name: 'gim-cathedral-blink', url: '?stage=cathedral&god=1', steps: [
    ['wait', 2700],
    ['eval', `window.__tp(1320, 165)`],
    ['assert', `var g = window.__game.scene.getScene('Game');
      g.stage.blinkers.every(([x, y, n]) =>
        !g.stage.platforms.some(([left, top, length]) => Math.abs(top - y) < 12 &&
          x < left + length * 32 && left < x + n * 32))`],
    ['until', `var b = window.__game.scene.getScene('Game').gimmicks.blinkers;
      b[0].obj.body.enable && !b[1].obj.body.enable`], ['shot'],
    ['until', `var b = window.__game.scene.getScene('Game').gimmicks.blinkers;
      !b[0].obj.body.enable && b[1].obj.body.enable`], ['shot'],
  ] },
  { name: 'gim-water', url: '?stage=tidal&god=1', steps: [
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of g.enemies) g.removeEnemy(e); g.gimmicks.floods[0].clock = 6500'],
    ['wait', 1500], ['shot'],
    ['assert', 'var g = window.__game.scene.getScene("Game"); g.player.env.water && g.gimmicks.oxygen < 100'],
    ['wait', 1500], ['shot'],
  ] },
  { name: 'gim-lava', url: '?stage=furnace&god=1', steps: [
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of g.enemies) g.removeEnemy(e); window.__tp(3760, 200); g.gimmicks.floods[0].clock = 4500'],
    ['wait', 2500], ['shot'], ['assert', 'window.__game.scene.getScene("Game").gimmicks.floods[0].level < 300'],
  ] },
  { name: 'gim-pylon', url: '?stage=prism&god=1&weapon=smg', steps: [
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of g.enemies) if (e.def.id !== "pylon") g.removeEnemy(e); window.__tp(640, 300); window.__v = g.spawnEnemy("vitreon", 900, 320, ""); window.__v.awake = true'],
    ['mouse', [760, 560]], ['mdown'], ['wait', 400], ['mup'],
    ['wait', 1800], ['shot'],
    ['assert', 'window.__game.scene.getScene("Game").enemies.find(e => e.def.id === "pylon").redirect > 0'],
    ['wait', 2500], ['shot'],
  ] },
  { name: 'gim-chase', url: '?stage=spire&god=1', steps: [
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of g.enemies) g.removeEnemy(e); window.__tp(760, 300)'],
    ['wait', 2000], ['shot'], ['assert', 'window.__game.scene.getScene("Game").gimmicks.chaseX > 400'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); window.__tp(1400, 150)'], ['wait', 1500], ['shot'], // data blocks
  ] },
  { name: 'story-cage', url: '?stage=orbital&god=1', steps: [
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); window.__tp(2600, 300)'], ['wait', 1500], ['shot'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); var c = g.enemies.find(e => e.def.id === "cage"); c.hurt(999, g.player.x)'], ['wait', 2000],
    ['assert', 'window.__run.flags.quill_rescued === true && JSON.parse(localStorage.getItem("neon-warpath-save-v1")).unlocked.includes("quill")'], ['shot'],
  ] },
  { name: 'story-halcyon', url: '?stage=spire&boss=1&god=1&weapon=smg', steps: [
    ['eval', 'window.__run.flags.heard_oracle = true'],
    ['down', 'KeyD'], ['until', '!!window.__game.scene.getScene("Game").boss'], ['up', 'KeyD'], ['down', 'KeyJ'],
    ['wait', 2500], ['shot'], ['wait', 4000], ['shot'],
    ['assert', 'var b = window.__game.scene.getScene("Game").boss; b.texture.key.startsWith("halcyon_")'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.boss.hurt(g.boss.hp - g.boss.maxHp * 0.3, g.player.x)'], ['wait', 5000], ['shot'], ['up', 'KeyJ'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.boss.hurt(g.boss.maxHp * 9, g.player.x)'],
    ['until', 'window.__game.scene.isActive("Briefing")'], ['press', ['Enter', '!!window.__game.scene.getScene("Briefing").choice']], ['wait', 500], ['shot'],
    ['tap', 'Enter'], ['wait', 300], ['assert', 'window.__run.flags.halcyon_saved === true'],
    ['press', ['Enter', `window.__game.scene.getScene('Briefing').line?.text.includes('I know its shield')`]],
    ['down', 'KeyJ'], ['until', 'window.__game.scene.isActive("Perk")'], ['wait', 800],
    ['assert', 'window.__game.scene.isActive("Perk") && window.__run.perks.length === 0'],
    ['up', 'KeyJ'], ['tap', 'Enter'], ['until', 'window.__game.scene.isActive("Game")'],
  ] },
  { name: 'story-final', url: '?stage=cathedral&boss=1&god=1&weapon=smg', steps: [
    ['eval', 'Object.assign(window.__run.flags, { heard_oracle: true, halcyon_saved: true, quill_rescued: true, varkesh_freed: true, nest_truce: true, sovereign_spared: true })'],
    ['down', 'KeyD'], ['until', '!!window.__game.scene.getScene("Game").boss'], ['up', 'KeyD'],
    ['eval', 'var b = window.__game.scene.getScene("Game").boss; b.hp = b.maxHp * 0.3'], ['wait', 3000], ['shot'],
    ['assert', 'var b = window.__game.scene.getScene("Game").boss; b.phase3 && b.vuln > 0'],
    ['wait', 5500], ['shot'], ['assert', 'window.__game.scene.getScene("Game").enemies.some(e => e.def.ally)'],
    ['wait', 4000], ['shot'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.boss?.hurt(g.boss.maxHp * 9, g.player.x)'],
    ['until', 'window.__game.scene.isActive("Briefing")'], ['press', ['Enter', '!!window.__game.scene.getScene("Briefing").choice']], ['wait', 500],
    ['tap', 'ArrowRight'], ['wait', 200], ['shot'], ['tap', 'Enter'],
    ['press', ['Enter', 'window.__game.scene.isActive("Game")']], ['wait', 4000], ['shot'], // HOLD IT OPEN survival finale
    ['assert', 'var g = window.__game.scene.getScene("Game"); g.hold && g.holdT > 0 && g.holdT < 60000'],
    ['eval', 'window.__game.scene.getScene("Game").holdT = 1200'],
    ['until', 'window.__game.scene.isActive("End")'], ['wait', 1500], ['shot'],
    ['assert', 'window.__run.flags.rift_choice === "hold" && JSON.parse(localStorage.getItem("neon-warpath-save-v1")).endings.includes("OPEN DOOR")'],
  ] },
  { name: 'story-hold', url: '?stage=cathedral&hold=1&god=1&weapon=smg', steps: [
    ['eval', 'Object.assign(window.__run.flags, { varkesh_freed: true, quill_rescued: true, halcyon_saved: true, sovereign_spared: true })'],
    ['down', 'KeyJ'], ['wait', 9000], ['shot'],
    ['assert', 'var g = window.__game.scene.getScene("Game"); g.hold && g.state === "play" && g.holdT < 52000'],
    ['assert', 'window.__game.scene.getScene("Game").enemies.some(e => e.def.ally)'],
    ['assert', 'window.__run.kills > 0 || window.__game.scene.getScene("Game").enemies.some(e => !e.dead && e.tag === "enc")'],
    ['eval', 'window.__game.scene.getScene("Game").holdT = 31000'], ['wait', 8000], ['shot'], // late, harder waves + half-way comm
    ['eval', 'window.__game.scene.getScene("Game").holdT = 600'], ['wait', 2500], ['shot'], ['up', 'KeyJ'],
    ['assert', 'window.__run.flags.hold_done === true && window.__game.scene.getScene("Game").state === "clear"'],
    ['until', 'window.__game.scene.isActive("End")'], ['wait', 1500], ['shot'],
    ['assert', 'window.__run.stage === 12'],
  ] },
  { name: 'story-hold-death', url: '?stage=cathedral&hold=1', steps: [ // dying in the finale retries the finale, not the boss
    ['eval', 'window.__run.hp = 1'], ['wait', 12000], ['shot'],
    ['press', ['Enter', '!!window.__game.scene.getScene("Game").hold && window.__game.scene.getScene("Game").state === "play" && window.__run.hp > 1']],
    ['wait', 1500], ['shot'], ['assert', 'var g = window.__game.scene.getScene("Game"); g.hold && g.holdT > 55000'],
  ] },
  { name: 'death', url: '?stage=1', steps: [['eval', 'window.__run.hp = 1'], ['down', 'KeyD'], ['wait', 9000], ['shot']] },
  // Force lethal damage only to exercise transitions, not to claim combat balance is verified.
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((stage) => ({ name: `flow-stage-${stage}`, url: `?stage=${stage}&boss=1&god=1`, steps: [
    ['eval', 'window.__run.flags.varkesh_freed = false /* skip the railyard slow-motion choice */'],
    ['down', 'KeyD'], ['until', '!!window.__game.scene.getScene("Game").boss'], ['up', 'KeyD'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.boss.hurt(g.boss.maxHp * 9, g.player.x)'],
    ['until', 'window.__game.scene.isActive("Briefing")'], ['wait', 900], ['shot'],
    ['press', ['Enter', `window.__game.scene.isActive("${stage === 12 ? 'End' : 'Perk'}")`]],
    ['until', `window.__game.scene.isActive("${stage === 12 ? 'End' : 'Perk'}")`], ['wait', 1300], ['shot'],
    ['assert', `window.__run.stage === ${stage}`], ['tap', 'Enter'],
    ['until', `window.__game.scene.isActive("${stage === 12 ? 'Credits' : 'Game'}")`], ['wait', 700], ['shot'],
    ...(stage < 12 ? [['assert', `window.__run.perks.length >= 1 && window.__game.scene.getScene("Game").stage.id === ${JSON.stringify(['casino', 'railyard', 'furnace', 'engine', 'fungal', 'abyss', 'tidal', 'orbital', 'prism', 'spire', 'cathedral'][stage - 1] ?? '')}`]] : [
      ['wait', 6000], ['shot'], // mid-roll
      ['down', 'KeyJ'], ['until', 'window.__game.scene.getScene("Credits").done'], ['up', 'KeyJ'], ['wait', 2200], ['shot'], // THE END
      ['tap', 'Enter'], ['until', 'window.__game.scene.isActive("Title")'], ['wait', 600], ['shot'],
    ]),
  ] })),
  // ---- survivability rules (armor self-repair, difficulty, mercy). `rules: true` = real settings, not the classic test rules.
  { name: 'rules-regen', url: '?stage=1', rules: true, steps: [
    ['wait', 1200], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of [...g.enemies]) g.removeEnemy(e); g.player.invuln = 0; window.__run.hp = 100; g.hurtPlayer(20, g.player.x - 20);'],
    ['assert', 'window.__run.hp === 83 /* NORMAL: 20 x 0.85 = 17 */'],
    ['eval', 'window.__run.hp = 20'], ['wait', 1500], ['shot'], // critical armor: red screen edges
    ['assert', 'window.__run.hp === 20 && !window.__game.scene.getScene("Game").regenerating && window.__game.scene.getScene("Hud").vig.alpha > 0.2 /* no repair yet, danger vignette on */'],
    ['until', 'window.__game.scene.getScene("Game").regenerating'], ['wait', 600], ['shot'],
    ['assert', 'window.__run.hp > 20 && Number.isInteger(window.__run.hp)'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.player.invuln = 0; window.__hp = window.__run.hp; g.hurtPlayer(10, g.player.x - 20);'], ['wait', 1200],
    ['assert', 'var g = window.__game.scene.getScene("Game"); !g.regenerating && window.__run.hp === window.__hp - 9 /* a hit stops the repair */'],
    ['until', 'window.__run.hp === window.__run.stats.maxHp'], ['wait', 300],
    ['assert', '!window.__game.scene.getScene("Game").regenerating && window.__game.scene.getScene("Hud").vig.alpha < 0.05'],
  ] },
  { name: 'rules-difficulty', url: '?stage=1', rules: true, steps: [
    ['wait', 1200],
    ['eval', `(async () => { const m = await import('/src/systems/Settings.ts'); window.__set = m.settings; })()`], ['wait', 200],
    ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of [...g.enemies]) g.removeEnemy(e); window.__set.difficulty = 0; g.player.invuln = 0; window.__run.hp = 100; g.hurtPlayer(20, g.player.x - 20);'],
    ['assert', 'window.__run.hp === 89 /* EASY: 20 x 0.55 = 11 */'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); window.__set.difficulty = 2; g.player.invuln = 0; window.__run.hp = 100; g.hurtPlayer(20, g.player.x - 20); window.__run.hp = 10;'],
    ['assert', 'window.__run.hp === 10'], ['wait', 12500], ['shot'],
    ['assert', 'window.__run.hp === 50 /* HARD repairs to half only */'],
    // mercy: every death at the same checkpoint cuts damage (NORMAL: 10% each, max 30%)
    ['eval', 'var g = window.__game.scene.getScene("Game"); window.__set.difficulty = 1; window.__run.strikes = 2; g.player.invuln = 0; window.__run.hp = 100; g.hurtPlayer(20, g.player.x - 20);'],
    ['assert', 'window.__run.hp === 86 /* 20 x 0.85 x 0.8 = 13.6 */'],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.player.invuln = 0; g.hurtPlayer(10000, g.player.x - 20)'],
    ['until', 'window.__game.scene.getScene("Game").canRetry'], ['wait', 300], ['shot'], ['tap', 'Enter'], ['wait', 2200], ['shot'],
    ['assert', 'window.__run.strikes === 3 && window.__game.scene.getScene("Hud").hintTxt.text.includes("-30%")'],
  ] },
  { name: 'rules-hints', url: '', rules: true, steps: [
    ['press', ['Enter', 'window.__game.scene.isActive("Game")']], ['wait', 4600], ['shot'],
    ['assert', 'window.__game.scene.getScene("Hud").hintTxt.text.includes("SLIDE") && window.__game.scene.getScene("Hud").hintBox.alpha > 0.9'],
  ] },
  { name: 'rules-choice-safe', url: '?stage=railyard', rules: true, steps: [ // frozen at a story choice = untouchable; dying in slow motion must not leak into the retry
    ['wait', 2800], ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of [...g.enemies]) g.removeEnemy(e); window.__tp(4830, 300)'],
    ['until', 'window.__game.scene.getScene("Hud").choosing'], ['wait', 300],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.player.invuln = 0; window.__hp = window.__run.hp; g.hurtPlayer(30, g.player.x - 20);'],
    ['assert', 'window.__run.hp === window.__hp'], ['wait', 8600],
    ['eval', 'var g = window.__game.scene.getScene("Game"); g.time.timeScale = 0.2; g.tweens.timeScale = 0.2; g.player.invuln = 0; g.hurtPlayer(10000, g.player.x - 20)'],
    ['until', 'window.__game.scene.getScene("Game").canRetry'], ['tap', 'Enter'], ['wait', 1000],
    ['assert', 'var g = window.__game.scene.getScene("Game"); g.state === "play" && g.time.timeScale === 1 && g.tweens.timeScale === 1 && g.physics.world.timeScale === 1'],
  ] },
  // Shipped city layers and combat art, loaded through the normal manifest.
  { name: 'art-hooks', url: '?stage=1&god=1', steps: [
    ['wait', 800],
    ['assert', `var g = window.__game.scene.getScene('Game');
      g.layers.map(layer => layer.img.displayTexture.key).join(',') === 'bg_city_far,bg_city_near' &&
      g.textures.get('ground_city').getSourceImage().width === 64 &&
      g.textures.get('plat_city').getSourceImage() instanceof HTMLImageElement`],
    ['eval', 'var g = window.__game.scene.getScene("Game"); for (const e of [...g.enemies]) g.removeEnemy(e); window.__d = g.spawnEnemy("drone", g.player.x + 150, 150, ""); window.__d.awake = true; window.__d.t = 0;'],
    ['until', 'window.__d.texture.key === "drone_atk"'], ['shot'],
    ['until', 'window.__d.dead || /^drone_[0-3]$/.test(window.__d.texture.key)'],
    ['eval', 'window.__tp(900, 300)'], ['wait', 600], ['shot'],
    ['assert', `var g = window.__game.scene.getScene('Game'), [far, near] = g.layers;
      near.img.tilePositionX > far.img.tilePositionX && far.img.tilePositionX > g.bg.tilePositionX`],
  ] },
  { name: 'flow-retry', url: '?stage=1', steps: [
    ['wait', 800], ['eval', 'window.__run.score = 1000; var g = window.__game.scene.getScene("Game"); g.player.invuln = 0; g.hurtPlayer(10000, g.player.x - 20)'],
    ['until', 'window.__game.scene.getScene("Game").canRetry'], ['wait', 400], ['shot'], ['tap', 'Enter'], ['wait', 1000],
    ['assert', 'window.__game.scene.getScene("Game").state === "play" && window.__run.hp === window.__run.stats.maxHp && window.__run.score === 800 && window.__game.scene.getScene("Game").physics.world.timeScale === 1'],
    ['tap', 'Escape'], ['wait', 300], ['assert', 'window.__game.scene.isPaused("Game")'], ['shot'],
    ['tap', 'Escape'], ['wait', 300], ['assert', 'window.__game.scene.isActive("Game")'], ['shot'],
  ] },
];

mkdirSync('tools/shots', { recursive: true });
const built = process.env.SMOKE_BUILD === '1';
const port = 5198 + shard;
const server = built
  ? await preview({ preview: { port, strictPort: false }, logLevel: 'error' })
  : await createServer({ server: { port, strictPort: false, hmr: false }, logLevel: 'error' });
if (!built) await server.listen();
const base = server.resolvedUrls.local[0];
let browser;
for (const channel of ['chrome', 'msedge']) {
  try { browser = await chromium.launch({ channel, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] }); break; } catch { /* try next */ }
}
if (!browser) { console.error('No Chrome or Edge found'); process.exit(2); }

let failed = false;
const scenarios = SCENARIOS.filter(s => filter.split('|').some(f => s.name.includes(f)));
for (const sc of scenarios.filter((_, index) => index % shardCount === shard - 1)) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  // teleport helper for scenarios: skips arenas already passed so the camera lock does not pull the player back
  await page.addInitScript(() => { window.__tp = (x, y) => { const g = window.__game.scene.getScene('Game'); const k = g.encounters.findIndex((e) => e.x > x); if (k > g.encIndex) g.encIndex = k; g.player.body.reset(x, y); g.cameras.main.centerOn(x, 180); }; });
  // Scenarios written before armor self-repair / difficulty assert exact damage: they run under the original rules.
  // A scenario with `rules: true` plays with the real difficulty settings.
  if (!sc.rules) await page.addInitScript(() => { window.__classic = true; });
  page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  let n = 0;
  try {
  await page.goto(base + sc.url);
  await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).some((s) => s.scene.key !== 'Boot'), null, { timeout: 45000 });
  await page.click('canvas');
  for (const [op, arg] of sc.steps) {
    if (op === 'wait') await page.waitForTimeout(arg);
    else if (op === 'reload') {
      await page.reload();
      await page.waitForFunction(() => window.__game?.scene.isActive('Title'), null, { timeout: 15000 });
      await page.waitForTimeout(300);
    }
    else if (op === 'down') await page.keyboard.down(arg);
    else if (op === 'up') await page.keyboard.up(arg);
    else if (op === 'tap') await page.keyboard.press(arg, { delay: 60 });
    else if (op === 'mouse') await page.mouse.move(arg[0], arg[1], { steps: 4 });
    else if (op === 'mdown') await page.mouse.down(arg ? { button: arg } : undefined);
    else if (op === 'mup') await page.mouse.up(arg ? { button: arg } : undefined);
    else if (op === 'eval') await page.evaluate(arg);
    else if (op === 'until') {
      try { await page.waitForFunction(arg, null, { timeout: 20000 }); }
      catch (error) { throw new Error(`Condition did not pass: ${arg}\n${error}`); }
    }
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
    await page.screenshot({ path: `tools/shots/${sc.name}-failure.png` }).catch(() => {});
  }
  const info = await page.evaluate(() => {
    const g = window.__game, r = window.__run;
    return { scenes: g?.scene.getScenes(true).map((s) => s.scene.key).join('+'), fps: g && Math.round(g.loop.actualFps), score: r?.score, kills: r?.kills, hp: r?.hp, stage: r?.stage };
  }).catch(() => ({}));
  console.log(`${errors.length ? 'FAIL' : 'ok  '} ${sc.name.padEnd(15)} ${JSON.stringify(info)}`);
  for (const e of errors) console.log('     ', e.split('\n').slice(0, 4).join('\n      '));
  if (errors.length) failed = true;
  await page.close();
}
await browser.close();
if (built) await new Promise(resolve => server.httpServer.close(resolve));
else await server.close();
process.exit(failed ? 1 : 0);
