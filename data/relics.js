// Relic system.
// Each relic has a `trigger` string that determines when it fires.
//
// Triggers used:
//   'combatStart'    — at the start of combat (block, heal, strength)
//   'firstTurn'      — on the first player turn of combat (energy)
//   'combatEnd'      — after winning a combat (heal)
//   'passive'        — always active (damage modifiers, etc.)
//   'onBlockGain'    — whenever the player gains Block from a card
//   'onGainStrength' — whenever the player gains Strength
//   'onLoseHp'       — whenever the player loses HP
//   'onGoldGain'     — when combat reward gold is rolled
//   'onTurnEnd'      — at start of turn, before block resets

export const RELICS = {
  // ============================================================
  // COMMON
  // ============================================================
  'sharpened-edge': {
    id: 'sharpened-edge', name: 'Sharpened Edge',
    rarity: 'common',
    text: 'Deal 10% more damage to Vulnerable enemies.',
    trigger: 'passive',
    damageVsVulnerable: 1.10,
  },
  'leather-bracer': {
    id: 'leather-bracer', name: 'Leather Bracer',
    rarity: 'common',
    text: 'Whenever you play a card that grants Block, gain 1 additional Block.',
    trigger: 'onBlockGain',
    blockBonus: 1,
  },
  'coin-purse': {
    id: 'coin-purse', name: 'Coin Purse',
    rarity: 'common',
    text: '10% chance to earn double gold from combat rewards.',
    trigger: 'onGoldGain',
    doubleChance: 0.10,
  },
  'lucky-coin': {
    id: 'lucky-coin', name: 'Lucky Coin',
    rarity: 'common',
    text: 'Every time you lose HP, gain 2 gold.',
    trigger: 'onLoseHp',
    goldPerHp: 2,
  },
  'blood-vial': {
    id: 'blood-vial', name: 'Blood Vial',
    rarity: 'common',
    text: 'At the start of each combat, heal 3 HP.',
    trigger: 'combatStart',
    heal: 3,
  },

  // ============================================================
  // UNCOMMON
  // ============================================================
  'battle-focus': {
    id: 'battle-focus', name: 'Battle Focus',
    rarity: 'uncommon',
    text: 'Whenever you gain Strength, gain 1 Block.',
    trigger: 'onGainStrength',
    blockOnStrength: 1,
  },
  'bronze-scales': {
    id: 'bronze-scales', name: 'Bronze Scales',
    rarity: 'uncommon',
    text: 'At the start of your turn, keep 50% of your Block (max 7).',
    trigger: 'onTurnEnd',
    keepBlockPercent: 0.5,
    keepBlockMax: 7,
  },
  'vajra': {
    id: 'vajra', name: 'Vajra',
    rarity: 'uncommon',
    text: 'Start each combat with 1 Strength.',
    trigger: 'combatStart',
    strength: 1,
  },
  'iron-skin': {
    id: 'iron-skin', name: 'Iron Skin',
    rarity: 'uncommon',
    text: 'Start each combat with 6 Block.',
    trigger: 'combatStart',
    block: 6,
  },

  // ============================================================
  // RARE
  // ============================================================
  lantern: {
    id: 'lantern', name: 'Lantern',
    rarity: 'rare',
    text: 'Gain 1 extra Energy on your first turn each combat.',
    trigger: 'firstTurn',
    energy: 1,
  },
  anchor: {
    id: 'anchor', name: 'Anchor',
    rarity: 'rare',
    text: 'Start each combat with 10 Block.',
    trigger: 'combatStart',
    block: 10,
  },
};

// ------------------------------------------------------------
// Relic pool helpers
// ------------------------------------------------------------

export const TOTAL_RELIC_COUNT = Object.keys(RELICS).length;

// Gold granted to a player who already owns every relic in the
// game when a relic reward would otherwise be offered. Prevents
// the "empty relic row" soft-lock on treasure / act-reward
// screens.
export const RELIC_GOLD_FALLBACK = 75;

export function allRelicsOwned(playerRelics) {
  if (!Array.isArray(playerRelics)) return false;
  return playerRelics.length >= TOTAL_RELIC_COUNT;
}

// Weighted random relic choices. Rare relics appear less often.
//
// IMPORTANT: If `excluded` covers the entire relic pool, this
// returns an empty array. Callers MUST check for this and fall
// back to gold. See systems/state.js and ui/render.js.
export function rollRelicChoices(rng, excluded = [], count = 3) {
  const RARITY_WEIGHTS = { common: 60, uncommon: 30, rare: 10 };
  const pool = Object.values(RELICS).filter(r => !excluded.includes(r.id));
  const out = [];
  const remaining = pool.slice();

  for (let i = 0; i < count && remaining.length > 0; i++) {
    // Roll a rarity.
    const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let roll = rng() * totalWeight;
    let chosenRarity = 'common';
    for (const [r, w] of Object.entries(RARITY_WEIGHTS)) {
      roll -= w;
      if (roll <= 0) { chosenRarity = r; break; }
    }
    // Find candidates of that rarity; fall back to any if none.
    let candidates = remaining.filter(r => r.rarity === chosenRarity);
    if (candidates.length === 0) candidates = remaining;
    const pick = candidates[Math.floor(rng() * candidates.length)];
    out.push(pick.id);
    remaining.splice(remaining.indexOf(pick), 1);
  }
  return out;
}
