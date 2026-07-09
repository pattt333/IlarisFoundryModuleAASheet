## 1. Fix Round-Change Hook

- [x] 1.1 In `module.js` `updateCombat` hook (round-change branch), filter `allCombatants` to only NPCs (`!c.actor?.hasPlayerOwner`) before calling `InitiativeDialogManager.openDialog()`

## 2. Replace Button Interception with `preUpdateCombatant` Hook

- [x] 2.1 Remove the entire `renderCombatTracker` hook (button cloning and event listener attachment) from `module.js`
- [x] 2.2 Add `preUpdateCombatant` hook in `module.js` that checks for `initiative` in `updateData`, skips if `options.ilarisInitiativeDialog` is true, returns `false` to prevent auto-roll, and opens appropriate dialogs via `InitiativeDialogManager.openDialog()`
- [x] 2.3 In `scripts/apps/mass-initiative-dialog.js` `_commitAllInitiatives()`, pass `{ ilarisInitiativeDialog: true }` as third argument to `this.combat.setInitiative()`
- [x] 2.4 In `scripts/apps/initiative-dialog.js` `_onIniAnsagen()`, pass `{ ilarisInitiativeDialog: true }` as third argument to `this.combat.setInitiative()`

## 3. Verify

- [x] 3.1 Verify clicking initiative button in encounter opens dialogs instead of auto-rolling
- [x] 3.2 Verify round change only opens mass NPC dialog (no PC auto-open)
- [x] 3.3 Verify dialog's "INI ansagen" sets initiative without triggering recursive interception
