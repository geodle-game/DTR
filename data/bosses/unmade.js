// ============================================================
// THE UNMADE — Act 11 boss (Spawned)
//
// A Spawned that the machine started building and then
// abandoned. It has been sitting in the lower vaults for
// centuries, half-assembled, half-aware, waiting for a
// completion that is never coming.
//
// Passive: regenerates 5 HP per turn. The machine is still
// technically building it. It just is not paying attention.
// ============================================================

export const ENEMY = {
  id: 'unmade',
  name: 'The Unmade',
  hp: 280,
  isBoss: true,
  phaseThresholds: { phase2: 0.5, phase3: 0.2 },
  deck: [
    'half-built',
    'incomplete',
    'scrap',
    'half-built',
    'still-trying',
    'come-apart',
  ],
  passives: {
    regen: 5,
  },
};

export const CARDS = {
  'half-built': {
    id: 'half-built', name: 'Half-Built', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 12 damage.',
    effects: [{ kind: 'damage', amount: 12 }],
  },
  incomplete: {
    id: 'incomplete', name: 'Incomplete', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 16 Block.',
    effects: [{ kind: 'block', amount: 16 }],
  },
  scrap: {
    id: 'scrap', name: 'Scrap', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 7 damage three times.',
    effects: [
      { kind: 'damage', amount: 7 },
      { kind: 'damage', amount: 7 },
      { kind: 'damage', amount: 7 },
    ],
  },
  'still-trying': {
    id: 'still-trying', name: 'Still Trying', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 3 Strength. Heal 15 HP.',
    effects: [
      { kind: 'applyStatus', status: 'strength', amount: 3 },
      { kind: 'heal', amount: 15 },
    ],
  },
  'come-apart': {
    id: 'come-apart', name: 'Come Apart', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 26 damage. The Unmade loses 10 HP.',
    effects: [
      { kind: 'damage', amount: 26 },
      { kind: 'loseHpSelf', amount: 10 },
    ],
  },
};

export const LORE = {
  start: [
    'It is standing in the middle of the vault, and it is not finished.',
    'You can see the parts of it that the machine got to. You can see the parts it did not. There are gaps. There are edges that do not join. There is a face that has been started and never closed.',
    'It has been standing here for six hundred years, waiting for the next stage of its construction.',
    'The next stage is not coming. The machine forgot about it four centuries ago.',
    'It sees you.',
    '"Help," it says. Not as a plea. As a status report.',
  ],
  phase2: [
    'It is trying to finish itself mid-fight. It is reaching for pieces of its own body and pressing them into places they do not quite fit.',
    '"Almost," it says. "Almost."',
    'It has been saying that for six hundred years.',
  ],
  phase3: [
    'It is falling apart faster than it can hold itself together.',
    '"Wait," it says. "Wait. I am almost done."',
    'It is not almost done. It has never been almost done.',
  ],
  onDeath: [
    'It comes apart.',
    'The pieces that never quite fit fall away first, then the pieces that did, then the pieces that were only pretending to.',
    'The last thing to go is the unfinished face. For just a moment, before it does, it looks almost like a person.',
    'Then it does not.',
  ],
  onPlayerDeath: [
    'It does not kill you. It tries to add you to itself.',
    'You feel its hands — the ones it has, and the ones it is still growing — closing around you, pressing you into gaps that do not fit you.',
    'You are not the right shape. Nothing is the right shape.',
    'It keeps trying anyway.',
  ],
};
