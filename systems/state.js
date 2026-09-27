import { randomStartingDeck, CARDS } from '../data/cards.js';
import { ENCOUNTERS, getEnemyDef } from '../data/enemies.js';
import {
  makeCard, shuffle, draw, makeRng, makeEnemyCard, drawEnemyCard,
} from './deck.js';
import { RELICS, rollRelicChoices } from '../data/relics.js';
import { generateMap, getNode, reachableFrom, startingNodes } from './map.js';
import { rollCoins, rollCardChoices, rollActTransition } from './rewards.js';
import { randomEvent } from '../data/events.js';
import { rollShop } from '../data/shop.js';
import { bannerForCombat } from '../data/banners.js';
import { rollEnchant, getEnchant } from '../data/enchants.js';
import { BOSSES } from '../data/bosses/index.js';
import { clearSave } from './save.js';

const BOSS_LORE = {};
for (const bossModule of BOSSES) {
  if (bossModule.ENEMY && bossModule.LORE) {
    BOSS_LORE[bossModule.ENEMY.id] = bossModule.LORE;
  }
}

export function getBossLore(enemyId) {
  return BOSS_LORE[enemyId] || null;
}

export const state = {
  screen: 'mainMenu',
  rng: null,
  run: null,
  player: null,
  enemies: [],

  drawPile: [],
  hand: [],
  discardPile: [],
  exhaustPile: [],
  energy: 0,
  maxEnergy: 3,
  turn: 'player',
  over: false,
  result: null,
  selectedEnemyId: null,
  pendingCardUid: null,
  previewCardUid: null,
  newlyDrawn: new Set(),

  lastHits: [],
  currentAnimation: null,
  bossLore: null,

  reward: null,
  actReward: null,
  treasure: null,
  event: null,
  shop: null,
  rest: null,
  pendingEnchant: null,

  overlays: { deck: false, relics: false, draw: false, discard: false, exhaust: false },

  log: [],
  relicChoices: [],
  combatKind: 'monster',
  combatBanner: null,
  lastEncounterId: null,
  deathPage: 0,
};

export function cardDef(card) {
  return CARDS[card.defId];
}
state.cardDef = cardDef;

export function pushLog(msg) {
  state.log.push(msg);
  if (state.log.length > 60) state.log.shift();
}

export function showBossLore(enemyId, trigger) {
  const lore = getBossLore(enemyId);
  if (!lore || !lore[trigger]) return;
  state.bossLore = { enemyId, trigger, lines: lore[trigger] };
}

export function dismissBossLore() {
  state.bossLore = null;
}

function emptyOverlays() {
  return { deck: false, relics: false, draw: false, discard: false, exhaust: false };
}

export function actScaling(act) {
  const table = {
    1: { hp: 1.0,  damage: 1.0  },
    2: { hp: 1.3,  damage: 1.15 },
    3: { hp: 1.55, damage: 1.3  },
    4: { hp: 1.75, damage: 1.4  },
    5: { hp: 1.9,  damage: 1.5  },
  };
  return table[act] ?? table[1];
}

export function forEachRelic(trigger, fn) {
  for (const rid of state.run.relics || []) {
    const r = RELICS[rid];
    if (r && r.trigger === trigger) fn(r);
  }
}

export function hasRelicTrigger(trigger) {
  for (const rid of state.run.relics || []) {
    const r = RELICS[rid];
    if (r && r.trigger === trigger) return true;
  }
  return false;
}

function makeDeckEntry(defId) {
  return { defId, enchant: null };
}

export function newRun(seed = Date.now()) {
  state.rng = makeRng(seed);
  state.run = {
    seed,
    act: 1,
    hp: 70, maxHp: 70,
    gold: 99,
    relic: null,
    relics: [],
    deck: [],
    map: null,
    currentNodeId: null,
    floor: -1,
    cleared: false,
    victory: false,
    bossesBeaten: [],
  };
  state.relicChoices = rollRelicChoices(state.rng, [], 3);
  state.screen = 'relicPick';
  state.log = [];
  state.over = false;
  state.result = null;
  state.overlays = emptyOverlays();
  state.combatBanner = null;
  state.treasure = null;
  state.previewCardUid = null;
  state.newlyDrawn = new Set();
  state.lastHits = [];
  state.currentAnimation = null;
  state.pendingEnchant = null;
  state.bossLore = null;
  state.lastEncounterId = null;
  state.deathPage = 0;
}

export function chooseRelic(relicId) {
  state.run.relic = relicId;
  state.run.relics = [relicId];
  // 15-card starter deck. Bash and Neutralize are in the 'starter'
  // rarity pool and roll naturally at ~30% per slot.
  state.run.deck = randomStartingDeck(state.rng, 15).map(makeDeckEntry);
  state.screen = 'deckView';
}

export function confirmDeck() {
  state.run.map = generateMap(state.rng);
  state.run.currentNodeId = null;
  state.run.floor = -1;
  state.screen = 'map';
}

export function closeOverlays() {
  state.overlays = emptyOverlays();
}

function openOnly(key) {
  state.overlays = emptyOverlays();
  if (key) state.overlays[key] = true;
}

export function toggleDeckOverlay()    { openOnly(state.overlays.deck    ? null : 'deck'); }
export function toggleRelicOverlay()   { openOnly(state.overlays.relics  ? null : 'relics'); }
export function toggleDrawOverlay()    { openOnly(state.overlays.draw    ? null : 'draw'); }
export function toggleDiscardOverlay() { openOnly(state.overlays.discard ? null : 'discard'); }
export function toggleExhaustOverlay() { openOnly(state.overlays.exhaust ? null : 'exhaust'); }

export function startNode(nodeId) {
  const node = getNode(state.run.map, nodeId);
  if (!node) return;

  if (state.run.currentNodeId) {
    const reachable = reachableFrom(state.run.map, state.run.currentNodeId).map(n => n.id);
    if (!reachable.includes(nodeId)) return;
  } else {
    const starters = startingNodes(state.run.map).map(n => n.id);
    if (!starters.includes(nodeId)) return;
  }

  state.run.currentNodeId = nodeId;
  state.run.floor = node.floor;

  if (node.type === 'monster') {
    newCombat(pickEncounter('monster'), 'monster');
  } else if (node.type === 'elite') {
    newCombat(pickEncounter('elite'), 'elite');
  } else if (node.type === 'boss') {
    newCombat(pickEncounter('boss'), 'boss');
  } else if (node.type === 'event') {
    state.event = { data: randomEvent(state.rng) };
    state.screen = 'event';
  } else if (node.type === 'shop') {
    state.shop = { items: rollShop(state.rng, 5), healPrice: 60 };
    state.screen = 'shop';
  } else if (node.type === 'rest') {
    state.rest = { healed: false };
    state.screen = 'rest';
  } else if (node.type === 'treasure') {
    const relicChoices = rollRelicChoices(state.rng, state.run.relics, 3);
    const gold = 30 + Math.floor(state.rng() * 20);
    state.treasure = { relicChoices, gold };
    state.screen = 'treasure';
    return;
  } else {
    state.screen = 'map';
  }
}

export function pickTreasureRelic(relicId) {
  if (!state.treasure) return;
  if (state.treasure.relicChoices.length === 0) return;
  if (!state.treasure.relicChoices.includes(relicId)) return;
  state.run.relics.push(relicId);
  state.run.relic = state.run.relic || relicId;
  state.run.gold += state.treasure.gold;
  pushLog(`Treasure: ${RELICS[relicId].name}. +${state.treasure.gold} gold.`);
  state.treasure = null;
  backToMap();
}

export function skipTreasure() {
  if (!state.treasure) return;
  state.run.gold += state.treasure.gold;
  pushLog(`Skipped treasure. +${state.treasure.gold} gold.`);
  state.treasure = null;
  backToMap();
}

function pickEncounter(kind) {
  if (kind === 'monster') {
    const pool = [
      'act1-basic', 'act1-cultist', 'act1-fungi', 'act1-slaver',
      'act1-slimes', 'act1-spike', 'act1-looter', 'act1-gremlins',
      'act1-chosen', 'act1-byrd', 'act1-centurion',
    ];
    return pool[Math.floor(state.rng() * pool.length)];
  }
  if (kind === 'elite') {
    const pool = ['act1-elite-1', 'act1-elite-2', 'act1-elite-3', 'act1-elite-4'];
    return pool[Math.floor(state.rng() * pool.length)];
  }

  const act = state.run.act;
  let pool;
  if (act === 1) {
    pool = ['act1-boss', 'act1-boss-2', 'act1-boss-3'];
  } else if (act === 2) {
    pool = ['act1-boss', 'act1-boss-2', 'act1-boss-3']
      .filter(b => !state.run.bossesBeaten.includes(b));
    if (!pool.length) pool = ['act1-boss'];
  } else if (act === 3) {
    pool = ['act3-boss'];
  } else if (act === 4) {
    pool = ['act4-boss'];
  } else {
    pool = ['final-boss'];
  }
  return pool[Math.floor(state.rng() * pool.length)];
}

export function backToMap() {
  state.screen = 'map';
  state.reward = null;
  state.event = null;
  state.shop = null;
  state.rest = null;
  state.treasure = null;
  state.pendingEnchant = null;
  state.overlays = emptyOverlays();
  state.previewCardUid = null;
}

export function newCombat(encounterId = 'act1-basic', sourceKind = 'monster') {
  state.player = {
    id: 'player', name: 'You',
    hp: state.run.hp, maxHp: state.run.maxHp,
    block: 0,
    statuses: {},
    nextTurnEnergy: 0,
    perTurnStatuses: [],
    perTurnHooks: [],
  };
  state.combatKind = sourceKind;
  state.lastEncounterId = encounterId;

  state.combatBanner = bannerForCombat(sourceKind, state.rng);

  const scale = actScaling(state.run.act);
  const ids = ENCOUNTERS[encounterId];
  state.enemies = ids.map((id, i) => {
    const def = getEnemyDef(id);
    const cardDraw = shuffle(def.deck.map(makeEnemyCard), state.rng);
    const scaledHp = Math.ceil(def.hp * scale.hp);
    return {
      ...def,
      uid: `e${i}`,
      hp: scaledHp,
      maxHp: scaledHp,
      damageScale: scale.damage,
      block: 0,
      statuses: {},
      cardDraw,
      cardDiscard: [],
      intentCard: null,
      loreTriggered: {},
    };
  });

  state.drawPile = shuffle(
    state.run.deck.map(entry => makeCard(entry.defId, entry.enchant)),
    state.rng,
  );
  state.hand = [];
  state.discardPile = [];
  state.exhaustPile = [];
  state.maxEnergy = 3;
  state.turn = 'player';
  state.over = false;
  state.result = null;
  state.pendingCardUid = null;
  state.previewCardUid = null;
  state.newlyDrawn = new Set();
  state.lastHits = [];
  state.currentAnimation = null;
  state.bossLore = null;
  state.selectedEnemyId = state.enemies[0]?.uid ?? null;
  state.log = [];
  state.overlays = emptyOverlays();

  forEachRelic('combatStart', (r) => {
    if (r.block)  state.player.block += r.block;
    if (r.heal)   state.player.hp = Math.min(state.player.maxHp, state.player.hp + r.heal);
    if (r.strength) {
      state.player.statuses.strength = (state.player.statuses.strength || 0) + r.strength;
    }
  });
  forEachRelic('firstTurn', (r) => {
    if (r.energy) state.player.nextTurnEnergy += r.energy;
  });

  for (const e of state.enemies) {
    if (e.isBoss) {
      showBossLore(e.id, 'start');
      e.loreTriggered.start = true;
    }
  }

  for (const e of state.enemies) rollIntent(e);
  startPlayerTurn(true);
  pushLog('Combat start.');
  state.screen = 'combat';
}

export function endCombat(win) {
  state.run.hp = state.player.hp;

  if (win) {
    forEachRelic('combatEnd', (r) => {
      if (r.heal) state.run.hp = Math.min(state.run.maxHp, state.run.hp + r.heal);
    });

    for (const e of state.enemies) {
      if (e.isBoss && !e.loreTriggered.onDeath) {
        showBossLore(e.id, 'onDeath');
        e.loreTriggered.onDeath = true;
      }
    }
  } else {
    for (const e of state.enemies) {
      if (e.isBoss && !e.loreTriggered.onPlayerDeath) {
        showBossLore(e.id, 'onPlayerDeath');
        e.loreTriggered.onPlayerDeath = true;
      }
    }
    state.deathPage = 0;
  }

  state.over = true;
  state.result = win ? 'win' : 'loss';
  state.turn = 'over';
  state.previewCardUid = null;

  if (win) {
    const kind = state.combatKind || 'monster';

    if (kind === 'boss') {
      const lastEncounter = state.lastEncounterId;
      if (lastEncounter) state.run.bossesBeaten.push(lastEncounter);
      state.run.cleared = true;
      if (lastEncounter === 'final-boss') {
        state.run.victory = true;
      }
      return;
    }

    let coins = rollCoins(state.rng, kind);
    forEachRelic('onGoldGain', (r) => {
      if (r.doubleChance && state.rng() < r.doubleChance) {
        coins *= 2;
        pushLog('Coin Purse: doubled gold!');
      }
    });

    const cards = rollCardChoices(state.rng, 3);
    state.reward = { coins, cards, taken: false };
  }
}

export function nextAct() {
  const healAmount = Math.floor(state.run.maxHp * 0.3);
  const hpBefore = state.run.hp;
  state.run.hp = Math.min(state.run.maxHp, state.run.hp + healAmount);
  const healed = state.run.hp - hpBefore;
  pushLog(`Act cleared. Healed ${healed} HP (30% of max).`);

  state.run.act += 1;
  state.run.cleared = false;
  state.run.map = generateMap(state.rng);
  state.run.currentNodeId = null;
  state.run.floor = -1;
  state.actReward = rollActTransition(state.rng, state.run.relics);
  state.actReward.healAmount = healed;
  state.screen = 'actReward';
}

export function takeActRewardCard(defId) {
  if (!state.actReward || state.actReward.cardTaken) return;
  state.run.deck.push(makeDeckEntry(defId));
  state.actReward.cardTaken = true;
}

export function skipActRewardCard() {
  if (!state.actReward) return;
  state.actReward.cardTaken = true;
}

export function takeActRewardRelic(relicId) {
  if (!state.actReward || state.actReward.relicTaken) return;
  state.run.relics.push(relicId);
  state.run.relic = state.run.relic || relicId;
  state.actReward.relicTaken = relicId;
}

export function claimActReward() {
  if (!state.actReward) return;
  state.run.gold += state.actReward.coins;
  pushLog(`Act ${state.run.act}: +${state.actReward.coins} gold.`);
  state.actReward = null;
  state.screen = 'map';
}

export function finishRun() {
  clearSave();
  state.screen = 'victory';
}

export function returnToMainMenu() {
  clearSave();
  state.screen = 'mainMenu';
  state.run = null;
  state.combat = null;
  state.player = null;
  state.enemies = [];
  state.bossLore = null;
  state.deathPage = 0;
}

export function rollIntent(enemy) {
  const card = drawEnemyCard(enemy, state.rng);
  enemy.intentCard = card;
}

export function startPlayerTurn(isFirstTurn = false) {
  state.turn = 'player';
  state.previewCardUid = null;
  for (const c of state.hand) delete c.disabledThisTurn;
  if (!isFirstTurn) {
    let keepPercent = 0;
    let keepMax = 999;
    forEachRelic('onTurnEnd', (r) => {
      if (r.keepBlockPercent) {
        keepPercent = Math.max(keepPercent, r.keepBlockPercent);
        keepMax = Math.min(keepMax, r.keepBlockMax ?? 999);
      }
    });
    if (keepPercent > 0) {
      state.player.block = Math.min(keepMax, Math.floor(state.player.block * keepPercent));
    } else {
      state.player.block = 0;
    }
  }
  state.energy = state.maxEnergy + (state.player.nextTurnEnergy || 0);
  state.player.nextTurnEnergy = 0;
  draw(state, 5);
  pushLog(`--- Your turn (${state.energy} energy) ---`);
}

export function livingEnemies() {
  return state.enemies.filter(e => e.hp > 0);
}

export function claimReward() {
  if (!state.reward) return;
  state.run.gold += state.reward.coins;
  pushLog(`+${state.reward.coins} gold.`);
  state.reward = null;
  backToMap();
}

export function takeRewardCard(defId) {
  if (!state.reward || state.reward.taken) return;
  state.run.deck.push(makeDeckEntry(defId));
  state.reward.taken = true;
  pushLog(`Added ${CARDS[defId].name} to your deck.`);
}

export function skipRewardCard() {
  if (!state.reward) return;
  state.reward.taken = true;
}

export function pickEventChoice(index) {
  if (!state.event) return;
  const ev = state.event.data;
  const choice = ev.choices[index];
  if (!choice) return;
  for (const eff of choice.effects) applyMetaEffect(eff);
  pushLog(`Event: ${ev.name} → ${choice.label}`);
  backToMap();
}

function applyMetaEffect(eff) {
  if (eff.kind === 'heal') {
    state.run.hp = Math.min(state.run.maxHp, state.run.hp + eff.amount);
  } else if (eff.kind === 'gold') {
    state.run.gold = Math.max(0, state.run.gold + eff.amount);
  } else if (eff.kind === 'damageSelf') {
    state.run.hp = Math.max(1, state.run.hp - eff.amount);
  } else if (eff.kind === 'grantRandomCard') {
    const [id] = rollCardChoices(state.rng, 1);
    if (id) state.run.deck.push(makeDeckEntry(id));
  }
}

export function buyShopCard(index) {
  if (!state.shop) return;
  const item = state.shop.items[index];
  if (!item) return;
  if (state.run.gold < item.price) return;
  state.run.gold -= item.price;
  state.run.deck.push(makeDeckEntry(item.defId));
  state.shop.items.splice(index, 1);
  pushLog(`Bought ${CARDS[item.defId].name} for ${item.price} gold.`);
}

export function buyShopHeal() {
  if (!state.shop) return;
  if (state.run.gold < state.shop.healPrice) return;
  state.run.gold -= state.shop.healPrice;
  state.run.hp = Math.min(state.run.maxHp, state.run.hp + 25);
  pushLog('Healed 25 HP.');
}

export function restHeal() {
  const amount = Math.floor(state.run.maxHp * 0.3);
  state.run.hp = Math.min(state.run.maxHp, state.run.hp + amount);
  pushLog(`Rested, healed ${amount}.`);
  backToMap();
}

export function restEnchantStart() {
  const eligible = state.run.deck
    .map((entry, i) => entry.enchant ? -1 : i)
    .filter(i => i >= 0);

  if (eligible.length === 0) {
    pushLog('No enchantable cards in deck.');
    backToMap();
    return;
  }

  const enchant = rollEnchant(state.rng);
  state.pendingEnchant = {
    enchantId: enchant.id,
    eligibleIndices: eligible,
  };
  state.screen = 'enchantPick';
}

export function applyEnchant(index) {
  if (!state.pendingEnchant) return;
  if (!state.pendingEnchant.eligibleIndices.includes(index)) return;
  const entry = state.run.deck[index];
  if (!entry || entry.enchant) return;

  entry.enchant = state.pendingEnchant.enchantId;
  const enchant = getEnchant(state.pendingEnchant.enchantId);
  pushLog(`Enchanted ${CARDS[entry.defId].name} with ${enchant.name}.`);
  state.pendingEnchant = null;
  backToMap();
}

export function skipEnchant() {
  if (!state.pendingEnchant) return;
  state.pendingEnchant = null;
  backToMap();
}

export function debugFightDungeonCore() {
  newCombat('final-boss', 'boss');
}
export function debugFightFallenDrawn() {
  newCombat('act3-boss', 'boss');
}
export function debugFightWarden() {
  newCombat('act4-boss', 'boss');
}
