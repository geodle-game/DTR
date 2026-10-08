// ============================================================
// ui/tutorialOverlay.js
// Renders the scripted-battle overlays: modal cards, highlight
// spotlights, and floating prompts.
//
// Called from render.js after renderCombat, whenever
// state.scriptBattle?.active is true.
//
// Style is injected once via ensureTutorialStyles(). If you would
// rather keep all CSS in screens.css, move the rules from the
// injected block into screens.css and delete ensureTutorialStyles.
// ============================================================

import { state } from '../systems/state.js';
import { currentStep, continueStep } from '../systems/tutorial.js';
import { render } from './render.js';

// ------------------------------------------------------------
// Target resolution
// ------------------------------------------------------------

function resolveTarget(token) {
  if (!token) return null;
  if (token === 'enemy') return document.querySelector('[data-panel="enemy"]');

  if (token === 'end-turn') {
    const bar = document.querySelector('.bar');
    if (!bar) return null;
    const btns = bar.querySelectorAll('.btn');
    for (const b of btns) {
      const text = (b.textContent || '').trim().toLowerCase();
      if (text.includes('end turn') || text.includes('waiting')) return b;
    }
    return btns[0] || null;
  }

  if (token === 'intent') return document.querySelector('.enemy-card');
  if (token === 'hand') return document.querySelector('.hand');

  if (token.startsWith('card:')) {
    const defId = token.slice('card:'.length);
    const cards = document.querySelectorAll('.hand .card');
    for (const el of cards) {
      const name = el.querySelector('.cname')?.textContent || '';
      if (matchesCardName(name, defId)) return el;
    }
  }

  return null;
}

function matchesCardName(name, defId) {
  const map = {
    strike: 'Strike',
    defend: 'Defend',
    bash: 'Bash',
    'pommel-strike': 'Pommel Strike',
    'iron-wave': 'Iron Wave',
    cleave: 'Cleave',
    neutralize: 'Neutralize',
    inflame: 'Inflame',
    impervious: 'Impervious',
    bludgeon: 'Bludgeon',
    reaper: 'Reaper',
    'arcane-spark': 'Arcane Spark',
    'arcane-bolt': 'Arcane Bolt',
    'frost-shard': 'Frost Shard',
    'arcane-focus': 'Arcane Focus',
    mend: 'Mend',
    blessing: 'Blessing',
  };
  return map[defId] === name;
}

// ------------------------------------------------------------
// Renderers
// ------------------------------------------------------------

function renderModal(root, step) {
  const overlay = document.createElement('div');
  overlay.className = 'tutorial-overlay';

  const panel = document.createElement('div');
  panel.className = 'tutorial-panel';

  const title = document.createElement('h2');
  title.className = 'tutorial-title';
  title.textContent = step.title || 'Tutorial';
  panel.appendChild(title);

  const body = document.createElement('div');
  body.className = 'tutorial-body';
  for (const line of step.body || []) {
    const p = document.createElement('p');
    p.textContent = line;
    body.appendChild(p);
  }
  panel.appendChild(body);

  const btn = document.createElement('button');
  btn.className = 'btn tutorial-btn';
  btn.textContent = 'Got it';
  btn.addEventListener('click', () => {
    continueStep();
    render();
  });
  panel.appendChild(btn);

  overlay.appendChild(panel);
  root.appendChild(overlay);
}

function renderHighlight(root, step) {
  const target = resolveTarget(step.target);

  if (!target) {
    // Target not found. Fall back to a floating prompt.
    return renderPrompt(root, step);
  }

  const rect = target.getBoundingClientRect();

  // Highlight ring around the target.
  const ring = document.createElement('div');
  ring.className = 'tutorial-ring';
  ring.style.left = (rect.left - 6) + 'px';
  ring.style.top = (rect.top - 6) + 'px';
  ring.style.width = (rect.width + 12) + 'px';
  ring.style.height = (rect.height + 12) + 'px';
  root.appendChild(ring);

  // Prompt box below the target.
  const box = document.createElement('div');
  box.className = 'tutorial-prompt';

  const text = document.createElement('div');
  text.className = 'tutorial-prompt-text';
  text.textContent = step.text || '';
  box.appendChild(text);

  // If this highlight has advanceOn: 'continue', it needs a
  // Continue button, otherwise it can never be dismissed. This
  // happens for informational highlights like the intent step.
  if (step.advanceOn === 'continue') {
    const btn = document.createElement('button');
    btn.className = 'btn tutorial-prompt-btn';
    btn.textContent = 'Got it';
    btn.style.marginTop = '10px';
    btn.style.pointerEvents = 'auto';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      continueStep();
      render();
    });
    box.appendChild(btn);
    box.style.pointerEvents = 'auto';
  }

  const boxWidth = 360;
  const boxLeft = Math.min(
    Math.max(16, rect.left + rect.width / 2 - boxWidth / 2),
    window.innerWidth - boxWidth - 16,
  );
  const boxTop = rect.bottom + 20;

  box.style.left = boxLeft + 'px';
  box.style.top = boxTop + 'px';
  box.style.width = boxWidth + 'px';
  root.appendChild(box);
}

function renderPrompt(root, step) {
  const box = document.createElement('div');
  box.className = 'tutorial-prompt tutorial-prompt-float';
  box.textContent = step.text || '';
  root.appendChild(box);
}

// ------------------------------------------------------------
// Mount
// ------------------------------------------------------------

export function mountTutorialOverlay(root) {
  if (!state.scriptBattle?.active) return;
  const step = currentStep();
  if (!step) return;

  if (step.type === 'modal') return renderModal(root, step);
  if (step.type === 'highlight') return renderHighlight(root, step);
  if (step.type === 'prompt') return renderPrompt(root, step);
}

// ------------------------------------------------------------
// CSS injection
// ------------------------------------------------------------

let cssInjected = false;

export function ensureTutorialStyles() {
  if (cssInjected) return;
  cssInjected = true;

  const style = document.createElement('style');
  style.id = 'tutorial-overlay-styles';
  style.textContent = `
    .tutorial-ring {
      position: fixed;
      border: 2px solid #ffd166;
      border-radius: 12px;
      pointer-events: none;
      z-index: 550;
      box-shadow:
        0 0 0 3px rgba(255,209,102,.25),
        0 0 24px rgba(255,209,102,.8),
        0 0 60px rgba(255,209,102,.3);
      animation: tutorialRingPulse 1.6s ease-in-out infinite;
    }

    @keyframes tutorialRingPulse {
      0%, 100% {
        box-shadow:
          0 0 0 3px rgba(255,209,102,.2),
          0 0 20px rgba(255,209,102,.65),
          0 0 50px rgba(255,209,102,.2);
      }
      50% {
        box-shadow:
          0 0 0 5px rgba(255,209,102,.4),
          0 0 32px rgba(255,209,102,1),
          0 0 80px rgba(255,209,102,.4);
      }
    }

    .tutorial-prompt {
      position: fixed;
      background: linear-gradient(180deg, #2a2438, #1a1428);
      border: 2px solid #ffd166;
      border-radius: 12px;
      padding: 14px 18px;
      color: #ffeab8;
      font-size: 14px;
      line-height: 1.55;
      font-family: Georgia, "Times New Roman", serif;
      box-shadow:
        0 8px 24px rgba(0,0,0,.6),
        0 0 20px rgba(255,209,102,.35);
      z-index: 560;
      pointer-events: none;
      animation: tutorialPromptIn .3s ease-out;
    }

    .tutorial-prompt-text {
      pointer-events: none;
    }

    .tutorial-prompt-btn {
      pointer-events: auto;
    }

    .tutorial-prompt-float {
      left: 50%;
      bottom: 200px;
      top: auto !important;
      transform: translateX(-50%);
      max-width: 440px;
      text-align: center;
      animation: tutorialPromptFloatIn .35s ease-out;
    }

    @keyframes tutorialPromptIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes tutorialPromptFloatIn {
      from { opacity: 0; transform: translateX(-50%) translateY(12px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
