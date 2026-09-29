import { state } from './systems/state.js';
import { render } from './ui/render.js';

state.screen = 'mainMenu';
render();

// Dev-only escape hatch. Add ?devtools=1 to the URL to expose window.__game.
// Regular players have no console handle by default.
if (typeof window !== 'undefined') {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('devtools')) {
      window.__game = { state, render };
      console.info(
        '%c[Drawn to Ruin] Devtools enabled. window.__game is available.',
        'color:#c9a3ff;font-weight:bold;'
      );
    }
  } catch {
    // URLSearchParams unavailable (very old browser). Skip silently.
  }
}
