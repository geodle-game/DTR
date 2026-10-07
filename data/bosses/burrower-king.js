// ============================================================
// THE BURROWER KING — Act 2 boss (Wild)
//
// A pre-Asteri deep predator. It has been in these tunnels since
// before the mountain was hollowed. It has grown fat on the
// Spawned that keep wandering into its territory.
// ============================================================

export const ENEMY = {
  id: 'burrower-king',
  name: 'The Burrower King',
  hp: 150,
  isBoss: true,
  phaseThresholds: { phase2: 0.4 },
  deck: [
    'tunnel-strike',
    'emergence',
    'feast',
    'carapace-slam',
    'tunnel-strike',
  ],
};

export const CARDS = {
  'tunnel-strike': {
    id: 'tunnel-strike', name: 'Tunnel Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 14 damage.',
    effects: [{ kind: 'damage', amount: 14 }],
  },
  emergence: {
    id: 'emergence', name: 'Emergence', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage three times.',
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
    ],
  },
  feast: {
    id: 'feast', name: 'Feast', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Heal 20 HP. Gain 2 Strength.',
    effects: [
      { kind: 'heal', amount: 20 },
      { kind: 'applyStatus', status: 'strength', amount: 2 },
    ],
  },
  'carapace-slam': {
    id: 'carapace-slam', name: 'Carapace Slam', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Gain 15 Block. Deal 10 damage.',
    effects: [
      { kind: 'block', amount: 15 },
      { kind: 'damage', amount: 10 },
    ],
  },
};

export const LORE = {
  start: [
    'The floor moves.',
    'You have time to see it — a ridge of chitin the size of a wagon, running from one wall of the chamber to the other — and then the ridge stands up.',
    'It has been here longer than the city. It has been here longer than the mountain was hollowed. It does not have eyes. It does not need them. It hears the Script in your pocket like a dinner bell.',
    'It does not roar. It does not threaten. It simply begins to move toward you.',
  ],
  phase2: [
    'It is bleeding. It is not slowing down.',
    'It has been eating the Spawned for a thousand years. It has never had to fight something that could actually hurt it. It is learning.',
  ],
  onDeath: [
    'It stops moving.',
    'The ridge of chitin sinks back down into the floor of the chamber, slowly, the way a mountain subsides.',
    'It does not die like a person. It dies like something that was never really alive.',
    'You step over the carapace and keep going.',
  ],
  onPlayerDeath: [
    'It does not gloat. It does not even acknowledge you.',
    'It simply eats, and then it goes back to sleep.',
    'It will still be here when the next explorer comes. It will still be hungry. It will have forgotten this in an hour.',
  ],
};
