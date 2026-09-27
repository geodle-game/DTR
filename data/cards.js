// destination controls what happens AFTER a card is played:
//   'draw'    = shuffles back into draw pile
//   'discard' = goes to discard pile
//   'exhaust' = removed from combat entirely
// retain: true means the card always stays in hand at end of turn.
//
// animation: 'slash' (default) | 'heavy' | 'pierce' | 'magic'
//
// liveValues(state, ctx) → { key: "value to render in green" }
// ctx = { attacker, target, allTargets }
// Empty string hides the placeholder.

// --- Damage math shared by player AND enemy cards ---
// `isSpell` swaps the flat stat bonus from Strength → Focus.
export function damageFromContext(attacker, target, base, strengthMultiplier = 1, isSpell = false) {
  if (!attacker || !target) return null;
  const scale = attacker.damageScale ?? 1;
  const flatBonus = isSpell
    ? (attacker.statuses?.focus || 0)
    : (attacker.statuses?.strength || 0) * (strengthMultiplier ?? 1);
  let dmg = (base * scale) + flatBonus;
  if (attacker.statuses?.weak) dmg *= 0.75;
  if (target.statuses?.vulnerable) dmg *= 1.5;
  return Math.max(0, Math.floor(dmg));
}

// Helper that produces " (N)" when the value differs from the printed base.
export function liveDamage(base, opts = {}) {
  return (s, ctx) => {
    if (!ctx || !ctx.attacker || !ctx.target) return { live: '' };
    const v = damageFromContext(
      ctx.attacker, ctx.target, base,
      opts.mult ?? 1,
      opts.spell ?? false,
    );
    if (v == null || v === base) return { live: '' };
    return { live: ` (${v})` };
  };
}

// Helper for AoE: shows per-target and total.
export function liveAoE(base, opts = {}) {
  return (s, ctx) => {
    if (!ctx || !ctx.attacker || !ctx.target) return { live: '' };
    const spell = opts.spell ?? false;
    const living = (s.enemies || []).filter(e => e.hp > 0);
    if (living.length === 0) return { live: '' };
    const per = damageFromContext(ctx.attacker, ctx.target, base, 1, spell);
    const total = living.reduce(
      (sum, e) => sum + damageFromContext(ctx.attacker, e, base, 1, spell), 0);
    if (living.length === 1 && per === base) return { live: '' };
    if (living.length === 1) return { live: ` (${per})` };
    return { live: ` (${per} each, ${total} total)` };
  };
}

export const CARDS = {
  // ================================================================
  // STARTER
  // ================================================================
  strike: {
    id: 'strike', name: 'Strike', cost: 1, rarity: 'starter',
    type: 'attack', target: 'enemy', destination: 'discard',
    text: 'Deal 6 damage.{live}',
    effects: [{ kind: 'damage', amount: 6 }],
    liveValues: liveDamage(6),
  },
  defend: {
    id: 'defend', name: 'Defend', cost: 1, rarity: 'starter',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 5 Block.',
    effects: [{ kind: 'block', amount: 5 }],
  },
  bash: {
    id: 'bash', name: 'Bash', cost: 2, rarity: 'starter',
    type: 'attack', target: 'enemy', destination: 'discard',
    animation: 'heavy',
    text: 'Deal 8 damage.{live} Apply 2 Vulnerable.',
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2 },
    ],
    liveValues: liveDamage(8),
  },
  neutralize: {
    id: 'neutralize', name: 'Neutralize', cost: 0, rarity: 'starter',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    animation: 'pierce',
    text: 'Deal 3 damage.{live} Apply 1 Weak. Exhaust.',
    effects: [
      { kind: 'damage', amount: 3 },
      { kind: 'applyStatus', status: 'weak', amount: 1 },
    ],
    liveValues: liveDamage(3),
  },

  // ================================================================
  // COMMON ATTACKS
  // ================================================================
  cleave: {
    id: 'cleave', name: 'Cleave', cost: 1, rarity: 'common',
    type: 'attack', target: 'all-enemies', destination: 'exhaust',
    animation: 'heavy',
    text: 'Deal 8 damage to all enemies.{live} Exhaust.',
    effects: [{ kind: 'damage', amount: 8 }],
    liveValues: liveAoE(8),
  },
  'body-slam': {
    id: 'body-slam', name: 'Body Slam', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'discard',
    animation: 'heavy',
    text: 'Deal damage equal to your Block.{live}',
    effects: [{ kind: 'damageEqualToBlock' }],
    liveValues: (s, ctx) => {
      if (!s.player || !ctx?.target) return { live: '' };
      const v = damageFromContext(
        { ...s.player, damageScale: 1 },
        ctx.target,
        s.player.block,
      );
      if (v == null) return { live: '' };
      return { live: ` (${v})` };
    },
  },
  'iron-wave': {
    id: 'iron-wave', name: 'Iron Wave', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    text: 'Gain 5 Block. Deal 5 damage.{live} Exhaust.',
    effects: [
      { kind: 'block', amount: 5 },
      { kind: 'damage', amount: 5 },
    ],
    liveValues: liveDamage(5),
  },
  'pommel-strike': {
    id: 'pommel-strike', name: 'Pommel Strike', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'discard',
    animation: 'pierce',
    text: 'Deal 9 damage.{live} Draw 1.',
    effects: [
      { kind: 'damage', amount: 9 },
      { kind: 'draw', amount: 1 },
    ],
    liveValues: liveDamage(9),
  },
  'twin-strike': {
    id: 'twin-strike', name: 'Twin Strike', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    animation: 'pierce',
    text: 'Deal 5 damage twice.{live} Exhaust.',
    effects: [
      { kind: 'damage', amount: 5 },
      { kind: 'damage', amount: 5 },
    ],
    liveValues: (s, ctx) => {
      if (!ctx?.attacker || !ctx?.target) return { live: '' };
      const per = damageFromContext(ctx.attacker, ctx.target, 5);
      if (per === 5) return { live: '' };
      return { live: ` (${per} each)` };
    },
  },
  anger: {
    id: 'anger', name: 'Anger', cost: 0, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'draw', retain: true,
    text: 'Deal 6 damage.{live} Retain.',
    effects: [{ kind: 'damage', amount: 6 }],
    liveValues: liveDamage(6),
  },
  'quick-slash': {
    id: 'quick-slash', name: 'Quick Slash', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'discard',
    animation: 'pierce',
    text: 'Deal 8 damage.{live} Draw 2.',
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'draw', amount: 2 },
    ],
    liveValues: liveDamage(8),
  },
  clothesline: {
    id: 'clothesline', name: 'Clothesline', cost: 2, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    animation: 'heavy',
    text: 'Deal 12 damage.{live} Apply 2 Weak. Exhaust.',
    effects: [
      { kind: 'damage', amount: 12 },
      { kind: 'applyStatus', status: 'weak', amount: 2 },
    ],
    liveValues: liveDamage(12),
  },
  'heavy-blade': {
    id: 'heavy-blade', name: 'Heavy Blade', cost: 2, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    animation: 'heavy',
    text: 'Deal 14 damage. Strength counts 3×.{live} Exhaust.',
    effects: [{ kind: 'damage', amount: 14, strengthMultiplier: 3 }],
    liveValues: liveDamage(14, { mult: 3 }),
  },
  'sword-boomerang': {
    id: 'sword-boomerang', name: 'Sword Boomerang', cost: 2, rarity: 'common',
    type: 'attack', target: 'all-enemies', destination: 'exhaust',
    text: 'Deal 6 damage to all enemies twice.{live} Exhaust.',
    effects: [
      { kind: 'damage', amount: 6 },
      { kind: 'damage', amount: 6 },
    ],
    liveValues: (s, ctx) => {
      if (!ctx?.attacker || !ctx?.target) return { live: '' };
      const living = (s.enemies || []).filter(e => e.hp > 0);
      if (!living.length) return { live: '' };
      const perHit = damageFromContext(ctx.attacker, ctx.target, 6);
      const perTarget = perHit * 2;
      const total = living.reduce(
        (sum, e) => sum + damageFromContext(ctx.attacker, e, 6) * 2, 0);
      if (living.length === 1 && perTarget === 12) return { live: '' };
      if (living.length === 1) return { live: ` (${perTarget})` };
      return { live: ` (${perTarget} each, ${total} total)` };
    },
  },
  headbutt: {
    id: 'headbutt', name: 'Headbutt', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    animation: 'heavy',
    text: 'Deal 9 damage.{live} Put a random card from your discard pile on top of your draw pile. Exhaust.',
    effects: [
      { kind: 'damage', amount: 9 },
      { kind: 'recoverFromDiscard' },
    ],
    liveValues: liveDamage(9),
  },
  'perfected-strike': {
    id: 'perfected-strike', name: 'Perfected Strike', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'discard',
    animation: 'heavy',
    text: 'Deal {damage} damage. +2 damage per card with "Strike" in your deck.{live}',
    effects: [{ kind: 'perfectedStrike', base: 6, perStrike: 2 }],
    liveValues: (s, ctx) => {
      if (!s.run?.deck) return { damage: '6', live: '' };
      const strikes = s.run.deck.filter(c => c.defId.includes('strike')).length;
      const base = 6 + 2 * strikes;
      const computed = ctx?.attacker && ctx?.target
        ? damageFromContext(ctx.attacker, ctx.target, base)
        : base;
      const showBracket = ctx?.attacker && ctx?.target && computed !== base;
      return {
        damage: String(base),
        live: showBracket ? ` (${computed})` : (strikes > 0 ? ` (${strikes} Strikes)` : ''),
      };
    },
  },
  'reckless-charge': {
    id: 'reckless-charge', name: 'Reckless Charge', cost: 0, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    text: 'Deal 7 damage.{live} Shuffle a Dazed into your draw pile. Exhaust.',
    effects: [
      { kind: 'damage', amount: 7 },
      { kind: 'addCardToDraw', cardId: 'dazed' },
    ],
    liveValues: liveDamage(7),
  },
  dropkick: {
    id: 'dropkick', name: 'Dropkick', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'discard',
    text: 'Deal 5 damage.{live} If target is Vulnerable, gain 1 Energy and draw 1.',
    effects: [
      { kind: 'damage', amount: 5 },
      { kind: 'dropkick' },
    ],
    liveValues: liveDamage(5),
  },
  uppercut: {
    id: 'uppercut', name: 'Uppercut', cost: 2, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    animation: 'heavy',
    text: 'Deal 13 damage.{live} Apply 2 Weak and 2 Vulnerable. Exhaust.',
    effects: [
      { kind: 'damage', amount: 13 },
      { kind: 'applyStatus', status: 'weak', amount: 2 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2 },
    ],
    liveValues: liveDamage(13),
  },
  finisher: {
    id: 'finisher', name: 'Finisher', cost: 1, rarity: 'common',
    type: 'attack', target: 'random-enemy', destination: 'exhaust',
    text: 'Deal 6 damage to a random enemy for each Attack played this turn.{live} Exhaust.',
    effects: [{ kind: 'finisher', amount: 6 }],
    liveValues: (s, ctx) => {
      if (!ctx?.attacker || !ctx?.target) return { live: '' };
      const per = damageFromContext(ctx.attacker, ctx.target, 6);
      if (per === 6) return { live: '' };
      return { live: ` (${per} each)` };
    },
  },
  rampage: {
    id: 'rampage', name: 'Rampage', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'discard',
    text: "Deal 8 damage. Permanently increase this card's damage by 5 this combat.{live}",
    effects: [{ kind: 'rampage', base: 8, per: 5 }],
    liveValues: (s, ctx) => {
      if (!ctx?.attacker || !ctx?.target) return { live: '' };
      const computed = damageFromContext(ctx.attacker, ctx.target, 8);
      if (computed === 8) return { live: '' };
      return { live: ` (${computed})` };
    },
  },

  // ================================================================
  // SPELLS — scale with Focus, not Strength
  // ================================================================
  'arcane-bolt': {
    id: 'arcane-bolt', name: 'Arcane Bolt', cost: 1, rarity: 'common',
    type: 'spell', target: 'enemy', destination: 'discard',
    animation: 'magic',
    text: 'Deal 8 damage.{live}',
    effects: [{ kind: 'damage', amount: 8 }],
    liveValues: liveDamage(8, { spell: true }),
  },
  'frost-shard': {
    id: 'frost-shard', name: 'Frost Shard', cost: 1, rarity: 'common',
    type: 'spell', target: 'enemy', destination: 'discard',
    animation: 'magic',
    text: 'Deal 5 damage.{live} Apply 1 Weak.',
    effects: [
      { kind: 'damage', amount: 5 },
      { kind: 'applyStatus', status: 'weak', amount: 1 },
    ],
    liveValues: liveDamage(5, { spell: true }),
  },
  ember: {
    id: 'ember', name: 'Ember', cost: 1, rarity: 'common',
    type: 'spell', target: 'enemy', destination: 'exhaust',
    animation: 'magic',
    text: 'Deal 5 damage.{live} Apply 2 Vulnerable. Exhaust.',
    effects: [
      { kind: 'damage', amount: 5 },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2 },
    ],
    liveValues: liveDamage(5, { spell: true }),
  },
  'arcane-focus': {
    id: 'arcane-focus', name: 'Arcane Focus', cost: 0, rarity: 'common',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Gain 1 Focus. Draw 1. Exhaust.',
    effects: [
      { kind: 'applyStatus', status: 'focus', amount: 1 },
      { kind: 'draw', amount: 1 },
    ],
  },
  fireball: {
    id: 'fireball', name: 'Fireball', cost: 2, rarity: 'uncommon',
    type: 'spell', target: 'all-enemies', destination: 'discard',
    animation: 'magic',
    text: 'Deal 9 damage to all enemies.{live}',
    effects: [{ kind: 'damage', amount: 9 }],
    liveValues: liveAoE(9, { spell: true }),
  },
  attunement: {
    id: 'attunement', name: 'Attunement', cost: 1, rarity: 'uncommon',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'Gain 2 Focus.',
    effects: [{ kind: 'applyStatus', status: 'focus', amount: 2 }],
  },
  'soul-siphon': {
    id: 'soul-siphon', name: 'Soul Siphon', cost: 2, rarity: 'rare',
    type: 'spell', target: 'enemy', destination: 'exhaust',
    animation: 'magic',
    text: 'Deal 12 damage.{live} Heal 4 HP. Exhaust.',
    effects: [
      { kind: 'damage', amount: 12 },
      { kind: 'heal', amount: 4 },
    ],
    liveValues: liveDamage(12, { spell: true }),
  },
  'void-rift': {
    id: 'void-rift', name: 'Void Rift', cost: 3, rarity: 'rare',
    type: 'spell', target: 'enemy', destination: 'exhaust',
    animation: 'magic',
    text: 'Deal 26 damage.{live} Exhaust.',
    effects: [{ kind: 'damage', amount: 26 }],
    liveValues: liveDamage(26, { spell: true }),
  },

  // ================================================================
  // EXHAUST PILE GAMBLERS
  // ================================================================
  'grave-robber': {
    id: 'grave-robber', name: 'Grave Robber', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    text: 'Reveal a random card in your exhaust pile. If it is an Attack, deal damage equal to its damage. Exhaust.',
    effects: [{ kind: 'graveRobber' }],
  },
  seance: {
    id: 'seance', name: 'Seance', cost: 1, rarity: 'common',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Put a random card from your exhaust pile into your hand. Exhaust.',
    effects: [{ kind: 'seance' }],
  },
  'necromancers-pact': {
    id: 'necromancers-pact', name: "Necromancer's Pact", cost: 2, rarity: 'rare',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    animation: 'magic',
    text: 'Exhaust a random card in your discard pile. Deal damage equal to its damage. Exhaust.',
    effects: [{ kind: 'necromancersPact' }],
  },

  // ================================================================
  // RETAIN CARDS
  // ================================================================
  'forked-strike': {
    id: 'forked-strike', name: 'Forked Strike', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'discard', retain: true,
    animation: 'pierce',
    text: 'Deal 7 damage.{live} Retain.',
    effects: [{ kind: 'damage', amount: 7 }],
    liveValues: liveDamage(7),
  },
  'echo-shield': {
    id: 'echo-shield', name: 'Echo Shield', cost: 1, rarity: 'common',
    type: 'skill', target: 'self', destination: 'discard', retain: true,
    text: 'Gain 7 Block. Retain.',
    effects: [{ kind: 'block', amount: 7 }],
  },
  rebound: {
    id: 'rebound', name: 'Rebound', cost: 1, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'discard', retain: true,
    animation: 'pierce',
    text: 'Deal 9 damage.{live} Retain.',
    effects: [{ kind: 'damage', amount: 9 }],
    liveValues: liveDamage(9),
  },
  foresight: {
    id: 'foresight', name: 'Foresight', cost: 0, rarity: 'rare',
    type: 'skill', target: 'self', destination: 'draw', retain: true,
    text: 'Gain 2 Block. Draw 1. Retain. Shuffle this back into your draw pile.',
    effects: [
      { kind: 'block', amount: 2 },
      { kind: 'draw', amount: 1 },
    ],
  },

  // ================================================================
  // NEW CARDS
  // ================================================================
  expose: {
    id: 'expose', name: 'Expose', cost: 1, rarity: 'common',
    type: 'skill', target: 'enemy', destination: 'exhaust',
    text: 'Apply 3 Vulnerable. Exhaust.',
    effects: [{ kind: 'applyStatus', status: 'vulnerable', amount: 3 }],
  },
  'blood-wall': {
    id: 'blood-wall', name: 'Blood Wall', cost: 1, rarity: 'common',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Gain 16 Block. Lose 2 HP.',
    effects: [
      { kind: 'block', amount: 16 },
      { kind: 'loseHpSelf', amount: 2 },
    ],
  },

  // ================================================================
  // DISCARD MANIPULATION
  // ================================================================
  rescue: {
    id: 'rescue', name: 'Rescue', cost: 0, rarity: 'common',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Exhaust 1 random card in your discard pile. Shuffle the rest into your draw pile. Exhaust.',
    effects: [{ kind: 'rescueDiscard' }],
  },
  'second-wind': {
    id: 'second-wind', name: 'Second Wind', cost: 1, rarity: 'common',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Shuffle your discard pile into your draw pile. Exhaust.',
    effects: [{ kind: 'shuffleDiscardIntoDraw' }],
  },

  // ================================================================
  // EXHAUST PAYOFFS
  // ================================================================
  'fiend-fire': {
    id: 'fiend-fire', name: 'Fiend Fire', cost: 2, rarity: 'rare',
    type: 'attack', target: 'enemy', destination: 'discard',
    animation: 'magic',
    text: 'Put all cards in your hand into your discard pile. Deal 2 damage per card discarded.{live}',
    effects: [{ kind: 'fiendFire', amount: 2 }],
    liveValues: (s, ctx) => {
      if (!s.player || !s.hand || !ctx?.target) return { live: '' };
      const n = s.hand.length;
      if (n === 0) return { live: '' };
      const base = n * 2;
      const computed = damageFromContext(ctx.attacker, ctx.target, base);
      if (computed === base) return { live: ` (${base})` };
      return { live: ` (${computed})` };
    },
  },
  corruption: {
    id: 'corruption', name: 'Corruption', cost: 3, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'Skills cost 0. Whenever you play a Skill, Exhaust it.',
    effects: [{ kind: 'corruption' }],
  },
  'feel-no-pain': {
    id: 'feel-no-pain', name: 'Feel No Pain', cost: 1, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'Whenever a card is Exhausted, gain 3 Block.',
    effects: [{ kind: 'feelNoPain', amount: 3 }],
  },
  'dark-embrace': {
    id: 'dark-embrace', name: 'Dark Embrace', cost: 2, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'Whenever a card is Exhausted, draw 1.',
    effects: [{ kind: 'darkEmbrace' }],
  },

  // ================================================================
  // COMBO SKILLS
  // ================================================================
  preparation: {
    id: 'preparation', name: 'Preparation', cost: 0, rarity: 'common',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Draw 2. Discard 1. Exhaust.',
    effects: [
      { kind: 'draw', amount: 2 },
      { kind: 'discardRandom', amount: 1 },
    ],
  },
  'calculated-gamble': {
    id: 'calculated-gamble', name: 'Calculated Gamble', cost: 0, rarity: 'common',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Discard your hand, then draw that many cards +1. Exhaust.',
    effects: [{ kind: 'calculatedGamble' }],
  },
  'escape-plan': {
    id: 'escape-plan', name: 'Escape Plan', cost: 0, rarity: 'common',
    type: 'skill', target: 'self', destination: 'discard',
    text: 'Draw 1. If you played an Attack this turn, gain 3 Block.',
    effects: [
      { kind: 'draw', amount: 1 },
      { kind: 'escapePlan', amount: 3 },
    ],
  },
  'deep-breath': {
    id: 'deep-breath', name: 'Deep Breath', cost: 1, rarity: 'common',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Draw 2. If your discard pile has 10+ cards, draw 2 more. Exhaust.',
    effects: [
      { kind: 'draw', amount: 2 },
      { kind: 'deepBreath' },
    ],
  },
  'battle-trance': {
    id: 'battle-trance', name: 'Battle Trance', cost: 0, rarity: 'common',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Draw 3. Apply 1 No Draw. Exhaust.',
    effects: [
      { kind: 'draw', amount: 3 },
      { kind: 'applyStatus', status: 'noDraw', amount: 1 },
    ],
  },
  'burning-pact': {
    id: 'burning-pact', name: 'Burning Pact', cost: 1, rarity: 'common',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Exhaust a random card in your hand. Draw 2. Exhaust.',
    effects: [
      { kind: 'exhaustRandom' },
      { kind: 'draw', amount: 2 },
    ],
  },

  // ================================================================
  // ENERGY / HP ENGINES
  // ================================================================
  bloodletting: {
    id: 'bloodletting', name: 'Bloodletting', cost: 0, rarity: 'common',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Lose 3 HP. Gain 2 Energy. Exhaust.',
    effects: [
      { kind: 'loseHpSelf', amount: 3 },
      { kind: 'gainEnergy', amount: 2 },
    ],
  },
  'blood-for-blood': {
    id: 'blood-for-blood', name: 'Blood for Blood', cost: 3, rarity: 'common',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    animation: 'heavy',
    text: 'Costs 1 less per 8 HP lost this combat. Deal 18 damage.{live} Exhaust.',
    effects: [{ kind: 'damage', amount: 18 }],
    costReduction: { kind: 'hpLost', per: 8, min: 0 },
    liveValues: liveDamage(18),
  },
  'seeing-red': {
    id: 'seeing-red', name: 'Seeing Red', cost: 1, rarity: 'common',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Gain 2 Energy. Exhaust.',
    effects: [{ kind: 'gainEnergy', amount: 2 }],
  },
  offering: {
    id: 'offering', name: 'Offering', cost: 0, rarity: 'rare',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Lose 6 HP. Gain 2 Energy. Draw 3. Exhaust.',
    effects: [
      { kind: 'loseHpSelf', amount: 6 },
      { kind: 'gainEnergy', amount: 2 },
      { kind: 'draw', amount: 3 },
    ],
  },

  // ================================================================
  // MULTIPLIERS / ECHOES
  // ================================================================
  burst: {
    id: 'burst', name: 'Burst', cost: 1, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'This turn, your next Skill is played twice.',
    effects: [{ kind: 'burstNextSkill' }],
  },
  'echo-form': {
    id: 'echo-form', name: 'Echo Form', cost: 3, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'The first card you play each turn is played twice.',
    effects: [{ kind: 'echoForm' }],
  },
  'dual-wield': {
    id: 'dual-wield', name: 'Dual Wield', cost: 1, rarity: 'rare',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Copy a random Attack or Power in your hand. Exhaust.',
    effects: [{ kind: 'dualWield' }],
  },
  whirlwind: {
    id: 'whirlwind', name: 'Whirlwind', cost: -1, rarity: 'rare',
    type: 'attack', target: 'all-enemies', destination: 'exhaust',
    animation: 'heavy',
    text: 'Deal 5 damage to ALL enemies X times.{live} Costs all your Energy. Exhaust.',
    effects: [{ kind: 'damage', amount: 5 }],
    xCost: true,
    liveValues: (s, ctx) => {
      if (!ctx?.attacker || !ctx?.target) return { live: '' };
      const energy = s.energy ?? 0;
      if (energy === 0) return { live: '' };
      const living = (s.enemies || []).filter(e => e.hp > 0);
      if (!living.length) return { live: '' };
      const perTarget = damageFromContext(ctx.attacker, ctx.target, 5) * energy;
      const total = living.reduce(
        (sum, e) => sum + damageFromContext(ctx.attacker, e, 5) * energy, 0);
      if (living.length === 1) return { live: ` (${perTarget})` };
      return { live: ` (${perTarget} each, ${total} total)` };
    },
  },

  // ================================================================
  // RARE ATTACKS / SKILLS
  // ================================================================
  'last-stand': {
    id: 'last-stand', name: 'Last Stand', cost: 1, rarity: 'rare',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    animation: 'heavy',
    endsTurn: true,
    text: 'End your turn. Deal 6 damage plus 1 per card in your hand.{live}',
    effects: [{ kind: 'lastStand', base: 6 }],
    liveValues: (s, ctx) => {
      if (!s.hand || !ctx?.attacker || !ctx?.target) return { live: '' };
      const base = 6 + s.hand.length;
      const computed = damageFromContext(ctx.attacker, ctx.target, base);
      if (computed === base) return { live: ` (${base})` };
      return { live: ` (${computed})` };
    },
  },
  reaper: {
    id: 'reaper', name: 'Reaper', cost: 2, rarity: 'rare',
    type: 'attack', target: 'all-enemies', destination: 'exhaust',
    animation: 'magic',
    text: 'Deal 4 damage to all enemies.{live} Heal HP equal to unblocked damage dealt. Exhaust.',
    effects: [{ kind: 'reaper', amount: 4 }],
    liveValues: liveAoE(4),
  },
  adrenaline: {
    id: 'adrenaline', name: 'Adrenaline', cost: 0, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'Gain 3 Energy next turn. Exhaust.',
    effects: [{ kind: 'gainEnergyNextTurn', amount: 3 }],
  },
  inflame: {
    id: 'inflame', name: 'Inflame', cost: 1, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'Gain 3 Strength. Exhaust.',
    effects: [{ kind: 'applyStatus', status: 'strength', amount: 3 }],
  },
  'limit-break': {
    id: 'limit-break', name: 'Limit Break', cost: 1, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'Gain 5 Strength. Exhaust.',
    effects: [{ kind: 'applyStatus', status: 'strength', amount: 5 }],
  },
  bludgeon: {
    id: 'bludgeon', name: 'Bludgeon', cost: 3, rarity: 'rare',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    animation: 'heavy',
    text: 'Deal 32 damage.{live} Exhaust.',
    effects: [{ kind: 'damage', amount: 32 }],
    liveValues: liveDamage(32),
  },
  impervious: {
    id: 'impervious', name: 'Impervious', cost: 2, rarity: 'rare',
    type: 'skill', target: 'self', destination: 'exhaust',
    text: 'Gain 30 Block. Exhaust.',
    effects: [{ kind: 'block', amount: 30 }],
  },
  feed: {
    id: 'feed', name: 'Feed', cost: 1, rarity: 'rare',
    type: 'attack', target: 'enemy', destination: 'exhaust',
    text: 'Deal 10 damage.{live} If this kills, gain 3 Max HP. Exhaust.',
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'feed', amount: 3 },
    ],
    liveValues: liveDamage(10),
  },
  'demon-form': {
    id: 'demon-form', name: 'Demon Form', cost: 3, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'Each turn, gain 2 Strength.',
    effects: [{ kind: 'gainStatusPerTurn', status: 'strength', amount: 2 }],
  },
  berserk: {
    id: 'berserk', name: 'Berserk', cost: 0, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'Gain 1 Energy each turn. Take 2 damage each turn.',
    effects: [{ kind: 'gainEnergyPerTurn', amount: 1, selfDamagePerTurn: 2 }],
  },
  'double-tap': {
    id: 'double-tap', name: 'Double Tap', cost: 1, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'This turn, your next Attack is played twice.',
    effects: [{ kind: 'doubleTapNextAttack' }],
  },
  juggernaut: {
    id: 'juggernaut', name: 'Juggernaut', cost: 2, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'Whenever you gain Block, deal 5 damage to a random enemy.',
    effects: [{ kind: 'juggernaut', amount: 5 }],
  },
  rupture: {
    id: 'rupture', name: 'Rupture', cost: 1, rarity: 'rare',
    type: 'power', target: 'self', destination: 'exhaust',
    text: 'Whenever you lose HP from a card, gain 1 Strength.',
    effects: [{ kind: 'rupture' }],
  },

  // ================================================================
  // STATUSES / CURSES
  // ================================================================
  dazed: {
    id: 'dazed', name: 'Dazed', cost: 999, rarity: 'status',
    type: 'status', target: 'none', destination: 'exhaust',
    unplayable: true, ethereal: true,
    text: 'Unplayable. Ethereal.',
    effects: [],
  },
  wound: {
    id: 'wound', name: 'Wound', cost: 999, rarity: 'status',
    type: 'status', target: 'none', destination: 'exhaust',
    unplayable: true,
    text: 'Unplayable.',
    effects: [],
  },
  burn: {
    id: 'burn', name: 'Burn', cost: 999, rarity: 'status',
    type: 'status', target: 'none', destination: 'exhaust',
    unplayable: true, endOfTurnDamage: 2,
    text: 'Unplayable. At the end of your turn, take 2 damage.',
    effects: [],
  },
  slimed: {
    id: 'slimed', name: 'Slimed', cost: 1, rarity: 'status',
    type: 'status', target: 'none', destination: 'exhaust',
    text: 'Play: lose 1 Energy. Exhaust.',
    effects: [{ kind: 'loseEnergy', amount: 1 }],
  },
};

export function starterDeck() {
  return [
    ...Array(3).fill('strike'),
    ...Array(2).fill('defend'),
    'bash',
    'neutralize',
    'iron-wave',
  ];
}

// Rarity filter used by every random pool (starting deck, rewards, shop).
// Includes 'starter' so Bash and Neutralize can roll.
export function isRollable(id) {
  const r = CARDS[id]?.rarity;
  return r === 'starter' || r === 'common' || r === 'rare' || r === 'uncommon';
}

export function randomStartingDeck(rng, size = 15) {
  const strikes = 3;
  const defends = 2;
  const rest = size - strikes - defends;

  const commons = Object.keys(CARDS).filter(id => {
    const r = CARDS[id].rarity;
    return r === 'starter' || r === 'common' || r === 'uncommon';
  });
  const rares = Object.keys(CARDS).filter(id =>
    CARDS[id].rarity === 'rare');

  const ids = [
    ...Array(strikes).fill('strike'),
    ...Array(defends).fill('defend'),
  ];

  for (let i = 0; i < rest; i++) {
    const useCommon = rng() < 0.80;
    const pool = useCommon ? commons : rares;
    if (!pool.length) continue;
    const idx = Math.floor(rng() * pool.length);
    ids.push(pool.splice(idx, 1)[0]);
  }
  return ids;
}

export function cardBaseDamage(defId) {
  const def = CARDS[defId];
  if (!def) return 0;
  let total = 0;
  for (const eff of def.effects) {
    if (eff.kind === 'damage') total += eff.amount;
    if (eff.kind === 'damageRandom') total += eff.amount;
  }
  return total;
}
