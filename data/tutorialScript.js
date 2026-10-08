// ============================================================
// data/tutorialScript.js
// The scripted first battle of MC1. Fixed enemy, fixed hand,
// fixed sequence of steps.
//
// Step types:
//   'modal'      — full-screen overlay. Advances on Continue click.
//   'highlight'  — spotlight on a target element. Advances when
//                  the gated action is performed.
//   'prompt'     — floating text, advances on a broader condition.
//
// Step targets:
//   'enemy'      — the enemy panel
//   'end-turn'   — the End Turn button
//   'card:<id>'  — a specific card in hand, by defId
//   'intent'     — the enemy intent card
//
// Gates:
//   'play-card:<id>'  — player must play this specific card
//   'any-card'        — player must play any card
//   'end-turn'        — player must end the turn
//   null              — no gating; advances on Continue click
//
// advanceOn values:
//   'continue'      — player clicked Continue
//   'card-played'   — player played the gated card
//   'turn-ended'    — player ended the turn
//   'enemy-killed'  — enemy HP hit 0
// ============================================================

export const TUTORIAL_ENEMY = {
  id: 'driftwood',
  name: 'Driftwood',
  hp: 15,
  deck: ['driftwood-lash'],
  isTutorialOnly: true,
};

export const TUTORIAL_ENEMY_CARD = {
  'driftwood-lash': {
    id: 'driftwood-lash', name: 'Lash Out', cost: 1, owner: 'enemy',
    type: 'attack', target: 'player', destination: 'discard',
    text: 'Deal 6 damage.',
    effects: [{ kind: 'damage', amount: 6 }],
  },
};

// Fixed opening hands per class.
export const TUTORIAL_HANDS = {
  vanguard: ['strike', 'strike', 'defend', 'defend', 'bash'],
  magnus:   ['arcane-spark', 'arcane-focus', 'defend', 'arcane-spark', 'defend'],
  priest:   ['strike', 'defend', 'bash', 'strike', 'defend'],
};

// Per-class step sequences.
export const TUTORIAL_SEQUENCE = {
  vanguard: [
    {
      id: 'intro', type: 'modal', title: 'Welcome',
      body: [
        'This is you. Your HP is your health. If it reaches zero, you lose.',
        'Your Block is armor. It absorbs damage, then resets at the start of your next turn.',
        'Your Energy is what you spend to play cards. You start each turn with 3.',
      ],
      advanceOn: 'continue',
    },
    {
      id: 'first-strike', type: 'highlight', target: 'card:strike',
      text: 'This is a Strike. It is an Attack. The number in the corner is its cost — 1 Energy. It deals damage.',
      gate: 'play-card:strike', advanceOn: 'card-played',
    },
    {
      id: 'damage-intro', type: 'modal', title: 'Damage',
      body: [
        'That was damage. The number floating up shows how much the enemy took.',
        'The enemy HP bar dropped by the same amount.',
      ],
      advanceOn: 'continue',
    },
    {
      id: 'first-defend', type: 'highlight', target: 'card:defend',
      text: 'This is a Defend. It is a Skill. It gives Block. Block absorbs damage before your HP does.',
      gate: 'play-card:defend', advanceOn: 'card-played',
    },
    {
      id: 'intent', type: 'highlight', target: 'intent',
      text: "This is the enemy's intent. It shows what the enemy will do on its next turn. Right now it will attack for 6.",
      gate: null, advanceOn: 'continue',
    },
    {
      id: 'end-turn', type: 'highlight', target: 'end-turn',
      text: 'When you are done playing cards, end your turn. The enemy will act, then you draw a new hand.',
      gate: 'end-turn', advanceOn: 'turn-ended',
    },
    {
      id: 'block-worked', type: 'modal', title: 'Block',
      body: [
        'The enemy attacked for 6. Your Block absorbed most of it.',
        'Block resets at the start of your next turn. If you want to keep defending, you have to keep playing Block cards.',
      ],
      advanceOn: 'continue',
    },
    {
      id: 'bash', type: 'highlight', target: 'card:bash',
      text: 'This is Bash. It deals damage and applies Vulnerable. Vulnerable makes the target take more damage from every hit.',
      gate: 'play-card:bash', advanceOn: 'card-played',
    },
    {
      id: 'finish', type: 'prompt',
      text: 'Notice the damage numbers were higher on Bash. Now play a Strike to finish it.',
      gate: 'any-card', advanceOn: 'enemy-killed',
    },
    {
      id: 'done', type: 'modal', title: 'Combat Complete',
      body: [
        'That was combat. You will see these systems again: cost, damage, Block, Vulnerable, intent.',
        'Rewards come next. You will pick a card to add to your deck.',
      ],
      advanceOn: 'continue',
    },
  ],

  magnus: [
    {
      id: 'intro', type: 'modal', title: 'Welcome',
      body: [
        'This is you. Your HP is your health. Magnus has less HP than other classes — you are a glass cannon.',
        'Your Block is armor. It absorbs damage, then resets at the start of your next turn.',
        'Your Energy is what you spend to play cards. You start each turn with 3.',
      ],
      advanceOn: 'continue',
    },
    {
      id: 'first-spark', type: 'highlight', target: 'card:arcane-spark',
      text: 'This is an Arcane Spark. It is a Spell. Spells scale with Focus, not Strength. It costs 1 Energy.',
      gate: 'play-card:arcane-spark', advanceOn: 'card-played',
    },
    {
      id: 'damage-intro', type: 'modal', title: 'Damage',
      body: [
        'That was damage. The number floating up shows how much the enemy took.',
        'Magnus deals less physical damage but more magic damage. Spells are your strength.',
      ],
      advanceOn: 'continue',
    },
    {
      id: 'first-defend', type: 'highlight', target: 'card:defend',
      text: 'This is a Defend. It gives Block. Block absorbs damage before your HP does.',
      gate: 'play-card:defend', advanceOn: 'card-played',
    },
    {
      id: 'intent', type: 'highlight', target: 'intent',
      text: "This is the enemy's intent. It shows what the enemy will do on its next turn. Right now it will attack for 6.",
      gate: null, advanceOn: 'continue',
    },
    {
      id: 'end-turn', type: 'highlight', target: 'end-turn',
      text: 'End your turn when you are done playing cards. The enemy acts, then you draw a new hand.',
      gate: 'end-turn', advanceOn: 'turn-ended',
    },
    {
      id: 'block-worked', type: 'modal', title: 'Block',
      body: [
        'The enemy attacked for 6. Your Block absorbed most of it.',
        'Block resets at the start of your next turn.',
      ],
      advanceOn: 'continue',
    },
    {
      id: 'focus', type: 'highlight', target: 'card:arcane-focus',
      text: 'This is Arcane Focus. It gives you Focus and draws a card. Focus boosts your spell damage.',
      gate: 'play-card:arcane-focus', advanceOn: 'card-played',
    },
    {
      id: 'finish', type: 'prompt',
      text: 'Your next spell will hit harder because of Focus. Play your Arcane Spark to finish it.',
      gate: 'any-card', advanceOn: 'enemy-killed',
    },
    {
      id: 'done', type: 'modal', title: 'Combat Complete',
      body: [
        'That was combat. You will see these systems again: cost, damage, Block, Focus, intent.',
        'Rewards come next. You will pick a card to add to your deck.',
      ],
      advanceOn: 'continue',
    },
  ],

  priest: [
    {
      id: 'intro', type: 'modal', title: 'Welcome',
      body: [
        'This is you. Your HP is your health. If it reaches zero, you lose.',
        'Your Block is armor. It absorbs damage, then resets at the start of your next turn.',
        'Your Energy is what you spend to play cards. You start each turn with 3.',
      ],
      advanceOn: 'continue',
    },
    {
      id: 'first-strike', type: 'highlight', target: 'card:strike',
      text: 'This is a Strike. It is an Attack. Priest deals less physical damage, but every point counts.',
      gate: 'play-card:strike', advanceOn: 'card-played',
    },
    {
      id: 'damage-intro', type: 'modal', title: 'Damage',
      body: [
        'That was damage. The number floating up shows how much the enemy took.',
        'Priest is not built for damage. Your strength is keeping yourself and others alive.',
      ],
      advanceOn: 'continue',
    },
    {
      id: 'first-defend', type: 'highlight', target: 'card:defend',
      text: 'This is a Defend. It gives Block. Priest Block is stronger than most classes — use it.',
      gate: 'play-card:defend', advanceOn: 'card-played',
    },
    {
      id: 'intent', type: 'highlight', target: 'intent',
      text: "This is the enemy's intent. It will attack for 6 next turn.",
      gate: null, advanceOn: 'continue',
    },
    {
      id: 'end-turn', type: 'highlight', target: 'end-turn',
      text: 'End your turn when you are done playing cards.',
      gate: 'end-turn', advanceOn: 'turn-ended',
    },
    {
      id: 'block-worked', type: 'modal', title: 'Block',
      body: [
        'The enemy attacked for 6. Your Block absorbed all of it.',
        'You have Mend in your deck for when Block is not enough. Priest healing is twice as effective as other classes.',
      ],
      advanceOn: 'continue',
    },
    {
      id: 'bash', type: 'highlight', target: 'card:bash',
      text: 'This is Bash. It applies Vulnerable. Priest status effects are twice as potent — Vulnerable will last longer.',
      gate: 'play-card:bash', advanceOn: 'card-played',
    },
    {
      id: 'finish', type: 'prompt',
      text: 'Now play both of your Strikes. The enemy is Vulnerable — they will hit harder.',
      gate: 'any-card', advanceOn: 'enemy-killed',
    },
    {
      id: 'done', type: 'modal', title: 'Combat Complete',
      body: [
        'That was combat. You will see these systems again: cost, damage, Block, healing, Vulnerable, intent.',
        'Rewards come next. You will pick a card to add to your deck.',
      ],
      advanceOn: 'continue',
    },
  ],
};

export function getTutorialSequence(classId) {
  return TUTORIAL_SEQUENCE[classId] ?? null;
}

export function getTutorialHand(classId) {
  return TUTORIAL_HANDS[classId] ?? null;
}
