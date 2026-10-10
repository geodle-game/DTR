// Card enchants. Applied at rest sites to a single card instance.
// Each card can hold at most one enchant.
//
// Modifier fields apply during combat:
//   damageBonus — added to every 'damage' effect on the card
//   blockBonus  — added to every 'block' effect on the card
//   costDelta   — added to the card's cost (min 0)
//   onPlay      — a list of extra effects that fire once when the card resolves
//
// Note on target-relative enchants: Venomous and Weakening use the
// SAME target list as the base card. On an attack, that means the
// enemy. On a self-target card like Defend, that means the player.
// This is intentional — random enchants from event nodes can
// backfire, and that is part of the risk/reward of the event.

export const ENCHANTS = {
  // ============================================================
  // COMMON
  // ============================================================
  sharp: {
    id: 'sharp', name: 'Sharp', rarity: 'common',
    text: '+2 damage on this card.',
    damageBonus: 2,
  },
  reinforced: {
    id: 'reinforced', name: 'Reinforced', rarity: 'common',
    text: '+2 Block on this card.',
    blockBonus: 2,
  },
  warded: {
    id: 'warded', name: 'Warded', rarity: 'common',
    text: 'Gain 2 Block when played.',
    onPlay: [{ kind: 'block', amount: 2 }],
  },
  vital: {
    id: 'vital', name: 'Vital', rarity: 'common',
    text: 'Heal 2 when played.',
    onPlay: [{ kind: 'heal', amount: 2 }],
  },

  // ============================================================
  // UNCOMMON
  // ============================================================
  venomous: {
    id: 'venomous', name: 'Venomous', rarity: 'uncommon',
    text: 'Apply 1 Vulnerable to the card\'s target when played.',
    onPlay: [{ kind: 'applyStatus', status: 'vulnerable', amount: 1 }],
  },
  weakening: {
    id: 'weakening', name: 'Weakening', rarity: 'uncommon',
    text: 'Apply 1 Weak to the card\'s target when played.',
    onPlay: [{ kind: 'applyStatus', status: 'weak', amount: 1 }],
  },
  swift: {
    id: 'swift', name: 'Swift', rarity: 'uncommon',
    text: 'Draw 1 when played.',
    onPlay: [{ kind: 'draw', amount: 1 }],
  },
  efficient: {
    id: 'efficient', name: 'Efficient', rarity: 'uncommon',
    text: 'Costs 1 less.',
    costDelta: -1,
  },

  // ============================================================
  // RARE
  // ============================================================
  brutal: {
    id: 'brutal', name: 'Brutal', rarity: 'rare',
    text: '+5 damage on this card.',
    damageBonus: 5,
  },
  fortified: {
    id: 'fortified', name: 'Fortified', rarity: 'rare',
    text: '+5 Block on this card.',
    blockBonus: 5,
  },
  echoing: {
    id: 'echoing', name: 'Echoing', rarity: 'rare',
    text: 'Gain 1 Energy when played.',
    onPlay: [{ kind: 'gainEnergy', amount: 1 }],
  },
  blessed: {
    id: 'blessed', name: 'Blessed', rarity: 'rare',
    text: 'Heal 5 when played.',
    onPlay: [{ kind: 'heal', amount: 5 }],
  },
};

// Weighted random enchant roll. Common 60, Uncommon 30, Rare 10.
export function rollEnchant(rng) {
  const WEIGHTS = { common: 60, uncommon: 30, rare: 10 };
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  let r = rng() * total;
  let chosen = 'common';
  for (const [rarity, w] of Object.entries(WEIGHTS)) {
    r -= w;
    if (r <= 0) { chosen = rarity; break; }
  }
  const pool = Object.values(ENCHANTS).filter(e => e.rarity === chosen);
  return pool[Math.floor(rng() * pool.length)];
}

export function getEnchant(id) {
  return ENCHANTS[id] ?? null;
}
