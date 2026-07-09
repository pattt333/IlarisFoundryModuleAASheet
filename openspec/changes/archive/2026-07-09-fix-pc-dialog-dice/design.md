## Context

The PC initiative dialog's dice section has three rendering states: dice count dropdown, roll button, and results/placeholders. Two bugs exist:

1. **Manual rolling**: `game.settings.get('core', 'rollMode') === 'manual'` hides the dice count dropdown via `{{#unless manualRolling}}` but provides no alternative. Players rolling physical dice have no way to input their result.

2. **2-dice DOM desync**: Changing `diceCount` from 1 to 2 updates the JS state but doesn't re-render the template. The DOM retains only 1 `.dice-result` placeholder. When 2 dice are rolled, `_onRollDice` iterates existing DOM elements and only updates the first one.

## Goals / Non-Goals

**Goals:**
- Manual rolling mode shows a number input (1–6) for entering physical dice result
- Switching dice count re-renders the template so the DOM matches the JS state

**Non-Goals:**
- Adding manual rolling support to the mass NPC dialog
- Changing the dice roll animation or visual style

## Decisions

### 1. Manual Input: Number Field with Min/Max

**Decision**: When `manualRolling` is true, replace the entire dice section (dropdown + roll button + results) with a simple `<input type="number" min="1" max="6">` labeled "Würfelergebnis". The input value is used directly as `diceResults[0]`. `hasRolled` is set to `true` when a value is entered.

### 2. Template Re-render on Dice Count Change

**Decision**: In `_onModifierChange`, when `target.name === 'diceCount'`, call `this.render()` after updating `this.diceCount`. This refreshes the template with the correct number of placeholder `.dice-result` elements.

**Before**:
```js
} else if (target.name === 'diceCount') {
    this.diceCount = parseInt(target.value) || 1;
}
await this._savePersistedState();
this._updateFormulaBreakdown();
```

**After**:
```js
} else if (target.name === 'diceCount') {
    this.diceCount = parseInt(target.value) || 1;
}
await this._savePersistedState();
this.render(); // re-render to update dice placeholders
```

## Risks / Trade-offs

- **Re-render resets scroll position and focus**: Calling `this.render()` on the entire dialog is heavier than targeted DOM updates. → Mitigation: `diceCount` changes are rare (once per dialog session), so the re-render cost is negligible.
- **Manual input bypasses dice selection**: With manual rolling, there's no 2-dice selection UI. → Mitigation: manual mode inherently uses 1 die (the physical result), so `diceCount` dropdown is hidden anyway.
