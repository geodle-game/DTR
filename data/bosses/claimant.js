// ============================================================
// THE CLAIMANT — Act 5 boss (Surface intruder)
//
// A rival explorer. Not a monster. Not a Veil agent. Just
// another person sent down to find the fragments.
//
// Passive: gains 5 Block whenever it heals.
// ============================================================

export const ENEMY = {
  id: 'claimant',
  name: 'The Claimant',
  hp: 220,
  isBoss: true,
  phaseThresholds: { phase2: 0.5 },
  deck: [
    'claim-stake',
    'desperate-gambit',
    'riposte',
    'backup',
    'trick-shot',
    'claim-stake',
    'riposte',
  ],
};

export const CARDS = {
  'claim-stake': {
    id: 'claim-stake', name: 'Claim Stake', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 14 damage.',
    effects: [{ kind: 'damage', amount: 14 }],
  },
  'desperate-gambit': {
    id: 'desperate-gambit', name: 'Desperate Gambit', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 20 damage. The Claimant loses 6 HP.',
    effects: [
      { kind: 'damage', amount: 20 },
      { kind: 'loseHpSelf', amount: 6 },
    ],
  },
  riposte: {
    id: 'riposte', name: 'Riposte', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 10 damage. Gain 6 Block.',
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'block', amount: 6 },
    ],
  },
  backup: {
    id: 'backup', name: 'Backup', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Heal 12 HP. Gain 2 Strength.',
    effects: [
      { kind: 'heal', amount: 12 },
      { kind: 'applyStatus', status: 'strength', amount: 2 },
    ],
  },
  'trick-shot': {
    id: 'trick-shot', name: 'Trick Shot', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 8 damage. Apply 2 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2 },
    ],
  },
};

export const LORE = {
  start: [
    'Someone else made it this far.',
    'They are standing in the corridor with a deck in one hand and a knife in the other. Their pack is heavy. Their coat has seen better days. They are not much older than you.',
    'They look at the cards in your hand.',
    '"You seen to have strong cards too," they say. "Good. I can pry some good loot off your dead body."',
    'They do not wait for you to respond.',
  ],
  phase2: [
    'They are bleeding. They are still standing.',
    '"You are better than I thought. The bounty said you were a beginner."',
    '"The bounty was wrong."',
    'They wipe their mouth with the back of their hand.',
    '"Fine. Let us do this properly."',
  ],
  onDeath: [
    'They fall.',
    'They do not curse you. They do not swear revenge. They just lie there, looking up at the ceiling of a city neither of you was supposed to reach.',
    '"Make it to do end for me, will you?," they say. ',
    'It is not a question.',
    'You look away. You keep going.',
  ],
  onPlayerDeath: [
    'They stand over you for a long time.',
    'They do not take your fragment. They do not take your deck. They just look at you, the way you might look at a version of yourself you almost became.',
    '"Sorry," they say.',
    'Then they walk on. Someone had to.',
  ],
};
