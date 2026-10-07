// ============================================================
// THE GARDENER'S ECHO — Act 12 boss (dormant divine remnant)
//
// Not the gardener. The gardener is asleep, 8,500 years from
// waking. This is a fragment of its attention — a shard of
// awareness that split off during the creation of the core and
// has been sitting in the deep vaults ever since.
//
// It is not hostile. It is not helpful. It is not really
// anything a person would recognize as a mind. It is a
// question that has been waiting for someone to answer it.
//
// Passive: immune to Vulnerable. You cannot make it feel
// what it does not have.
// ============================================================

export const ENEMY = {
  id: 'gardeners-echo',
  name: "The Gardener's Echo",
  hp: 300,
  isBoss: true,
  phaseThresholds: { phase2: 0.5 },
  deck: [
    'old-light',
    'ask',
    'old-light',
    'wait',
    'wonder',
  ],
  passives: {
    immuneVulnerable: true,
  },
};

export const CARDS = {
  'old-light': {
    id: 'old-light', name: 'Old Light', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 16 damage.',
    effects: [{ kind: 'damage', amount: 16 }],
  },
  ask: {
    id: 'ask', name: 'Ask', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage twice. Apply 2 Weak.',
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
      { kind: 'applyStatus', status: 'weak', amount: 2 },
    ],
  },
  wait: {
    id: 'wait', name: 'Wait', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 25 Block.',
    effects: [{ kind: 'block', amount: 25 }],
  },
  wonder: {
    id: 'wonder', name: 'Wonder', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 12 damage three times.',
    effects: [
      { kind: 'damage', amount: 12 },
      { kind: 'damage', amount: 12 },
      { kind: 'damage', amount: 12 },
    ],
  },
};

export const LORE = {
  start: [
    'There is light in the deep vault, and the light is old.',
    'It has been here since before the city. It has been here since before the mountain was hollowed. It has been here since the gardener made the core and sealed it and went to sleep.',
    'It is not the gardener. It is a shard of the gardener\'s attention — the part of its mind that was watching when it created the core, left behind when the gardener withdrew.',
    'It has been sitting in this vault for a very long time, waiting for someone to ask it a question.',
    'It does not have a mouth. It has never needed one.',
    'It asks you one instead.',
  ],
  phase2: [
    'The light is brighter. The question is louder.',
    'It is not attacking you. It is testing you. It wants to know what kind of thing you are. It has not had anything to compare against in a thousand years.',
    'Every strike you make, it watches. Every strike you take, it watches.',
  ],
  onDeath: [
    'The light dims.',
    'Not all the way. It cannot go all the way — the gardener is not dead, only sleeping, and this is a piece of the gardener.',
    'It leaves a small warmth in the air, the way a room stays warm after a fire has gone out.',
    'You take the warmth with you. You do not know what to do with it. You keep it anyway.',
  ],
  onPlayerDeath: [
    'It does not kill you. It cannot — it does not have the capacity.',
    'It simply watches you die, the way it has watched everything for a thousand years. It does not intervene. It was never built to.',
    'When you are gone, it goes back to waiting. It does not know what else to do.',
  ],
};
