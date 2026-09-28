// ============================================================
// systems/deckGuard.js
//
// Single funnel for adding cards to the player's permanent deck.
// Every legitimate card-granting source must set state.run.phase
// to a whitelisted value before calling grantCard. Any push that
// happens outside that window is rejected and logged.
// ============================================================

import { state } from './state.js';

// Phases during which adding a card to the deck is legal.
// Every other phase silently rejects.
const ALLOWED_PHASES = new Set([
  'reward',      // post-combat card reward
  'actReward',   // act transition card reward
  'shop',        // shop purchase
  'event',       // event reward (e.g. grantRandomCard)
]);

// Debug log of every grant attempt. Capped at 50 entries.
const grantLog = [];

export function grantCard(defId, source = 'unknown') {
  const run = state.run;
  const player = state.players?.[0];

  if (!run || !player) {
    console.warn(`[deckGuard] REJECTED ${defId} (source: ${source}) — no active run.`);
    return false;
  }

  const phase = run.phase || run.currentPhase || null;
  if (!ALLOWED_PHASES.has(phase)) {
    console.warn(
      `[deckGuard] REJECTED ${defId} (source: ${source}) — ` +
      `phase is "${phase}", not one of ${[...ALLOWED_PHASES].join(', ')}.`
    );
    pushGrantLog({ defId, source, phase, allowed: false });
    return false;
  }

  player.deck.push({ defId, enchant: null });
  pushGrantLog({ defId, source, phase, allowed: true });
  return true;
}

function pushGrantLog(entry) {
  grantLog.push({ ...entry, at: Date.now() });
  if (grantLog.length > 50) grantLog.shift();
}

export function getGrantLog() {
  return grantLog.slice();
}
