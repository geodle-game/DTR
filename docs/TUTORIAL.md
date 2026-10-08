# DRAWN TO RUIN — TUTORIAL DESIGN

*MC1 is a tutorial, not a prologue. One act, one floor set, one
boss. Designed to be finished in 20–30 minutes and skipped on
repeat runs via `meta.mc1Complete`.*

---

## 1. STRUCTURE

- 4 regular floors + 1 boss floor (existing MC1 layout)
- Boss: the researcher (weakened variant, 120 HP, single-entry
  script, no phase shifts)
- No elites
- After beating the researcher: absorption scene fires, MC2 unlocks

`RUN_MODES.mc1.actsTotal` = 1.

## 2. PER-CLASS TUTORIAL DECKS

Each class gets a handpicked 15-card deck for MC1. Stronger than
the standard starters. Teaches every core mechanic once.

**Vanguard (15):**
strike ×3, defend ×3, bash, neutralize, pommel-strike,
iron-wave, cleave, inflame, impervious, bludgeon, reaper.

**Magnus (15):**
defend ×4, arcane-spark ×3, arcane-bolt, frost-shard, ember,
arcane-focus, attunement, fireball, soul-siphon, void-rift.

**Priest (15):**
strike ×3, defend ×3, mend ×2, blessing, sanctuary, bash,
neutralize, pommel-strike, impervious, inflame.

**Beastcaller:** no tutorial deck (locked).

## 3. SCRIPTED FIRST BATTLE

The first monster node of MC1's first floor is replaced with a
scripted fight against **Driftwood** — a broken piece of a Spawned.

- 15 HP, fixed intent, one attack for 6 damage
- Cannot kill the player (plot armor restarts the act if HP hits 0)
- Fixed hand per class
- Empty draw pile — the player cannot draw during this fight
- Gated actions with step-by-step overlays

**Vanguard hand:** strike, strike, defend, defend, bash
**Magnus hand:** arcane-spark, arcane-focus, defend, arcane-spark, defend
**Priest hand:** strike, defend, bash, strike, defend

Turn 1: play one attack, one defend, end turn. Enemy attacks,
block absorbs most of it.
Turn 2: apply Vulnerable, then finish with two attacks.

Per-class step sequences live in `data/tutorialScript.js`. Each
step is one of:

- `modal` — full-screen overlay, advances on Continue click
- `highlight` — spotlight on a target element, advances when the
  gated action is performed
- `prompt` — floating text, advances on a broader condition

## 4. CONTEXTUAL TIPS (after the scripted battle)

After the scripted fight, the tutorial shifts to one-shot modals
tracked in `meta.tutorialsSeen` (existing system in
`data/tutorials.js`). These fire once on first encounter:

- Reward screen
- Map navigation
- Event node
- Rest node
- Shop
- First fragment pickup
- Boss encounter

## 5. RETURN-PLAYER BEHAVIOR

- If `meta.mc1Complete` is true, MC1 does not replay. The player
  goes straight to MC2.
- If `meta.tutorialsSeen` contains `'tutorial:scripted-first-battle'`,
  the scripted fight is skipped on MC1 replays even if
  `mc1Complete` is false. This protects players who only wiped
  their run-save, not their meta-save.
- In MC1 co-op, the scripted fight is skipped entirely.
  Contextual tips still fire.

## 6. FILES

**New:**
- `data/tutorialDecks.js`
- `data/tutorialScript.js`
- `systems/tutorial.js`
- `ui/tutorialOverlay.js`

**Modified:**
- `data/classes.js`
- `systems/state.js`
- `systems/combat.js`
- `ui/render.js`
