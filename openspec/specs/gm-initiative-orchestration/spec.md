# GM Initiative Orchestration

## Purpose

Enable the GM to open all PC initiative dialogs and the mass NPC dialog simultaneously from a single initiative button click.

## Requirements

### Requirement: GM can open all PC dialogs by clicking individual buttons

When the GM clicks the initiative roll button for a specific held-type combatant, the capture-phase DOM listener SHALL intercept the click and open an `InitiativeDialog` for that specific PC only. The GM SHALL NOT see all PC dialogs open simultaneously from a single click — each PC dialog requires an explicit click on that PC's initiative button.

#### Scenario: GM clicks initiative button for a specific PC

- **WHEN** the GM clicks the initiative roll button for a specific held-type combatant
- **THEN** only that PC's initiative dialog opens; no other PC or NPC dialogs open

#### Scenario: GM clicks NPC initiative button

- **WHEN** the GM clicks the initiative roll button for an NPC
- **THEN** the mass NPC card-grid dialog opens for all NPCs; no PC dialogs open

### Requirement: Player-only flow is unchanged

When a non-GM user clicks the initiative roll button, the behavior SHALL remain unchanged: only the player's own PC dialog opens (based on `actor.isOwner`). Non-GM users SHALL NOT see the mass NPC dialog or other players' PC dialogs.

#### Scenario: Player clicks initiative for their PC

- **WHEN** a non-GM player who owns a held-type actor clicks the initiative button
- **THEN** only that player's PC initiative dialog opens; no other PC dialogs and no mass NPC dialog appear
