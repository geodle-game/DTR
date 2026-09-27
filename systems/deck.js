let uidCounter = 0;

export function makeCard(defId, enchant = null) {
  return { uid: `c${++uidCounter}`, defId, enchant };
}

export function makeEnemyCard(defId) {
  return { uid: `ec${++uidCounter}`, defId };
}

export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  const next = function next() {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 0xffffffff;
  };
  next.getState = () => s;
  next.setState = (v) => { s = (v >>> 0) || 1; };
  return next;
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function draw(state, n) {
  if (!state.newlyDrawn) state.newlyDrawn = new Set();
  for (let i = 0; i < n; i++) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length > 0) {
        state.drawPile = shuffle(state.discardPile, state.rng);
        state.discardPile = [];
      } else if (state.exhaustPile.length > 0) {
        state.drawPile = shuffle(state.exhaustPile, state.rng);
        state.exhaustPile = [];
      } else {
        return;
      }
    }
    const card = state.drawPile.pop();
    state.hand.push(card);
    state.newlyDrawn.add(card.uid);
  }
}

export function recycleHand(state) {
  const retained = [];
  const rest = [];

  for (const card of state.hand) {
    const def = state.cardDef(card);
    if (def?.retain) {
      retained.push(card);
    } else {
      rest.push(card);
    }
  }

  const keepCount = Math.floor(rest.length / 2);
  const shuffled = shuffle(rest, state.rng);
  for (let i = 0; i < keepCount; i++) retained.push(shuffled[i]);

  const discarded = shuffled.slice(keepCount);
  state.discardPile.push(...discarded);

  state.hand = retained;

  if (state.drawPile.length < 5 && state.discardPile.length > 0) {
    state.drawPile = shuffle(
      state.drawPile.concat(state.discardPile),
      state.rng
    );
    state.discardPile = [];
  }
}

export function drawEnemyCard(enemy, rng) {
  if (enemy.cardDraw.length === 0) {
    if (enemy.cardDiscard.length === 0) return null;
    enemy.cardDraw = shuffle(enemy.cardDiscard, rng);
    enemy.cardDiscard = [];
  }
  return enemy.cardDraw.pop();
}
