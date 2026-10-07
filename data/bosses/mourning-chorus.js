// ============================================================
// THE MOURNING CHORUS — Act 9 boss (Absorbed)
//
// A group of Asteri mourners who were mid-funeral when the
// machine took them. Their grief has echoed for a thousand
// years. They have not stopped. They cannot stop. They do not
// want to stop.
//
// Passive: whenever it takes damage, it applies 1 Weak to the
// player. Grief is contagious.
// ============================================================

export const ENEMY = {
  id: 'mourning-chorus',
  name: 'The Mourning Chorus',
  hp: 240,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.3 },
  deck: [
    'keening',
    'lament',
    'dirge',
    'keening',
    'requiem',
  ],
  passives: {
    weakenOnHurt: 1,
  },
};

export const CARDS = {
  keening: {
    id: 'keening', name: 'Keening', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 9 damage. Apply 1 Weak.',
    effects: [
      { kind: 'damage', amount: 9 },
      { kind: 'applyStatus', status: 'weak', amount: 1 },
    ],
  },
  lament: {
    id: 'lament', name: 'Lament', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 3 Weak.',
    effects: [{ kind: 'applyStatus', status: 'weak', amount: 3 }],
  },
  dirge: {
    id: 'dirge', name: 'Dirge', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 5 damage four times.',
    effects: [
      { kind: 'damage', amount: 5 },
      { kind: 'damage', amount: 5 },
      { kind: 'damage', amount: 5 },
      { kind: 'damage', amount: 5 },
    ],
  },
  requiem: {
    id: 'requiem', name: 'Requiem', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 24 damage.',
    effects: [{ kind: 'damage', amount: 24 }],
  },
};

export const LORE = {
  start: [
    'You hear them before you see them. You have heard them for three floors.',
    'The song is not a song. It is a funeral. Someone is being mourned. Someone has been being mourned for a thousand years.',
    'You turn the corner and you see them: a row of Asteri, in mourning clothes, standing in a ring around a body that is not there. They are singing.',
    'They have been standing here since before the Disappearance. They were standing here when the machine took them. They did not stop. They cannot stop.',
    'One of them turns to look at you. She does not stop singing. She just — includes you.',
  ],
  phase2: [
    'The song is changing. It is changing to include you.',
    'You do not want to be included. You can feel it happening anyway. The grief is a hook and it is finding the soft parts of you.',
    'They are not attacking you. They are mourning you. They have decided you are already dead. They are simply catching up.',
  ],
  phase3: [
    'The ring has broken. They are singing at you now, all of them, a hundred voices, one song.',
    '"We are so sorry," the song says. "We are so sorry. We are so sorry. We are so sorry."',
    'They mean it. That is the worst part.',
  ],
  onDeath: [
    'The song stops.',
    'One by one, the Asteri fall. They do not fight it. They do not try to stop falling. They have been waiting to stop singing for a thousand years.',
    'The last one — the one who noticed you — looks at you as she falls.',
    '"Thank you," she says. "You may stop mourning now."',
    'You do not. You will not for a long time.',
  ],
  onPlayerDeath: [
    'The song does not change.',
    'You simply join it. Your voice is added to the chorus. You are being mourned now, the way everyone else in the ring is being mourned.',
    'You do not stop. You cannot stop.',
    'They have been singing for a thousand years. They will keep singing for a thousand more.',
  ],
};
