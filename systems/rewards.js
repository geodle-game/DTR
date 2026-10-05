import { CARDS } from '../data/cards.js';
import { RELICS } from '../data/relics.js';
import { cardWeightForClass, isCardAllowedForClass } from '../data/classes.js';

export function rollCoins(rng, kind) {
  if (kind === 'elite') return 40 + Math.floor(rng() * 30);
  if (kind === 'boss')  return 80 + Math.floor(rng() * 40);
  return 12 + Math.floor(rng() * 14);
}

export function rollCardChoices(rng, count = 3, classId = null) {
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

  const out = [];
  for (let i = 0; i < count && weighted.length; i++) {
    const total = weighted.reduce((s, e) => s + e.w, 0);
    let r = rng() * total;
    let idx = 0;
    for (let j = 0; j < weighted.length; j++) {
      r -= weighted[j].w;
      if (r <= 0) { idx = j; break; }
    }
    out.push(weighted[idx].id);
    weighted.splice(idx, 1);
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
