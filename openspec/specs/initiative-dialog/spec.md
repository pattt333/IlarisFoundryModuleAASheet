# Initiative Dialog

## Purpose

Provide a custom initiative dialog for the Ilaris encounter system supporting modifiers, actions, weapon selection, and dice rolling before initiative confirmation.

## Requirements

### Requirement: Initiative dialog opens on encounter dice roll

When a user clicks the initiative roll button in the Foundry encounter screen, the module SHALL intercept and open a custom dialog. For PC tokens (`type === "held"`), a single-actor dialog opens. For NPC tokens selected by a GM, a mass dialog opens for all NPCs.

#### Scenario: Player clicks initiative for their PC

- **WHEN** a player clicks the initiative button for their held-type actor
- **THEN** the single-actor initiative dialog opens for that character

#### Scenario: GM clicks initiative for NPCs

- **WHEN** a GM clicks the initiative button
- **THEN** the mass initiative dialog opens for all NPC combatants

### Requirement: Dialog persists input state until confirmed

Dialog input values SHALL be persisted in `actor.flags.ilaris-alternative-actor-sheet.dialogState` until the "INI ansagen" button is clicked. Closing the dialog without confirming SHALL preserve the state. Only clicking "INI ansagen" SHALL clear the persisted state and apply the effect.

#### Scenario: User fills dialog and closes without confirming

- **WHEN** a user enters values in the dialog and closes it without clicking "INI ansagen"
- **THEN** the values are persisted and restored when the dialog reopens

#### Scenario: User clicks INI ansagen

- **WHEN** the user clicks "INI ansagen"
- **THEN** the dialog closes, the active effect is applied, the initiative is set in the combat tracker, a ChatMessage is posted, and the persisted dialog state is cleared

### Requirement: Initiative dialog collects modifiers and actions

The dialog SHALL provide input fields for: INI-Modifikator (default 0), AT-Modifikator (`system.modifikatoren.nahkampfmod`, default 0), and VT-Modifikator (`system.modifikatoren.verteidigungmod`, default 0). A checkbox for "Kombinierte Aktion" SHALL reduce AT and VT by 4 each when checked. An action dropdown SHALL allow selecting up to 2 actions from the actor's effect items and the nenneke-aktionen compendium.

#### Scenario: Combined action checkbox checked

- **WHEN** the user checks "Kombinierte Aktion (-4 AT/VT)"
- **THEN** the AT and VT total modifiers are each reduced by 4

#### Scenario: Two actions selected

- **WHEN** the user selects 2 actions from the dropdown
- **THEN** the lowest INI modifier from the actions' active effects is used, and AT/VT modifiers from both are summed

### Requirement: Weapon selection dropdown for PC dialog

The PC dialog SHALL include a "Waffenauswahl" dropdown listing weapons where `item.system.hauptwaffe === true` OR `item.system.nebenwaffe === true`. The dropdown SHALL not appear in the NPC mass dialog. The selected weapon's `computed.actorModifiers` SHALL be checked for `actionNegAugment`/`actionAugment` modifiers affecting `ini`.

#### Scenario: Weapon with INI modifier selected

- **WHEN** a weapon with an `actionNegAugment` modifier targeting `ini` with value 3 is selected
- **THEN** the base INI is reduced by 3

#### Scenario: No eligible weapons

- **WHEN** the actor has no weapons with `hauptwaffe` or `nebenwaffe` set to true
- **THEN** the dropdown shows only "keine Waffe" and is disabled

### Requirement: Dice rolling section with 1 or 2 dice option

The dialog SHALL include a dice section where the user selects "1 Würfel" or "2 Würfel (Auswahl nach Wurf)" and clicks "Würfeln" to roll d6s. With 2 dice, the user SHALL click one of the two results to select it before "INI ansagen" becomes available. When Foundry's "Manual Rolling" setting is active, the dice selection SHALL be hidden.

#### Scenario: Rolling 2 dice and selecting one

- **WHEN** the user selects "2 Würfel", clicks "Würfeln", and two d6 results are shown
- **THEN** clicking one die highlights it as the selected result, and the "INI ansagen" button becomes clickable

#### Scenario: Manual rolling mode enabled

- **WHEN** Foundry's core "Manual Rolling" setting is active
- **THEN** the dice count selection is not displayed

### Requirement: Negative initiative disables input fields

When a combatant has negative initiative (INI ≤ 0), all input fields and the action dropdown SHALL be disabled. The effect duration SHALL be set to `duration.turns = 2` instead of the default 1.

#### Scenario: Combatant has negative INI

- **WHEN** a combatant's calculated INI is negative
- **THEN** all dialog inputs are disabled and the effect gets `duration.turns = 2`

### Requirement: Round change reopens dialogs using updateCombat hook

The `updateCombat` Hook (not `combatRound`) SHALL detect round changes via `"round" in updateData` and trigger initiative resets and dialog re-opening on all connected clients.

#### Scenario: New combat round starts

- **WHEN** `updateCombat` fires with a `round` change in `updateData`
- **THEN** initiative values are reset and dialogs reopen for all combatants on all connected clients

### Requirement: Active effect merges all modifiers into single effect

All modifiers (INI, AT, VT, actions, weapon, dice) SHALL be merged into a single Active Effect named "Kampf-Modifikatoren Runde X" with icon `icons/svg/dice-target.svg`.

#### Scenario: Applying modifiers

- **WHEN** the user clicks "INI ansagen" with all fields filled
- **THEN** a single Active Effect is created containing all modifier changes, with duration `turns: 1` (or 2 for negative INI)
