## Context

The `InitiativeDialogManager.openDialog()` in `module.js` separates combatants by `hasPlayerOwner` into PCs and NPCs. PCs only get dialogs if the current user is the actor owner AND not a GM (`!game.user.isGM`). NPCs get a mass dialog only for GMs. This means the GM never sees PC initiative dialogs — they must rely on players or process PC initiatives manually.

## Goals / Non-Goals

**Goals:**
- When the GM clicks the initiative button, render `InitiativeDialog` instances for ALL held-type combatants AND the `MassInitiativeDialog` for NPCs simultaneously
- Player-only flow remains unchanged: non-GM users only see their own PC dialog

**Non-Goals:**
- Changing the PC dialog's UI or behavior
- Adding the mass NPC dialog for non-GM players
- Socket synchronization of initiative input between GM and players

## Decisions

### 1. Remove the `!game.user.isGM` Guard

**Decision**: Change the PC dialog rendering condition from `if (pc.actor?.isOwner && !game.user.isGM)` to `if (pc.actor?.isOwner)`.

**Rationale**: The guard `!game.user.isGM` was the only thing preventing the GM from seeing PC dialogs. GMs are typically owners of all actors, so `pc.actor?.isOwner` is true for them. Removing the GM exclusion lets the dialogs open for the GM while preserving the ownership check for players.

**Before**:
```js
if (pc.actor?.isOwner && !game.user.isGM) {
    const dialog = new InitiativeDialog(pc);
    dialog.render(true);
}
```

**After**:
```js
if (pc.actor?.isOwner) {
    const dialog = new InitiativeDialog(pc);
    dialog.render(true);
}
```

### 2. No Merged/Single Dialog

**Decision**: Keep PC and NPC dialogs as separate windows rather than merging them into one super-dialog.

**Rationale**: The PC dialog (`InitiativeDialog`) and mass NPC dialog (`MassInitiativeDialog`) have fundamentally different layouts (dashboard vs. card-grid) and target different actor types. Merging them would require significant refactoring for minimal benefit. Separate windows allow the GM to position them independently on screen.

**Alternatives considered**:
- **Single combined window**: Would need a tabbed or split-pane layout combining both dialog types. Rejected — over-engineered for a simple trigger change.

## Risks / Trade-offs

- **Screen clutter with many PCs**: With 4-6 PCs + the mass NPC dialog, the GM could have 5-7 dialog windows open. → Mitigation: this is the existing behavior players already experience; the GM can close windows they've finished processing.
- **Permission model unchanged**: The original `isOwner` check ensures only authorized users (including GM) can open the dialog. No security concern.
