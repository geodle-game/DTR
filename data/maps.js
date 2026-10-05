// ============================================================
// data/maps.js
// Map generation constants and per-mode floor layouts.
// ============================================================

export const WIDTH = 7;

// MC2: the long campaign. 15 acts, 15 regular floors each.
export const FLOORS_MC2 = 15;

// MC1: the short prologue. 5 acts, 4 regular floors each (+1 boss = 5 total).
export const FLOORS_MC1 = 4;

// Legacy export so nothing that imports FLOORS breaks.
export const FLOORS = FLOORS_MC2;
export const BOSS_FLOOR = FLOORS_MC2;

export const NODE_TYPES = {
  monster:   { id: 'monster',   label: 'Monster',   color: '#ff6b6b', symbol: '⚔' },
  elite:     { id: 'elite',     label: 'Elite',     color: '#ff8f6b', symbol: '★' },
  event:     { id: 'event',     label: 'Event',     color: '#c9a3ff', symbol: '?' },
  shop:      { id: 'shop',      label: 'Shop',      color: '#ffd166', symbol: '$' },
  rest:      { id: 'rest',      label: 'Rest',      color: '#6bff9e', symbol: '☕' },
  treasure:  { id: 'treasure',  label: 'Treasure',  color: '#ffe699', symbol: '◆' },
  boss:      { id: 'boss',      label: 'Boss',      color: '#e05c5c', symbol: '☠' },
};

// ============================================================
// MC2 LAYOUT — 15 regular floors. Unchanged from before.
// ============================================================
export function act1Layout() {
  return {
    floorWeights: [
      { monster: 1 },                                              // 0
      { monster: 1 },                                              // 1
      { monster: 0.6,  event: 0.3,  shop: 0.1 },                   // 2
      { monster: 0.5,  event: 0.25, elite: 0.15, rest: 0.1 },      // 3
      { monster: 0.45, event: 0.25, treasure: 0.15, rest: 0.15 },  // 4
      { monster: 0.45, event: 0.25, elite: 0.15, rest: 0.15 },     // 5
      { monster: 0.4,  event: 0.25, shop: 0.15, rest: 0.2 },       // 6
      { monster: 0.4,  event: 0.25, elite: 0.15, treasure: 0.1, rest: 0.1 }, // 7
      { monster: 0.4,  event: 0.2,  shop: 0.15, elite: 0.1, rest: 0.15 },    // 8
      { monster: 0.4,  event: 0.2,  elite: 0.2, rest: 0.2 },       // 9
      { monster: 0.35, event: 0.2,  elite: 0.15, rest: 0.2, shop: 0.1 }, // 10
      { monster: 0.35, event: 0.2,  elite: 0.15, rest: 0.2, shop: 0.1 }, // 11
      { monster: 0.3,  event: 0.2,  elite: 0.15, rest: 0.25, treasure: 0.1 }, // 12
      { monster: 0.25, event: 0.15, elite: 0.15, rest: 0.35, shop: 0.1 },      // 13
      { rest: 1 },                                                 // 14
      { boss: 1 },                                                 // 15
    ],
  };
}

// ============================================================
// MC1 LAYOUT — 4 regular floors + boss. No elites. Tighter ramp.
// ============================================================
export function prologueLayout() {
  return {
    floorWeights: [
      { monster: 1 },                                            // 0
      { monster: 0.75, event: 0.25 },                            // 1
      { monster: 0.6,  event: 0.2,  rest: 0.2 },                 // 2
      { monster: 0.65, shop: 0.15, rest: 0.2 },                  // 3
      { rest: 1 },                                               // 4 (pre-boss)
      { boss: 1 },                                               // 5
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
    actsTotal: 5,
    regularFloors: FLOORS_MC1,
    enemyHpMult: 0.6,
    enemyDmgMult: 0.5,
    allowElites: false,
    nodeCountMin: 2,
    nodeCountMax: 3,
    plotArmor: true,
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
  },
};

export function getModeConfig(mode) {
  return RUN_MODES[mode] ?? RUN_MODES.mc2;
}
