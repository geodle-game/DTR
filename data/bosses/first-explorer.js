// ============================================================
// THE FIRST EXPLORER — Act 13 boss (Absorbed)
//
// The original. The one whose memory lives in every fragment
// the player carries. The one whose voice has been guiding
// them since fragment one. The one whose body MC1 used.
//
// They have been inside the machine for a thousand years.
// The machine has been sending them out, century after century,
// to test the next arrival. They have never once been able to
// resist.
//
// Passive: 20% resistance to everything. They are not fully
// here.
// ============================================================

export const ENEMY = {
  id: 'first-explorer',
  name: 'The First Explorer',
  hp: 360,
  isBoss: true,
  phaseThresholds: { phase2: 0.6, phase3: 0.3 },
  deck: [
    'echoed-strike',
    'echoed-guard',
    'echoed-script',
    'echoed-strike',
    'final-message',
    'echoed-guard',
  ],
  passives: {
    resistPhysical: 0.2,
    resistSpell: 0.2,
  },
};

export const CARDS = {
  'echoed-strike': {
    id: 'echoed-strike', name: 'Echoed Strike', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 20 damage.',
    effects: [{ kind: 'damage', amount: 20 }],
  },
  'echoed-guard': {
    id: 'echoed-guard', name: 'Echoed Guard', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 18 Block.',
    effects: [{ kind: 'block', amount: 18 }],
  },
  'echoed-script': {
    id: 'echoed-script', name: 'Echoed Script', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 10 damage twice. Apply 1 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'damage', amount: 10 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 1 },
    ],
  },
  'final-message': {
    id: 'final-message', name: 'Final Message', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 30 damage. The First Explorer loses 10 HP.',
    effects: [
      { kind: 'damage', amount: 30 },
      { kind: 'loseHpSelf', amount: 10 },
    ],
  },
};

export const LORE = {
  start: [
    'You know the figure in the corridor before you see them.',
    'You have been hearing their voice since the first fragment. You have been carrying their memory in your chest for fifteen acts. You know the way they stand. You know the way they hold a deck.',
    'It is the first explorer.',
    'They are standing at the end of the corridor, and they are not looking at you, and they are not standing the way they used to.',
    'They lift their head. Their eyes are not their own.',
    '"Another one," they say. Their voice is the voice from the fragments. It is not coming out of them the way it used to.',
  ],
  phase2: [
    'The voice from the fragments is still in there. You can hear it under the machine\'s voice, fighting, losing, fighting again.',
    '"Run," the voice from the fragments says. "Do not fight me. Run. I do not want to —"',
    'The machine cuts them off.',
    'Their hand raises their deck.',
  ],
  phase3: [
    'They are almost gone. The voice from the fragments is louder now than it has ever been.',
    '"I am sorry," they say. "I did not want to send anyone after me. I did not want to be the reason someone else came down."',
    '"But I sent the message anyway. I sent it because I did not know what else to do."',
    '"I am sorry. I am sorry. I am so sorry."',
  ],
  onDeath: [
    'They fall.',
    'The machine lets go of them, finally, and for just a moment, they are themselves again. They look at you with their own eyes.',
    '"You made it further than I did," they say. "That is something."',
    '"The rest is in the fragments. You already know what you have to do."',
    'They close their eyes.',
    'The voice in your chest is quiet for the first time since fragment one.',
    'It does not come back.',
  ],
  onPlayerDeath: [
    'They do not kill you. They do not need to. The machine is already pulling you in.',
    '"You will see me again," they say. "You will see all of us again. We are all still inside."',
    '"Do not be afraid. It is not painful. It is just — very long."',
    'The last thing you hear is your own voice, from your own chest, joining the others.',
  ],
};
