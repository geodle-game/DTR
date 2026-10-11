// ============================================================
// systems/ally-ai.js
// Drives the researcher ally during combat.
//
// The ally is state.players[N] where players[N].isAlly === true.
// He plays one card per PLAY_INTERVAL_MS until no card scores
// above zero, then marks his turn ended via the dispatcher.
//
// Decision logic: depth-1 min-max. For each playable card, predict
// the resulting score and pick the highest. No lookahead — the
// scoring function is heuristic, not a full simulation.
// ============================================================

import { state, beginPlayerEndTurn, beginEnemyTurn, resolveEnemyTurn } from './state.js';
import { dispatch } from './dispatch.js';
import { CARDS } from '../data/cards.js';
import { canPlay, costOf } from './combat.js';

const TICK_MS = 120;
const PLAY_INTERVAL_MS = 1000;

let tickHandle = null;
let lastPlayAt = 0;
let lastTurnId = -1;

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

export function startAllyAI() {
  if (tickHandle) return;
  tickHandle = setInterval(tick, TICK_MS);
}

export function stopAllyAI() {
  if (!tickHandle) return;
  clearInterval(tickHandle);
  tickHandle = null;
}

// Called by state.js on every new player turn so the AI waits a
// beat before acting.
export function resetAllyTimer() {
  lastPlayAt = performance.now();
  lastTurnId = state.turnId ?? -1;
}

// ------------------------------------------------------------
// Tick
// ------------------------------------------------------------

function tick() {
  if (!state.run) return;
  if (state.screen !== 'combat') return;
  if (state.over) return;
  if (state.turn !== 'player') return;

  const ally = findAlly();
  if (!ally) return;

  if (ally.hp <= 0) {
    if (!ally.endedTurn) ally.endedTurn = true;
    return;
  }
  if (ally.endedTurn) return;

  // Turn change detection: reset the play timer when state.turnId
  // increments so the ally doesn't fire instantly on turn start.
  if (state.turnId !== lastTurnId) {
    lastTurnId = state.turnId;
    lastPlayAt = performance.now();
    return;
  }

  const now = performance.now();
  if (now - lastPlayAt < PLAY_INTERVAL_MS) return;

  const card = chooseBestCard(ally);
  if (!card) {
    dispatch({ type: 'ALLY_END_TURN', actorId: ally.id, isAlly: true });
    return;
  }

  lastPlayAt = now;
  dispatch({
    type: 'PLAY_CARD',
    cardUid: card.uid,
    targetUid: null,
    actorId: ally.id,
    isAlly: true,
  });
}

// ------------------------------------------------------------
// Card choice
// ------------------------------------------------------------

function findAlly() {
  return state.players.find(p => p.isAlly) || null;
}

function chooseBestCard(ally) {
  const hand = ally.hand || [];
  if (!hand.length) return null;

  let best = null;
  let bestScore = 0;

  for (const card of hand) {
    if (!canPlay(card, ally)) continue;
    const score = scoreCard(card, ally);
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }

  return best;
}

function scoreCard(card, ally) {
  const def = CARDS[card.defId];
  if (!def) return 0;

  const cost = costOf(card, ally);
  const livingEnemies = state.enemies.filter(e => e.hp > 0);
  const targets = resolveScoringTargets(def.target, ally, livingEnemies);

  let score = 0;
  for (const eff of def.effects) {
    score += scoreEffect(eff, ally, targets);
  }

  // Small penalty for spending energy so the AI prefers efficient
  // plays when scores are close.
  score -= cost * 0.05;

  return score;
}

function resolveScoringTargets(targetKind, source, livingEnemies) {
  if (targetKind === 'self' || targetKind === 'none') return [source];
  if (targetKind === 'all-enemies') return livingEnemies;
  if (targetKind === 'random-enemy') {
    if (!livingEnemies.length) return [];
    return [livingEnemies[0]];
  }
  // Single-enemy target. For scoring purposes, assume the highest-HP
  // enemy is the target. Actual play leaves targeting to combat.js
  // which uses selectedEnemyId.
  if (!livingEnemies.length) return [];
  return [livingEnemies.reduce((a, b) => (a.hp > b.hp ? a : b))];
}

function scoreEffect(eff, source, targets) {
  switch (eff.kind) {
    case 'damage': {
      let s = 0;
      for (const t of targets) {
        const predicted = predictDamage(source, t, eff.amount);
        const useful = Math.min(predicted, t.hp + t.block);
        s += useful;
      }
      return s;
    }

    case 'damageRandom': {
      const pool = state.enemies.filter(e => e.hp > 0);
      if (!pool.length) return 0;
      const avg = pool.reduce((a, e) => a + e.hp, 0) / pool.length;
      return Math.min(eff.amount, avg);
    }

    case 'block':
      return eff.amount * 0.8;

    case 'heal': {
      const missing = source.maxHp - source.hp;
      return Math.min(eff.amount, missing) * 1.0;
    }

    case 'healAll': {
      let s = 0;
      for (const p of state.players) {
        if (p.hp <= 0) continue;
        const missing = p.maxHp - p.hp;
        s += Math.min(eff.amount, missing) * 1.0;
      }
      return s;
    }

    case 'draw':
      return eff.amount * 0.4;

    case 'applyStatus': {
      if (eff.status === 'weak' || eff.status === 'vulnerable') {
        return targets.length * eff.amount * 0.5;
      }
      if (eff.status === 'strength' || eff.status === 'focus') {
        return eff.amount * 0.7;
      }
      return 0;
    }

    case 'giveEnergy':
      return eff.amount * 0.5;

    case 'clearDebuffs': {
      let s = 0;
      for (const st of eff.statuses || []) {
        const have = source.statuses?.[st] || 0;
        s += Math.min(have, eff.amount ?? 1) * 0.6;
      }
      return s;
    }

    default:
      return 0.1;
  }
}

function predictDamage(source, target, base) {
  const scale = source.damageScale ?? 1;
  const flat = source.statuses?.strength || 0;
  let d = base * scale + flat;
  if (source.statuses?.weak) d *= 0.75;
  if (target.statuses?.vulnerable) d *= 1.5;
  return Math.floor(d);
}
