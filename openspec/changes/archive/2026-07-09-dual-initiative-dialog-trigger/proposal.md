## Why

When the GM clicks the initiative button, only the mass NPC dialog opens. PC initiative dialogs are only shown to individual players. This forces the GM to either wait for each player to process their dialog, or process PC initiatives manually. For groups where the GM manages all initiative centrally, the GM should see both the PC dialogs and the mass NPC dialog simultaneously from a single click.

## What Changes

- Modify `InitiativeDialogManager.openDialog()` in `module.js` so that when the GM triggers initiative, PC dialogs also open for the GM alongside the mass NPC dialog
- Each PC gets their own `InitiativeDialog` instance rendered via `dialog.render(true)` — same as the player-facing flow, but also visible to the GM
- Player-only flow is unchanged: when a non-GM player clicks initiative, they still only see their own PC dialog
- GM sees the PC dialogs as separate floating windows alongside the mass NPC card-grid dialog

## Capabilities

### New Capabilities

- `gm-initiative-orchestration`: GM can open all PC initiative dialogs and the mass NPC dialog simultaneously from a single initiative button click

### Modified Capabilities

- `initiative-dialog`: The dialog open trigger in `InitiativeDialogManager` is modified to also render PC dialogs for the GM user, not only for the actor owner

## Impact

- `module.js` — `InitiativeDialogManager.openDialog()`: remove the `!game.user.isGM` guard from the PC dialog loop so PCs render for the GM too
