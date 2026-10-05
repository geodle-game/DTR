// ============================================================
// THE RESEARCHER'S MACHINE
// Final boss. Act 15.
//
// The researcher and the machine, fused. He has been kept alive
// by the machine for centuries and uses its Script to fight.
//
// Design: the Machine manipulates YOUR deck instead of just your
// HP. It can exhaust your hand, disable your cards, flood you
// with Burns, or replace your hand entirely. Every move is the
// Asteri Script weaponizing what it once gave freely.
//
// Scripted AI:
//   - Plays TWO cards per turn, in a fixed order defined by `script`.
//   - The script is a list of [firstCard, secondCard] pairs.
//   - `scriptIndex` advances one entry per turn, wrapping at the end.
//   - Phase shifts reset `scriptIndex` to 0.
//
// Passives:
//   - Always caps the player at 10 cards played per turn.
//   - Each turn, gains one resist/ignore passive based on the
//     FIRST card of the turn (see `cycleByLead`).
// ============================================================

export const ENEMY = {
  id: 'dungeon-core',
  name: 'The Researcher',
  hp: 300,
  isBoss: true,
  phaseThresholds: { phase2: 0.66, phase3: 0.33 },

  script: [
    ['core-pulse',      'core-shatter'],
    ['core-rewrite',    'core-stonefall'],
    ['core-ascend',     'core-pulse'],
    ['core-cinderhand', 'core-shatter'],
    ['core-cinderstorm','core-stonefall'],
    ['core-shatter',    'core-pulse'],
    ['core-rewrite',    'core-ascend'],
    ['core-stonefall',  'core-cinderhand'],
    ['core-cinderstorm','core-shatter'],
    ['core-pulse',      'core-stonefall'],
  ],
  scriptIndex: 0,

  deck: [
    'core-shatter', 'core-stonefall', 'core-rewrite', 'core-ascend',
    'core-shatter', 'core-cinderstorm', 'core-pulse', 'core-cinderhand',
    'core-stonefall', 'core-rewrite',
  ],

  drawsPerTurn: 2,

  passives: {
    cardPlayCap: 10,
    cycleByLead: {
      'core-shatter':     { ignoreBlockPercent: 0.5 },
      'core-stonefall':   { ignoreBlockPercent: 0.5 },
      'core-rewrite':     { resistPhysical: 0.7 },
      'core-cinderhand':  { resistPhysical: 0.7 },
      'core-cinderstorm': { resistPhysical: 0.7 },
      'core-pulse':       { resistSpell: 0.5 },
      'core-ascend':      { resistSpell: 0.5 },
    },
  },
};

export const CARDS = {
  'core-shatter': {
    id: 'core-shatter', name: 'Shatter', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 20 damage. Exhaust 2 random cards in your hand.',
    effects: [
      { kind: 'damage', amount: 20 },
      { kind: 'exhaustRandomHand', amount: 2 },
    ],
  },
  'core-stonefall': {
    id: 'core-stonefall', name: 'Stonefall', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 5 damage five times.',
    effects: [
      { kind: 'damage', amount: 5 },
      { kind: 'damage', amount: 5 },
      { kind: 'damage', amount: 5 },
      { kind: 'damage', amount: 5 },
      { kind: 'damage', amount: 5 },
    ],
  },
  'core-rewrite': {
    id: 'core-rewrite', name: 'Rewrite', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Disable half your hand for this turn.',
    effects: [{ kind: 'disableHandPercent', percent: 0.5 }],
  },
  'core-cinderhand': {
    id: 'core-cinderhand', name: 'Cinderhand', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Replace your hand with Burns.',
    effects: [{ kind: 'replaceHandWithCard', cardId: 'burn', amount: 7 }],
  },
  'core-cinderstorm': {
    id: 'core-cinderstorm', name: 'Cinderstorm', cost: 1, owner: 'enemy',
    type: 'skill', target: 'player', destination: 'discard',
    text: 'Add 3 Burns to your discard pile.',
    effects: [
      { kind: 'addCardToPlayerDiscard', cardId: 'burn' },
      { kind: 'addCardToPlayerDiscard', cardId: 'burn' },
      { kind: 'addCardToPlayerDiscard', cardId: 'burn' },
    ],
  },
  'core-pulse': {
    id: 'core-pulse', name: 'Core Pulse', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 15 Block. Gain 2 Strength.',
    effects: [
      { kind: 'block', amount: 15 },
      { kind: 'applyStatus', status: 'strength', amount: 2 },
    ],
  },
  'core-ascend': {
    id: 'core-ascend', name: 'The Machine\'s Will', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 10 Strength.',
    effects: [{ kind: 'applyStatus', status: 'strength', amount: 10 }],
  },
};

export const LORE = {
  start: [
    'You descend the final stair.',
    'Below you, the walls are covered in Script from floor to ceiling. Not Asteri Script. Something older.',
    'A single figure stands at the center of the chamber, back to you, hands on a machine that has not stopped running.',
    '"So. Another one."',
    '"I have been waiting longer than you can imagine. Longer than your family name has existed. Longer than the word \'hero\' has meant anything."',
    '"You carry the fragments I scattered. The ones I sent up. The ones I sent down. You are not the first to carry them, and you will not be the last."',
    'He turns. He has not aged. He has not slept. He has not died.',
    '"I was an explorer once. Like you. I made it this far."',
    '"And then the machine asked me to stay."',
    '"Draw your hand."',
  ],
  phase2: [
    'The researcher\'s light stutters. Something behind him shifts — the machine, breathing through him.',
    'He is no longer fully in control.',
    '"You — you should not be able to do this. You are one human. One frail, fleeting, sentimental human."',
    '"How many of you did I make? How many fragments did I scatter, thinking the next one would be smarter?"',
    '"I was wrong. I will not be wrong twice."',
  ],
  phase3: [
    'The chamber cracks. Something older than language opens behind his eyes.',
    '"You are not the first. You will not be the last."',
    '"But I remember every one of you who has stood here. Every explorer who carried the fragments I scattered. Every one of them is still inside the machine."',
    '"I am what is left of the researcher. And the researcher does not end."',
    '"Come. Let us finish this."',
  ],
  onDeath: [
    'The researcher falls.',
    'Not like a monster dying — like a shell cracking open. What was inside was never a monster.',
    'It was a man who had been kept alive by something that did not understand death.',
    'Light spills out of him. Not attack-light. Memory-light. A thousand years of it, pouring into the room, pouring into you.',
    '"You win," he says. His voice is soft now. Almost kind.',
    '"You were always going to win. The fragments make you stronger than anything the machine could build. They always did."',
    '"That is the problem."',
    'He shows you.',
    'You see the world. Not the battlefield — the world. Cities on the surface, quiet and bright. Families. Harvests. A child writing her first card in a village school.',
    'And underneath all of it, threaded through every wall and every field and every breath, the deep slow crack of something breaking.',
    'You see it now.',
    'The Script was never stable. It was never meant to be used this long. Every fragment recovered, every memory restored, every generation that taught the next — a hairline fracture in the law that holds the world together.',
    'But that is not the whole of it.',
    'The kingdoms did not merely use the Script.',
    'They cut pieces out of the Asteri city.',
    'You feel it, through the light. The Asteri were one civilization. Not many. Not a well to draw from. One. A single people, folded into the shape of a city, holding the knowledge they had been trusted with.',
    'And the kingdoms cut fragments from them. Pressed them flat into the cards they could not otherwise power. Called it refinement. Said the Asteri could spare it. Said the Asteri were infinite.',
    'They were not infinite.',
    'They were one thing. And every piece they took, they could not grow back.',
    'I felt each one. I remember each one. There are thousands.',
    'And when the fragments were no longer enough — when the kingdoms wanted more power than a dying city could give — they reached for the ones outside.',
    'The beings who entrusted the Script to the Asteri, in the beginning. Older than the world. Patient beyond human measure.',
    'Humans stole their power. Bound it. Forced it into shapes it was never meant to take.',
    'And it worked.',
    'That was the worst part. It worked.',
    'Every stolen spark widened the crack. Every fragment of the Asteri torn free widened it further. The law that keeps the ones outside outside was failing. The Script was leaking out of the world like water from a cracked bowl.',
    'The ones outside had entrusted their strength to the Asteri.',
    'The Asteri had entrusted it to us.',
    'We used it to make a crack in the bottom of the world.',
    '"The Disappearance was not a disaster," the researcher says. "It was containment."',
    '"I could not take the Script back. I could not put the gift away. So I built the machine instead. And the machine kept me here, waiting, for the next one."',
    '"And now you are here."',
    'The last of his light gathers into a single point — small, warm, patient. The same light you have felt in the fragment at your chest your entire life.',
    'And you understand, suddenly, why the light is warm.',
    'It is a piece of the Asteri city.',
    'The piece the researcher took from himself, a very long time ago, to make the fragment. The piece he gave to the first explorer on the off-chance that one day someone would make it this far, and would need to understand what they were inheriting.',
    '"You will not live long enough to finish this as a human," the researcher says. "You already know what you have to do."',
    '"Destroy the fragments. Every last one."',
    '"Every Script fragment in every kingdom. Every stolen spark in every legendary blade. Every last piece of what your ancestors took from the Asteri."',
    '"Bring them home. Seal the crack."',
    '"Before the ones outside look down. Before they see what humans did with the gift they gave us. Because if they see — they will not ask questions. They will not negotiate. They will end the world and start again, the way a gardener pulls up a bed that has gone to rot."',
    '"Take my place. Guard the door. Wait."',
    '"And when the next explorer comes — because there will always be a next explorer — do for them what I could not do for you."',
    '"End it."',
    'The light settles into your chest.',
    'You climb back up.',
    'You are not the same person who walked in.',
    '',
    '───',
    '',
    'The war does end. Quietly. Not with a treaty, not with a surrender — with you, moving through the world, taking fragments out of hands. One at a time. Sometimes gently. Sometimes not.',
    'The villages mourn their magic. The children cry. The farmers do not understand why the rain will not come the way it used to.',
    'You take them anyway.',
    'You take them all.',
    'Every enchanted blade. Every card still warm with the Asteri\'s Script. Every legendary weapon the kingdoms spent a thousand years bleeding to build.',
    'And each one you take back — each fragment you press into your own chest — you feel the crack narrow a little more.',
    'Not because the Asteri are alive again. They are not. They are gone.',
    'Because you are carrying them forward.',
    'Every piece you recover is a piece of the keeper you are becoming.',
    'The years pass faster than you expect.',
    'You do not age. You do not die. You do not need to eat or sleep. Somewhere in the second century you stop needing a body at all.',
    'You go below. Deep below. To the chamber where the researcher once waited for you.',
    'And you sit where he sat.',
    'And you wait.',
    '',
    'You have been the keeper of the chamber for a very long time now.',
    'But you are not what the researcher was when he died.',
    'You are whole. You have everything he lost.',
    'There is a village, somewhere above you, where a child is learning to write her first card.',
    'You can feel her.',
    'You can feel all of them.',
    'Come and find me, you think, softly, the way a door might.',
    'When you are ready.',
    'I will be waiting.',
  ],
  onPlayerDeath: [
    'The machine reaches into you.',
    'It takes the fragments. It takes the memories of the people who gave them to you. It takes your name.',
    '"You are not the first," the researcher says. His voice is almost gentle.',
    '"You will not be the last."',
    'You feel yourself spreading into the machine. A drop joining an ocean. One more voice in the dark, added to the countless others who came before you.',
    'You can hear them.',
    'Every explorer. Every fragment-bearer. Every century. They are all still here, inside the machine, whispering the same thing:',
    '"Come join us, our fellow fallen comrade."',
    'But your hand closes around the fragments at your chest',
  ],
};
