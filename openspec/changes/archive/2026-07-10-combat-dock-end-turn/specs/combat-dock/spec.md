## ADDED Requirements

### Requirement: End-turn button for current combatant owner

The combat dock SHALL display an "End Turn" button when combat is in the in-combat state (initiative rolled, combat active). The button SHALL be positioned after the carousel as the final element of the dock. The button SHALL only be visible to the GM or the owner of the currently active combatant. Clicking the button SHALL call `combat.nextTurn()` to advance to the next combatant. The button SHALL be hidden during pre-roll state.

#### Scenario: GM sees end-turn button during active combat

- **WHEN** combat is active and in the in-combat state (initiative rolled)
- **THEN** the GM sees an "End Turn" button after the carousel

#### Scenario: Player sees end-turn button when their combatant is active

- **WHEN** the current combatant is owned by the player and combat is in the in-combat state
- **THEN** the player sees an "End Turn" button after the carousel

#### Scenario: Player does not see end-turn button for other combatants

- **WHEN** the current combatant is NOT owned by the player
- **THEN** the end-turn button is not rendered for that player

#### Scenario: End-turn button hidden during pre-roll

- **WHEN** combat is in pre-roll state (initiative values are null)
- **THEN** the end-turn button is not rendered, regardless of user role

#### Scenario: Clicking end-turn button advances to next combatant

- **WHEN** a user clicks the "End Turn" button
- **THEN** `combat.nextTurn()` is called, the turn advances to the next combatant in initiative order, and the dock refreshes to show the new current combatant

#### Scenario: Clicking end-turn button on last combatant advances round

- **WHEN** a user clicks the "End Turn" button while the last combatant in the initiative order is active
- **THEN** `combat.nextTurn()` advances to the next round, the dock enters pre-roll state, and the end-turn button hides

#### Scenario: End-turn button is styled consistently with dock theme

- **WHEN** the end-turn button is rendered
- **THEN** it uses the same CSS custom property variables (`--color-accent-primary`, `--color-border-muted`, etc.) as the existing dock UI elements, with accent coloring to distinguish it as a primary action
