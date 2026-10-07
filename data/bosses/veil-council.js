// ============================================================
// THE VEIL COUNCIL — Act 13 boss (Veil)
//
// The three leaders of the modern Veil, fighting together.
// Two fight. One commands. They have been running the
// organization since before the player was born, and they
// have never been in the same room as an enemy before.
//
// Design: three enemies in one encounter. The Speaker buffs.
// The Blade and the Mind attack. The fight ends when all
// three are dead.
// ============================================================

export const ENEMY = {
  id: 'veil-council',
  name: 'The Veil Council',
  hp: 300,
  isBoss: true,
  phaseThresholds: { phase2: 0.5, phase3: 0.2 },
  deck: [
    'council-order',
    'blade-strike',
    'mind-fray',
    'council-order',
    'blade-strike',
    'mind-fray',
  ],
};

export const CARDS = {
  'council-order': {
    id: 'council-order', name: 'Council Order', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 3 Strength. Gain 15 Block.',
    effects: [
      { kind: 'applyStatus', status: 'strength', amount: 3 },
      { kind: 'block', amount: 15 },
    ],
  },
  'blade-strike': {
    id: 'blade-strike', name: 'Blade Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 18 damage.',
    effects: [{ kind: 'damage', amount: 18 }],
  },
  'mind-fray': {
    id: 'mind-fray', name: 'Mind Fray', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Disable 2 random cards in your hand. Apply 1 Weak.',
    effects: [
      { kind: 'disableRandomHand', amount: 2 },
      { kind: 'applyStatus', status: 'weak', amount: 1 },
    ],
  },
};

export const LORE = {
  start: [
    'Three people are standing in the chamber. They are not fighters.',
    'They are old. All three of them are old. They have been old for a very long time, kept alive by Script that should not exist, waiting for something worth coming out of hiding for.',
    'The one in the center does the talking. The one on the left does the fighting. The one on the right does the thinking.',
    '"You have done remarkably well," the Speaker says. "You have done better than the last one. You have done better than the one before that."',
    '"That is why we came ourselves."',
  ],
  phase2: [
    'The Blade is bleeding. The Mind is gasping. The Speaker is still talking.',
    '"We are not the Veil you have been taught to fear," the Speaker says. "We are not the faction that broke the seal. We are what is left of it, a thousand years later, still trying to save a world that does not want to be saved."',
    '"The world is dying. The core is broken. Someone has to hold it together. We are the only ones who have ever tried."',
  ],
  phase3: [
    'The Speaker is the last one standing, and the Speaker is not a fighter.',
    '"You think we are the villains," the Speaker says. "Perhaps we are. The gardener made a gift and we broke it, and now we are trying to put it back together, and the only way to put it back together is to break a few more things."',
    '"That is what it costs. That is what it has always cost."',
  ],
  onDeath: [
    'The Speaker falls first, mid-sentence. The Blade falls next, without a sound. The Mind falls last, still trying to think of something.',
    'The chamber is quiet.',
    'Three old people, dead on the floor, who thought they were saving the world.',
    'You do not know if they were. You do not think they knew either.',
    'You keep going.',
  ],
  onPlayerDeath: [
    'The Council does not take your fragments. They have learned, over a thousand years, that they cannot.',
    'They stand over your body the way a committee stands over a failed proposal.',
    '"Unfortunate," the Speaker says. "The next one, then."',
    'They walk away.',
  ],
};
