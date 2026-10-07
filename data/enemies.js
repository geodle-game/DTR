import { BOSSES } from './bosses/index.js';

export const ENEMIES = {
  // ============================================================
  // THE SPAWNED
  // Machine-made. Unfinished. Wrong.
  // ============================================================
  'echo-spawn': {
    id: 'echo-spawn', name: 'Echo Spawn', hp: 18,
    deck: ['tendril-lash', 'coalesce', 'tendril-lash'],
  },
  gutterling: {
    id: 'gutterling', name: 'Gutterling', hp: 12,
    deck: ['tendril-lash', 'fraying-touch'],
  },
  waxling: {
    id: 'waxling', name: 'Waxling', hp: 24,
    deck: ['engulf', 'coalesce', 'tendril-lash'],
  },
  handler: {
    id: 'handler', name: 'Handler', hp: 44,
    deck: ['coalesce', 'seethe', 'tendril-lash', 'coalesce'],
  },
  suture: {
    id: 'suture', name: 'Suture', hp: 50,
    deck: ['split-grow', 'coalesce', 'tendril-lash'],
  },
  vessel: {
    id: 'vessel', name: 'Vessel', hp: 60,
    deck: ['engulf', 'coalesce', 'unravel', 'seethe'],
  },
  'half-formed': {
    id: 'half-formed', name: 'Half-Formed', hp: 70,
    deck: ['engulf', 'unravel', 'coalesce', 'seethe'],
  },
  null: {
    id: 'null', name: 'Null', hp: 65,
    deck: ['tendril-lash', 'coalesce', 'tendril-lash'],
  },
  looper: {
    id: 'looper', name: 'Looper', hp: 55,
    deck: ['echo-strike', 'tendril-lash', 'echo-strike'],
  },

  // ============================================================
  // THE ABSORBED
  // Asteri remnants. Still screaming.
  // ============================================================
  whisper: {
    id: 'whisper', name: 'Whisper', hp: 20,
    deck: ['borrowed-script', 'memory-lance'],
  },
  faded: {
    id: 'faded', name: 'Faded', hp: 14,
    deck: ['memory-lance', 'unfinished-sentence'],
  },
  keeper: {
    id: 'keeper', name: 'Keeper', hp: 48,
    deck: ['mourn', 'memory-lance', 'borrowed-script'],
  },
  scholar: {
    id: 'scholar', name: 'Scholar', hp: 44,
    deck: ['unfinished-sentence', 'memory-lance', 'borrowed-script'],
  },
  recaller: {
    id: 'recaller', name: 'Recaller', hp: 72,
    deck: ['memory-lance', 'borrowed-script', 'echo-of-what-was'],
  },
  witness: {
    id: 'witness', name: 'Witness', hp: 68,
    deck: ['mourn', 'memory-lance', 'grief'],
  },

  // ============================================================
  // THE WILD
  // Pre-Asteri. Predators. Do not care about you.
  // ============================================================
  burrower: {
    id: 'burrower', name: 'Burrower', hp: 32,
    deck: ['thrash', 'burrow', 'stone-break'],
  },
  'stone-eater': {
    id: 'stone-eater', name: 'Stone-Eater', hp: 38,
    deck: ['stone-break', 'carapace', 'thrash'],
  },
  'cave-mimic': {
    id: 'cave-mimic', name: 'Cave Mimic', hp: 55,
    deck: ['gnash', 'stone-break', 'burrow', 'gnash'],
  },
  'rust-beetle': {
    id: 'rust-beetle', name: 'Rust Beetle', hp: 40,
    deck: ['gnash', 'carapace', 'thrash'],
  },
  'blind-maw': {
    id: 'blind-maw', name: 'Blind Maw', hp: 80,
    deck: ['swallow', 'gnash', 'thrash'],
  },
  throat: {
    id: 'throat', name: 'Throat', hp: 85,
    deck: ['engulf', 'swallow', 'gnash'],
  },

  // ============================================================
  // THE VEIL'S PROJECTS
  // Organized. Cruel. Well-funded.
  // ============================================================
  construct: {
    id: 'construct', name: 'Construct', hp: 52,
    deck: ['null-shield', 'calibrated-strike', 'binding-field'],
  },
  graft: {
    id: 'graft', name: 'Graft', hp: 60,
    deck: ['overcharge', 'calibrated-strike', 'null-shield'],
  },
  loyalist: {
    id: 'loyalist', name: 'Loyalist', hp: 62,
    deck: ['calibrated-strike', 'binding-field', 'null-shield'],
  },
  'broken-instrument': {
    id: 'broken-instrument', name: 'Broken Instrument', hp: 58,
    deck: ['overcharge', 'calibrated-strike', 'binding-field', 'null-shield'],
  },

  // ============================================================
  // SURFACE INTRUDERS
  // Desperate. Mundane. Dangerous anyway.
  // ============================================================
  deserter: {
    id: 'deserter', name: 'Deserter', hp: 30,
    deck: ['harry', 'feint', 'riposte'],
  },
  'rival-explorer': {
    id: 'rival-explorer', name: 'Rival Explorer', hp: 42,
    deck: ['harry', 'riposte', 'trick-shot'],
  },
  'bound-familiar': {
    id: 'bound-familiar', name: 'Bound Familiar', hp: 34,
    deck: ['thrash', 'gnash', 'burrow'],
  },
  'exile-knight': {
    id: 'exile-knight', name: 'Exile-Knight', hp: 78,
    deck: ['riposte', 'harry', 'battle-cry', 'riposte'],
  },
  archivist: {
    id: 'archivist', name: 'Archivist', hp: 60,
    deck: ['trick-shot', 'harry', 'provision', 'trick-shot'],
  },

  // ============================================================
  // ELITES
  // ============================================================
  'stitched-horror': {
    id: 'stitched-horror', name: 'Stitched Horror', hp: 110,
    isElite: true,
    deck: ['engulf', 'unravel', 'seethe', 'coalesce', 'engulf'],
  },
  'asteri-remnant': {
    id: 'asteri-remnant', name: 'Asteri Remnant', hp: 105,
    isElite: true,
    deck: ['memory-lance', 'echo-of-what-was', 'mourn', 'grief'],
  },
  'root-tyrant': {
    id: 'root-tyrant', name: 'Root Tyrant', hp: 130,
    isElite: true,
    deck: ['swallow', 'carapace', 'stone-break', 'gnash'],
  },
  'veil-enforcer': {
    id: 'veil-enforcer', name: 'Veil Enforcer', hp: 120,
    isElite: true,
    deck: ['calibrated-strike', 'binding-field', 'overcharge', 'null-shield'],
  },
  'master-claimant': {
    id: 'master-claimant', name: 'Master Claimant', hp: 115,
    isElite: true,
    deck: ['riposte', 'battle-cry', 'trick-shot', 'harry', 'riposte'],
  },

  // ============================================================
  // ACT 1 INLINE BOSSES
  // Three candidates, one beaten per run.
  // ============================================================
  'waxling-king': {
    id: 'waxling-king', name: 'The Waxling King', hp: 110,
    isBoss: true,
    deck: ['waxflow', 'crown-self', 'melt', 'waxflow', 'crown-self'],
  },
  'the-remembering': {
    id: 'the-remembering', name: 'The Remembering', hp: 120,
    isBoss: true,
    deck: ['shatter-memory', 'mourn-song', 'remember-me', 'shatter-memory', 'mourn-song'],
  },
  'stitched-sovereign': {
    id: 'stitched-sovereign', name: 'The Stitched Sovereign', hp: 130,
    isBoss: true,
    deck: ['gather-flesh', 'stitch', 'crown-self', 'gather-flesh', 'seethe'],
  },
};

// Merge bosses from data/bosses/*.js into ENEMIES.
for (const bossModule of BOSSES) {
  if (bossModule.ENEMY) {
    ENEMIES[bossModule.ENEMY.id] = bossModule.ENEMY;
  }
}

export const ENCOUNTERS = {
  // ============================================================
  // NORMAL POOLS
  // Encounter IDs kept from the previous structure so state.js
  // pickEncounter() continues to work without changes.
  // ============================================================
  'act1-basic':     ['echo-spawn', 'gutterling'],
  'act1-cultist':   ['whisper'],
  'act1-fungi':     ['burrower'],
  'act1-slaver':    ['deserter', 'gutterling'],
  'act1-slimes':    ['waxling', 'gutterling', 'gutterling'],
  'act1-spike':     ['stone-eater'],
  'act1-looter':    ['deserter'],
  'act1-gremlins':  ['gutterling', 'gutterling', 'gutterling', 'gutterling'],
  'act1-chosen':    ['whisper', 'faded'],
  'act1-byrd':      ['faded', 'faded', 'faded'],
  'act1-centurion': ['stone-eater', 'burrower'],

  // ============================================================
  // ELITE POOLS
  // ============================================================
  'act1-elite-1':   ['stitched-horror'],
  'act1-elite-2':   ['asteri-remnant'],
  'act1-elite-3':   ['root-tyrant'],
  'act1-elite-4':   ['veil-enforcer'],
  'act1-elite-5':   ['master-claimant'],

  // ============================================================
  // BOSSES
  // ============================================================
  'act1-boss':      ['waxling-king'],
  'act1-boss-2':    ['the-remembering'],
  'act1-boss-3':    ['stitched-sovereign'],

  // These three point at the old boss module IDs for now.
  // They get replaced when we do the boss rewrite in the next
  // message. Until then they keep the game functional.
  'act3-boss':      ['fallen-drawn'],
  'act4-boss':      ['the-warden'],
  'final-boss':     ['dungeon-core'],
};

export function getEnemyDef(id) {
  const def = ENEMIES[id];
  if (!def) throw new Error(`Unknown enemy: ${id}`);
  return def;
}
