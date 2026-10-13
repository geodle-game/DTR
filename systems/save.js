// ============================================================
// systems/save.js
// localStorage-backed save/load with sanitization + integrity checks.
// ============================================================

import { makeRng } from './deck.js';
import { CARDS } from '../data/cards.js';
import { RELICS } from '../data/relics.js';

const SAVE_KEY = 'drawnToRuin.save';
const SAVE_VERSION = 6;   // v6: bumped act cap, veil fields, veilDoor screen
const MIGRATABLE_VERSIONS = new Set([5]);

const SAFE_SCREENS = new Set([
  'map', 'shop', 'rest', 'event', 'treasure', 'reward',
  'actReward', 'enchantPick', 'deckView', 'relicPick',
  'veilDoor',
]);

const MAX_STAT = 9999;
const MAX_GOLD = 999999;
const MAX_ENERGY = 99;
const MAX_STATUS = 999;
const MAX_DECK_SIZE = 200;
const MAX_RELIC_COUNT = 50;
const MAX_GRANT_USED_KEYS = 500;
// MC2 has 15 acts, veil adds 3 (tracked via veilAct, not act).
// Act is capped well above 15 to survive future expansion, but
// never at 5 — that was the original bug.
const MAX_ACT = 30;
const MAX_FLOOR = 40;
const MAX_FRAGMENTS = 15;

let lastSavedJson = null;

// ------------------------------------------------------------
// Sanitization helpers
// ------------------------------------------------------------

function clampInt(v, min, max, fallback = min) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

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
    id: clampInt(raw.id, 0, 3, 0),
    name: typeof raw.name === 'string' ? raw.name.slice(0, 32) : 'Player',
    classId: typeof raw.classId === 'string' ? raw.classId : null,
    isAlly: !!raw.isAlly,
    portrait: typeof raw.portrait === 'string' ? raw.portrait : null,
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
    // Ally bookkeeping (only meaningful if isAlly).
    points: clampInt(raw.points, 0, MAX_STAT, 0),
    upgrades: (raw.upgrades && typeof raw.upgrades === 'object')
      ? { ...raw.upgrades }
      : {},
  };
}

// ------------------------------------------------------------
// Run sanitization
// ------------------------------------------------------------
// This is what was broken before. The act clamp was hardcoded to
// 5, which silently reset any MC2 save past Act 5. Floor clamp
// is generous enough for MC2 (16 floors) and veil (9 floors).
//
// Veil fields are top-level on run (not a mode) so they need
// explicit defaults. Full memory and sparedResearcher determine
// whether the veil door is open.
// ------------------------------------------------------------
export function sanitizeRun(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const run = { ...raw };

  run.act = clampInt(run.act, 1, MAX_ACT, 1);
  run.realAct = clampInt(run.realAct ?? run.act, 1, MAX_ACT, run.act);
  run.actsTotal = clampInt(run.actsTotal, 1, MAX_ACT, 15);
  run.floor = clampInt(run.floor, -1, MAX_FLOOR, -1);

  run.fragmentsCollected = clampInt(run.fragmentsCollected, 0, MAX_FRAGMENTS, 1);
  run.fullMemory = !!run.fullMemory;
  run.recallUnlocked = !!run.recallUnlocked;
  run.researcherFight = !!run.researcherFight;
  run.pendingActRestart = !!run.pendingActRestart;
  run.sparedResearcher = !!run.sparedResearcher;
  run.cleared = !!run.cleared;
  run.victory = !!run.victory;

  // Veil path fields. Defaults are safe: inactive, act 1, 3 acts.
  run.veilActive = !!run.veilActive;
  run.veilAct = clampInt(run.veilAct, 1, 3, 1);
  run.veilActsTotal = clampInt(run.veilActsTotal, 1, 3, 3);

  if (!Array.isArray(run.bossesBeaten)) run.bossesBeaten = [];
  if (!run.exploredMaps || typeof run.exploredMaps !== 'object') {
    run.exploredMaps = {};
  }
  if (!run._grantUsed || typeof run._grantUsed !== 'object') {
    run._grantUsed = {};
  }

  if (run.phase !== null && typeof run.phase !== 'string') {
    run.phase = null;
  }

  return run;
}

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
    pendingConfirm: state.pendingConfirm,
    reward: state.reward,
    shop: state.shop,
    rest: state.rest,
    event: state.event,
    treasure: state.treasure,
    actReward: state.actReward,
    pendingEnchant: state.pendingEnchant,
    localSlot: state.localSlot,
    spareSequence: state.spareSequence,
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

// ------------------------------------------------------------
// Migration — v5 → v6
// ------------------------------------------------------------
// v5 saves are structurally compatible except for the veil
// fields. Add defaults so the run loads cleanly.
// ------------------------------------------------------------
function migrateSave(data) {
  if (!data || typeof data !== 'object') return data;
  if (data.version === 5) {
    if (data.run && typeof data.run === 'object') {
      if (data.run.veilActive === undefined) data.run.veilActive = false;
      if (data.run.veilAct === undefined) data.run.veilAct = 1;
      if (data.run.veilActsTotal === undefined) data.run.veilActsTotal = 3;
    }
    data.version = SAVE_VERSION;
  }
  return data;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    let data = JSON.parse(raw);
    if (data.version !== SAVE_VERSION) {
      if (MIGRATABLE_VERSIONS.has(data.version)) {
        data = migrateSave(data);
      } else {
        localStorage.removeItem(SAVE_KEY);
        return null;
      }
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

  state.run = sanitizeRun(save.run) || {};

  state.players = Array.isArray(save.players)
    ? save.players.map(sanitizePlayer).filter(Boolean).slice(0, 3)
    : [];

  state.metaFocusIndex = save.metaFocusIndex ?? 0;
  state.activePlayerIndex = save.activePlayerIndex ?? state.metaFocusIndex;
  state.combatActivePlayers = Array.isArray(save.combatActivePlayers)
    ? save.combatActivePlayers.slice(0, 3)
    : [];
  state.endedTurn = Array.isArray(save.endedTurn) ? save.endedTurn.slice(0, 3) : [];
  state.localSlot = save.localSlot ?? null;

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
  state.pendingConfirm = save.pendingConfirm ?? null;

  state.reward = save.reward ?? null;
  state.shop = save.shop ?? null;
  state.rest = save.rest ?? null;
  state.event = save.event ?? null;
  state.treasure = save.treasure ?? null;
  state.actReward = save.actReward ?? null;
  state.pendingEnchant = save.pendingEnchant ?? null;
  state.spareSequence = save.spareSequence ?? null;

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

  checkIntegrity(state);
}
