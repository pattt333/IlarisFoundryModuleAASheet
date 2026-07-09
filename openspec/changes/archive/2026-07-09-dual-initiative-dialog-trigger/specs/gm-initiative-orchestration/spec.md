# GM Initiative Orchestration

## Purpose

Enable the GM to open all PC initiative dialogs and the mass NPC dialog simultaneously from a single initiative button click.

## ADDED Requirements

### Requirement: GM sees all PC dialogs on initiative trigger

When the GM triggers the initiative roll for all combatants, `InitiativeDialogManager.openDialog()` SHALL render individual `InitiativeDialog` instances for every held-type combatant (`hasPlayerOwner === true`) in addition to the `MassInitiativeDialog` for NPCs. The GM SHALL see each PC dialog as a separate floating window alongside the mass NPC dialog.

#### Scenario: GM clicks initiative with 3 PCs and 4 NPCs

- **WHEN** the GM clicks the initiative button with 3 held-type combatants and 4 kreatur-type combatants in the encounter
- **THEN** 3 individual PC initiative dialogs open for the GM, plus the mass NPC card-grid dialog with 4 cards

#### Scenario: GM clicks initiative with only PCs

- **WHEN** the GM clicks the initiative button with only held-type combatants (no NPCs)
- **THEN** individual PC initiative dialogs open for each PC; no mass NPC dialog opens

#### Scenario: GM clicks initiative with only NPCs

- **WHEN** the GM clicks the initiative button with only kreatur-type combatants (no PCs)
- **THEN** only the mass NPC card-grid dialog opens; no individual PC dialogs

### Requirement: Player-only flow is unchanged

When a non-GM user triggers the initiative roll, the behavior SHALL remain unchanged: only the player's own PC dialog opens (based on `actor.isOwner`). Non-GM users SHALL NOT see the mass NPC dialog or other players' PC dialogs.

#### Scenario: Player clicks initiative for their PC

- **WHEN** a non-GM player who owns a held-type actor clicks the initiative button
- **THEN** only that player's PC initiative dialog opens; no other PC dialogs and no mass NPC dialog appear
