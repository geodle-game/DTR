// ============================================================
// data/spareSequence.js
// The six-page spare-the-researcher scene. Fires when the player
// chooses to spare rather than kill. After the last page, the
// researcher joins as an ally and the run continues.
// ============================================================

export const SPARE_PAGES = [
  [
    { text: 'The machine stops.' },
    { text: 'Not slowly. Not gradually. It stops — as if a sentence a thousand years long has finally reached its period.' },
    { text: 'The three voices go silent. For the first time since you entered the chamber, you hear only one.' },
    { text: '"...Oh," the researcher says.', cls: 'spare-soft' },
    { text: 'He is looking at his own hands.' },
    { text: '"I had forgotten what that sounded like."' },
  ],
  [
    { text: 'You hold up the fragments.' },
    { text: 'They rise out of your palm without your hand moving. They hang in the air between the two of you.' },
    { text: 'He recognizes them. Of course he does. They are pieces of his city. Pieces of his Script. Pieces of his life.' },
    { text: 'He reaches toward them, and they move toward him, and they touch his fingertips, and he makes a sound you have never heard a person make.' },
  ],
  [
    { text: "You hear the first explorer's voice again — not in your head this time, but in the room. Coming from the fragments. Coming from him." },
    { text: '"You," the researcher says, and his voice cracks. "You were the one who came down first. You were the one who killed me and did not listen."' },
    { text: 'He is crying now. He has not done that in a thousand years and does not seem to remember how.' },
    { text: '"I did not blame you," he says. "I never blamed you. You did not know. None of you knew."', cls: 'spare-soft' },
  ],
  [
    { text: '"They will come again," he says. "They always come. And I will have to fight them, and they will kill me, and the machine will take them, and I will send the fragments up, and the next one will come, and I will fight them too."' },
    { text: '"And I am so tired."' },
    { text: 'He is on his knees.' },
    { text: 'He is not a monster. He is not a god. He is not a machine. He is a man who has been holding a door shut for a thousand years, alone, and he is tired.', cls: 'spare-soft' },
    { text: 'You say: "I know."', cls: 'spare-emphasis' },
  ],
  [
    { text: 'The researcher looks up at you.' },
    { text: 'He stops. He stops crying. He stops shaking. He stops looking at you like you are the next thing that will hurt him.' },
    { text: '"You... know?"' },
    { text: '"Yes," you say. "You are Know. The Asteri word for keeper. You told the first explorer your name, at the very end, when the machine was already taking him. He wrote it into the fragments. He told me to bring them back to you."' },
    { text: 'He is still for a long moment.' },
    { text: 'Then he reaches into his chest — into the place where the machine has been holding him — and pulls out a key.' },
    { text: '"Here," he says. "I have been carrying this for a thousand years. I hoped one day someone would come down who knew what it was for."', cls: 'spare-emphasis' },
    { text: '"It opens the door behind the machine. The Veil is behind it. Go."' },
  ],
  [
    { text: 'The researcher stands.' },
    { text: 'He is shaking. He is not strong. He is not a fighter. He has spent a thousand years not dying, but that is not the same thing as living.' },
    { text: '"I cannot stop you from going," he says. "But if you are going down there — into the Veil — you do not have to go alone."' },
    { text: '"I would like to come with you."' },
    { text: '"It is the least I can do."', cls: 'spare-soft' },
  ],
];

export const SPARE_PAGES_TOTAL = SPARE_PAGES.length;
