// ============================================================
// multiplayer.js — standalone multiplayer proof-of-concept
//
// Open multiplayer.html in two tabs / browsers:
//   Tab 1 → Host Game → note the room code
//   Tab 2 → Join Game → enter the code
//
// Both clients see a shared enemy. Shared HP, shared energy,
// shared turn gating. Actions are broadcast peer-to-peer via
// PeerJS. This is the smallest possible demo that proves the
// networking layer works before wiring it into the real game.
//
// Sequencing model (for now): apply locally, broadcast, other
// side applies on receipt. Order-of-arrival on each client can
// differ by tens of ms but arithmetic actions are commutative
// so state converges. Real game will use host-authoritative
// sequence stamping (see systems/net.js plan).
// ============================================================

const ROOM_PREFIX = 'dtr-mp-test-v1-';
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_LEN = 6;

// ------------------------------------------------------------
// State
// ------------------------------------------------------------

const app = {
  screen: 'lobby',        // 'lobby' | 'waiting' | 'game'
  role: null,             // 'host' | 'joiner' | null
  status: '',             // status message
  statusKind: '',         // '' | 'ok' | 'error'

  peer: null,
  conn: null,
  connected: false,

  roomCode: '',

  // ---- Game state ----
  enemyHp: 100,
  enemyMaxHp: 100,
  energy: 3,
  maxEnergy: 3,
  turn: 1,
  phase: 'players',       // 'players' | 'enemy'
  endedBy: new Set(),     // senderIds who have pressed End Turn
  log: [],

  // Render a "recent" pulse on the last few log lines
  logPulseUntil: 0,
};

// Who am I? Set on host/join. Used for log colors and End Turn gating.
function myId() {
  return app.role === 'host' ? 'host' : 'joiner';
}

// ------------------------------------------------------------
// Room codes
// ------------------------------------------------------------

function generateRoomCode() {
  let s = '';
  for (let i = 0; i < ROOM_LEN; i++) {
    s += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  }
  return s;
}

function peerIdForCode(code) {
  return ROOM_PREFIX + code;
}

function normalizeCode(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, '')
    .slice(0, ROOM_LEN);
}

// ------------------------------------------------------------
// Logging
// ------------------------------------------------------------

function logLine(text, kind = '') {
  app.log.push({ text, kind, at: performance.now() });
  if (app.log.length > 40) app.log.shift();
  app.logPulseUntil = performance.now() + 600;
}

// ------------------------------------------------------------
// Networking — Host
// ------------------------------------------------------------

function hostGame() {
  if (typeof Peer === 'undefined') {
    setStatus('PeerJS failed to load. Check your internet connection.', 'error');
    render();
    return;
  }

  app.role = 'host';
  app.roomCode = generateRoomCode();
  setStatus(`Creating room ${app.roomCode}…`);
  render();

  try {
    app.peer = new Peer(peerIdForCode(app.roomCode));
  } catch (e) {
    setStatus('Could not create peer: ' + e.message, 'error');
    render();
    return;
  }

  app.peer.on('open', () => {
    logLine(`Room ${app.roomCode} created. Waiting for a player…`, 'host');
    app.screen = 'waiting';
    setStatus('Waiting for a player to join…', 'ok');
    render();
  });

  app.peer.on('connection', (conn) => {
    if (app.conn) {
      // Only allow one opponent.
      try { conn.close(); } catch {}
      return;
    }
    app.conn = conn;
    wireHostConnection(conn);
  });

  app.peer.on('error', (err) => {
    const msg = err?.type === 'unavailable-id'
      ? 'That room code was taken. Try again.'
      : `Peer error: ${err?.type || err?.message || err}`;
    setStatus(msg, 'error');
    logLine(msg, 'host');
    render();
  });
}

function wireHostConnection(conn) {
  conn.on('open', () => {
    app.connected = true;
    app.screen = 'game';
    setStatus('Opponent connected!', 'ok');
    logLine('Opponent connected.', 'host');

    // Send the initial state so both clients start identically.
    send({ type: 'HELLO', role: 'host', snapshot: snapshotGame() });

    render();
  });

  conn.on('data', (msg) => {
    handleMessage(msg);
  });

  conn.on('close', () => {
    app.connected = false;
    logLine('Opponent disconnected.', 'host');
    setStatus('Opponent disconnected.', 'error');
    render();
  });

  conn.on('error', (err) => {
    logLine('Connection error: ' + (err?.message || err), 'host');
    render();
  });
}

// ------------------------------------------------------------
// Networking — Joiner
// ------------------------------------------------------------

function joinGame(rawCode) {
  const code = normalizeCode(rawCode);
  if (code.length !== ROOM_LEN) {
    setStatus('Room code must be 6 characters.', 'error');
    render();
    return;
  }

  if (typeof Peer === 'undefined') {
    setStatus('PeerJS failed to load. Check your internet connection.', 'error');
    render();
    return;
  }

  app.role = 'joiner';
  app.roomCode = code;
  setStatus(`Connecting to ${code}…`);
  render();

  try {
    app.peer = new Peer();
  } catch (e) {
    setStatus('Could not create peer: ' + e.message, 'error');
    render();
    return;
  }

  app.peer.on('open', () => {
    const conn = app.peer.connect(peerIdForCode(code), {
      reliable: true,
      serialization: 'json',
    });
    app.conn = conn;
    wireJoinerConnection(conn);
  });

  app.peer.on('error', (err) => {
    const msg = err?.type === 'peer-unavailable'
      ? `No room found with code ${code}.`
      : `Peer error: ${err?.type || err?.message || err}`;
    setStatus(msg, 'error');
    logLine(msg, 'joiner');
    render();
  });
}

function wireJoinerConnection(conn) {
  conn.on('open', () => {
    app.connected = true;
    app.screen = 'game';
    setStatus('Connected to host!', 'ok');
    logLine('Connected to host.', 'joiner');
    render();
  });

  conn.on('data', (msg) => {
    handleMessage(msg);
  });

  conn.on('close', () => {
    app.connected = false;
    logLine('Host disconnected.', 'joiner');
    setStatus('Host disconnected.', 'error');
    render();
  });

  conn.on('error', (err) => {
    logLine('Connection error: ' + (err?.message || err), 'joiner');
    render();
  });
}

// ------------------------------------------------------------
// Message handling
// ------------------------------------------------------------

function send(msg) {
  if (!app.conn || !app.conn.open) return;
  try {
    app.conn.send(msg);
  } catch (e) {
    logLine('Send failed: ' + e.message, myId());
  }
}

function snapshotGame() {
  return {
    enemyHp: app.enemyHp,
    enemyMaxHp: app.enemyMaxHp,
    energy: app.energy,
    maxEnergy: app.maxEnergy,
    turn: app.turn,
    phase: app.phase,
  };
}

function applySnapshot(s) {
  app.enemyHp = s.enemyHp;
  app.enemyMaxHp = s.enemyMaxHp;
  app.energy = s.energy;
  app.maxEnergy = s.maxEnergy;
  app.turn = s.turn;
  app.phase = s.phase;
}

function handleMessage(msg) {
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'HELLO') {
    // Joiner receives this from host. Adopt the snapshot.
    if (app.role === 'joiner' && msg.snapshot) {
      applySnapshot(msg.snapshot);
      logLine(`Joined room. Turn ${app.turn}, enemy at ${app.enemyHp}/${app.enemyMaxHp}.`, 'joiner');
    }
    render();
    return;
  }

  if (msg.type === 'ACTION') {
    applyRemoteAction(msg.action, msg.senderId);
    render();
    return;
  }

  if (msg.type === 'RESET') {
    resetGame(false);
    logLine('Opponent reset the test.', app.role);
    render();
    return;
  }
}

// ------------------------------------------------------------
// Actions
// ------------------------------------------------------------

function applyRemoteAction(action, senderId) {
  switch (action.type) {
    case 'ATTACK': {
      const dmg = action.amount ?? 10;
      app.enemyHp = Math.max(0, app.enemyHp - dmg);
      logLine(`${labelFor(senderId)} attacked for ${dmg}.`, senderId);
      break;
    }
    case 'END_TURN': {
      handleEndTurn(senderId);
      break;
    }
    case 'ENEMY_PHASE_COMPLETE': {
      // No-op for now — each client runs its own enemy phase timer.
      break;
    }
  }
}

function labelFor(id) {
  return id === 'host' ? 'Host' : id === 'joiner' ? 'Joiner' : '???';
}

function doAttack() {
  if (!app.connected) return;
  if (app.phase !== 'players') return;
  if (app.energy < 1) {
    logLine('Not enough energy.', myId());
    render();
    return;
  }

  // Apply locally + broadcast. Same order on both sides.
  const action = { type: 'ATTACK', amount: 10 };
  applyRemoteAction(action, myId());
  send({ type: 'ACTION', action, senderId: myId() });
  render();
}

function doEndTurn() {
  if (!app.connected) return;
  if (app.phase !== 'players') return;

  // If we've already ended this turn, no-op.
  if (app.endedBy.has(myId())) return;

  // Apply locally + broadcast.
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

  // If both players have ended, advance.
  if (app.endedBy.size >= 2) {
    startEnemyPhase();
  }
}

function startEnemyPhase() {
  app.phase = 'enemy';
  app.endedBy.clear();
  logLine(`Turn ${app.turn} — enemy phase.`, 'host');
  render();

  // Fake a 1s enemy turn so it's visible. In the real game this
  // would be resolveEnemyTurn().
  setTimeout(() => {
    if (app.phase !== 'enemy') return;
    app.turn += 1;
    app.energy = app.maxEnergy;
    app.phase = 'players';
    logLine(`Turn ${app.turn} — players.`, 'host');
    render();
  }, 1000);
}

function doReset(broadcast = true) {
  resetGame(broadcast);
  render();
}

function resetGame(broadcast) {
  app.enemyHp = 100;
  app.enemyMaxHp = 100;
  app.energy = 3;
  app.maxEnergy = 3;
  app.turn = 1;
  app.phase = 'players';
  app.endedBy.clear();
  app.log = [];
  logLine('Test reset.', myId());
  if (broadcast && app.connected) {
    send({ type: 'RESET' });
  }
}

function copyRoomCode() {
  try {
    navigator.clipboard.writeText(app.roomCode);
    logLine('Room code copied to clipboard.', myId());
  } catch {
    logLine('Could not copy — long-press to select.', myId());
  }
  render();
}

function setStatus(text, kind = '') {
  app.status = text;
  app.statusKind = kind;
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
  frame.appendChild(el('p', { class: 'mp-subtitle' }, 'multiplayer test page'));

  if (app.screen === 'lobby')       frame.appendChild(renderLobby());
  else if (app.screen === 'waiting') frame.appendChild(renderWaiting());
  else                               frame.appendChild(renderGame());

  root.appendChild(frame);
}

function el(tag, attrs = {}, textOrChildren) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'style') Object.assign(node.style, v);
    else node.setAttribute(k, v);
  }
  if (typeof textOrChildren === 'string') node.textContent = textOrChildren;
  else if (Array.isArray(textOrChildren)) {
    for (const c of textOrChildren) if (c) node.appendChild(c);
  } else if (textOrChildren instanceof Node) {
    node.appendChild(textOrChildren);
  }
  return node;
}

function statusEl() {
  if (!app.status) return null;
  const cls = 'mp-status' + (app.statusKind ? ' ' + app.statusKind : '');
  return el('div', { class: cls }, app.status);
}

// ---------- Lobby ----------

function renderLobby() {
  const card = el('div', { class: 'mp-card' });
  const row = el('div', { class: 'mp-row' });

  // ---- Host column ----
  const hostCol = el('div', { class: 'mp-col' });
  hostCol.appendChild(el('h2', {}, 'Host'));
  hostCol.appendChild(el('p', {},
    'Create a room and share the 6-character code with your opponent.'));
  const hostBtn = el('button', { class: 'mp-btn' }, 'Host Game');
  hostBtn.addEventListener('click', hostGame);
  hostCol.appendChild(hostBtn);
  row.appendChild(hostCol);

  // ---- Join column ----
  const joinCol = el('div', { class: 'mp-col' });
  joinCol.appendChild(el('h2', {}, 'Join'));
  joinCol.appendChild(el('p', {},
    'Enter the room code your opponent gave you.'));

  const input = document.createElement('input');
  input.className = 'mp-input';
  input.type = 'text';
  input.placeholder = 'ABC123';
  input.maxLength = ROOM_LEN;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.value = app.roomCode || '';
  input.addEventListener('input', () => {
    input.value = normalizeCode(input.value);
    app.roomCode = input.value;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinGame(input.value);
  });
  joinCol.appendChild(input);

  const joinBtn = el('button', { class: 'mp-btn' }, 'Join Game');
  joinBtn.addEventListener('click', () => joinGame(input.value));
  joinCol.appendChild(joinBtn);

  row.appendChild(joinCol);
  card.appendChild(row);

  const status = statusEl();
  if (status) card.appendChild(status);

  return card;
}

// ---------- Waiting (host-only) ----------

function renderWaiting() {
  const card = el('div', { class: 'mp-card' });

  card.appendChild(el('h2', {
    style: { textAlign: 'center', color: '#c9a3ff', margin: '0 0 12px',
             fontSize: '14px', letterSpacing: '.12em', textTransform: 'uppercase',
             fontWeight: '600' },
  }, 'Room Code'));

  const codeRow = el('div', { class: 'mp-code' });
  codeRow.appendChild(el('span', {}, app.roomCode));
  const copyBtn = el('button', { class: 'mp-code-copy' }, 'Copy');
  copyBtn.addEventListener('click', copyRoomCode);
  codeRow.appendChild(copyBtn);
  card.appendChild(codeRow);

  card.appendChild(el('div', { class: 'mp-waiting' },
    'Waiting for a player to join…'));

  const cancel = el('button', { class: 'mp-btn secondary' }, 'Cancel');
  cancel.style.marginTop = '12px';
  cancel.style.width = '100%';
  cancel.addEventListener('click', () => location.reload());
  card.appendChild(cancel);

  const status = statusEl();
  if (status) {
    status.style.marginTop = '12px';
    card.appendChild(status);
  }

  return card;
}

// ---------- Game ----------

function renderGame() {
  const wrap = el('div', { class: 'mp-game' });

  // ---- Head: who am I / room / reset ----
  const head = el('div', { class: 'mp-game-head' });

  const badge = el('div', {
    class: 'mp-badge ' + (app.connected
      ? (app.role === 'host' ? 'host' : 'joiner')
      : 'disconnected'),
  }, app.connected
    ? (app.role === 'host' ? 'You are HOST' : 'You are JOINER')
    : 'DISCONNECTED');
  head.appendChild(badge);

  head.appendChild(el('div', {
    style: { fontFamily: 'monospace', letterSpacing: '.2em',
             color: '#8b93a1', fontSize: '13px' },
  }, `Room ${app.roomCode}`));

  const resetBtn = el('button', { class: 'mp-btn secondary' }, 'Reset Test');
  resetBtn.addEventListener('click', () => doReset(true));
  head.appendChild(resetBtn);

  wrap.appendChild(head);

  // ---- Enemy panel ----
  const enemy = el('div', { class: 'mp-enemy' });
  enemy.appendChild(el('div', { class: 'mp-enemy-name' }, 'Training Dummy'));

  const bar = el('div', { class: 'mp-hp-bar' });
  const fill = el('div', { class: 'mp-hp-fill' });
  fill.style.width = Math.max(0, (app.enemyHp / app.enemyMaxHp) * 100) + '%';
  bar.appendChild(fill);
  bar.appendChild(el('div', { class: 'mp-hp-text' },
    `${app.enemyHp} / ${app.enemyMaxHp}`));
  enemy.appendChild(bar);

  wrap.appendChild(enemy);

  // ---- Stats row ----
  const stats = el('div', { class: 'mp-stats' });

  stats.appendChild(statBlock('Turn', app.turn, ''));
  stats.appendChild(statBlock('Phase', app.phase === 'players' ? 'Players' : 'Enemy',
                              app.phase === 'players' ? 'green' : 'gold'));
  stats.appendChild(statBlock('Energy', `${app.energy} / ${app.maxEnergy}`, ''));
  stats.appendChild(statBlock('Ended By', `${app.endedBy.size} / 2`, ''));

  wrap.appendChild(stats);

  // ---- Controls ----
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

  // ---- Waiting banner ----
  if (app.phase === 'enemy') {
    wrap.appendChild(el('div', { class: 'mp-waiting' }, 'Enemy turn…'));
  } else if (app.endedBy.has(myId()) && app.endedBy.size < 2) {
    wrap.appendChild(el('div', { class: 'mp-waiting' },
      'Waiting for the other player to end their turn…'));
  }

  // ---- Log ----
  const logEl = el('div', { class: 'mp-log' });
  const now = performance.now();
  const recentCutoff = app.logPulseUntil;
  for (let i = 0; i < app.log.length; i++) {
    const entry = app.log[i];
    const recent = entry.at > recentCutoff - 900;
    const cls = 'mp-log-line'
      + (recent ? ' recent' : '')
      + (entry.kind ? ' ' + entry.kind : '');
    logEl.appendChild(el('div', { class: cls }, entry.text));
  }
  if (app.log.length === 0) {
    logEl.appendChild(el('div', { class: 'mp-log-line' }, 'No actions yet.'));
  }
  wrap.appendChild(logEl);

  // ---- Disconnected warning ----
  if (!app.connected) {
    wrap.appendChild(el('div', { class: 'mp-status error' },
      'Connection lost. Reload to restart.'));
  }

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

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------

render();
