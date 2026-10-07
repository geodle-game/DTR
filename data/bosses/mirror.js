// ============================================================
// THE MIRROR — Act 8 boss (Spawned)
//
// A Spawned that has learned to copy. It has no body of its
// own. It has been following explorers through the ruins for
// decades, wearing their faces, learning their decks. When you
// face it, it wears your face, and it plays your deck.
//
// Design: the Mirror draws cards from a copy of the player's
// deck. Its deck list is generated at combat start, not fixed.
// The static `deck` below is a fallback used only if the copy
// fails.
//
// Passive: begins combat with a copy of the player's classId.
// ============================================================

export const ENEMY = {
  id: 'mirror',
  name: 'The Mirror',
  hp: 250,
  isBoss: true,
  phaseThresholds: { phase2: 0.5 },
  deck: [
    'reflected-strike',
    'reflected-guard',
    'reflected-script',
    'reflected-strike',
    'reflected-guard',
  ],
  passives: {
    mimicPlayerDeck: true,
  },
};

export const CARDS = {
  'reflected-strike': {
    id: 'reflected-strike', name: 'Reflected Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 14 damage.',
    effects: [{ kind: 'damage', amount: 14 }],
  },
  'reflected-guard': {
    id: 'reflected-guard', name: 'Reflected Guard', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 12 Block.',
    effects: [{ kind: 'block', amount: 12 }],
  },
  'reflected-script': {
    id: 'reflected-script', name: 'Reflected Script', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 8 damage. Apply 2 Weak.',
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'applyStatus', status: 'weak', amount: 2 },
    ],
  },
};

export const LORE = {
  start: [
    'You see yourself standing in the corridor ahead of you.',
    'It is not a reflection. There is no mirror. There is a person there, with your face, wearing your coat, holding your deck.',
    'It is not an illusion. It is not a trick. It is a Spawned, and it has been wearing faces for a long time, and it has decided that yours is the face it wants.',
    'It smiles at you with your mouth.',
    'It draws a card from your deck.',
  ],
  phase2: [
    'Its face is slipping. It cannot hold yours for long.',
    'It tries another — the Veilwright, the Kind One, a face you do not recognize — and none of them fit.',
    'It settles on its own. Whatever its own is. It is not pleasant.',
  ],
  onDeath: [
    'It loses its shape.',
    'For a moment, you see it as it is — not a person, not a monster, just a thing that wanted very badly to be someone.',
    'Then it is gone, and you are alone with your own face again.',
  ],
  onPlayerDeath: [
    'It takes your face.',
    'Not the way a thief takes a coin. The way a hermit crab takes a shell. It steps into your body the way you would step into a coat.',
    'You are still aware. You are just — behind it now. Watching it use your hands.',
    'It walks on. It has a very long way to go.',
  ],
};
