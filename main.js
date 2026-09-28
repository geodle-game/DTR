import { state } from './systems/state.js';
import { render } from './ui/render.js';

state.screen = 'mainMenu';
render();

window.__game = { state, render };
