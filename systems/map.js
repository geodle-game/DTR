import { WIDTH, getModeConfig, act1Layout, prologueLayout } from '../data/maps.js';

export function generateMap(rng, mode = 'mc2') {
  const config = getModeConfig(mode);
  const floors = config.regularFloors;
  const layout = mode === 'mc1' ? prologueLayout() : act1Layout();

  const nodes = [];
  const id = (f, c) => `n_${f}_${c}`;

  for (let f = 0; f < floors; f++) {
    const weights = layout.floorWeights[f] || { monster: 1 };
    const count = f === floors - 1
      ? 1
      : (config.nodeCountMin
          + Math.floor(rng() * (config.nodeCountMax - config.nodeCountMin + 1)));
    const cols = pickColumns(rng, count, WIDTH);

    const types = cols.map(() => weightedPick(rng, weights));
    enforceFloorVariety(types, weights, f, rng, config);

    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      nodes.push({
        id: id(f, c),
        floor: f,
        col: c,
        type: types[i],
        x: 0, y: 0,
        next: [],
      });
    }
  }

  const byFloor = {};
  for (const n of nodes) {
    byFloor[n.floor] = byFloor[n.floor] || [];
    byFloor[n.floor].push(n);
  }

  for (let f = 0; f < floors - 1; f++) {
    const cur = byFloor[f];
    const nxt = byFloor[f + 1];
    if (!cur || !nxt) continue;

    for (const n of cur) {
      const sorted = nxt.slice().sort((a, b) =>
        Math.abs(a.col - n.col) - Math.abs(b.col - n.col));
      const k = 1 + (rng() < 0.4 ? 1 : 0);
      const targets = sorted.slice(0, Math.min(k, sorted.length));
      for (const t of targets) {
        if (!n.next.includes(t.id)) n.next.push(t.id);
      }
    }

    for (const t of nxt) {
      const hasParent = cur.some(n => n.next.includes(t.id));
      if (!hasParent) {
        const closest = cur.slice().sort((a, b) =>
          Math.abs(a.col - t.col) - Math.abs(b.col - t.col))[0];
        closest.next.push(t.id);
      }
    }
  }

  enforcePathVariety(nodes, floors, config);

  const bossFloor = floors;
  const boss = {
    id: 'boss',
    floor: bossFloor,
    col: Math.floor(WIDTH / 2),
    type: 'boss',
    x: 0, y: 0,
    next: [],
  };
  nodes.push(boss);
  const topRegular = nodes.filter(n => n.floor === floors - 1);
  for (const n of topRegular) n.next.push(boss.id);

  return {
    floors: floors + 1,
    width: WIDTH,
    nodes,
    bossId: boss.id,
    mode,
  };
}

function enforceFloorVariety(types, weights, floor, rng, config) {
  // MC1: no elites at all — reroll any that slip through.
  if (!config.allowElites) {
    for (let i = 0; i < types.length; i++) {
      if (types[i] === 'elite') types[i] = 'monster';
    }
    // Also strip elite from weights so the weighted pick can't produce one.
    weights = { ...weights };
    delete weights.elite;
  }

  const allowMonster = (weights.monster ?? 0) > 0;

  const counts = {};
  for (const t of types) counts[t] = (counts[t] || 0) + 1;
  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    if (t === 'monster') continue;
    if ((counts[t] || 0) > 2) {
      const candidates = Object.keys(weights).filter(k => {
        if (k === t) return false;
        if ((counts[k] || 0) >= 2) return false;
        return true;
      });
      if (candidates.length) {
        const pick = candidates[Math.floor(rng() * candidates.length)];
        counts[t]--;
        counts[pick] = (counts[pick] || 0) + 1;
        types[i] = pick;
      }
    }
  }

  if (allowMonster && floor >= 2 && floor <= config.regularFloors - 2) {
    if (!types.includes('monster')) {
      const c2 = {};
      for (const t of types) c2[t] = (c2[t] || 0) + 1;
      let replaceAt = -1;
      let bestCount = -1;
      for (let i = 0; i < types.length; i++) {
        if (types[i] === 'monster') continue;
        if (c2[types[i]] > bestCount) {
          bestCount = c2[types[i]];
          replaceAt = i;
        }
      }
      if (replaceAt >= 0) types[replaceAt] = 'monster';
    }
  }
}

function enforcePathVariety(nodes, floors, config) {
  const COMBAT = new Set(['monster', 'elite', 'boss']);
  const RESET_FLOOR = floors - 1;  // the "all rest" floor before the boss
  const MAX_STREAK = 2;

  const byFloor = {};
  for (const n of nodes) {
    byFloor[n.floor] = byFloor[n.floor] || [];
    byFloor[n.floor].push(n);
  }

  const streak = {};

  for (let f = 0; f < floors; f++) {
    for (const node of byFloor[f] || []) {
      if (COMBAT.has(node.type)) {
        streak[node.id] = 0;
        continue;
      }

      if (f === RESET_FLOOR) {
        streak[node.id] = 0;
        continue;
      }

      let best = 0;
      for (const other of nodes) {
        if (other.floor >= f) continue;
        if (!other.next.includes(node.id)) continue;
        const s = streak[other.id] ?? 0;
        if (s > best) best = s;
      }

      const s = best + 1;
      if (s > MAX_STREAK) {
        node.type = 'monster';
        streak[node.id] = 0;
      } else {
        streak[node.id] = s;
      }
    }
  }
}

function pickColumns(rng, count, width) {
  const cols = [];
  const step = width / count;
  for (let i = 0; i < count; i++) {
    const base = Math.floor(i * step + step / 2);
    const jitter = Math.floor(rng() * 2) - 1;
    const c = Math.max(0, Math.min(width - 1, base + jitter));
    if (!cols.includes(c)) cols.push(c);
  }
  return cols;
}

function weightedPick(rng, weights) {
  const keys = Object.keys(weights);
  const total = keys.reduce((s, k) => s + weights[k], 0);
  let r = rng() * total;
  for (const k of keys) {
    r -= weights[k];
    if (r <= 0) return k;
  }
  return keys[0];
}

export function getNode(map, nodeId) {
  return map.nodes.find(n => n.id === nodeId);
}

export function reachableFrom(map, nodeId) {
  const node = getNode(map, nodeId);
  if (!node) return [];
  return node.next.map(id => getNode(map, id)).filter(Boolean);
}

export function startingNodes(map) {
  return map.nodes.filter(n => n.floor === 0);
}
