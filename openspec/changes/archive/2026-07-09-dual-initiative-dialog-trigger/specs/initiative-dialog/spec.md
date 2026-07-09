# Initiative Dialog (Delta)

## MODIFIED Requirements

### Requirement: Initiative dialog opens on encounter dice roll

When a user clicks the initiative roll button in the Foundry encounter screen, the module SHALL intercept and open a custom dialog. For PC tokens (`type === "held"`), a single-actor dialog opens for the actor owner — including the GM if they are an owner. For NPC tokens selected by a GM, a mass dashboard dialog opens for all NPCs. When the GM triggers initiative, both PC dialogs AND the mass NPC dialog SHALL open simultaneously.

#### Scenario: Player clicks initiative for their PC

- **WHEN** a player clicks the initiative button for their held-type actor
- **THEN** the single-actor `InitiativeDialog` opens for that character, using InitiativeStateManager for backend logic

#### Scenario: GM clicks initiative for all combatants

- **WHEN** a GM clicks the initiative button with both held-type and kreatur-type combatants present
- **THEN** individual `InitiativeDialog` windows open for every PC, AND the `MassInitiativeDialog` card-grid dashboard opens for all NPCs
