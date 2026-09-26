export function applyStatus(entity, status, amount) {
  entity.statuses[status] = (entity.statuses[status] || 0) + amount;
}

export function hasStatus(entity, status) {
  return (entity.statuses[status] || 0) > 0;
}

export function outgoingMultiplier(attacker) {
  let m = 1;
  if (hasStatus(attacker, 'weak')) m *= 0.75;
  return m;
}

// Flat damage bonus added by a scaling stat.
// - Attacks scale with Strength.
// - Spells scale with Focus.
export function outgoingFlatBonus(attacker, isSpell = false) {
  if (isSpell) return attacker.statuses?.focus || 0;
  return attacker.statuses?.strength || 0;
}

export function incomingMultiplier(target) {
  return hasStatus(target, 'vulnerable') ? 1.5 : 1;
}

export function tickStatuses(entity) {
  for (const k of Object.keys(entity.statuses)) {
    if (k === 'strength') continue;   // Strength doesn't decay
    if (k === 'focus')    continue;   // Focus doesn't decay
    entity.statuses[k]--;
    if (entity.statuses[k] <= 0) delete entity.statuses[k];
  }
}
