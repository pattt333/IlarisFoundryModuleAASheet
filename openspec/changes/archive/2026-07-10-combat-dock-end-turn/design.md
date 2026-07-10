## Context

The combat dock (`CombatDockApp`) is a fixed-position carousel displaying 3 combatant cards. It already supports rolling initiative (pre-roll state) and navigating the carousel. However, there is no way to end the current turn from the dock — users must switch to the Foundry sidebar encounter tracker.

The `Combat.nextTurn()` API is already used successfully from non-GM contexts in the existing `combatTurnChange` handler (negative initiative auto-skip). No socket relay is needed.

## Goals / Non-Goals

**Goals:**
- Add an "End Turn" button to the dock that calls `combat.nextTurn()`
- Button is only visible in in-combat state (not pre-roll)
- Button is only visible to the current combatant's owner or the GM
- Button matches existing dock visual style

**Non-Goals:**
- Previous turn (revert) — stays in the sidebar
- End combat — stays in the sidebar
- Start combat — stays in the sidebar
- Any new settings or configuration options
- Any socket communication

## Decisions

### Decision 1: Button placement — global, between carousel and round badge

**Chosen**: A dedicated button in the dock's top-level layout, positioned between the carousel container and the round badge.

**Alternatives considered**:
- On the current card: Rejected — cards are already dense (portrait, name, initiative, actions, LeP bar) and only 120-170px wide
- Integrated into round badge: Rejected — conflates two distinct actions (view state vs. mutate state)

**Rationale**: A global button is always in the same place, doesn't crowd cards, and visually separates "information display" (cards) from "actions" (end turn, round badge).

### Decision 2: Visibility model — owner-gated, hidden for non-owners

**Chosen**: Button is visible to GM always (in-combat state) and to players only when the current combatant is theirs. Hidden for all others.

**Alternatives considered**:
- Show disabled button for non-owners: Rejected — adds clutter with no actionable value for those users
- Show to everyone: Rejected — non-owners can't use it, visible but useless UI is confusing

**Rationale**: Matches the existing `_canRollInitiative` pattern in the codebase. Clean, minimal UI.

### Decision 3: Action implementation — direct `combat.nextTurn()` call

**Chosen**: Call `combat.nextTurn()` directly from the action handler. No socket relay.

**Alternatives considered**:
- Socket relay to GM: Rejected — unnecessary. The existing `combatTurnChange` handler already calls `combat.nextTurn()` from player contexts successfully.

**Rationale**: The codebase has already proven this pattern works. Adding a socket layer would add complexity with no benefit.

### Decision 4: Double-click prevention — button disable after click

**Chosen**: Disable the button immediately after click via a small debounce (the button will re-enable on next render when `combatTurn` hook fires and dock refreshes).

**Rationale**: Prevents accidental double-advancement. The natural re-render cycle provides re-enablement without additional state management.

### Decision 5: Button style — match existing scroll buttons

**Chosen**: Style the end-turn button similarly to the existing `.dock-scroll-btn` with appropriate accent coloring to distinguish it as a primary action.

**Rationale**: Visual consistency with the existing dock UI. The accent color signals "this is a primary action."

## Risks / Trade-offs

- **[Risk] Player accidentally ends turn early** → Mitigation: Button is only visible to the current owner, who is the person most aware of their turn state. The sidebar still has "previous turn" for reversion.
- **[Risk] Button visible during NPC turn but player can't click** → Mitigation: Button is hidden for non-owners, so this only affects GM (who can always advance).
- **[Trade-off] No confirmation dialog** → Chosen for speed of play. The sidebar also has no confirmation for next turn. Reversion is available via sidebar.
