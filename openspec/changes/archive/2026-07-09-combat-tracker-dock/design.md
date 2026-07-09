## Context

The Ilaris module currently provides rich initiative dialogs (`InitiativeDialog`, `MassInitiativeDialog`) for the pre-roll phase of combat, but once initiative is confirmed, players and GMs rely on Foundry's built-in sidebar combat tracker. This sidebar is easily overlooked and doesn't convey the flow of combat visually. The goal is to add a horizontal dock — a carousel of combatant cards — that is always visible during combat, inspired by the Carousel Combat Tracker module.

The existing initiative system already hooks into `renderCombatTracker`, `updateCombat`, and `combatStart`. The dock will add listeners for `combatTurn`, `deleteCombat`, and `updateCombatant` without modifying existing hook behavior.

## Goals / Non-Goals

**Goals:**
- Provide an always-visible horizontal carousel of combatant cards
- Two visual states: pre-roll (equal cards + INI buttons) and in-combat (current card large + pulse)
- Client-configurable dock position (top/bottom/hidden) and size (small/normal)
- Card content: portrait, name, initiative, actions, LeP (ownership-gated)
- Carousel with current ±2 visible cards and scroll buttons for large encounters
- Auto-scroll to center current combatant on turn change
- Pulse animation on active card
- Visual consistency with existing initiative dialog theme

**Non-Goals:**
- Replacing Foundry's built-in combat tracker (dock coexists with it)
- Adding turn management controls (advance turn, end combat) — those stay in the sidebar
- Modifying initiative dialog behavior or state management
- Supporting Foundry versions below V13
- Canvas-integrated HUD (the dock is a fixed DOM overlay)

## Decisions

### Decision 1: Standalone Application (not CombatTracker extension)

**Choice**: Create a new `CombatDockApp` class extending Foundry's `Application`.

**Alternatives considered**:
- *Extend/replace `CombatTracker`*: Full control but high conflict risk with other modules that modify the tracker. The Ilaris module already uses the `renderCombatTracker` hook for initiative button interception — replacing the tracker would break this.
- *Canvas HUD layer*: Would float over the canvas rather than being a fixed overlay. Rejected because it interferes with token interaction and doesn't support clean top/bottom positioning.

**Rationale**: A standalone `Application` follows the module's existing pattern (`InitiativeDialog`, `MassInitiativeDialog` are also `Application` subclasses). It's non-invasive, can't conflict with other combat tracker modifications, and is easy to show/hide via `render()`/`close()`.

### Decision 2: Singleton instance managed via module scope

**Choice**: Store the dock instance in a module-level variable, accessible as a property on the `InitiativeDialogManager` or a new dedicated manager.

**Rationale**: Only one dock should exist at a time. The instance is created on first render and closed when combat ends. Re-rendering updates content in-place rather than creating a new application window. This avoids z-order issues and DOM duplication.

### Decision 3: Application class (not HandlebarsApplicationMixin/AppV2)

**Choice**: Extend `Application` using the same pattern as `InitiativeDialog` and `MassInitiativeDialog` (`defaultOptions`, `getData`, `activateListeners`).

**Alternatives considered**:
- *`HandlebarsApplicationMixin(ApplicationV2)`*: The module's sheets use AppV2, but the dialog apps use the older `Application` class. Mixing patterns within the apps directory would create inconsistency.

**Rationale**: Consistency with existing dialog apps. Migration to AppV2 for all apps could be a separate, cross-cutting change.

### Decision 4: Two CSS states via class toggling on the dock root

**Choice**: The dock root element carries either `.pre-roll` or `.in-combat` class. CSS rules then control card sizing, button visibility, and animation. State is determined by checking if all combatants have non-null initiative.

**Rationale**: Cleaner than conditional template rendering — avoids re-rendering the entire dock when transitioning from pre-roll to in-combat. A single state toggle on the root cascades to all cards.

### Decision 5: Client-scoped setting for position

**Choice**: Two client-scoped settings: `combatDockPosition` (`top`/`bottom`/`none`) and `combatDockSize` (`small`/`normal`).

**Rationale**: Position and size preferences are personal — each user should choose independently. The GM shouldn't control where or how large players see the dock. The `none` option replaces needing a separate enable/disable toggle. Small size (~80px standard cards, ~110px current) saves screen space for users on smaller displays; normal matches the original design (120px/170px).

### Decision 6: Card sizing via CSS, not JavaScript measurement

**Choice**: Standard cards at `120px` width, current card at `170px` width, controlled by `.is-current` CSS class. The carousel uses `flex` layout with `gap: 0.5rem`.

**Rationale**: Avoids layout thrashing from JavaScript measurement. CSS handles the transition when the `.is-current` class moves between cards. The carousel container uses `scroll-behavior: smooth` for auto-scroll transitions.

### Decision 7: LeP data read from Ilaris system model

**Choice**: Read `actor.system.gesundheit.hp.value` (current) and `actor.system.gesundheit.hp.max` (maximum) for the LeP bar. If the actor is not an Ilaris actor (no `system.gesundheit`), the bar is omitted.

**Rationale**: These are the canonical data paths in the Ilaris system. The bar is a simple percentage fill — no interactivity, no damage application.

### Decision 8: Action names resolved from `dialogState`

**Choice**: Read `actor.getFlag('ilaris-alternative-actor-sheet', 'dialogState')` to get `selectedActionIds`, then resolve action names from the actor's inventory or compendium using the same logic as `InitiativeStateManager.loadAvailableActions()`.

**Rationale**: The dialog state is the single source of truth for what actions a combatant announced. Reusing the same resolution logic ensures consistency between what the dialog shows and what the dock card shows.

### Decision 9: Hook-driven refresh, not polling

**Choice**: The dock re-renders only when relevant hooks fire: `updateCombat` (round/turn changes), `updateCombatant` (initiative value changes), `deleteCombat` (combat ends), `renderCombatTracker` (initial availability).

**Rationale**: Polling `game.combat` on an interval would be wasteful. Foundry's hook system provides precise events for every state change.

## Risks / Trade-offs

- **[Risk] Screen real estate**: A fixed dock at top or bottom reduces visible canvas area by approximately 80-100px. → **Mitigation**: The `none` setting lets users disable it entirely, and the `small` size setting reduces the footprint further (~60px for standard cards, ~85px for current). Semi-transparent background option could be considered if space is a concern.
- **[Risk] Large encounters (20+ combatants)**: Rendering many cards could impact performance. → **Mitigation**: Only 5 cards are visible at a time with the carousel window. The full combatant list is in data but only visible cards are rendered DOM elements.
- **[Risk] Conflict with other UI modules**: Fixed positioning at top/bottom could overlap with other modules' UI elements. → **Mitigation**: The dock uses a low `z-index` (below actor sheets and dialogs) but above the canvas. Users can reposition, resize, or hide via settings. Could add a `marginTop`/`marginBottom` CSS variable for fine-tuning.
- **[Trade-off] Duplicated data from combat tracker**: The dock reads the same data as Foundry's tracker but renders independently. This is intentional design (coexistence) but means both UIs exist simultaneously. → **Acceptance**: Users who want only the dock can collapse the sidebar tracker manually. We don't auto-hide the sidebar to avoid breaking user expectations.
- **[Trade-off] Action name resolution may be stale**: If a combatant's actions change between round start and the dock rendering, the dock might show outdated action names. → **Acceptance**: The dock reads from `dialogState` which is the committed state. If a player re-opens their initiative dialog and changes actions, the dock updates on the next `updateCombatant` hook.

### Decision 10: Z-index layering below actor sheets

**Choice**: The dock uses a `z-index` lower than Foundry's application window layer. Actor sheets, dialogs, and the sidebar must render above the dock.

**Rationale**: The dock is a passive HUD, not an interactive application window. Actor sheets are the primary interaction surface and must never be obscured by the dock. Foundry's application window layer typically starts around `z-index: 100`. The dock will use a value in the `30-50` range — above the canvas but below all application windows.

## Open Questions

- Should the dock use a semi-transparent background to reduce canvas occlusion? (Default: solid, matching dialog header background)
- Should defeated combatants be hidden entirely or just dimmed? (Current design: dimmed)
- Should there be a "minimal mode" that shows only the current combatant? (Out of scope for initial implementation)
