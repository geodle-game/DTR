// ============================================================
// systems/save.js
// localStorage-backed save/load.
// ============================================================

import { makeRng } from './deck.js';

const SAVE_KEY = 'drawnToRuin.save';
const SAVE_VERSION = 2;

const SAFE_SCREENS = new Set([
  'map', 'shop', 'rest', 'event', 'treasure', 'reward',
  'actReward', 'enchantPick', 'deckView', 'relicPick',
]);

let lastSavedJson = null;

function snapshot(state) {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    screen: state.screen,
    rngState: state.rng?.getState?.() ?? null,
    run: state.run,
    players: state.players,
    activePlayerIndex: state.activePlayerIndex,
    relicChoices: state.relicChoices,
    reward: state.reward,
    shop: state.shop,
    rest: state.rest,
    event: state.event,
    treasure: state.treasure,
    actReward: state.actReward,
    pendingEnchant: state.pendingEnchant,
  };
}

export function autoSave(state) {
  if (!state.run) return;
  if (!SAFE_SCREENS.has(state.screen)) return;
  try {
    const json = JSON.stringify(snapshot(state));
    if (json === lastSavedJson) return;
    lastSavedJson = json;
    localStorage.setItem(SAVE_KEY, json);
  } catch (e) {
    console.warn('Auto-save failed:', e);
  }
}

export function hasSave() {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== SAVE_VERSION) {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('Save load failed:', e);
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
  lastSavedJson = null;
}

export function restoreRun(state, save) {
  state.rng = makeRng(1);
  if (save.rngState != null) state.rng.setState(save.rngState);

  state.run = save.run;
  state.players = save.players || [];
  state.activePlayerIndex = save.activePlayerIndex ?? 0;

  // Re-install the back-compat getters on run since JSON parse stripped them.
  if (state.players[0]) {
    const p = state.players[0];
    Object.defineProperty(state.run, 'hp', {
      get() { return p.hp; }, set(v) { p.hp = v; }, configurable: true,
    });
    Object.defineProperty(state.run, 'maxHp', {
      get() { return p.maxHp; }, set(v) { p.maxHp = v; }, configurable: true,
    });
    Object.defineProperty(state.run, 'gold', {
      get() { return p.gold; }, set(v) { p.gold = v; }, configurable: true,
    });
    Object.defineProperty(state.run, 'relic', {
      get() { return p.relic; }, set(v) { p.relic = v; }, configurable: true,
    });
    Object.defineProperty(state.run, 'relics', {
      get() { return p.relics; }, set(v) { p.relics = v; }, configurable: true,
    });
    Object.defineProperty(state.run, 'deck', {
      get() { return p.deck; }, set(v) { p.deck = v; }, configurable: true,
    });
  }

  state.relicChoices = save.relicChoices || [];

  state.reward = save.reward ?? null;
  state.shop = save.shop ?? null;
  state.rest = save.rest ?? null;
  state.event = save.event ?? null;
  state.treasure = save.treasure ?? null;
  state.actReward = save.actReward ?? null;
  state.pendingEnchant = save.pendingEnchant ?? null;

  state.enemies = [];
  state.turn = 'player';
  state.over = false;
  state.result = null;
  state.selectedEnemyId = null;
  state.pendingCardUid = null;
  state.previewCardUid = null;
  state.newlyDrawn = new Set();
  state.lastHits = [];
  state.currentAnimation = null;
  state.bossLore = null;
  state.combatBanner = null;
  state.combatKind = 'monster';
  state.lastEncounterId = null;
  state.log = [];
  state.overlays = { deck: false, relics: false, draw: false, discard: false, exhaust: false };
  state.deathPage = 0;

  state.screen = save.screen || 'map';
}
