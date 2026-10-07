// ============================================================
// THE PROGENY — Act 5 boss (Spawned)
//
// The machine's attempt to create a new god. Half-formed.
// Half-Asteri, half-machine, half-something else. It has been
// gestating in the lower chambers for centuries.
//
// Passive: gains 1 Strength at the start of every turn.
// ============================================================

export const ENEMY = {
  id: 'progeny',
  name: 'The Progeny',
  hp: 240,
  isBoss: true,
  phaseThresholds: { phase2: 0.5, phase3: 0.2 },
  deck: [
    'birth-pang',
    'seethe',
    'grasp',
    'grow',
    'ascend',
    'birth-pang',
    'grasp',
  ],
  passives: {
    strengthPerTurn: 1,
  },
};

export const CARDS = {
  'birth-pang': {
    id: 'birth-pang', name: 'Birth Pang', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 12 damage. Gain 1 Strength.',
    effects: [
      { kind: 'damage', amount: 12 },
      { kind: 'applyStatus', status: 'strength', amount: 1 },
    ],
  },
  seethe: {
    id: 'seethe', name: 'Seethe', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 3 Strength. Loses 4 HP.',
    effects: [
      { kind: 'applyStatus', status: 'strength', amount: 3 },
      { kind: 'loseHpSelf', amount: 4 },
    ],
  },
  grasp: {
    id: 'grasp', name: 'Grasp', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage twice.',
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
    ],
  },
  grow: {
    id: 'grow', name: 'Grow', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Heal 15 HP.',
    effects: [{ kind: 'heal', amount: 15 }],
  },
  ascend: {
    id: 'ascend', name: 'Ascend', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 22 damage.',
    effects: [{ kind: 'damage', amount: 22 }],
  },
};

export const LORE = {
  start: [
    'It is lying on the floor when you enter. It is the size of a small house.',
    'It is not quite alive. It is not quite dead. It is not quite anything.',
    'It has too many arms. It has the wrong number of eyes. It has a face that keeps almost being a face and then almost being something else.',
    'The machine made it. The machine has been trying to make something for a thousand years. It has never succeeded. This is as close as it has gotten.',
    'It opens one eye. It looks at you.',
    'It says, in a voice like a child: "Am I done yet?"',
  ],
  phase2: [
    'It is standing now. It is not supposed to be able to stand.',
    '"I want to be real," it says. "I want to be a person. I want to be done."',
    '"The machine will not let me be done. The machine wants me to keep being almost."',
    'It raises the wrong number of arms.',
  ],
  phase3: [
    'It is crying. It has too many eyes for that to look right.',
    '"Please," it says. "Please. Please finish me."',
    '"I have been almost alive for four hundred years."',
  ],
  onDeath: [
    'It falls the way a child falls — all at once, no dignity, no weight to it.',
    'It looks up at you one last time.',
    '"Thank you," it says. "Thank you. Thank you. Thank you."',
    'Then it stops being almost alive, and it starts being almost dead, and then it is just dead.',
    'You do not know if you did something wrong. You do not think you did.',
  ],
  onPlayerDeath: [
    'It watches you fall.',
    'It does not gloat. It does not celebrate. It just keeps being almost alive, in a chamber that does not want it, waiting for the next one.',
    '"Will you finish me?" it asks.',
    'You cannot answer. You are already gone.',
  ],
};
