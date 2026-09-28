// ============================================================
// THE WARDEN — Act 4 boss
//
// The Core's silent enforcer. Built from the dungeon's oldest
// defenses. Does not speak, does not negotiate. Just blocks
// the final door with everything it has.
//
// Passive: caps the player at 10 cards played per turn.
// ============================================================

export const ENEMY = {
  id: 'the-warden',
  name: 'The Warden',
  hp: 260,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.25 },
  deck: [
    'warden-slam',
    'warden-shackle',
    'warden-wall',
    'warden-rush',
    'warden-purge',
    'warden-slam',
    'warden-rush',
    'warden-wall',
  ],
  passives: {
    cardPlayCap: 10,
  },
};

export const CARDS = {
  'warden-slam': {
    id: 'warden-slam', name: 'Slam', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 25 damage.',
    effects: [{ kind: 'damage', amount: 25 }],
  },
  'warden-rush': {
    id: 'warden-rush', name: 'Rush', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage three times.',
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
    ],
  },
  'warden-wall': {
    id: 'warden-wall', name: 'Wardwall', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 23 Block.',
    effects: [{ kind: 'block', amount: 23 }],
  },
  'warden-shackle': {
    id: 'warden-shackle', name: 'Shackle', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 3 Weak and 3 Vulnerable.',
    effects: [
      { kind: 'applyStatus', status: 'weak', amount: 3 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 3 },
    ],
  },
  'warden-purge': {
    id: 'warden-purge', name: 'Purge', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Exhaust 2 random cards in your hand.',
    effects: [{ kind: 'exhaustRandomHand', amount: 2 }],
  },
};

export const LORE = {
  start: [
    'Something enormous rises from the floor.',
    'It has no face. No voice. Just a wall of arms and stone and old, patient iron.',
    'The Core made it to be the last thing standing between you and itself.',
    'It does not speak. It does not need to.',
  ],
  phase2: [
    'A wall of stone folds away. Another takes its place.',
    'The Warden does not tire. The Warden does not think. The Warden simply is.',
  ],
  phase3: [
    'It is breaking. It is still standing.',
    'The floor beneath it hums with the Core\'s voice.',
    'The final door is just past it.',
  ],
  onDeath: [
    'The Warden cracks.',
    'It falls without a sound — a wall that finally learned how.',
    'Behind it, the final door opens.',
    'You can feel the Core waiting on the other side. Not afraid. Not angry. Just… patient.',
    'It has been waiting a thousand years. It can wait a few more seconds.',
  ],
  onPlayerDeath: [
    'The Warden closes over you like a tomb.',
    'You do not hear the Core. You do not hear anything.',
    'But your hand closes around the amulet at your chest.',
    'It is warm. It has always been warm.',
    'It pulls you back.',
  ],
};
