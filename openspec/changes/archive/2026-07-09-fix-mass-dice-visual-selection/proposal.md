## Why

In the mass initiative dialog, selecting a die in 2-dice mode updates `state.selectedDiceIndex` correctly but the `selected` CSS class is never applied. The template uses `{{#if (eq ../npc.state.selectedDiceIndex index)}}` which fails because `../npc` path traversal is unreliable in nested Handlebars `#each` loops.

## What Changes

- In `getData()`, compute a `diceData` array per NPC with `{value, selected, index}` — baking the `selected` boolean into the data so the template doesn't need path traversal
- Update the template to iterate `npc.diceData` instead of `npc.state.diceResults`, using `die.selected` and `die.value` directly

## Capabilities

### Modified Capabilities

- `mass-initiative-dashboard`: Dice selection now shows correct visual highlight

## Impact

- `scripts/apps/mass-initiative-dialog.js` — `getData()`: add `diceData` computed array
- `templates/apps/mass-initiative-dialog.hbs` — replace `#each npc.state.diceResults` with `#each npc.diceData`
