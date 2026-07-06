# Stack Effects

> Source: `docs/_specs/stack-effects-feature.md`

## ADDED Requirements

### Requirement: Stack effects detected by name convention

Effects whose `name` contains the substring "Stack" SHALL be treated as stackable effects. The stack count SHALL be determined by `effect.changes.length` (1-5). All changes within a stack effect SHALL have the same `key` and `mode`.

#### Scenario: Effect named "Brennen Stack"

- **WHEN** an effect named "Brennen Stack" with 3 changes is present on an actor
- **THEN** the effect is recognized as a stack effect with 3 stacks

#### Scenario: Effect without "Stack" in name

- **WHEN** an effect named "Verwundet" is present
- **THEN** the effect is not treated as a stack effect

### Requirement: Auto-stacking on effect drop

When an effect with "Stack" in its name is dropped onto an actor and an effect with the same name already exists, the system SHALL increment the existing effect's stack count instead of creating a duplicate. If no existing stack effect matches, the effect SHALL be created normally.

#### Scenario: Adding stack to existing stack effect

- **WHEN** "Brennen Stack" is dropped and "Brennen Stack" with 2 stacks already exists
- **THEN** the existing effect's stack count increases to 3 and duration resets to 3 turns

#### Scenario: Adding new stack effect

- **WHEN** "Gift Stack" is dropped and no "Gift Stack" effect exists
- **THEN** a new "Gift Stack" effect is created with 1 change (1 stack)

### Requirement: Stack maximum is 5

Stack effects SHALL cap at 5 stacks. At maximum stacks, further drops SHALL only refresh the duration to 3 turns without increasing the stack count.

#### Scenario: Adding to max stack (5 stacks)

- **WHEN** "Brennen Stack" is dropped and "Brennen Stack" already has 5 stacks
- **THEN** a warning notification "hat bereits maximale Stacks (5). Nur Duration aufgefrischt" is shown and duration is reset to 3

### Requirement: Stack decrease removes last change

Decreasing a stack effect SHALL remove the last change from the `changes` array. At 1 stack, the effect SHALL be deleted entirely.

#### Scenario: Decreasing a 3-stack effect

- **WHEN** the user decreases a stack effect with 3 changes
- **THEN** the effect is updated with 2 changes (stack count 2)

#### Scenario: Decreasing a 1-stack effect

- **WHEN** the user decreases a stack effect with 1 change
- **THEN** the effect is deleted and a notification "entfernt (0 Stacks)" is shown

### Requirement: Duration refreshes on stack increase

When a stack effect's count increases (including at max stacks), the duration SHALL reset to `duration.turns = 3`.

#### Scenario: Stack increased on existing effect

- **WHEN** a 2-stack "Brennen Stack" with 1 remaining turn receives a new stack
- **THEN** duration is set to 3 turns

### Requirement: Stack controls in effect card UI

The effect card template SHALL render increment (`effect-stack-increase`) and decrement (`effect-stack-decrease`) buttons for stack effects, bound to the actor sheet's event handlers.

#### Scenario: Clicking stack increase button

- **WHEN** the user clicks the plus button on a stack effect card
- **THEN** `_increaseEffectStack` is called with the effect

#### Scenario: Clicking stack decrease button

- **WHEN** the user clicks the minus button on a stack effect card
- **THEN** `_decreaseEffectStack` is called with the effect
