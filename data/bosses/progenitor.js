// ============================================================
// THE PROGENITOR — Act 11 boss (Absorbed)
//
// The Asteri researcher who first discovered the seal. Not
// the machine's builder — the one who found the anomaly, wrote
// the first paper, and spent the rest of his life trying to
// make sure nobody opened it. He was ignored. He was right.
//
// Passive: gains 2 Strength whenever the player applies a
// debuff to him. He has learned to absorb suffering.
// ============================================================

export const ENEMY = {
  id: 'progenitor',
  name: 'The Progenitor',
  hp: 320,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.3 },
  deck: [
    'old-warning',
    'regret',
    'sealed-fist',
    'old-warning',
    'i-told-them',
    'burden',
  ],
  passives: {
    strengthOnDebuff: 2,
  },
};

export const CARDS = {
  'old-warning': {
    id: 'old-warning', name: 'Old Warning', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 16 damage.',
    effects: [{ kind: 'damage', amount: 16 }],
  },
  regret: {
    id: 'regret', name: 'Regret', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 20 Block.',
    effects: [{ kind: 'block', amount: 20 }],
  },
  'sealed-fist': {
    id: 'sealed-fist', name: 'Sealed Fist', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 10 damage twice. Apply 1 Weak.',
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'damage', amount: 10 },
      { kind: 'applyStatus', status: 'weak', amount: 1 },
    ],
  },
  'i-told-them': {
    id: 'i-told-them', name: 'I Told Them', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 4 Strength.',
    effects: [{ kind: 'applyStatus', status: 'strength', amount: 4 }],
  },
  burden: {
    id: 'burden', name: 'Burden', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 28 damage. The Progenitor loses 8 HP.',
    effects: [
      { kind: 'damage', amount: 28 },
      { kind: 'loseHpSelf', amount: 8 },
    ],
  },
};

export const LORE = {
  start: [
    'He is standing in front of a wall covered in his own handwriting.',
    'He has been writing on it for a thousand years. It is the same paragraph, over and over. You cannot read Asteri, but you can recognize the shape of a warning.',
    'He turns when you enter.',
    '"You are here for the fragments," he says. "Everyone is here for the fragments."',
    '"I wrote the first paper on the anomaly. I told them not to touch it. I told them it was sealed for a reason. I told them for forty years."',
    '"And then they touched it."',
  ],
  phase2: [
    'He is not slowing down.',
    '"You think I am angry at you? I am not angry at you. I am angry at them. I am angry at every scholar, every official, every Veil member who read my paper and decided they knew better."',
    '"I was right. I have been right for a thousand years. Being right did not save anyone."',
  ],
  phase3: [
    'He is almost done.',
    '"When you get to the bottom — when you find what is left of them — tell them I was right."',
    '"It will not help. It will not fix anything. I want it anyway."',
  ],
  onDeath: [
    'He falls against the wall.',
    'The paragraph he was writing runs out halfway through a word. He does not finish it.',
    '"I was right," he says, one last time.',
    'Then he is gone.',
    'You leave the wall where it is. Some warnings should stay unfinished.',
  ],
  onPlayerDeath: [
    'He does not take your fragments. He cannot.',
    'He watches them scatter, the way he has watched every set scatter before yours.',
    '"I told you," he says, to no one in particular. "I told all of you."',
    'Then he goes back to writing on the wall.',
  ],
};
