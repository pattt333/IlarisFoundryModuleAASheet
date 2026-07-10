## Why

The combat dock currently requires users to switch to the Foundry sidebar encounter tracker to end a turn. Players and GMs should be able to advance turns directly from the dock, making the sidebar only necessary for combat management operations (revert, end combat, start combat). This keeps the gameplay flow within the dock during active combat.

## What Changes

- Add an "End Turn" button (`⏭ Zug beenden`) to the combat dock, positioned between the carousel and the round badge
- Button is only visible in in-combat state (not pre-roll) and only to the current combatant's owner or the GM
- Button calls `combat.nextTurn()` directly — same behavior as the sidebar encounter tracker's "Next Turn" button
- No new socket communication needed — the existing codebase already calls `combat.nextTurn()` from non-GM contexts successfully

## Capabilities

### New Capabilities

_None — this extends an existing capability._

### Modified Capabilities

- `combat-dock`: Add requirement for an ownership-gated "End Turn" button that advances combat to the next turn. Button visibility is restricted to the current combatant's owner and the GM, and is hidden during pre-roll state.

## Impact

- `scripts/apps/combat-dock.js` — Add `endTurn` action handler, `_canEndTurn` check, pass `canEndTurn` and `showEndTurn` to template context
- `templates/apps/combat-dock.hbs` — Add button HTML between carousel and round badge
- `styles/combat-dock.css` — Style the new button consistent with existing dock styles
- `openspec/specs/combat-dock/spec.md` — Add end-turn requirement and scenarios
