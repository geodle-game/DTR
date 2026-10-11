# DRAWN TO RUIN — RESEARCHER ALLY

*Design doc for the rescued researcher companion. Built on top of the
existing multiplayer two-player architecture. The ally is mechanically
`state.players[1]` with an `isAlly: true` flag.*

---

## 1. WHEN HE JOINS

Only after the MC2+ spare-the-researcher sequence completes. He is
attached to the current run only. New runs require re-sparing him.
This preserves the narrative weight of the rescue.

## 2. ENDING OUTCOMES

- MC2+ kills researcher → Ending 1
- MC2+ spares researcher, then loses to the Veil → run over, no ending
- MC2+ spares researcher, then beats the Veil → Ending 2

## 3. DEATH AND REVIVE

Same rules as the existing multiplayer player:

- A downed character is out for the rest of the current combat.
- If the party wins, all downed characters revive at 1 HP.
- If everyone is downed, the combat is lost.

Emergent behavior: the player dies mid-fight, the researcher solo-
fights, wins, and the player stands back up at 1 HP.

## 4. TURN STRUCTURE

He plays during the same player turn as the human, just like a
second player in multiplayer. One card every ~1 second on a
background timer. `allPlayersEndedTurn` waits for both.

## 5. AI

Depth-1 min-max. For each playable card:

- Simulate the card's effects on a shallow copy of the combat state.
- Score the resulting state.
- Pick the highest-scoring play.

If no card scores above zero, the ally ends his turn.

Score weights:

| Effect | Weight |
|--------|--------|
| Damage dealt to enemies | 1.0 per HP |
| Block gained | 0.8 per point |
| HP healed (any ally) | 1.0 per HP |
| Debuffs on enemies | 0.5 per stack |
| Buffs on allies | 0.7 per stack |
| Cards drawn | 0.4 per card |
| Energy remaining at end of turn | 0.1 per point |

## 6. POINTS AND UPGRADES

Every Veil kill grants points:

- Regular Veil: 2 points
- Elite Veil: 5 points
- Veil boss: 15 points

Points spend at:

- Post-shop combat (after defeating the Veil shopkeep)
- Post-elite
- Post-boss

Spend menu: pick a card in his deck, then pick an upgrade.

| Upgrade | Cost | Effect |
|---------|------|--------|
| Sharpen | 4 | +2 damage on that card |
| Fortify | 4 | +3 Block on that card |
| Lighten | 6 | −1 cost on that card |
| Refine | 8 | Add a keyword (draw 1 / retain / exhaust: heal 2) |

Upgrades are applied to card instances in his deck. He does not gain
new cards — he refines the ones he has.

## 7. HEALING

- Rest site: heals 30% of max HP, same as the player.
- Event node (?): auto-heals 20% of max HP, no player input.
- Post-combat win with him alive: no heal.
- Post-combat win with him down: he revives at 1 HP.

## 8. SHOP COMBAT (VEIL DUNGEON)

Walk into a shop in the Veil dungeon → the Veil shopkeep attacks →
fight → win → pick one ware for free. No currency, no browsing.

## 9. MULTIPLAYER

One shared researcher ally across the team. Both players benefit
from his plays. Enemy targeting includes him in the RNG pool
alongside players.

## 10. VEIL DUNGEON STRUCTURE

- 8 floors per act, 3 acts
- Node types: monster, elite, event, rest, shop, boss
- **No treasure nodes**
- Shops are combat encounters

## 11. NEW EFFECT KINDS NEEDED

Three new effect kinds for researcher cards. Each is handled in
`systems/combat.js` under `applyEffect`:

- `clearDebuffs` — removes N stacks of listed statuses from self
- `giveEnergy` — gives N Energy to the *other* player (targeted
  via `state.players` lookup, not via `def.target`)
- `healAll` — heals every living player, not just self

## 12. BUILD STAGES

1. **Ally spawn** — `data/researcher.js` + `data/researcher-cards.js`.
   Manual spawn for testing.
2. **AI turn loop** — `systems/ally-ai.js`. Plays cards, ends turn.
3. **Points + upgrades** — earn on kill, spend at shop / elite / boss.
4. **Spare sequence** — the 6-page scene, key handoff, gate into
   Veil dungeon.
5. **Veil dungeon** — map layout (no treasure), shop combat, event
   heals.
6. **Veil bosses** — endgame fights and Ending 2.
