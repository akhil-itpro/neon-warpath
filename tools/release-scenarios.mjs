const deploy = [
  ['wait', 1200], ['tap', 'Enter'], ['until', 'window.__game.scene.isActive("Briefing")'],
  ['down', 'KeyJ'], ['until', 'window.__game.scene.isActive("Game")'], ['up', 'KeyJ'], ['wait', 1500],
];

const game = "window.__game.scene.getScene('Game')";
const armoryReady = ['eval', `var g = ${game}; for (const e of g.enemies) g.removeEnemy(e);`];
const collectShotgun = ['eval', `var g = ${game}, p = g.player;
  g.dropPickup('weapon', p.x, p.centerY);
  var item = g.pickups.at(-1);
  item.wid = 'shotgun'; item.age = 200; item.setVelocity(0, 0); item.body.setAllowGravity(false);`];

export const RELEASE_SCENARIOS = [
  { name: 'armory-switch', url: '?stage=city&weapon=smg&god=1', steps: [
    ['wait', 1000], armoryReady, collectShotgun,
    ['until', 'window.__run.loadout.active === 2'],
    ['assert', 'window.__run.loadout.slots[1].id === "smg" && window.__run.loadout.slots[2].id === "shotgun"'],
    ['shot'],
    ['tap', 'Digit1'], ['until', 'window.__run.loadout.active === 0'],
    ['down', 'Tab'], ['until', 'window.__run.loadout.active === 1'], ['wait', 180],
    ['assert', 'window.__run.loadout.active === 1'], ['up', 'Tab'],
    ['eval', 'window.__ripperAmmo = window.__run.loadout.slots[1].ammo'],
    ['down', 'KeyJ'], ['until', 'window.__run.loadout.slots[1].ammo < window.__ripperAmmo'], ['up', 'KeyJ'],
    ['assert', 'window.__run.loadout.slots[2].ammo === 28'],
    ['tap', 'Escape'], ['until', 'window.__game.scene.isPaused("Game")'], ['tap', 'Digit3'],
    ['assert', 'window.__run.loadout.active === 1'], ['tap', 'Escape'],
    ['tap', 'Digit3'], ['until', 'window.__run.loadout.active === 2'],
    ['assert', `var g = ${game}, l = window.__run.loadout, get = g.pShots.get, cd = g.player.fireCd;
      g.pShots.get = () => null;
      g.playerFire();
      g.pShots.get = get;
      l.slots[2].ammo === 28 && cd === g.player.fireCd`],
    ['eval', `window.__run.loadout.slots[2].ammo = 1; ${game}.playerFire();`],
    ['assert', 'window.__run.loadout.active === 0 && window.__run.loadout.slots[2].ammo === 0'],
    ['tap', 'Digit3'], ['assert', 'window.__run.loadout.active === 0'],
    collectShotgun, ['until', 'window.__run.loadout.slots[2].ammo === 28'],
    ['assert', 'window.__run.loadout.active === 0 && window.__run.loadout.slots[1].ammo < window.__ripperAmmo'],
    ['tap', 'Digit2'], ['until', 'window.__run.loadout.active === 1'],
    ['eval', `var g = ${game}; window.__beforeRetry = JSON.stringify(window.__run.loadout);
      g.player.invuln = 0; g.hurtPlayer(10000, g.player.x - 20);`],
    ['until', `${game}.canRetry`], ['tap', 'Enter'],
    ['until', `${game}.state === 'play'`],
    ['assert', 'JSON.stringify(window.__run.loadout) === window.__beforeRetry && window.__run.stageStats.deaths === 1'],
    ['shot'],
  ] },
  { name: 'armory-save', url: '', steps: [
    ...deploy, armoryReady,
    ['eval', `var key = 'neon-warpath-campaign-v1', snap = JSON.parse(localStorage.getItem(key));
      delete snap.state.loadout; delete snap.state.stageStats;
      snap.state.weapon = 'rail'; snap.state.ammo = 7;
      localStorage.setItem(key, JSON.stringify(snap));`],
    ['reload'], ['tap', 'KeyR'], ['until', 'window.__game.scene.isActive("Game")'],
    ['assert', `var l = window.__run.loadout; l.active === 1 && l.slots[1].id === 'rail' &&
      l.slots[1].ammo === 7 && l.slots[2] === null && window.__run.stageStats.deaths === 0`],
    armoryReady, collectShotgun, ['until', 'window.__run.loadout.active === 2'],
    ['tap', 'Digit1'], ['until', 'window.__run.loadout.active === 0'],
    ['eval', `var g = ${game}, r = window.__run;
      r.stageStats = { elapsed: 11000, kills: 9, bestCombo: 4, deaths: 1 };
      g.locked = true; g.wave = g.encounters[g.encIndex].waves.length; g.waveGap = 0; g.tickEncounter(16);`],
    ['assert', `var snap = JSON.parse(localStorage.getItem('neon-warpath-campaign-v1'));
      snap.state.checkpoint === 1 && snap.state.score === window.__run.score && snap.state.score === 500`],
    ['tap', 'Escape'], ['until', 'window.__game.scene.isPaused("Game")'], ['tap', 'KeyT'],
    ['until', 'window.__game.scene.isActive("Title")'],
    ['reload'], ['tap', 'KeyR'], ['until', 'window.__game.scene.isActive("Game")'],
    ['assert', `var r = window.__run, l = r.loadout; l.active === 0 && l.slots[1].ammo === 7 &&
      l.slots[2].id === 'shotgun' && l.slots[2].ammo === 28 &&
      r.stageStats.elapsed >= 11000 && r.stageStats.kills === 9 && r.stageStats.bestCombo === 4 && r.stageStats.deaths === 1`],
  ] },
  { name: 'mission-results', url: '?stage=city&boss=1&weapon=smg&god=1', steps: [
    ['down', 'KeyD'], ['until', `!!${game}.boss`], ['up', 'KeyD'],
    ['assert', `var g = ${game}, r = window.__run;
      r.stageStats = { elapsed: 90000, kills: 12, bestCombo: 3, deaths: 2 }; r.maxCombo = 20;
      const ammo = r.loadout.slots[1].ammo;
      g.boss.hurt(g.boss.maxHp * 9, g.player.x); g.playerFire();
      r.loadout.slots[1].ammo === ammo`],
    ['until', `var hud = window.__game.scene.getScene('Hud'); hud.overlay.alpha > 0.98 &&
      hud.overlay.list.some(t => t.text === 'BONUS  +2250')`],
    ['assert', `var lines = window.__game.scene.getScene('Hud').overlay.list.map(t => t.text);
      ['B', '1:30', '12', '3', 'DEATHS  2'].every(value => lines.includes(value))`],
    ['shot'], ['until', 'window.__game.scene.isActive("Briefing")'],
    ['assert', 'window.__run.stageStats.elapsed === 0 && window.__run.stageStats.deaths === 0 && window.__run.loadout.slots[1].id === "smg"'],
  ] },
  { name: 'armory-mouse-buttons', url: '?stage=1.75&weapon=unknown', steps: [
    ['wait', 1000], armoryReady,
    ['assert', `${game}.stage.id === 'city' && window.__run.loadout.active === 0 && window.__run.loadout.slots[1] === null`],
    ['mdown', 'middle'], ['wait', 100], ['assert', `!${game}.controls.held('fire')`], ['mup', 'middle'],
    ['mdown', 'left'], ['mdown', 'right'],
    ['until', `var c = ${game}.controls; c.held('fire') && c.held('slide')`],
    ['mup', 'right'], ['mup', 'left'],
  ] },
  { name: 'aim-hostiles-first', url: '?stage=city', steps: [
    ['wait', 800], armoryReady,
    ['assert', `var g = ${game}, p = g.player, m = p.muzzle();
      g.aim = null; p.dir = 1;
      const egg = g.spawnEnemy('egg', m.x + 90, m.y + 60, '');
      const foe = g.spawnEnemy('drone', m.x + 185, m.y - 70, '');
      const angle = e => Math.atan2(e.body.center.y - m.y, e.x - m.x);
      g.playerFire();
      const aimedAtFoe = Math.abs(p.shotAng - angle(foe)) < 0.001;
      g.removeEnemy(foe);
      g.playerFire();
      aimedAtFoe && Math.abs(p.shotAng - angle(egg)) < 0.001`],
  ] },
  { name: 'release-storage-denied', url: '', steps: [
    ...deploy,
    ['eval', `window.__stored = localStorage.getItem('neon-warpath-campaign-v1'); window.__setItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('Storage denied'); };`],
    ['tap', 'Escape'], ['tap', 'KeyT'], ['wait', 300],
    ['assert', `window.__game.scene.isActive('Hud') && window.__game.scene.isPaused('Game') && localStorage.getItem('neon-warpath-campaign-v1') === window.__stored`],
    ['eval', 'Storage.prototype.setItem = window.__setItem'], ['tap', 'KeyT'],
    ['until', 'window.__game.scene.isActive("Title")'],
  ] },
  { name: 'release-choice-retry', url: '?stage=railyard&god=1', steps: [
    ['wait', 2800],
    ['eval', `var g = window.__game.scene.getScene('Game'); window.__tp(4830, 300);`],
    ['until', 'window.__game.scene.getScene("Hud").choosing'], ['tap', 'Enter'], ['wait', 200],
    ['eval', `window.__choiceCount = window.__run.choices.length; window.__game.scene.getScene('Game').scene.restart({retry: true});`],
    ['wait', 1500], ['eval', 'window.__tp(4830, 300)'], ['wait', 600],
    ['assert', '!window.__game.scene.getScene("Hud").choosing && window.__run.choices.length === window.__choiceCount'],
  ] },
  { name: 'release-pad-bindings', url: '?stage=city', steps: [
    ['wait', 1500],
    ['assert', `(async () => {
      const {Controls} = await import('/src/systems/Controls.ts');
      const g = window.__game.scene.getScene('Game'), pad = {leftStick: {x:0,y:0}, buttons:[], L2:1, A:true, up:true};
      const c = new Controls({input: {keyboard:g.input.keyboard, activePointer:g.input.activePointer, gamepad:{pad1:pad}}});
      c.poll(); const first = c.pressed('ability') && c.pressed('jump') && c.pressed('nextWeapon');
      c.poll(); const held = !c.pressed('ability') && !c.pressed('nextWeapon');
      pad.L2 = 0; pad.up = false; c.poll(); pad.L2 = 1; pad.up = true; c.poll();
      return first && held && c.pressed('ability') && c.pressed('nextWeapon');
    })()`],
  ] },
  { name: 'release-options', url: '', steps: [
    ['wait', 1000], ['tap', 'KeyO'], ['until', 'window.__game.scene.isActive("Options")'], ['wait', 300],
    ['tap', 'ArrowLeft'], ['tap', 'ArrowDown'], // row 0 is DIFFICULTY: NORMAL -> EASY
    ['tap', 'ArrowLeft'], ['tap', 'ArrowDown'], ['tap', 'ArrowLeft'], ['tap', 'ArrowDown'],
    ...Array.from({length: 5}, () => [['tap', 'ArrowLeft'], ['wait', 70]]).flat(), ['tap', 'ArrowDown'], ['tap', 'Enter'], ['shot'],
    ['assert', `var s = JSON.parse(localStorage.getItem('neon-warpath-settings-v1')); s.difficulty === 0 && s.music === 0.4 && s.effects === 0.6 && s.shake === 0 && s.flashes === false`],
    ['tap', 'Escape'], ['assert', 'window.__game.scene.isActive("Title")'], ['reload'],
    ['tap', 'KeyO'], ['until', 'window.__game.scene.isActive("Options")'], ['wait', 300], ['shot'],
    ['assert', `window.__game.scene.getScene('Options').rows[0].text.includes('EASY') && window.__game.scene.getScene('Options').rows[3].text.includes('0%') && window.__game.scene.getScene('Options').rows[4].text.includes('OFF')`],
    ['tap', 'Escape'], ...deploy,
    ['tap', 'KeyE'], ['tap', 'Escape'], ['tap', 'KeyO'], ['until', 'window.__game.scene.isActive("Options")'], ['wait', 300],
    ['eval', `var p = window.__game.scene.getScene('Game').player; window.__pausedCd = p.abilityCd;`], ['wait', 300],
    ['assert', 'window.__game.scene.getScene("Game").player.abilityCd === window.__pausedCd'],
    ['tap', 'Escape'], ['assert', 'window.__game.scene.isPaused("Game") && window.__game.scene.isActive("Hud")'], ['shot'],
    ['tap', 'Escape'], ['eval', `var g = window.__game.scene.getScene('Game'); g.fx.shake(8); g.fx.flash(); g.scene.get('Hud').hurtFlash();`],
    ['assert', `var g = window.__game.scene.getScene('Game'); !g.cameras.main.shakeEffect.isRunning && !g.cameras.main.flashEffect.isRunning && g.scene.get('Hud').red.alpha === 0`],
  ] },
  { name: 'release-save', url: '', steps: [
    ...deploy,
    ['eval', `var g = window.__game.scene.getScene('Game'), r = window.__run;
      for (const e of [...g.enemies]) g.removeEnemy(e);
      r.hp = 61; r.score = 1234; r.checkpoint = 1; r.checkpointX = 1100;
      r.perks.push('boosters'); r.stats.airJumps++; r.flags.ledger = 'sell'; r.bonusCards = 3;
      r.shards.push('city-1'); r.choices.push('TEST CHOICE');`],
    ['tap', 'Escape'], ['tap', 'KeyT'], ['until', 'window.__game.scene.isActive("Title")'], ['shot'],
    ['assert', `var s = JSON.parse(localStorage.getItem('neon-warpath-campaign-v1')); s.scene === 'Game' && s.state.hp === 61 && !('stats' in s.state) && !('op' in s.state)`],
    ['reload'], ['tap', 'KeyR'], ['until', 'window.__game.scene.isActive("Game")'], ['wait', 300],
    ['assert', `var r = window.__run, g = window.__game.scene.getScene('Game'); r.score === 1234 && r.hp === 61 && r.stats.airJumps === 2 && r.flags.ledger === 'sell' && r.bonusCards === 3 && r.shards.includes('city-1') && r.choices[0] === 'TEST CHOICE' && Math.abs(g.player.x - 1100) < 5 && !r.heard.includes('city:death')`], ['shot'],
    // Invalid storage must not crash Title or offer a broken continue.
    ['eval', `localStorage.setItem('neon-warpath-campaign-v1', '{invalid')`], ['reload'],
    ['assert', `(async () => { const s = await import('/src/systems/CampaignSave.ts'); return s.campaignSnapshot() === null; })()`],
    ['tap', 'KeyR'], ['assert', 'window.__game.scene.isActive("Title")'],
    ['eval', `localStorage.setItem('neon-warpath-settings-v1', 'null');
      localStorage.setItem('neon-warpath-save-v1', JSON.stringify({op: 1.5, best: 'invalid', unlocked:['quill']}));`], ['reload'],
    ['assert', `window.__game.scene.getScene('Title').sel === 0`],
    ['tap', 'Enter'], ['until', 'window.__game.scene.isActive("Briefing")'],
    ['assert', `const profile = JSON.parse(localStorage.getItem('neon-warpath-save-v1'));
      profile.best === 0 && profile.unlocked.includes('quill')`],
  ] },
  { name: 'release-save-flow', url: '', steps: [
    ...deploy,
    ['eval', `var g = window.__game.scene.getScene('Game'), r = window.__run;
      r.stage = 2; r.checkpoint = 0; r.checkpointX = 80; g.scene.stop('Hud'); g.scene.start('Briefing', {next:'Perk'});`],
    ['until', 'window.__game.scene.isActive("Briefing")'], ['reload'], ['tap', 'KeyR'],
    ['until', 'window.__game.scene.isActive("Briefing")'],
    ['press', ['Enter', '!!window.__game.scene.getScene("Briefing").choice']], ['tap', 'ArrowRight'], ['tap', 'Enter'],
    ['press', ['Enter', 'window.__game.scene.isActive("Perk")']],
    ['assert', 'window.__run.flags.ledger === "sell" && window.__run.bonusCards === 3'],
    ['reload'], ['tap', 'KeyR'], ['until', 'window.__game.scene.isActive("Perk")'], ['wait', 300], ['shot'],
    ['assert', 'window.__game.scene.getScene("Perk").cards.length === 4 && window.__run.choices.length === 1'],
    ['tap', 'Enter'], ['until', 'window.__game.scene.isActive("Game")'], ['wait', 200],
    ['reload'], ['tap', 'KeyR'], ['until', 'window.__game.scene.isActive("Game")'],
    ['assert', 'window.__run.perks.length === 1 && window.__run.bonusCards === 2 && window.__run.choices.length === 1'],
    // Finale checkpoint must restore HOLD, without returning to ARCHON or losing the pearl.
    ['eval', `var g = window.__game.scene.getScene('Game'), r = window.__run;
      r.stage = 12; r.checkpoint = 0; r.checkpointX = 80; r.flags.sovereign_spared = true;
      g.scene.stop('Hud'); g.scene.start('Briefing', {next:'End'});`],
    ['until', 'window.__game.scene.isActive("Briefing")'], ['reload'], ['tap', 'KeyR'],
    ['until', 'window.__game.scene.isActive("Briefing")'],
    ['press', ['Enter', '!!window.__game.scene.getScene("Briefing").choice']], ['tap', 'ArrowRight'], ['tap', 'Enter'],
    ['press', ['Enter', 'window.__game.scene.isActive("Game")']],
    ['assert', 'window.__game.scene.getScene("Game").hold'],
    ['reload'], ['tap', 'KeyR'], ['until', 'window.__game.scene.isActive("Game")'],
    ['assert', 'window.__game.scene.getScene("Game").hold && window.__run.checkpoint === 99'], ['shot'],
    ['eval', `var g = window.__game.scene.getScene('Game'); window.__run.flags.hold_done = true; g.scene.stop('Hud'); g.scene.start('End');`],
    ['until', 'window.__game.scene.isActive("End")'],
    ['assert', `localStorage.getItem('neon-warpath-campaign-v1') === null`],
  ] },
  { name: 'release-perks-exhausted', url: '?stage=cathedral&god=1', steps: [
    ['wait', 1500],
    ['eval', `(async () => { const {PERKS} = await import('/src/systems/Run.ts'); const r = window.__run; r.perks = PERKS.map(p => p.id); r.hp = 20; r.od = 0;
      const g = window.__game.scene.getScene('Game'); g.scene.stop('Hud'); g.scene.start('Perk'); })()`],
    ['until', 'window.__game.scene.isActive("Perk")'], ['wait', 500], ['shot'],
    ['assert', 'window.__game.scene.getScene("Perk").picks[0].id === "resupply" && window.__game.scene.getScene("Perk").cards.length === 1'],
    ['tap', 'Enter'], ['until', 'window.__game.scene.isActive("Game")'],
    ['assert', 'window.__run.hp === window.__run.stats.maxHp && window.__run.od === 100 && !window.__run.perks.includes("resupply")'],
  ] },
];
