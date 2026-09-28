import { state } from './systems/state.js';
import { render } from './ui/render.js';

// Start at the title screen. newRun() is called when the player
// clicks Begin, not at boot.
state.screen = 'mainMenu';
render();

window.__game = { state, render };
