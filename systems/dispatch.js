// ============================================================
// systems/dispatch.js
// Single entry point for every player-initiated state change.
// In single-player, dispatch() is called directly from the UI.
// In multiplayer, dispatch() is wrapped by net.submitAction() so
// the Host can stamp actions with a sequence number first.
// ============================================================

import {
  state, startNode, claimReward, takeRewardCard, skipRewardCard,
  pickEventChoice, buyShopCard, buyShopHeal,
  restHeal, restEnchantStart, applyEnchant, skipEnchant,
  chooseRelic, confirmDeck, nextAct, claimActReward,
  takeActRewardCard, skipActRewardCard, takeActRewardRelic,
  pickTreasureRelic, skipTreasure, returnToMainMenu,
} from './state.js';
import {
  playCard, selectCardForPlay, beginEnemyTurn, resolveEnemyTurn,
} from './combat.js';

export function dispatch(action) {
  switch (action.type) {
    // ---- Combat ----
    case 'PLAY_CARD': {
      const card = state.hand.find(c => c.uid === action.cardUid);
      if (!card) return false;
      return playCard(card, action.targetUid ?? null);
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

    case 'END_TURN':
      // In multiplayer, this is gated by the Host checking whether
      // all players have pressed it. In single-player, it just runs.
      beginEnemyTurn();
      resolveEnemyTurn();
      return true;

    case 'END_TURN_PHASE_ONLY':
      // For multiplayer: advance to enemy phase, but let the Host
      // decide when to actually resolve.
      beginEnemyTurn();
      return true;

    // ---- Map ----
    case 'START_NODE':
      startNode(action.nodeId);
      return true;

    case 'BACK_TO_MAP':
      // handled inside state.js, no-op here
      return true;

    // ---- Relic / Deck selection ----
    case 'CHOOSE_RELIC':
      chooseRelic(action.relicId);
      return true;

    case 'CONFIRM_DECK':
      confirmDeck();
      return true;

    // ---- Rewards ----
    case 'CLAIM_REWARD':
      claimReward();
      return true;

    case 'TAKE_REWARD_CARD':
      takeRewardCard(action.defId);
      return true;

    case 'SKIP_REWARD_CARD':
      skipRewardCard();
      return true;

    case 'TAKE_ACT_REWARD_CARD':
      takeActRewardCard(action.defId);
      return true;

    case 'SKIP_ACT_REWARD_CARD':
      skipActRewardCard();
      return true;

    case 'TAKE_ACT_REWARD_RELIC':
      takeActRewardRelic(action.relicId);
      return true;

    case 'CLAIM_ACT_REWARD':
      claimActReward();
      return true;

    // ---- Treasure ----
    case 'PICK_TREASURE_RELIC':
      pickTreasureRelic(action.relicId);
      return true;

    case 'SKIP_TREASURE':
      skipTreasure();
      return true;

    // ---- Events ----
    case 'PICK_EVENT_CHOICE':
      pickEventChoice(action.index);
      return true;

    // ---- Shop ----
    case 'BUY_SHOP_CARD':
      buyShopCard(action.index);
      return true;

    case 'BUY_SHOP_HEAL':
      buyShopHeal();
      return true;

    // ---- Rest ----
    case 'REST_HEAL':
      restHeal();
      return true;

    case 'REST_ENCHANT_START':
      restEnchantStart();
      return true;

    case 'APPLY_ENCHANT':
      applyEnchant(action.index);
      return true;

    case 'SKIP_ENCHANT':
      skipEnchant();
      return true;

    // ---- Act transition ----
    case 'NEXT_ACT':
      nextAct();
      return true;

    // ---- Run management ----
    case 'RETURN_TO_MAIN_MENU':
      returnToMainMenu();
      return true;

    default:
      console.warn('Unknown action:', action.type);
      return false;
  }
}
