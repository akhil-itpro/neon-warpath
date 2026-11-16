const deploy = [
  ['wait', 1200], ['tap', 'Enter'], ['until', 'window.__game.scene.isActive("Briefing")'],
  ['down', 'KeyJ'], ['until', 'window.__game.scene.isActive("Game")'], ['up', 'KeyJ'], ['wait', 1500],
];

export const RELEASE_SCENARIOS = [
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
      const g = window.__game.scene.getScene('Game'), pad = {leftStick: {x:0,y:0}, buttons:[], L2:1, A:true};
      const c = new Controls({input: {keyboard:g.input.keyboard, activePointer:g.input.activePointer, gamepad:{pad1:pad}}});
      c.poll(); const first = c.pressed('ability') && c.pressed('jump');
      c.poll(); const held = !c.pressed('ability');
      pad.L2 = 0; c.poll(); pad.L2 = 1; c.poll();
      return first && held && c.pressed('ability');
    })()`],
  ] },
  { name: 'release-options', url: '', steps: [
    ['wait', 1000], ['tap', 'KeyO'], ['until', 'window.__game.scene.isActive("Options")'], ['wait', 300],
    ['tap', 'ArrowLeft'], ['tap', 'ArrowDown'], ['tap', 'ArrowLeft'], ['tap', 'ArrowDown'],
    ...Array.from({length: 5}, () => [['tap', 'ArrowLeft'], ['wait', 70]]).flat(), ['tap', 'ArrowDown'], ['tap', 'Enter'], ['shot'],
    ['assert', `var s = JSON.parse(localStorage.getItem('neon-warpath-settings-v1')); s.music === 0.4 && s.effects === 0.6 && s.shake === 0 && s.flashes === false`],
    ['tap', 'Escape'], ['assert', 'window.__game.scene.isActive("Title")'], ['reload'],
    ['tap', 'KeyO'], ['until', 'window.__game.scene.isActive("Options")'], ['wait', 300], ['shot'],
    ['assert', `window.__game.scene.getScene('Options').rows[2].text.includes('0%') && window.__game.scene.getScene('Options').rows[3].text.includes('OFF')`],
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
    ['eval', `localStorage.setItem('neon-warpath-settings-v1', 'null')`], ['reload'],
    ['assert', 'window.__game.scene.isActive("Title")'],
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
