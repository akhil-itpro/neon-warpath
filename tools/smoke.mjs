// Automated smoke test: boots the game in a real browser (system Chrome/Edge), plays each stage and boss
// for a few seconds with held inputs, saves screenshots to tools/shots/, and fails on any runtime error.
//   npm run smoke            run everything
//   npm run smoke -- city    only scenarios whose name contains "city"
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const filter = process.argv[2] ?? '';
const SCENARIOS = [
  { name: 'title', url: '', steps: [['wait', 1200], ['shot'], ['tap', 'ArrowRight'], ['wait', 300], ['shot'], ['tap', 'Enter'], ['wait', 1500], ['shot']] },
  { name: 'city', url: '?stage=1&god=1', steps: [['wait', 800], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 3000], ['shot'], ['tap', 'Space'], ['wait', 400], ['tap', 'ShiftLeft'], ['wait', 5000], ['shot'], ['wait', 9000], ['shot']] },
  { name: 'city-boss', url: '?stage=1&boss=1&god=1&weapon=smg', steps: [['wait', 500], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 6000], ['shot'], ['up', 'KeyD'], ['wait', 9000], ['shot'], ['wait', 30000], ['shot']] },
  { name: 'furnace', url: '?stage=2&god=1&weapon=shotgun', steps: [['wait', 800], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 5000], ['shot'], ['wait', 9000], ['shot']] },
  { name: 'furnace-boss', url: '?stage=2&boss=1&god=1&weapon=rocket', steps: [['wait', 500], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 7000], ['shot'], ['wait', 12000], ['shot']] },
  { name: 'cathedral', url: '?stage=3&god=1&weapon=rail', steps: [['wait', 800], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 5000], ['shot'], ['wait', 9000], ['shot']] },
  { name: 'cathedral-boss', url: '?stage=3&boss=1&god=1&weapon=smg', steps: [['wait', 500], ['down', 'KeyD'], ['down', 'KeyJ'], ['wait', 7000], ['shot'], ['up', 'KeyD'], ['wait', 12000], ['shot']] },
  { name: 'death', url: '?stage=1', steps: [['eval', 'window.__run.hp = 1'], ['down', 'KeyD'], ['wait', 9000], ['shot']] },
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
  await page.goto(base + sc.url);
  await page.waitForFunction(() => window.__game && window.__game.scene.getScenes(true).some((s) => s.scene.key !== 'Boot'), null, { timeout: 15000 });
  await page.click('canvas');
  let n = 0;
  for (const [op, arg] of sc.steps) {
    if (op === 'wait') await page.waitForTimeout(arg);
    else if (op === 'down') await page.keyboard.down(arg);
    else if (op === 'up') await page.keyboard.up(arg);
    else if (op === 'tap') await page.keyboard.press(arg, { delay: 60 });
    else if (op === 'eval') await page.evaluate(arg);
    else if (op === 'shot') await page.screenshot({ path: `tools/shots/${sc.name}-${n++}.png` });
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
