import {
  state,
  toggleDeckOverlay, toggleRelicOverlay,
  toggleDrawOverlay, toggleDiscardOverlay, toggleExhaustOverlay,
  closeOverlays, dismissBossLore, activeBossPassives,
} from '../systems/state.js';
import { dispatch } from '../systems/dispatch.js';
import { getMode, isGuest } from '../systems/net.js';
import {
  canPlay, selectCardForPlay, costOf,
} from '../systems/combat.js';
import {
  animateHits,
  spawnFloatText,
  spawnBlockEffect,
} from './animations.js';
import {
  autoSave, hasSave, loadSave, restoreRun, clearSave,
} from '../systems/save.js';
import {
  hostStart, hostAcceptAnswer, guestStart, onStatus, isChannelOpen,
} from '../systems/net.js';
import { CARDS } from '../data/cards.js';
import { RELICS } from '../data/relics.js';
import { ENEMY_CARDS } from '../data/enemy-cards.js';
import { NODE_TYPES } from '../data/maps.js';
import { getNode, reachableFrom, startingNodes } from '../systems/map.js';
import { getEnchant } from '../data/enchants.js';

const LONG_PRESS_MS = 450;
const DRAG_THRESHOLD = 14;

let shopRemoveMode = false;

function me() {
  return state.players[0];
}

// ------------------------------------------------------------
// Dispatch wrappers
// ------------------------------------------------------------
const chooseRelic         = (id)  => dispatch({ type: 'CHOOSE_RELIC', relicId: id });
const confirmDeck         = ()    => dispatch({ type: 'CONFIRM_DECK' });
const newRun              = (seed) => dispatch({ type: 'NEW_RUN', seed });
const startNode           = (id)  => dispatch({ type: 'START_NODE', nodeId: id });
const backToMap           = ()    => dispatch({ type: 'BACK_TO_MAP' });
const claimReward         = ()    => dispatch({ type: 'CLAIM_REWARD' });
const takeRewardCard      = (id)  => dispatch({ type: 'TAKE_REWARD_CARD', defId: id });
const skipRewardCard      = ()    => dispatch({ type: 'SKIP_REWARD_CARD' });
const pickEventChoice     = (i)   => dispatch({ type: 'PICK_EVENT_CHOICE', index: i });
const buyShopCard         = (i)   => dispatch({ type: 'BUY_SHOP_CARD', index: i });
const buyShopHeal         = ()    => dispatch({ type: 'BUY_SHOP_HEAL' });
const buyShopRemove       = (i)   => dispatch({ type: 'BUY_SHOP_REMOVE', index: i });
const restHeal            = ()    => dispatch({ type: 'REST_HEAL' });
const restEnchantStart    = ()    => dispatch({ type: 'REST_ENCHANT_START' });
const applyEnchant        = (i)   => dispatch({ type: 'APPLY_ENCHANT', index: i });
const skipEnchant         = ()    => dispatch({ type: 'SKIP_ENCHANT' });
const returnToMainMenu    = ()    => dispatch({ type: 'RETURN_TO_MAIN_MENU' });
const nextAct             = ()    => dispatch({ type: 'NEXT_ACT' });
const claimActReward      = ()    => dispatch({ type: 'CLAIM_ACT_REWARD' });
const takeActRewardCard   = (id)  => dispatch({ type: 'TAKE_ACT_REWARD_CARD', defId: id });
const skipActRewardCard   = ()    => dispatch({ type: 'SKIP_ACT_REWARD_CARD' });
const takeActRewardRelic  = (id)  => dispatch({ type: 'TAKE_ACT_REWARD_RELIC', relicId: id });
const finishRun           = ()    => dispatch({ type: 'FINISH_RUN' });
const pickTreasureRelic   = (id)  => dispatch({ type: 'PICK_TREASURE_RELIC', relicId: id });
const skipTreasure        = ()    => dispatch({ type: 'SKIP_TREASURE' });

// ============================================================
// Main render entry
// ============================================================

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
    case 'mpHost':      renderMpHost(app);      break;
    case 'mpGuest':     renderMpGuest(app);     break;
    default:            renderGameOver(app);
  }

  const p = me();
  if (state.overlays?.deck)    renderDeckOverlay(app);
  if (state.overlays?.relics)  renderRelicOverlay(app);
  if (state.overlays?.draw)    renderCardPileOverlay(app, 'Draw Pile', p?.drawPile || []);
  if (state.overlays?.discard) renderCardPileOverlay(app, 'Discard Pile', p?.discardPile || []);
  if (state.overlays?.exhaust) renderCardPileOverlay(app, 'Exhausted', p?.exhaustPile || []);

  if (state.bossLore) renderBossLore(app);

  autoSave(state);
}

// ============================================================
// Main menu
// ============================================================

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

  if (hasSave()) {
    const continueBtn = document.createElement('button');
    continueBtn.className = 'btn main-menu-btn';
    continueBtn.textContent = 'Continue';
    continueBtn.addEventListener('click', () => {
      const save = loadSave();
      if (!save) { render(); return; }
      restoreRun(state, save);
      render();
    });
    inner.appendChild(continueBtn);

    const newRunBtn = document.createElement('button');
    newRunBtn.className = 'btn main-menu-btn';
    newRunBtn.textContent = 'New Run';
    newRunBtn.title = 'Starting a new run will delete your current save.';
    newRunBtn.addEventListener('click', () => {
      if (!confirm('Start a new run? Your current progress will be lost.')) return;
      clearSave();
      newRun();
    });
    inner.appendChild(newRunBtn);
  } else {
    const btn = document.createElement('button');
    btn.className = 'btn main-menu-btn';
    btn.textContent = 'Begin';
    btn.addEventListener('click', () => newRun());
    inner.appendChild(btn);
  }

  const mpBtn = document.createElement('button');
  mpBtn.className = 'btn main-menu-btn';
  mpBtn.textContent = 'Multiplayer';
  mpBtn.addEventListener('click', () => {
    state.screen = 'mpHost';
    render();
  });
  inner.appendChild(mpBtn);

  wrap.appendChild(inner);
  app.appendChild(wrap);
}

// ============================================================
// Boss lore modal
// ============================================================

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

// ============================================================
// Card text resolution
// ============================================================

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
  const attacker = me();
  const living = (state.enemies || []).filter(e => e.hp > 0);
  const target = living.find(e => e.uid === state.selectedEnemyId) || living[0] || null;
  return { attacker, target };
}

function enemyCardContext(enemy) {
  return { attacker: enemy, target: me() };
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

  const p = me();

  const deckBtn = document.createElement('button');
  deckBtn.className = 'icon-btn';
  deckBtn.title = 'View deck';
  deckBtn.textContent = `Deck ${p.deck.length}`;
  deckBtn.addEventListener('click', () => { toggleDeckOverlay(); render(); });
  wrap.appendChild(deckBtn);

  if (p.relics?.length) {
    const relicBtn = document.createElement('button');
    relicBtn.className = 'icon-btn';
    relicBtn.title = 'View relics';
    relicBtn.textContent = `Relics ${p.relics.length}`;
    relicBtn.addEventListener('click', () => { toggleRelicOverlay(); render(); });
    wrap.appendChild(relicBtn);
  }

  return wrap;
}

// ============================================================
// Overlays
// ============================================================

function renderDeckOverlay(app) {
  const overlay = cardGridOverlay('Your Deck', sortDeckEntries(me().deck));
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
  for (const id of me().relics) {
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

// ============================================================
// Relic pick / deck view
// ============================================================

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
    row.appendChild(relicCard(r, () => chooseRelic(id)));
  }
  wrap.appendChild(row);
  app.appendChild(wrap);
}

function renderDeckView(app) {
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';
  const p = me();
  const relic = RELICS[p.relic];
  const h = document.createElement('h1');
  h.textContent = 'Your Starting Deck';
  wrap.appendChild(h);
  const sub = document.createElement('p');
  sub.className = 'muted';
  sub.innerHTML = `<strong style="color:#c9a3ff">${relic.name}</strong> — ${relic.text}`;
  wrap.appendChild(sub);

  const grid = document.createElement('div');
  grid.className = 'deck-grid';
  p.deck.forEach((entry, i) => {
    const el = cardFace(entry.defId, { disabled: true, small: true, enchant: entry.enchant });
    el.style.animationDelay = `${i * 30}ms`;
    grid.appendChild(el);
  });
  wrap.appendChild(grid);

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Begin';
  btn.addEventListener('click', () => confirmDeck());
  wrap.appendChild(btn);
  app.appendChild(wrap);
}

// ============================================================
// Map
// ============================================================

function renderMap(app) {
  const map = state.run.map;
  const p = me();
  const wrap = document.createElement('div');
  wrap.className = 'screen map-screen';

  const header = document.createElement('div');
  header.className = 'map-header';
  header.innerHTML = `
    <div>Act ${state.run.act}</div>
    <div>HP <span class="hp">${p.hp}/${p.maxHp}</span></div>
    <div>${goldDisplay(p.gold)}</div>
    <div>Floor ${state.run.floor + 1} / ${map.floors}</div>
  `;
  wrap.appendChild(header);
  wrap.appendChild(topButtons());

  const actions = document.createElement('div');
  actions.className = 'map-actions';

  const saveMenuBtn = document.createElement('button');
  saveMenuBtn.className = 'icon-btn';
  saveMenuBtn.textContent = 'Save & Menu';
  saveMenuBtn.title = 'Your run is auto-saved. Return to main menu.';
  saveMenuBtn.addEventListener('click', () => {
    autoSave(state);
    state.screen = 'mainMenu';
    render();
  });
  actions.appendChild(saveMenuBtn);
  wrap.appendChild(actions);

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
      el.addEventListener('click', () => startNode(n.id));
    } else {
      el.classList.add('map-node-locked');
    }
    board.appendChild(el);
  }

  wrap.appendChild(board);
  app.appendChild(wrap);
}

// ============================================================
// Reward
// ============================================================

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
      el.addEventListener('click', () => takeRewardCard(id));
      grid.appendChild(el);
    }
    wrap.appendChild(grid);

    const skip = document.createElement('button');
    skip.className = 'btn';
    skip.textContent = 'Skip';
    skip.addEventListener('click', () => skipRewardCard());
    wrap.appendChild(skip);
  }

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Continue';
  btn.addEventListener('click', () => claimReward());
  wrap.appendChild(btn);
  app.appendChild(wrap);
}

// ============================================================
// Act reward
// ============================================================

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
      row.appendChild(relicCard(relic, () => takeActRewardRelic(id)));
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
        el.addEventListener('click', () => takeActRewardCard(id));
        grid.appendChild(el);
      }
      wrap.appendChild(grid);

      const skip = document.createElement('button');
      skip.className = 'btn';
      skip.textContent = 'Skip';
      skip.addEventListener('click', () => skipActRewardCard());
      wrap.appendChild(skip);
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Onward';
      btn.addEventListener('click', () => claimActReward());
      wrap.appendChild(btn);
    }
  }

  app.appendChild(wrap);
}

// ============================================================
// Treasure
// ============================================================

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
    row.appendChild(relicCard(relic, () => pickTreasureRelic(id)));
  }
  wrap.appendChild(row);

  const skip = document.createElement('button');
  skip.className = 'btn';
  skip.textContent = 'Skip Relic';
  skip.addEventListener('click', () => skipTreasure());
  wrap.appendChild(skip);

  app.appendChild(wrap);
}

// ============================================================
// Victory
// ============================================================

function renderVictory(app) {
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';

  const h = document.createElement('h1');
  h.textContent = 'You Win';
  h.style.color = '#ffd166';
  wrap.appendChild(h);

  const p = me();
  const stats = document.createElement('div');
  stats.className = 'victory-stats';
  stats.innerHTML = `
    <div>Acts cleared: <strong>${state.run.act}</strong></div>
    <div>Final HP: <strong class="hp">${p.hp} / ${p.maxHp}</strong></div>
    <div>Gold: <strong>${goldDisplay(p.gold)}</strong></div>
    <div>Deck size: <strong>${p.deck.length}</strong></div>
    <div>Relics: <strong style="color:#c9a3ff">${p.relics.length}</strong></div>
  `;
  wrap.appendChild(stats);

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Return to the Beginning';
  btn.addEventListener('click', () => returnToMainMenu());
  wrap.appendChild(btn);

  app.appendChild(wrap);
}

// ============================================================
// Event
// ============================================================

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
    btn.addEventListener('click', () => pickEventChoice(i));
    choices.appendChild(btn);
  });
  wrap.appendChild(choices);
  app.appendChild(wrap);
}

// ============================================================
// Shop
// ============================================================

function renderShop(app) {
  const s = state.shop;
  const p = me();
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center shop-screen';

  if (shopRemoveMode) {
    renderShopRemoveMode(app, wrap, s);
    return;
  }

  const h = document.createElement('h1');
  h.textContent = 'Shop';
  wrap.appendChild(h);

  const gold = document.createElement('p');
  gold.innerHTML = 'Gold: ' + goldDisplay(p.gold);
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
    const affordable = p.gold >= item.price;
    if (!affordable) cell.classList.add('shop-unaffordable');
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Buy';
    btn.disabled = !affordable;
    btn.addEventListener('click', () => buyShopCard(i));
    cell.appendChild(btn);
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);

  const healRow = document.createElement('div');
  healRow.className = 'shop-heal';
  const healBtn = document.createElement('button');
  healBtn.className = 'btn';
  healBtn.textContent = `Heal 25 HP — ${s.healPrice}g`;
  healBtn.disabled = p.gold < s.healPrice;
  healBtn.addEventListener('click', () => buyShopHeal());
  healRow.appendChild(healBtn);
  wrap.appendChild(healRow);

  const removeRow = document.createElement('div');
  removeRow.className = 'shop-heal';
  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn';
  if (s.removeUsed) {
    removeBtn.textContent = 'Card already removed';
    removeBtn.disabled = true;
  } else {
    removeBtn.textContent = `Remove a card — ${s.removePrice}g`;
    removeBtn.disabled = p.gold < s.removePrice;
    removeBtn.addEventListener('click', () => {
      shopRemoveMode = true;
      render();
    });
  }
  removeRow.appendChild(removeBtn);
  wrap.appendChild(removeRow);

  const leave = document.createElement('button');
  leave.className = 'btn';
  leave.textContent = 'Leave';
  leave.addEventListener('click', () => {
    shopRemoveMode = false;
    backToMap();
  });
  wrap.appendChild(leave);
  app.appendChild(wrap);
}

function renderShopRemoveMode(app, wrap, s) {
  const p = me();
  const h = document.createElement('h1');
  h.textContent = 'Remove a Card';
  wrap.appendChild(h);

  const gold = document.createElement('p');
  gold.innerHTML = 'Gold: ' + goldDisplay(p.gold);
  wrap.appendChild(gold);

  const sub = document.createElement('p');
  sub.className = 'muted';
  sub.textContent = `Choose a card to remove permanently. Costs ${s.removePrice}g.`;
  wrap.appendChild(sub);

  const grid = document.createElement('div');
  grid.className = 'deck-grid';
  p.deck.forEach((entry, i) => {
    const el = cardFace(entry.defId, {
      small: true,
      enchant: entry.enchant,
    });
    el.classList.add('enchant-target');
    el.addEventListener('click', () => {
      shopRemoveMode = false;
      buyShopRemove(i);
    });
    grid.appendChild(el);
  });
  wrap.appendChild(grid);

  const cancel = document.createElement('button');
  cancel.className = 'btn';
  cancel.textContent = 'Cancel';
  cancel.addEventListener('click', () => {
    shopRemoveMode = false;
    render();
  });
  wrap.appendChild(cancel);

  app.appendChild(wrap);
}

// ============================================================
// Rest
// ============================================================

function renderRest(app) {
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';
  const h = document.createElement('h1');
  h.textContent = 'Rest Site';
  wrap.appendChild(h);

  const healBtn = document.createElement('button');
  healBtn.className = 'btn';
  healBtn.textContent = 'Rest — heal 30%';
  healBtn.addEventListener('click', () => restHeal());
  wrap.appendChild(healBtn);

  const enchantBtn = document.createElement('button');
  enchantBtn.className = 'btn';
  enchantBtn.textContent = 'Enchant a card';
  enchantBtn.addEventListener('click', () => restEnchantStart());
  wrap.appendChild(enchantBtn);

  app.appendChild(wrap);
}

// ============================================================
// Enchant pick
// ============================================================

function renderEnchantPick(app) {
  const pe = state.pendingEnchant;
  if (!pe) { renderMap(app); return; }
  const enchant = getEnchant(pe.enchantId);
  if (!enchant) { backToMap(); return; }

  const p = me();
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
  p.deck.forEach((entry, i) => {
    const eligible = pe.eligibleIndices.includes(i);
    const el = cardFace(entry.defId, {
      small: true,
      enchant: entry.enchant,
      disabled: !eligible,
    });
    if (eligible) {
      el.classList.add('enchant-target');
      el.addEventListener('click', () => applyEnchant(i));
    }
    grid.appendChild(el);
  });
  wrap.appendChild(grid);

  const skip = document.createElement('button');
  skip.className = 'btn';
  skip.textContent = 'Skip Enchant';
  skip.addEventListener('click', () => skipEnchant());
  wrap.appendChild(skip);

  app.appendChild(wrap);
}

// ============================================================
// Combat
// ============================================================

function renderCombat(app) {
  const p = me();
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
  const n = p.hand.length;
  p.hand.forEach((card, i) => {
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
  const p = me();
  const el = document.createElement('div');
  el.className = 'panel player';
  el.dataset.panel = 'player';

  // Show the boss card-play cap counter if a boss has that passive.
  const passives = activeBossPassives();
  let capHtml = '';
  if (passives.cardPlayCap != null) {
    const played = p.cardsPlayedThisTurn || 0;
    const cap = passives.cardPlayCap;
    const atCap = played >= cap;
    capHtml = `<div class="card-cap${atCap ? ' card-cap-full' : ''}">Cards played: ${played}/${cap}</div>`;
  }

  el.innerHTML = `
    <div class="panel-name">You</div>
    <div class="hp">HP ${p.hp} / ${p.maxHp}</div>
    <div class="block${p.block > 0 ? '' : ' block-empty'}">
      <span class="block-icon"></span>${p.block}
    </div>
    <div class="energy">Energy ${p.energy} / ${p.maxEnergy}</div>
    ${capHtml}
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
        const card = me().hand.find(c => c.uid === state.pendingCardUid);
        if (card) { doPlayCard(card, null, e.uid); return; }
      }
      dispatch({ type: 'SELECT_ENEMY', enemyUid: e.uid });
    });
  }
  wrap.appendChild(el);

  // Render ALL intent cards (scripted bosses have two).
  if (!dead) {
    const intents = e.intentCards?.length ? e.intentCards : (e.intentCard ? [e.intentCard] : []);
    for (const card of intents) {
      if (card) wrap.appendChild(enemyIntentCard(card, e));
    }
  }
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
    dispatch({ type: 'PLAY_CARD', cardUid: card.uid, targetUid });

    if (isGuest()) return;

    const hits = state.lastHits || [];
    state.lastHits = [];
    animateHits(hits);

    const playerEl = document.querySelector('[data-panel="player"]');

    const hasBlock = def.effects.some(e => e.kind === 'block');
    if (hasBlock && playerEl) {
      spawnFloatText(playerEl, '+BLOCK', 'block');
      setTimeout(() => spawnBlockEffect(playerEl), 60);
    }

    const hasHeal = def.effects.some(e => e.kind === 'heal' || e.kind === 'reaper');
    if (hasHeal && playerEl) spawnFloatText(playerEl, '+HP', 'heal');

    if (def.endsTurn && !state.over) {
      state.pendingCardUid = null;
      setTimeout(() => {
        if (state.over) return;
        state.lastHits = [];
        dispatch({ type: 'END_TURN' });
        const enemyHits = state.lastHits || [];
        state.lastHits = [];
        animateHits(enemyHits);
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
  const p = me();
  const bar = document.createElement('div');
  bar.className = 'bar';

  bar.appendChild(pileEl('Draw', p.drawPile.length, () => {
    toggleDrawOverlay(); render();
  }));

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'End Turn';
  btn.disabled = state.turn !== 'player' || state.over;
  btn.addEventListener('click', () => {
    state.pendingCardUid = null;
    state.lastHits = [];
    dispatch({ type: 'END_TURN' });

    if (isGuest()) return;

    const hits = state.lastHits || [];
    state.lastHits = [];
    animateHits(hits);
  });
  bar.appendChild(btn);

  bar.appendChild(pileEl('Discard', p.discardPile.length, () => {
    toggleDiscardOverlay(); render();
  }));

  if (p.exhaustPile.length) {
    bar.appendChild(pileEl('Exhaust', p.exhaustPile.length, () => {
      toggleExhaustOverlay(); render();
    }));
  }

  return bar;
}

// ============================================================
// End-of-combat banner
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
        btn.addEventListener('click', () => finishRun());
      } else {
        btn.textContent = `Continue to Act ${state.run.act + 1}`;
        btn.addEventListener('click', () => nextAct());
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
// Death pages
// ============================================================

const DEATH_PAGES = [
  [
    { text: 'The dungeon reaches for you. Cold. Patient. Certain.' },
    { text: 'You feel it take the cards first. Then the memories of the people who taught you to hold them. Then your name.' },
    { text: 'And then — the room goes quiet, and you understand.' },
    { text: 'You are becoming part of it.', cls: 'death-emphasis' },
  ],
  [
    { text: 'One more voice inside the dark. One more Drawn who walked in and did not walk out. You can feel the others. Hundreds of them. Thousands. Every hero who ever made it this far and then stopped.' },
    { text: 'If it takes you, there is no one else. The Drawn are hunted the moment they are found. There is no second hero waiting in the wings. There is no army coming to finish what you could not.' },
    { text: 'If the dungeon consumes you, the world ends with you.', cls: 'death-emphasis' },
  ],
  [
    { text: 'But — you remember them.' },
    { text: 'The people who taught you how to hold a card. The village that sent you off with nothing but hope. Everyone still breathing above you who will not survive the week if you fall here.' },
    { text: 'You are filled with determination.', cls: 'death-emphasis' },
  ],
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

// ============================================================
// MULTIPLAYER — HOST
// ============================================================

let mpHostState = {
  offerBlob: '',
  pastedAnswer: '',
  status: '',
  statusKind: '',
  connected: false,
};

let mpStatusBound = false;
function bindMpStatus() {
  if (mpStatusBound) return;
  mpStatusBound = true;
  onStatus((text, kind) => {
    mpHostState.status = text;
    mpHostState.statusKind = kind || '';
    if (text === 'Data channel open') mpHostState.connected = true;
    if (state.screen === 'mpHost' || state.screen === 'mpGuest') render();
  });
}
bindMpStatus();

async function mpGenerateOffer() {
  mpHostState.status = 'Generating offer…';
  mpHostState.statusKind = 'wait';
  render();
  try {
    mpHostState.offerBlob = await hostStart();
    mpHostState.status = 'Offer ready — send it to the guest';
    mpHostState.statusKind = 'ok';
  } catch (e) {
    mpHostState.status = 'Failed: ' + e.message;
    mpHostState.statusKind = 'err';
  }
  render();
}

async function mpAcceptAnswer() {
  if (!mpHostState.pastedAnswer.trim()) return;
  try {
    await hostAcceptAnswer(mpHostState.pastedAnswer);
    mpHostState.status = 'Answer accepted — connecting…';
    mpHostState.statusKind = 'wait';
    render();
  } catch (e) {
    mpHostState.status = 'Bad answer: ' + e.message;
    mpHostState.statusKind = 'err';
    render();
  }
}

function renderMpHost(app) {
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';

  const h = document.createElement('h1');
  h.textContent = 'Host Multiplayer';
  wrap.appendChild(h);

  const sub = document.createElement('p');
  sub.className = 'muted';
  sub.textContent = 'Generate the offer, send it to your guest, then paste their reply back.';
  wrap.appendChild(sub);

  const offerLabel = document.createElement('p');
  offerLabel.className = 'muted';
  offerLabel.textContent = '1. Copy this and send to the guest:';
  wrap.appendChild(offerLabel);

  const offerTa = document.createElement('textarea');
  offerTa.className = 'mp-textarea';
  offerTa.readOnly = true;
  offerTa.value = mpHostState.offerBlob || '(click Generate to create)';
  offerTa.rows = 4;
  wrap.appendChild(offerTa);

  const offerBtns = document.createElement('div');
  offerBtns.style.display = 'flex';
  offerBtns.style.gap = '8px';
  offerBtns.style.marginTop = '8px';

  const genBtn = document.createElement('button');
  genBtn.className = 'btn';
  genBtn.textContent = mpHostState.offerBlob ? 'Regenerate' : 'Generate Offer';
  genBtn.addEventListener('click', mpGenerateOffer);
  offerBtns.appendChild(genBtn);

  if (mpHostState.offerBlob) {
    const copyOfferBtn = document.createElement('button');
    copyOfferBtn.className = 'btn';
    copyOfferBtn.textContent = 'Copy Offer';
    copyOfferBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(mpHostState.offerBlob); } catch {}
    });
    offerBtns.appendChild(copyOfferBtn);
  }
  wrap.appendChild(offerBtns);

  const answerLabel = document.createElement('p');
  answerLabel.className = 'muted';
  answerLabel.style.marginTop = '16px';
  answerLabel.textContent = "2. Paste the guest's reply here:";
  wrap.appendChild(answerLabel);

  const answerTa = document.createElement('textarea');
  answerTa.className = 'mp-textarea';
  answerTa.value = mpHostState.pastedAnswer;
  answerTa.rows = 4;
  answerTa.addEventListener('input', () => { mpHostState.pastedAnswer = answerTa.value; });
  wrap.appendChild(answerTa);

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn';
  acceptBtn.style.marginTop = '8px';
  acceptBtn.textContent = 'Accept Answer';
  acceptBtn.addEventListener('click', mpAcceptAnswer);
  wrap.appendChild(acceptBtn);

  const status = document.createElement('p');
  status.textContent = mpHostState.status || 'Idle.';
  status.style.marginTop = '12px';
  status.style.color = mpHostState.statusKind === 'ok' ? '#6bff9e' :
                       mpHostState.statusKind === 'err' ? '#ff8a8a' :
                       mpHostState.statusKind === 'wait' ? '#ffd166' : '#8b93a1';
  wrap.appendChild(status);

  if (mpHostState.connected) {
    const startBtn = document.createElement('button');
    startBtn.className = 'btn';
    startBtn.textContent = 'Start Game';
    startBtn.style.marginTop = '16px';
    startBtn.style.fontSize = '18px';
    startBtn.style.padding = '16px 40px';
    startBtn.addEventListener('click', () => newRun());
    wrap.appendChild(startBtn);
  }

  const switchRow = document.createElement('div');
  switchRow.style.marginTop = '16px';
  switchRow.style.display = 'flex';
  switchRow.style.gap = '8px';

  const guestBtn = document.createElement('button');
  guestBtn.className = 'btn';
  guestBtn.textContent = 'Join as Guest instead';
  guestBtn.addEventListener('click', () => {
    state.screen = 'mpGuest';
    render();
  });
  switchRow.appendChild(guestBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'btn';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => {
    state.screen = 'mainMenu';
    render();
  });
  switchRow.appendChild(backBtn);
  wrap.appendChild(switchRow);

  app.appendChild(wrap);
}

// ============================================================
// MULTIPLAYER — GUEST
// ============================================================

let mpGuestState = {
  pastedOffer: '',
  answerBlob: '',
  status: '',
  statusKind: '',
};

async function mpGenerateAnswer() {
  if (!mpGuestState.pastedOffer.trim()) return;
  mpGuestState.status = 'Reading offer…';
  mpGuestState.statusKind = 'wait';
  render();
  try {
    mpGuestState.answerBlob = await guestStart(mpGuestState.pastedOffer);
    mpGuestState.status = 'Answer ready — send it back to the host';
    mpGuestState.statusKind = 'ok';
  } catch (e) {
    mpGuestState.status = 'Failed: ' + e.message;
    mpGuestState.statusKind = 'err';
  }
  render();
}

function renderMpGuest(app) {
  const wrap = document.createElement('div');
  wrap.className = 'screen screen-center';

  const h = document.createElement('h1');
  h.textContent = 'Join Multiplayer';
  wrap.appendChild(h);

  const sub = document.createElement('p');
  sub.className = 'muted';
  sub.textContent = "Paste the offer from the host, then send the reply back.";
  wrap.appendChild(sub);

  const offerLabel = document.createElement('p');
  offerLabel.className = 'muted';
  offerLabel.textContent = "1. Paste the host's offer here:";
  wrap.appendChild(offerLabel);

  const offerTa = document.createElement('textarea');
  offerTa.className = 'mp-textarea';
  offerTa.value = mpGuestState.pastedOffer;
  offerTa.rows = 4;
  offerTa.addEventListener('input', () => { mpGuestState.pastedOffer = offerTa.value; });
  wrap.appendChild(offerTa);

  const genBtn = document.createElement('button');
  genBtn.className = 'btn';
  genBtn.style.marginTop = '8px';
  genBtn.textContent = 'Generate Reply';
  genBtn.addEventListener('click', mpGenerateAnswer);
  wrap.appendChild(genBtn);

  if (mpGuestState.answerBlob) {
    const answerLabel = document.createElement('p');
    answerLabel.className = 'muted';
    answerLabel.style.marginTop = '16px';
    answerLabel.textContent = '2. Send this back to the host:';
    wrap.appendChild(answerLabel);

    const answerTa = document.createElement('textarea');
    answerTa.className = 'mp-textarea';
    answerTa.readOnly = true;
    answerTa.value = mpGuestState.answerBlob;
    answerTa.rows = 4;
    wrap.appendChild(answerTa);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn';
    copyBtn.style.marginTop = '8px';
    copyBtn.textContent = 'Copy Reply';
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(mpGuestState.answerBlob); } catch {}
    });
    wrap.appendChild(copyBtn);

    const waiting = document.createElement('p');
    waiting.className = 'muted';
    waiting.textContent = 'Waiting for the host to start the game…';
    waiting.style.marginTop = '16px';
    wrap.appendChild(waiting);
  }

  const status = document.createElement('p');
  status.textContent = mpGuestState.status || 'Idle.';
  status.style.marginTop = '12px';
  status.style.color = mpGuestState.statusKind === 'ok' ? '#6bff9e' :
                       mpGuestState.statusKind === 'err' ? '#ff8a8a' :
                       mpGuestState.statusKind === 'wait' ? '#ffd166' : '#8b93a1';
  wrap.appendChild(status);

  const switchRow = document.createElement('div');
  switchRow.style.marginTop = '16px';
  switchRow.style.display = 'flex';
  switchRow.style.gap = '8px';

  const hostBtn = document.createElement('button');
  hostBtn.className = 'btn';
  hostBtn.textContent = 'Host instead';
  hostBtn.addEventListener('click', () => {
    state.screen = 'mpHost';
    render();
  });
  switchRow.appendChild(hostBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'btn';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => {
    state.screen = 'mainMenu';
    render();
  });
  switchRow.appendChild(backBtn);
  wrap.appendChild(switchRow);

  app.appendChild(wrap);
}
