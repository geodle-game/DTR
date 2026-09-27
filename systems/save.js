// ============================================================
// systems/save.js
// localStorage-backed save/load.
// ============================================================

import { makeRng } from './deck.js';

const SAVE_KEY = 'drawnToRuin.save';
const SAVE_VERSION = 1;

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
  state.relicChoices = save.relicChoices || [];

  state.reward = save.reward ?? null;
  state.shop = save.shop ?? null;
  state.rest = save.rest ?? null;
  state.event = save.event ?? null;
  state.treasure = save.treasure ?? null;
  state.actReward = save.actReward ?? null;
  state.pendingEnchant = save.pendingEnchant ?? null;

  state.player = null;
  state.enemies = [];
  state.hand = [];
  state.drawPile = [];
  state.discardPile = [];
  state.exhaustPile = [];
  state.energy = 0;
  state.maxEnergy = 3;
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
