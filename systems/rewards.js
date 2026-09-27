import { CARDS } from '../data/cards.js';
import { RELICS } from '../data/relics.js';

export function rollCoins(rng, kind) {
  if (kind === 'elite') return 40 + Math.floor(rng() * 30);
  if (kind === 'boss')  return 80 + Math.floor(rng() * 40);
  return 12 + Math.floor(rng() * 14);
}

export function rollCardChoices(rng, count = 3) {
  // Include 'starter' and 'uncommon' rarities so Bash, Neutralize, and
  // the spell pool (Fireball, Attunement) can appear as rewards.
  const pool = Object.keys(CARDS).filter(id => {
    const r = CARDS[id].rarity;
    return r === 'starter' || r === 'common' || r === 'uncommon' || r === 'rare';
  });
  const out = [];
  const copy = pool.slice();
  for (let i = 0; i < count && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export function rollRelicChoices(rng, excluded = [], count = 3) {
  const pool = Object.keys(RELICS).filter(id => !excluded.includes(id));
  const out = [];
  const copy = pool.slice();
  for (let i = 0; i < count && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export function rollActTransition(rng, ownedRelics) {
  return {
    coins: 50 + Math.floor(rng() * 30),
    cards: rollCardChoices(rng, 3),
    relicChoices: rollRelicChoices(rng, ownedRelics, 3),
    cardTaken: false,
    relicTaken: null,
  };
}
