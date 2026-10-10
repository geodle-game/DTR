// ============================================================
// data/cardVisuals.js
// Maps a card's defId and rarity to a visual frame SVG.
// Presentation-only — no gameplay logic here.
//
// The "kind" of a card is decided by its effects, not its
// `type` field. A card that deals damage and applies Vulnerable
// is still an "attack" — the status is a rider, not the core
// mechanic. This matches the flourish icon system so card
// fronts and card play effects use the same visual language.
//
// Rarities are remapped to three visual tiers:
//   starter  → common
//   common   → common
//   uncommon → rare
//   rare     → epic
//   status   → epic
// ============================================================

import { CARDS } from './cards.js';

const DAMAGE_KINDS = new Set([
  'damage',
  'damageRandom',
  'damageEqualToBlock',
  'damagePercentMaxHp',
  'perfectedStrike',
  'rampage',
  'finisher',
  'lastStand',
  'reaper',
  'fiendFire',
  'necromancersPact',
  'graveRobber',
]);

const DEBUFF_STATUSES = new Set(['weak', 'vulnerable']);

export function cardVisualKind(defId) {
  const def = CARDS[defId];
  if (!def) return 'attack';

  // Type field wins for spell and power — those are structurally
  // different from the effect-based kinds.
  if (def.type === 'spell') return 'spell';
  if (def.type === 'power') return 'power';

  const effects = def.effects || [];
  const hasDamage = effects.some(e => DAMAGE_KINDS.has(e.kind));
  const hasBlock  = effects.some(e => e.kind === 'block');
  const hasHeal   = effects.some(e => e.kind === 'heal' || e.kind === 'feed');
  const hasDraw   = effects.some(e => e.kind === 'draw');
  const hasEnergy = effects.some(e =>
    e.kind === 'gainEnergy' || e.kind === 'gainEnergyNextTurn'
  );
  const hasDebuff = effects.some(e =>
    e.kind === 'applyStatus' && DEBUFF_STATUSES.has(e.status)
  );

  if (hasDamage && hasBlock) return 'hybrid';
  if (hasDamage) return 'attack';
  if (hasHeal)   return 'heal';
  if (hasBlock)  return 'block';
  if (hasDebuff) return 'debuff';
  if (hasDraw)   return 'draw';
  if (hasEnergy) return 'energy';

  // Fallback for cards with no recognizable effect.
  return 'attack';
}

export function cardVisualRarity(rarity) {
  switch (rarity) {
    case 'starter':  return 'common';
    case 'common':   return 'common';
    case 'uncommon': return 'rare';
    case 'rare':     return 'epic';
    case 'status':   return 'epic';
    default:         return 'common';
  }
}

export function cardFramePath(defId, rarity) {
  const kind = cardVisualKind(defId);
  const tier = cardVisualRarity(rarity);
  return `assets/cards/${kind}_${tier}_front.svg`;
}

export const CARD_BACK_PATH = 'assets/cards/asterai_card_back.svg';
