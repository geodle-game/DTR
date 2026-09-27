import {
  state, pushLog, startPlayerTurn, livingEnemies, rollIntent, endCombat, cardDef,
  forEachRelic, showBossLore,
} from './state.js';
import { draw, recycleHand, shuffle, makeCard } from './deck.js';
import {
  applyStatus, outgoingMultiplier, incomingMultiplier,
  outgoingFlatBonus, tickStatuses,
} from './statuses.js';
import { CARDS, cardBaseDamage } from '../data/cards.js';
import { RELICS } from '../data/relics.js';
import { ENEMY_CARDS } from '../data/enemy-cards.js';
import { getEnchant } from '../data/enchants.js';

const combat = {
  attacksThisTurn: 0,
  hpLostThisCombat: 0,
  rampageBonus: {},
};

export function resetCombatScratch() {
  combat.attacksThisTurn = 0;
  combat.hpLostThisCombat = 0;
  combat.rampageBonus = {};
}

export function costOf(card) {
  const def = CARDS[card.defId];
  let cost = def.cost;

  if (def.xCost) return state.energy;
  if (cost === -1) return 0;
  if (state.player?.corruption && def.type === 'skill') cost = 0;

  if (def.costReduction?.kind === 'hpLost') {
    const steps = Math.floor(combat.hpLostThisCombat / def.costReduction.per);
    cost = Math.max(def.costReduction.min ?? 0, cost - steps);
  }

  if (card.enchant) {
    const ench = getEnchant(card.enchant);
    if (ench?.costDelta) cost = Math.max(0, cost + ench.costDelta);
  }

  return Math.max(0, cost);
}

export function canPlay(card) {
  if (state.turn !== 'player' || state.over) return false;
  if (card.disabledThisTurn) return false;
  const def = CARDS[card.defId];
  if (def.unplayable) return false;
  return state.energy >= costOf(card);
}

export function selectCardForPlay(card) {
  const def = CARDS[card.defId];
  if (!canPlay(card)) return;
  if (def.target === 'enemy' && livingEnemies().length > 1) {
    state.pendingCardUid = card.uid;
    pushLog(`Choose a target for ${def.name}.`);
    return;
  }
  playCard(card);
}

export function playCard(card, explicitTargetId = null) {
  if (!canPlay(card)) return false;
  const def = CARDS[card.defId];
  const enchant = card.enchant ? getEnchant(card.enchant) : null;
  const cost = costOf(card);
  state.energy -= cost;
  state.pendingCardUid = null;
  state.hand = state.hand.filter(c => c.uid !== card.uid);

  state.currentAnimation = def.animation || 'slash';

  const targets = resolveTargets(def.target, explicitTargetId);

  if (def.type === 'attack') combat.attacksThisTurn++;

  const echoActive = state.player.echoForm && !state.player.echoUsedThisTurn;
  if (echoActive) state.player.echoUsedThisTurn = true;

  const doubleTap = state.player.doubleTapNextAttack && def.type === 'attack';
  if (doubleTap) state.player.doubleTapNextAttack = false;

  const burst = state.player.burstNextSkill && def.type === 'skill';
  if (burst) state.player.burstNextSkill = false;

  const timesToPlay =
    1 +
    (doubleTap ? 1 : 0) +
    (burst ? 1 : 0) +
    (echoActive ? 1 : 0);

  for (let i = 0; i < timesToPlay; i++) {
    if (def.xCost) {
      const x = cost;
      for (let j = 0; j < x; j++) {
        for (const eff of def.effects) applyEffect(eff, targets, card, state.player);
      }
    } else {
      for (const eff of def.effects) applyEffect(eff, targets, card, state.player);
    }
  }

  if (enchant?.onPlay) {
    for (const eff of enchant.onPlay) applyEffect(eff, targets, card, state.player);
  }

  if (timesToPlay > 1) pushLog(`  Played ${timesToPlay}×!`);

  state.currentAnimation = null;

  let dest = def.destination ?? 'discard';
  if (state.player.corruption && def.type === 'skill') dest = 'exhaust';

  moveCardToDestination(card, dest);

  pushLog(`You played ${def.name}.`);
  checkEnemiesDead();
  return true;
}

function moveCardToDestination(card, dest) {
  if (dest === 'draw') {
    state.drawPile.push(card);
    state.drawPile = shuffle(state.drawPile, state.rng);
  } else if (dest === 'exhaust') {
    exhaustCard(card);
  } else {
    state.discardPile.push(card);
  }
}

function exhaustCard(card) {
  state.exhaustPile.push(card);
  if (state.player.feelNoPain) {
    state.player.block += state.player.feelNoPain;
    pushLog(`  Feel No Pain: +${state.player.feelNoPain} Block.`);
  }
  if (state.player.darkEmbrace) {
    draw(state, 1);
    pushLog('  Dark Embrace: drew 1.');
  }
}

function damagePlayerHp(amount) {
  const before = state.player.hp;
  state.player.hp = Math.max(0, state.player.hp - amount);
  const lost = before - state.player.hp;
  if (lost <= 0) return 0;
  combat.hpLostThisCombat += lost;
  forEachRelic('onLoseHp', (r) => {
    if (r.goldPerHp) {
      state.run.gold += r.goldPerHp * lost;
      pushLog(`  Lucky Coin: +${r.goldPerHp * lost} gold.`);
    }
  });
  return lost;
}

function resolveTargets(targetKind, explicitId) {
  if (targetKind === 'self' || targetKind === 'none') return [state.player];
  if (targetKind === 'all-enemies') return livingEnemies();
  if (targetKind === 'random-enemy') {
    const pool = livingEnemies();
    if (!pool.length) return [];
    return [pool[Math.floor(state.rng() * pool.length)]];
  }
  const pool = livingEnemies();
  if (!pool.length) return [];
  const chosen =
    pool.find(e => e.uid === explicitId) ||
    pool.find(e => e.uid === state.selectedEnemyId) ||
    pool[0];
  return [chosen];
}

function resolveEnemyTargets(enemy, kind) {
  if (kind === 'self') return [enemy];
  if (kind === 'all-enemies') return livingEnemies();
  return [state.player];
}

function checkBossPhaseLore(enemy, beforeHp) {
  if (!enemy.isBoss) return;
  const max = enemy.maxHp;
  const thresholds = enemy.phaseThresholds || { phase2: 0.66, phase3: 0.33 };
  const pct = enemy.hp / max;
  const beforePct = beforeHp / max;

  if (!enemy.loreTriggered.phase2 && pct <= thresholds.phase2 && beforePct > thresholds.phase2) {
    showBossLore(enemy.id, 'phase2');
    enemy.loreTriggered.phase2 = true;
  }
  if (!enemy.loreTriggered.phase3 && pct <= thresholds.phase3 && beforePct > thresholds.phase3) {
    showBossLore(enemy.id, 'phase3');
    enemy.loreTriggered.phase3 = true;
  }
}

function enchantDamageBonus(card, source) {
  if (source !== state.player || !card?.enchant) return 0;
  const e = getEnchant(card.enchant);
  return e?.damageBonus ?? 0;
}
function enchantBlockBonus(card, source) {
  if (source !== state.player || !card?.enchant) return 0;
  const e = getEnchant(card.enchant);
  return e?.blockBonus ?? 0;
}

function applyEffect(eff, targets, card, source) {
  switch (eff.kind) {
    case 'damage': {
      const bonus = enchantDamageBonus(card, source);
      const def = CARDS[card.defId] || ENEMY_CARDS[card.defId];
      const isSpell = def?.type === 'spell';
      for (const t of targets) {
        const r = dealDamage(
          source, t,
          eff.amount + bonus,
          eff.strengthMultiplier,
          { isSpell },
        );
        pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}).`);
      }
      break;
    }

    case 'damageRandom': {
      const bonus = enchantDamageBonus(card, source);
      const def = CARDS[card.defId] || ENEMY_CARDS[card.defId];
      const isSpell = def?.type === 'spell';
      const pool = livingEnemies();
      if (!pool.length) break;
      const t = pool[Math.floor(state.rng() * pool.length)];
      const r = dealDamage(source, t, eff.amount + bonus, undefined, { isSpell });
      pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}).`);
      break;
    }

    case 'damagePercentMaxHp': {
      const pct = eff.percent ?? 0.5;
      for (const t of targets) {
        const base = Math.floor(t.maxHp * pct);
        const blocked = Math.min(t.block, base);
        t.block -= blocked;
        const dealt = base - blocked;

        if (!state.lastHits) state.lastHits = [];
        state.lastHits.push({
          attackerUid: source.id === 'player' ? 'player' : source.uid,
          targetUid:   t.id === 'player' ? 'player' : t.uid,
          dealt,
          blocked,
          animation: state.currentAnimation || 'slash',
          isSpell: false,
        });

        if (t === state.player) {
          damagePlayerHp(dealt);
        } else {
          const before = t.hp;
          t.hp = Math.max(0, t.hp - dealt);
          checkBossPhaseLore(t, before);
        }
        pushLog(`  ${t.name} took ${dealt} (blocked ${blocked}).`);
      }
      break;
    }

    case 'damageEqualToBlock': {
      const bonus = enchantDamageBonus(card, source);
      const amount = Math.floor(source.block * (eff.multiplier ?? 1)) + bonus;
      for (const t of targets) {
        const r = dealDamage(source, t, amount);
        pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}).`);
      }
      break;
    }

    case 'perfectedStrike': {
      const bonus = enchantDamageBonus(card, source);
      const strikeCount = state.run.deck.filter(c => c.defId.includes('strike')).length;
      const amount = eff.base + eff.perStrike * strikeCount + bonus;
      for (const t of targets) {
        const r = dealDamage(source, t, amount);
        pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}). [${strikeCount} strikes]`);
      }
      break;
    }

    case 'rampage': {
      const bonus = enchantDamageBonus(card, source);
      const rampBonus = combat.rampageBonus[card.uid] || 0;
      const amount = eff.base + rampBonus + bonus;
      for (const t of targets) {
        const r = dealDamage(source, t, amount);
        pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}).`);
      }
      combat.rampageBonus[card.uid] = rampBonus + eff.per;
      break;
    }

    case 'finisher': {
      const bonus = enchantDamageBonus(card, source);
      const times = Math.max(0, combat.attacksThisTurn - 1);
      for (let i = 0; i < times; i++) {
        const pool = livingEnemies();
        if (!pool.length) break;
        const t = pool[Math.floor(state.rng() * pool.length)];
        const r = dealDamage(source, t, eff.amount + bonus);
        pushLog(`  Finisher: ${t.name} took ${r.dealt}.`);
      }
      if (times === 0) pushLog('  Finisher: no attacks before this.');
      break;
    }

    case 'lastStand': {
      const bonus = enchantDamageBonus(card, source);
      const handCount = state.hand.length;
      const dmg = eff.base + handCount + bonus;
      pushLog(`  Last Stand: ${handCount} cards in hand → ${dmg} damage.`);
      for (const t of targets) {
        const r = dealDamage(source, t, dmg);
        pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}).`);
      }
      break;
    }

    case 'reaper': {
      const bonus = enchantDamageBonus(card, source);
      let totalDealt = 0;
      for (const t of livingEnemies()) {
        const r = dealDamage(source, t, eff.amount + bonus);
        totalDealt += r.dealt;
      }
      if (totalDealt > 0) {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + totalDealt);
        pushLog(`  Reaper healed ${totalDealt}.`);
      }
      break;
    }

    case 'block': {
      let amount = eff.amount + enchantBlockBonus(card, source);
      if (source === state.player) {
        forEachRelic('onBlockGain', (r) => {
          if (r.blockBonus) amount += r.blockBonus;
        });
      }
      source.block += amount;
      pushLog(`  ${source.name || 'You'} gained ${amount} block.`);
      if (state.player.juggernaut && source === state.player) {
        const pool = livingEnemies();
        if (pool.length) {
          const t = pool[Math.floor(state.rng() * pool.length)];
          const r = dealDamage(state.player, t, state.player.juggernaut);
          pushLog(`  Juggernaut: ${t.name} took ${r.dealt}.`);
        }
      }
      break;
    }

    case 'heal':
      source.hp = Math.min(source.maxHp, source.hp + eff.amount);
      pushLog(`  ${source.name || 'You'} healed ${eff.amount}.`);
      break;

    case 'loseHpSelf':
      damagePlayerHp(eff.amount);
      pushLog(`  Lost ${eff.amount} HP.`);
      if (state.player.rupture) {
        applyStatus(state.player, 'strength', state.player.rupture);
        pushLog(`  Rupture: +${state.player.rupture} Strength.`);
      }
      break;

    case 'loseEnergy':
      state.energy = Math.max(0, state.energy - eff.amount);
      pushLog(`  Lost ${eff.amount} Energy.`);
      break;

    case 'gainEnergy':
      state.energy += eff.amount;
      pushLog(`  Gained ${eff.amount} Energy.`);
      break;

    case 'applyStatus':
      for (const t of targets) {
        applyStatus(t, eff.status, eff.amount);
        if (eff.status === 'strength' && t === state.player) {
          forEachRelic('onGainStrength', (r) => {
            if (r.blockOnStrength) {
              state.player.block += r.blockOnStrength;
              pushLog(`  Battle Focus: +${r.blockOnStrength} Block.`);
            }
          });
        }
        pushLog(`  ${t.name || 'You'} gained ${eff.amount} ${eff.status}.`);
      }
      break;

    case 'gainEnergyNextTurn':
      if (source.nextTurnEnergy !== undefined) source.nextTurnEnergy += eff.amount;
      pushLog(`  +${eff.amount} energy next turn.`);
      break;

    case 'gainEnergyPerTurn':
      state.player.perTurnEnergy = (state.player.perTurnEnergy || 0) + eff.amount;
      if (eff.selfDamagePerTurn) {
        state.player.perTurnHooks.push({ kind: 'selfDamage', amount: eff.selfDamagePerTurn });
      }
      pushLog(`  +${eff.amount} energy each turn.`);
      break;

    case 'draw':
      if (source === state.player) {
        draw(state, eff.amount);
        pushLog(`  Drew ${eff.amount}.`);
      }
      break;

    case 'discardRandom': {
      for (let i = 0; i < eff.amount; i++) {
        if (!state.hand.length) break;
        const idx = Math.floor(state.rng() * state.hand.length);
        const c = state.hand.splice(idx, 1)[0];
        state.discardPile.push(c);
        pushLog(`  Discarded ${CARDS[c.defId].name}.`);
      }
      break;
    }

    case 'recoverFromDiscard': {
      if (state.discardPile.length) {
        const idx = Math.floor(state.rng() * state.discardPile.length);
        const c = state.discardPile.splice(idx, 1)[0];
        state.drawPile.push(c);
        pushLog(`  Recovered ${CARDS[c.defId].name} from discard.`);
      }
      break;
    }

    case 'topDeckRandom': {
      if (state.hand.length) {
        const idx = Math.floor(state.rng() * state.hand.length);
        const c = state.hand.splice(idx, 1)[0];
        state.drawPile.push(c);
        pushLog(`  Put ${CARDS[c.defId].name} on top of draw pile.`);
      }
      break;
    }

    case 'addCardToDraw': {
      const c = makeCard(eff.cardId);
      state.drawPile.push(c);
      state.drawPile = shuffle(state.drawPile, state.rng);
      pushLog(`  Added ${CARDS[eff.cardId].name} to draw pile.`);
      break;
    }

    case 'addCardToPlayerDraw': {
      const c = makeCard(eff.cardId);
      state.drawPile.push(c);
      state.drawPile = shuffle(state.drawPile, state.rng);
      pushLog(`  Added ${CARDS[eff.cardId].name} to your draw pile.`);
      break;
    }

    case 'addCardToPlayerDiscard': {
      state.discardPile.push(makeCard(eff.cardId));
      pushLog(`  Added ${CARDS[eff.cardId].name} to your discard pile.`);
      break;
    }

    case 'exhaustRandom': {
      if (state.hand.length) {
        const idx = Math.floor(state.rng() * state.hand.length);
        const removed = state.hand.splice(idx, 1)[0];
        exhaustCard(removed);
        pushLog(`  Exhausted ${CARDS[removed.defId].name}.`);
      }
      break;
    }

    case 'exhaustRandomHand': {
      const n = eff.amount ?? 1;
      for (let i = 0; i < n; i++) {
        if (!state.hand.length) break;
        const idx = Math.floor(state.rng() * state.hand.length);
        const removed = state.hand.splice(idx, 1)[0];
        exhaustCard(removed);
        pushLog(`  ${CARDS[removed.defId].name} was exhausted.`);
      }
      break;
    }

    case 'disableRandomHand': {
      const n = eff.amount ?? 1;
      const eligible = state.hand.filter(c => !c.disabledThisTurn);
      const toDisable = Math.min(n, eligible.length);
      for (let i = 0; i < toDisable; i++) {
        const idx = Math.floor(state.rng() * eligible.length);
        const c = eligible.splice(idx, 1)[0];
        c.disabledThisTurn = true;
      }
      pushLog(`  ${toDisable} card(s) disabled this turn.`);
      break;
    }

    case 'disableHandPercent': {
      const pct = eff.percent ?? 0.5;
      const eligible = state.hand.filter(c => !c.disabledThisTurn);
      const n = Math.floor(eligible.length * pct);
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(state.rng() * eligible.length);
        const c = eligible.splice(idx, 1)[0];
        c.disabledThisTurn = true;
      }
      pushLog(`  ${n} card(s) disabled this turn.`);
      break;
    }

    case 'replaceHandWithCard': {
      const n = eff.amount ?? state.hand.length;
      const id = eff.cardId;
      const replaced = state.hand.length;
      state.discardPile.push(...state.hand);
      state.hand = [];
      for (let i = 0; i < n; i++) {
        state.hand.push(makeCard(id));
      }
      pushLog(`  ${replaced} card(s) replaced with ${CARDS[id].name}.`);
      break;
    }

    case 'feed': {
      const killed = targets.some(t => t.hp <= 0);
      if (killed) {
        state.player.maxHp += eff.amount;
        state.player.hp += eff.amount;
        state.run.maxHp += eff.amount;
        pushLog(`  Feed! Max HP +${eff.amount}.`);
      }
      break;
    }

    case 'gainStatusPerTurn':
      if (!state.player.perTurnStatuses) state.player.perTurnStatuses = [];
      state.player.perTurnStatuses.push({ status: eff.status, amount: eff.amount });
      pushLog(`  Will gain ${eff.amount} ${eff.status} each turn.`);
      break;

    case 'doubleTapNextAttack':
      state.player.doubleTapNextAttack = true;
      pushLog('  Next attack this turn will play twice.');
      break;

    case 'burstNextSkill':
      state.player.burstNextSkill = true;
      pushLog('  Next skill this turn will play twice.');
      break;

    case 'echoForm':
      state.player.echoForm = true;
      pushLog('  Echo Form active.');
      break;

    case 'corruption':
      state.player.corruption = true;
      pushLog('  Corruption active. Skills cost 0 and exhaust.');
      break;

    case 'feelNoPain':
      state.player.feelNoPain = (state.player.feelNoPain || 0) + eff.amount;
      pushLog(`  Feel No Pain ${state.player.feelNoPain}.`);
      break;

    case 'darkEmbrace':
      state.player.darkEmbrace = true;
      pushLog('  Dark Embrace active.');
      break;

    case 'juggernaut':
      state.player.juggernaut = (state.player.juggernaut || 0) + eff.amount;
      pushLog(`  Juggernaut ${eff.amount}.`);
      break;

    case 'rupture':
      state.player.rupture = (state.player.rupture || 0) + 1;
      pushLog('  Rupture active.');
      break;

    case 'dropkick': {
      const t = targets[0];
      if (t && (t.statuses?.vulnerable || 0) > 0) {
        state.energy += 1;
        draw(state, 1);
        pushLog('  Dropkick! +1 Energy, drew 1.');
      }
      break;
    }

    case 'escapePlan':
      if (combat.attacksThisTurn > 0) {
        state.player.block += eff.amount;
        pushLog(`  Escape Plan: +${eff.amount} Block.`);
      }
      break;

    case 'deepBreath':
      if (state.discardPile.length >= 10) {
        draw(state, 2);
        pushLog('  Deep Breath: drew 2 more.');
      }
      break;

    case 'calculatedGamble': {
      const n = state.hand.length;
      state.discardPile.push(...state.hand);
      state.hand = [];
      draw(state, n + 1);
      pushLog(`  Calculated Gamble: discarded ${n}, drew ${n + 1}.`);
      break;
    }

    case 'fiendFire': {
      const bonus = enchantDamageBonus(card, source);
      const n = state.hand.length;
      const toDiscard = state.hand.splice(0);
      for (const c of toDiscard) state.discardPile.push(c);
      const dmg = n * eff.amount + bonus;
      pushLog(`  Fiend Fire: discarded ${n} cards → ${dmg} damage.`);
      for (const t of targets) {
        const r = dealDamage(source, t, dmg);
        pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}).`);
      }
      break;
    }

    case 'rescueDiscard': {
      if (!state.discardPile.length) break;
      const idx = Math.floor(state.rng() * state.discardPile.length);
      const c = state.discardPile.splice(idx, 1)[0];
      exhaustCard(c);
      state.drawPile = shuffle(state.drawPile.concat(state.discardPile), state.rng);
      state.discardPile = [];
      pushLog(`  Rescue: exhausted ${CARDS[c.defId].name}, shuffled ${state.drawPile.length} into draw.`);
      break;
    }

    case 'shuffleDiscardIntoDraw':
      state.drawPile = shuffle(state.drawPile.concat(state.discardPile), state.rng);
      state.discardPile = [];
      pushLog(`  Shuffled discard into draw (${state.drawPile.length} cards).`);
      break;

    case 'dualWield': {
      const candidates = state.hand.filter(c => {
        const d = CARDS[c.defId];
        return d.type === 'attack' || d.type === 'power';
      });
      if (!candidates.length) { pushLog('  No Attack or Power in hand.'); break; }
      const pick = candidates[Math.floor(state.rng() * candidates.length)];
      state.hand.push(makeCard(pick.defId));
      pushLog(`  Copied ${CARDS[pick.defId].name}.`);
      break;
    }

    case 'whirlwind':
      break;

    case 'graveRobber': {
      if (!state.exhaustPile.length) {
        pushLog('  Exhaust pile is empty.');
        break;
      }
      const idx = Math.floor(state.rng() * state.exhaustPile.length);
      const c = state.exhaustPile[idx];
      const dmg = cardBaseDamage(c.defId);
      pushLog(`  Revealed ${CARDS[c.defId].name} (${dmg} damage).`);
      if (dmg > 0 && targets.length) {
        for (const t of targets) {
          const r = dealDamage(source, t, dmg);
          pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}).`);
        }
      } else {
        pushLog('  Not an attack — nothing happens.');
      }
      break;
    }

    case 'seance': {
      if (!state.exhaustPile.length) {
        pushLog('  Exhaust pile is empty.');
        break;
      }
      const idx = Math.floor(state.rng() * state.exhaustPile.length);
      const c = state.exhaustPile.splice(idx, 1)[0];
      state.hand.push(c);
      pushLog(`  Returned ${CARDS[c.defId].name} from the exhaust pile.`);
      break;
    }

    case 'necromancersPact': {
      if (!state.discardPile.length) {
        pushLog('  Discard pile is empty.');
        break;
      }
      const idx = Math.floor(state.rng() * state.discardPile.length);
      const c = state.discardPile.splice(idx, 1)[0];
      const dmg = cardBaseDamage(c.defId);
      pushLog(`  Exhausted ${CARDS[c.defId].name} (${dmg} damage).`);
      exhaustCard(c);
      if (dmg > 0 && targets.length) {
        for (const t of targets) {
          const r = dealDamage(source, t, dmg);
          pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}).`);
        }
      }
      break;
    }

    default:
      pushLog(`  Unknown effect: ${eff.kind}`);
  }
}

export function dealDamage(attacker, target, base, strengthMultiplier, opts = {}) {
  const isSpell = opts.isSpell === true;

  const scale = attacker.damageScale ?? 1;
  const flatBonus = isSpell
    ? outgoingFlatBonus(attacker, true)
    : outgoingFlatBonus(attacker) * (strengthMultiplier ?? 1);

  let dmg = (base * scale) + flatBonus;
  dmg *= outgoingMultiplier(attacker);
  dmg *= incomingMultiplier(target);

  if (attacker === state.player && (target.statuses?.vulnerable || 0) > 0) {
    for (const rid of state.run.relics || []) {
      const r = RELICS[rid];
      if (r?.damageVsVulnerable) dmg *= r.damageVsVulnerable;
    }
  }

  dmg = Math.floor(dmg);
  if (dmg < 0) dmg = 0;

  const blocked = Math.min(target.block, dmg);
  target.block -= blocked;
  const dealt = dmg - blocked;

  if (!state.lastHits) state.lastHits = [];
  state.lastHits.push({
    attackerUid: attacker.id === 'player' ? 'player' : attacker.uid,
    targetUid:   target.id   === 'player' ? 'player' : target.uid,
    dealt,
    blocked,
    animation: state.currentAnimation || 'slash',
    isSpell,
  });

  if (target === state.player) {
    damagePlayerHp(dealt);
  } else {
    const before = target.hp;
    target.hp = Math.max(0, target.hp - dealt);
    checkBossPhaseLore(target, before);
  }

  return { dealt, blocked };
}

function checkEnemiesDead() {
  if (livingEnemies().length === 0) {
    pushLog('Victory.');
    endCombat(true);
  }
}

export function beginEnemyTurn() {
  if (state.turn !== 'player' || state.over) return;

  for (const c of state.hand) {
    const def = CARDS[c.defId];
    if (def.endOfTurnDamage) {
      damagePlayerHp(def.endOfTurnDamage);
      pushLog(`${def.name}: took ${def.endOfTurnDamage}.`);
    }
  }
  if (state.player.hp <= 0) { endCombat(false); return; }

  recycleHand(state);
  tickStatuses(state.player);
  state.turn = 'enemy';
}

export function resolveEnemyTurn() {
  if (state.over) return;

  state.currentAnimation = 'slash';

  for (const e of state.enemies) {
    if (e.hp <= 0) continue;
    const card = e.intentCard;
    if (!card) continue;

    const def = ENEMY_CARDS[card.defId];
    const targets = resolveEnemyTargets(e, def.target);

    pushLog(`${e.name} plays ${def.name}.`);
    for (const eff of def.effects) applyEffect(eff, targets, card, e);
    e.cardDiscard.push(card);
    tickStatuses(e);
    rollIntent(e);
  }

  state.currentAnimation = null;

  if (state.player.hp <= 0) {
    pushLog('Defeat.');
    endCombat(false);
    return;
  }

  if (state.player.perTurnStatuses) {
    for (const entry of state.player.perTurnStatuses) {
      applyStatus(state.player, entry.status, entry.amount);
    }
  }
  if (state.player.perTurnHooks) {
    for (const h of state.player.perTurnHooks) {
      if (h.kind === 'selfDamage') {
        damagePlayerHp(h.amount);
      }
    }
  }
  if (state.player.hp <= 0) { endCombat(false); return; }

  if (state.player.perTurnEnergy) {
    state.player.nextTurnEnergy += state.player.perTurnEnergy;
  }

  state.player.echoUsedThisTurn = false;
  combat.attacksThisTurn = 0;

  startPlayerTurn();
}
