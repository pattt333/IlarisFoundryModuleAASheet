## Context

Two issues in `module.js`:

1. The `updateCombat` hook fires on round change and calls `InitiativeDialogManager.openDialog(combat, allCombatants)`. With the `!game.user.isGM` guard removed from `openDialog`, PC dialogs now auto-open for the GM on every round change. This should only happen on explicit button click.

2. The `renderCombatTracker` hook uses `cloneNode` + `addEventListener` to intercept initiative roll buttons. This DOM manipulation approach is unreliable because Foundry may use event delegation or re-render buttons after the hook fires. The result: Foundry's auto-roll executes instead of opening our custom dialog.

## Goals / Non-Goals

**Goals:**
- Round change only opens the mass NPC dialog for the GM — PC dialogs stay closed
- Clicking any initiative roll button (in encounter or combat tracker) opens the appropriate custom dialog instead of auto-rolling
- Our dialog's "INI ansagen" still sets initiative normally without triggering recursive interception

**Non-Goals:**
- Changing the `InitiativeDialogManager.openDialog` logic for PC ownership checks
- Adding visual "greyed out" state for already-announced combatants (separate concern)

## Decisions

### 1. Round Change: Only Open NPC Dialog

**Decision**: Change `updateCombat` round-change handler to filter `allCombatants` to only NPCs (`!c.actor?.hasPlayerOwner`) before calling `openDialog`.

**Before**:
```js
const allCombatants = combat.combatants.contents;
InitiativeDialogManager.openDialog(combat, allCombatants);
```

**After**:
```js
const npcs = combat.combatants.contents.filter(c => !c.actor?.hasPlayerOwner);
if (npcs.length > 0) {
    InitiativeDialogManager.openDialog(combat, npcs);
}
```

### 2. Initiative Button: Capture-Phase DOM Event Delegation

**Decision**: Replace the old `cloneNode`-based button interception with capture-phase event delegation on the combat tracker container.

**Flow**:
1. `renderCombatTracker` hook fires
2. Remove any previous capture-phase listener (stored on the DOM element)
3. Attach a new capturing (`true`) click listener on the tracker's root element
4. When a click on `[data-control="rollInitiative"]` is detected in the capture phase:
   - `event.stopImmediatePropagation()` prevents Foundry's handlers from firing
   - Check if initiative already set → notify and return
   - For NPCs: open `MassInitiativeDialog` for all NPCs (GM only)
   - For PCs: open `InitiativeDialog` only for that specific combatant (if owner)

**Rationale**: Capture-phase listeners fire before bubble-phase listeners. `stopImmediatePropagation()` prevents any remaining handlers on the same element. This approach doesn't interfere with `combatant.update()` or `combat.setInitiative()` — initiative values set by our dialogs flow through normally.

**Why NOT `preUpdateCombatant`**: The hook-based approach had two fatal flaws: (1) `combat.setInitiative()` does NOT pass custom options through to `combatant.update()`, so a flag-based recursion guard doesn't work, causing the hook to block our own initiative sets; (2) the hook fires for every combatant, requiring complex logic to avoid opening all PC dialogs when only one was clicked.

## Risks / Trade-offs

- **Capture-phase listener on re-render**: If Foundry re-renders the combat tracker, a new listener is attached. → Mitigation: store the listener reference on the DOM element (`htmlDOM._ilarisIniListener`) and remove it before attaching a new one.
- **`stopImmediatePropagation` may break Foundry internals**: Aggressively stopping propagation could interfere with other Foundry systems. → Mitigation: only call it when we've confirmed the click target is a roll initiative button and we're handling it.
- **NPC mass dialog opens once per NPC click**: Clicking any NPC's roll button opens the mass dialog for all NPCs — subsequent NPC clicks just focus the existing window. Acceptable behavior.
