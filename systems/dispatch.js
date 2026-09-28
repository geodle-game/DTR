// ============================================================
// systems/dispatch.js
// ============================================================

import {
  state, newRun, chooseRelic, confirmDeck, startNode, backToMap,
  claimReward, takeRewardCard, skipRewardCard,
  pickEventChoice, buyShopCard, buyShopHeal, buyShopRemove,
  restHeal, restEnchantStart, applyEnchant, skipEnchant,
  returnToMainMenu, nextAct, claimActReward,
  takeActRewardCard, skipActRewardCard, takeActRewardRelic,
  finishRun, pickTreasureRelic, skipTreasure,
} from './state.js';
import {
  playCard, beginEnemyTurn, resolveEnemyTurn,
} from './combat.js';
import {
  getMode, sendAction, sendSnapshot, onAction, onSnapshot,
} from './net.js';
import { snapshotState, restoreSnapshot } from './snapshot.js';
import { render } from '../ui/render.js';
import { animateHits } from '../ui/animations.js';

// ============================================================
// Public API
// ============================================================

export function dispatch(action) {
  const mode = getMode();

  // Guest: forward to host, don't apply locally.
  if (mode === 'guest') {
    sendAction(action);
    return;
  }

  // Single or host: apply locally.
  applyAction(action);

  // Host: broadcast resulting state.
  if (mode === 'host') {
    sendSnapshot(snapshotState());
  }

  render();
}

// ============================================================
// Wire up network callbacks
// ============================================================

onAction(action => {
  // Host receives an action from the guest.
  state.lastHits = [];
  applyAction(action);
  sendSnapshot(snapshotState());
  render();
  if (state.lastHits?.length) {
    const hits = state.lastHits;
    state.lastHits = [];
    animateHits(hits);
  }
});

onSnapshot(snap => {
  // Guest receives a full state from the host.
  const hits = (snap.lastHits || []).slice();
  restoreSnapshot(snap);
  render();
  if (hits.length) setTimeout(() => animateHits(hits), 30);
});

// ============================================================
// Action handlers
// ============================================================

function applyAction(action) {
  switch (action.type) {
    // ---- Run lifecycle ----
    case 'NEW_RUN':
      newRun(action.seed);
      break;

    case 'CHOOSE_RELIC':
      chooseRelic(action.relicId);
      break;

    case 'CONFIRM_DECK':
      confirmDeck();
      break;

    case 'RETURN_TO_MAIN_MENU':
      returnToMainMenu();
      break;

    // ---- Map ----
    case 'START_NODE':
      startNode(action.nodeId);
      break;

    case 'BACK_TO_MAP':
      backToMap();
      break;

    // ---- Combat ----
    case 'PLAY_CARD': {
      const card = state.players[0].hand.find(c => c.uid === action.cardUid);
      if (!card) return false;
      return playCard(card, action.targetUid ?? null);
    }

    case 'END_TURN': {
      if (state.turn !== 'player' || state.over) return false;
      state.pendingCardUid = null;
      beginEnemyTurn();
      if (state.over) return true;
      resolveEnemyTurn();
      return true;
    }

    case 'SELECT_ENEMY':
      state.selectedEnemyId = action.enemyUid;
      return true;

    case 'PENDING_TARGET':
      state.pendingCardUid = action.cardUid;
      return true;

    case 'CLEAR_PENDING':
      state.pendingCardUid = null;
      return true;

    // ---- Rewards ----
    case 'CLAIM_REWARD':       claimReward(); break;
    case 'TAKE_REWARD_CARD':   takeRewardCard(action.defId); break;
    case 'SKIP_REWARD_CARD':   skipRewardCard(); break;
    case 'PICK_EVENT_CHOICE':  pickEventChoice(action.index); break;

    // ---- Shop ----
    case 'BUY_SHOP_CARD':      buyShopCard(action.index); break;
    case 'BUY_SHOP_HEAL':      buyShopHeal(); break;
    case 'BUY_SHOP_REMOVE':    buyShopRemove(action.index); break;

    // ---- Rest ----
    case 'REST_HEAL':          restHeal(); break;
    case 'REST_ENCHANT_START': restEnchantStart(); break;
    case 'APPLY_ENCHANT':      applyEnchant(action.index); break;
    case 'SKIP_ENCHANT':       skipEnchant(); break;

    // ---- Act transition ----
    case 'NEXT_ACT':           nextAct(); break;
    case 'CLAIM_ACT_REWARD':   claimActReward(); break;
    case 'TAKE_ACT_REWARD_CARD':   takeActRewardCard(action.defId); break;
    case 'SKIP_ACT_REWARD_CARD':   skipActRewardCard(); break;
    case 'TAKE_ACT_REWARD_RELIC':  takeActRewardRelic(action.relicId); break;

    // ---- Treasure ----
    case 'PICK_TREASURE_RELIC': pickTreasureRelic(action.relicId); break;
    case 'SKIP_TREASURE':       skipTreasure(); break;

    // ---- End ----
    case 'FINISH_RUN':          finishRun(); break;

    default:
      console.warn('Unknown action:', action.type);
  }
}
