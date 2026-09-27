// ============================================================
// systems/net.js
// ============================================================

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

let mode = 'single';       // 'single' | 'host' | 'guest'
let pc = null;
let dc = null;
let onActionCb = null;
let onSnapshotCb = null;
let onStatusCb = null;

export function getMode() { return mode; }
export function isHost() { return mode === 'host'; }
export function isGuest() { return mode === 'guest'; }
export function isMultiplayer() { return mode !== 'single'; }
export function setMode(m) { mode = m; }

export function onStatus(cb) { onStatusCb = cb; }
function status(text, kind) { if (onStatusCb) onStatusCb(text, kind); }

function encodeBlob(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function decodeBlob(str) {
  return JSON.parse(decodeURIComponent(escape(atob(String(str).replace(/\s+/g, '')))));
}

function waitForIceComplete(p, timeoutMs = 5000) {
  return new Promise(resolve => {
    if (p.iceGatheringState === 'complete') return resolve();
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    p.addEventListener('icegatheringstatechange', () => {
      if (p.iceGatheringState === 'complete') finish();
    });
    setTimeout(finish, timeoutMs);
  });
}

function makePeerConnection() {
  const p = new RTCPeerConnection(ICE_CONFIG);
  p.addEventListener('iceconnectionstatechange', () => {
    status('ICE: ' + p.iceConnectionState,
      p.iceConnectionState === 'connected' ? 'ok' :
      p.iceConnectionState === 'failed' ? 'err' : '');
  });
  p.addEventListener('connectionstatechange', () => {
    status('conn: ' + p.connectionState,
      p.connectionState === 'connected' ? 'ok' :
      p.connectionState === 'failed' ? 'err' : '');
  });
  return p;
}

function wireDataChannel(channel) {
  dc = channel;
  dc.addEventListener('open', () => status('Data channel open', 'ok'));
  dc.addEventListener('message', e => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }
    if (msg.type === 'ACTION' && onActionCb) onActionCb(msg.action);
    if (msg.type === 'SNAPSHOT' && onSnapshotCb) onSnapshotCb(msg.snapshot);
  });
  dc.addEventListener('close', () => status('Data channel closed', 'err'));
  dc.addEventListener('error', e => status('dc error: ' + (e.message || ''), 'err'));
}

export async function hostStart() {
  mode = 'host';
  pc = makePeerConnection();
  const channel = pc.createDataChannel('game', { ordered: true });
  wireDataChannel(channel);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIceComplete(pc);
  return encodeBlob({
    kind: 'offer',
    sdp: pc.localDescription.sdp,
    type: pc.localDescription.type,
  });
}

export async function hostAcceptAnswer(blobStr) {
  const data = decodeBlob(blobStr);
  if (data.kind !== 'answer') throw new Error('not an answer blob');
  await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
}

export async function guestStart(offerBlobStr) {
  mode = 'guest';
  pc = makePeerConnection();
  pc.addEventListener('datachannel', e => wireDataChannel(e.channel));
  const data = decodeBlob(offerBlobStr);
  if (data.kind !== 'offer') throw new Error('not an offer blob');
  await pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitForIceComplete(pc);
  return encodeBlob({
    kind: 'answer',
    sdp: pc.localDescription.sdp,
    type: pc.localDescription.type,
  });
}

export function isChannelOpen() {
  return dc && dc.readyState === 'open';
}

export function sendAction(action) {
  if (!isChannelOpen()) return;
  dc.send(JSON.stringify({ type: 'ACTION', action }));
}

export function sendSnapshot(snapshot) {
  if (!isChannelOpen()) return;
  dc.send(JSON.stringify({ type: 'SNAPSHOT', snapshot }));
}

export function onAction(cb) { onActionCb = cb; }
export function onSnapshot(cb) { onSnapshotCb = cb; }
