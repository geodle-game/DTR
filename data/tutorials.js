// ============================================================
// data/tutorials.js
// One-shot teaching popups. Each fires the first time its
// condition is met and never again for that save. Tracked in
// meta.tutorialsSeen.
// ============================================================

export const TUTORIALS = {
  welcome: {
    title: 'Welcome, Explorer',
    body: [
      'You are about to descend into a buried city. You will not come back the same.',
      'The basic loop:',
      '• Pick a class before each run. Your class decides your starting deck and modifiers.',
      '• Pick a starting relic. It grants a passive effect you keep for the whole run.',
      '• Descend the map. Fight monsters, choose paths, collect cards and Script fragments.',
      '• Beat the boss of each act to descend further.',
      '• If you die, the run restarts — but you keep what you learned.',
    ],
  },

  classPick: {
    title: 'Choosing a Path',
    body: [
      'Each class trades something for something else.',
      'Vanguard — heavy physical damage, extra Block, cannot use Spells.',
      'Magnus — glass cannon. Boosted magic and magic Block, but takes double damage and starts at 50 HP.',
      'Priest — doubled healing, doubled status effects, halved physical damage.',
      'Beastcaller — locked. Beat the first dungeon to unlock it.',
      'You will play all of them eventually. Pick what feels right.',
    ],
  },

  relicPick: {
    title: 'Relics',
    body: [
      'A relic is a permanent passive effect.',
      'Some trigger at the start of combat. Some trigger when you gain Block, lose HP, or kill an enemy.',
      'You keep your relic for the entire run.',
      'You will find more relics in Treasure nodes and at act transitions.',
    ],
  },

  firstMap: {
    title: 'The Map',
    body: [
      'The map is a branching path. You can only move to nodes connected to your current one.',
      'Node types:',
      '⚔  Monster — a fight.',
      '★  Elite — harder fight, better rewards.',
      '?  Event — a choice with consequences.',
      '$  Shop — spend gold on cards and services.',
      '☕  Rest — heal, or enchant a card.',
      '◆  Treasure — a free relic and gold.',
      '◈  Script Fragment — pick up a fragment of the previous explorer\'s memory.',
      '☠  Boss — the act\'s final fight.',
      'When in doubt, take the fragment node. You need all fourteen.',
    ],
  },

  firstCombat: {
    title: 'Combat',
    body: [
      'You start each turn with 5 cards and 3 Energy.',
      'Each card has a cost in its top-left corner. You can only play cards you can afford.',
      'Click a card to play it. If it needs a target, click an enemy.',
      'Enemies show their next move above them. Plan around it.',
      'When you are done playing cards, click End Turn. Then the enemies act.',
      'Block reduces damage. It resets at the start of your next turn.',
      'Key statuses: Strength adds damage, Weak cuts yours, Vulnerable makes the target take more, Focus boosts spells.',
    ],
  },

  firstFragment: {
    title: 'Script Fragment',
    body: [
      'You found a Script fragment.',
      'These fragments are pieces of the previous explorer\'s memory — and pieces of the Asteri\'s power.',
      'Every fragment makes you slightly stronger.',
      'At 5 fragments you unlock Recall: for 100 gold, you can teleport back to any node you have already visited.',
      'You need all fourteen to save the researcher.',
      'You will understand why when you reach the bottom.',
    ],
  },

  firstRecall: {
    title: 'Recall',
    body: [
      'You have unlocked Recall.',
      'During map navigation, click the Recall button to open the recall screen.',
      'It costs 100 gold to teleport to any node you have already visited.',
      'Events you have completed will not re-trigger.',
      'Enemies in the recalled area scale to your current act, so going back is not free.',
    ],
  },

  mc2Welcome: {
    title: 'You Woke Up',
    body: [
      'You are not the person who descended this dungeon.',
      'You are the person who received their final message.',
      'One fragment is in your head. It is telling you one thing: find the rest.',
      'You will be weaker than the previous explorer. You will also know more.',
      'Now you know what is down there. That has to be worth something.',
    ],
  },
};
