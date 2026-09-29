// ============================================================
// systems/save.js
// localStorage-backed save/load with sanitization + integrity checks.
// ============================================================

import { makeRng } from './deck.js';
import { CARDS } from '../data/cards.js';
import { RELICS } from '../data/relics.js';

const SAVE_KEY = 'drawnToRuin.save';
const SAVE_VERSION = 4;   // bumped: sanitization on load

const SAFE_SCREENS = new Set([
  'map', 'shop', 'rest', 'event', 'treasure', 'reward',
  'actReward', 'enchantPick', 'deckView', 'relicPick',
]);

const MAX_STAT = 9999;         // hp / maxHp / block ceiling
const MAX_GOLD = 999999;
const MAX_ENERGY = 99;
const MAX_STATUS = 999;
const MAX_DECK_SIZE = 200;
const MAX_RELIC_COUNT = 50;
const MAX_GRANT_USED_KEYS = 500;

let lastSavedJson = null;

// ------------------------------------------------------------
// Sanitization helpers
// ------------------------------------------------------------

function clampInt(v, min, max, fallback = min) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Convert an arbitrary object into a legal player. Drops anything that
 * isn't a known card or relic id and clamps every numeric field.
 */
export function sanitizePlayer(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const knownCards = new Set(Object.keys(CARDS));
  const knownRelics = new Set(Object.keys(RELICS));

  const deck = Array.isArray(raw.deck)
    ? raw.deck
        .filter(e => e && typeof e.defId === 'string' && knownCards.has(e.defId))
        .slice(0, MAX_DECK_SIZE)
        .map(e => ({
          defId: e.defId,
          enchant: typeof e.enchant === 'string' ? e.enchant : null,
        }))
    : [];

  const relics = Array.isArray(raw.relics)
    ? raw.relics
        .filter(r => typeof r === 'string' && knownRelics.has(r))
        .slice(0, MAX_RELIC_COUNT)
    : [];

  const statuses = {};
  if (raw.statuses && typeof raw.statuses === 'object') {
    for (const [k, v] of Object.entries(raw.statuses)) {
      const n = clampInt(v, -MAX_STATUS, MAX_STATUS, 0);
      if (n !== 0) statuses[k] = n;
    }
  }

  return {
    id: clampInt(raw.id, 0, 1, 0),
    name: typeof raw.name === 'string' ? raw.name.slice(0, 32) : 'You',
    hp: clampInt(raw.hp, 1, MAX_STAT, 70),
    maxHp: clampInt(raw.maxHp, 1, MAX_STAT, 70),
    block: clampInt(raw.block, 0, MAX_STAT, 0),
    statuses,
    nextTurnEnergy: clampInt(raw.nextTurnEnergy, 0, MAX_ENERGY, 0),
    perTurnStatuses: [],
    perTurnHooks: [],
    drawPile: [], hand: [], discardPile: [], exhaustPile: [],
    energy: 0,
    maxEnergy: clampInt(raw.maxEnergy, 1, MAX_ENERGY, 3),
    gold: clampInt(raw.gold, 0, MAX_GOLD, 0),
    relic: relics[0] ?? null,
    relics,
    deck,
    endedTurn: false,
  };
}

/**
 * Live integrity check. Mutates the state in-place, clamping anything
 * that's out of range back to a sane value. Returns an array of
 * corrections made (empty = clean).
 *
 * Called from `newCombat` and `startPlayerTurn`, so any live tampering
 * — console edits, bookmarklets, corrupted network snapshots — gets
 * corrected on the very next turn, and the player sees a clamped value
 * rather than a game-ending one.
 */
export function checkIntegrity(state) {
  const warnings = [];
  if (!state || !Array.isArray(state.players)) return warnings;

  for (const p of state.players) {
    if (!p || typeof p !== 'object') continue;

    if (typeof p.hp !== 'number' || !Number.isFinite(p.hp) || p.hp > MAX_STAT) {
      p.hp = Math.min(MAX_STAT, Math.max(1, Math.floor(p.hp) || 1));
      warnings.push('hp clamped');
    }
    if (typeof p.maxHp !== 'number' || !Number.isFinite(p.maxHp) || p.maxHp > MAX_STAT) {
      p.maxHp = Math.min(MAX_STAT, Math.max(1, Math.floor(p.maxHp) || 1));
      warnings.push('maxHp clamped');
    }
    if (p.hp > p.maxHp) {
      p.hp = p.maxHp;
      warnings.push('hp > maxHp');
    }
    if (typeof p.block !== 'number' || !Number.isFinite(p.block) || p.block > MAX_STAT) {
      p.block = Math.min(MAX_STAT, Math.max(0, Math.floor(p.block) || 0));
      warnings.push('block clamped');
    }
    if (typeof p.gold !== 'number' || !Number.isFinite(p.gold) || p.gold > MAX_GOLD) {
      p.gold = Math.min(MAX_GOLD, Math.max(0, Math.floor(p.gold) || 0));
      warnings.push('gold clamped');
    }
    if (typeof p.energy !== 'number' || !Number.isFinite(p.energy) || p.energy > MAX_ENERGY) {
      p.energy = Math.min(MAX_ENERGY, Math.max(0, Math.floor(p.energy) || 0));
      warnings.push('energy clamped');
    }
    if (typeof p.maxEnergy !== 'number' || !Number.isFinite(p.maxEnergy) || p.maxEnergy > MAX_ENERGY) {
      p.maxEnergy = Math.min(MAX_ENERGY, Math.max(1, Math.floor(p.maxEnergy) || 1));
      warnings.push('maxEnergy clamped');
    }

    if (p.statuses && typeof p.statuses === 'object') {
      for (const [k, v] of Object.entries(p.statuses)) {
        const n = Number(v);
        if (!Number.isFinite(n) || Math.abs(n) > MAX_STATUS) {
          const clamped = Math.max(-MAX_STATUS, Math.min(MAX_STATUS, Math.floor(n) || 0));
          if (clamped === 0) delete p.statuses[k];
          else p.statuses[k] = clamped;
          warnings.push(`status ${k} clamped`);
        }
      }
    }

    // Reset transient per-combat flags that may have leaked in.
    if (typeof p.rupture === 'number' && (p.rupture > 20 || !Number.isFinite(p.rupture))) {
      p.rupture = 20;
      warnings.push('rupture clamped');
    }
    if (typeof p.juggernaut === 'number' && (p.juggernaut > 50 || !Number.isFinite(p.juggernaut))) {
      p.juggernaut = 50;
      warnings.push('juggernaut clamped');
    }
    if (typeof p.feelNoPain === 'number' && (p.feelNoPain > 50 || !Number.isFinite(p.feelNoPain))) {
      p.feelNoPain = 50;
      warnings.push('feelNoPain clamped');
    }
  }

  // Cap the run's grant-usage map so it can't grow unbounded.
  if (state.run && state.run._grantUsed && typeof state.run._grantUsed === 'object') {
    const keys = Object.keys(state.run._grantUsed);
    if (keys.length > MAX_GRANT_USED_KEYS) {
      state.run._grantUsed = {};
      warnings.push('grantUsed cleared');
    }
  }

  if (warnings.length) {
    console.warn('[integrity] tampering detected and corrected:', warnings);
  }
  return warnings;
}

// ------------------------------------------------------------
// Snapshot / autosave
// ------------------------------------------------------------

function snapshot(state) {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    screen: state.screen,
    rngState: state.rng?.getState?.() ?? null,
    run: state.run,
    players: state.players,
    metaFocusIndex: state.metaFocusIndex,
    activePlayerIndex: state.activePlayerIndex,
    combatActivePlayers: state.combatActivePlayers,
    endedTurn: state.endedTurn,
    relicChoices: state.relicChoices,
    pendingRelicPick: state.pendingRelicPick,
    reward: state.reward,
    shop: state.shop,
    rest: state.rest,
    event: state.event,
    treasure: state.treasure,
    actReward: state.actReward,
    pendingEnchant: state.pendingEnchant,
    localSlot: state.localSlot,
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
  try { return localStorage.getItem(SAVE_KEY) !== null; }
  catch { return false; }
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
  try { localStorage.removeItem(SAVE_KEY); } catch {}
  lastSavedJson = null;
}

// ------------------------------------------------------------
// Restore
// ------------------------------------------------------------

export function restoreRun(state, save) {
  state.rng = makeRng(1);
  if (save.rngState != null) state.rng.setState(save.rngState);

  state.run = save.run || {};
  state.run.act = clampInt(state.run.act, 1, 5, 1);
  state.run.floor = clampInt(state.run.floor, -1, 15, -1);

  state.players = Array.isArray(save.players)
    ? save.players.map(sanitizePlayer).filter(Boolean).slice(0, 2)
    : [];

  state.metaFocusIndex = save.metaFocusIndex ?? 0;
  state.activePlayerIndex = save.activePlayerIndex ?? state.metaFocusIndex;
  state.combatActivePlayers = Array.isArray(save.combatActivePlayers)
    ? save.combatActivePlayers.slice(0, 2)
    : [];
  state.endedTurn = Array.isArray(save.endedTurn) ? save.endedTurn.slice(0, 2) : [];
  state.localSlot = save.localSlot ?? null;

  // Back-compat getters on run (P0 only).
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
  state.pendingRelicPick = save.pendingRelicPick ?? null;

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

  // Final pass — catches anything the sanitizer missed.
  checkIntegrity(state);
}
