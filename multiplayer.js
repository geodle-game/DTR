// ============================================================
// multiplayer.js — manual signaling (copy/paste handshake)
//
// No server. No PeerJS. No accounts.
//
// How it works:
//   1. Host generates an "offer" blob. Shows it in a textarea.
//   2. Host sends that text to the guest however they want
//      (text message, AirDrop, WhatsApp, pass the phone).
//   3. Guest pastes the offer, generates an "answer" blob,
//      shows it back.
//   4. Host pastes the answer. Data channel opens.
//
// Both devices must be on the same network for reliable results.
// STUN is included so cross-network sometimes works, but no
// guarantee without TURN.
// ============================================================

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const LOG_MAX = 200;

// ------------------------------------------------------------
// State
// ------------------------------------------------------------

const app = {
  screen: 'lobby',       // 'lobby' | 'host' | 'guest' | 'game'
  role: null,            // 'host' | 'guest'
  status: '',
  statusKind: '',

  pc: null,
  dc: null,
  myId: Math.random().toString(36).slice(2, 8),

  hostStep: 0,           // 0=idle, 1=offer shown, 2=answer pasted
  guestStep: 0,          // 0=idle, 1=offer pasted, 2=answer shown

  localBlob: '',         // the offer (host) or answer (guest) we generated
  pastedBlob: '',        // the text the user pasted back

  // Game state (host-authoritative)
  enemyHp: 100,
  enemyMaxHp: 100,
  energy: 3,
  maxEnergy: 3,
  turn: 1,
  phase: 'players',
  endedBy: new Set(),
  log: [],
  t0: performance.now(),
};

function logLine(text, kind = '') {
  const ts = ((performance.now() - app.t0) / 1000).toFixed(2);
  const entry = { text: `[${ts}] ${text}`, kind, at: performance.now() };
  app.log.push(entry);
  if (app.log.length > LOG_MAX) app.log.shift();
  console.log('[mp]', entry.text);
  renderLogOnly();
}

function setStatus(text, kind = '') {
  app.status = text;
  app.statusKind = kind;
}

// ------------------------------------------------------------
// Blob encoding
//
// SDP is a long text. We JSON the full {sdp, ice[]} and base64 it
// so it's one copy-paste chunk instead of two.
//
// We wait for ICE gathering to complete before generating the
// blob, so all candidates are baked in. Gathering takes ~1-3s
// on same-network.
// ------------------------------------------------------------

function encodeBlob(obj) {
  const json = JSON.stringify(obj);
  // btoa fails on unicode; encodeURIComponent to be safe.
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeBlob(str) {
  const cleaned = String(str).replace(/\s+/g, '');
  const json = decodeURIComponent(escape(atob(cleaned)));
  return JSON.parse(json);
}

function waitForIceComplete(pc, timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve();
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') finish();
    });
    // Some browsers never fire 'complete' — bail after the timeout.
    setTimeout(finish, timeoutMs);
  });
}

// ------------------------------------------------------------
// WebRTC setup
// ------------------------------------------------------------

function buildPeerConnection() {
  const pc = new RTCPeerConnection(ICE_CONFIG);

  pc.addEventListener('iceconnectionstatechange', () => {
    logLine('ICE: ' + pc.iceConnectionState,
      pc.iceConnectionState === 'connected' ? 'ok' :
      pc.iceConnectionState === 'failed' ? 'err' : '');
  });
  pc.addEventListener('connectionstatechange', () => {
    logLine('conn: ' + pc.connectionState,
      pc.connectionState === 'connected' ? 'ok' :
      pc.connectionState === 'failed' ? 'err' : '');
  });
  pc.addEventListener('icecandidateerror', (e) => {
    // Common and mostly harmless — the browser tries many candidates.
    // Only log if it's a TURN error (code 701).
    if (e.errorCode === 701) logLine('ICE candidate error: ' + e.errorText, 'warn');
  });

  return pc;
}

function wireDataChannel(dc) {
  app.dc = dc;

  dc.addEventListener('open', () => {
    logLine('✓ Data channel OPEN', 'ok');
    app.screen = 'game';
    setStatus('Connected!', 'ok');

    // Host pushes initial state.
    if (app.role === 'host') {
      sendMsg({ type: 'STATE', snapshot: snapshotGame() });
    }
    render();
  });

  dc.addEventListener('message', (e) => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }
    handleGameMessage(msg);
  });

  dc.addEventListener('close', () => {
    logLine('Data channel closed', 'err');
    setStatus('Disconnected.', 'error');
    render();
  });

  dc.addEventListener('error', (e) => logLine('dc error: ' + (e.message || ''), 'err'));
}

function sendMsg(msg) {
  if (!app.dc || app.dc.readyState !== 'open') return;
  try { app.dc.send(JSON.stringify(msg)); }
  catch (e) { logLine('send error: ' + e.message, 'err'); }
}

// ------------------------------------------------------------
// Host flow
// ------------------------------------------------------------

async function startHost() {
  app.role = 'host';
  app.screen = 'host';
  app.hostStep = 1;
  app.localBlob = '';
  app.pastedBlob = '';
  setStatus('Generating offer…', 'wait');
  render();

  app.pc = buildPeerConnection();
  const dc = app.pc.createDataChannel('game', { ordered: true });
  wireDataChannel(dc);

  const offer = await app.pc.createOffer();
  await app.pc.setLocalDescription(offer);
  logLine('Offer created, gathering ICE…', '');

  await waitForIceComplete(app.pc, 5000);
  logLine('ICE gathering done', 'ok');

  const blob = encodeBlob({
    kind: 'offer',
    sdp: app.pc.localDescription.sdp,
    type: app.pc.localDescription.type,
  });
  app.localBlob = blob;
  logLine(`Offer ready (${blob.length} chars)`, 'ok');
  setStatus('Offer ready. Send it to your guest.', 'ok');
  render();
}

async function hostAcceptAnswer() {
  if (!app.pastedBlob.trim()) {
    setStatus('Paste the answer text first.', 'error');
    render();
    return;
  }
  try {
    const data = decodeBlob(app.pastedBlob);
    if (data.kind !== 'answer') throw new Error('Not an answer blob');
    await app.pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
    logLine('✓ Answer accepted — negotiating…', 'ok');
    setStatus('Connecting…', 'wait');
    app.hostStep = 2;
    render();
  } catch (e) {
    logLine('✗ Bad answer: ' + e.message, 'err');
    setStatus('Could not parse the answer. Check it was copied fully.', 'error');
    render();
  }
}

// ------------------------------------------------------------
// Guest flow
// ------------------------------------------------------------

function startGuest() {
  app.role = 'guest';
  app.screen = 'guest';
  app.guestStep = 1;
  app.localBlob = '';
  app.pastedBlob = '';
  setStatus('Paste the offer from the host.', '');
  render();
}

async function guestAcceptOffer() {
  if (!app.pastedBlob.trim()) {
    setStatus('Paste the offer text first.', 'error');
    render();
    return;
  }
  setStatus('Reading offer…', 'wait');
  render();

  try {
    const data = decodeBlob(app.pastedBlob);
    if (data.kind !== 'offer') throw new Error('Not an offer blob');

    app.pc = buildPeerConnection();
    app.pc.addEventListener('datachannel', (e) => {
      logLine('◀ Host data channel received', '');
      wireDataChannel(e.channel);
    });

    await app.pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
    logLine('Offer accepted — creating answer…', '');

    const answer = await app.pc.createAnswer();
    await app.pc.setLocalDescription(answer);
    await waitForIceComplete(app.pc, 5000);
    logLine('ICE gathering done', 'ok');

    const blob = encodeBlob({
      kind: 'answer',
      sdp: app.pc.localDescription.sdp,
      type: app.pc.localDescription.type,
    });
    app.localBlob = blob;
    logLine(`Answer ready (${blob.length} chars)`, 'ok');
    setStatus('Answer ready. Send it back to the host.', 'ok');
    app.guestStep = 2;
    render();
  } catch (e) {
    logLine('✗ Bad offer: ' + e.message, 'err');
    setStatus('Could not parse the offer. Check it was copied fully.', 'error');
    render();
  }
}

// ------------------------------------------------------------
// Game messages
// ------------------------------------------------------------

function snapshotGame() {
  return {
    enemyHp: app.enemyHp, enemyMaxHp: app.enemyMaxHp,
    energy: app.energy, maxEnergy: app.maxEnergy,
    turn: app.turn, phase: app.phase,
  };
}
function applySnapshot(s) {
  app.enemyHp = s.enemyHp; app.enemyMaxHp = s.enemyMaxHp;
  app.energy = s.energy; app.maxEnergy = s.maxEnergy;
  app.turn = s.turn; app.phase = s.phase;
}

function handleGameMessage(msg) {
  switch (msg.type) {
    case 'STATE':
      if (app.role === 'guest' && msg.snapshot) {
        applySnapshot(msg.snapshot);
        logLine(`Got state from host. Turn ${app.turn}.`, 'ok');
      }
      render();
      return;
    case 'ACTION':
      applyRemoteAction(msg.action, msg.senderId);
      render();
      return;
    case 'RESET':
      resetGame(false);
      logLine('Opponent reset.', '');
      render();
      return;
  }
}

function applyRemoteAction(action, senderId) {
  switch (action.type) {
    case 'ATTACK': {
      const dmg = action.amount ?? 10;
      app.enemyHp = Math.max(0, app.enemyHp - dmg);
      logLine(`${String(senderId).slice(0, 6)} attacked for ${dmg}.`, '');
      break;
    }
    case 'END_TURN':
      handleEndTurn(senderId);
      break;
  }
}

function doAttack() {
  if (!app.dc || app.dc.readyState !== 'open') return;
  if (app.phase !== 'players') return;
  if (app.energy < 1) return;
  app.energy -= 1;
  const action = { type: 'ATTACK', amount: 10, senderId: app.myId };
  applyRemoteAction(action, app.myId);
  sendMsg({ type: 'ACTION', action });
  render();
}

function doEndTurn() {
  if (!app.dc || app.dc.readyState !== 'open') return;
  if (app.phase !== 'players') return;
  if (app.endedBy.has(app.myId)) return;
  const action = { type: 'END_TURN', senderId: app.myId };
  handleEndTurn(app.myId);
  sendMsg({ type: 'ACTION', action });
  render();
}

function handleEndTurn(senderId) {
  if (app.phase !== 'players') return;
  if (app.endedBy.has(senderId)) return;
  app.endedBy.add(senderId);
  logLine(`${String(senderId).slice(0, 6)} ended turn.`, '');
  if (app.endedBy.size >= 2) startEnemyPhase();
}

function startEnemyPhase() {
  app.phase = 'enemy';
  app.endedBy.clear();
  logLine(`Turn ${app.turn} — enemy phase.`, '');
  render();
  setTimeout(() => {
    if (app.phase !== 'enemy') return;
    app.turn += 1;
    app.energy = app.maxEnergy;
    app.phase = 'players';
    logLine(`Turn ${app.turn} — players.`, '');
    render();
  }, 1000);
}

function doReset(broadcast = true) {
  resetGame(broadcast);
  render();
}
function resetGame(broadcast) {
  app.enemyHp = 100; app.enemyMaxHp = 100;
  app.energy = 3; app.maxEnergy = 3;
  app.turn = 1; app.phase = 'players';
  app.endedBy.clear();
  app.log = [];
  logLine('Reset.', '');
  if (broadcast && app.dc && app.dc.readyState === 'open') sendMsg({ type: 'RESET' });
}

// ------------------------------------------------------------
// Clipboard helpers
// ------------------------------------------------------------

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const t = document.createElement('textarea');
      t.value = text;
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      document.body.removeChild(t);
      return true;
    } catch {
      return false;
    }
  }
}

async function pasteIntoTextarea(ta) {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      ta.value = text;
      ta.dispatchEvent(new Event('input'));
    }
  } catch {
    ta.focus();
  }
}

// ------------------------------------------------------------
// Rendering
// ------------------------------------------------------------

const root = document.getElementById('mp-root');

function render() {
  root.innerHTML = '';
  const frame = document.createElement('div');
  frame.className = 'mp-frame';
  frame.appendChild(el('h1', { class: 'mp-title' }, 'DRAWN TO RUIN'));
  frame.appendChild(el('p', { class: 'mp-subtitle' }, 'manual handshake multiplayer'));

  if (app.screen === 'lobby')      frame.appendChild(renderLobby());
  else if (app.screen === 'host')  frame.appendChild(renderHost());
  else if (app.screen === 'guest') frame.appendChild(renderGuest());
  else                             frame.appendChild(renderGame());

  root.appendChild(frame);
}

function renderLogOnly() {
  const box = document.querySelector('.mp-log');
  if (!box) return;
  box.innerHTML = '';
  for (const entry of app.log) {
    box.appendChild(el('div', { class: 'mp-log-line' + (entry.kind ? ' ' + entry.kind : '') }, entry.text));
  }
  box.scrollTop = box.scrollHeight;
}

function el(tag, attrs = {}, textOrChildren) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'style') Object.assign(node.style, v);
    else node.setAttribute(k, v);
  }
  if (typeof textOrChildren === 'string') node.textContent = textOrChildren;
  else if (Array.isArray(textOrChildren)) for (const c of textOrChildren) if (c) node.appendChild(c);
  else if (textOrChildren instanceof Node) node.appendChild(textOrChildren);
  return node;
}

function statusEl() {
  if (!app.status) return null;
  return el('div', { class: 'mp-status' + (app.statusKind ? ' ' + app.statusKind : '') }, app.status);
}

function logBoxEl() {
  const box = el('div', { class: 'mp-log' });
  for (const entry of app.log) {
    box.appendChild(el('div', { class: 'mp-log-line' + (entry.kind ? ' ' + entry.kind : '') }, entry.text));
  }
  if (app.log.length === 0) box.appendChild(el('div', { class: 'mp-log-line' }, 'Log will appear here.'));
  return box;
}

function renderLobby() {
  const card = el('div', { class: 'mp-card' });
  card.appendChild(el('h2', {}, 'Choose a role'));

  const choice = el('div', { class: 'mp-choice' });

  const hostBtn = el('button', { class: 'mp-btn' }, 'Host (create offer)');
  hostBtn.addEventListener('click', startHost);
  choice.appendChild(hostBtn);

  const guestBtn = el('button', { class: 'mp-btn secondary' }, 'Guest (paste offer)');
  guestBtn.addEventListener('click', startGuest);
  choice.appendChild(guestBtn);

  card.appendChild(choice);
  card.appendChild(el('p', {},
    'Host creates a code blob. Send it to the guest. Guest replies with an answer blob. Paste it back. Connection opens.'));

  const status = statusEl();
  if (status) card.appendChild(status);

  card.appendChild(logBoxEl());
  return card;
}

// ---------- Host screen ----------

function renderHost() {
  const wrap = el('div', {});

  // Step 1: offer
  const s1 = stepCard(1, 'Send this to the guest', app.hostStep >= 1);
  s1.body.appendChild(el('div', { class: 'mp-step-body' },
    'Copy this text and send it to your guest (any messaging app works).'));
  const offerTa = mkTextarea(app.localBlob, true);
  s1.body.appendChild(offerTa);
  const offerBtnRow = el('div', { class: 'mp-choice' });
  const copyOfferBtn = el('button', { class: 'mp-btn secondary' }, 'Copy Offer');
  copyOfferBtn.addEventListener('click', async () => {
    const ok = await copyText(app.localBlob);
    logLine(ok ? 'Offer copied.' : 'Copy failed — select and copy manually.', ok ? 'ok' : 'err');
    render();
  });
  offerBtnRow.appendChild(copyOfferBtn);
  s1.body.appendChild(offerBtnRow);
  wrap.appendChild(s1.el);

  // Step 2: answer
  const s2 = stepCard(2, 'Paste the guest\'s reply', app.hostStep >= 1);
  s2.body.appendChild(el('div', { class: 'mp-step-body' },
    'Paste the answer text your guest sent back, then click Accept.'));
  const answerTa = mkTextarea('', false);
  answerTa.addEventListener('input', () => { app.pastedBlob = answerTa.value; });
  s2.body.appendChild(answerTa);
  const pasteAcceptRow = el('div', { class: 'mp-choice' });
  const pasteBtn = el('button', { class: 'mp-btn secondary' }, 'Paste');
  pasteBtn.addEventListener('click', async () => {
    await pasteIntoTextarea(answerTa);
    app.pastedBlob = answerTa.value;
  });
  pasteAcceptRow.appendChild(pasteBtn);
  const acceptBtn = el('button', { class: 'mp-btn' }, 'Accept Answer');
  acceptBtn.addEventListener('click', hostAcceptAnswer);
  pasteAcceptRow.appendChild(acceptBtn);
  s2.body.appendChild(pasteAcceptRow);
  wrap.appendChild(s2.el);

  if (app.status) {
    const s = statusEl();
    wrap.appendChild(s);
  }
  wrap.appendChild(logBoxEl());

  const card = el('div', { class: 'mp-card' });
  card.appendChild(wrap);
  return card;
}

// ---------- Guest screen ----------

function renderGuest() {
  const wrap = el('div', {});

  const s1 = stepCard(1, 'Paste the host\'s offer', app.guestStep >= 1);
  s1.body.appendChild(el('div', { class: 'mp-step-body' },
    'Paste the offer text the host sent you, then click Generate Reply.'));
  const offerTa = mkTextarea(app.pastedBlob, false);
  offerTa.addEventListener('input', () => { app.pastedBlob = offerTa.value; });
  s1.body.appendChild(offerTa);
  const pasteGenRow = el('div', { class: 'mp-choice' });
  const pasteBtn = el('button', { class: 'mp-btn secondary' }, 'Paste');
  pasteBtn.addEventListener('click', async () => {
    await pasteIntoTextarea(offerTa);
    app.pastedBlob = offerTa.value;
  });
  pasteGenRow.appendChild(pasteBtn);
  const genBtn = el('button', { class: 'mp-btn' }, 'Generate Reply');
  genBtn.addEventListener('click', guestAcceptOffer);
  pasteGenRow.appendChild(genBtn);
  s1.body.appendChild(pasteGenRow);
  wrap.appendChild(s1.el);

  // Step 2: show answer
  if (app.guestStep === 2 && app.localBlob) {
    const s2 = stepCard(2, 'Send this back to the host', true);
    s2.body.appendChild(el('div', { class: 'mp-step-body' },
      'Copy this text and send it back to the host. They\'ll paste it and the connection will open.'));
    const answerTa = mkTextarea(app.localBlob, true);
    s2.body.appendChild(answerTa);
    const copyBtn = el('button', { class: 'mp-btn secondary' }, 'Copy Reply');
    copyBtn.style.width = '100%';
    copyBtn.addEventListener('click', async () => {
      const ok = await copyText(app.localBlob);
      logLine(ok ? 'Reply copied.' : 'Copy failed.', ok ? 'ok' : 'err');
      render();
    });
    s2.body.appendChild(copyBtn);
    wrap.appendChild(s2.el);
  }

  if (app.status) {
    const s = statusEl();
    wrap.appendChild(s);
  }
  wrap.appendChild(logBoxEl());

  const card = el('div', { class: 'mp-card' });
  card.appendChild(wrap);
  return card;
}

function stepCard(num, title, active) {
  const outer = el('div', { class: 'mp-step' + (active ? ' active' : '') });
  const header = el('div', { class: 'mp-step-title' });
  header.appendChild(el('span', {}, ''));
  const numEl = el('span', { class: 'mp-step-num' }, String(num));
  header.firstChild.appendChild(numEl);
  header.firstChild.appendChild(document.createTextNode(title));
  outer.appendChild(header);
  const body = el('div', {});
  outer.appendChild(body);
  return { el: outer, body };
}

function mkTextarea(value, readonly) {
  const ta = document.createElement('textarea');
  ta.className = 'mp-textarea';
  ta.value = value;
  ta.readOnly = !!readonly;
  ta.spellcheck = false;
  ta.autocapitalize = 'off';
  ta.autocorrect = 'off';
  ta.addEventListener('focus', () => { setTimeout(() => ta.select(), 10); });
  return ta;
}

// ---------- Game screen ----------

function renderGame() {
  const wrap = el('div', { class: 'mp-game' });

  const head = el('div', { class: 'mp-game-head' });
  head.appendChild(el('div', {
    class: 'mp-badge ' + (app.role === 'host' ? 'host' : 'joiner'),
  }, app.role === 'host' ? 'HOST' : 'GUEST'));
  const resetBtn = el('button', { class: 'mp-btn secondary' }, 'Reset');
  resetBtn.style.cssText = 'padding:8px 14px;font-size:13px;width:auto;margin:0;';
  resetBtn.addEventListener('click', () => doReset(true));
  head.appendChild(resetBtn);
  wrap.appendChild(head);

  const enemy = el('div', { class: 'mp-enemy' });
  enemy.appendChild(el('div', { class: 'mp-enemy-name' }, 'Training Dummy'));
  const bar = el('div', { class: 'mp-hp-bar' });
  const fill = el('div', { class: 'mp-hp-fill' });
  fill.style.width = Math.max(0, (app.enemyHp / app.enemyMaxHp) * 100) + '%';
  bar.appendChild(fill);
  bar.appendChild(el('div', { class: 'mp-hp-text' }, `${app.enemyHp} / ${app.enemyMaxHp}`));
  enemy.appendChild(bar);
  wrap.appendChild(enemy);

  const stats = el('div', { class: 'mp-stats' });
  stats.appendChild(statBlock('Turn', app.turn, ''));
  stats.appendChild(statBlock('Phase', app.phase === 'players' ? 'Players' : 'Enemy',
                              app.phase === 'players' ? 'green' : 'gold'));
  stats.appendChild(statBlock('Energy', `${app.energy} / ${app.maxEnergy}`, ''));
  stats.appendChild(statBlock('Ended By', `${app.endedBy.size} / 2`, ''));
  wrap.appendChild(stats);

  const controls = el('div', { class: 'mp-controls' });
  const attackBtn = el('button', { class: 'mp-btn' }, 'Attack  (-1 Energy)');
  attackBtn.disabled = !app.dc || app.dc.readyState !== 'open' || app.phase !== 'players' || app.energy < 1;
  attackBtn.addEventListener('click', doAttack);
  controls.appendChild(attackBtn);
  const endBtn = el('button', { class: 'mp-btn' }, 'End Turn');
  endBtn.disabled = !app.dc || app.dc.readyState !== 'open' || app.phase !== 'players' || app.endedBy.has(app.myId);
  endBtn.addEventListener('click', doEndTurn);
  controls.appendChild(endBtn);
  wrap.appendChild(controls);

  if (app.phase === 'enemy') {
    wrap.appendChild(el('div', { class: 'mp-waiting' }, 'Enemy turn…'));
  } else if (app.endedBy.has(app.myId) && app.endedBy.size < 2) {
    wrap.appendChild(el('div', { class: 'mp-waiting' }, 'Waiting for the other player…'));
  }

  wrap.appendChild(logBoxEl());

  const card = el('div', { class: 'mp-card' });
  card.appendChild(wrap);
  return card;
}

function statBlock(label, value, kindCls) {
  const wrap = el('div', { class: 'mp-stat' });
  wrap.appendChild(el('div', { class: 'mp-stat-label' }, label));
  wrap.appendChild(el('div', {
    class: 'mp-stat-value' + (kindCls ? ' ' + kindCls : ''),
  }, String(value)));
  return wrap;
}

render();
