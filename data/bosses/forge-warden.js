// ============================================================
// THE FORGE WARDEN — Act 4 boss (Asteri construct)
//
// A defense automaton built before the Collapse to guard the
// deepest forges of the Asteri. It was given one command: hold
// this door. It has held the door for a thousand years.
//
// Passive: caps the player at 10 cards played per turn.
// ============================================================

export const ENEMY = {
  id: 'forge-warden',
  name: 'The Forge Warden',
  hp: 220,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.25 },
  deck: [
    'forge-slam',
    'forge-shackle',
    'wardwall',
    'forge-rush',
    'forge-purge',
    'forge-slam',
    'forge-rush',
    'wardwall',
  ],
  passives: {
    cardPlayCap: 10,
  },
};

export const CARDS = {
  'forge-slam': {
    id: 'forge-slam', name: 'Slam', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 25 damage.',
    effects: [{ kind: 'damage', amount: 25 }],
  },
  'forge-rush': {
    id: 'forge-rush', name: 'Rush', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage three times.',
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
    ],
  },
  wardwall: {
    id: 'wardwall', name: 'Wardwall', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 23 Block.',
    effects: [{ kind: 'block', amount: 23 }],
  },
  'forge-shackle': {
    id: 'forge-shackle', name: 'Shackle', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 3 Weak and 3 Vulnerable.',
    effects: [
      { kind: 'applyStatus', status: 'weak', amount: 3 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 3 },
    ],
  },
  'forge-purge': {
    id: 'forge-purge', name: 'Purge', cost: 1, owner: 'enemy',
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
    'It has been running the same command for a thousand years. It has never been told it is over.',
    'It does not tire. It does not think. It simply is.',
  ],
  phase3: [
    'It is breaking. It is still standing.',
    'The floor beneath it hums with something older than Asteri work — the thing the machine was built to reach.',
    'The final door is just past it.',
  ],
  onDeath: [
    'The Warden cracks.',
    'It falls without a sound — a wall that finally learned how.',
    'The Script on its chest fades for the first time in a thousand years.',
    'Behind it, the final door opens.',
    'You can feel something waiting on the other side. Not afraid. Not angry. Just patient.',
    'It has been waiting a very long time. It can wait a few more seconds.',
  ],
  onPlayerDeath: [
    'The Warden closes over you like a tomb.',
    'You do not hear the machine. You do not hear anything.',
    'But your hand closes around the fragment at your chest.',
  ],
};
