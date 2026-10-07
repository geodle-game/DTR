// ============================================================
// THE DEEP KEEPER — Act 14 boss (Wild / something older)
//
// Something that was here before the mountain. Something that
// was here before the gardener made the core. Something that
// lives in the chamber the seal was built over, and that has
// been waiting, without language, without memory, without
// purpose, for the seal to break so it can do what it was
// made to do.
//
// It is not a servant of the gardener. It is not a servant of
// the Veil. It is not a servant of anything. It is a thing
// whose only purpose is to be present at the end of the world.
//
// Passive: gains 1 Strength per turn, does not decay.
// ============================================================

export const ENEMY = {
  id: 'deep-keeper',
  name: 'The Deep Keeper',
  hp: 380,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.3 },
  deck: [
    'pale-touch',
    'hold-of-old',
    'the-waiting',
    'pale-touch',
    'what-comes-next',
    'hold-of-old',
  ],
  passives: {
    strengthPerTurn: 2,
  },
};

export const CARDS = {
  'pale-touch': {
    id: 'pale-touch', name: 'Pale Touch', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 20 damage.',
    effects: [{ kind: 'damage', amount: 20 }],
  },
  'hold-of-old': {
    id: 'hold-of-old', name: 'Hold of Old', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 24 Block.',
    effects: [{ kind: 'block', amount: 24 }],
  },
  'the-waiting': {
    id: 'the-waiting', name: 'The Waiting', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 3 Weak and 3 Vulnerable.',
    effects: [
      { kind: 'applyStatus', status: 'weak', amount: 3 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 3 },
    ],
  },
  'what-comes-next': {
    id: 'what-comes-next', name: 'What Comes Next', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 12 damage three times.',
    effects: [
      { kind: 'damage', amount: 12 },
      { kind: 'damage', amount: 12 },
      { kind: 'damage', amount: 12 },
    ],
  },
};

export const LORE = {
  start: [
    'The chamber below the machine is older than the machine. Older than the city. Older than the mountain.',
    'The seal was built here because this is where the core needed to be kept, and the core needed to be kept here because this is where the deep thing lives.',
    'It does not have a name. It does not have a shape you can describe. It has been waiting here since before the gardener made the world.',
    'It has been waiting for the seal to break. The seal has broken. It has not yet done anything. It is still deciding.',
    'You walk into the chamber and it decides.',
  ],
  phase2: [
    'It is not fighting you. It is testing whether you are the world it was supposed to judge.',
    'It does not speak. It does not need to. You can feel the question anyway: is this what the gardener made? Is this what became of the gift?',
    'You do not have an answer.',
  ],
  phase3: [
    'It has decided.',
    'Not yet. It has decided not yet. The world is not ready to be ended. The world is not ready to be saved either.',
    'It will wait longer. It has been waiting since before there was time. It can wait.',
    'But first, it wants to know if you can be the one who decides.',
  ],
  onDeath: [
    'It does not die. It subsides.',
    'The thing in the chamber sinks back into the deep, the way a stone sinks into mud, and the chamber is quiet, and you are alive.',
    'It has decided not to decide. Not today. Not for you.',
    'You do not know if you passed its test. You do not think the test was for you.',
    'You climb the stairs toward the researcher\'s chamber. There is nothing left in front of you but him.',
  ],
  onPlayerDeath: [
    'It does not kill you. It simply stops you.',
    'You feel yourself becoming very small, and very old, and very still.',
    'It has been waiting since before the world was made. It can wait for you to be gone.',
    'Then it goes back to deciding.',
  ],
};
