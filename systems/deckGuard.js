// ============================================================
// systems/deckGuard.js
//
// Single funnel for adding cards to the player's permanent deck.
// Every legitimate card-granting source must go through grantCard.
// Raw state.players[0].deck.push(...) should never appear in
// gameplay code — if it does, that's the bug.
//
// Guards:
//   1. Phase check  — only reward/actReward/shop/event phases allow grants.
//   2. Per-item sold flag — shop purchases are one-shot per item.
//   3. One-shot flags — reward and act reward grants fire once per source.
//   4. Grant log — every attempt is recorded for post-mortem.
// ============================================================

import { state } from './state.js';

const ALLOWED_PHASES = new Set([
  'reward',
  'actReward',
  'shop',
  'event',
]);

const grantLog = [];

function pushGrantLog(entry) {
  grantLog.push({ ...entry, at: Date.now() });
  if (grantLog.length > 100) grantLog.shift();
}

export function grantCard(defId, source = 'unknown', opts = {}) {
  const run = state.run;
  const player = state.players?.[0];

  if (!run || !player) {
    console.warn(`[deckGuard] REJECTED ${defId} (source: ${source}) — no active run.`);
    pushGrantLog({ defId, source, phase: null, allowed: false, reason: 'no-run' });
    return false;
  }

  const phase = run.phase || null;
  if (!ALLOWED_PHASES.has(phase)) {
    console.warn(
      `[deckGuard] REJECTED ${defId} (source: ${source}) — ` +
      `phase is "${phase}", not one of ${[...ALLOWED_PHASES].join(', ')}.`
    );
    pushGrantLog({ defId, source, phase, allowed: false, reason: 'wrong-phase' });
    return false;
  }

  if (opts.once) {
    run._grantUsed = run._grantUsed || {};
    if (run._grantUsed[source]) {
      console.warn(`[deckGuard] REJECTED ${defId} — one-shot "${source}" already used.`);
      pushGrantLog({ defId, source, phase, allowed: false, reason: 'already-used' });
      return false;
    }
    run._grantUsed[source] = true;
  }

  player.deck.push({ defId, enchant: null });
  pushGrantLog({ defId, source, phase, allowed: true });
  return true;
}

export function resetGrantUsedFor(source) {
  if (state.run?._grantUsed) {
    delete state.run._grantUsed[source];
  }
}

export function getGrantLog() {
  return grantLog.slice();
}

// Exposed for console debugging.
if (typeof window !== 'undefined') {
  window.__grantLog = getGrantLog;
}
