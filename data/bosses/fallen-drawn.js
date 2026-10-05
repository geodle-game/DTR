// ============================================================
// THE FALLEN DRAWN — Act 3 boss
//
// A previous century's explorer, consumed by the machine and
// turned back against the world. Uses corrupted versions of the
// same cards you do — echoing what an explorer becomes if they
// fail.
//
// Passive: takes 50% less damage from Spells.
// ============================================================

export const ENEMY = {
  id: 'fallen-drawn',
  name: 'The Fallen Explorer',
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
    'They have been here a very long time. Longer than you.',
    'Once they were an explorer, like you. Once they carried the same fragments you carry now.',
    'They lift their head. Something in their eyes is still human. Most of it is not.',
    '"I had a name," they say. "I do not remember it. Do you remember yours?"',
    '"It does not matter. What matters is that you do not stop where I stopped."',
    'They stand. The Script on their arms glows.',
  ],
  phase2: [
    'Their light flickers. For a moment — just a moment — they look like the person they were before the machine found them.',
    '"I made it to the bottom," they say. "I saw the researcher. I saw the chamber."',
    '"He asked me to stop. I did not."',
    '"The machine does not kill you. It keeps you. It uses you to find the next one."',
    '"That is what I am for now. I am the one who stands in the way."',
  ],
  phase3: [
    'They are almost gone.',
    '"Do not let it finish," they whisper. "Whatever it promises, do not listen."',
    '"When you reach the chamber — when it offers you the fragments back — say no."',
    '"I did not. That is the only reason I am still here."',
  ],
  onDeath: [
    'They fall slowly. Almost gratefully.',
    '"Take them," they say, meaning the fragments. "Take all of them."',
    '"And when you get to the bottom — finish it. Finish what I could not."',
    'The Script on their arms goes dark.',
    'You walk past them. You do not look back. There is no time.',
  ],
  onPlayerDeath: [
    'The Fallen Drawn watches you fall.',
    'For a moment, something like grief crosses their face.',
    '"I am sorry," they say. "I was sorry the last time too."',
    '""You will forget this."',
    '"You have done this before. You will do it again."',
  ],
};
