// ============================================================
// THE SENTINEL — Act 4 boss
//
// The Asteri's oldest defense. Built before the Collapse to guard
// the deepest doors and never given the order to stand down. It
// has been running the same command for centuries.
//
// Passive: caps the player at 10 cards played per turn.
// ============================================================

export const ENEMY = {
  id: 'the-warden',
  name: 'The Sentinel',
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
    'It has no face. No voice. Just a wall of stone and old, patient iron covered in Script that has not stopped glowing.',
    'The Asteri built it. Before the Collapse, before the Disappearance, before any of this had a name.',
    'It was made to guard the deepest doors. It never received the order to stand down.',
    'It does not speak. It does not need to.',
  ],
  phase2: [
    'A wall of stone folds away. Another takes its place. The Script on its chest has never dimmed.',
    'It has been running the same command for centuries. It has never been told it is over.',
    'It does not tire. It does not think. It simply is.',
  ],
  phase3: [
    'It is breaking. It is still standing.',
    'The floor beneath it hums with something older than Asteri work — the thing the machine was built to reach.',
    'The final door is just past it.',
  ],
  onDeath: [
    'The Sentinel cracks.',
    'It falls without a sound — a wall that finally learned how.',
    'The Script on its chest fades for the first time in a thousand years.',
    'Behind it, the final door opens.',
    'You can feel something waiting on the other side. Not afraid. Not angry. Just patient.',
    'It has been waiting a very long time. It can wait a few more seconds.',
  ],
  onPlayerDeath: [
    'The Sentinel closes over you like a tomb.',
    'You do not hear the machine. You do not hear anything.',
    'But your hand closes around the fragment at your chest.',
  ],
};
