## 1. Template: Manual Rolling Input

- [x] 1.1 In `templates/apps/initiative-dialog.hbs`, add a `{{#if manualRolling}}` block before the existing `{{#unless manualRolling}}` dice section: show a labeled number input (`min="1" max="6"`) for manual dice entry, hide the roll button and auto-dice UI

## 2. JavaScript: Dice Count Re-render

- [x] 2.1 In `scripts/apps/initiative-dialog.js` `_onModifierChange`, change `this._updateFormulaBreakdown()` to `this.render()` when `diceCount` changes

## 3. JavaScript: Manual Dice Value Handling

- [x] 3.1 In `scripts/apps/initiative-dialog.js`, handle the manual dice input: add an event listener for the manual input field that sets `this.diceResults = [parseInt(value)]`, `this.selectedDiceIndex = 0`, `this.hasRolled = true`, and updates the formula
