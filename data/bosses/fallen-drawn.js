// ============================================================
// THE FALLEN DRAWN — Act 3 boss
//
// A previous century's hero, consumed by the Core and turned
// back against the world. Uses corrupted versions of the same
// cards you do — echoing what a Drawn becomes if they fail.
//
// Passive: takes 50% less damage from Spells.
// ============================================================

export const ENEMY = {
  id: 'fallen-drawn',
  name: 'The Fallen Drawn',
  hp: 220,
  isBoss: true,
  phaseThresholds: { phase2: 0.5, phase3: 0.2 },
  deck: [
    'drawn-strike',
    'drawn-guard',
    'drawn-fracture',
    'drawn-siphon',
    'drawn-resonate',
    'drawn-strike',
    'drawn-fracture',
    'drawn-guard',
  ],
  passives: {
    resistSpell: 0.5,
  },
};

export const CARDS = {
  'drawn-strike': {
    id: 'drawn-strike', name: 'Desperate Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 18 damage.',
    effects: [{ kind: 'damage', amount: 18 }],
  },
  'drawn-guard': {
    id: 'drawn-guard', name: 'Hollow Guard', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 12 Block. Gain 2 Strength.',
    effects: [
      { kind: 'block', amount: 12 },
      { kind: 'applyStatus', status: 'strength', amount: 2 },
    ],
  },
  'drawn-fracture': {
    id: 'drawn-fracture', name: 'Fractured Blow', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 8 damage twice.',
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'damage', amount: 8 },
    ],
  },
  'drawn-resonate': {
    id: 'drawn-resonate', name: 'Resonate', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 3 Strength.',
    effects: [{ kind: 'applyStatus', status: 'strength', amount: 3 }],
  },
  'drawn-siphon': {
    id: 'drawn-siphon', name: 'Siphon', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage. Exhaust 1 random card in your hand.',
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'exhaustRandomHand', amount: 1 },
    ],
  },
};

export const LORE = {
  start: [
    'The corridor opens onto a figure sitting alone in the dark.',
    'Once a hero. Once a Drawn.',
    'Their deck lies scattered on the floor around them — every card the same as yours, but wrong. Burnt at the edges. Long since given up.',
    'They lift their head.',
    '"You came," they say. "I did not."',
    '"Do not stop where I stopped."',
    'They stand. Their cards rise with them.',
  ],
  phase2: [
    'Their light flickers. For a moment — just a moment — they look human again.',
    '"I had a family," they say. "I had a village. I had a name."',
    '"The Core took all of it. And then it took me."',
    '"I am sorry."',
  ],
  phase3: [
    'They are almost gone.',
    '"Faster," they whisper. "End it faster than I could."',
    '"Do not let it finish what it started."',
  ],
  onDeath: [
    'They fall slowly. Almost gratefully.',
    '"Finish it," they whisper.',
    '"Finish what I could not."',
    'You take their cards. You do not look back.',
  ],
  onPlayerDeath: [
    'The Fallen Drawn watches you fall.',
    'For a moment, something like grief crosses their face.',
    '"I am sorry," they say again.',
    '"I will remember you. The Core remembers everyone. That is the only mercy it has left."',
    'But your hand closes around the amulet at your chest.',
    'It is warm. It has always been warm.',
    'It pulls you back.',
  ],
};
