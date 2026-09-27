// ============================================================
// systems/snapshot.js
// ============================================================

import { state } from './state.js';

export function snapshotState() {
  return {
    run: state.run,
    player: state.player,
    enemies: state.enemies,
    drawPile: state.drawPile,
    hand: state.hand,
    discardPile: state.discardPile,
    exhaustPile: state.exhaustPile,
    energy: state.energy,
    maxEnergy: state.maxEnergy,
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
  state.player = s.player;
  state.enemies = s.enemies || [];
  state.drawPile = s.drawPile || [];
  state.hand = s.hand || [];
  state.discardPile = s.discardPile || [];
  state.exhaustPile = s.exhaustPile || [];
  state.energy = s.energy ?? 0;
  state.maxEnergy = s.maxEnergy ?? 3;
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
}
