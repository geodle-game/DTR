import {
  state, pushLog, startPlayerTurn, livingEnemies, rollIntent, endCombat, cardDef,
  forEachRelic, showBossLore, activePlayer,
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

// Sum of all HP costs on a card. Used by canPlay to block a card
// that would drop the player to 0 HP or below.
function hpCostOf(card) {
  const def = CARDS[card.defId];
  if (!def) return 0;
  let total = 0;
  for (const eff of def.effects) {
    if (eff.kind === 'loseHpSelf') total += eff.amount;
  }
  return total;
}

export function costOf(card, player = activePlayer()) {
  if (!player) return 0;
  const def = CARDS[card.defId];
  let cost = def.cost;

  if (def.xCost) return player.energy;
  if (cost === -1) return 0;
  if (player.corruption && def.type === 'skill') cost = 0;

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

export function canPlay(card, player = activePlayer()) {
  if (!player) return false;
  if (state.turn !== 'player' || state.over) return false;
  if (card.disabledThisTurn) return false;
  const def = CARDS[card.defId];
  if (def.unplayable) return false;
  if (player.energy < costOf(card, player)) return false;

  // HP-cost cards are unplayable if they'd drop you to 0 or below.
  // At 8 HP, Offering (cost 8) is blocked. At 9 HP, it plays and
  // leaves you at 1 HP. This matches the design: self-damage can
  // never kill you, and it can never be free value at 1 HP.
  const hpCost = hpCostOf(card);
  if (hpCost > 0 && player.hp <= hpCost) return false;

  return true;
}

export function selectCardForPlay(card, player = activePlayer()) {
  const def = CARDS[card.defId];
  if (!canPlay(card, player)) return;
  if (def.target === 'enemy' && livingEnemies().length > 1) {
    state.pendingCardUid = card.uid;
    pushLog(`Choose a target for ${def.name}.`);
    return;
  }
  playCard(card, player, null);
}

export function playCard(card, player = activePlayer(), explicitTargetId = null) {
  if (!player) return false;
  if (!canPlay(card, player)) return false;
  const def = CARDS[card.defId];
  const enchant = card.enchant ? getEnchant(card.enchant) : null;
  const cost = costOf(card, player);
  player.energy -= cost;
  state.pendingCardUid = null;
  player.hand = player.hand.filter(c => c.uid !== card.uid);

  state.currentAnimation = def.animation || 'slash';

  const targets = resolveTargets(def.target, explicitTargetId, player);

  if (def.type === 'attack') combat.attacksThisTurn++;

  const echoActive = player.echoForm && !player.echoUsedThisTurn;
  if (echoActive) player.echoUsedThisTurn = true;

  const doubleTap = player.doubleTapNextAttack && def.type === 'attack';
  if (doubleTap) player.doubleTapNextAttack = false;

  const burst = player.burstNextSkill && def.type === 'skill';
  if (burst) player.burstNextSkill = false;

  const timesToPlay =
    1 +
    (doubleTap ? 1 : 0) +
    (burst ? 1 : 0) +
    (echoActive ? 1 : 0);

  for (let i = 0; i < timesToPlay; i++) {
    if (def.xCost) {
      const x = cost;
      for (let j = 0; j < x; j++) {
        for (const eff of def.effects) applyEffect(eff, targets, card, player);
      }
    } else {
      for (const eff of def.effects) applyEffect(eff, targets, card, player);
    }
  }

  if (enchant?.onPlay) {
    for (const eff of enchant.onPlay) applyEffect(eff, targets, card, player);
  }

  if (timesToPlay > 1) pushLog(`  Played ${timesToPlay}×!`);

  state.currentAnimation = null;

  let dest = def.destination ?? 'discard';
  if (player.corruption && def.type === 'skill') dest = 'exhaust';

  moveCardToDestination(player, card, dest);

  pushLog(`You played ${def.name}.`);
  checkEnemiesDead();
  checkPlayerDead();
  return true;
}

function moveCardToDestination(player, card, dest) {
  if (dest === 'draw') {
    player.drawPile.push(card);
    player.drawPile = shuffle(player.drawPile, state.rng);
  } else if (dest === 'exhaust') {
    exhaustCard(player, card);
  } else {
    player.discardPile.push(card);
  }
}

function exhaustCard(player, card) {
  player.exhaustPile.push(card);
  if (player.feelNoPain) {
    player.block += player.feelNoPain;
    pushLog(`  Feel No Pain: +${player.feelNoPain} Block.`);
  }
  if (player.darkEmbrace) {
    draw(state, player, 1);
    pushLog('  Dark Embrace: drew 1.');
  }
}

function damagePlayerHp(player, amount) {
  const before = player.hp;
  player.hp = Math.max(0, player.hp - amount);
  const lost = before - player.hp;
  if (lost <= 0) return 0;
  combat.hpLostThisCombat += lost;
  forEachRelic('onLoseHp', (r) => {
    if (r.goldPerHp) {
      player.gold += r.goldPerHp * lost;
      pushLog(`  Lucky Coin: +${r.goldPerHp * lost} gold.`);
    }
  }, player);
  return lost;
}

function resolveTargets(targetKind, explicitId, player) {
  if (targetKind === 'self' || targetKind === 'none') return [player];
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
  if (kind === 'all-enemies') return state.players.filter(p => p.hp > 0);
  const pool = state.players.filter(p => p.hp > 0);
  if (!pool.length) return [];
  return [pool[0]];
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

function enchantDamageBonus(card) {
  if (!card?.enchant) return 0;
  const e = getEnchant(card.enchant);
  return e?.damageBonus ?? 0;
}
function enchantBlockBonus(card) {
  if (!card?.enchant) return 0;
  const e = getEnchant(card.enchant);
  return e?.blockBonus ?? 0;
}

function applyEffect(eff, targets, card, source) {
  switch (eff.kind) {
    case 'damage': {
      const bonus = enchantDamageBonus(card);
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
      const bonus = enchantDamageBonus(card);
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
          attackerUid: state.players.includes(source) ? 'player' : source.uid,
          targetUid:   state.players.includes(t) ? 'player' : t.uid,
          dealt,
          blocked,
          animation: state.currentAnimation || 'slash',
          isSpell: false,
        });

        if (state.players.includes(t)) {
          damagePlayerHp(t, dealt);
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
      const bonus = enchantDamageBonus(card);
      const amount = Math.floor(source.block * (eff.multiplier ?? 1)) + bonus;
      for (const t of targets) {
        const r = dealDamage(source, t, amount);
        pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}).`);
      }
      break;
    }

    case 'perfectedStrike': {
      const bonus = enchantDamageBonus(card);
      const strikeCount = source.deck.filter(c => c.defId.includes('strike')).length;
      const amount = eff.base + eff.perStrike * strikeCount + bonus;
      for (const t of targets) {
        const r = dealDamage(source, t, amount);
        pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}). [${strikeCount} strikes]`);
      }
      break;
    }

    case 'rampage': {
      const bonus = enchantDamageBonus(card);
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
      const bonus = enchantDamageBonus(card);
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
      const bonus = enchantDamageBonus(card);
      const handCount = source.hand.length;
      const dmg = eff.base + handCount + bonus;
      pushLog(`  Last Stand: ${handCount} cards in hand → ${dmg} damage.`);
      for (const t of targets) {
        const r = dealDamage(source, t, dmg);
        pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}).`);
      }
      break;
    }

    case 'reaper': {
      const bonus = enchantDamageBonus(card);
      let totalDealt = 0;
      for (const t of livingEnemies()) {
        const r = dealDamage(source, t, eff.amount + bonus);
        totalDealt += r.dealt;
      }
      if (totalDealt > 0) {
        source.hp = Math.min(source.maxHp, source.hp + totalDealt);
        pushLog(`  Reaper healed ${totalDealt}.`);
      }
      break;
    }

    case 'block': {
      let amount = eff.amount + enchantBlockBonus(card);
      if (state.players.includes(source)) {
        forEachRelic('onBlockGain', (r) => {
          if (r.blockBonus) amount += r.blockBonus;
        }, source);
      }
      source.block += amount;
      pushLog(`  ${source.name || 'You'} gained ${amount} block.`);
      if (source.juggernaut && state.players.includes(source)) {
        const pool = livingEnemies();
        if (pool.length) {
          const t = pool[Math.floor(state.rng() * pool.length)];
          const r = dealDamage(source, t, source.juggernaut);
          pushLog(`  Juggernaut: ${t.name} took ${r.dealt}.`);
        }
      }
      break;
    }

    case 'heal':
      source.hp = Math.min(source.maxHp, source.hp + eff.amount);
      pushLog(`  ${source.name || 'You'} healed ${eff.amount}.`);
      break;

    // ---------------------------------------------
    // Self-HP-cost effects — clamp at 1, never 0.
    // canPlay already blocks playing these if the player
    // can't survive the cost, so this is a safety net.
    // ---------------------------------------------
    case 'loseHpSelf': {
      const before = source.hp;
      source.hp = Math.max(1, source.hp - eff.amount);
      const lost = before - source.hp;
      if (lost > 0) {
        combat.hpLostThisCombat += lost;
        forEachRelic('onLoseHp', (r) => {
          if (r.goldPerHp) {
            source.gold += r.goldPerHp * lost;
            pushLog(`  Lucky Coin: +${r.goldPerHp * lost} gold.`);
          }
        }, source);
        pushLog(`  Lost ${lost} HP.`);
        if (source.rupture) {
          applyStatus(source, 'strength', source.rupture);
          pushLog(`  Rupture: +${source.rupture} Strength.`);
        }
      }
      break;
    }

    case 'loseEnergy':
      source.energy = Math.max(0, source.energy - eff.amount);
      pushLog(`  Lost ${eff.amount} Energy.`);
      break;

    case 'gainEnergy':
      source.energy += eff.amount;
      pushLog(`  Gained ${eff.amount} Energy.`);
      break;

    case 'applyStatus':
      for (const t of targets) {
        applyStatus(t, eff.status, eff.amount);
        if (eff.status === 'strength' && state.players.includes(t)) {
          forEachRelic('onGainStrength', (r) => {
            if (r.blockOnStrength) {
              t.block += r.blockOnStrength;
              pushLog(`  Battle Focus: +${r.blockOnStrength} Block.`);
            }
          }, t);
        }
        pushLog(`  ${t.name || 'You'} gained ${eff.amount} ${eff.status}.`);
      }
      break;

    case 'gainEnergyNextTurn':
      if (source.nextTurnEnergy !== undefined) source.nextTurnEnergy += eff.amount;
      pushLog(`  +${eff.amount} energy next turn.`);
      break;

    case 'gainEnergyPerTurn':
      source.perTurnEnergy = (source.perTurnEnergy || 0) + eff.amount;
      if (eff.selfDamagePerTurn) {
        source.perTurnHooks.push({ kind: 'selfDamage', amount: eff.selfDamagePerTurn });
      }
      pushLog(`  +${eff.amount} energy each turn.`);
      break;

    case 'draw':
      if (state.players.includes(source)) {
        draw(state, source, eff.amount);
        pushLog(`  Drew ${eff.amount}.`);
      }
      break;

    // -------- Target-facing pile/hand manipulation --------

    case 'discardRandom': {
      for (const t of targets) {
        if (!state.players.includes(t)) continue;
        for (let i = 0; i < eff.amount; i++) {
          if (!t.hand.length) break;
          const idx = Math.floor(state.rng() * t.hand.length);
          const c = t.hand.splice(idx, 1)[0];
          t.discardPile.push(c);
          pushLog(`  Discarded ${CARDS[c.defId].name}.`);
        }
      }
      break;
    }

    case 'addCardToDraw': {
      const c = makeCard(eff.cardId);
      for (const t of targets) {
        if (!state.players.includes(t)) continue;
        t.drawPile.push(c);
        t.drawPile = shuffle(t.drawPile, state.rng);
      }
      pushLog(`  Added ${CARDS[eff.cardId].name} to draw pile.`);
      break;
    }

    case 'addCardToPlayerDraw': {
      const c = makeCard(eff.cardId);
      for (const t of targets) {
        if (!state.players.includes(t)) continue;
        t.drawPile.push(c);
        t.drawPile = shuffle(t.drawPile, state.rng);
      }
      pushLog(`  Added ${CARDS[eff.cardId].name} to your draw pile.`);
      break;
    }

    case 'addCardToPlayerDiscard': {
      for (const t of targets) {
        if (!state.players.includes(t)) continue;
        t.discardPile.push(makeCard(eff.cardId));
      }
      pushLog(`  Added ${CARDS[eff.cardId].name} to your discard pile.`);
      break;
    }

    case 'exhaustRandom': {
      for (const t of targets) {
        if (!state.players.includes(t)) continue;
        if (t.hand.length) {
          const idx = Math.floor(state.rng() * t.hand.length);
          const removed = t.hand.splice(idx, 1)[0];
          exhaustCard(t, removed);
          pushLog(`  Exhausted ${CARDS[removed.defId].name}.`);
        }
      }
      break;
    }

    case 'exhaustRandomHand': {
      const n = eff.amount ?? 1;
      for (const t of targets) {
        if (!state.players.includes(t)) continue;
        for (let i = 0; i < n; i++) {
          if (!t.hand.length) break;
          const idx = Math.floor(state.rng() * t.hand.length);
          const removed = t.hand.splice(idx, 1)[0];
          exhaustCard(t, removed);
          pushLog(`  ${CARDS[removed.defId].name} was exhausted.`);
        }
      }
      break;
    }

    case 'disableRandomHand': {
      const n = eff.amount ?? 1;
      for (const t of targets) {
        if (!state.players.includes(t)) continue;
        const eligible = t.hand.filter(c => !c.disabledThisTurn);
        const toDisable = Math.min(n, eligible.length);
        for (let i = 0; i < toDisable; i++) {
          const idx = Math.floor(state.rng() * eligible.length);
          const c = eligible.splice(idx, 1)[0];
          c.disabledThisTurn = true;
        }
        pushLog(`  ${toDisable} card(s) disabled this turn.`);
      }
      break;
    }

    case 'disableHandPercent': {
      const pct = eff.percent ?? 0.5;
      for (const t of targets) {
        if (!state.players.includes(t)) continue;
        const eligible = t.hand.filter(c => !c.disabledThisTurn);
        const n = Math.floor(eligible.length * pct);
        for (let i = 0; i < n; i++) {
          const idx = Math.floor(state.rng() * eligible.length);
          const c = eligible.splice(idx, 1)[0];
          c.disabledThisTurn = true;
        }
        pushLog(`  ${n} card(s) disabled this turn.`);
      }
      break;
    }

    case 'replaceHandWithCard': {
      const id = eff.cardId;
      for (const t of targets) {
        if (!state.players.includes(t)) continue;
        const n = eff.amount ?? t.hand.length;
        const replaced = t.hand.length;
        t.discardPile.push(...t.hand);
        t.hand = [];
        for (let i = 0; i < n; i++) {
          t.hand.push(makeCard(id));
        }
        pushLog(`  ${replaced} card(s) replaced with ${CARDS[id].name}.`);
      }
      break;
    }

    // -------- Self-facing pile manipulation --------

    case 'recoverFromDiscard': {
      if (source.discardPile.length) {
        const idx = Math.floor(state.rng() * source.discardPile.length);
        const c = source.discardPile.splice(idx, 1)[0];
        source.drawPile.push(c);
        pushLog(`  Recovered ${CARDS[c.defId].name} from discard.`);
      }
      break;
    }

    case 'topDeckRandom': {
      if (source.hand.length) {
        const idx = Math.floor(state.rng() * source.hand.length);
        const c = source.hand.splice(idx, 1)[0];
        source.drawPile.push(c);
        pushLog(`  Put ${CARDS[c.defId].name} on top of draw pile.`);
      }
      break;
    }

    case 'feed': {
      const killed = targets.some(t => t.hp <= 0);
      if (killed) {
        source.maxHp += eff.amount;
        source.hp += eff.amount;
        pushLog(`  Feed! Max HP +${eff.amount}.`);
      }
      break;
    }

    case 'gainStatusPerTurn':
      if (!source.perTurnStatuses) source.perTurnStatuses = [];
      source.perTurnStatuses.push({ status: eff.status, amount: eff.amount });
      pushLog(`  Will gain ${eff.amount} ${eff.status} each turn.`);
      break;

    case 'doubleTapNextAttack':
      source.doubleTapNextAttack = true;
      pushLog('  Next attack this turn will play twice.');
      break;

    case 'burstNextSkill':
      source.burstNextSkill = true;
      pushLog('  Next skill this turn will play twice.');
      break;

    case 'echoForm':
      source.echoForm = true;
      pushLog('  Echo Form active.');
      break;

    case 'corruption':
      source.corruption = true;
      pushLog('  Corruption active. Skills cost 0 and exhaust.');
      break;

    case 'feelNoPain':
      source.feelNoPain = (source.feelNoPain || 0) + eff.amount;
      pushLog(`  Feel No Pain ${source.feelNoPain}.`);
      break;

    case 'darkEmbrace':
      source.darkEmbrace = true;
      pushLog('  Dark Embrace active.');
      break;

    case 'juggernaut':
      source.juggernaut = (source.juggernaut || 0) + eff.amount;
      pushLog(`  Juggernaut ${eff.amount}.`);
      break;

    case 'rupture':
      source.rupture = (source.rupture || 0) + 1;
      pushLog('  Rupture active.');
      break;

    case 'dropkick': {
      const t = targets[0];
      if (t && (t.statuses?.vulnerable || 0) > 0) {
        source.energy += 1;
        draw(state, source, 1);
        pushLog('  Dropkick! +1 Energy, drew 1.');
      }
      break;
    }

    case 'escapePlan':
      if (combat.attacksThisTurn > 0) {
        source.block += eff.amount;
        pushLog(`  Escape Plan: +${eff.amount} Block.`);
      }
      break;

    case 'deepBreath':
      if (source.discardPile.length >= 10) {
        draw(state, source, 2);
        pushLog('  Deep Breath: drew 2 more.');
      }
      break;

    case 'calculatedGamble': {
      const n = source.hand.length;
      source.discardPile.push(...source.hand);
      source.hand = [];
      draw(state, source, n + 1);
      pushLog(`  Calculated Gamble: discarded ${n}, drew ${n + 1}.`);
      break;
    }

    case 'fiendFire': {
      const bonus = enchantDamageBonus(card);
      const n = source.hand.length;
      const toDiscard = source.hand.splice(0);
      for (const c of toDiscard) source.discardPile.push(c);
      const dmg = n * eff.amount + bonus;
      pushLog(`  Fiend Fire: discarded ${n} cards → ${dmg} damage.`);
      for (const t of targets) {
        const r = dealDamage(source, t, dmg);
        pushLog(`  ${t.name} took ${r.dealt} (blocked ${r.blocked}).`);
      }
      break;
    }

    case 'rescueDiscard': {
      if (!source.discardPile.length) break;
      const idx = Math.floor(state.rng() * source.discardPile.length);
      const c = source.discardPile.splice(idx, 1)[0];
      exhaustCard(source, c);
      source.drawPile = shuffle(source.drawPile.concat(source.discardPile), state.rng);
      source.discardPile = [];
      pushLog(`  Rescue: exhausted ${CARDS[c.defId].name}, shuffled ${source.drawPile.length} into draw.`);
      break;
    }

    case 'shuffleDiscardIntoDraw':
      source.drawPile = shuffle(source.drawPile.concat(source.discardPile), state.rng);
      source.discardPile = [];
      pushLog(`  Shuffled discard into draw (${source.drawPile.length} cards).`);
      break;

    case 'dualWield': {
      const candidates = source.hand.filter(c => {
        const d = CARDS[c.defId];
        return d.type === 'attack' || d.type === 'power';
      });
      if (!candidates.length) { pushLog('  No Attack or Power in hand.'); break; }
      const pick = candidates[Math.floor(state.rng() * candidates.length)];
      source.hand.push(makeCard(pick.defId));
      pushLog(`  Copied ${CARDS[pick.defId].name}.`);
      break;
    }

    case 'whirlwind':
      break;

    case 'graveRobber': {
      if (!source.exhaustPile.length) {
        pushLog('  Exhaust pile is empty.');
        break;
      }
      const idx = Math.floor(state.rng() * source.exhaustPile.length);
      const c = source.exhaustPile[idx];
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
      if (!source.exhaustPile.length) {
        pushLog('  Exhaust pile is empty.');
        break;
      }
      const idx = Math.floor(state.rng() * source.exhaustPile.length);
      const c = source.exhaustPile.splice(idx, 1)[0];
      source.hand.push(c);
      pushLog(`  Returned ${CARDS[c.defId].name} from the exhaust pile.`);
      break;
    }

    case 'necromancersPact': {
      if (!source.discardPile.length) {
        pushLog('  Discard pile is empty.');
        break;
      }
      const idx = Math.floor(state.rng() * source.discardPile.length);
      const c = source.discardPile.splice(idx, 1)[0];
      const dmg = cardBaseDamage(c.defId);
      pushLog(`  Exhausted ${CARDS[c.defId].name} (${dmg} damage).`);
      exhaustCard(source, c);
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

  if (state.players.includes(attacker) && (target.statuses?.vulnerable || 0) > 0) {
    for (const rid of attacker.relics || []) {
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
    attackerUid: state.players.includes(attacker) ? 'player' : attacker.uid,
    targetUid:   state.players.includes(target)   ? 'player' : target.uid,
    dealt,
    blocked,
    animation: state.currentAnimation || 'slash',
    isSpell,
  });

  if (state.players.includes(target)) {
    damagePlayerHp(target, dealt);
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

function checkPlayerDead() {
  if (state.players.every(p => p.hp <= 0)) {
    pushLog('Defeat.');
    endCombat(false);
  }
}

export function beginEnemyTurn() {
  if (state.turn !== 'player' || state.over) return;

  for (const p of state.players) {
    for (const c of p.hand) {
      const def = CARDS[c.defId];
      if (def.endOfTurnDamage) {
        damagePlayerHp(p, def.endOfTurnDamage);
        pushLog(`${def.name}: took ${def.endOfTurnDamage}.`);
      }
    }
  }
  if (state.players.every(p => p.hp <= 0)) { endCombat(false); return; }

  for (const p of state.players) {
    recycleHand(state, p);
    tickStatuses(p);
  }
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

  if (state.players.every(p => p.hp <= 0)) {
    pushLog('Defeat.');
    endCombat(false);
    return;
  }

  for (const p of state.players) {
    if (p.hp <= 0) continue;
    if (p.perTurnStatuses) {
      for (const entry of p.perTurnStatuses) {
        applyStatus(p, entry.status, entry.amount);
      }
    }
    if (p.perTurnHooks) {
      for (const h of p.perTurnHooks) {
        if (h.kind === 'selfDamage') {
          damagePlayerHp(p, h.amount);
        }
      }
    }
    if (p.hp <= 0) continue;
    if (p.perTurnEnergy) {
      p.nextTurnEnergy += p.perTurnEnergy;
    }
    p.echoUsedThisTurn = false;
  }

  combat.attacksThisTurn = 0;

  startPlayerTurn(0);
}
