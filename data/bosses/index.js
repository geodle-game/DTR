// ============================================================
// Boss registry. Complete — Acts 2-15.
// Act 1 bosses are inline in data/enemies.js.
// ============================================================

import * as kindOne from './the-kind-one.js';
import * as burrowerKing from './burrower-king.js';
import * as predecessor from './predecessor.js';
import * as veilwright from './veilwright.js';
import * as forgeWarden from './forge-warden.js';
import * as drownedChoir from './drowned-choir.js';
import * as progeny from './progeny.js';
import * as claimant from './claimant.js';
import * as nullWalker from './null-walker.js';
import * as firstEcho from './first-echo.js';
import * as recaller from './recaller.js';
import * as blindGod from './blind-god.js';
import * as veilsHand from './veils-hand.js';
import * as mirror from './mirror.js';
import * as archivist from './archivist.js';
import * as mourningChorus from './mourning-chorus.js';
import * as chainedBeast from './chained-beast.js';
import * as wardenOfChains from './warden-of-chains.js';
import * as progenitor from './progenitor.js';
import * as unmade from './unmade.js';
import * as claimantKing from './claimant-king.js';
import * as gardenersEcho from './gardeners-echo.js';
import * as veilCouncil from './veil-council.js';
import * as firstExplorer from './first-explorer.js';
import * as gatekeeper from './gatekeeper.js';
import * as deepKeeper from './deep-keeper.js';
import * as researcher from './researcher.js';

export const BOSSES = [
  // Act 2
  kindOne,
  burrowerKing,
  // Act 3
  predecessor,
  veilwright,
  // Act 4
  forgeWarden,
  drownedChoir,
  // Act 5
  progeny,
  claimant,
  // Act 6
  nullWalker,
  firstEcho,
  // Act 7
  recaller,
  blindGod,
  // Act 8
  veilsHand,
  mirror,
  // Act 9
  archivist,
  mourningChorus,
  // Act 10
  chainedBeast,
  wardenOfChains,
  // Act 11
  progenitor,
  unmade,
  // Act 12
  claimantKing,
  gardenersEcho,
  // Act 13
  veilCouncil,
  firstExplorer,
  // Act 14
  gatekeeper,
  deepKeeper,
  // Act 15
  researcher,
];

// Convenience map: act number → boss enemy ids.
// Used by systems/state.js pickEncounter().
export const BOSS_POOLS = {
  1:  ['waxling-king', 'the-remembering', 'stitched-sovereign'],
  2:  ['the-kind-one', 'burrower-king'],
  3:  ['predecessor', 'veilwright'],
  4:  ['forge-warden', 'drowned-choir'],
  5:  ['progeny', 'claimant'],
  6:  ['null-walker', 'first-echo'],
  7:  ['recaller', 'blind-god'],
  8:  ['veils-hand', 'mirror'],
  9:  ['archivist', 'mourning-chorus'],
  10: ['chained-beast', 'warden-of-chains'],
  11: ['progenitor', 'unmade'],
  12: ['claimant-king', 'gardeners-echo'],
  13: ['veil-council', 'first-explorer'],
  14: ['gatekeeper', 'deep-keeper'],
  15: ['researcher'],
};
