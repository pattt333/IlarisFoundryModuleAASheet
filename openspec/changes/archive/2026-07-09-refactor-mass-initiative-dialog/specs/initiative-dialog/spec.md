# Initiative Dialog (Delta)

## MODIFIED Requirements

### Requirement: Dialog persists input state until confirmed

Dialog input values SHALL be persisted in `actor.flags.ilaris-alternative-actor-sheet.dialogState` until the "INI ansagen" button is clicked. The `InitiativeStateManager` class SHALL provide `persistState(actor, state)` and `loadState(actor)` methods used by both `InitiativeDialog` and `MassInitiativeDialog`. Clicking "Abbrechen" or closing the dialog (X button) SHALL discard unsaved changes. Only clicking "INI ansagen" SHALL persist the state and apply the effect. For negative initiative results, state SHALL persist (locked state) even after "INI ansagen" commits.

#### Scenario: User fills dialog and closes without confirming

- **WHEN** a user enters values in the dialog and closes it without clicking "INI ansagen"
- **THEN** the values are discarded; reopening the dialog shows the last committed state

#### Scenario: User clicks INI ansagen

- **WHEN** the user clicks "INI ansagen"
- **THEN** the dialog closes, the active effect is applied via InitiativeStateManager, the initiative is set in the combat tracker, a ChatMessage is posted, and the state is persisted (or cleared for positive results)

### Requirement: Initiative dialog opens on encounter dice roll

When a user clicks the initiative roll button in the Foundry encounter screen, the module SHALL intercept and open a custom dialog. For PC tokens (`type === "held"`), a single-actor dialog opens. For NPC tokens selected by a GM, a mass dashboard dialog opens for all NPCs. Both dialogs SHALL use `InitiativeStateManager` for state persistence, initiative calculation, dice rolling, and effect creation.

#### Scenario: Player clicks initiative for their PC

- **WHEN** a player clicks the initiative button for their held-type actor
- **THEN** the single-actor `InitiativeDialog` opens for that character, using InitiativeStateManager for backend logic

#### Scenario: GM clicks initiative for NPCs

- **WHEN** a GM clicks the initiative button
- **THEN** the `MassInitiativeDialog` card-grid dashboard opens for all NPC combatants, using InitiativeStateManager for backend logic

### Requirement: Negative initiative locks action and weapon

When a combatant confirms initiative and the total is negative, the dialog SHALL enter a LOCKED state. In this state: for the PC dialog, the selected action and weapon are frozen; for the mass dialog, the card collapses to show only the locked action chip, INI-Mod, and dice. The manual INI modifier (iniMod) SHALL remain editable. The `InitiativeStateManager` SHALL handle the carry-over calculation (`carryOver + baseIni + iniMod + diceResult`) for both dialogs.

#### Scenario: Initiative is negative on confirm (mass dialog)

- **WHEN** the GM clicks "INI ansagen" for an NPC and the calculated initiative is -2
- **THEN** the dialog closes, the effect is created by InitiativeStateManager, the `dialogState` flag stores `movedAction: true`, `carryOver: -2`, `lockedActionId`, and the NPC's card shows locked state on next open

#### Scenario: Locked mass dialog card reopens next round

- **WHEN** the round changes and the mass dialog reopens with a locked NPC
- **THEN** that NPC's card renders collapsed: red-tinted border, lock icon, "⏱️ Verzögert — X. Runde" subtitle, locked action chip (non-interactive), editable INI-Mod, and active dice section
