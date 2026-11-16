// Difficulty probe: a simple bot plays every stage and every boss in a real browser and reports
// how much damage it took and how long each part lasted. It does not dodge on purpose, so the numbers
// are a pessimistic upper bound; they are meant for comparing stages and spotting outliers, not as proof
// that a stage is beatable.
//   npm run balance              all stages
//   npm run balance -- tidal     only stage ids containing "tidal"
// HP is set very high so the bot never dies; "dmg" is what a normal player would have lost (ROOK has 100).
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const filter = process.argv[2] ?? '';
const IDS = ['city', 'casino', 'railyard', 'furnace', 'engine', 'fungal', 'abyss', 'tidal', 'orbital', 'prism', 'spire', 'cathedral'];
const STAGE_CAP = 180000, BOSS_CAP = 150000;

const server = await createServer({ server: { port: 5198, strictPort: false }, logLevel: 'error' });
await server.listen();
const base = server.resolvedUrls.local[0];
let browser;
for (const channel of ['chrome', 'msedge']) {
  try { browser = await chromium.launch({ channel, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] }); break; } catch { /* try next */ }
}
if (!browser) { console.error('No Chrome or Edge found'); process.exit(2); }

const HUGE = 100000;
const state = `(() => { const g = window.__game.scene.getScene('Game'); const r = window.__run;
  return { scene: window.__game.scene.getScenes(true).map((s) => s.scene.key).join('+'), x: g?.player?.x ?? 0, w: g?.stage?.width ?? 1,
    boss: !!g?.boss, bossHp: g?.boss ? g.boss.hp / g.boss.maxHp : 1, hp: r.hp, state: g?.state, choosing: g?.choosing, locked: g?.locked }; })()`;

async function probe(id, boss) {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${base}?stage=${id}${boss ? '&boss=1' : ''}`);
  await page.waitForFunction(() => window.__game?.scene.getScene('Game')?.player, null, { timeout: 15000 });
  await page.evaluate((h) => { window.__run.stats.maxHp = h; window.__run.hp = h; }, HUGE);
  await page.click('canvas');
  await page.keyboard.down('KeyJ');
  const t0 = Date.now(), cap = boss ? BOSS_CAP : STAGE_CAP;
  let s = await page.evaluate(state), bossSeen = 0, k = 0, dir = 'KeyD', result = 'timeout';
  await page.keyboard.down(dir);
  while (Date.now() - t0 < cap) {
    await page.waitForTimeout(150);
    s = await page.evaluate(state);
    if (!s.scene.includes('Game') || s.state === 'clear') { result = 'clear'; break; }
    if (!boss && s.boss) { result = 'reached boss'; break; }
    if (s.boss && !bossSeen) bossSeen = Date.now();
    k++;
    // move: forward through the stage; in a fight, strafe back and forth
    const want = (s.locked || s.boss) ? (Math.floor(k / 10) % 2 ? 'KeyA' : 'KeyD') : 'KeyD';
    if (want !== dir) { await page.keyboard.up(dir); dir = want; await page.keyboard.down(dir); }
    if (k % 7 === 0) await page.keyboard.press('Space', { delay: 180 });
    if (k % 23 === 0) await page.keyboard.press('ShiftLeft', { delay: 60 });
    if (k % 40 === 0) await page.keyboard.press('KeyQ');
  }
  const secs = Math.round((Date.now() - t0) / 1000);
  const dmg = HUGE - s.hp;
  await page.close();
  return { id, part: boss ? 'boss' : 'stage', result, secs, dmg, bossLeft: boss ? Math.round(s.bossHp * 100) + '%' : '', dps: +(dmg / Math.max(1, secs) * 60).toFixed(0), errors: errors.length };
}

const rows = [];
for (const id of IDS.filter((i) => i.includes(filter))) {
  for (const boss of [false, true]) {
    try { const r = await probe(id, boss); rows.push(r); console.log(JSON.stringify(r)); }
    catch (e) { console.log(JSON.stringify({ id, part: boss ? 'boss' : 'stage', error: String(e).slice(0, 200) })); }
  }
}
console.log('\nid         part   result        secs   dmg  dmg/min  boss left');
for (const r of rows) console.log(`${r.id.padEnd(10)} ${r.part.padEnd(6)} ${r.result.padEnd(13)} ${String(r.secs).padStart(4)} ${String(r.dmg).padStart(5)} ${String(r.dps).padStart(8)}  ${r.bossLeft}`);
await browser.close();
await server.close();
