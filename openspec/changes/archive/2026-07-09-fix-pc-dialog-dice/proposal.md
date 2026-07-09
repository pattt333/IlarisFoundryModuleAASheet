## Why

Two bugs in the PC initiative dialog dice section: (1) when Foundry's "Manual Rolling" setting is enabled, the dice UI is hidden but no manual input field replaces it — players have no way to enter their physical dice result; (2) when switching from 1 die to 2 dice, the template doesn't re-render, so the second die placeholder never appears and rolling 2 dice only shows 1 result in the DOM.

## What Changes

- Add a manual dice input field (`<input type="number" min="1" max="6">`) when `manualRolling` is true, replacing the auto-roll dice UI
- Call `this.render()` when `diceCount` changes in `_onModifierChange`, so the template updates with the correct number of placeholder dice

## Capabilities

### Modified Capabilities

- `initiative-dialog`: Dice section now supports manual rolling input; dice count change triggers template re-render

## Impact

- `templates/apps/initiative-dialog.hbs` — Add `{{#if manualRolling}}` block with number input for manual dice value
- `scripts/apps/initiative-dialog.js` — `_onModifierChange`: call `this.render()` when `diceCount` changes; handle manual dice value in `_onIniAnsagen`
