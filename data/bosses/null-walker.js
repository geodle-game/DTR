// ============================================================
// THE NULL-WALKER — Act 6 boss (Spawned)
//
// A Spawned that has spent centuries wandering the null-fields
// around the collapsed seal. The exposure has made it partly
// immaterial.
//
// Passive: 40% resistance to physical and spell damage.
// ============================================================

export const ENEMY = {
  id: 'null-walker',
  name: 'The Null-Walker',
  hp: 260,
  isBoss: true,
  phaseThresholds: { phase2: 0.5 },
  deck: [
    'flicker',
    'phase-strike',
    'void-whisper',
    'flicker',
    'phase-strike',
    'absence',
  ],
  passives: {
    resistPhysical: 0.4,
    resistSpell: 0.4,
  },
};

export const CARDS = {
  flicker: {
    id: 'flicker', name: 'Flicker', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 14 Block.',
    effects: [{ kind: 'block', amount: 14 }],
  },
  'phase-strike': {
    id: 'phase-strike', name: 'Phase Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 16 damage.',
    effects: [{ kind: 'damage', amount: 16 }],
  },
  'void-whisper': {
    id: 'void-whisper', name: 'Void Whisper', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 3 Weak.',
    effects: [{ kind: 'applyStatus', status: 'weak', amount: 3 }],
  },
  absence: {
    id: 'absence', name: 'Absence', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 10 damage. Apply 2 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2 },
    ],
  },
};

export const LORE = {
  start: [
    'You do not see it at first. The corridor is empty.',
    'Then you notice the air. It is not moving the way air should move. It is folding in on itself, in a shape that is almost a person.',
    'It resolves. Slowly. Enough of it, anyway.',
    'It is a Spawned. Or it was. The centuries have worn most of it away. What is left is barely matter and mostly will.',
    'It does not attack. It does not speak. It simply begins to drift toward you, the way water drifts toward a drain.',
  ],
  phase2: [
    'It is fading. The shape is coming apart at the edges.',
    'You can see through it now. You can see the wall behind it. You can see the wall behind the wall.',
    'It makes a sound — not a word, not a scream, just a sound. Like wind through a door that has not opened in a very long time.',
  ],
  onDeath: [
    'It comes apart.',
    'Not violently. Just — quietly. The shape stops holding itself and the air stops folding and then there is nothing in the corridor but you.',
    'You stand there for a moment, in the empty space where something was almost there.',
    'Then you keep going.',
  ],
  onPlayerDeath: [
    'It does not kill you. It does not need to.',
    'It drifts through you, the way fog drifts through a fence, and where it touches, you are less.',
    'You do not feel pain. You feel subtraction.',
  ],
};
