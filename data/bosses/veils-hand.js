// ============================================================
// THE VEIL'S HAND — Act 8 boss (Veil)
//
// The Veil's senior field agent. Older than the Veilwright,
// more experienced, more patient. She has been doing this for
// thirty years. She has killed thirty explorers. She has their
// fragments sewn into the lining of her coat.
//
// Passive: absorbs 10 HP from you whenever she kills one of
// your cards via Exhaust.
// ============================================================

export const ENEMY = {
  id: 'veils-hand',
  name: "The Veil's Hand",
  hp: 280,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.3 },
  deck: [
    'silent-strike',
    'denial',
    'extraction',
    'silent-strike',
    'severance',
    'extraction',
    'denial',
  ],
  passives: {
    healOnExhaust: 10,
  },
};

export const CARDS = {
  'silent-strike': {
    id: 'silent-strike', name: 'Silent Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 16 damage.',
    effects: [{ kind: 'damage', amount: 16 }],
  },
  denial: {
    id: 'denial', name: 'Denial', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Disable half your hand for this turn.',
    effects: [{ kind: 'disableHandPercent', percent: 0.5 }],
  },
  extraction: {
    id: 'extraction', name: 'Extraction', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Exhaust 2 random cards in your hand.',
    effects: [{ kind: 'exhaustRandomHand', amount: 2 }],
  },
  severance: {
    id: 'severance', name: 'Severance', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 22 damage. Exhaust 1 random card in your hand.',
    effects: [
      { kind: 'damage', amount: 22 },
      { kind: 'exhaustRandomHand', amount: 1 },
    ],
  },
};

export const LORE = {
  start: [
    'She is sitting on a crate when you arrive. She has been waiting.',
    'She is older than the Veilwright. She is older than you. She has been doing this since before you were born.',
    'She does not stand up. She does not draw a weapon. She just looks at you with the patient expression of someone who has done this thirty times and expects to do it thirty more.',
    '"You have a powerful object that is emmiting script emergy," she says. "I will pluck them off your dead body to research it."',
    'She does not wait for an answer.',
  ],
  phase2: [
    'She is moving now, and she is fast. Faster than the Veilwright. Faster than you.',
    '"You have not done this before," she says. "I have. That is the whole difference between us."',
    '"There is no shame in it. Someone has to be first at everything."',
  ],
  phase3: [
    'She is bleeding from a wound she has not noticed yet.',
    '"I have a daughter," she says. "Somewhere. I think. I have not seen her in twenty years."',
    '"She does not know what I do. I do not intend to tell her."',
    '"If you see her — you will not see her. Never mind."',
  ],
  onDeath: [
    'She falls backwards onto the crate she was sitting on.',
    'This is not over. The Veil will not make the same mistake again.',
    '"The Veil is patient," she says. "The Veil has always been patient."',
    'She closes her eyes.',
  ],
  onPlayerDeath: [
    'She kneels beside you and takes the fragments out of your hand, one at a time, the way a mother takes toys from a sleeping child.',
    'She sighs as the fragments crumble into dust the moment it touches her hand. "It's fine."',
    '"I will see you again," she says. "Not you. But someone like you. Someone who looks like you."',
    '"It is always someone who looks like you."',
    'Then she is gone.',
  ],
};
