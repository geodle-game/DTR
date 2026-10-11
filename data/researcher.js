// ============================================================
// data/researcher.js
// The rescued researcher. Identity, starter deck, factory.
//
// The ally is mechanically state.players[1] with isAlly: true.
// All combat code paths already handle multiple players, so the
// only new logic is the AI driver (systems/ally-ai.js) and the
// points / upgrade bookkeeping.
// ============================================================

import { researcherDeckList } from './researcher-cards.js';

export const RESEARCHER_ALLY = {
  id: 'researcher',
  name: 'The Researcher',
  portrait: 'assets/characters/researcher.png',
  maxHp: 60,
  starterDeck: researcherDeckList(),
  // Flavor lines used by the AI ticker / his panel during combat.
  // Cycled through at 1 per turn.
  quips: [
    'Try the left flank.',
    'Give me a moment to think.',
    'The pattern is almost readable.',
    'This is what I have been waiting for.',
    'Steady. Steady.',
    'The Script is still there.',
    'Do not fall here.',
  ],
};

export function createResearcherPlayer() {
  return {
    id: 1,
    name: RESEARCHER_ALLY.name,
    classId: null,
    isAlly: true,
    portrait: RESEARCHER_ALLY.portrait,

    hp: RESEARCHER_ALLY.maxHp,
    maxHp: RESEARCHER_ALLY.maxHp,
    block: 0,
    statuses: {},
    nextTurnEnergy: 0,
    perTurnStatuses: [],
    perTurnHooks: [],

    drawPile: [],
    hand: [],
    discardPile: [],
    exhaustPile: [],

    energy: 0,
    maxEnergy: 3,

    gold: 0,
    relic: null,
    relics: [],

    deck: RESEARCHER_ALLY.starterDeck.map(defId => ({ defId, enchant: null })),

    endedTurn: false,

    // Ally-only bookkeeping.
    points: 0,
    // cardUid -> array of upgrade ids applied to that card.
    // Upgrades are 'sharpen' | 'fortify' | 'lighten' | 'refine'.
    upgrades: {},
  };
}

// Upgrade costs. Applied per-card, not per-points-pool.
export const UPGRADE_COSTS = {
  sharpen: 4,
  fortify: 4,
  lighten: 6,
  refine: 8,
};

// Points earned per Veil kill type. Read by combat code when an
// enemy with .isVeil === true dies.
export const POINTS_PER_KILL = {
  monster: 2,
  elite: 5,
  boss: 15,
};

// Point awards for boss clears and shop clears that aren't strictly
// kills. Used by state.js when the run advances.
export const POINTS_PER_BOSS = 15;
export const POINTS_PER_SHOP_CLEAR = 8;
