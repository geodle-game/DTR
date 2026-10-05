// ============================================================
// data/meta.js
// Cross-run persistence. Tracks whether MC1's prologue has been
// completed, how many runs the player has attempted, and which
// endings they've seen.
// ============================================================

const STORAGE_KEY = 'drawnToRuin.meta';
const META_VERSION = 1;

const DEFAULT_META = {
  version: META_VERSION,
  mc1Complete: false,       // has the player finished MC1's prologue?
  totalRuns: 0,             // increments on every new run
  endingsSeen: [],          // ['prologue', 'absorbed', 'truth', 'secret']
  lastAbsorption: null,     // { fragmentsSent, at }
};

let cached = null;

export function loadMeta() {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { cached = { ...DEFAULT_META }; return cached; }
    const data = JSON.parse(raw);
    cached = { ...DEFAULT_META, ...data };
    return cached;
  } catch {
    cached = { ...DEFAULT_META };
    return cached;
  }
}

export function saveMeta(meta) {
  cached = meta;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meta)); }
  catch (e) { console.warn('Meta save failed:', e); }
}

export function updateMeta(patch) {
  const meta = { ...loadMeta(), ...patch };
  saveMeta(meta);
  return meta;
}

export function resetMeta() {
  cached = { ...DEFAULT_META };
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export function currentMode() {
  return loadMeta().mc1Complete ? 'mc2' : 'mc1';
}
