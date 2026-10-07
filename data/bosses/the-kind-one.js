// ============================================================
// THE KIND ONE — Act 2 boss (Absorbed)
//
// An Asteri scholar who was home when the machine took everyone.
// She leaked back out of it centuries later, half-crazy, and has
// been wandering the ruins ever since. She does not want to
// fight. She apologizes with every strike.
//
// Passive: heals herself when the player skips a turn.
// ============================================================

export const ENEMY = {
  id: 'the-kind-one',
  name: 'The Kind One',
  hp: 140,
  isBoss: true,
  phaseThresholds: { phase2: 0.5 },
  deck: [
    'kind-word',
    'gentle-rebuke',
    'im-sorry',
    'kind-word',
    'please-stop',
  ],
  passives: {
    healOnPlayerSkip: 8,
  },
};

export const CARDS = {
  'kind-word': {
    id: 'kind-word', name: 'Kind Word', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 10 damage. Apply 1 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 1 },
    ],
  },
  'gentle-rebuke': {
    id: 'gentle-rebuke', name: 'Gentle Rebuke', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 8 damage. Apply 2 Weak.',
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'applyStatus', status: 'weak', amount: 2 },
    ],
  },
  'im-sorry': {
    id: 'im-sorry', name: "I'm Sorry", cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 12 Block. Heal 10 HP.',
    effects: [
      { kind: 'block', amount: 12 },
      { kind: 'heal', amount: 10 },
    ],
  },
  'please-stop': {
    id: 'please-stop', name: 'Please Stop', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 16 damage. She loses 8 HP.',
    effects: [
      { kind: 'damage', amount: 16 },
      { kind: 'loseHpSelf', amount: 8 },
    ],
  },
};

export const LORE = {
  start: [
    'A woman is sitting against the wall of the chamber when you enter.',
    'She is not holding a weapon. She is not in a fighting stance. She is not doing anything at all — just sitting, with her hands in her lap, looking at the floor.',
    'She looks up when you step in.',
    '"Oh," she says. "Oh, no. Not another one."',
    'She stands. Slowly. Like it hurts.',
    '"I do not want to do this. I have never wanted to do this. But I cannot stop, and you will not leave, and so we are going to do this."',
    '"I am sorry. I am so sorry."',
  ],
  phase2: [
    'She is crying now. She has been crying for most of the fight. Her hands are shaking.',
    '"I was a scholar. I studied the deep places. I was home when it happened. I was home."',
    '"The machine took me and then it forgot about me and then it let me go and I have been walking ever since."',
    '"Please. Please just go."',
  ],
  onDeath: [
    'She does not fall like a monster.',
    'She sits down again, against the wall, the way she was sitting when you came in.',
    '"Thank you," she says. "I have wanted to stop for a very long time."',
    'She closes her eyes.',
    'She does not open them.',
    'You sit with her for a while. Longer than you need to. Then you keep going.',
  ],
  onPlayerDeath: [
    'She does not look pleased.',
    'She kneels beside you. She checks your pulse. She closes your eyes.',
    '"I am sorry," she says, to no one in particular. "I am so sorry."',
    'Then she walks on. She has been walking for a very long time. She will keep walking.',
  ],
};
