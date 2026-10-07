// ============================================================
// data/maps.js
// Map generation constants and per-mode floor layouts.
// ============================================================

export const WIDTH = 7;

export const FLOORS_MC2 = 15;   // regular floors per MC2 act
export const FLOORS_MC1 = 4;    // regular floors per MC1 act (tutorial)

export const FLOORS = FLOORS_MC2;
export const BOSS_FLOOR = FLOORS_MC2;

export const NODE_TYPES = {
  monster:   { id: 'monster',   label: 'Monster',         color: '#ff6b6b', symbol: '⚔' },
  elite:     { id: 'elite',     label: 'Elite',           color: '#ff8f6b', symbol: '★' },
  event:     { id: 'event',     label: 'Event',           color: '#c9a3ff', symbol: '?' },
  shop:      { id: 'shop',      label: 'Shop',            color: '#ffd166', symbol: '$' },
  rest:      { id: 'rest',      label: 'Rest',            color: '#6bff9e', symbol: '☕' },
  treasure:  { id: 'treasure',  label: 'Treasure',        color: '#ffe699', symbol: '◆' },
  fragment:  { id: 'fragment',  label: 'Script Fragment', color: '#6fb3ff', symbol: '◈' },
  boss:      { id: 'boss',      label: 'Boss',            color: '#e05c5c', symbol: '☠' },
};

// ============================================================
// MC2 LAYOUT — 15 regular floors + boss.
// ============================================================
export function act1Layout() {
  return {
    floorWeights: [
      { monster: 1 },
      { monster: 1 },
      { monster: 0.6,  event: 0.3,  shop: 0.1 },
      { monster: 0.5,  event: 0.25, elite: 0.15, rest: 0.1 },
      { monster: 0.45, event: 0.25, treasure: 0.15, rest: 0.15 },
      { monster: 0.45, event: 0.25, elite: 0.15, rest: 0.15 },
      { monster: 0.4,  event: 0.25, shop: 0.15, rest: 0.2 },
      { monster: 0.4,  event: 0.25, elite: 0.15, treasure: 0.1, rest: 0.1 },
      { monster: 0.4,  event: 0.2,  shop: 0.15, elite: 0.1, rest: 0.15 },
      { monster: 0.4,  event: 0.2,  elite: 0.2, rest: 0.2 },
      { monster: 0.35, event: 0.2,  elite: 0.15, rest: 0.2, shop: 0.1 },
      { monster: 0.35, event: 0.2,  elite: 0.15, rest: 0.2, shop: 0.1 },
      { monster: 0.3,  event: 0.2,  elite: 0.15, rest: 0.25, treasure: 0.1 },
      { monster: 0.25, event: 0.15, elite: 0.15, rest: 0.35, shop: 0.1 },
      { rest: 1 },
      { boss: 1 },
    ],
  };
}

// ============================================================
// MC1 LAYOUT — 4 regular floors + boss. Tutorial act.
// The boss is the researcher (weakened variant). No elites.
// ============================================================
export function prologueLayout() {
  return {
    floorWeights: [
      { monster: 1 },
      { monster: 0.75, event: 0.25 },
      { monster: 0.6,  event: 0.2,  rest: 0.2 },
      { monster: 0.65, shop: 0.15, rest: 0.2 },
      { rest: 1 },
      { boss: 1 },
    ],
  };
}

// ============================================================
// Mode config — read by systems at runtime.
// ============================================================
export const RUN_MODES = {
  mc1: {
    id: 'mc1',
    label: 'Prologue',
    // MC1 is a single-act tutorial. After the researcher, the
    // game transitions straight to the absorption scene, then
    // MC2 unlocks.
    actsTotal: 1,
    regularFloors: FLOORS_MC1,
    enemyHpMult: 0.6,
    enemyDmgMult: 0.5,
    allowElites: false,
    nodeCountMin: 2,
    nodeCountMax: 3,
    plotArmor: true,
    // MC1 has all 15 fragments from the start; no fragment nodes spawn.
    spawnFragments: false,
  },
  mc2: {
    id: 'mc2',
    label: 'Descent',
    actsTotal: 15,
    regularFloors: FLOORS_MC2,
    enemyHpMult: 1.0,
    enemyDmgMult: 1.0,
    allowElites: true,
    nodeCountMin: 2,
    nodeCountMax: 5,
    plotArmor: false,
    // MC2 starts with 1 fragment and has to find the other 14 across 14 acts.
    spawnFragments: true,
  },
};

export function getModeConfig(mode) {
  return RUN_MODES[mode] ?? RUN_MODES.mc2;
}
