// ============================================================
// THE DROWNED CHOIR — Act 4 boss (Veil experiment)
//
// A nursery experiment that went wrong. Thirty-seven voices
// fused into one body, singing the same three notes. They have
// been singing for six hundred years.
//
// Passive: heals itself when it applies Weak or Vulnerable.
// ============================================================

export const ENEMY = {
  id: 'drowned-choir',
  name: 'The Drowned Choir',
  hp: 200,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.3 },
  deck: [
    'wail',
    'undertow',
    'chorus',
    'drown',
    'wail',
    'undertow',
    'chorus',
  ],
  passives: {
    healOnDebuff: 4,
  },
};

export const CARDS = {
  wail: {
    id: 'wail', name: 'Wail', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 10 damage. Apply 1 Weak.',
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'applyStatus', status: 'weak', amount: 1 },
    ],
  },
  undertow: {
    id: 'undertow', name: 'Undertow', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 8 damage. Apply 2 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2 },
    ],
  },
  chorus: {
    id: 'chorus', name: 'Chorus', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 4 damage four times.',
    effects: [
      { kind: 'damage', amount: 4 },
      { kind: 'damage', amount: 4 },
      { kind: 'damage', amount: 4 },
      { kind: 'damage', amount: 4 },
    ],
  },
  drown: {
    id: 'drown', name: 'Drown', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 18 damage. The Choir loses 5 HP.',
    effects: [
      { kind: 'damage', amount: 18 },
      { kind: 'loseHpSelf', amount: 5 },
    ],
  },
};

export const LORE = {
  start: [
    'You hear them before you see them.',
    'Three notes. Low, then lower, then lower still. The same three notes, over and over, in a rhythm that does not quite line up with itself.',
    'Then you turn a corner, and you see the shape they come from.',
    'It is not one body. It is many. Fused. Thirty-seven faces, maybe more, all pressed into the same mass, all singing. Some of the faces are Asteri. Some are not. None of them are still people.',
    'They have been singing for six hundred years. They do not stop.',
  ],
  phase2: [
    'The three notes change. They are louder now. They are almost a word.',
    '"Please," the word says. "Please. Please. Please."',
    'The Choir is not attacking you. It is asking you. It has been asking for six hundred years and it has never once been heard.',
  ],
  phase3: [
    'The mass is breaking apart. The faces are coming loose.',
    'The song is dissolving into individual voices, each one saying something different, all of them overlapping into noise.',
    'One of them — the oldest one, the Asteri one — says: "I was an archivist. I was an archivist. I was an archivist."',
    'Then the noise resumes.',
  ],
  onDeath: [
    'The Choir goes quiet.',
    'For the first time in six hundred years, the corridors of the Asteri city are silent in this chamber.',
    'The faces have stopped moving. The mass has settled.',
    'You do not know if you killed them or freed them. You do not think they knew either.',
    'You keep going.',
  ],
  onPlayerDeath: [
    'The Choir does not stop singing.',
    'It has been singing for six hundred years and it will sing for six hundred more. It does not matter that you are dead. It did not matter that you were alive.',
    'You become part of the song.',
  ],
};
