## Why

Foundry VTT's built-in combat tracker is a sidebar list — functional but easy to overlook during play. Players and GMs frequently lose track of whose turn it is, and the tracker doesn't convey the flow of combat visually. The Ilaris module already has a rich pre-roll initiative system, but once initiative is rolled, the experience falls back to Foundry's unremarkable sidebar. A horizontal, always-visible combat dock — inspired by the Carousel Combat Tracker module — would make turn order obvious, engaging, and seamlessly integrated with the existing Ilaris initiative dialogs.

## What Changes

- **New**: A `CombatDockApp` Application rendering a horizontal carousel of combatant cards at the top or bottom of the screen
- **New**: Two visual states — pre-roll (all cards equal size, each with a "roll INI" button linked to the initiative dialogs) and in-combat (current combatant card enlarged with pulse animation, neighbors shown at smaller size)
- **New**: A client-scoped setting allowing each user to choose dock position: top, bottom, or hidden
- **New**: Card content includes portrait, name, initiative value, announced actions, and LeP bar (LeP visible only to owner and GM)
- **New**: Scroll buttons at carousel edges when combatant count exceeds visible window (current ±2 cards)
- **New**: Auto-scroll to center current combatant on turn change, with pulse animation highlighting the active card
- **New**: Auto-hide when no combat is active, auto-show when combat starts
- Uses the same CSS variable system as existing initiative dialogs for visual consistency

## Capabilities

### New Capabilities

- `combat-dock`: A horizontal carousel combat tracker displaying all combatants as cards, with a pre-roll state (equal-sized cards with initiative buttons) and in-combat state (enlarged current card with pulse animation). Supports client-configurable positioning (top/bottom/hidden), scroll buttons for large encounters, and LeP visibility gated by ownership.

### Modified Capabilities

<!-- No existing spec requirements are changing. The dock is a new display layer that reads from the same combat data without altering existing initiative dialog behavior. -->

## Impact

- **New files**: `scripts/apps/combat-dock.js`, `styles/combat-dock.css`, `templates/apps/combat-dock.hbs`, `templates/components/combat-dock-card.hbs`
- **Modified files**: `module.js` (hook registrations, setting registration, template/CSS loading), `module.json` (add CSS to styles array), `scripts/apps/index.js` (export new class)
- **Foundry Hooks used**: `updateCombat` (sync card data), `combatTurn` (animate turn change), `deleteCombat` (hide dock), `updateCombatant` (re-render on INI change), `renderCombatTracker` (initial data sync)
- **Foundry APIs**: `game.combat`, `game.settings`, `Application` class, `Handlebars` template rendering
- **No breaking changes** — the dock is additive and coexists with Foundry's built-in combat tracker
