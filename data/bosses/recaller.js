// ============================================================
// THE RECALLER — Act 7 boss (Absorbed)
//
// An Asteri official who used to administer the city's travel
// network. After the Disappearance, she leaked out of the
// machine with her old role still burning inside her. She
// still thinks she is in charge of arrivals and departures.
//
// She does not attack. She "processes" people. Anyone she
// touches gets sent somewhere else — sometimes back, sometimes
// nowhere.
//
// Passive: 30% chance to shuffle a Dazed into your draw pile
// each turn.
// ============================================================

export const ENEMY = {
  id: 'recaller',
  name: 'The Recaller',
  hp: 230,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.3 },
  deck: [
    'process',
    'reroute',
    'hold',
    'process',
    'deny',
    'reroute',
  ],
  passives: {
    shuffleDazedChance: 0.3,
  },
};

export const CARDS = {
  process: {
    id: 'process', name: 'Process', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 14 damage.',
    effects: [{ kind: 'damage', amount: 14 }],
  },
  reroute: {
    id: 'reroute', name: 'Reroute', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Shuffle 2 Dazed into your draw pile.',
    effects: [
      { kind: 'addCardToPlayerDraw', cardId: 'dazed' },
      { kind: 'addCardToPlayerDraw', cardId: 'dazed' },
    ],
  },
  hold: {
    id: 'hold', name: 'Hold', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 3 Weak.',
    effects: [{ kind: 'applyStatus', status: 'weak', amount: 3 }],
  },
  deny: {
    id: 'deny', name: 'Deny', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 10 damage. Exhaust 1 random card in your hand.',
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'exhaustRandomHand', amount: 1 },
    ],
  },
};

export const LORE = {
  start: [
    'She is standing at a desk that no longer exists.',
    'The desk was wood, once. It rotted away four hundred years ago. She has not noticed. She is writing in a ledger that is also gone.',
    'She looks up when you enter.',
    '"Name," she says. "Destination. Purpose of travel."',
    'She does not wait for an answer. She never did. She simply begins the process.',
  ],
  phase2: [
    'The ledger is still gone but she is holding it tighter now.',
    '"You are not on the manifest," she says. "You cannot be here. This is a restricted district."',
    '"You will need to be processed."',
    'She reaches for you. Her hand passes through the air, and the air folds.',
  ],
  phase3: [
    'She is almost lucid.',
    '"I was supposed to keep them safe," she says. "I was supposed to log every arrival and every departure. I was supposed to make sure everyone got where they were going."',
    '"And then no one arrived. And then no one departed. And then I was still here, and there was no one to process, and I did not know what to do."',
    '"So I kept working."',
  ],
  onDeath: [
    'She falls.',
    'The ledger she was holding is still not there. But her hands close on nothing, one last time, and then open again.',
    '"Departed," she says, softly. "Final. Confirmed."',
    'Then she is gone.',
  ],
  onPlayerDeath: [
    'She processes you.',
    'You do not die. You are simply — rerouted. You wake somewhere else. Somewhere worse. Somewhere you have not been.',
    'She writes it down in the ledger that is not there.',
    '"Arrived," she says. "Please proceed to the next window."',
  ],
};
