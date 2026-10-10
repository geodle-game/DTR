// ============================================================
// ui/animations.js
// Combat feedback orchestration.
//
// Attack visuals are rule-based:
//   'slash'  (default) → assets/slash.png       (static + clip reveal)
//   'heavy'            → assets/slash-heavy.png (static + clip reveal)
//   'pierce'           → assets/effects/slash.webp   (animated WebP)
//   hybrid (atk+block) → assets/effects/shield.webp  (animated WebP)
//   spell              → assets/effects/impact.webp  (animated WebP)
//
// Card play flourish: static SVGs at assets/icons/flourish-*.svg.
// Spawn behind the flying card, expand and fade over 500ms.
// ============================================================

import { CARDS } from '../data/cards.js';

// ------------------------------------------------------------
// Attack sprite table
// ------------------------------------------------------------

const EFFECT_SRC = {
  slash:  'assets/slash.png',
  heavy:  'assets/slash-heavy.png',
  pierce: 'assets/effects/slash.webp',
  hybrid: 'assets/effects/shield.webp',
  magic:  'assets/effects/impact.webp',
};

const EFFECT_DURATION = {
  slash:  588,
  heavy:  588,
  pierce: 710,
  hybrid: 220,
  magic:  440,
};

const EFFECT_SIZE = {
  slash:  300,
  heavy:  300,
  pierce: 340,
  hybrid: 360,
  magic:  400,
};

const WEBP_KINDS = new Set(['pierce', 'hybrid', 'magic']);

for (const kind of WEBP_KINDS) {
  const img = new Image();
  img.src = EFFECT_SRC[kind];
  img.decode().catch(() => {});
}

// ------------------------------------------------------------
// Flourish SVG table
// ------------------------------------------------------------

const FLOURISH_SRC = {
  attack: 'assets/icons/flourish-attack.svg',
  heal:   'assets/icons/flourish-heal.svg',
  block:  'assets/icons/flourish-block.svg',
  hybrid: 'assets/icons/flourish-hybrid.svg',
  spell:  'assets/icons/flourish-spell.svg',
  power:  'assets/icons/flourish-power.svg',
  draw:   'assets/icons/flourish-draw.svg',
  debuff: 'assets/icons/flourish-debuff.svg',
  energy: 'assets/icons/flourish-energy.svg',
};

for (const src of Object.values(FLOURISH_SRC)) {
  const img = new Image();
  img.src = src;
}

// ------------------------------------------------------------
// Card kind resolution (attack sprite)
// ------------------------------------------------------------

function effectKindForCard(defId, animationField) {
  const def = CARDS[defId];
  if (!def) return animationField || 'slash';

  if (def.type === 'spell') return 'magic';

  const effects = def.effects || [];
  const hasDamage = effects.some(e =>
    e.kind === 'damage' ||
    e.kind === 'damageRandom' ||
    e.kind === 'damageEqualToBlock' ||
    e.kind === 'damagePercentMaxHp' ||
    e.kind === 'perfectedStrike' ||
    e.kind === 'rampage' ||
    e.kind === 'finisher' ||
    e.kind === 'lastStand' ||
    e.kind === 'reaper' ||
    e.kind === 'fiendFire' ||
    e.kind === 'necromancersPact' ||
    e.kind === 'graveRobber'
  );
  const hasBlock = effects.some(e => e.kind === 'block');

  if (hasDamage && hasBlock) return 'hybrid';

  if (animationField === 'heavy')  return 'heavy';
  if (animationField === 'pierce') return 'pierce';
  if (animationField === 'magic')  return 'magic';
  return 'slash';
}

export function flourishKindForCard(defId) {
  const def = CARDS[defId];
  if (!def) return 'attack';

  if (def.type === 'spell')  return 'spell';
  if (def.type === 'power')  return 'power';

  const effects = def.effects || [];
  const hasDamage = effects.some(e =>
    e.kind === 'damage' ||
    e.kind === 'damageRandom' ||
    e.kind === 'damageEqualToBlock' ||
    e.kind === 'damagePercentMaxHp' ||
    e.kind === 'perfectedStrike' ||
    e.kind === 'rampage' ||
    e.kind === 'finisher' ||
    e.kind === 'lastStand' ||
    e.kind === 'reaper' ||
    e.kind === 'fiendFire' ||
    e.kind === 'necromancersPact' ||
    e.kind === 'graveRobber'
  );
  const hasBlock = effects.some(e => e.kind === 'block');
  const hasHeal  = effects.some(e => e.kind === 'heal' || e.kind === 'feed');
  const hasDraw  = effects.some(e => e.kind === 'draw');
  const hasEnergy = effects.some(e =>
    e.kind === 'gainEnergy' || e.kind === 'gainEnergyNextTurn'
  );
  const hasDebuff = effects.some(e =>
    e.kind === 'applyStatus' &&
    (e.status === 'weak' || e.status === 'vulnerable')
  );

  if (hasDamage && hasBlock) return 'hybrid';
  if (hasDamage) return 'attack';
  if (hasHeal)   return 'heal';
  if (hasBlock)  return 'block';
  if (hasDebuff) return 'debuff';
  if (hasDraw)   return 'draw';
  if (hasEnergy) return 'energy';
  return 'attack';
}

// ------------------------------------------------------------
// Panel resolution
// ------------------------------------------------------------

function panelForUid(uid) {
  if (!uid || uid === 'player') {
    return document.querySelector('[data-panel="player0"], [data-panel="player"]');
  }
  if (typeof uid === 'string' && uid.startsWith('player')) {
    const idx = uid.slice('player'.length) || '0';
    return (
      document.querySelector(`[data-panel="player${idx}"]`) ||
      document.querySelector('[data-panel="player0"], [data-panel="player"]')
    );
  }
  return document.querySelector(`[data-panel="enemy"][data-uid="${uid}"]`);
}

export function getPanelElement(uid) { return panelForUid(uid); }

function center(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
}

const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const easeOutQuint = x => 1 - Math.pow(1 - x, 5);

// ------------------------------------------------------------
// Static PNG slash
// ------------------------------------------------------------

function spawnStaticSlash(src, cx, cy, opts = {}) {
  const { kind = 'slash', dirX = 1, duration = 588, size = 340 } = opts;

  const el = document.createElement('img');
  el.className = `slash-png kind-${kind}`;
  el.src = src;
  el.draggable = false;
  el.alt = '';

  Object.assign(el.style, {
    position: 'fixed',
    left: cx + 'px',
    top:  cy + 'px',
    width:  size + 'px',
    height: size + 'px',
    marginLeft: -size / 2 + 'px',
    marginTop:  -size / 2 + 'px',
    pointerEvents: 'none',
    zIndex: 9000,
    transformOrigin: 'center center',
    transform: `scaleX(${dirX >= 0 ? 1 : -1}) rotate(-18deg)`,
    willChange: 'clip-path, opacity',
  });
  document.body.appendChild(el);

  const t0 = performance.now();

  function frame(now) {
    const t = (now - t0) / duration;
    if (t >= 1) { el.remove(); return; }

    let revealP, opacity;
    if (t < 0.55) {
      revealP = easeOutQuint(t / 0.55);
      opacity = 1;
    } else if (t < 0.70) {
      revealP = 1;
      opacity = 1;
    } else {
      revealP = 1;
      opacity = 1 - (t - 0.70) / 0.30;
    }

    const e = revealP * 130;
    el.style.clipPath = `polygon(0% 0%, ${e}% 0%, ${e - 35}% 100%, 0% 100%)`;
    el.style.opacity = opacity.toFixed(3);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return el;
}

// ------------------------------------------------------------
// Animated WebP spawner
// ------------------------------------------------------------

function spawnWebp(src, cx, cy, opts = {}) {
  const { size = 340, duration = 600, flip = false, className = '' } = opts;

  const el = document.createElement('img');
  el.src = src;
  el.className = 'fx-webp ' + className;
  el.draggable = false;
  el.alt = '';

  Object.assign(el.style, {
    position: 'fixed',
    left: cx + 'px',
    top:  cy + 'px',
    width:  size + 'px',
    height: size + 'px',
    marginLeft: -size / 2 + 'px',
    marginTop:  -size / 2 + 'px',
    pointerEvents: 'none',
    zIndex: 9000,
    transform: flip ? 'scaleX(-1)' : 'none',
  });

  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
  return el;
}

// ------------------------------------------------------------
// Public attack API
// ------------------------------------------------------------

export function spawnAttack(cx, cy, opts = {}) {
  const kind = opts.kind || 'slash';
  const src = EFFECT_SRC[kind] || EFFECT_SRC.slash;
  const size = EFFECT_SIZE[kind] || 340;
  const duration = EFFECT_DURATION[kind] || 600;
  const flip = (opts.dirX ?? 1) < 0;

  if (WEBP_KINDS.has(kind)) {
    return spawnWebp(src, cx, cy, { size, duration, flip });
  }
  return spawnStaticSlash(src, cx, cy, { kind, dirX: opts.dirX, duration, size });
}

export function spawnCrescent(cx, cy, opts = {}) {
  return spawnAttack(cx, cy, opts);
}

// ------------------------------------------------------------
// Card play flourish
// ------------------------------------------------------------

export function spawnFlourish(sourceEl, kind) {
  if (!sourceEl) return null;
  const src = FLOURISH_SRC[kind];
  if (!src) return null;

  const r = sourceEl.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  const el = document.createElement('img');
  el.src = src;
  el.className = `fx-flourish fx-flourish-${kind}`;
  el.draggable = false;
  el.alt = '';

  Object.assign(el.style, {
    position: 'fixed',
    left: cx + 'px',
    top:  cy + 'px',
    pointerEvents: 'none',
    zIndex: 8500,
  });

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 520);
  return el;
}

// ------------------------------------------------------------
// Position-based spawners
// ------------------------------------------------------------
// These take raw screen coordinates instead of an element.
// Use them when the element reference might be detached by the
// time the effect fires (e.g. after a re-render).

export function spawnFloatTextAt(x, y, text, kind = 'damage') {
  const node = document.createElement('div');
  node.className = `float-text ${kind}`;
  node.textContent = text;
  node.style.left = x + 'px';
  node.style.top  = y + 'px';
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 950);
}

export function spawnBlockEffectAt(x, y) {
  const img = document.createElement('img');
  img.src = 'assets/block.png';
  img.className = 'block-effect';
  img.style.left = x + 'px';
  img.style.top  = y + 'px';
  document.body.appendChild(img);
  setTimeout(() => img.remove(), 1500);

  const ring = document.createElement('div');
  ring.className = 'block-ring';
  ring.style.left = x + 'px';
  ring.style.top  = y + 'px';
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 1500);
}

// ------------------------------------------------------------
// Element-based spawners (kept for compatibility)
// ------------------------------------------------------------

export function spawnFloatText(el, text, kind = 'damage') {
  if (!el) return;
  const r = el.getBoundingClientRect();
  spawnFloatTextAt(r.left + r.width / 2, r.top + 20, text, kind);
}

export function spawnBlockEffect(playerEl) {
  if (!playerEl) return;
  const r = playerEl.getBoundingClientRect();
  spawnBlockEffectAt(r.right + 90, r.top + r.height / 2);
}

// ------------------------------------------------------------
// Spell book
// ------------------------------------------------------------

let lastBookSpawn = 0;

export function spawnSpellBook(casterEl, { duration = 320, dirX = 1 } = {}) {
  if (!casterEl) return;
  const now = performance.now();
  if (now - lastBookSpawn < 100) return;
  lastBookSpawn = now;

  const r = casterEl.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  const book = document.createElement('div');
  book.className = 'spell-book-cast';
  book.style.left = cx + 'px';
  book.style.top  = cy + 'px';
  book.style.animationDuration = duration + 'ms';
  book.style.backgroundImage = 'url(assets/spell-book.png)';
  book.style.setProperty('--flip', dirX >= 0 ? '1' : '-1');
  document.body.appendChild(book);

  const ring = document.createElement('div');
  ring.className = 'spell-book-ring';
  ring.style.left = cx + 'px';
  ring.style.top  = cy + 'px';
  ring.style.animationDuration = (duration + 120) + 'ms';
  document.body.appendChild(ring);

  setTimeout(() => {
    book.remove();
    ring.remove();
  }, duration + 260);

  return book;
}

// ------------------------------------------------------------
// Panel reactions
// ------------------------------------------------------------

function windupAttacker(el, dirX) {
  if (!el) return;
  el.classList.remove('attacking');
  void el.offsetWidth;
  el.style.setProperty('--windup-x', `${dirX * 10}px`);
  el.style.setProperty('--windup-rot', `${dirX * 2.5}deg`);
  el.classList.add('attacking');
  setTimeout(() => el.classList.remove('attacking'), 500);
}

function knockbackTarget(el, dirX, dmg) {
  if (!el) return;
  const strength = Math.min(14, 4 + dmg * 0.15);
  el.classList.remove('knocked');
  void el.offsetWidth;
  el.style.setProperty('--kb-x', `${dirX * strength}px`);
  el.classList.add('knocked');
  setTimeout(() => el.classList.remove('knocked'), 460);
}

function flashPanelEl(el) {
  if (!el) return;
  el.classList.remove('hit-flash');
  void el.offsetWidth;
  el.classList.add('hit-flash');
  setTimeout(() => el.classList.remove('hit-flash'), 420);
}

// ------------------------------------------------------------
// Screen effects
// ------------------------------------------------------------

export function screenShake(intensity = 1) {
  const app = document.getElementById('app');
  if (!app) return;
  app.classList.remove('screen-shake');
  void app.offsetWidth;
  app.style.setProperty('--shake-power', intensity.toFixed(2));
  app.classList.add('screen-shake');
  setTimeout(() => app.classList.remove('screen-shake'), 400);
}

export function screenFlash(color = 'rgba(255,255,255,0.35)') {
  const el = document.createElement('div');
  el.className = 'screen-flash';
  el.style.background = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 240);
}

function hitStop(ms = 70) {
  const app = document.getElementById('app');
  if (!app) return;
  app.classList.add('hit-stop');
  setTimeout(() => app.classList.remove('hit-stop'), ms);
}

// ------------------------------------------------------------
// Damage number
// ------------------------------------------------------------

export function spawnDamageNumber(el, amount, { kind = 'slash' } = {}) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const jitter = (Math.random() - 0.5) * 30;
  const scale = 1 + Math.min(1.2, amount / 25);

  const node = document.createElement('div');
  node.className = `float-text damage kind-${kind}`;
  node.textContent = amount;
  node.style.left = (r.left + r.width / 2 + jitter) + 'px';
  node.style.top  = (r.top + r.height / 2) + 'px';
  node.style.fontSize = `${Math.round(38 * scale)}px`;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 1000);
}

// ------------------------------------------------------------
// Blocked indicator
// ------------------------------------------------------------

export function spawnBlockedIndicator(targetEl) {
  if (!targetEl) return;
  const c = center(targetEl);

  const img = document.createElement('img');
  img.src = 'assets/shield.png';
  img.className = 'block-impact';
  img.style.left = c.x + 'px';
  img.style.top  = c.y + 'px';
  document.body.appendChild(img);
  setTimeout(() => img.remove(), 900);

  const label = document.createElement('div');
  label.className = 'float-text blocked';
  label.textContent = 'BLOCKED';
  label.style.left = (c.x + 40) + 'px';
  label.style.top  = (c.y - 30) + 'px';
  document.body.appendChild(label);
  setTimeout(() => label.remove(), 950);
}

// ------------------------------------------------------------
// Hit orchestrator
// ------------------------------------------------------------

const STAGGER_MS = 190;
const WINDUP_PHYSICAL = 130;
const WINDUP_SPELL    = 340;

function kindForHit(hit) {
  if (hit.cardDefId) return effectKindForCard(hit.cardDefId, hit.animation);
  if (hit.animation === 'heavy')  return 'heavy';
  if (hit.animation === 'magic')  return 'magic';
  if (hit.animation === 'pierce') return 'pierce';
  return 'slash';
}

export function playHit(hit, { delay = 0 } = {}) {
  setTimeout(() => {
    const attackerEl = panelForUid(hit.attackerUid);
    const targetEl   = panelForUid(hit.targetUid);
    if (!targetEl) return;

    const targetC = center(targetEl);
    const dirX = attackerEl
      ? (Math.sign(targetC.x - center(attackerEl).x) || 1)
      : 1;

    const kind   = kindForHit(hit);
    const windup = hit.isSpell ? WINDUP_SPELL : WINDUP_PHYSICAL;

    if (attackerEl) {
      if (hit.isSpell) {
        spawnSpellBook(attackerEl, { duration: windup, dirX });
      } else {
        windupAttacker(attackerEl, dirX);
      }
    }

    setTimeout(() => {
      const c = center(targetEl);

      spawnAttack(c.x, c.y, { kind, dirX });

      if (hit.blocked > 0) {
        spawnBlockedIndicator(targetEl);
      }

      if (hit.dealt > 0) hitStop(hit.dealt >= 15 ? 90 : 60);

      if (hit.dealt > 0) {
        spawnDamageNumber(targetEl, hit.dealt, { kind });
        knockbackTarget(targetEl, dirX, hit.dealt);
        flashPanelEl(targetEl);

        const intensity = Math.min(1.4, 0.4 + hit.dealt / 40);
        screenShake(intensity);

        if (hit.dealt >= 15) {
          const tint = {
            heavy:  'rgba(255,80,80,0.35)',
            hybrid: 'rgba(255,220,140,0.35)',
            magic:  'rgba(180,140,255,0.35)',
            pierce: 'rgba(255,255,255,0.45)',
            slash:  'rgba(255,180,120,0.35)',
          }[kind];
          screenFlash(tint);
        }
      }
    }, windup);
  }, delay);
}

export function animateHits(hits) {
  if (!hits || !hits.length) return;
  const stagger = hits.length > 2 ? 150 : STAGGER_MS;
  hits.forEach((hit, i) => playHit(hit, { delay: i * stagger }));
}

// ------------------------------------------------------------
// Legacy compat
// ------------------------------------------------------------

export function shakePanel(uid) {
  const el = panelForUid(uid);
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 420);
}
