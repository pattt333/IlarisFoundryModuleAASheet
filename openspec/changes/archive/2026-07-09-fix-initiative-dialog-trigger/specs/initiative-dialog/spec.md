# Initiative Dialog (Delta)

## MODIFIED Requirements

### Requirement: Initiative dialog opens on encounter dice roll

When a user clicks the initiative roll button in the Foundry encounter screen, the module SHALL intercept via the `preUpdateCombatant` hook and open a custom dialog instead of auto-rolling. For PC tokens (`type === "held"`), a single-actor dialog opens for the actor owner — including the GM if they are an owner. For NPC tokens selected by a GM, a mass dashboard dialog opens for all NPCs. When the GM triggers initiative, both PC dialogs AND the mass NPC dialog SHALL open simultaneously. The interception SHALL NOT fire when initiative is being set by the custom dialog itself (detected via `options.ilarisInitiativeDialog` flag).

#### Scenario: Player clicks initiative for their PC

- **WHEN** a player clicks the initiative button for their held-type actor
- **THEN** the `preUpdateCombatant` hook prevents Foundry's auto-roll, and the single-actor `InitiativeDialog` opens for that character

#### Scenario: GM clicks initiative for all combatants

- **WHEN** a GM clicks the initiative button with both held-type and kreatur-type combatants present
- **THEN** the `preUpdateCombatant` hook prevents Foundry's auto-roll, individual `InitiativeDialog` windows open for every PC, AND the `MassInitiativeDialog` card-grid dashboard opens for all NPCs

#### Scenario: Dialog sets initiative without re-intercepting

- **WHEN** our custom dialog commits initiative via `combat.setInitiative(id, value, { ilarisInitiativeDialog: true })`
- **THEN** the `preUpdateCombatant` hook sees the flag and allows the update through without interception

### Requirement: Round change reopens dialogs with locked-state awareness

The `updateCombat` Hook SHALL detect round changes via `"round" in updateData`. The GM SHALL reset initiative to `null` for all combatants. Only the mass NPC dialog SHALL reopen for the GM on round change. PC dialogs SHALL only open when the initiative roll button is explicitly clicked by the player or GM. Combatants with `dialogState.movedAction === true` SHALL see the LOCKED state in their respective dialogs.

#### Scenario: New round with locked NPC

- **WHEN** `updateCombat` fires with a round change and one NPC has `dialogState.movedAction = true`
- **THEN** the mass NPC dialog reopens for the GM with that NPC's card in locked state; no PC dialogs open automatically

#### Scenario: New round — PC dialogs do not auto-open

- **WHEN** `updateCombat` fires with a round change
- **THEN** no PC initiative dialogs open for the GM automatically; the GM must explicitly click the initiative button to open them
