// ============================================================
// THE GATEKEEPER — Act 14 boss (Absorbed, willing)
//
// An Asteri who volunteered to stay behind. Not absorbed, not
// enslaved. When the machine took everyone, she asked it to
// take her too, so that the machine would have one soul inside
// it that was not a Veil member and not a victim.
//
// She has been the researcher's only ally inside the machine
// for a thousand years. She has been losing the same fight he
// has been losing, in a different room.
//
// She does not want to fight you. She has to. The machine
// makes her. But she also wants to test you.
//
// Passive: 30% resistance to physical damage. She has been
// training for a thousand years.
// ============================================================

export const ENEMY = {
  id: 'gatekeeper',
  name: 'The Gatekeeper',
  hp: 340,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.3 },
  deck: [
    'volunteer-strike',
    'long-vigil',
    'word-of-warning',
    'volunteer-strike',
    'the-test',
    'long-vigil',
  ],
  passives: {
    resistPhysical: 0.3,
  },
};

export const CARDS = {
  'volunteer-strike': {
    id: 'volunteer-strike', name: 'Volunteer Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 19 damage.',
    effects: [{ kind: 'damage', amount: 19 }],
  },
  'long-vigil': {
    id: 'long-vigil', name: 'Long Vigil', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 20 Block. Heal 5 HP.',
    effects: [
      { kind: 'block', amount: 20 },
      { kind: 'heal', amount: 5 },
    ],
  },
  'word-of-warning': {
    id: 'word-of-warning', name: 'Word of Warning', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Apply 3 Weak and 1 Vulnerable.',
    effects: [
      { kind: 'applyStatus', status: 'weak', amount: 3 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 1 },
    ],
  },
  'the-test': {
    id: 'the-test', name: 'The Test', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 14 damage twice.',
    effects: [
      { kind: 'damage', amount: 14 },
      { kind: 'damage', amount: 14 },
    ],
  },
};

export const LORE = {
  start: [
    'She is standing in front of the last door before the researcher\'s chamber, and she is blocking it.',
    'She is not a Veil member. She is not a Spawned. She is not one of the Absorbed. She is an Asteri — one of the last — and she is here on purpose.',
    '"I volunteered," she says. "When the machine took everyone, I asked it to take me too. So that there would be someone inside who was not a victim and not a Veil member."',
    '"I have been the researcher\'s only ally for a thousand years. I have been losing the same fight he has been losing, in a different room."',
    'She raises her deck.',
    '"I need to know if you are worth letting through. I am sorry. This is the only way I know how to test you."',
  ],
  phase2: [
    'She is bleeding. She is smiling.',
    '"Good," she says. "You are worth it. You are almost worth it."',
    '"Almost. Not quite. One more phase."',
  ],
  phase3: [
    'She is on one knee. She is still blocking the door.',
    '"You are going to make it," she says. "You are going to reach him. You are going to do what I could not do."',
    '"I need you to promise me something. When you get there — do not kill him. Whatever he looks like. Whatever he does. Do not kill him."',
  ],
  onDeath: [
    'She falls against the door.',
    'For the first time in a thousand years, the way is clear.',
    '"Thank you," she says. "I have wanted to stop for a very long time."',
    '"He is inside. He is still fighting. Tell him I am sorry I could not do more."',
    'She closes her eyes.',
    'You open the door.',
  ],
  onPlayerDeath: [
    'She kneels beside you.',
    '"You were not quite ready," she says. "I am sorry. I did not want it to be this way."',
    '"The next one will be. I will keep the door closed until then."',
    'She stands up. She goes back to her post.',
    'She has been standing there for a thousand years. She will stand there for a thousand more.',
  ],
};
