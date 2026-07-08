## 1. Data Model — dialogState Flag Migration

- [x] 1.1 Add `carryOver`, `lockedActionId`, `lockedWeaponId` fields to `_loadPersistedState()` in `scripts/apps/initiative-dialog.js`
- [x] 1.2 Add migration logic: detect old-format `dialogState` (missing `carryOver`) and reset to defaults or map `movedActionRounds * baseIni` to `carryOver` if possible
- [x] 1.3 Update `_savePersistedState()` to include new fields in `scripts/apps/initiative-dialog.js`
- [x] 1.4 Add new fields to `_initializeNpcState()` and `_saveNpcState()` in `scripts/apps/mass-initiative-dialog.js`

## 2. Formula Correction

- [x] 2.1 Rewrite `_calculateTotalInitiative()` in `scripts/apps/initiative-dialog.js`: FRESH formula uses `baseIni` not `currentIni`; LOCKED formula uses `carryOver + baseIni + iniMod + diceResult` without re-applying action/weapon penalties
- [x] 2.2 Rewrite `_calculateTotalInitiative(combatantId)` in `scripts/apps/mass-initiative-dialog.js` with same formula corrections
- [x] 2.3 Update `_onIniAnsagen()` in `scripts/apps/initiative-dialog.js`: set `carryOver` to negative total when locked; clear `carryOver`/`lockedActionId`/`lockedWeaponId` when resolving; use correct effect changes for locked state (AT/VT from locked action only)
- [x] 2.4 Remove the `baseIni * movedActionRounds` multiplier from all formula paths

## 3. Template — PC Dialog Dashboard (`templates/apps/initiative-dialog.hbs`)

- [x] 3.1 Replace modifier section number inputs with styled inputs in a compact row
- [x] 3.2 Replace action `<multi-select>` dropdown with a grid of clickable action cards showing icon, name, INI cost; selected cards get active class; locked card gets lock icon, delay text, and non-interactive state for other cards
- [x] 3.3 Replace dice results display with styled `.dice-face` elements that show pips (1-6) instead of plain numbers; add CSS animation class for roll transition
- [x] 3.4 Add formula breakdown area showing live calculation: `Basis + Aktion + Waffe + Mod + Würfel = Ergebnis` (FRESH) or `Übertrag + Basis + Mod + Würfel = Ergebnis` (LOCKED)
- [x] 3.5 Add locked-state conditional block: 🔒 icon, action name+weapon locked, "verzögert um N Runden" text, grayed-out other actions
- [x] 3.6 Ensure the "Kombinierte Aktion" checkbox and weapon dropdown only render in FRESH state (not locked)
- [x] 3.7 Ensure INI-Modifikator input stays enabled in both FRESH and LOCKED states

## 4. CSS — Dashboard Styling (`styles/initiative-dialog.css`)

- [x] 4.1 Add `.action-card` styles: grid layout, hover effect, selected state (colored border), disabled/locked state (grayed out, lock overlay)
- [x] 4.2 Add `.dice-face` styles: square cards with CSS-drawn pips (1-6), hover cursor for selectable dice, selected state highlight, animation keyframes for roll
- [x] 4.3 Add `.formula-breakdown` styles: horizontal bar with component tokens, operator separators, live total highlight
- [x] 4.4 Add locked-state visual indicators: red/orange tint to dialog header, lock icon styling, "verzögert" badge
- [x] 4.5 Update `.modifier-section`, `.weapon-section`, `.actions-section` to match new dashboard layout

## 5. JS Logic — InitiativeDialog Rewrite (`scripts/apps/initiative-dialog.js`)

- [x] 5.1 Add `activateListeners` handler for `.action-card` clicks: toggle selection (max 2), update formula breakdown live via DOM manipulation
- [x] 5.2 Refactor `_onRollDice()` to update dice face DOM elements with animation instead of text replacement
- [x] 5.3 Add `_updateFormulaBreakdown()` method that recomputes and updates the formula DOM based on current state (FRESH vs LOCKED)
- [x] 5.4 Add `isLocked()` getter that returns `movedAction === true`
- [x] 5.5 Update `getData()` to pass locked-state context: `isLocked`, `lockedAction`, `lockedWeapon`, `carryOver`, `movedActionRounds`
- [x] 5.6 Update effect creation in `_onIniAnsagen()`: delete existing effect with same name before creating new one; locked state effect uses only locked action's AT/VT modifiers (not action INI penalty)

## 6. Module Integration (`module.js`)

- [x] 6.1 Update `InitiativeDialogManager.openDialog()` to check `dialogState.movedAction` and pass locked context to dialog constructor
- [x] 6.2 Update `updateCombat` hook: before resetting initiatives, check for locked combatants and preserve their locked state; locked combatants get LOCKED dialog, others get FRESH dialog
- [x] 6.3 Review `combatTurnChange` hook: ensure `NegativeInitiativeDialog` still works correctly with the new locked state; or refactor to handle locked combatants inline
- [x] 6.4 Update MassInitiativeDialog mass-processing path to handle locked NPC states

## 7. Cleanup & Verification

- [ ] 7.1 Remove any dead code paths related to the old "disable all inputs" negative-initiative behavior
- [ ] 7.2 Test with empty states: no actions available, no weapons available, NPC-type actor in PC dialog
- [ ] 7.3 Test locked state cycle: negative → locked next round → positive (resolved)
- [ ] 7.4 Test locked state cycle: negative → locked next round → still negative → locked again
- [ ] 7.5 Test compendium-not-found scenario for actions loading
- [ ] 7.6 Verify ChatMessage format still works with new formula values
