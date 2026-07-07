## Why

The current initiative dialog is a form-based interface that feels mechanical and unintuitive. More critically, the negative-initiative carry-over formula is incorrect — it double-counts action/weapon penalties across rounds, making it nearly impossible for a combatant to ever recover from negative initiative. The combat system requires: initiative is rolled every round, and if a result is negative, the combatant's action is locked (same action, same weapon) and delayed to the next round where only their base INI and a fresh dice roll are added to the carried-over negative value.

## What Changes

- **Fix the negative-initiative carry-over formula**: Penalties from actions and weapons are only applied once (the round they were chosen). When locked, the formula becomes `carryOver + baseIni + manualMod + dice` — no re-application of action/weapon INI penalties.
- **Introduce locked action/weapon state**: When initiative is negative, the selected action and weapon are frozen. The player cannot change them in subsequent rounds until their initiative becomes positive and the action resolves.
- **Redesign the PC dialog UI as a combat dashboard**: Replace the form-based layout with clickable action cards, large visual dice, and a live formula breakdown. The UI clearly distinguishes between the normal FRESH state and the LOCKED state.
- **Keep manual INI modifier available in locked state**: Situational modifiers (terrain, distraction, etc.) can still be applied round-to-round even while an action is locked.
- **Improved effect management**: Effects are named with the specific round number, and stale effects from previous rounds are properly cleaned up.

## Capabilities

### New Capabilities

None — this is a redesign of existing functionality.

### Modified Capabilities

- `initiative-dialog`: Core initiative calculation formula changes for negative-initiative carry-over. Locked action/weapon state replaces the simple "disable all inputs" approach. UI redesigned from form-based to dashboard with action cards, visual dice, and live formula breakdown. Effect naming and cleanup improved.

## Impact

- `scripts/apps/initiative-dialog.js` — Complete rewrite of the PC dialog: new UI structure, corrected calculation logic, locked-state state machine
- `scripts/apps/mass-initiative-dialog.js` — Updated `_calculateTotalInitiative` to match corrected formula; locked-state support for NPCs
- `scripts/apps/negative-initiative-dialog.js` — May need updates to match new state machine; or could be replaced by inline locked-state behavior
- `templates/apps/initiative-dialog.hbs` — Complete rewrite to dashboard layout with action cards, dice display, formula breakdown
- `styles/initiative-dialog.css` — Significant redesign for new dashboard layout, action cards, dice faces, locked-state styling
- `module.js` — `InitiativeDialogManager`, `updateCombat` hook, `combatTurnChange` hook, and `combatStart` hook may need adjustments for new flow (e.g., locked combatants should not get fresh dialogs, they get locked-state dialogs)
- `openspec/specs/initiative-dialog/spec.md` — Delta spec updating the negative-initiative, locked-state, and UI requirements
