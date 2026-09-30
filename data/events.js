import { CARDS } from './cards.js';
import { RELICS, rollRelicChoices } from './relics.js';
import { rollCardChoices } from '../systems/rewards.js';

export const EVENTS = [
  // ============================================================
  // 1. Ancient Shrine
  // ============================================================
  {
    id: 'shrine',
    name: 'Ancient Shrine',
    text: 'A glowing shrine hums in the dark. Do you touch it?',
    choices: [
      { label: 'Pray (heal 15)', effects: [{ kind: 'heal', amount: 15 }] },
      { label: 'Desecrate (gain 100 gold, lose 8 HP)', effects: [
        { kind: 'gold', amount: 100 },
        { kind: 'damageSelf', amount: 8 },
      ] },
      { label: 'Walk away', effects: [] },
    ],
  },

  // ============================================================
  // 2. Wandering Merchant — shows the exact card you're buying
  // ============================================================
  {
    id: 'wanderer',
    prepare(rng) {
      const [cardId] = rollCardChoices(rng, 1);
      const card = CARDS[cardId];
      return {
        id: 'wanderer',
        name: 'Wandering Merchant',
        text: `A hooded figure lays a single card on the table: "${card.name}." Fifty gold. No haggling.`,
        choices: [
          {
            label: `Buy ${card.name} — 50 gold`,
            condition: (p) => p.gold >= 50,
            effects: [
              { kind: 'gold', amount: -50 },
              { kind: 'grantSpecificCard', defId: cardId },
            ],
          },
          {
            label: 'Buy a potion — 30 gold, heal 20',
            condition: (p) => p.gold >= 30,
            effects: [
              { kind: 'gold', amount: -30 },
              { kind: 'heal', amount: 20 },
            ],
          },
          { label: 'Decline', effects: [] },
        ],
      };
    },
  },

  // ============================================================
  // 3. Abandoned Campfire
  // ============================================================
  {
    id: 'campfire-lore',
    name: 'Abandoned Campfire',
    text: 'Embers still glow. Someone left in a hurry.',
    choices: [
      { label: 'Rest (heal 12)', effects: [{ kind: 'heal', amount: 12 }] },
      { label: 'Search (gain 40 gold, lose 5 HP)', effects: [
        { kind: 'gold', amount: 40 },
        { kind: 'damageSelf', amount: 5 },
      ] },
    ],
  },

  // ============================================================
  // 4. Cursed Idol — max-HP gamble
  // ============================================================
  {
    id: 'cursed-idol',
    name: 'Cursed Idol',
    text: 'A small stone idol sits on a pedestal, its eyes hollowed out. You feel it watching you.',
    choices: [
      {
        label: 'Touch it (max HP +8, lose 15 HP)',
        effects: [
          { kind: 'damageSelf', amount: 15 },
          { kind: 'maxHp', amount: 8 },
        ],
      },
      {
        label: 'Smash it (gain 60 gold, lose 8 HP)',
        effects: [
          { kind: 'damageSelf', amount: 8 },
          { kind: 'gold', amount: 60 },
        ],
      },
      { label: 'Leave it alone', effects: [] },
    ],
  },

  // ============================================================
  // 5. Old Battlefield
  // ============================================================
  {
    id: 'old-battlefield',
    name: 'Old Battlefield',
    text: 'Bones and shattered weapons litter the ground. Someone lost a war here.',
    choices: [
      {
        label: 'Scavenge (gain a card, lose 6 HP)',
        effects: [
          { kind: 'damageSelf', amount: 6 },
          { kind: 'grantRandomCard' },
        ],
      },
      {
        label: 'Pay respects (heal 10, gain 20 gold)',
        effects: [
          { kind: 'heal', amount: 10 },
          { kind: 'gold', amount: 20 },
        ],
      },
      { label: 'Walk past', effects: [] },
    ],
  },

  // ============================================================
  // 6. Suspicious Fountain — text changes based on a roll
  // ============================================================
  {
    id: 'suspicious-fountain',
    prepare(rng) {
      const clean = rng() < 0.5;
      return {
        id: 'suspicious-fountain',
        name: 'Suspicious Fountain',
        text: clean
          ? 'Water bubbles up from a stone basin. It smells clean — clean in a way that almost seems wrong, this deep down.'
          : 'Water bubbles up from a stone basin. It smells faintly of iron, like something died upstream.',
        choices: [
          {
            label: 'Drink deeply (heal 25)',
            effects: [{ kind: 'heal', amount: 25 }],
          },
          {
            label: 'Fill your waterskin (gain a card)',
            effects: [{ kind: 'grantRandomCard' }],
          },
          { label: 'Leave it', effects: [] },
        ],
      };
    },
  },

  // ============================================================
  // 7. Fallen Adventurer
  // ============================================================
  {
    id: 'fallen-adventurer',
    name: 'Fallen Adventurer',
    text: 'A body lies slumped against the wall, a deck scattered at its feet. They got further than most.',
    choices: [
      {
        label: 'Take their relic (gain relic, lose 10 HP)',
        effects: [
          { kind: 'damageSelf', amount: 10 },
          { kind: 'addRandomRelic' },
        ],
      },
      {
        label: 'Take their gold (gain 70 gold)',
        effects: [{ kind: 'gold', amount: 70 }],
      },
      {
        label: 'Bury them (heal 15)',
        effects: [{ kind: 'heal', amount: 15 }],
      },
    ],
  },

  // ============================================================
  // 8. Whispering Pool
  // ============================================================
  {
    id: 'whispering-pool',
    name: 'Whispering Pool',
    text: 'A still pool reflects a sky you do not recognize. The water whispers in a language just under hearing.',
    choices: [
      {
        label: 'Reflect (max HP +5)',
        effects: [{ kind: 'maxHp', amount: 5 }],
      },
      {
        label: 'Toss a coin (lose 30 gold, gain a relic)',
        condition: (p) => p.gold >= 30,
        effects: [
          { kind: 'gold', amount: -30 },
          { kind: 'addRandomRelic' },
        ],
      },
      { label: 'Back away', effects: [] },
    ],
  },

  // ============================================================
  // 9. Dungeon Scholar — offers a specific rare card
  // ============================================================
  {
    id: 'dungeon-scholar',
    prepare(rng) {
      const rarePool = Object.keys(CARDS).filter(id => CARDS[id].rarity === 'rare');
      const cardId = rarePool[Math.floor(rng() * rarePool.length)];
      const card = CARDS[cardId];
      return {
        id: 'dungeon-scholar',
        name: 'Dungeon Scholar',
        text: `A gaunt figure looks up from a stack of notes. "Ah. A Drawn. How interesting." They slide a card across the desk: ${card.name}. Rare. Yours, for the right price.`,
        choices: [
          {
            label: `Trade 12 HP for ${card.name}`,
            condition: (p) => p.hp > 12,
            effects: [
              { kind: 'damageSelf', amount: 12 },
              { kind: 'grantSpecificCard', defId: cardId },
            ],
          },
          {
            label: 'Ask for coin instead (gain 45 gold)',
            effects: [{ kind: 'gold', amount: 45 }],
          },
          { label: 'Leave', effects: [] },
        ],
      };
    },
  },

  // ============================================================
  // 10. Forgotten Library
  // ============================================================
  {
    id: 'forgotten-library',
    name: 'Forgotten Library',
    text: 'Shelves of mouldering books line a collapsed chamber. A single tome lies open on a lectern, its pages still legible.',
    choices: [
      {
        label: 'Study the tome (enchant a random card)',
        effects: [{ kind: 'enchantRandomCard' }],
      },
      {
        label: 'Burn the shelves (lose 8 HP, gain 80 gold)',
        effects: [
          { kind: 'damageSelf', amount: 8 },
          { kind: 'gold', amount: 80 },
        ],
      },
      { label: 'Leave quietly', effects: [] },
    ],
  },

  // ============================================================
  // 11. Trapped Chest
  // ============================================================
  {
    id: 'trapped-chest',
    name: 'Trapped Chest',
    text: 'A chest sits against the wall. Thin wires run from its lid into the stone. Whoever left it wanted to keep it.',
    choices: [
      {
        label: 'Open it carefully (gain 90 gold, lose 8 HP)',
        effects: [
          { kind: 'damageSelf', amount: 8 },
          { kind: 'gold', amount: 90 },
        ],
      },
      {
        label: 'Open it quickly (gain 220 gold, lose 20 HP)',
        effects: [
          { kind: 'damageSelf', amount: 20 },
          { kind: 'gold', amount: 120 },
        ],
      },
      { label: 'Leave it', effects: [] },
    ],
  },

  // ============================================================
  // 12. Traveling Healer
  // ============================================================
  {
    id: 'traveling-healer',
    name: 'Traveling Healer',
    text: 'A woman in worn traveling clothes kneels beside a small fire. "Injured? Sit. I can help."',
    choices: [
      {
        label: 'Pay for treatment (30 gold, heal 30)',
        condition: (p) => p.gold >= 30,
        effects: [
          { kind: 'gold', amount: -30 },
          { kind: 'heal', amount: 30 },
        ],
      },
      {
        label: 'Help her with her fire (heal 12)',
        effects: [{ kind: 'heal', amount: 12 }],
      },
      { label: 'Decline', effects: [] },
    ],
  },

  // ============================================================
  // 13. Corrupted Altar
  // ============================================================
  {
    id: 'corrupted-altar',
    name: 'Corrupted Altar',
    text: 'A black stone altar drips with something that is not quite water. It wants an offering.',
    choices: [
      {
        label: 'Sacrifice a card (lose a random card, gain a relic)',
        effects: [
          { kind: 'removeRandomCard' },
          { kind: 'addRandomRelic' },
        ],
      },
      {
        label: 'Offer gold instead (lose 40 gold, gain a relic)',
        condition: (p) => p.gold >= 40,
        effects: [
          { kind: 'gold', amount: -40 },
          { kind: 'addRandomRelic' },
        ],
      },
      { label: 'Leave the altar alone', effects: [] },
    ],
  },
];

export function randomEvent(rng) {
  const template = EVENTS[Math.floor(rng() * EVENTS.length)];
  if (typeof template.prepare === 'function') {
    return template.prepare(rng);
  }
  return template;
}
