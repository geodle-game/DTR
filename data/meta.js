// ============================================================
// data/meta.js
// Cross-run persistence. Tracks whether MC1's prologue has been
// completed, how many runs the player has attempted, which
// endings they've seen, and which one-shot narrative beats have
// fired.
// ============================================================

const STORAGE_KEY = 'drawnToRuin.meta';
const META_VERSION = 1;

const DEFAULT_META = {
  version: META_VERSION,
  mc1Complete: false,
  totalRuns: 0,
  endingsSeen: [],
  lastAbsorption: null,
  tutorialsSeen: [],
  fragmentLoreSeen: [],
};

let cached = null;

export function loadMeta() {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { cached = { ...DEFAULT_META }; return cached; }
    const data = JSON.parse(raw);
    cached = { ...DEFAULT_META, ...data };
    if (!Array.isArray(cached.tutorialsSeen)) cached.tutorialsSeen = [];
    if (!Array.isArray(cached.fragmentLoreSeen)) cached.fragmentLoreSeen = [];
    if (!Array.isArray(cached.endingsSeen)) cached.endingsSeen = [];
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
