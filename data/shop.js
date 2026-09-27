import { CARDS } from './cards.js';

export function rollShop(rng, count = 5) {
  // Match the reward pool: starter, common, uncommon, rare all rollable.
  const pool = Object.keys(CARDS).filter(id => {
    const r = CARDS[id].rarity;
    return r === 'starter' || r === 'common' || r === 'uncommon' || r === 'rare';
  });

  const items = [];
  const copy = pool.slice();

  for (let i = 0; i < count && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length);
    const id = copy.splice(idx, 1)[0];
    const rarity = CARDS[id].rarity;

    // Starter-rarity cards (Bash, Neutralize) price like commons.
    const price =
      rarity === 'rare' ? 130 :
      rarity === 'uncommon' ? 95 :
      70;

    items.push({ defId: id, price });
  }
  return items;
}
