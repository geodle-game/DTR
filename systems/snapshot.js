// ============================================================
// systems/snapshot.js
// ============================================================

import { state } from './state.js';

export function snapshotState() {
  return {
    run: state.run,
    players: state.players,
    activePlayerIndex: state.activePlayerIndex,
    enemies: state.enemies,
    turn: state.turn,
    over: state.over,
    result: state.result,
    screen: state.screen,
    combatKind: state.combatKind,
    combatBanner: state.combatBanner,
    lastEncounterId: state.lastEncounterId,
    reward: state.reward,
    actReward: state.actReward,
    treasure: state.treasure,
    event: state.event,
    shop: state.shop,
    rest: state.rest,
    pendingEnchant: state.pendingEnchant,
    bossLore: state.bossLore,
    lastHits: state.lastHits,
  };
}

export function restoreSnapshot(s) {
  state.run = s.run;
  state.players = s.players || [];
  state.activePlayerIndex = s.activePlayerIndex ?? 0;
  state.enemies = s.enemies || [];
  state.turn = s.turn ?? 'player';
  state.over = s.over ?? false;
  state.result = s.result ?? null;
  state.screen = s.screen ?? 'map';
  state.combatKind = s.combatKind ?? 'monster';
  state.combatBanner = s.combatBanner ?? null;
  state.lastEncounterId = s.lastEncounterId ?? null;
  state.reward = s.reward ?? null;
  state.actReward = s.actReward ?? null;
  state.treasure = s.treasure ?? null;
  state.event = s.event ?? null;
  state.shop = s.shop ?? null;
  state.rest = s.rest ?? null;
  state.pendingEnchant = s.pendingEnchant ?? null;
  state.bossLore = s.bossLore ?? null;
  state.lastHits = s.lastHits || [];

  // Reset pure-UI fields.
  state.newlyDrawn = new Set();
  state.overlays = { deck: false, relics: false, draw: false, discard: false, exhaust: false };
  state.previewCardUid = null;
  state.currentAnimation = null;
  state.pendingCardUid = null;
  state.selectedEnemyId = null;
}
