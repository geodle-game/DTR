// ============================================================
// ui/animations.js
// Combat feedback orchestration + the slash sprite reveal.
// ============================================================

import { spawnImpactBurst } from './effects.js';

const rng = () => Math.random();

const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const easeOutQuint = x => 1 - Math.pow(1 - x, 5);

function panelForUid(uid) {
  if (!uid || uid === 'player')
    return document.querySelector('[data-panel="player"]');
  return document.querySelector(`[data-panel="enemy"][data-uid="${uid}"]`);
}

export function getPanelElement(uid) { return panelForUid(uid); }

function center(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
}

// ============================================================
// SLASH SPRITE — tip-first reveal
// ============================================================

const REVEAL_FROM_RIGHT = false;
const SLASH_SIZE = 340;

export function spawnCrescent(cx, cy, opts = {}) {
  const {
    kind = 'slash',
    dirX = 1,
    duration = 588,
  } = opts;

  const el = document.createElement('img');
  el.className = `slash-png kind-${kind}`;
  el.src = kind === 'heavy'
    ? 'assets/slash-heavy.png'
    : 'assets/slash.png';

  Object.assign(el.style, {
    position: 'fixed',
    left: cx + 'px',
    top:  cy + 'px',
    width:  SLASH_SIZE + 'px',
    height: SLASH_SIZE + 'px',
    marginLeft: -SLASH_SIZE / 2 + 'px',
    marginTop:  -SLASH_SIZE / 2 + 'px',
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
    let clip;
    if (!REVEAL_FROM_RIGHT) {
      clip = `polygon(0% 0%, ${e}% 0%, ${e - 35}% 100%, 0% 100%)`;
    } else {
      clip = `polygon(${100 - e}% 0%, 100% 0%, 100% 100%, ${100 - e + 35}% 100%)`;
    }

    el.style.clipPath = clip;
    el.style.opacity = opacity.toFixed(3);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return el;
}

// ============================================================
// SPELL BOOK — hovers above the caster while a spell charges
// ============================================================

let lastBookSpawn = 0;

export function spawnSpellBook(casterEl, { duration = 320, dirX = 1 } = {}) {
  if (!casterEl) return;

  // Dedupe: AoE spells produce one hit per target; only show one book.
  const now = performance.now();
  if (now - lastBookSpawn < 100) return;
  lastBookSpawn = now;

  const r = casterEl.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  const img = document.createElement('img');
  img.src = 'assets/spell-book.png';
  img.className = 'spell-book-cast';
  img.style.left = cx + 'px';
  img.style.top  = cy + 'px';
  img.style.animationDuration = duration + 'ms';
  img.style.transform = `scaleX(${dirX >= 0 ? 1 : -1})`;
  document.body.appendChild(img);

  const ring = document.createElement('div');
  ring.className = 'spell-book-ring';
  ring.style.left = cx + 'px';
  ring.style.top  = cy + 'px';
  ring.style.animationDuration = (duration + 120) + 'ms';
  document.body.appendChild(ring);

  setTimeout(() => {
    img.remove();
    ring.remove();
  }, duration + 260);

  return img;
}

// ============================================================
// PANEL REACTIONS
// ============================================================

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

// ============================================================
// SCREEN EFFECTS
// ============================================================

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

// ============================================================
// FLOATING TEXT
// ============================================================

export function spawnDamageNumber(el, amount, { kind = 'slash' } = {}) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const jitter = (rng() - 0.5) * 30;
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

export function spawnFloatText(el, text, kind = 'damage') {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const node = document.createElement('div');
  node.className = `float-text ${kind}`;
  node.textContent = text;
  node.style.left = (r.left + r.width / 2) + 'px';
  node.style.top  = (r.top + 20) + 'px';
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 950);
}

// ============================================================
// BLOCK — PNG-based (shield.png + block.png)
// ============================================================

export function spawnBlockedIndicator(targetEl) {
  if (!targetEl) return;
  const c = center(targetEl);

  const shield = document.createElement('img');
  shield.src = 'assets/shield.png';
  shield.className = 'block-impact';
  shield.style.left = c.x + 'px';
  shield.style.top  = c.y + 'px';
  document.body.appendChild(shield);
  setTimeout(() => shield.remove(), 900);

  const label = document.createElement('div');
  label.className = 'float-text blocked';
  label.textContent = 'BLOCKED';
  label.style.left = (c.x + 40) + 'px';
  label.style.top  = (c.y - 30) + 'px';
  document.body.appendChild(label);
  setTimeout(() => label.remove(), 950);
}

export function spawnBlockEffect(playerEl) {
  if (!playerEl) return;
  const r = playerEl.getBoundingClientRect();
  const cx = r.right + 90;
  const cy = r.top + r.height / 2;

  const img = document.createElement('img');
  img.src = 'assets/block.png';
  img.className = 'block-effect';
  img.style.left = cx + 'px';
  img.style.top  = cy + 'px';
  document.body.appendChild(img);
  setTimeout(() => img.remove(), 1500);

  const ring = document.createElement('div');
  ring.className = 'block-ring';
  ring.style.left = cx + 'px';
  ring.style.top  = cy + 'px';
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 1500);
}

// ============================================================
// HIT ORCHESTRATOR
// ============================================================

const STAGGER_MS = 190;
const WINDUP_PHYSICAL = 130;
const WINDUP_SPELL    = 340;

function kindFor(animation) {
  if (animation === 'heavy')  return 'heavy';
  if (animation === 'magic')  return 'magic';
  if (animation === 'pierce') return 'pierce';
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

    const kind   = kindFor(hit.animation);
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

      if (hit.dealt > 0 || hit.blocked === 0) {
        spawnCrescent(c.x, c.y, { kind, dirX, duration: 588 });
        spawnImpactBurst(c.x, c.y, { kind, damage: hit.dealt });
      }

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

// ============================================================
// LEGACY COMPAT
// ============================================================

export function shakePanel(uid) {
  const el = panelForUid(uid);
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 420);
}
