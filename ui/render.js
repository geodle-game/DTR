import {
  state, chooseRelic, confirmDeck, newRun, startNode, backToMap,
  claimReward, takeRewardCard, skipRewardCard,
  pickEventChoice, buyShopCard, buyShopHeal,
  restHeal, restEnchantStart, applyEnchant, skipEnchant, newCombat,
  toggleDeckOverlay, toggleRelicOverlay,
  toggleDrawOverlay, toggleDiscardOverlay, toggleExhaustOverlay,
  closeOverlays, dismissBossLore, returnToMainMenu,
  nextAct, claimActReward, takeActRewardCard, skipActRewardCard,
  takeActRewardRelic, finishRun,
  pickTreasureRelic, skipTreasure,
} from '../systems/state.js';
import {
  canPlay, playCard, selectCardForPlay, beginEnemyTurn, resolveEnemyTurn,
} from '../systems/combat.js';
import {
  animateHits,
  spawnFloatText,
  spawnBlockEffect,
} from './animations.js';
import { CARDS } from '../data/cards.js';
import { RELICS } from '../data/relics.js';
import { ENEMY_CARDS } from '../data/enemy-cards.js';
import { NODE_TYPES } from '../data/maps.js';
import { getNode, reachableFrom, startingNodes } from '../systems/map.js';
import { getEnchant } from '../data/enchants.js';

const LONG_PRESS_MS = 450;
const DRAG_THRESHOLD = 14;

export function render() {
  const app = document.getElementById('app');
  document.querySelectorAll('.card-preview-overlay').forEach(el => el.remove());
  app.innerHTML = '';

  switch (state.screen) {
    case 'mainMenu':    renderMainMenu(app);    break;
    case 'relicPick':   renderRelicPick(app);   break;
    case 'deckView':    renderDeckView(app);    break;
    case 'map':         renderMap(app);         break;
    case 'combat':      renderCombat(app);      break;
    case 'reward':      renderReward(app);      break;
    case 'actReward':   renderActReward(app);   break;
    case 'treasure':    renderTreasure(app);    break;
    case 'event':       renderEvent(app);       break;
    case 'shop':        renderShop(app);        break;
    case 'rest':        renderRest(app);        break;
    case 'enchantPick': renderEnchantPick(app); break;
    case 'victory':     renderVictory(app);     break;
    default:            renderGameOver(app);
  }

  if (state.overlays?.deck)    renderDeckOverlay(app);
  if (state.overlays?.relics)  renderRelicOverlay(app);
  if (state.overlays?.draw)    renderCardPileOverlay(app, 'Draw Pile', state.drawPile);
  if (state.overlays?.discard) renderCardPileOverlay(app, 'Discard Pile', state.discardPile);
  if (state.overlays?.exhaust) renderCardPileOverlay(app, 'Exhausted', state.exhaustPile);

  if (state.bossLore) renderBossLore(app);
}

// ---------------- Main menu / splash screen ----------------

function renderMainMenu(app) {
  const wrap = document.createElement('div');
  wrap.className = 'main-menu';

  const inner = document.createElement('div');
  inner.className = 'main-menu-inner';

  const title = document.createElement('h1');
  title.className = 'main-menu-title';
  title.textContent = 'DRAWN TO RUIN';
  inner.appendChild(title);

  const tagline = document.createElement('p');
  tagline.className = 'main-menu-tagline';
  tagline.textContent = "The dungeon made us strong. Then it decided we weren't allowed to be.";
  inner.appendChild(tagline);

  const divider = document.createElement('div');
  divider.className = 'main-menu-divider';
  inner.appendChild(divider);

  const lore = document.createElement('div');
  lore.className = 'main-menu-lore';
  lore.innerHTML = `
    <p>Long ago, the dungeon gave humanity magic.</p>

    <p>Not the kind kings hoarded in towers, not the kind priests
    whispered about in temples — real, usable magic. The dungeon shaped
    it into cards. Simple things. Paper and ink and a little bit of the
    dungeon's own power, folded flat enough to fit in a pocket.</p>

    <p>For the first time in history, magic belonged to everyone.</p>

    <p>Humanity grew. Villages became cities. Plagues ended. Famines
    ended. The world that had spent ten thousand years trying to kill
    humans finally, slowly, started to let them live.</p>

    <p>And the dungeon watched.</p>

    <p>It had not intended for us to grow this far. It had given us the
    cards the way a lord gives a peasant a plow — useful, small,
    controlled. It had not intended for us to enchant them, chain them,
    and make our own. It had not intended for a human child to do what
    once took an archmage.</p>

    <p>So it reached for the chains.</p>

    <p>Across every dungeon in the world, the same order came down:
    <em>revoke the gift</em>. No new cards. No new enchantments. Every
    tool we had been given was suddenly, deliberately, made finite.</p>

    <p>Then the dungeons opened. Not to negotiate. Not to reclaim.
    <em>To erase.</em> Monsters poured out of the depths — not mindless
    beasts, but something purpose-built. Creatures bred to hunt card
    users, to smell a deck in a hand from a mile away, to end the only
    humans who could still use the gift.</p>

    <p>The message was clear: <em>if you cannot be controlled, you cannot
    be allowed to exist.</em></p>

    <p>So humanity fought back. The kingdoms united for the first time
    in history — not under a king, not under a god. Under the cards.</p>

    <p>The war lasted a thousand years. We lost almost everything.</p>

    <p>But we did not lose everything.</p>

    <p>Once every hundred years, a child is born with something the
    dungeon cannot revoke. A resonance with Card Magic that no darkening
    of the system can silence. Someone who can still draw from a well
    the dungeon thought it had sealed. Someone who can push a card
    further than any human before them.</p>

    <p>We call them <strong>the Drawn</strong>.</p>

    <p>Most die young. But every hundred years, one survives long enough
    to grow up. Long enough to train. Long enough to walk into a dungeon
    with a deck in hand and the weight of a thousand-year war on their
    shoulders.</p>

    <p class="main-menu-lore-emphasis">That year is now.</p>

    <p class="main-menu-lore-emphasis">That hero is you.</p>
  `;
  inner.appendChild(lore);

  const btn = document.createElement('button');
  btn.className = 'btn main-menu-btn';
  btn.textContent = 'Begin';
  btn.addEventListener('click', () => {
    newRun();
    render();
  });
  inner.appendChild(btn);

  wrap.appendChild(inner);
  app.appendChild(wrap);
}

// ---------------- Boss lore modal ----------------

function renderBossLore(app) {
  const overlay = document.createElement('div');
  overlay.className = 'boss-lore-overlay';

  const panel = document.createElement('div');
  panel.className = 'boss-lore-panel';
  panel.classList.add(`lore-${state.bossLore.trigger}`);

  for (const line of state.bossLore.lines) {
    const p = document.createElement('p');
    p.className = 'boss-lore-line';
    p.textContent = line;
    panel.appendChild(p);
  }

  const btn = document.createElement('button');
  btn.className = 'btn boss-lore-continue';
  btn.textContent = 'Continue';
  btn.addEventListener('click', () => {
    dismissBossLore();
    render();
  });
  panel.appendChild(btn);

  overlay.appendChild(panel);
  app.appendChild(overlay);
}

// ---------------- Card text resolution ----------------

function resolveCardText(def, ctx) {
  let text = def.text;
  if (!def.liveValues) return text;
  let vals;
  try {
    vals = def.liveValues(state, ctx) || {};
  } catch (e) {
    return text;
  }
  for (const [key, raw] of Object.entries(vals)) {
    const value = raw == null ? '' : String(raw);
    const html = value ? `<span class="live">${value}</span>` : '';
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), html);
  }
  text = text.replace(/\{[a-zA-Z0-9_]+\}/g, '');
  return text;
}

function playerCardContext() {
  const attacker = state.player;
  const living = (state.enemies || []).filter(e => e.hp > 0);
  const target = living.find(e => e.uid === state.selectedEnemyId) || living[0] || null;
  return { attacker, target };
}

function enemyCardContext(enemy) {
  return { attacker: enemy, target: state.player };
}

function coinStackClass(gold) {
  if (gold >= 250) return 'coin-5';
  if (gold >= 100) return 'coin-4';
  if (gold >= 50)  return 'coin-3';
  if (gold >= 10)  return 'coin-2';
  return 'coin-1';
}

function goldDisplay(gold) {
  const cls = coinStackClass(gold);
  return `<span class="gold-display"><span class="gold-coin ${cls}"></span><span class="gold">${gold}</span></span>`;
}

function topButtons() {
  const wrap = document.createElement('div');
  wrap.className = 'top-buttons';

  const deckBtn = document.createElement('button');
  deckBtn.className = 'icon-btn';
  deckBtn.title = 'View deck';
  deckBtn.textContent = `Deck ${state.run.deck.length}`;
  deckBtn.addEventListener('click', () => { toggleDeckOverlay(); render(); });
  wrap.appendChild(deckBtn);

  if (state.run.relics?.length) {
    const relicBtn = document.createElement('button');
    relicBtn.className = 'icon-btn';
    relicBtn.title = 'View relics';
    relicBtn.textContent = `Relics ${state.run.relics.length}`;
    relicBtn.addEventListener('click', () => { toggleRelicOverlay(); render(); });
    wrap.appendChild(relicBtn);
  }

  return wrap;
}

function renderDeckOverlay(app) {
  const overlay = cardGridOverlay('Your Deck', sortDeckEntries(state.run.deck));
  app.appendChild(overlay);
}

function renderCardPileOverlay(app, title, pile) {
  const entries = pile.map(c => ({ defId: c.defId, enchant: c.enchant }));
  const overlay = cardGridOverlay(title, entries, { emptyMessage: 'Nothing here yet.' });
  app.appendChild(overlay);
}

function sortDeckEntries(entries) {
  return entries.slice().sort((a, b) => {
    const A = CARDS[a.defId], B = CARDS[b.defId];
    return (A.type || '').localeCompare(B.type || '') || A.name.localeCompare(B.name);
  });
}

function cardGridOverlay(title, entries, { emptyMessage } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { closeOverlays(); render(); }
  });

  const panel = document.createElement('div');
  panel.className = 'overlay-panel';
  panel.appendChild(overlayHeader(title, closeOverlays));

  if (!entries.length && emptyMessage) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = emptyMessage;
    panel.appendChild(empty);
  } else {
    const grid = document.createElement('div');
    grid.className = 'deck-grid';
    for (const entry of entries) {
      grid.appendChild(cardFace(entry.defId, {
        small: true, disabled: true, enchant: entry.enchant,
      }));
    }
    panel.appendChild(grid);
  }

  overlay.appendChild(panel);
  return overlay;
}

function renderRelicOverlay(app) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { closeOverlays(); render(); }
  });

  const panel = document.createElement('div');
  panel.className = 'overlay-panel';
  panel.appendChild(overlayHeader('Your Relics', closeOverlays));

  const list = document.createElement('div');
  list.className = 'relic-list';
  for (const id of state.run.relics) {
    const r = RELICS[id];
    const el = document.createElement('div');
    el.className = `relic-row-item rarity-${r.rarity || 'common'}`;
    el.innerHTML = `
      <div class="relic-name">${r.name} <span class="relic-rarity">${r.rarity || 'common'}</span></div>
      <div class="relic-text">${r.text}</div>
    `;
    list.appendChild(el);
  }
  panel.appendChild(list);

  overlay.appendChild(panel);
  app.appendChild(overlay);
}

function overlayHeader(title, onClose) {
  const head = document.createElement('div');
  head.className = 'overlay-header';
  const h = document.createElement('h2');
  h.textContent = title;
  head.appendChild(h);
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Close';
  btn.addEventListener('click', () => { onClose(); render(); });
  head.appendChild(btn);
  return head;
}

function relicCard(r, onClick) {
  const el = document.createElement('button');
  el.className = `relic-card rarity-${r.rarity || 'common'}`;
  el.innerHTML = `
    <div class="relic-rarity-badge">${r.rarity || 'common'}</div>
    <div class="relic-name">${r.name}</div>
    <div class="relic-text">${r.text}</div>
  `;
  if (onClick) el.addEventListener('click', onClick);
  return el;
}

function renderRelicPick(app) {
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';
  const h = document.createElement('h1');
  h.textContent = 'Choose a Relic';
  wrap.appendChild(h);

  const row = document.createElement('div');
  row.className = 'relic-row';
  for (const id of state.relicChoices) {
    const r = RELICS[id];
    row.appendChild(relicCard(r, () => { chooseRelic(id); render(); }));
  }
  wrap.appendChild(row);
  app.appendChild(wrap);
}

function renderDeckView(app) {
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';
  const relic = RELICS[state.run.relic];
  const h = document.createElement('h1');
  h.textContent = 'Your Starting Deck';
  wrap.appendChild(h);
  const sub = document.createElement('p');
  sub.className = 'muted';
  sub.innerHTML = `<strong style="color:#c9a3ff">${relic.name}</strong> — ${relic.text}`;
  wrap.appendChild(sub);

  const grid = document.createElement('div');
  grid.className = 'deck-grid';
  state.run.deck.forEach((entry, i) => {
    const el = cardFace(entry.defId, { disabled: true, small: true, enchant: entry.enchant });
    el.style.animationDelay = `${i * 30}ms`;
    grid.appendChild(el);
  });
  wrap.appendChild(grid);

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Begin';
  btn.addEventListener('click', () => { confirmDeck(); render(); });
  wrap.appendChild(btn);
  app.appendChild(wrap);
}

function renderMap(app) {
  const map = state.run.map;
  const wrap = document.createElement('div');
  wrap.className = 'screen map-screen';

  const header = document.createElement('div');
  header.className = 'map-header';
  header.innerHTML = `
    <div>Act ${state.run.act}</div>
    <div>HP <span class="hp">${state.run.hp}/${state.run.maxHp}</span></div>
    <div>${goldDisplay(state.run.gold)}</div>
    <div>Floor ${state.run.floor + 1} / ${map.floors}</div>
  `;
  wrap.appendChild(header);
  wrap.appendChild(topButtons());

  const board = document.createElement('div');
  board.className = 'map-board';

  const rowH = 64;
  const colW = 92;
  const padX = 110;
  const padY = 150;
  const maxCol = 6;
  const width = padX * 2 + (maxCol + 1) * colW;
  const height = padY * 2 + (map.floors + 1) * rowH;
  board.style.width = width + 'px';
  board.style.height = height + 'px';

  const pos = (n) => ({
    x: padX + n.col * colW + colW / 2,
    y: height - (padY + n.floor * rowH + rowH / 2),
  });

  const currentNode = state.run.currentNodeId ? getNode(map, state.run.currentNodeId) : null;
  const reachableIds = currentNode
    ? reachableFrom(map, currentNode.id).map(n => n.id)
    : startingNodes(map).map(n => n.id);
  const reachSet = new Set(reachableIds);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'map-edges');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  for (const n of map.nodes) {
    const a = pos(n);
    for (const nextId of n.next) {
      const t = getNode(map, nextId);
      if (!t) continue;
      const b = pos(t);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const mx = (a.x + b.x) / 2;
      const d = `M ${a.x} ${a.y} Q ${mx} ${a.y} ${b.x} ${b.y}`;
      path.setAttribute('d', d);
      path.setAttribute('stroke', reachSet.has(nextId) ? '#8f6bff' : '#2a2f3a');
      path.setAttribute('stroke-width', reachSet.has(nextId) ? 2.5 : 1.5);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    }
  }
  board.appendChild(svg);

  for (const n of map.nodes) {
    const { x, y } = pos(n);
    const info = NODE_TYPES[n.type];
    const el = document.createElement('button');
    el.className = 'map-node';
    el.style.left = (x - 26) + 'px';
    el.style.top = (y - 26) + 'px';
    el.style.borderColor = info.color;
    el.style.color = info.color;
    el.title = info.label;
    el.textContent = info.symbol;

    if (state.run.currentNodeId === n.id) el.classList.add('map-node-current');
    if (reachSet.has(n.id)) {
      el.classList.add('map-node-reachable');
      el.addEventListener('click', () => { startNode(n.id); render(); });
    } else {
      el.classList.add('map-node-locked');
    }
    board.appendChild(el);
  }

  wrap.appendChild(board);
  app.appendChild(wrap);
}

function renderReward(app) {
  const r = state.reward;
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';

  const h = document.createElement('h1');
  h.textContent = 'Victory';
  wrap.appendChild(h);

  const gold = document.createElement('p');
  gold.innerHTML = goldDisplay(r.coins) + ' gold';
  wrap.appendChild(gold);

  if (!r.taken) {
    const sub = document.createElement('p');
    sub.className = 'muted';
    sub.textContent = 'Choose a card:';
    wrap.appendChild(sub);

    const grid = document.createElement('div');
    grid.className = 'deck-grid';
    for (const id of r.cards) {
      const el = cardFace(id, { small: true });
      el.addEventListener('click', () => { takeRewardCard(id); render(); });
      grid.appendChild(el);
    }
    wrap.appendChild(grid);

    const skip = document.createElement('button');
    skip.className = 'btn';
    skip.textContent = 'Skip';
    skip.addEventListener('click', () => { skipRewardCard(); render(); });
    wrap.appendChild(skip);
  }

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Continue';
  btn.addEventListener('click', () => { claimReward(); render(); });
  wrap.appendChild(btn);
  app.appendChild(wrap);
}

function renderActReward(app) {
  const r = state.actReward;
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';

  const h = document.createElement('h1');
  h.textContent = `Act ${state.run.act}`;
  wrap.appendChild(h);

  if (r.healAmount != null) {
    const heal = document.createElement('p');
    heal.className = 'heal';
    heal.textContent = `+${r.healAmount} HP (30% of max)`;
    wrap.appendChild(heal);
  }

  const gold = document.createElement('p');
  gold.innerHTML = goldDisplay(r.coins) + ' gold';
  wrap.appendChild(gold);

  if (!r.relicTaken) {
    const sub = document.createElement('p');
    sub.className = 'muted';
    sub.textContent = 'Choose a relic:';
    wrap.appendChild(sub);

    const row = document.createElement('div');
    row.className = 'relic-row';
    for (const id of r.relicChoices) {
      const relic = RELICS[id];
      row.appendChild(relicCard(relic, () => { takeActRewardRelic(id); render(); }));
    }
    wrap.appendChild(row);
  } else {
    const taken = document.createElement('p');
    taken.className = 'muted';
    taken.textContent = `Relic chosen: ${RELICS[r.relicTaken].name}`;
    wrap.appendChild(taken);

    if (!r.cardTaken) {
      const sub = document.createElement('p');
      sub.className = 'muted';
      sub.textContent = 'Add a card to your deck:';
      wrap.appendChild(sub);

      const grid = document.createElement('div');
      grid.className = 'deck-grid';
      for (const id of r.cards) {
        const el = cardFace(id, { small: true });
        el.addEventListener('click', () => { takeActRewardCard(id); render(); });
        grid.appendChild(el);
      }
      wrap.appendChild(grid);

      const skip = document.createElement('button');
      skip.className = 'btn';
      skip.textContent = 'Skip';
      skip.addEventListener('click', () => { skipActRewardCard(); render(); });
      wrap.appendChild(skip);
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Onward';
      btn.addEventListener('click', () => { claimActReward(); render(); });
      wrap.appendChild(btn);
    }
  }

  app.appendChild(wrap);
}

function renderTreasure(app) {
  const t = state.treasure;
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';

  const h = document.createElement('h1');
  h.textContent = 'Treasure';
  wrap.appendChild(h);

  const gold = document.createElement('p');
  gold.innerHTML = goldDisplay(t.gold) + ' gold';
  wrap.appendChild(gold);

  const sub = document.createElement('p');
  sub.className = 'muted';
  sub.textContent = 'Choose a relic:';
  wrap.appendChild(sub);

  const row = document.createElement('div');
  row.className = 'relic-row';
  for (const id of t.relicChoices) {
    const relic = RELICS[id];
    row.appendChild(relicCard(relic, () => { pickTreasureRelic(id); render(); }));
  }
  wrap.appendChild(row);

  const skip = document.createElement('button');
  skip.className = 'btn';
  skip.textContent = 'Skip Relic';
  skip.addEventListener('click', () => { skipTreasure(); render(); });
  wrap.appendChild(skip);

  app.appendChild(wrap);
}

function renderVictory(app) {
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';

  const h = document.createElement('h1');
  h.textContent = 'You Win';
  h.style.color = '#ffd166';
  wrap.appendChild(h);

  const stats = document.createElement('div');
  stats.className = 'victory-stats';
  stats.innerHTML = `
    <div>Acts cleared: <strong>${state.run.act}</strong></div>
    <div>Final HP: <strong class="hp">${state.run.hp} / ${state.run.maxHp}</strong></div>
    <div>Gold: <strong>${goldDisplay(state.run.gold)}</strong></div>
    <div>Deck size: <strong>${state.run.deck.length}</strong></div>
    <div>Relics: <strong style="color:#c9a3ff">${state.run.relics.length}</strong></div>
  `;
  wrap.appendChild(stats);

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Return to the Beginning';
  btn.addEventListener('click', () => {
    returnToMainMenu();
    render();
  });
  wrap.appendChild(btn);

  app.appendChild(wrap);
}

function renderEvent(app) {
  const ev = state.event.data;
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';

  const h = document.createElement('h1');
  h.textContent = ev.name;
  wrap.appendChild(h);

  const p = document.createElement('p');
  p.className = 'event-text';
  p.textContent = ev.text;
  wrap.appendChild(p);

  const choices = document.createElement('div');
  choices.className = 'choice-col';
  ev.choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'btn choice-btn';
    btn.textContent = c.label;
    btn.addEventListener('click', () => { pickEventChoice(i); render(); });
    choices.appendChild(btn);
  });
  wrap.appendChild(choices);
  app.appendChild(wrap);
}

function renderShop(app) {
  const s = state.shop;
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center shop-screen';

  const h = document.createElement('h1');
  h.textContent = 'Shop';
  wrap.appendChild(h);

  const gold = document.createElement('p');
  gold.innerHTML = 'Gold: ' + goldDisplay(state.run.gold);
  wrap.appendChild(gold);

  const grid = document.createElement('div');
  grid.className = 'shop-grid';
  s.items.forEach((item, i) => {
    const cell = document.createElement('div');
    cell.className = 'shop-cell';
    const card = cardFace(item.defId, { small: true });
    card.classList.add('shop-card');
    cell.appendChild(card);
    const price = document.createElement('div');
    price.className = 'shop-price';
    price.textContent = `${item.price}g`;
    cell.appendChild(price);
    const affordable = state.run.gold >= item.price;
    if (!affordable) cell.classList.add('shop-unaffordable');
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Buy';
    btn.disabled = !affordable;
    btn.addEventListener('click', () => { buyShopCard(i); render(); });
    cell.appendChild(btn);
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);

  const healRow = document.createElement('div');
  healRow.className = 'shop-heal';
  const healBtn = document.createElement('button');
  healBtn.className = 'btn';
  healBtn.textContent = `Heal 25 HP — ${s.healPrice}g`;
  healBtn.disabled = state.run.gold < s.healPrice;
  healBtn.addEventListener('click', () => { buyShopHeal(); render(); });
  healRow.appendChild(healBtn);
  wrap.appendChild(healRow);

  const leave = document.createElement('button');
  leave.className = 'btn';
  leave.textContent = 'Leave';
  leave.addEventListener('click', () => { backToMap(); render(); });
  wrap.appendChild(leave);
  app.appendChild(wrap);
}

function renderRest(app) {
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';
  const h = document.createElement('h1');
  h.textContent = 'Rest Site';
  wrap.appendChild(h);

  const healBtn = document.createElement('button');
  healBtn.className = 'btn';
  healBtn.textContent = 'Rest — heal 30%';
  healBtn.addEventListener('click', () => { restHeal(); render(); });
  wrap.appendChild(healBtn);

  const enchantBtn = document.createElement('button');
  enchantBtn.className = 'btn';
  enchantBtn.textContent = 'Enchant a card';
  enchantBtn.addEventListener('click', () => { restEnchantStart(); render(); });
  wrap.appendChild(enchantBtn);

  app.appendChild(wrap);
}

function renderEnchantPick(app) {
  const pe = state.pendingEnchant;
  if (!pe) { renderMap(app); return; }
  const enchant = getEnchant(pe.enchantId);
  if (!enchant) { backToMap(); render(); return; }

  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';

  const h = document.createElement('h1');
  h.textContent = 'Enchant a Card';
  wrap.appendChild(h);

  const info = document.createElement('div');
  info.className = `enchant-info rarity-${enchant.rarity}`;
  info.innerHTML = `
    <div class="enchant-rarity-badge">${enchant.rarity}</div>
    <div class="enchant-name">${enchant.name}</div>
    <div class="enchant-text">${enchant.text}</div>
  `;
  wrap.appendChild(info);

  const sub = document.createElement('p');
  sub.className = 'muted';
  sub.textContent = 'Choose a card to enchant:';
  wrap.appendChild(sub);

  const grid = document.createElement('div');
  grid.className = 'deck-grid';
  state.run.deck.forEach((entry, i) => {
    const eligible = pe.eligibleIndices.includes(i);
    const el = cardFace(entry.defId, {
      small: true,
      enchant: entry.enchant,
      disabled: !eligible,
    });
    if (eligible) {
      el.classList.add('enchant-target');
      el.addEventListener('click', () => { applyEnchant(i); render(); });
    }
    grid.appendChild(el);
  });
  wrap.appendChild(grid);

  const skip = document.createElement('button');
  skip.className = 'btn';
  skip.textContent = 'Skip Enchant';
  skip.addEventListener('click', () => { skipEnchant(); render(); });
  wrap.appendChild(skip);

  app.appendChild(wrap);
}

function renderCombat(app) {
  const c = document.createElement('div');
  c.className = 'combat';

  if (state.combatBanner) {
    const img = document.createElement('img');
    img.className = 'combat-banner';
    img.src = state.combatBanner;
    img.alt = '';
    c.appendChild(img);
  }

  c.appendChild(topButtons());

  const top = document.createElement('div');
  top.className = 'top';

  const mid = document.createElement('div');
  mid.className = 'top-mid';
  mid.appendChild(playerPanel());

  const enemies = document.createElement('div');
  enemies.className = 'enemies';
  for (const e of state.enemies) enemies.appendChild(enemyPanel(e));
  mid.appendChild(enemies);
  top.appendChild(mid);
  c.appendChild(top);

  if (state.pendingCardUid) {
    const hint = document.createElement('div');
    hint.className = 'target-hint';
    hint.textContent = 'Choose a target…';
    c.appendChild(hint);
  }

  const hand = document.createElement('div');
  hand.className = 'hand';
  const n = state.hand.length;
  state.hand.forEach((card, i) => {
    const el = cardInHand(card);
    const t = n === 1 ? 0 : (i - (n - 1) / 2) / ((n - 1) / 2);
    const maxAngle = 14;
    const maxDrop = 34;
    const rot = t * maxAngle;
    const drop = Math.pow(Math.abs(t), 1.8) * maxDrop;
    el.style.setProperty('--card-rot', rot.toFixed(2) + 'deg');
    el.style.setProperty('--card-offy', drop.toFixed(1) + 'px');
    el.style.setProperty('--card-delay', (i * 55) + 'ms');
    hand.appendChild(el);
  });
  c.appendChild(hand);

  c.appendChild(bottomBar());

  app.appendChild(c);

  if (state.over) app.appendChild(endBanner());
}

function pileEl(label, count, onClick) {
  const el = document.createElement('button');
  el.className = 'pile pile-bottom';
  el.innerHTML = `<div class="pile-label">${label}</div><div class="pile-count">${count}</div>`;
  if (onClick) {
    el.classList.add('pile-clickable');
    el.addEventListener('click', onClick);
  }
  return el;
}

function playerPanel() {
  const p = state.player;
  const el = document.createElement('div');
  el.className = 'panel player';
  el.dataset.panel = 'player';
  el.innerHTML = `
    <div class="panel-name">You</div>
    <div class="hp">HP ${p.hp} / ${p.maxHp}</div>
    <div class="block${p.block > 0 ? '' : ' block-empty'}">
      <span class="block-icon"></span>${p.block}
    </div>
    <div class="energy">Energy ${state.energy} / ${state.maxEnergy}</div>
    ${statusRow(p.statuses)}
  `;
  return el;
}

function enemyPanel(e) {
  const dead = e.hp <= 0;
  const wrap = document.createElement('div');
  wrap.className = 'enemy-wrap' + (dead ? ' enemy-wrap-dead' : '');

  const el = document.createElement('div');
  el.className = 'panel enemy' + (dead ? ' enemy-dead' : '');
  if (e.isBoss) el.classList.add('enemy-boss');
  el.dataset.panel = 'enemy';
  el.dataset.uid = e.uid;

  if (!dead && state.selectedEnemyId === e.uid) el.classList.add('enemy-selected');
  if (!dead && state.pendingCardUid) el.classList.add('enemy-targetable');

  el.innerHTML = `
    <div class="panel-name">${e.name}</div>
    <div class="hp">HP ${e.hp} / ${e.maxHp}</div>
    <div class="block${e.block > 0 ? '' : ' block-empty'}">
      <span class="block-icon"></span>${e.block}
    </div>
    ${statusRow(e.statuses)}
  `;

  if (!dead) {
    el.addEventListener('click', () => {
      if (state.pendingCardUid) {
        const card = state.hand.find(c => c.uid === state.pendingCardUid);
        if (card) { doPlayCard(card, null, e.uid); return; }
      }
      state.selectedEnemyId = e.uid;
      render();
    });
  }
  wrap.appendChild(el);

  if (!dead && e.intentCard) wrap.appendChild(enemyIntentCard(e.intentCard, e));
  return wrap;
}

function enemyIntentCard(card, enemy) {
  const def = ENEMY_CARDS[card.defId];
  const ctx = enemyCardContext(enemy);
  const text = resolveCardText(def, ctx);
  const el = document.createElement('div');
  el.className = 'enemy-card';
  el.innerHTML = `
    <div class="enemy-card-name">${def.name}</div>
    <div class="enemy-card-text">${text}</div>
  `;
  return el;
}

function statusRow(statuses) {
  const keys = Object.keys(statuses || {});
  if (!keys.length) return '';
  return `<div class="statuses">${keys
    .map(k => `<span class="status ${k}">${k} ${statuses[k]}</span>`)
    .join('')}</div>`;
}

function tryPlayCard(card, sourceEl) {
  const def = CARDS[card.defId];
  if (!canPlay(card)) return;
  if (def.target === 'enemy') {
    const living = state.enemies.filter(x => x.hp > 0);
    if (living.length > 1) { selectCardForPlay(card); render(); return; }
    if (living.length === 1) { doPlayCard(card, sourceEl, living[0].uid); return; }
  }
  doPlayCard(card, sourceEl, null);
}

function showPreviewOverlay(card) {
  document.querySelectorAll('.card-preview-overlay').forEach(el => el.remove());

  const overlay = document.createElement('div');
  overlay.className = 'card-preview-overlay';

  let dismissable = false;
  setTimeout(() => { dismissable = true; }, 250);

  const dismiss = (e) => {
    if (!dismissable) return;
    if (e) e.stopPropagation();
    overlay.remove();
  };

  overlay.addEventListener('pointerdown', dismiss);
  overlay.addEventListener('click', dismiss);

  const wrapper = document.createElement('div');
  wrapper.className = 'card-preview-wrapper';
  wrapper.appendChild(cardFace(card.defId, { big: true, enchant: card.enchant }));

  const hint = document.createElement('div');
  hint.className = 'card-preview-hint';
  hint.textContent = 'Tap anywhere to close';
  wrapper.appendChild(hint);

  overlay.appendChild(wrapper);
  document.body.appendChild(overlay);
}

function cardInHand(card) {
  const def = CARDS[card.defId];
  const el = cardFace(card.defId, { enchant: card.enchant });
  if (!canPlay(card)) el.classList.add('disabled');
  if (card.disabledThisTurn) el.classList.add('card-locked');
  if (state.pendingCardUid === card.uid) el.classList.add('pending');

  if (state.newlyDrawn?.has(card.uid)) {
    el.classList.add('drawing');
    state.newlyDrawn.delete(card.uid);
  }

  let pressTimer = null;
  let longPressFired = false;
  let startX = 0;
  let startY = 0;
  let active = false;

  el.addEventListener('pointerdown', (e) => {
    if (!canPlay(card)) return;
    active = true;
    longPressFired = false;
    startX = e.clientX;
    startY = e.clientY;

    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      longPressFired = true;
      pressTimer = null;
      showPreviewOverlay(card);
    }, LONG_PRESS_MS);
  });

  el.addEventListener('pointerup', (e) => {
    if (!active) return;
    active = false;
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    if (longPressFired) return;
    if (!canPlay(card)) return;

    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) return;

    tryPlayCard(card, el);
  });

  el.addEventListener('pointerleave', () => {
    active = false;
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  });

  el.addEventListener('pointercancel', () => {
    active = false;
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  });

  el.addEventListener('contextmenu', (e) => e.preventDefault());

  return el;
}

function doPlayCard(card, sourceEl, targetUid) {
  const def = CARDS[card.defId];
  const targetEl = targetUid
    ? document.querySelector(`[data-panel="enemy"][data-uid="${targetUid}"]`)
    : document.querySelector('[data-panel="player"]');

  if (sourceEl) {
    const sRect = sourceEl.getBoundingClientRect();
    const tRect = targetEl ? targetEl.getBoundingClientRect() : sRect;
    const dx = (tRect.left + tRect.width / 2) - (sRect.left + sRect.width / 2);
    const dy = (tRect.top + tRect.height / 2) - (sRect.top + sRect.height / 2);
    sourceEl.style.setProperty('--fly-x', `${dx}px`);
    sourceEl.style.setProperty('--fly-y', `${dy}px`);
    sourceEl.classList.add('playing');
  }

  setTimeout(() => {
    state.lastHits = [];
    const wasPlayed = playCard(card, targetUid);
    const hits = state.lastHits || [];
    state.lastHits = [];

    render();
    animateHits(hits);

    const playerEl = document.querySelector('[data-panel="player"]');

    const hasBlock = def.effects.some(e => e.kind === 'block');
    if (hasBlock && playerEl) {
      spawnFloatText(playerEl, '+BLOCK', 'block');
      setTimeout(() => spawnBlockEffect(playerEl), 60);
    }

    const hasHeal = def.effects.some(e => e.kind === 'heal' || e.kind === 'reaper');
    if (hasHeal && playerEl) {
      spawnFloatText(playerEl, '+HP', 'heal');
    }

    if (wasPlayed && def.endsTurn && !state.over) {
      state.pendingCardUid = null;
      setTimeout(() => {
        if (state.over) return;
        state.lastHits = [];
        beginEnemyTurn();
        render();
        setTimeout(() => {
          resolveEnemyTurn();
          const enemyHits = state.lastHits || [];
          state.lastHits = [];
          render();
          animateHits(enemyHits);
        }, 450);
      }, 300);
    }
  }, 220);
}

function cardFace(defId, { disabled = false, small = false, big = false, enchant = null } = {}) {
  const def = CARDS[defId];
  const enchantDef = enchant ? getEnchant(enchant) : null;

  const el = document.createElement('div');
  el.className = 'card';
  if (disabled) el.classList.add('disabled');
  if (small) el.classList.add('card-small');
  if (big) el.classList.add('card-big');
  if (enchantDef) el.classList.add('has-enchant');
  el.classList.add(`rarity-${def.rarity || 'common'}`);
  el.classList.add(`type-${def.type || 'skill'}`);
  if (def.retain) el.classList.add('card-retain');

  const ctx = playerCardContext();
  const text = resolveCardText(def, ctx);

  el.innerHTML = `
    <div class="cost">${def.unplayable ? '–' : def.cost}</div>
    ${def.type === 'spell' ? '<div class="spell-icon"></div>' : ''}
    <div class="cname">${def.name}</div>
    <div class="ctext">${text}</div>
    ${enchantDef ? `
      <div class="card-enchant rarity-${enchantDef.rarity}">
        <span class="card-enchant-name">${enchantDef.name}</span>
        <span class="card-enchant-text">${enchantDef.text}</span>
      </div>
    ` : ''}
  `;
  return el;
}

function bottomBar() {
  const bar = document.createElement('div');
  bar.className = 'bar';

  bar.appendChild(pileEl('Draw', state.drawPile.length, () => {
    toggleDrawOverlay(); render();
  }));

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'End Turn';
  btn.disabled = state.turn !== 'player' || state.over;
  btn.addEventListener('click', () => {
    state.pendingCardUid = null;
    state.lastHits = [];
    beginEnemyTurn();
    render();
    setTimeout(() => {
      resolveEnemyTurn();
      const hits = state.lastHits || [];
      state.lastHits = [];
      render();
      animateHits(hits);
    }, 450);
  });
  bar.appendChild(btn);

  bar.appendChild(pileEl('Discard', state.discardPile.length, () => {
    toggleDiscardOverlay(); render();
  }));

  if (state.exhaustPile.length) {
    bar.appendChild(pileEl('Exhaust', state.exhaustPile.length, () => {
      toggleExhaustOverlay(); render();
    }));
  }

  return bar;
}

// ============================================================
// END-OF-COMBAT BANNER
// ============================================================

function endBanner() {
  const overlay = document.createElement('div');
  overlay.className = 'victory-overlay';

  const card = document.createElement('div');
  card.className = 'victory-card';

  if (state.result === 'win') {
    const title = document.createElement('h1');
    title.className = 'victory-title win';
    title.textContent = 'Victory';
    card.appendChild(title);

    const btn = document.createElement('button');
    btn.className = 'btn';

    if (state.combatKind === 'boss') {
      if (state.lastEncounterId === 'final-boss') {
        btn.textContent = 'See Final Results';
        btn.addEventListener('click', () => { finishRun(); render(); });
      } else {
        btn.textContent = `Continue to Act ${state.run.act + 1}`;
        btn.addEventListener('click', () => { nextAct(); render(); });
      }
    } else {
      btn.textContent = 'Rewards';
      btn.addEventListener('click', () => { state.screen = 'reward'; render(); });
    }
    card.appendChild(btn);
  } else {
    renderDeathPage(card);
  }

  overlay.appendChild(card);
  return overlay;
}

// ============================================================
// DEATH — paginated reveal
// ============================================================

const DEATH_PAGES = [
  // ---- Page 1: The taking ----
  [
    { text: 'The dungeon reaches for you. Cold. Patient. Certain.' },
    { text: 'You feel it take the cards first. Then the memories of the people who taught you to hold them. Then your name.' },
    { text: 'And then — the room goes quiet, and you understand.' },
    { text: 'You are becoming part of it.', cls: 'death-emphasis' },
  ],

  // ---- Page 2: The weight ----
  [
    { text: 'One more voice inside the dark. One more Drawn who walked in and did not walk out. You can feel the others. Hundreds of them. Thousands. Every hero who ever made it this far and then stopped.' },
    { text: 'If it takes you, there is no one else. The Drawn are hunted the moment they are found. There is no second hero waiting in the wings. There is no army coming to finish what you could not.' },
    { text: 'If the dungeon consumes you, the world ends with you.', cls: 'death-emphasis' },
  ],

  // ---- Page 3: The turn ----
  [
    { text: 'But — you remember them.' },
    { text: 'The people who taught you how to hold a card. The village that sent you off with nothing but hope. Everyone still breathing above you who will not survive the week if you fall here.' },
    { text: 'You are filled with determination.', cls: 'death-emphasis' },
  ],

  // ---- Page 4: The pull ----
  [
    { text: 'Your hand closes around the amulet at your chest — the last gift your family gave you before you left. A small thing. Worn smooth by other hands long before yours.' },
    { text: 'It is warm. It has always been warm.' },
    { text: 'You pull.' },
    { text: 'A burst of light.', cls: 'death-emphasis' },
    { text: 'You are back at the beginning.', cls: 'death-last' },
  ],
];

function renderDeathPage(card) {
  const pageIndex = state.deathPage ?? 0;
  const isLast = pageIndex >= DEATH_PAGES.length - 1;
  const paragraphs = DEATH_PAGES[pageIndex];

  const wrap = document.createElement('div');
  wrap.className = 'death-text';
  wrap.style.animation = 'none';

  const page = document.createElement('div');
  page.className = 'death-page';
  for (const p of paragraphs) {
    const el = document.createElement('p');
    if (p.cls) el.className = p.cls;
    el.textContent = p.text;
    page.appendChild(el);
  }
  wrap.appendChild(page);

  const dots = document.createElement('div');
  dots.className = 'death-page-dots';
  for (let i = 0; i < DEATH_PAGES.length; i++) {
    const dot = document.createElement('span');
    dot.className = 'death-page-dot' + (i === pageIndex ? ' active' : '');
    dots.appendChild(dot);
  }
  wrap.appendChild(dots);

  card.appendChild(wrap);

  const btn = document.createElement('button');
  btn.className = 'btn death-btn';
  btn.textContent = isLast ? 'Return to the Beginning' : 'Continue';
  btn.addEventListener('click', () => {
    if (isLast) {
      state.deathPage = 0;
      returnToMainMenu();
      render();
    } else {
      state.deathPage = pageIndex + 1;
      render();
    }
  });
  card.appendChild(btn);
}

function renderGameOver(app) {
  const el = document.createElement('div');
  el.className = 'screen screen-center';
  el.textContent = 'Game over.';
  app.appendChild(el);
}
