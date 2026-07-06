# Schips (Fate Points)

> Source: `docs/_specs/schips-feature.md`

## ADDED Requirements

### Requirement: Schips display below secondary stats

The actor sheet SHALL render a Schips display section below the `profile-secondary-stats` div, styled consistently with other profile stats. It SHALL show a clover icon (`fa-clover`), the label "Schips", and the current/max display `{{actor.system.schips.schips_stern}} / {{actor.system.schips.schips}}`.

#### Scenario: Viewing actor sheet

- **WHEN** an actor sheet is rendered
- **THEN** the Schips display is visible below the secondary stats with the clover icon and current/max values

### Requirement: Increment button increases current Schips

A plus button (`fa-plus`) SHALL increment `system.schips.schips_stern` by 1, capped at `system.schips.schips` (the maximum).

#### Scenario: Incrementing Schips within limit

- **WHEN** the user clicks the plus button and current Schips is 3 with max 5
- **THEN** current Schips updates to 4

#### Scenario: Incrementing at maximum

- **WHEN** the user clicks the plus button and current Schips equals the maximum
- **THEN** no change occurs (capped at max)

### Requirement: Decrement button decreases current Schips

A minus button (`fa-minus`) SHALL decrement `system.schips.schips_stern` by 1, with a minimum of 0.

#### Scenario: Decrementing Schips above 0

- **WHEN** the user clicks the minus button and current Schips is 2
- **THEN** current Schips updates to 1

#### Scenario: Decrementing at 0

- **WHEN** the user clicks the minus button and current Schips is 0
- **THEN** no change occurs (minimum 0)

### Requirement: Buttons only active in editable mode

The increment and decrement buttons SHALL only be registered as event listeners when `this.isEditable` is true.

#### Scenario: View-only mode

- **WHEN** the sheet is in view-only mode
- **THEN** the Schips buttons have no click handlers

### Requirement: Updates via actor.update

Both increment and decrement SHALL persist changes via `this.actor.update({'system.schips.schips_stern': newValue})`.

#### Scenario: Schips value changed

- **WHEN** the user clicks increment or decrement
- **THEN** the actor's `system.schips.schips_stern` is updated and the display refreshes
