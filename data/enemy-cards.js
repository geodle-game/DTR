import { liveDamage } from './cards.js';
import { BOSSES } from './bosses/index.js';

export const ENEMY_CARDS = {
  // ============================================================
  // THE SPAWNED — machine-made. Unfinished. Wrong.
  // ============================================================
  'tendril-lash': {
    id: 'tendril-lash', name: 'Tendril Lash', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 7 damage.{live}',
    effects: [{ kind: 'damage', amount: 7 }],
    liveValues: liveDamage(7),
  },
  'engulf': {
    id: 'engulf', name: 'Engulf', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 13 damage.{live}',
    effects: [{ kind: 'damage', amount: 13 }],
    liveValues: liveDamage(13),
  },
  'unravel': {
    id: 'unravel', name: 'Unravel', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 9 damage.{live} Apply 1 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 9 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 1 },
    ],
    liveValues: liveDamage(9),
  },
  'coalesce': {
    id: 'coalesce', name: 'Coalesce', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 8 Block.',
    effects: [{ kind: 'block', amount: 8 }],
  },
  'seethe': {
    id: 'seethe', name: 'Seethe', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 2 Strength.',
    effects: [{ kind: 'applyStatus', status: 'strength', amount: 2 }],
  },
  'fraying-touch': {
    id: 'fraying-touch', name: 'Fraying Touch', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 5 damage.{live} Apply 1 Weak.',
    effects: [
      { kind: 'damage', amount: 5 },
      { kind: 'applyStatus', status: 'weak', amount: 1 },
    ],
    liveValues: liveDamage(5),
  },
  'split-grow': {
    id: 'split-grow', name: 'Split and Grow', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Heal 8 HP. Gain 1 Strength.',
    effects: [
      { kind: 'heal', amount: 8 },
      { kind: 'applyStatus', status: 'strength', amount: 1 },
    ],
  },
  'echo-strike': {
    id: 'echo-strike', name: 'Echo Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage twice.{live}',
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
    ],
    liveValues: liveDamage(6),
  },

  // ============================================================
  // THE ABSORBED — Asteri remnants. Still screaming.
  // ============================================================
  'memory-lance': {
    id: 'memory-lance', name: 'Memory Lance', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 10 damage.{live}',
    effects: [{ kind: 'damage', amount: 10 }],
    liveValues: liveDamage(10),
  },
  'mourn': {
    id: 'mourn', name: 'Mourn', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 7 Block. Gain 1 Strength.',
    effects: [
      { kind: 'block', amount: 7 },
      { kind: 'applyStatus', status: 'strength', amount: 1 },
    ],
  },
  'borrowed-script': {
    id: 'borrowed-script', name: 'Borrowed Script', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 2 Vulnerable.',
    effects: [{ kind: 'applyStatus', status: 'vulnerable', amount: 2 }],
  },
  'unfinished-sentence': {
    id: 'unfinished-sentence', name: 'Unfinished Sentence', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Shuffle a Dazed into your draw pile.',
    effects: [{ kind: 'addCardToPlayerDraw', cardId: 'dazed' }],
  },
  'grief': {
    id: 'grief', name: 'Grief', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 15 damage.{live} Loses 5 HP.',
    effects: [
      { kind: 'damage', amount: 15 },
      { kind: 'loseHpSelf', amount: 5 },
    ],
    liveValues: liveDamage(15),
  },
  'echo-of-what-was': {
    id: 'echo-of-what-was', name: 'Echo of What Was', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 2 Weak and 2 Vulnerable.',
    effects: [
      { kind: 'applyStatus', status: 'weak', amount: 2 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2 },
    ],
  },

  // ============================================================
  // THE WILD — pre-Asteri. Predators. Do not care about you.
  // ============================================================
  'thrash': {
    id: 'thrash', name: 'Thrash', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage twice.{live}',
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
    ],
    liveValues: liveDamage(6),
  },
  'carapace': {
    id: 'carapace', name: 'Carapace', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 12 Block.',
    effects: [{ kind: 'block', amount: 12 }],
  },
  'stone-break': {
    id: 'stone-break', name: 'Stone-Break', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 14 damage.{live}',
    effects: [{ kind: 'damage', amount: 14 }],
    liveValues: liveDamage(14),
  },
  'swallow': {
    id: 'swallow', name: 'Swallow', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 18 damage.{live} Loses 6 HP.',
    effects: [
      { kind: 'damage', amount: 18 },
      { kind: 'loseHpSelf', amount: 6 },
    ],
    liveValues: liveDamage(18),
  },
  'gnash': {
    id: 'gnash', name: 'Gnash', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 4 damage.{live} Apply 1 Weak.',
    effects: [
      { kind: 'damage', amount: 4 },
      { kind: 'applyStatus', status: 'weak', amount: 1 },
    ],
    liveValues: liveDamage(4),
  },
  'burrow': {
    id: 'burrow', name: 'Burrow', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 6 Block. Gain 1 Strength.',
    effects: [
      { kind: 'block', amount: 6 },
      { kind: 'applyStatus', status: 'strength', amount: 1 },
    ],
  },

  // ============================================================
  // THE VEIL'S PROJECTS — organized. Cruel. Well-funded.
  // ============================================================
  'calibrated-strike': {
    id: 'calibrated-strike', name: 'Calibrated Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 8 damage.{live}',
    effects: [{ kind: 'damage', amount: 8 }],
    liveValues: liveDamage(8),
  },
  'purge': {
    id: 'purge', name: 'Purge', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Exhaust 2 random cards in your hand.',
    effects: [{ kind: 'exhaustRandomHand', amount: 2 }],
  },
  'binding-field': {
    id: 'binding-field', name: 'Binding Field', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 2 Weak.',
    effects: [{ kind: 'applyStatus', status: 'weak', amount: 2 }],
  },
  'overcharge': {
    id: 'overcharge', name: 'Overcharge', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 4 Strength. Loses 6 HP.',
    effects: [
      { kind: 'applyStatus', status: 'strength', amount: 4 },
      { kind: 'loseHpSelf', amount: 6 },
    ],
  },
  'null-shield': {
    id: 'null-shield', name: 'Null Shield', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 10 Block.',
    effects: [{ kind: 'block', amount: 10 }],
  },
  'reclaimed-script': {
    id: 'reclaimed-script', name: 'Reclaimed Script', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 1 Weak and 1 Vulnerable.',
    effects: [
      { kind: 'applyStatus', status: 'weak', amount: 1 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 1 },
    ],
  },

  // ============================================================
  // SURFACE INTRUDERS — desperate. Mundane. Dangerous anyway.
  // ============================================================
  'harry': {
    id: 'harry', name: 'Harry', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage.{live}',
    effects: [{ kind: 'damage', amount: 6 }],
    liveValues: liveDamage(6),
  },
  'riposte': {
    id: 'riposte', name: 'Riposte', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 8 damage.{live}',
    effects: [{ kind: 'damage', amount: 8 }],
    liveValues: liveDamage(8),
  },
  'provision': {
    id: 'provision', name: 'Provision', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Heal 10 HP.',
    effects: [{ kind: 'heal', amount: 10 }],
  },
  'trick-shot': {
    id: 'trick-shot', name: 'Trick Shot', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 7 damage.{live} Apply 2 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 7 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2 },
    ],
    liveValues: liveDamage(7),
  },
  'battle-cry': {
    id: 'battle-cry', name: 'Battle Cry', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 2 Strength.',
    effects: [{ kind: 'applyStatus', status: 'strength', amount: 2 }],
  },
  'feint': {
    id: 'feint', name: 'Feint', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 4 Block. Gain 1 Strength.',
    effects: [
      { kind: 'block', amount: 4 },
      { kind: 'applyStatus', status: 'strength', amount: 1 },
    ],
  },

  // ============================================================
  // ACT 1 BOSS CARDS — Waxling King, The Remembering, Stitched Sovereign
  // ============================================================
  'waxflow': {
    id: 'waxflow', name: 'Waxflow', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 12 damage.{live}',
    effects: [{ kind: 'damage', amount: 12 }],
    liveValues: liveDamage(12),
  },
  'crown-self': {
    id: 'crown-self', name: 'Crown of Wax', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 10 Block. Gain 3 Strength.',
    effects: [
      { kind: 'block', amount: 10 },
      { kind: 'applyStatus', status: 'strength', amount: 3 },
    ],
  },
  'melt': {
    id: 'melt', name: 'Melt', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 20 damage.{live}',
    effects: [{ kind: 'damage', amount: 20 }],
    liveValues: liveDamage(20),
  },
  'remember-me': {
    id: 'remember-me', name: 'Remember Me', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 8 damage.{live} Apply 1 Weak and 1 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'applyStatus', status: 'weak', amount: 1 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 1 },
    ],
    liveValues: liveDamage(8),
  },
  'shatter-memory': {
    id: 'shatter-memory', name: 'Shatter Memory', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 14 damage.{live}',
    effects: [{ kind: 'damage', amount: 14 }],
    liveValues: liveDamage(14),
  },
  'mourn-song': {
    id: 'mourn-song', name: 'Mourn-Song', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Heal 5 HP. Gain 2 Strength.',
    effects: [
      { kind: 'heal', amount: 5 },
      { kind: 'applyStatus', status: 'strength', amount: 2 },
    ],
  },
  'stitch': {
    id: 'stitch', name: 'Stitch', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Heal 15 HP.',
    effects: [{ kind: 'heal', amount: 15 }],
  },
  'gather-flesh': {
    id: 'gather-flesh', name: 'Gather Flesh', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 15 damage.{live}',
    effects: [{ kind: 'damage', amount: 15 }],
    liveValues: liveDamage(15),
  },
};

// Merge boss-specific cards into ENEMY_CARDS.
for (const bossModule of BOSSES) {
  if (bossModule.CARDS) {
    Object.assign(ENEMY_CARDS, bossModule.CARDS);
  }
}

export const ENEMY_ADDED_CARDS = {
  slimed: {
    id: 'slimed', name: 'Slimed', cost: 1, rarity: 'status',
    type: 'status', target: 'none', destination: 'exhaust',
    text: 'Play: lose 1 Energy. Exhaust.',
    effects: [{ kind: 'loseEnergy', amount: 1 }],
  },
};
