// ============================================================
// data/researcher-cards.js
// Cards exclusive to the researcher ally. Never added to the
// player's deck and never appear in shop or reward pools.
//
// Three new effect kinds used here:
//   clearDebuffs — remove N stacks of listed statuses from self
//   giveEnergy   — give N Energy to the other player
//   healAll      — heal every living player
//
// Combat.js handles all three under applyEffect.
// ============================================================

export const RESEARCHER_CARDS = {
  'recall-ally': {
    id: 'recall-ally', name: 'Recall', cost: 0, rarity: 'ally',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Draw 1.',
    effects: [{ kind: 'draw', amount: 1 }],
  },
  barrier: {
    id: 'barrier', name: 'Barrier', cost: 1, rarity: 'ally',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 5 Block.',
    effects: [{ kind: 'block', amount: 5 }],
  },
  restore: {
    id: 'restore', name: 'Restore', cost: 1, rarity: 'ally',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Heal 4 HP.',
    effects: [{ kind: 'heal', amount: 4 }],
  },
  'fragment-burst': {
    id: 'fragment-burst', name: 'Fragment Burst', cost: 1, rarity: 'ally',
    type: 'attack', target: 'all-enemies', destination: 'discard',
    animation: 'magic',
    text: 'Deal 4 damage to all enemies.',
    effects: [{ kind: 'damage', amount: 4 }],
  },
  'mend-script': {
    id: 'mend-script', name: 'Mend Script', cost: 1, rarity: 'ally',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Remove 1 Weak and 1 Vulnerable from yourself.',
    effects: [
      {
        kind: 'clearDebuffs',
        statuses: ['weak', 'vulnerable'],
        amount: 1,
      },
    ],
  },
  study: {
    id: 'study', name: 'Study', cost: 1, rarity: 'ally',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Draw 2.',
    effects: [{ kind: 'draw', amount: 2 }],
  },
  'slow-time': {
    id: 'slow-time', name: 'Slow Time', cost: 2, rarity: 'ally',
    type: 'skill', target: 'all-enemies', destination: 'discard',
    text: 'Apply 2 Weak to all enemies.',
    effects: [
      { kind: 'applyStatus', status: 'weak', amount: 2 },
    ],
  },
  'the-long-vigil': {
    id: 'the-long-vigil', name: 'The Long Vigil', cost: 2, rarity: 'ally',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 8 Block. Draw 1.',
    effects: [
      { kind: 'block', amount: 8 },
      { kind: 'draw', amount: 1 },
    ],
  },
  'researchers-gift': {
    id: 'researchers-gift', name: "Researcher's Gift", cost: 1, rarity: 'ally',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Give the player 1 Energy. Draw 1.',
    effects: [
      { kind: 'giveEnergy', amount: 1 },
      { kind: 'draw', amount: 1 },
    ],
  },
  reconstruction: {
    id: 'reconstruction', name: 'Reconstruction', cost: 2, rarity: 'ally',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Heal both allies 6 HP.',
    effects: [{ kind: 'healAll', amount: 6 }],
  },
};

export function getResearcherCard(defId) {
  return RESEARCHER_CARDS[defId] ?? null;
}

export function isResearcherCard(defId) {
  return defId in RESEARCHER_CARDS;
}

export function researcherDeckList() {
  return [
    'recall-ally',
    'barrier',
    'restore',
    'fragment-burst',
    'mend-script',
    'study',
    'slow-time',
    'the-long-vigil',
    'researchers-gift',
    'reconstruction',
  ];
}
