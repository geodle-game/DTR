// ============================================================
// THE FIRST ECHO — Act 6 boss (Spawned)
//
// The first thing the machine spawned after the Disappearance.
// It has been alive for a thousand years. It has grown the
// whole time.
//
// Passive: gains 2 Strength at the start of every turn.
// ============================================================

export const ENEMY = {
  id: 'first-echo',
  name: 'The First Echo',
  hp: 240,
  isBoss: true,
  phaseThresholds: { phase2: 0.5, phase3: 0.2 },
  deck: [
    'ancient-strike',
    'remembered-wounds',
    'echo-of-the-first',
    'ancient-strike',
    'coalesce',
  ],
  passives: {
    strengthPerTurn: 2,
  },
};

export const CARDS = {
  'ancient-strike': {
    id: 'ancient-strike', name: 'Ancient Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 12 damage.',
    effects: [{ kind: 'damage', amount: 12 }],
  },
  'remembered-wounds': {
    id: 'remembered-wounds', name: 'Remembered Wounds', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 7 damage twice. Apply 1 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 7 },
      { kind: 'damage', amount: 7 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 1 },
    ],
  },
  'echo-of-the-first': {
    id: 'echo-of-the-first', name: 'Echo of the First', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 10 Block. Gain 2 Strength.',
    effects: [
      { kind: 'block', amount: 10 },
      { kind: 'applyStatus', status: 'strength', amount: 2 },
    ],
  },
  coalesce: {
    id: 'coalesce', name: 'Coalesce', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 8 Block.',
    effects: [{ kind: 'block', amount: 8 }],
  },
};

export const LORE = {
  start: [
    'It has been here since the day the seal broke.',
    'It was the first thing the machine made after the Disappearance. It has been alive for a thousand years. It has been growing the whole time.',
    'It does not look like much at first. Then you realize how much of the corridor it fills.',
    'It has learned the shape of every chamber in this district. It has learned the rhythm of footsteps. It has been waiting for a very long time for a footstep that was not its own.',
    'It uncurls.',
  ],
  phase2: [
    'It is not slowing down. It is getting bigger.',
    'Every wound you give it closes almost before you finish the swing. It is remembering how to be whole.',
    'It was the first. It has had the most practice.',
  ],
  phase3: [
    'It is dying. It does not know how.',
    'It has never died before. It has never had to. It has watched a thousand explorers die, but it has never once been the one on the ground.',
    'It is learning something new. It does not like it.',
  ],
  onDeath: [
    'It stops growing.',
    'For the first time in a thousand years, the corridor is only as big as it looks.',
    'You stand there for a moment, in the silence, and then you keep going.',
  ],
  onPlayerDeath: [
    'It does not eat you.',
    'It does not need to. It simply folds itself around you, the way a blanket folds around a sleeper, and it waits.',
    'It has waited a thousand years. It can wait a little longer.',
  ],
};
