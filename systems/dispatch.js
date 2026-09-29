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
  activePlayer,
  markPlayerEndedTurn, allPlayersEndedTurn,
  setMetaFocus, setRewardFocus, setActRewardFocus,
  setShopFocus, setRestFocus, setTreasureFocus, setEventFocus,
  setDeckViewFocus,
  startCoopRun,
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

// ---- Local slot ----
function localSlot() {
  return state.localSlot;
}

function isMyAction(action) {
  const slot = localSlot();
  if (slot == null) return true;
  if (action.actorId == null) return true;
  return action.actorId === slot;
}

// ---- Public dispatch ----

export function dispatch(action) {
  const mode = getMode();

  const tagged = { ...action };
  if (tagged.actorId == null && localSlot() != null) {
    tagged.actorId = localSlot();
  }

  // DEBUG
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

// ---- Network callbacks ----

onAction(action => {
  console.log('[onAction] host received from guest:', action);

  const slot = localSlot();
  if (slot != null && action.actorId != null && action.actorId === slot) {
    console.warn('[onAction] host rejected echo of own action');
    return;
  }

  // DEBUG: does the card exist in the actor's hand?
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
    'turn=', snap.turn,
    'p1Energy=', snap.players?.[1]?.energy,
    'enemies[0].hp=', snap.enemies?.[0]?.hp,
    'lastHits=', snap.lastHits?.length);
  const hits = (snap.lastHits || []).slice();
  restoreSnapshot(snap);
  render();
  if (hits.length) setTimeout(() => animateHits(hits), 30);
});

// ---- Action handlers ----

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
    case 'NEW_RUN':           newRun(action.seed); break;
    case 'START_COOP_RUN':    startCoopRun(action.seed); break;
    case 'CHOOSE_RELIC':      chooseRelic(action.relicId); break;
    case 'CONFIRM_DECK':      confirmDeck(); break;
    case 'RETURN_TO_MAIN_MENU': returnToMainMenu(); break;

    // ---- Map ----
    case 'START_NODE':        startNode(action.nodeId); break;
    case 'BACK_TO_MAP':       backToMap(); break;

    // ---- Focus (meta screens) ----
    case 'SET_META_FOCUS':    setMetaFocus(action.index); break;
    case 'SET_DECKVIEW_FOCUS': setDeckViewFocus(action.index); break;
    case 'SET_REWARD_FOCUS':  setRewardFocus(action.index); break;
    case 'SET_ACT_REWARD_FOCUS': setActRewardFocus(action.index); break;
    case 'SET_SHOP_FOCUS':    setShopFocus(action.index); break;
    case 'SET_REST_FOCUS':    setRestFocus(action.index); break;
    case 'SET_TREASURE_FOCUS': setTreasureFocus(action.index); break;
    case 'SET_EVENT_FOCUS':   setEventFocus(action.index); break;

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
          'over=', state.over,
          'handHasCard=', !!player.hand.find(c => c.uid === card.uid));
      } else {
        console.log('[PLAY_CARD] OK played', card.defId,
          'for P' + actorIdx, 'energy now', player.energy);
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
