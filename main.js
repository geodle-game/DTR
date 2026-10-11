import { state } from './systems/state.js';
import { render } from './ui/render.js';
import { startAllyAI } from './systems/ally-ai.js';

state.screen = 'mainMenu';

startAllyAI();

render();

if (typeof window !== 'undefined') {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('v') === '29') {
      window.__game = { state, render };
      console.info(
        '%c[Drawn to Ruin] Dev handle enabled.',
        'color:#c9a3ff;font-weight:bold;'
      );
    }
  } catch {}
}
