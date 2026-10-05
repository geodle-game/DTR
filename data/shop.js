import { CARDS } from './cards.js';
import { cardWeightForClass, isCardAllowedForClass } from './classes.js';

export function rollShop(rng, count = 5, classId = null) {
  const pool = Object.keys(CARDS).filter(id => {
    const r = CARDS[id].rarity;
    if (r !== 'starter' && r !== 'common' && r !== 'uncommon' && r !== 'rare') return false;
    if (classId && !isCardAllowedForClass(id, classId)) return false;
    return true;
  });

  const weighted = pool.map(id => ({
    id,
    w: classId ? Math.max(0.01, cardWeightForClass(id, classId)) : 1,
  }));

  const items = [];
  for (let i = 0; i < count && weighted.length; i++) {
    const total = weighted.reduce((s, e) => s + e.w, 0);
    let r = rng() * total;
    let idx = 0;
    for (let j = 0; j < weighted.length; j++) {
      r -= weighted[j].w;
      if (r <= 0) { idx = j; break; }
    }
    const id = weighted[idx].id;
    weighted.splice(idx, 1);

    const rarity = CARDS[id].rarity;
    const price =
      rarity === 'rare'     ? 130 :
      rarity === 'uncommon' ? 95  :
      70;
    items.push({ defId: id, price });
  }
  return items;
}
