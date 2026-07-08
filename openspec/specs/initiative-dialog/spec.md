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

The PC dialog SHALL present a dashboard-style interface with three sections: action cards, dice rolling, and a formula breakdown. Actions SHALL be displayed as clickable cards showing icon, name, and INI modifier. Selecting a card SHALL toggle it (up to 2 actions). The weapon dropdown SHALL be displayed below the action cards when in the FRESH state. A "Kombinierte Aktion" checkbox SHALL reduce AT and VT by 4 each when checked. The formula breakdown SHALL display a live calculation: `Basis + Aktion + Waffe + Mod + Würfel = Ergebnis`.

#### Scenario: Action card selected

- **WHEN** the user clicks an action card
- **THEN** the card is highlighted as selected, the action's INI modifier is reflected in the formula breakdown, and the live total updates

#### Scenario: Two actions selected and deselected

- **WHEN** the user selects 2 action cards and then clicks one of them again
- **THEN** that card is deselected, and the formula updates to reflect only the remaining action

#### Scenario: Attempt to select third action

- **WHEN** the user has 2 actions selected and clicks a third
- **THEN** the third card is NOT selected, and a notification or visual cue indicates the limit

#### Scenario: Combined action checkbox checked

- **WHEN** the user checks "Kombinierte Aktion (-4 AT/VT)"
- **THEN** the AT and VT preview in the formula breakdown each show a -4 reduction

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

### Requirement: Negative initiative locks action and weapon

When a combatant confirms initiative and the total is negative, the dialog SHALL enter a LOCKED state. In this state: the selected action and weapon are frozen; the action card shows a lock icon and the text "verzögert um X Runden"; all other action cards are grayed out and not clickable; the weapon is displayed as locked text, not a dropdown. The manual INI modifier (iniMod) SHALL remain editable. The formula SHALL change to `Übertrag + Basis + Mod + Würfel = Ergebnis` without re-applying action or weapon INI penalties.

#### Scenario: Initiative is negative on confirm

- **WHEN** the user clicks "INI ansagen" and the calculated initiative is -2
- **THEN** the dialog closes, the effect is created with the locked action's AT/VT modifiers, the `dialogState` flag stores `movedAction: true`, `carryOver: -2`, `lockedActionId`, and `lockedWeaponId`, and the dialog state persists

#### Scenario: Locked dialog reopens next round

- **WHEN** the round changes and the dialog reopens for a locked combatant
- **THEN** the dialog renders in LOCKED state: the locked action card shows a lock icon with "verzögert um 1 Runde", other actions are grayed out, the weapon is displayed as text, and the formula shows `Übertrag + Basis + Mod + Würfel`

#### Scenario: Manual INI modifier editable in locked state

- **WHEN** the dialog is in LOCKED state
- **THEN** the INI-Modifikator input field is enabled and changes update the live formula

#### Scenario: Locked action resolves (positive initiative)

- **WHEN** a combatant in LOCKED state confirms initiative and the total is positive
- **THEN** the effect is applied with the locked action's AT/VT modifiers, the combatant acts this round, and the `dialogState` is cleared (including `movedAction`, `carryOver`, `lockedActionId`, `lockedWeaponId`)

#### Scenario: Locked action remains negative

- **WHEN** a combatant in LOCKED state confirms initiative and the total is still negative
- **THEN** the effect is created/updated with `duration.turns = 2`, `movedActionRounds` increments, `carryOver` is updated to the new negative total, and the locked action/weapon remain frozen

### Requirement: Round change reopens dialogs with locked-state awareness

The `updateCombat` Hook SHALL detect round changes via `"round" in updateData`. The GM SHALL reset initiative to `null` for all combatants. Dialogs SHALL reopen for all combatants: combatants with `dialogState.movedAction === true` SHALL see the LOCKED state dialog; all others SHALL see the FRESH state dialog.

#### Scenario: New round with locked combatant

- **WHEN** `updateCombat` fires with a round change and one combatant has `dialogState.movedAction = true`
- **THEN** that combatant's dialog renders in LOCKED state; all other combatants render in FRESH state

#### Scenario: New round with no locked combatants

- **WHEN** `updateCombat` fires with a round change and no combatants have `dialogState.movedAction = true`
- **THEN** all dialogs render in FRESH state

### Requirement: Initiative formula uses correct carry-over logic

The initiative calculation SHALL differ between FRESH and LOCKED states. In FRESH state: `totalIni = baseIni + actionIniMod + weaponIniMod + iniMod + diceResult`. In LOCKED state: `totalIni = carryOver + baseIni + iniMod + diceResult`. Action and weapon INI modifiers SHALL NOT be re-applied in LOCKED state. `baseIni` SHALL be used instead of `currentIni` to avoid double-counting active effects from previous rounds.

#### Scenario: FRESH state calculation

- **WHEN** a combatant has baseIni=4, selects an action with iniMod=-2, selects a weapon with iniMod=0, sets iniMod=1, and rolls a 5
- **THEN** the total initiative is `4 + (-2) + 0 + 1 + 5 = 8`

#### Scenario: LOCKED state calculation with positive result

- **WHEN** a locked combatant has carryOver=-2, baseIni=4, iniMod=0, and rolls a 5
- **THEN** the total initiative is `(-2) + 4 + 0 + 5 = 7`

#### Scenario: LOCKED state calculation with still-negative result

- **WHEN** a locked combatant has carryOver=-2, baseIni=4, iniMod=0, and rolls a 1
- **THEN** the total initiative is `(-2) + 4 + 0 + 1 = 3` (positive, acts this round)

### Requirement: Formula breakdown displays live calculation

The dialog SHALL display a formula breakdown area that updates live as the user makes selections. The breakdown SHALL show the individual components (Basis, Aktion, Waffe, Mod, Würfel) with their current values and the running total. In LOCKED state, the breakdown SHALL show "Übertrag" instead of "Aktion" and "Waffe", and the total SHALL use the carry-over formula.

#### Scenario: Live formula update on action selection

- **WHEN** the user selects an action card with INI modifier -2
- **THEN** the formula breakdown updates to show `4 + (-2) + 0 + 0 + ▢ = 2` (before dice are rolled)

#### Scenario: Live formula update on dice roll

- **WHEN** the user rolls dice and selects a result of 5
- **THEN** the formula breakdown updates to show `4 + (-2) + 0 + 0 + 5 = 7`

#### Scenario: Locked state formula display

- **WHEN** the dialog is in LOCKED state with carryOver=-2 and baseIni=4
- **THEN** the formula breakdown shows `(-2) + 4 + 0 + ▢ = 2` (before dice)

### Requirement: Locked action card shows delay information

In LOCKED state, the locked action card SHALL display a lock icon, the action name, the locked weapon name, the text "INI X (bezahlt)" where X is the original INI penalty, and the text "verzögert um N Runden" where N is `movedActionRounds`. Other action cards SHALL be rendered in a grayed-out, non-interactive state.

#### Scenario: Locked card display after one round of delay

- **WHEN** a combatant has been locked for 1 round with action "Wuchtschlag" (INI -8) and weapon "Langschwert"
- **THEN** the locked card shows: lock icon, "Wuchtschlag", "Langschwert", "INI -8 (bezahlt)", "verzögert um 1 Runde"

#### Scenario: Locked card display after multiple rounds of delay

- **WHEN** a combatant has been locked for 3 rounds
- **THEN** the locked card shows "verzögert um 3 Runden"

### Requirement: Active effect merges modifiers with correct formula

All modifiers SHALL be merged into a single Active Effect named "Kampf-Modifikatoren Runde X" with icon `icons/svg/dice-target.svg`. In FRESH state, the effect SHALL contain the INI change (`iniMod + diceResult`), AT modifier, and VT modifier. In LOCKED state, the effect SHALL contain only the carry-over INI change plus the locked action's AT/VT modifiers (not the action's INI penalty). Before creating a new effect for a given round, any existing effect with the same name SHALL be deleted to avoid duplicates.

#### Scenario: FRESH state effect creation

- **WHEN** a combatant in FRESH state confirms with iniMod=1, diceResult=5, atMod=2, vtMod=-1
- **THEN** the effect contains changes: `system.abgeleitete.ini` = +6, `system.modifikatoren.nahkampfmod` = +2, `system.modifikatoren.verteidigungmod` = -1, with `duration.turns = 1`

#### Scenario: LOCKED state effect creation

- **WHEN** a locked combatant confirms with carryOver=-2, baseIni=4, diceResult=5, and the locked action has AT=-4, VT=+2
- **THEN** the effect contains changes for the INI delta and the locked action's AT/VT modifiers, with `duration.turns = 1`

#### Scenario: Duplicate effect cleanup

- **WHEN** a new effect "Kampf-Modifikatoren Runde 3" is about to be created
- **THEN** any existing effect with that exact name on the actor is deleted first
