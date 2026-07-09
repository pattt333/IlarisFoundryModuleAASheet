## 1. Trigger Change

- [x] 1.1 In `module.js` `InitiativeDialogManager.openDialog()`, remove the `!game.user.isGM` exclusion from the PC dialog rendering condition: change `if (pc.actor?.isOwner && !game.user.isGM)` to `if (pc.actor?.isOwner)`
- [x] 1.2 Verify GM can open and interact with both PC dialogs and the mass NPC dialog simultaneously
- [x] 1.3 Verify non-GM players still see only their own PC dialog (no regression)
