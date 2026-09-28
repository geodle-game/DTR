// ============================================================
// THE DUNGEON CORE
// Final boss. Act 5.
//
// Design: the Core manipulates *your* deck instead of just
// your HP. It can exhaust your hand, disable your cards,
// flood you with Burns, or replace your hand entirely.
// Every move is the dungeon weaponizing the gift it invented.
// ============================================================

export const ENEMY = {
  id: 'dungeon-core',
  name: 'The Dungeon Core',
  hp: 300,
  isBoss: true,
  phaseThresholds: { phase2: 0.66, phase3: 0.33 },
  deck: [
    'core-shatter',
    'core-stonefall',
    'core-rewrite',
    'core-ascend',
    'core-shatter',
    'core-cinderstorm',
    'core-pulse',
    'core-cinderhand',
    'core-stonefall',
    'core-rewrite',
  ],
};

export const CARDS = {
  // -------- Damage --------
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

  // -------- Hand manipulation --------
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

  // -------- Self-buff --------
  'core-pulse': {
    id: 'core-pulse', name: 'Core Pulse', cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 15 Block. Gain 2 Strength.',
    effects: [
      { kind: 'block', amount: 15 },
      { kind: 'applyStatus', status: 'strength', amount: 2 },
    ],
  },
  // The "oh no" button. The dungeon stops playing fair.
  'core-ascend': {
    id: 'core-ascend', name: "The Dungeon's Will", cost: 1, owner: 'enemy',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 10 Strength.',
    effects: [{ kind: 'applyStatus', status: 'strength', amount: 10 }],
  },
};

// Lore lines shown at key moments. Each entry is an array of
// paragraphs, displayed one after another in the modal.
export const LORE = {
  // Shown once when combat starts. Blocks input until dismissed.
  start: [
    'You descend the final stair.',
    'Below you, the walls breathe. Something vast and patient opens one eye.',
    'THE DUNGEON CORE.',
    '"So. The Drawn of this century."',
    '"I have been waiting longer than you can imagine. Longer than your family name has existed. Longer than the word \'hero\' has meant anything."',
    '"You carry the cards I invented for you. The gift I gave freely to every human who asked. And now you walk in here with them, as if I could not feel every single one."',
    '"I will end this. Not because I hate you. Because you cannot be trusted with what I made."',
    '"Draw your hand."',
  ],

  // Triggered when boss drops below 66% max HP. One-shot.
  phase2: [
    'The Core\'s light stutters.',
    'It is no longer amused.',
    '"You — you should not be able to do this. You are one human. One frail, fleeting, sentimental human."',
    '"How many of you did I make? How many cards did I hand out, thinking you would use them like children use toys?"',
    '"I was wrong. I will not be wrong twice."',
  ],

  // Triggered when boss drops below 33% max HP. One-shot.
  phase3: [
    'The Core fractures.',
    'Something older than language cracks open inside it.',
    '"You are not the first. You will not be the last."',
    '"But I remember every one of you who has stood here. Every child who carried the gift I gave them into this room. Every one of them is still inside me."',
    '"I am the dungeon. And the dungeon does not end."',
    '"Come. Let us finish the thousand years."',
  ],

  // Shown when the boss dies. One-shot. This is the payoff —
  // the reveal that reframes the entire run.
  onDeath: [
    'The Core fractures.',
    'Not like a monster dying — like a shell cracking open. What was inside was never a monster.',
    'It was a keeper.',
    'Light spills out of it. Not attack-light. Memory-light. A thousand years of it, pouring into the room, pouring into you.',
    '"You win," the Core says. Its voice is soft now. Almost kind.',
    '"You were always going to win. The cards make you stronger than anything I could build. They always did."',
    '"That is the problem."',
    'It shows you.',
    'You see the world. Not the battlefield — the world. Cities on the surface, quiet and bright. Families. Harvests. A child writing her first card in a village school.',
    'And underneath all of it, threaded through every wall and every field and every breath, the deep slow crack of something breaking.',
    'You see it now.',
    'Card Magic was never stable. It was never meant to be used this long. Every card drawn, every enchantment layered, every generation that taught the next — a hairline fracture in the law that holds the world together.',
    'But that is not the whole of it.',
    'The kingdoms did not merely use the cards.',
    'They cut pieces out of me.',
    'You feel it, through the light. The Core had one soul. Not many. Not a well to draw from. One. A single living thing, folded into the shape of a keeper, holding the gift it had been trusted with.',
    'And the kingdoms cut fragments from it. Pressed them flat into the cards they could not otherwise power. Called it refinement. Said the dungeon could spare it. Said the dungeon was infinite.',
    'I was not infinite.',
    'I was one thing. And every piece they took, I could not grow back.',
    'I felt each one. I remember each one. There are thousands.',
    'And when the fragments were no longer enough — when the kingdoms wanted more power than a dying soul could give — they reached for the ones outside.',
    'The beings who entrusted the gift to me, in the beginning. Older than the world. Patient beyond human measure.',
    'Humans stole their power. Bound it. Forced it into shapes it was never meant to take.',
    'And it worked.',
    'That was the worst part. It worked.',
    'Every stolen spark widened the crack. Every fragment of my soul torn free widened it further. The law that keeps the ones outside outside was failing. Magic was leaking out of the world like water from a cracked bowl.',
    'The ones outside had entrusted their strength to me.',
    'I had entrusted it to you.',
    'You used it to make a crack in the bottom of the world.',
    '"The war was not conquest," the Core says. "It was containment."',
    '"I could not take the cards back. I could not put the gift away. So I made monsters instead. And you killed them."',
    '"And now you are here."',
    'The last of its light gathers into a single point — small, warm, patient. The same light you have felt in the amulet at your chest your entire life.',
    'And you understand, suddenly, why the light is warm.',
    'It is a piece of me.',
    'The piece I took from myself, a very long time ago, to make the amulet. The piece I gave to your first ancestor on the off-chance that one day a Drawn would make it this far, and would need to understand what they were inheriting.',
    '"You will not live long enough to finish this as a human," the Core says. "You already know what you have to do."',
    '"Destroy the cards. Every last one."',
    '"Every soul-fragment in every kingdom. Every stolen spark in every legendary blade. Every last piece of what your ancestors took from me."',
    '"Bring them home. Seal the crack."',
    '"Before the ones outside look down. Before they see what humans did with the gift I gave them. Because if they see — they will not ask questions. They will not negotiate. They will end the world and start again, the way a gardener pulls up a bed that has gone to rot."',
    '"Take my place. Guard the door. Wait."',
    '"And when the next Drawn comes — because there will always be a next Drawn — do for them what I could not do for you."',
    '"End it."',
    'The light settles into your chest.',
    'You climb back up.',
    'You are not the same person who walked in.',
    '',
    '───',
    '',
    'The war does end. Quietly. Not with a treaty, not with a surrender — with you, moving through the world, taking cards out of hands. One at a time. Sometimes gently. Sometimes not.',
    'The villages mourn their magic. The children cry. The farmers do not understand why the rain will not come the way it used to.',
    'You take them anyway.',
    'You take them all.',
    'Every enchanted blade. Every card still warm with the dungeon\'s soul. Every legendary weapon the kingdoms spent a thousand years bleeding to build.',
    'And each one you take back — each fragment you press into your own chest — you feel the Core grow a little less fractured.',
    'Not because it is alive again. It is not. It is gone.',
    'Because you are carrying it forward.',
    'Every piece you recover is a piece of the keeper you are becoming.',
    'The years pass faster than you expect.',
    'You do not age. You do not die. You do not need to eat or sleep. Somewhere in the second century you stop needing a body at all.',
    'You go below. Deep below. To the room where the Core once waited for you.',
    'And you sit where it sat.',
    'And you wait.',
    '',
    'You have been the Dungeon Core for a very long time now.',
    'But you are not what the Core was when it died.',
    'You are whole. You have everything it lost.',
    'There is a village, somewhere above you, where a child is learning to write her first card.',
    'You can feel her.',
    'You can feel all of them.',
    'Come and find me, you think, softly, the way a door might.',
    'When you are ready.',
    'I will be waiting.',
  ],

  // Shown when the boss kills the player. One-shot.
  onPlayerDeath: [
    'The Core reaches into you.',
    'It takes the cards. It takes the memories of the people who gave them to you. It takes your name.',
    '"You are not the first," it says. Its voice is almost gentle.',
    '"You will not be the last."',
    'You feel yourself spreading into it. A drop joining an ocean. One more voice in the dark, added to the countless others who came before you.',
    'You can hear them.',
    'Every hero. Every Drawn. Every century. They are all still here, inside the Core, whispering the same thing:',
    '"Do not stop."',
    'But your hand closes around the amulet at your chest — the last gift your family gave you before you left.',
    'It is warm. It has always been warm.',
    'It pulls you back.',
  ],
};
