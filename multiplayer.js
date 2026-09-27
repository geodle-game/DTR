// ============================================================
// multiplayer.js — standalone multiplayer test
// TURN-enabled for reliable cross-device connections.
// ============================================================

const ROOM_PREFIX = 'dtr-mp-test-v1-';
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_LEN = 6;

// Public free TURN servers. Guarantees a relay fallback when
// direct P2P (STUN) fails — which is nearly always the case when
// one peer is on cellular / behind CGNAT.
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject', credential: 'openrelayproject' },
];

const app = {
  screen: 'lobby',
  role: null,
  status: '',
  statusKind: '',
  peer: null,
  conn: null,
  connected: false,
  roomCode: '',
  enemyHp: 100,
  enemyMaxHp: 100,
  energy: 3,
  maxEnergy: 3,
  turn: 1,
  phase: 'players',
  endedBy: new Set(),
  log: [],
  logPulseUntil: 0,
};

function myId() { return app.role === 'host' ? 'host' : 'joiner'; }

function generateRoomCode() {
  let s = '';
  for (let i = 0; i < ROOM_LEN; i++) s += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  return s;
}
function peerIdForCode(code) { return ROOM_PREFIX + code; }
function normalizeCode(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, ROOM_LEN);
}

function logLine(text, kind = '') {
  app.log.push({ text, kind, at: performance.now() });
  if (app.log.length > 60) app.log.shift();
  app.logPulseUntil = performance.now() + 600;
  console.log('[mp]', text);
  renderLogOnly();
}

function setStatus(text, kind = '') {
  app.status = text;
  app.statusKind = kind;
}

function makePeer(idOrOptions) {
  const opts = {
    debug: 0,
    config: { iceServers: ICE_SERVERS },
  };
  return idOrOptions ? new Peer(idOrOptions, opts) : new Peer(opts);
}

// ============================================================
// HOST
// ============================================================

function hostGame() {
  if (typeof Peer === 'undefined') {
    setStatus('PeerJS failed to load. Check connection / adblock.', 'error');
    logLine('✗ typeof Peer === "undefined"', 'host');
    render();
    return;
  }

  app.role = 'host';
  app.roomCode = generateRoomCode();
  const peerId = peerIdForCode(app.roomCode);
  logLine(`Creating peer with ID: ${peerId}`, 'host');
  setStatus(`Connecting to PeerJS cloud…`);
  render();

  try {
    app.peer = makePeer(peerId);
  } catch (e) {
    logLine('✗ new Peer() threw: ' + e.message, 'host');
    setStatus('Could not create peer: ' + e.message, 'error');
    render();
    return;
  }

  app.peer.on('open', (id) => {
    logLine(`✓ Peer open: ${id}`, 'host');
    app.screen = 'waiting';
    setStatus('Waiting for a player to join…', 'ok');
    render();
  });

  app.peer.on('connection', (conn) => {
    logLine(`↪ Incoming connection from ${conn.peer}`, 'host');
    if (app.conn) {
      logLine('Already have a connection — rejecting.', 'host');
      try { conn.close(); } catch {}
      return;
    }
    app.conn = conn;
    wireHostConnection(conn);
  });

  app.peer.on('disconnected', () => {
    logLine('⚠ Signaling server disconnected. Reconnecting…', 'host');
    try { app.peer.reconnect(); } catch {}
  });

  app.peer.on('error', (err) => {
    const t = err?.type || 'error';
    logLine(`✗ Peer error: ${t} — ${err?.message || ''}`, 'host');
    const msg = t === 'unavailable-id'
      ? 'Room code collision. Refresh and try again.'
      : t === 'network'
        ? 'Cannot reach PeerJS cloud. Check your internet.'
        : t === 'server-error'
          ? 'PeerJS cloud is having issues. Wait a minute and retry.'
          : `Peer error: ${t}`;
    setStatus(msg, 'error');
    render();
  });
}

function wireHostConnection(conn) {
  conn.on('open', () => {
    logLine('✓ Data channel open.', 'host');
    app.connected = true;
    app.screen = 'game';
    setStatus('Opponent connected!', 'ok');
    send({ type: 'HELLO', role: 'host', snapshot: snapshotGame() });
    render();
  });

  conn.on('data', (msg) => handleMessage(msg));

  conn.on('close', () => {
    logLine('Connection closed.', 'host');
    app.connected = false;
    setStatus('Opponent disconnected.', 'error');
    render();
  });

  conn.on('error', (err) => {
    logLine(`Connection error: ${err?.message || err}`, 'host');
    render();
  });
}

// ============================================================
// JOINER
// ============================================================

function joinGame(rawCode) {
  const code = normalizeCode(rawCode);
  if (code.length !== ROOM_LEN) {
    setStatus('Room code must be 6 characters.', 'error');
    render();
    return;
  }
  if (typeof Peer === 'undefined') {
    setStatus('PeerJS failed to load.', 'error');
    render();
    return;
  }

  app.role = 'joiner';
  app.roomCode = code;
  setStatus('Connecting to PeerJS cloud…');
  logLine('Creating anonymous peer…', 'joiner');
  render();

  try {
    app.peer = makePeer(null);
  } catch (e) {
    logLine('✗ new Peer() threw: ' + e.message, 'joiner');
    setStatus('Could not create peer: ' + e.message, 'error');
    render();
    return;
  }

  app.peer.on('open', (id) => {
    logLine(`✓ My peer ID: ${id}`, 'joiner');
    const target = peerIdForCode(code);
    logLine(`Dialing host: ${target}`, 'joiner');
    setStatus(`Connecting to ${code}…`);
    render();

    const conn = app.peer.connect(target, { reliable: true });
    app.conn = conn;
    wireJoinerConnection(conn);
  });

  app.peer.on('error', (err) => {
    const t = err?.type || 'error';
    logLine(`✗ Peer error: ${t} — ${err?.message || ''}`, 'joiner');
    const msg = t === 'peer-unavailable'
      ? `No room found with code ${code}. Is the host still on the page?`
      : t === 'network'
        ? 'Cannot reach PeerJS cloud. Check your internet.'
        : t === 'server-error'
          ? 'PeerJS cloud is having issues. Wait and retry.'
          : `Peer error: ${t}`;
    setStatus(msg, 'error');
    render();
  });
}

function wireJoinerConnection(conn) {
  conn.on('open', () => {
    logLine('✓ Data channel open.', 'joiner');
    app.connected = true;
    app.screen = 'game';
    setStatus('Connected to host!', 'ok');
    render();
  });

  conn.on('data', (msg) => handleMessage(msg));

  conn.on('close', () => {
    logLine('Host disconnected.', 'joiner');
    app.connected = false;
    setStatus('Host disconnected.', 'error');
    render();
  });

  conn.on('error', (err) => {
    logLine(`Connection error: ${err?.message || err}`, 'joiner');
    render();
  });
}

// ============================================================
// Messaging
// ============================================================

function send(msg) {
  if (!app.conn || !app.conn.open) return;
  try { app.conn.send(msg); }
  catch (e) { logLine('Send failed: ' + e.message, myId()); }
}

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

function handleMessage(msg) {
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'HELLO') {
    if (app.role === 'joiner' && msg.snapshot) {
      applySnapshot(msg.snapshot);
      logLine(`Joined room. Turn ${app.turn}.`, 'joiner');
    }
    render();
    return;
  }
  if (msg.type === 'ACTION') { applyRemoteAction(msg.action, msg.senderId); render(); return; }
  if (msg.type === 'RESET')  { resetGame(false); logLine('Opponent reset.', app.role); render(); return; }
}

// ============================================================
// Game actions
// ============================================================

function applyRemoteAction(action, senderId) {
  switch (action.type) {
    case 'ATTACK': {
      const dmg = action.amount ?? 10;
      app.enemyHp = Math.max(0, app.enemyHp - dmg);
      logLine(`${labelFor(senderId)} attacked for ${dmg}.`, senderId);
      break;
    }
    case 'END_TURN': handleEndTurn(senderId); break;
  }
}
function labelFor(id) { return id === 'host' ? 'Host' : id === 'joiner' ? 'Joiner' : '???'; }

function doAttack() {
  if (!app.connected || app.phase !== 'players') return;
  if (app.energy < 1) { logLine('Not enough energy.', myId()); render(); return; }
  const action = { type: 'ATTACK', amount: 10 };
  applyRemoteAction(action, myId());
  send({ type: 'ACTION', action, senderId: myId() });
  render();
}

function doEndTurn() {
  if (!app.connected || app.phase !== 'players') return;
  if (app.endedBy.has(myId())) return;
  const action = { type: 'END_TURN' };
  handleEndTurn(myId());
  send({ type: 'ACTION', action, senderId: myId() });
  render();
}

function handleEndTurn(senderId) {
  if (app.phase !== 'players') return;
  if (app.endedBy.has(senderId)) return;
  app.endedBy.add(senderId);
  logLine(`${labelFor(senderId)} ended their turn.`, senderId);
  if (app.endedBy.size >= 2) startEnemyPhase();
}

function startEnemyPhase() {
  app.phase = 'enemy';
  app.endedBy.clear();
  logLine(`Turn ${app.turn} — enemy phase.`, 'host');
  render();
  setTimeout(() => {
    if (app.phase !== 'enemy') return;
    app.turn += 1;
    app.energy = app.maxEnergy;
    app.phase = 'players';
    logLine(`Turn ${app.turn} — players.`, 'host');
    render();
  }, 1000);
}

function doReset(broadcast = true) { resetGame(broadcast); render(); }
function resetGame(broadcast) {
  app.enemyHp = 100; app.enemyMaxHp = 100;
  app.energy = 3; app.maxEnergy = 3;
  app.turn = 1; app.phase = 'players';
  app.endedBy.clear();
  app.log = [];
  logLine('Test reset.', myId());
  if (broadcast && app.connected) send({ type: 'RESET' });
}

function copyRoomCode() {
  try { navigator.clipboard.writeText(app.roomCode); logLine('Room code copied.', myId()); }
  catch { logLine('Copy failed — long-press the code to select.', myId()); }
  render();
}

// ============================================================
// Rendering
// ============================================================

const root = document.getElementById('mp-root');

function render() {
  root.innerHTML = '';
  const frame = document.createElement('div');
  frame.className = 'mp-frame';
  frame.appendChild(el('h1', { class: 'mp-title' }, 'DRAWN TO RUIN'));
  frame.appendChild(el('p', { class: 'mp-subtitle' }, 'multiplayer test'));
  if (app.screen === 'lobby')        frame.appendChild(renderLobby());
  else if (app.screen === 'waiting') frame.appendChild(renderWaiting());
  else                               frame.appendChild(renderGame());
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

function renderLobby() {
  const card = el('div', { class: 'mp-card' });
  const row = el('div', { class: 'mp-row' });

  const hostCol = el('div', { class: 'mp-col' });
  hostCol.appendChild(el('h2', {}, 'Host'));
  hostCol.appendChild(el('p', {}, 'Create a room. Share the code with your opponent.'));
  const hostBtn = el('button', { class: 'mp-btn' }, 'Host Game');
  hostBtn.addEventListener('click', hostGame);
  hostCol.appendChild(hostBtn);
  row.appendChild(hostCol);

  const joinCol = el('div', { class: 'mp-col' });
  joinCol.appendChild(el('h2', {}, 'Join'));
  joinCol.appendChild(el('p', {}, 'Enter the room code.'));

  const input = document.createElement('input');
  input.className = 'mp-input';
  input.type = 'text';
  input.placeholder = 'ABC123';
  input.maxLength = ROOM_LEN;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.autocapitalize = 'characters';
  input.value = app.roomCode || '';
  input.addEventListener('input', () => { input.value = normalizeCode(input.value); app.roomCode = input.value; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinGame(input.value); });
  joinCol.appendChild(input);

  const joinBtn = el('button', { class: 'mp-btn' }, 'Join Game');
  joinBtn.addEventListener('click', () => joinGame(input.value));
  joinCol.appendChild(joinBtn);
  row.appendChild(joinCol);

  card.appendChild(row);

  const status = statusEl();
  if (status) card.appendChild(status);

  const logBox = el('div', { class: 'mp-log' });
  for (const entry of app.log) {
    logBox.appendChild(el('div', { class: 'mp-log-line' + (entry.kind ? ' ' + entry.kind : '') }, entry.text));
  }
  if (app.log.length === 0) logBox.appendChild(el('div', { class: 'mp-log-line' }, 'Diagnostics will appear here.'));
  card.appendChild(logBox);

  return card;
}

function renderWaiting() {
  const card = el('div', { class: 'mp-card' });
  card.appendChild(el('h2', {
    style: { textAlign: 'center', color: '#c9a3ff', margin: '0 0 12px',
             fontSize: '13px', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: '600' },
  }, 'Room Code'));

  const codeRow = el('div', { class: 'mp-code' });
  codeRow.appendChild(el('span', {}, app.roomCode));
  card.appendChild(codeRow);

  const copyBtn = el('button', { class: 'mp-btn secondary' }, 'Copy Code');
  copyBtn.style.width = '100%';
  copyBtn.style.marginTop = '12px';
  copyBtn.addEventListener('click', copyRoomCode);
  card.appendChild(copyBtn);

  card.appendChild(el('div', { class: 'mp-waiting', style: { marginTop: '12px' } },
    'Waiting for a player to join…'));

  const cancel = el('button', { class: 'mp-btn secondary' }, 'Cancel');
  cancel.style.marginTop = '12px';
  cancel.style.width = '100%';
  cancel.addEventListener('click', () => location.reload());
  card.appendChild(cancel);

  const status = statusEl();
  if (status) card.appendChild(status);

  const logBox = el('div', { class: 'mp-log', style: { marginTop: '12px' } });
  for (const entry of app.log) {
    logBox.appendChild(el('div', { class: 'mp-log-line' + (entry.kind ? ' ' + entry.kind : '') }, entry.text));
  }
  card.appendChild(logBox);

  return card;
}

function renderGame() {
  const wrap = el('div', { class: 'mp-game' });

  const head = el('div', { class: 'mp-game-head' });
  const badge = el('div', {
    class: 'mp-badge ' + (app.connected ? (app.role === 'host' ? 'host' : 'joiner') : 'disconnected'),
  }, app.connected ? (app.role === 'host' ? 'HOST' : 'JOINER') : 'DISCONNECTED');
  head.appendChild(badge);
  head.appendChild(el('div', {
    style: { fontFamily: 'monospace', letterSpacing: '.2em', color: '#8b93a1', fontSize: '12px' },
  }, `Room ${app.roomCode}`));
  const resetBtn = el('button', { class: 'mp-btn secondary' }, 'Reset');
  resetBtn.style.padding = '8px 14px';
  resetBtn.style.fontSize = '13px';
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
  attackBtn.disabled = !app.connected || app.phase !== 'players' || app.energy < 1;
  attackBtn.addEventListener('click', doAttack);
  controls.appendChild(attackBtn);
  const endBtn = el('button', { class: 'mp-btn' }, 'End Turn');
  endBtn.disabled = !app.connected || app.phase !== 'players' || app.endedBy.has(myId());
  endBtn.addEventListener('click', doEndTurn);
  controls.appendChild(endBtn);
  wrap.appendChild(controls);

  if (app.phase === 'enemy') {
    wrap.appendChild(el('div', { class: 'mp-waiting' }, 'Enemy turn…'));
  } else if (app.endedBy.has(myId()) && app.endedBy.size < 2) {
    wrap.appendChild(el('div', { class: 'mp-waiting' }, 'Waiting for the other player…'));
  }

  const logBox = el('div', { class: 'mp-log' });
  for (const entry of app.log) {
    logBox.appendChild(el('div', { class: 'mp-log-line' + (entry.kind ? ' ' + entry.kind : '') }, entry.text));
  }
  wrap.appendChild(logBox);

  return wrap;
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
