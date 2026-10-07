// ============================================================
// THE CLAIMANT KING — Act 12 boss (Surface intruder)
//
// The champion of a surface kingdom. Sent down by a monarch
// who has heard that someone else is about to reach the
// fragments first. He is not a monster. He is a soldier on a
// mission. He will tell you so.
//
// Passive: 40% resistance to physical damage. Full plate.
// ============================================================

export const ENEMY = {
  id: 'claimant-king',
  name: 'The Claimant King',
  hp: 340,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.3 },
  deck: [
    'royal-edict',
    'plate-guard',
    'kings-sentence',
    'royal-edict',
    'stand-fast',
    'final-decree',
  ],
  passives: {
    resistPhysical: 0.4,
  },
};

export const CARDS = {
  'royal-edict': {
    id: 'royal-edict', name: 'Royal Edict', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 18 damage.',
    effects: [{ kind: 'damage', amount: 18 }],
  },
  'plate-guard': {
    id: 'plate-guard', name: 'Plate Guard', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 22 Block.',
    effects: [{ kind: 'block', amount: 22 }],
  },
  'kings-sentence': {
    id: 'kings-sentence', name: "King's Sentence", cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 10 damage twice. Apply 2 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'damage', amount: 10 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2 },
    ],
  },
  'stand-fast': {
    id: 'stand-fast', name: 'Stand Fast', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 4 Strength. Gain 10 Block.',
    effects: [
      { kind: 'applyStatus', status: 'strength', amount: 4 },
      { kind: 'block', amount: 10 },
    ],
  },
  'final-decree': {
    id: 'final-decree', name: 'Final Decree', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 30 damage.',
    effects: [{ kind: 'damage', amount: 30 }],
  },
};

export const LORE = {
  start: [
    'He is standing at attention in the middle of the corridor, in full plate, with a sealed writ in his hand.',
    'He is not an explorer. He is not a scavenger. He is a soldier, and he has been sent here by someone who outranks you.',
    '"You are the one carrying the fragments," he says. "My king has issued a writ of claim. The fragments are property of the crown."',
    'He does not smile. He does not sneer. He is not doing this because he wants to. He is doing this because he was ordered to.',
    '"You can hand them over. You can walk away. Or we can do this the way it usually goes."',
  ],
  phase2: [
    'He is bleeding under the plate. He has not dropped the writ.',
    '"You are making this harder than it has to be," he says. "It is not personal. It was never personal."',
    '"It is a claim. It is a crown. It is the way the world has always worked."',
  ],
  phase3: [
    'He is on one knee. He is still holding the writ. He is still holding his sword.',
    '"The king —" he starts.',
    'He does not finish. He has run out of things to say about the king.',
  ],
  onDeath: [
    'He falls.',
    'The writ falls with him. It lands face-up, and you can read the seal: the mark of a kingdom you have never visited, ruled by a monarch you will never meet, who sent this man to die in a hole for pieces of a god.',
    'You do not pick up the writ. You do not need it.',
    'You keep going.',
  ],
  onPlayerDeath: [
    'He does not take your fragments. He cannot — he learned that the hard way years ago, the first time he tried to claim one.',
    'He simply stands over you with the writ until you stop moving.',
    '"For the crown," he says, without conviction.',
    'Then he reports his failure to a king who will not read the report.',
  ],
};
