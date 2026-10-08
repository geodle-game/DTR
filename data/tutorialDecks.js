// ============================================================
// data/tutorialDecks.js
// Per-class MC1 tutorial decks. Handpicked 15-card decks that
// teach every core mechanic once, in a controlled order.
//
// Used only when state.run.mode === 'mc1'. In MC2, classes use
// their normal starterDeck().
// ============================================================

export const TUTORIAL_DECKS = {
  vanguard: [
    'strike', 'strike', 'strike',
    'defend', 'defend', 'defend',
    'bash',           // Vulnerable
    'neutralize',     // Weak + Exhaust + 0-cost
    'pommel-strike',  // Draw
    'iron-wave',      // Block + damage on one card
    'cleave',         // AoE
    'inflame',        // Power / permanent buff
    'impervious',     // Big block
    'bludgeon',       // Big attack
    'reaper',         // AoE + lifesteal + Exhaust
  ],

  magnus: [
    'defend', 'defend', 'defend', 'defend',
    'arcane-spark', 'arcane-spark', 'arcane-spark',
    'arcane-bolt',    // single-target spell
    'frost-shard',    // damage + Weak
    'ember',          // damage + Vulnerable + Exhaust
    'arcane-focus',   // Focus + draw
    'attunement',     // Focus
    'fireball',       // AoE spell
    'soul-siphon',    // damage + heal
    'void-rift',      // big spell + Exhaust
  ],

  priest: [
    'strike', 'strike', 'strike',
    'defend', 'defend', 'defend',
    'mend', 'mend',   // heal
    'sanctuary',      // heal + Block
    'blessing',       // Block
    'impervious',     // Big Block
    'bash',           // Vulnerable
    'neutralize',     // Weak + Exhaust + 0-cost
    'pommel-strike',  // Draw
    'inflame',        // Strength
  ],

  // Beastcaller is locked. No tutorial deck. When it is ever
  // unlocked, add one here following the same pattern.
};

export function getTutorialDeck(classId) {
  return TUTORIAL_DECKS[classId] ?? null;
}
