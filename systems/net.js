// ============================================================
// systems/net.js
//
// Host-authoritative multiplayer over PeerJS.
//
// - Host runs the game simulation. Applies every action.
// - Joiners send actions to Host, receive stamped actions back.
// - Every action carries:
//       clientTimestamp   — client's local performance.now()
//       hostReceivedAt    — host's local performance.now() when received
//       sequence          — Host's monotonic counter (authoritative order)
//
// - Clients apply actions in sequence order. Timestamps are only
//   used by the Host to break ties for actions arriving within a
//   short window (<120ms), which is rare and doesn't matter much.
// ============================================================

import { state } from './state.js';
import { dispatch } from './dispatch.js';
import { render } from '../ui/render.js';

const ROOM_PREFIX = 'drawn-to-ruin-v1-';
const TIE_WINDOW_MS = 120;

let peer = null;
let mode = 'single';     // 'single' | 'host' | 'joiner'
let hostConn = null;     // Host's connection to its joiner
let joinConn = null;     // Joiner's connection to its host
let sequence = 0;
let lastAppliedSequence = 0;

// Pending actions awaiting Host sort on the Host side.
// Not used on joiner side (they get pre-sorted messages).
let inbox = [];
let flushTimer = null;

export function getMode() { return mode; }
export function isHost() { return mode === 'host'; }
export function isJoiner() { return mode === 'joiner'; }
export function isOnline() { return mode !== 'single'; }

// ============================================================
// HOST
// ============================================================

export function hostGame() {
  if (typeof Peer === 'undefined') {
    console.error('PeerJS not loaded. Add the <script> to index.html.');
    return null;
  }
  mode = 'host';
  const roomCode = randomRoomCode();

  peer = new Peer(ROOM_PREFIX + roomCode);

  peer.on('open', () => {
    console.log('[net] Hosting room:', roomCode);
    state.roomCode = roomCode;
    state.peerStatus = 'waiting';
    render();
  });

  peer.on('connection', (conn) => {
    if (hostConn) { conn.close(); return; }
    hostConn = conn;
    setupHostConnection(conn);
  });

  peer.on('error', (err) => {
    console.error('[net] Host error:', err);
    state.peerStatus = 'error';
    state.peerError = err.message || String(err);
    render();
  });

  return roomCode;
}

function setupHostConnection(conn) {
  conn.on('open', () => {
    console.log('[net] Joiner connected');
    state.peerStatus = 'connected';
    render();
    // Send authoritative state snapshot on connect.
    conn.send({
      type: 'SNAPSHOT',
      state: serializeForWire(state),
      sequence,
    });
  });

  conn.on('data', (msg) => {
    if (msg.type === 'ACTION') {
      enqueueAction({
        action: msg.action,
        clientTimestamp: msg.clientTimestamp,
        hostReceivedAt: performance.now(),
      });
    }
  });

  conn.on('close', () => {
    console.log('[net] Joiner disconnected');
    hostConn = null;
    state.peerStatus = 'waiting';
    render();
  });
}

function enqueueAction(entry) {
  inbox.push(entry);
  if (flushTimer) return;
  // Batch actions that arrive within TIE_WINDOW_MS so we can sort
  // them by client timestamp rather than arrival order.
  flushTimer = setTimeout(flushInbox, TIE_WINDOW_MS);
}

function flushInbox() {
  flushTimer = null;
  if (inbox.length === 0) return;

  // Sort by client timestamp; if two clients' clocks disagree
  // wildly, arrival order on the Host wins (stable sort).
  inbox.sort((a, b) => {
    const dt = (a.clientTimestamp ?? 0) - (b.clientTimestamp ?? 0);
    if (Math.abs(dt) > TIE_WINDOW_MS * 4) return dt;
    return (a.hostReceivedAt ?? 0) - (b.hostReceivedAt ?? 0);
  });

  for (const entry of inbox) {
    sequence += 1;
    const stamped = {
      type: 'ACTION',
      action: entry.action,
      clientTimestamp: entry.clientTimestamp,
      hostReceivedAt: entry.hostReceivedAt,
      sequence,
    };
    // Host applies the action locally.
    dispatch(entry.action);
    // Then broadcasts it to the joiner with the authority stamp.
    if (hostConn) hostConn.send(stamped);
    render();
  }
  inbox = [];
}

// ============================================================
// JOINER
// ============================================================

export function joinGame(roomCode) {
  if (typeof Peer === 'undefined') {
    console.error('PeerJS not loaded.');
    return;
  }
  mode = 'joiner';
  peer = new Peer();

  peer.on('open', () => {
    console.log('[net] Looking up room:', roomCode);
    joinConn = peer.connect(ROOM_PREFIX + roomCode.toUpperCase());

    joinConn.on('open', () => {
      console.log('[net] Connected to host');
      state.peerStatus = 'connected';
      state.roomCode = roomCode.toUpperCase();
      render();
    });

    joinConn.on('data', handleJoinerMessage);

    joinConn.on('close', () => {
      console.log('[net] Host disconnected');
      state.peerStatus = 'disconnected';
      render();
    });
  });

  peer.on('error', (err) => {
    console.error('[net] Join error:', err);
    state.peerStatus = 'error';
    state.peerError = err.message || String(err);
    render();
  });
}

function handleJoinerMessage(msg) {
  if (msg.type === 'SNAPSHOT') {
    restoreFromWire(state, msg.state);
    sequence = msg.sequence;
    lastAppliedSequence = msg.sequence;
    render();
    return;
  }

  if (msg.type === 'ACTION') {
    // Only apply if we haven't seen it yet.
    if (msg.sequence > lastAppliedSequence) {
      dispatch(msg.action);
      lastAppliedSequence = msg.sequence;
      render();
    }
    return;
  }
}

// ============================================================
// SUBMIT (called from UI for every player action)
// ============================================================

export function submitAction(action) {
  if (mode === 'single') {
    dispatch(action);
    render();
    return true;
  }

  const clientTimestamp = performance.now();

  if (mode === 'host') {
    // Host: apply immediately, broadcast with a sequence stamp.
    sequence += 1;
    const stamped = {
      type: 'ACTION',
      action,
      clientTimestamp,
      hostReceivedAt: clientTimestamp,
      sequence,
    };
    dispatch(action);
    if (hostConn) hostConn.send(stamped);
    render();
    return true;
  }

  if (mode === 'joiner') {
    if (!joinConn) return false;
    // Joiner: send to host, don't apply locally.
    joinConn.send({ type: 'ACTION', action, clientTimestamp });
    return true;
  }

  return false;
}

// ============================================================
// HELPERS
// ============================================================

function randomRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function serializeForWire(s) {
  // Deep clone the network-relevant subset.
  // We deliberately drop transient UI fields (newlyDrawn set, lastHits, etc.)
  return JSON.parse(JSON.stringify({
    run: s.run,
    player: s.player,
    enemies: s.enemies,
    drawPile: s.drawPile,
    hand: s.hand,
    discardPile: s.discardPile,
    exhaustPile: s.exhaustPile,
    energy: s.energy,
    maxEnergy: s.maxEnergy,
    turn: s.turn,
    screen: s.screen,
    combatKind: s.combatKind,
    combatBanner: s.combatBanner,
    lastEncounterId: s.lastEncounterId,
    selectedEnemyId: s.selectedEnemyId,
    reward: s.reward,
    actReward: s.actReward,
    treasure: s.treasure,
    event: s.event,
    shop: s.shop,
    rest: s.rest,
    pendingEnchant: s.pendingEnchant,
    over: s.over,
    result: s.result,
  }));
}

function restoreFromWire(s, snapshot) {
  Object.assign(s, snapshot);
  s.newlyDrawn = new Set();
  s.lastHits = [];
  s.overlays = { deck: false, relics: false, draw: false, discard: false, exhaust: false };
  s.previewCardUid = null;
  s.pendingCardUid = null;
  s.currentAnimation = null;
  s.bossLore = null;
  s.deathPage = s.deathPage ?? 0;
}
