// ============================================================
// THE ARCHIVIST — Act 9 boss (Veil)
//
// The Veil's record-keeper. Not a fighter by training, but
// has spent a thousand years reading every account of every
// explorer who ever reached the chamber. He knows their decks.
// He knows their habits. He has written counter-strategies for
// every single one.
//
// Passive: rerolls the player's lowest-value card at the start
// of each player turn. He has read what you are going to do.
// ============================================================

export const ENEMY = {
  id: 'archivist',
  name: 'The Archivist',
  hp: 260,
  isBoss: true,
  phaseThresholds: { phase2: 0.5, phase3: 0.2 },
  deck: [
    'record-strike',
    'counter-script',
    'long-memory',
    'record-strike',
    'index',
    'counter-script',
  ],
  passives: {
    rerollLowestCard: true,
  },
};

export const CARDS = {
  'record-strike': {
    id: 'record-strike', name: 'Record Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 15 damage.',
    effects: [{ kind: 'damage', amount: 15 }],
  },
  'counter-script': {
    id: 'counter-script', name: 'Counter-Script', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Disable 2 random cards in your hand for this turn.',
    effects: [{ kind: 'disableRandomHand', amount: 2 }],
  },
  'long-memory': {
    id: 'long-memory', name: 'Long Memory', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 3 Strength. Heal 8 HP.',
    effects: [
      { kind: 'applyStatus', status: 'strength', amount: 3 },
      { kind: 'heal', amount: 8 },
    ],
  },
  index: {
    id: 'index', name: 'Index', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage three times.',
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
    ],
  },
};

export const LORE = {
  start: [
    'He is sitting at a desk that actually exists.',
    'He is surrounded by books. Real books — paper, ink, bindings. The only real books you have seen since you came down here.',
    'He looks up when you enter, and he does not look surprised.',
    '"You are the current one," he says. "I have been reading about you."',
    'He taps a ledger on the desk. It is full of names. Hundreds of names.',
    '"Every explorer who has ever reached the chamber is in this book. Yours is already written. I just have not filled in the date yet."',
  ],
  phase2: [
    'He is still reading while he fights.',
    '"I have your decklist," he says. "I have had it since you first drew a card on the surface. I know what you are going to play before you do."',
    '"The only variable is whether you surprise me."',
    'He flips a page.',
    '"You have not surprised me yet."',
  ],
  phase3: [
    'He is running out of pages.',
    '"I have never been wrong," he says. "Not in a thousand years. Not once."',
    '"I have written what happens next. You win. I lose. And then you reach the chamber, and then the machine takes you, and then I write the next name."',
    '"That is the book. That is all of it."',
  ],
  onDeath: [
    'He falls forward onto the desk.',
    'The ledger slides off and lands open on the floor. Your name is there. His name is not.',
    '"The book is unfinished," he says. "Someone has to finish it."',
    'Then he is gone.',
    'You do not pick up the book. You do not want to know what it says.',
  ],
  onPlayerDeath: [
    'He writes something in the ledger.',
    '"The current one," he says. "Died in the archive. No surprises."',
    'He closes the book. He sets down the pen.',
    'Then he waits for the next one.',
  ],
};
