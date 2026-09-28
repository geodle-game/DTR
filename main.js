import { state } from './systems/state.js';
import { render } from './ui/render.js';

// Error banner so a crash shows up on screen instead of a blank page.
window.addEventListener('error', (e) => {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#300;color:#f88;font:13px monospace;padding:10px;z-index:999999;white-space:pre-wrap;word-break:break-all';
  el.textContent = 'ERR: ' + e.message + '\n  at ' + e.filename + ':' + e.lineno + ':' + e.colno;
  document.body.appendChild(el);
});
window.addEventListener('unhandledrejection', (e) => {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#320;color:#fb8;font:13px monospace;padding:10px;z-index:999999;white-space:pre-wrap;word-break:break-all';
  el.textContent = 'REJECT: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason));
  document.body.appendChild(el);
});

state.screen = 'mainMenu';
render();

window.__game = { state, render };
