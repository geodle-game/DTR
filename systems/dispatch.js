// ============================================================
// systems/dispatch.js
// ============================================================

import {
  state, newRun, pickClass, chooseRelic, confirmDeck, startNode, backToMap,
  claimReward, takeRewardCard, skipRewardCard,
  pickEventChoice, buyShopCard, buyShopHeal, buyShopRemove, shopDone,
  restHeal, restEnchantStart, applyEnchant, skipEnchant,
  returnToMainMenu, nextAct, claimActReward,
  takeActRewardCard, skipActRewardCard, takeActRewardRelic,
  finishRun, pickTreasureRelic, skipTreasure,
  activePlayer, setMetaFocus, setDeckViewFocus,
  startCoopRun, restartAct, triggerPlotArmor,
  advanceAbsorption, completeAbsorption,
  recallTo, openRecallScreen, closeRecallScreen,
} from './state.js';
import {
  playCard, beginPlayerEndTurn, beginEnemyTurn, resolveEnemyTurn,
} from './combat.js';
import {
  getMode, sendAction, sendSnapshot, onAction, onSnapshot,
} from './net.js';
import { snapshotState, restoreSnapshot } from './snapshot.js';
import { render } from '../ui/render.js';
import { animateHits } from '../ui/animations.js';

// ------------------------------------------------------------
// Local slot / network helpers
// ------------------------------------------------------------

function localSlot() {
  return state.localSlot;
}

function isMyAction(action) {
  const slot = localSlot();
  if (slot == null) return true;
  if (action.actorId == null) return true;
  return action.actorId === slot;
}

// ------------------------------------------------------------
// Public dispatch
// ------------------------------------------------------------

export function dispatch(action) {
  const mode = getMode();

  const tagged = { ...action };
  if (tagged.actorId == null && localSlot() != null) {
    tagged.actorId = localSlot();
  }

  console.log('[dispatch]', mode, 'slot=', localSlot(), 'action=', tagged);

  if (mode === 'guest') {
    if (!isMyAction(tagged)) {
      console.warn('[dispatch] guest REJECTED its own action:', tagged);
      return;
    }
    console.log('[dispatch] guest → sendAction', tagged);
    sendAction(tagged);
    return;
  }

  applyAction(tagged, /* fromNetwork */ false);

  if (mode === 'host') {
    sendSnapshot(snapshotState());
  }

  render();
}

// ------------------------------------------------------------
// Network callbacks
// ------------------------------------------------------------

onAction(action => {
  console.log('[onAction] host received from guest:', action);

  const slot = localSlot();
  if (slot != null && action.actorId != null && action.actorId === slot) {
    console.warn('[onAction] host rejected echo of own action');
    return;
  }

  if (action.type === 'PLAY_CARD') {
    const idx = action.actorId ?? 0;
    const p = state.players[idx];
    const handUids = p ? p.hand.map(c => c.uid) : [];
    const found = p ? p.hand.find(c => c.uid === action.cardUid) : null;
    console.log('[onAction][PLAY_CARD] actorIdx=', idx,
      'cardUid=', action.cardUid,
      'found=', !!found,
      'hand=', handUids);
  }

  state.lastHits = [];
  applyAction(action, /* fromNetwork */ true);
  sendSnapshot(snapshotState());
  render();
  if (state.lastHits?.length) {
    const hits = state.lastHits;
    state.lastHits = [];
    animateHits(hits);
  }
});

onSnapshot(snap => {
  console.log('[onSnapshot] guest received snapshot',
    'screen=', snap.screen,
    'turn=', snap.turn,
    'p1Energy=', snap.players?.[1]?.energy,
    'enemies[0].hp=', snap.enemies?.[0]?.hp,
    'lastHits=', snap.lastHits?.length);
  const hits = (snap.lastHits || []).slice();
  restoreSnapshot(snap);
  render();
  if (hits.length) setTimeout(() => animateHits(hits), 30);
});

// ------------------------------------------------------------
// Action handler
// ------------------------------------------------------------

function applyAction(action, fromNetwork = false) {
  const mode = getMode();
  const slot = localSlot();

  if (!fromNetwork && mode !== 'guest' && slot != null && action.actorId != null) {
    if (action.actorId !== slot) {
      console.warn('[applyAction] local slot mismatch, dropping', action);
      return;
    }
  }

  switch (action.type) {
    // ---- Run lifecycle ----
    case 'NEW_RUN':              newRun(action.seed); break;
    case 'START_COOP_RUN':       startCoopRun(action.seed); break;
    case 'PICK_CLASS':           pickClass(action.classId, action.actorId); break;
    case 'CHOOSE_RELIC':         chooseRelic(action.relicId, action.actorId); break;
    case 'CONFIRM_DECK':         confirmDeck(action.actorId); break;
    case 'RETURN_TO_MAIN_MENU':  returnToMainMenu(); break;

    // ---- Map ----
    case 'START_NODE':           startNode(action.nodeId); break;
    case 'BACK_TO_MAP':          backToMap(); break;

    // ---- Recall (map teleport) ----
    case 'OPEN_RECALL':          openRecallScreen(); break;
    case 'CLOSE_RECALL':         closeRecallScreen(); break;
    case 'RECALL_TO':            recallTo(action.act, action.nodeId, action.actorId); break;

    // ---- Focus ----
    case 'SET_META_FOCUS':       setMetaFocus(action.index); break;
    case 'SET_DECKVIEW_FOCUS':   setDeckViewFocus(action.index); break;

    // ---- Combat ----
    case 'PLAY_CARD': {
      const actorIdx = action.actorId ?? 0;
      const player = state.players[actorIdx];
      if (!player) {
        console.warn('[PLAY_CARD] FAIL: no player at index', actorIdx);
        return false;
      }
      const card = player.hand.find(c => c.uid === action.cardUid);
      if (!card) {
        console.warn('[PLAY_CARD] FAIL: card not in hand',
          'looking for uid', action.cardUid,
          'in P' + actorIdx + ' hand of', player.hand.map(c => c.uid));
        return false;
      }
      const result = playCard(card, player, action.targetUid ?? null);
      if (!result) {
        console.warn('[PLAY_CARD] FAIL: playCard returned false',
          'def=', card.defId,
          'energy=', player.energy,
          'ended=', player.endedTurn,
          'turn=', state.turn,
          'over=', state.over);
      }
      return result;
    }

    case 'END_TURN': {
      if (state.turn !== 'player' || state.over) {
        console.warn('[END_TURN] rejected, turn/over =', state.turn, state.over);
        return false;
      }
      const actorIdx = action.actorId ?? 0;
      console.log('[END_TURN] P' + actorIdx + ' ending');
      const { allReady } = beginPlayerEndTurn(actorIdx);
      console.log('[END_TURN] allReady=', allReady);
      if (state.over) return true;
      if (allReady) {
        beginEnemyTurn();
        resolveEnemyTurn();
      }
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

    // ---- Plot armor (MC1 act restart) ----
    case 'TRIGGER_PLOT_ARMOR':   triggerPlotArmor(); break;
    case 'RESTART_ACT':          restartAct(); break;

    // ---- Absorption (MC1 ending) ----
    case 'ADVANCE_ABSORPTION':   advanceAbsorption(); break;
    case 'COMPLETE_ABSORPTION':  completeAbsorption(); break;

    // ---- Rewards ----
    case 'CLAIM_REWARD':         claimReward(action.actorId); break;
    case 'TAKE_REWARD_CARD':     takeRewardCard(action.defId, action.actorId); break;
    case 'SKIP_REWARD_CARD':     skipRewardCard(action.actorId); break;
    case 'PICK_EVENT_CHOICE':    pickEventChoice(action.index, action.actorId); break;

    // ---- Shop ----
    case 'BUY_SHOP_CARD':        buyShopCard(action.index, action.actorId); break;
    case 'BUY_SHOP_HEAL':        buyShopHeal(action.actorId); break;
    case 'BUY_SHOP_REMOVE':      buyShopRemove(action.index, action.actorId); break;
    case 'SHOP_DONE':            shopDone(action.actorId); break;

    // ---- Rest ----
    case 'REST_HEAL':            restHeal(action.actorId); break;
    case 'REST_ENCHANT_START':   restEnchantStart(action.actorId); break;
    case 'APPLY_ENCHANT':        applyEnchant(action.index); break;
    case 'SKIP_ENCHANT':         skipEnchant(); break;

    // ---- Act transition ----
    case 'NEXT_ACT':             nextAct(); break;
    case 'CLAIM_ACT_REWARD':     claimActReward(action.actorId); break;
    case 'TAKE_ACT_REWARD_CARD': takeActRewardCard(action.defId, action.actorId); break;
    case 'SKIP_ACT_REWARD_CARD': skipActRewardCard(action.actorId); break;
    case 'TAKE_ACT_REWARD_RELIC': takeActRewardRelic(action.relicId, action.actorId); break;

    // ---- Treasure ----
    case 'PICK_TREASURE_RELIC':  pickTreasureRelic(action.relicId, action.actorId); break;
    case 'SKIP_TREASURE':        skipTreasure(action.actorId); break;

    // ---- End ----
    case 'FINISH_RUN':           finishRun(); break;

    default:
      console.warn('Unknown action:', action.type);
  }
}
