## 1. Shared weapon/Angriff loading logic

- [x] 1.1 Add `loadAvailableWeapons(actor)` static method to `scripts/apps/initiative-state-manager.js` that returns normalized weapon/Angriff objects for any actor type
- [x] 1.2 For `held` actors: load nahkampfwaffe/fernkampfwaffe items filtered by hauptwaffe/nebenwaffe (extracted from `InitiativeDialog._loadAvailableWeapons`)
- [x] 1.3 For `kreatur` actors: normalize `system.angriffe` entries to virtual weapon shape with inferred nah/fern type based on rw and eigenschaften
- [x] 1.4 Add `getWeaponIniModifier(weaponOrAngriff)` static method that returns INI modifier (currently 0 for angriffe, extracted from actor modifiers for PC weapons)

## 2. Action gating (shared logic)

- [x] 2.1 Extract `_applyWeaponGating(weapon, availableActions)` from `scripts/apps/initiative-dialog.js` into `InitiativeStateManager.applyWeaponGating(weapon, availableActions)`
- [x] 2.2 Update `InitiativeDialog` to call the shared `applyWeaponGating` instead of its private method
- [x] 2.3 Add helper `hasWeaponRequiredAction(selectedActionIds, availableActions)` to check if any selected action has a non-empty `bedingungen.waffentyp`

## 3. Mass dialog: weapon/Angriff loading and state

- [x] 3.1 In `scripts/apps/mass-initiative-dialog.js`, add `availableWeapons` map (keyed by combatantId → weapon/Angriff array) in constructor
- [x] 3.2 Load weapons/Angriffe for all combatants in `_prepareContext` using `InitiativeStateManager.loadAvailableWeapons(actor)`
- [x] 3.3 Add `selectedWeaponId` to each NPC's state (read from persisted `dialogState`, default empty string)
- [x] 3.4 Persist `selectedWeaponId` changes via `InitiativeStateManager.persistState`

## 4. Mass dialog: weapon/Angriff dropdown (template + CSS)

- [x] 4.1 Add weapon/Angriff dropdown row to `templates/apps/mass-initiative-dialog.hbs` between action chips and modifier row, using `selectOptions` helper
- [x] 4.2 Disable dropdown when NPC is in locked state
- [x] 4.3 Add styling for `.weapon-select-row` in `styles/mass-initiative-dialog.css`

## 5. Mass dialog: action gating integration

- [x] 5.1 Apply `applyWeaponGating` to each NPC's available actions in `_prepareContext`, using the NPC's selected weapon/Angriff
- [x] 5.2 Pass gating state (grayedOut, grayedOutReason) to template for multi-select option rendering
- [x] 5.3 Add event listener for weapon/Angriff dropdown changes, re-render card on change
- [x] 5.4 Pass weapon INI modifier to `calculateTotalInitiative` only when `hasWeaponRequiredAction` is true

## 6. Mass dialog: batch apply with Angriff compatibility

- [x] 6.1 In `#onBatchApply`, check if selected action has waffentyp requirement
- [x] 6.2 If yes: for each NPC, auto-select first Angriff (if none selected), check type match, apply action only if compatible
- [x] 6.3 If no waffentyp requirement: apply action as before (no Angriff auto-select)

## 7. Mass dialog: formula and tooltip updates

- [x] 7.1 Update `InitiativeStateManager.getFormulaParts` to include "Waffe" row when weapon is selected and action requires it
- [x] 7.2 Update tooltip HTML in `_onTooltipShow` to include weapon row
- [x] 7.3 Update summary chat message in `_commitAllInitiatives` to include selected weapon/Angriff name

## 8. Verify

- [ ] 8.1 Test: kreatur NPC with nah Angriff + action requiring nahkampfwaffe → action selectable
- [ ] 8.2 Test: kreatur NPC with nah Angriff + action requiring fernkampfwaffe → action grayed out
- [ ] 8.3 Test: held PC (unowned) in mass dialog → weapon dropdown shows items
- [ ] 8.4 Test: batch apply with weapon-gated action → compatible NPCs get action, incompatible skipped
- [ ] 8.5 Test: weapon INI modifier only applied when action requires weapon
- [ ] 8.6 Test: no regressions in single-PC initiative dialog weapon selection
