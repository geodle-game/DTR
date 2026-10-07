// ============================================================
// THE BLIND GOD — Act 7 boss (Wild)
//
// A pre-Asteri creature that the Asteri themselves built a
// temple around. It has been here longer than the city. It has
// no eyes and no mouth. It communicates by carving Script onto
// the walls of the chamber. When it carves, the Script hurts.
//
// Passive: 30% resistance to spells. It is not native to the
// Script's logic.
// ============================================================

export const ENEMY = {
  id: 'blind-god',
  name: 'The Blind God',
  hp: 260,
  isBoss: true,
  phaseThresholds: { phase2: 0.5 },
  deck: [
    'carve',
    'unmake',
    'weight-of-ages',
    'carve',
    'silence',
  ],
  passives: {
    resistSpell: 0.3,
  },
};

export const CARDS = {
  carve: {
    id: 'carve', name: 'Carve', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 12 damage. Apply 1 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 12 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 1 },
    ],
  },
  unmake: {
    id: 'unmake', name: 'Unmake', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 18 damage. Apply 2 Weak.',
    effects: [
      { kind: 'damage', amount: 18 },
      { kind: 'applyStatus', status: 'weak', amount: 2 },
    ],
  },
  'weight-of-ages': {
    id: 'weight-of-ages', name: 'Weight of Ages', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 20 Block. Gain 2 Strength.',
    effects: [
      { kind: 'block', amount: 20 },
      { kind: 'applyStatus', status: 'strength', amount: 2 },
    ],
  },
  silence: {
    id: 'silence', name: 'Silence', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 2 No Draw.',
    effects: [{ kind: 'applyStatus', status: 'noDraw', amount: 2 }],
  },
};

export const LORE = {
  start: [
    'The chamber is round, and it is old, and there is something at the center of it.',
    'It has no eyes. It has no mouth. It has no limbs you can see. It is a shape, roughly, that has been folded over itself until it stopped being a shape.',
    'The walls are covered in Script. Not Asteri Script. Older. The Asteri built a temple around this thing because they did not know what else to do with it.',
    'It does not move when you enter. It does not need to. It simply carves a new word into the wall, and the word hurts, and you know you are not welcome.',
  ],
  phase2: [
    'It is carving faster now. The wall is filling up.',
    'The Script it is writing is not a language. It is closer to a bruise. It hurts to look at, and the hurt does not go away when you look away.',
    'One of the carvings, briefly, is your name.',
  ],
  onDeath: [
    'It stops carving.',
    'For the first time in a thousand years, the chamber is silent. The wall behind it is covered in words that no one will ever read.',
    'You do not know if you killed it. You do not think it can be killed. You think you simply made it decide to stop.',
    'You leave quickly.',
  ],
  onPlayerDeath: [
    'It does not attack you. It has never attacked anyone.',
    'It simply carves your name into the wall, in the same Script as the others, and the pain of the carving is the last thing you feel.',
    'Then it goes back to waiting.',
  ],
};
