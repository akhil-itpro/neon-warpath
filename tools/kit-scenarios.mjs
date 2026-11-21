// Real browser input plus controlled combat fixtures. No god mode: protection must really work.
const clean = ['eval', `var g = window.__game.scene.getScene('Game');
  for (const e of [...g.enemies]) g.removeEnemy(e);
  g.player.invuln = 0;`];

export const KIT_SCENARIOS = [
  { name: 'kit-double-jump', url: '?stage=city', steps: [
    ['wait', 2800], clean,
    ['assert', 'window.__run.stats.airJumps === 1'],
    ['down', 'Space'], ['until', 'window.__game.scene.getScene("Game").player.body.velocity.y < 0'], ['up', 'Space'], ['wait', 50],
    ['down', 'Space'], ['until', 'window.__game.scene.getScene("Game").player.airJumps === 0'],
    ['up', 'Space'], ['until', 'window.__game.scene.getScene("Game").player.body.velocity.y >= -170'],
    ['down', 'Space'], ['wait', 50],
    ['assert', `var p = window.__game.scene.getScene('Game').player; !p.onGround && p.body.velocity.y >= -170 && p.airJumps === 0`],
    ['up', 'Space'], ['until', 'window.__game.scene.getScene("Game").player.onGround'], ['wait', 60],
    ['assert', 'window.__game.scene.getScene("Game").player.airJumps === 1'],
    ['eval', `(async () => { const {PERKS} = await import('/src/systems/Run.ts'); PERKS.find(p => p.id === 'boosters').apply(window.__run.stats); })()`],
    ['wait', 80], ['assert', 'window.__game.scene.getScene("Game").player.airJumps === 2'],
    ['down', 'Space'], ['until', 'window.__game.scene.getScene("Game").player.body.velocity.y < 0'], ['up', 'Space'], ['wait', 50],
    ['down', 'Space'], ['until', 'window.__game.scene.getScene("Game").player.airJumps === 1'], ['up', 'Space'], ['wait', 50],
    ['down', 'Space'], ['until', 'window.__game.scene.getScene("Game").player.airJumps === 0'], ['up', 'Space'], ['shot'],
  ] },
  ...['aegis', 'phase', 'quake', 'rally', 'gale'].map((id, op) => ({
    name: `kit-${id}`, url: `?stage=city&op=${op}`, steps: [
      ['wait', 2800], clean,
      ['eval', `var g = window.__game.scene.getScene('Game'), p = g.player;
        window.__run.hp = window.__run.stats.maxHp - 35; window.__beforeHp = window.__run.hp;
        window.__victim = g.spawnEnemy('brute', p.x + 95, p.y, 'add');
        window.__prop = g.spawnEnemy('cage', p.x + 55, p.y, 'add');
        window.__friend = g.spawnEnemy('varkesh_ally', p.x + 75, p.y, 'ally');
        for (const e of [window.__victim, window.__prop, window.__friend]) { e.tick = () => {}; e.body.setAllowGravity(false); }
        window.__victimHp = window.__victim.hp; window.__propHp = window.__prop.hp; window.__friendHp = window.__friend.hp;
        g.enemyShot(p.x + 60, p.centerY, 0, 0, 10); window.__nearShot = g.eShots.getChildren().find(s => s.active);`],
      ...(id === 'gale' ? [['eval', `var g = window.__game.scene.getScene('Game'), p = g.player;
        g.events.on('postupdate', function observeLaunch() {
          if (p.ability?.id !== 'gale' || p.onGround || p.body.velocity.y >= 0 || p.airJumps !== 1) return;
          window.__updraftLaunched = true;
          g.events.off('postupdate', observeLaunch);
        });`]] : []),
      ['tap', 'KeyE'], ['wait', 80],
      ['assert', `var p = window.__game.scene.getScene('Game').player; p.ability?.id === '${id}' && p.abilityCd > window.__run.op.ability.recharge`],
      ['assert', 'window.__prop.hp === window.__propHp && window.__friend.hp === window.__friendHp'],
      ...(id === 'quake' ? [['assert', 'window.__victim.hp < window.__victimHp']] : []),
      ...(['aegis','quake','gale'].includes(id) ? [['assert', '!window.__nearShot.active']] : []),
      ...(id === 'rally' ? [['assert', 'window.__run.hp === window.__beforeHp + 25']] : []),
      ...(id === 'gale' ? [['assert', 'window.__updraftLaunched === true']] : []),
      ['eval', `var g = window.__game.scene.getScene('Game'); window.__damageHp = window.__run.hp; g.hurtPlayer(20, g.player.x - 20);`],
      ['assert', `window.__damageHp - window.__run.hp === ${id === 'aegis' || id === 'phase' ? 0 : id === 'quake' ? 10 : 20}`],
      ['shot'],
      ['eval', `window.__cooldown = window.__game.scene.getScene('Game').player.abilityCd`],
      ['tap', 'KeyE'], ['assert', 'window.__game.scene.getScene("Game").player.abilityCd <= window.__cooldown'],
      ['tap', 'Escape'], ['eval', 'window.__pausedCd = window.__game.scene.getScene("Game").player.abilityCd'], ['wait', 250],
      ['assert', 'window.__game.scene.getScene("Game").player.abilityCd === window.__pausedCd'], ['shot'], ['tap', 'Escape'],
      ['eval', `var g = window.__game.scene.getScene('Game'); g.player.abilityTime = 0; g.player.abilityCd = 150; g.player.invuln = 0;`],
      ['wait', 250], ['assert', 'window.__game.scene.getScene("Game").player.abilityCd === 0'],
      ['eval', `var g = window.__game.scene.getScene('Game'); window.__damageHp = window.__run.hp; g.hurtPlayer(10, g.player.x - 20);`],
      ['assert', 'window.__damageHp - window.__run.hp === 10'],
      ['wait', 120], ['tap', 'KeyE'], ['assert', 'window.__game.scene.getScene("Game").player.abilityTime > 0'],
      ['eval', `var g = window.__game.scene.getScene('Game'); g.player.abilityTime = 0; g.player.invuln = 0; g.hurtPlayer(10000, g.player.x - 20);`],
      ['until', 'window.__game.scene.getScene("Game").canRetry'], ['tap', 'Enter'], ['wait', 2500],
      ['assert', `var p = window.__game.scene.getScene('Game').player; !p.dead && p.abilityCd === 0 && p.abilityTime === 0 && window.__run.stats.airJumps === 1`],
    ],
  })),
  { name: 'kit-shield-duration', url: '?stage=city', steps: [
    ['wait', 2800], clean, ['down', 'KeyE'], ['wait', 100],
    ['eval', `var g = window.__game.scene.getScene('Game'); window.__hp = window.__run.hp; g.enemyShot(g.player.x, g.player.centerY, 0, 0, 30);`], ['wait', 100],
    ['assert', 'window.__run.hp === window.__hp && !window.__game.scene.getScene("Game").eShots.getChildren().some(s => s.active)'],
    ['until', 'window.__game.scene.getScene("Game").player.abilityTime === 0'], ['shot'],
    ['eval', `var g = window.__game.scene.getScene('Game'); g.hurtPlayer(20, g.player.x - 20);`],
    ['assert', 'window.__run.hp === window.__hp - 20'],
    ['until', 'window.__game.scene.getScene("Game").player.abilityCd === 0 && window.__game.scene.getScene("Game").player.abilityTime === 0'],
    ['up', 'KeyE'], ['wait', 80], ['tap', 'KeyE'], ['assert', 'window.__game.scene.getScene("Game").player.abilityTime > 0'], ['shot'],
  ] },
];
