## Why

The combat dock currently wraps combatant cards at the initiative list boundaries — when the first combatant is active, the left slot shows the last combatant (and vice versa). In Ilaris, initiative does not re-roll each round, so this wrapping creates a false impression of adjacency. Additionally, the uniform opacity of side cards makes the carousel feel flat rather than spatial.

## What Changes

- **No-wrap window boundaries**: When the first combatant is active, the left slot renders an empty placeholder instead of wrapping to the last combatant. Same for the last combatant's right slot. The active card remains centered.
- **Progressive fade on side cards**: Non-current cards receive reduced opacity (0.75) and a gradient mask on their outer edge, creating a visual fade-away effect toward the carousel periphery.
- **Placeholder card**: An invisible placeholder preserves flex layout space at boundaries, ensuring the active card stays centered.

## Capabilities

### New Capabilities

_None._ These changes are refinements to the existing combat dock capability.

### Modified Capabilities

- `combat-dock`: The `Sliding window with shift buttons` requirement changes — window no longer wraps at list boundaries. New visual requirement added for progressive fade on peripheral cards.

## Impact

- `scripts/apps/combat-dock.js` — `getData()` window logic, add `dockPos` to data entries
- `templates/apps/combat-dock.hbs` — placeholder rendering, pass `dockPos` to card partial
- `templates/components/combat-dock-card.hbs` — accept `dockPos`, apply positional class
- `styles/combat-dock.css` — `.dock-pos-left`/`.dock-pos-right` opacity + mask, `.dock-placeholder` hidden
