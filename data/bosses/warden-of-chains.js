// ============================================================
// THE WARDEN OF CHAINS — Act 10 boss (Veil)
//
// The Veil member who tends the Chained Beast. Not a fighter
// by trade — a handler. They have spent centuries learning
// exactly how much pain the Beast can take before it stops
// being useful. They are the one who pulls the chains.
//
// Passive: whenever the player kills one of their cards via
// Exhaust, they gain 8 Block. They do not waste anything.
// ============================================================

export const ENEMY = {
  id: 'warden-of-chains',
  name: 'The Warden of Chains',
  hp: 260,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.25 },
  deck: [
    'chain-lash',
    'bind',
    'discipline',
    'chain-lash',
    'tighten',
    'crack',
  ],
  passives: {
    blockOnExhaust: 8,
  },
};

export const CARDS = {
  'chain-lash': {
    id: 'chain-lash', name: 'Chain Lash', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 14 damage.',
    effects: [{ kind: 'damage', amount: 14 }],
  },
  bind: {
    id: 'bind', name: 'Bind', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 2 Weak and 1 Vulnerable.',
    effects: [
      { kind: 'applyStatus', status: 'weak', amount: 2 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 1 },
    ],
  },
  discipline: {
    id: 'discipline', name: 'Discipline', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 18 Block.',
    effects: [{ kind: 'block', amount: 18 }],
  },
  tighten: {
    id: 'tighten', name: 'Tighten', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage three times. Apply 1 Weak.',
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
      { kind: 'applyStatus', status: 'weak', amount: 1 },
    ],
  },
  crack: {
    id: 'crack', name: 'Crack', cost: 1, owner: 'enemy',
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
    'Someone is standing in the far doorway with a chain in each hand.',
    'They are not a fighter. You can tell by the way they stand — the way a person stands when they are used to holding a leash, not a weapon.',
    'They have been tending the Beast for centuries. They know exactly how much it can take. They know exactly how much you can take, too. They have read the reports.',
    '"You are not going to free it," they say. "No one is going to free it. I have been its warden for four hundred years. I am not going to lose it to a scavenger."',
    'They pull the chains. They are coming for you themselves now.',
  ],
  phase2: [
    'They are still holding the chains. They are still pulling.',
    '"You do not understand what is down here," they say. "You think you are here to take something. There is nothing to take. There is only what has to be held."',
    '"I am not the villain. I am the lock."',
  ],
  phase3: [
    'The chains are slipping.',
    '"I will not be the one who lost it," they say. "I will not be the one who let the beast go."',
    '"There have been seven of me. Seven wardens. Every one of them said the same thing."',
    '"I am not going to be the eighth."',
  ],
  onDeath: [
    'They fall. The chains fall with them.',
    'For a moment, from somewhere behind them, you hear the Beast. It is not roaring. It is not even moving.',
    'It is just — quiet. For the first time in a thousand years.',
    'You step over the warden and go find it.',
  ],
  onPlayerDeath: [
    'They chain you to the wall.',
    'Not the Beast. You. They do not need you to be a beast. They just need you not to be able to leave.',
    '"You will hold for a while," they say. "Everyone holds for a while."',
    'They walk away. They have a beast to feed.',
  ],
};
