import { state } from './systems/state.js';
import { render } from './ui/render.js';

state.screen = 'mainMenu';
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
