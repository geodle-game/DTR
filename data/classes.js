// ============================================================
// data/classes.js
// Class definitions for Drawn to Ruin.
//
// Each class provides:
//   - startHp          base HP for a fresh run
//   - starterDeck()    array of card ids
//   - modifiers        outgoing/incoming multipliers applied in combat
//   - bannedTypes      card types the class cannot use (filtered from pools)
//   - cardPoolBias     relative weight per card type in rewards/shop rolls
//   - locked           true = hidden from the picker (not yet implemented)
//
// Modifier fields are all 1.0 by default. Anything not listed in a class
// falls back to 1.0.
// ============================================================

import { CARDS } from './cards.js';

export const CLASSES = {
  vanguard: {
    id: 'vanguard',
    name: 'The Vanguard',
    blurb:
      'You never needed the dungeon\'s gift. Steel remembers what magic forgets.',
    startHp: 70,
    modifiers: {
      physicalDamage: 1.3,
      magicDamage: 1.0,
      physicalBlock: 1.3,
      magicBlock: 1.3,
      healPower: 1.0,
      damageTaken: 1.0,
      statusPotency: 1.0,
    },
    bannedTypes: ['spell'],
    cardPoolBias: { attack: 3.0, skill: 1.0, power: 1.0, spell: 0 },
    starterDeck: () => [
      'strike', 'strike', 'strike', 'strike',
      'defend', 'defend', 'defend', 'defend',
      'bash', 'iron-wave',
    ],
  },

  magnus: {
    id: 'magnus',
    name: 'The Magnus',
    blurb:
      'You learned to speak the dungeon\'s own language. It costs you everything.',
    startHp: 50,
    modifiers: {
      physicalDamage: 0.5,
      magicDamage: 1.3,
      physicalBlock: 1.0,
      magicBlock: 1.5,
      healPower: 1.0,
      damageTaken: 2.0,
      statusPotency: 1.0,
    },
    bannedTypes: [],
    cardPoolBias: { attack: 0.5, skill: 1.3, power: 1.5, spell: 4.0 },
    starterDeck: () => [
      'defend', 'defend', 'defend',
      'arcane-spark', 'arcane-spark',
      'arcane-bolt', 'frost-shard', 'ember',
      'arcane-focus', 'attunement',
    ],
  },

  priest: {
    id: 'priest',
    name: 'The Priest',
    blurb:
      'You mend what the war breaks. The dungeon does not appreciate mercy.',
    startHp: 70,
    modifiers: {
      physicalDamage: 0.5,
      magicDamage: 1.0,
      physicalBlock: 1.3,
      magicBlock: 1.3,
      healPower: 2.0,
      damageTaken: 2.0,
      statusPotency: 2.0,
    },
    bannedTypes: [],
    cardPoolBias: { attack: 0.5, skill: 2.0, power: 1.3, spell: 1.0 },
    starterDeck: () => [
      'strike', 'strike',
      'defend', 'defend', 'defend',
      'mend', 'mend',
      'blessing', 'sanctuary',
      'bash',
    ],
  },

  // ---- Deferred until companions exist ----
  beastcaller: {
    id: 'beastcaller',
    name: 'The Beastcaller',
    blurb:
      'You do not fight the dungeon. You teach its children to fight for you.',
    locked: true,
    startHp: 65,
    modifiers: {
      physicalDamage: 0.7,
      magicDamage: 0.7,
      physicalBlock: 1.0,
      magicBlock: 1.0,
      healPower: 1.2,
      damageTaken: 1.0,
      statusPotency: 1.0,
    },
    bannedTypes: [],
    cardPoolBias: { attack: 0.3, skill: 1.5, power: 1.0, spell: 0.5 },
    starterDeck: () => ['defend', 'defend', 'defend', 'mend', 'mend'],
  },
};

const DEFAULT_MODS = Object.freeze({
  physicalDamage: 1.0,
  magicDamage: 1.0,
  physicalBlock: 1.0,
  magicBlock: 1.0,
  healPower: 1.0,
  damageTaken: 1.0,
  statusPotency: 1.0,
});

export function getClassMods(classId) {
  if (!classId) return DEFAULT_MODS;
  const cls = CLASSES[classId];
  if (!cls || !cls.modifiers) return DEFAULT_MODS;
  return { ...DEFAULT_MODS, ...cls.modifiers };
}

export function getClass(id) {
  return CLASSES[id] ?? CLASSES.vanguard;
}

export function playableClasses() {
  return Object.values(CLASSES).filter(c => !c.locked);
}

export function isCardAllowedForClass(defId, classId) {
  const cls = CLASSES[classId];
  if (!cls || !cls.bannedTypes?.length) return true;
  const def = CARDS[defId];
  if (!def) return false;
  return !cls.bannedTypes.includes(def.type);
}

export function cardWeightForClass(defId, classId) {
  const cls = CLASSES[classId];
  if (!cls || !cls.cardPoolBias) return 1;
  const def = CARDS[defId];
  if (!def) return 0;
  const w = cls.cardPoolBias[def.type];
  return typeof w === 'number' ? w : 1;
}
