// ============================================================
// THE VEILWRIGHT — Act 3 boss (Veil)
//
// A modern Veil operative, a thousand years downstream from the
// original faction. Sent into the ruins to find the fragments
// and bring them back. Treats the player as an obstacle.
//
// Passive: attacks ignore 30% of the player's Block. The Veil
// trains its operatives to fight Script-users.
// ============================================================

export const ENEMY = {
  id: 'veilwright',
  name: 'The Veilwright',
  hp: 170,
  isBoss: true,
  phaseThresholds: { phase2: 0.5 },
  deck: [
    'calibrated-strike',
    'binding-field',
    'overcharge',
    'null-shield',
    'reclaimed-script',
    'veil-verdict',
  ],
  passives: {
    ignoreBlockPercent: 0.3,
  },
};

export const CARDS = {
  'veil-verdict': {
    id: 'veil-verdict', name: 'Veil Verdict', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 20 damage. Exhaust 1 random card in your hand.',
    effects: [
      { kind: 'damage', amount: 20 },
      { kind: 'exhaustRandomHand', amount: 1 },
    ],
  },
};

export const LORE = {
  start: [
    'They are waiting for you.',
    'They are standing in the middle of the corridor, arms at their sides, and they do not look surprised to see you.',
    'They are not Asteri. They are not Absorbed. They are not Spawned. They are just a person — a person in a grey coat, with a knife at their belt and Script sewn into their sleeves.',
    '"You are the one carrying the fragments," they say. Not a question.',
    '"You can hand them over. You can turn around. Or we can do this the other way."',
    'They do not wait for an answer. They have already drawn the knife.',
  ],
  phase2: [
    'They are breathing hard. Their coat is torn. Their knife is chipped.',
    '"You are stronger than the reports said."',
    '"The reports said you were a scavenger. The reports said you would fold."',
    'They smile, thinly.',
    '"The reports are wrong a lot."',
  ],
  onDeath: [
    'They fall.',
    'They do not curse you. They do not swear revenge. They just lie there, on their back, staring at the ceiling of a city they will never see.',
    '"The Veil is everywhere," they say. "You can kill me. You cannot kill the Veil."',
    '"The Veil has been here longer than you. The Veil will be here after you."',
    'They close their eyes.',
  ],
  onPlayerDeath: [
    'They kneel beside you and take the fragments out of your hand.',
    'They hold one up to the light. They turn it over. They put it in their pocket.',
    '"Thank you," they say.',
    'Then they walk on. They have a long way to go and they are already late.',
  ],
};
