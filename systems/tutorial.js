// ============================================================
// systems/tutorial.js
// Runtime state machine for the MC1 scripted battle.
//
// Active when state.scriptBattle is non-null and .active is true.
// Set up by state.js on the first monster node of MC1. Cleared
// when the sequence completes.
//
// Combat code calls gateCardPlay / gateEndTurn before executing
// an action. If a gate is active, the action is blocked and a
// warning is logged. Otherwise, proceed and call notifyCardPlayed
// / notifyTurnEnded / notifyEnemyKilled afterward.
// ============================================================

import { state } from './state.js';
import { getTutorialSequence, getTutorialHand } from '../data/tutorialScript.js';

export const SCRIPTED_BATTLE_ID = 'tutorial:scripted-first-battle';

// ---- State helpers ----

export function isScriptActive() {
  return !!state.scriptBattle?.active;
}

export function currentStep() {
  if (!isScriptActive()) return null;
  const seq = state.scriptBattle.sequence || [];
  const idx = state.scriptBattle.stepIndex ?? 0;
  return seq[idx] || null;
}

export function beginScriptedBattle(classId) {
  const seq = getTutorialSequence(classId);
  if (!seq) return false;
  state.scriptBattle = {
    active: true,
    classId,
    sequence: seq,
    stepIndex: 0,
    completed: false,
  };
  return true;
}

export function advanceStep() {
  if (!isScriptActive()) return false;
  state.scriptBattle.stepIndex += 1;
  const seq = state.scriptBattle.sequence;
  if (state.scriptBattle.stepIndex >= seq.length) {
    state.scriptBattle.active = false;
    state.scriptBattle.completed = true;
    return false;
  }
  return true;
}

export function continueStep() {
  if (!isScriptActive()) return false;
  const step = currentStep();
  if (!step) return false;
  if (step.advanceOn === 'continue') {
    return advanceStep();
  }
  return false;
}

export function endScriptedBattle() {
  if (!state.scriptBattle) return;
  state.scriptBattle.active = false;
  state.scriptBattle.completed = true;
}

export function clearScriptedBattle() {
  state.scriptBattle = null;
}

// ---- Gates ----

export function gateCardPlay(card) {
  if (!isScriptActive()) return { blocked: false };
  const step = currentStep();
  if (!step) return { blocked: false };

  if (step.type === 'modal') {
    return { blocked: true, reason: 'Read the tutorial prompt first.' };
  }

  const gate = step.gate;
  if (!gate) return { blocked: true, reason: 'Follow the tutorial prompt.' };

  if (gate.startsWith('play-card:')) {
    const wanted = gate.slice('play-card:'.length);
    if (card.defId !== wanted) {
      return { blocked: true, reason: `Play ${wanted} first.` };
    }
    return { blocked: false };
  }

  if (gate === 'any-card') return { blocked: false };

  if (gate === 'end-turn') {
    return { blocked: true, reason: 'End your turn to continue.' };
  }

  return { blocked: true, reason: 'Follow the tutorial prompt.' };
}

export function gateEndTurn() {
  if (!isScriptActive()) return { blocked: false };
  const step = currentStep();
  if (!step) return { blocked: false };

  if (step.type === 'modal') {
    return { blocked: true, reason: 'Read the tutorial prompt first.' };
  }

  if (step.gate === 'end-turn') return { blocked: false };

  if (step.gate?.startsWith('play-card:')) {
    return { blocked: true, reason: 'Play the highlighted card first.' };
  }

  if (step.gate === 'any-card') {
    return { blocked: true, reason: 'Play a card first.' };
  }

  return { blocked: false };
}

// ---- Notifications ----

export function notifyCardPlayed(card) {
  if (!isScriptActive()) return;
  const step = currentStep();
  if (!step) return;
  if (step.advanceOn !== 'card-played') return;
  if (!step.gate?.startsWith('play-card:')) return;
  const wanted = step.gate.slice('play-card:'.length);
  if (card.defId === wanted) advanceStep();
}

export function notifyTurnEnded() {
  if (!isScriptActive()) return;
  const step = currentStep();
  if (!step) return;
  if (step.advanceOn === 'turn-ended') advanceStep();
}

export function notifyEnemyKilled() {
  if (!isScriptActive()) return;
  const step = currentStep();
  if (!step) return;
  if (step.advanceOn === 'enemy-killed') advanceStep();
}
