// ============================================================
// THE CHAINED BEAST — Act 10 boss (Wild / enslaved)
//
// A legendary Wild creature the Veil enslaved before the
// Collapse. Bound to the threshold by Script chains. It has
// been here for a thousand years. It does not want to fight.
// The binding will not let it stop.
//
// If the player frees it instead of killing it, it unlocks the
// Beastcaller class.
//
// Passive: retaliates with 3 damage whenever struck.
// ============================================================

export const ENEMY = {
  id: 'chained-beast',
  name: 'The Chained Beast',
  hp: 300,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.3 },
  deck: [
    'binding-thrash',
    'chain-drag',
    'old-fury',
    'binding-thrash',
    'pull-chain',
    'roar',
  ],
  passives: {
    retaliate: 3,
  },
};

export const CARDS = {
  'binding-thrash': {
    id: 'binding-thrash', name: 'Binding Thrash', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 8 damage twice.',
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'damage', amount: 8 },
    ],
  },
  'chain-drag': {
    id: 'chain-drag', name: 'Chain Drag', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 14 damage. Apply 1 Weak.',
    effects: [
      { kind: 'damage', amount: 14 },
      { kind: 'applyStatus', status: 'weak', amount: 1 },
    ],
  },
  'old-fury': {
    id: 'old-fury', name: 'Old Fury', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 20 damage. The Beast loses 5 HP.',
    effects: [
      { kind: 'damage', amount: 20 },
      { kind: 'loseHpSelf', amount: 5 },
    ],
  },
  'pull-chain': {
    id: 'pull-chain', name: 'Pull Chain', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 2 Vulnerable and 2 Weak.',
    effects: [
      { kind: 'applyStatus', status: 'vulnerable', amount: 2 },
      { kind: 'applyStatus', status: 'weak', amount: 2 },
    ],
  },
  roar: {
    id: 'roar', name: 'Roar', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 3 Strength. Gain 8 Block.',
    effects: [
      { kind: 'applyStatus', status: 'strength', amount: 3 },
      { kind: 'block', amount: 8 },
    ],
  },
};

export const LORE = {
  start: [
    'Something enormous is chained to the far wall of the chamber.',
    'It has been there for a thousand years. You can tell by the chains. They have worn grooves into the stone floor where it has been pulling.',
    'It is a Wild thing. Pre-Asteri. It has been alive longer than the city. It has been enslaved for most of that time.',
    'It does not attack you when you enter. It simply watches. There is something in its eyes that has not been a fighting animal for a very long time.',
    'The chains tighten. It flinches. It stands up.',
    'It does not want to do this.',
  ],
  phase2: [
    'It is fighting the chains now. Not you — the chains.',
    'Every swing it takes at you, it is really trying to swing at the binding around its throat. It cannot reach it. It has never been able to reach it.',
    '"Free me," it does not say, because it cannot speak. But you can hear it anyway.',
  ],
  phase3: [
    'It is almost out of strength. The chains are still holding.',
    'It is on its knees, and it is looking at you, and it is not attacking anymore. It cannot.',
    'The chains tighten one more time.',
  ],
  onDeath: [
    'It falls.',
    'The chains go slack. For the first time in a thousand years, nothing is pulling on them.',
    'You do not know if you killed it or if the chains did. You do not think the difference matters to it.',
    'You keep going.',
  ],
  onPlayerDeath: [
    'It does not kill you. The chains do.',
    'You feel them close around you, the same way they closed around it, and you feel yourself added to the binding.',
    'The Beast watches. There is pity in its eyes. It has had a very long time to learn that expression.',
  ],
};
