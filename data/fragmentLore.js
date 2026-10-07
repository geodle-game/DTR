// ============================================================
// data/fragmentLore.js
// One entry per Script fragment. Each reveals a bit more of
// the truth. Fragment 15 tells the player the researcher is
// innocent and how to save him.
//
// Canon: each fragment is a shard of the shattered core. When
// the first explorer died, he imbued his memory into the shards.
// Fragments attract each other — holding one reveals the location
// of the others. This is why the Veil has never found them.
//
// Shown once per save — tracked in meta.fragmentLoreSeen.
// ============================================================

export const FRAGMENT_LORE = {
  1: {
    kicker: 'Fragment 1 of 15',
    title: 'The First Word',
    body: [
      'You come back to yourself somewhere you do not recognize.',
      'Not the chamber. Not the surface. Somewhere in between — a corridor you have never walked, lit by a light you cannot find the source of.',
      'There is a voice in your head that is not yours. It is not loud. It is not urgent. It is simply there, the way your own name is there.',
      '"Find the fragments."',
      'That is all it says. That is all you need to understand.',
      'You do not know whose voice it is. You will.',
    ],
  },

  2: {
    kicker: 'Fragment 2 of 15',
    title: 'The Second Word',
    body: [
      'The voice is clearer now. Familiar in a way you cannot place.',
      '"I was an explorer. Like you. I came for the ruins and found something else."',
      'You feel the memory behind the words — a hand closing around a shard of something that should not exist. The moment of contact. The pull beginning.',
      '"I did not know what I was picking up. I thought it was treasure. I thought it would make me rich."',
      '"It did not make me rich."',
      '"It made me a target. It made me a carrier. It made me the only person alive who knew where the rest of them were."',
    ],
  },

  3: {
    kicker: 'Fragment 3 of 15',
    title: 'The City',
    body: [
      'You see the city the way the voice remembers it — vast, silent, endless.',
      '"The Asteri built it. Before the kingdoms. Before the cards. Before anything anyone remembers."',
      '"They were not many. They were one people, living in one place, holding one thing: a language that could speak to the world."',
      '"Script. That is what they called it. That is what we call it now, when we remember it exists."',
      '"They knew there was something beneath their city. Something old. Something powerful. They never touched it. A church older than their history told them not to."',
      '"They obeyed. For their entire civilization, they obeyed."',
    ],
  },

  4: {
    kicker: 'Fragment 4 of 15',
    title: 'The Dig',
    body: [
      'The memory sharpens. A name rises — not spoken, inscribed.',
      '"The Veil. A faction within the Asteri. Researchers, officials, people who could move through the city without being seen."',
      '"They did not accept the church\'s doctrine. They believed the Asteri were hiding something. They believed they deserved it."',
      '"They dug for years. They went deeper than any Asteri had ever gone. They found the seal."',
      '"They did not know who had made it. They did not know what was behind it. They knew only that it was a barrier, and that they wanted what was on the other side."',
      '"They built a machine to break it."',
    ],
  },

  5: {
    kicker: 'Fragment 5 of 15',
    title: 'The Warning',
    body: [
      'The voice is quieter now. Deliberate.',
      '"When I reached the bottom, I found him."',
      '"The researcher. He was not what I expected."',
      '"He asked me to stop. He asked me to turn back. He said the machine was not what I thought it was — that it was never what anyone thought it was."',
      '"I did not listen."',
      'You feel the memory of a hand reaching out — not in attack, in warning — and the sound of your own voice saying no.',
      '"Do not make my mistake. When he asks you to stop — and he will — listen."',
    ],
  },

  6: {
    kicker: 'Fragment 6 of 15',
    title: 'The Disappearance',
    body: [
      '"The Asteri did not die."',
      '"That is what the kingdoms tell their children. That is what I believed when I first came down here."',
      '"They did not die. They were taken."',
      '"A Veil member fed three scripts into the machine. Spawn. Absorb. Destroy."',
      '"The machine broke the seal. The seal was holding the core. The core exploded."',
      'A long pause.',
      '"The earthquake was the core dying. Everything that happened after was the aftermath."',
    ],
  },

  7: {
    kicker: 'Fragment 7 of 15',
    title: 'The Silence',
    body: [
      '"The first blast killed everyone within ten meters. Everyone in range was absorbed into the machine."',
      '"That was not the whole city. Most of the Asteri were still alive."',
      '"The Veil did not give them time to react."',
      '"They used the machine\'s capture function on the entire city. A single script. Everyone who remained was pulled out of their homes, out of their workshops, out of their dinners, and into the machine."',
      '"That is why the city is empty. Not abandoned. Emptied."',
      '"There are no bodies because there were never any bodies. There was never any warning. There was never any evacuation."',
    ],
  },

  8: {
    kicker: 'Fragment 8 of 15',
    title: 'The Theft',
    body: [
      '"The kingdoms above are not the villains of this story."',
      '"I believed they were, for a long time. I believed they cut the Asteri apart out of greed. I believed they were the ones who did this."',
      '"They did not. They came after. They found the ruins. They found the Script. They did what any kingdom does when it finds something valuable."',
      '"They took pieces. They pressed them into cards. They called it refinement."',
      '"They did not know what they were cutting into. They did not know the Asteri were people. They did not know the Script was a corpse."',
      '"They are not evil. They are hungry. That is different, and it is worse."',
    ],
  },

  9: {
    kicker: 'Fragment 9 of 15',
    title: 'The Researcher',
    body: [
      '"He was not one of them."',
      '"He was not Veil. He was never Veil."',
      '"He was a researcher. A brilliant one. The Veil came to him and told him they needed a machine — for study, for research, for the advancement of Script. They did not tell him what it was aimed at."',
      '"He built it. He believed them. He never saw the seal. He never knew there was something to break."',
      '"When he realized what he had made, he tried to stop them. He warned them. He begged them to keep it classified."',
      '"He did not know it was already in the wrong hands."',
    ],
  },

  10: {
    kicker: 'Fragment 10 of 15',
    title: 'The Machine',
    body: [
      '"The machine was never an engine. It was a key."',
      '"It was built to do one thing: break the seal. It succeeded. That was the whole of its purpose."',
      '"Everything it has done since — every monster, every capture, every fragment of Script it has leaked or hoarded — is improvisation. It has been running without a purpose for a thousand years."',
      '"The researcher is inside it. So are three Veil members. They are still fighting for control. They have been fighting for a thousand years."',
      '"The researcher cannot win. He can only blunt them. He has been blunting them for a thousand years, and that is the only reason the world still exists."',
    ],
  },

  11: {
    kicker: 'Fragment 11 of 15',
    title: 'The Gardener',
    body: [
      '"There was a god before the world. It made one thing and then spent itself making it."',
      '"It made the core. The origin of all Script, all magic, all power. It sealed the core in the same act — a cage with a leak, so magic would be usable but the source would be untouchable."',
      '"The making drained it. It has been recovering ever since. It has perhaps eight thousand years left before it can act again. It cannot intervene before then. It can only watch."',
      '"It reached out once, in the deep past, to a church that prayed to it. It told them one thing: do not meddle with the source beneath the surface."',
      '"They wrote it down. They built a doctrine around it. They obeyed for centuries."',
      '"It did not hold long enough."',
    ],
  },

  12: {
    kicker: 'Fragment 12 of 15',
    title: 'The Church',
    body: [
      '"The church that received the warning is still standing."',
      '"It is a building you go to for weddings and funerals. It has priests and prayers and feast days. It has a founding text nobody can fully translate."',
      '"It does not believe in the gardener anymore. A thousand years is a long time to hold a faith whose god has gone silent and whose one command was already broken before the first generation of children were born."',
      '"The doctrine became ritual. The ritual became tradition. The tradition became architecture."',
      '"The warning is still there, somewhere in their archives. Dusty. Uncopied. Untranslated. They no longer know what they are."',
    ],
  },

  13: {
    kicker: 'Fragment 13 of 15',
    title: 'What I Did',
    body: [
      '"I did not listen."',
      '"He asked me to stop. He explained everything. He showed me the machine. He showed me what was inside it."',
      '"And I did not listen. I thought he was lying. I thought the fragments in my hands made me stronger than him. I thought I could win."',
      '"I fought him. I won. And then the machine had nowhere else to go with the seal but me."',
      '"This is my fault. The next one — you — this is your chance to not do what I did."',
    ],
  },

  14: {
    kicker: 'Fragment 14 of 15',
    title: 'The Truth',
    body: [
      '"The researcher is innocent."',
      '"Whatever the kingdoms told you. Whatever you believed when you came down. He is not your enemy. He never was."',
      '"He is the only thing standing between the world and the door the Veil opened. He has been standing there for a thousand years, and he is still standing."',
      '"The Veil is the enemy. The Veil caused the Disappearance. The Veil framed the researcher. The Veil vanished, and the Veil is still alive, and the Veil is still looking for the fragments you are carrying."',
      '"When you reach him — when you see him standing in front of the machine — do not fight him. Show him you understand. Show him the fragments. Show him that you know what he has been doing."',
      '"Be patient. Be slow. And when you strike, do not kill."',
    ],
  },

  15: {
    kicker: 'Fragment 15 of 15',
    title: 'How to Save Him',
    body: [
      '"This is the last thing I can send. The rest is up to you."',
      '"When you reach the chamber, the researcher will not know you. He will fight you. He has to — the three Veil members make him. But he is not the machine. He is not them."',
      '"Take him to one hit point. One. Not less. If he dies, the three Veil members gain full control, and the world ends within the decade."',
      '"When he kneels — when he drops his guard — do not strike."',
      '"He will ask you why. Tell him: because I know."',
      '"That was his name. The Asteri word for keeper. He told me once, at the very end, when the machine was already taking me. He said: my name is Know, and I have been waiting."',
      '"He will remember. He will give you the key."',
      '"The key opens the door behind the machine. Behind the door is the Veil — the ones who caused this, the ones who are still working. Behind the Veil is the gardener, and the gardener is not your enemy. The gardener is sleeping."',
      '"Save him. Then keep going."',
      '"You may be the last explorer. If you succeed, there will not be another."',
      '"If you fail — I will send the message forward again. I will always send it forward. But I would rather not."',
    ],
  },
};
