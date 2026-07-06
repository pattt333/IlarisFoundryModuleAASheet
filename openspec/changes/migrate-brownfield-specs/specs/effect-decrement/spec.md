# Effect Decrement (Time Advance)

> Source: `docs/_specs/effect-decrement-button.md`

## ADDED Requirements

### Requirement: Actor sheet has "Zeit vorrücken" button

The effects tab on the actor sheet SHALL include a "Zeit vorrücken" button with a stopwatch icon (`fa-stopwatch`), positioned left of the "Effekt Bibliothek" button. The button SHALL be visible only when `this.actor.isOwner` is true.

#### Scenario: Owner views effects tab

- **WHEN** an actor owner opens the effects tab
- **THEN** the "Zeit vorrücken" button is visible

#### Scenario: Non-owner views effects tab

- **WHEN** a non-owner views the effects tab
- **THEN** the "Zeit vorrücken" button is hidden

### Requirement: Zeit vorrücken decrements temporary effect durations

The `_onEffectAdvanceTime` method SHALL filter `this.actor.effects` for effects where `duration.turns > 0` OR `duration.rounds > 0` (both must be positive integers), decrement both fields by 1 for matched effects, and perform a batch update via `actor.updateEmbeddedDocuments("ActiveEffect", updates)`.

#### Scenario: Actor has temporary effects

- **WHEN** the user clicks "Zeit vorrücken" and the actor has effects with remaining turns/rounds
- **THEN** all temporary effect durations are decremented by 1 and a success notification is shown: "Temporäre Effekte wurden um 1 Zeiteinheit reduziert"

#### Scenario: Actor has no temporary effects

- **WHEN** the user clicks "Zeit vorrücken" and no effects have `turns > 0` or `rounds > 0`
- **THEN** a notification "Keine temporären Effekte vorhanden" is shown

#### Scenario: Update fails

- **WHEN** the `updateEmbeddedDocuments` call fails
- **THEN** an error notification is shown

### Requirement: GM scene control button advances time for all actors

A scene control button SHALL be registered via `Hooks.on("getSceneControlButtons")` that is visible only to GMs (`game.user.isGM`). It SHALL appear in the token controls section with tooltip "Zeit vorrücken (Alle Actoren)".

#### Scenario: GM clicks scene control button

- **WHEN** a GM clicks the "Zeit vorrücken (Alle Actoren)" scene control button
- **THEN** all token actors on the active scene have their temporary effect durations decremented by 1

#### Scenario: Non-GM views scene controls

- **WHEN** a non-GM user views the scene controls
- **THEN** the "Zeit vorrücken" button is not visible

#### Scenario: No active scene

- **WHEN** the GM clicks the button but no scene is active (`canvas.scene` is null)
- **THEN** a warning notification "Keine aktive Szene vorhanden" is shown

### Requirement: Scene control iterates all scene tokens including synthetic actors

The `advanceTimeForAllActors` function SHALL iterate over `canvas.scene.tokens`, extract each token's actor (including synthetic actors), and apply the same effect filtering and batch update logic as the actor sheet button.

#### Scenario: Tokens with temporary effects

- **WHEN** the scene has 3 tokens with temporary effects totaling 5 effects
- **THEN** all 5 effects are decremented, and console logs "Advanced time: 3 actors, 5 effects reduced"

#### Scenario: No tokens have temporary effects

- **WHEN** the scene has tokens but no temporary effects
- **THEN** a notification "Keine temporären Effekte auf der Szene vorhanden" is shown
