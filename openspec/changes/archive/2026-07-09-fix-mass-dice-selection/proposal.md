## Why

In the mass initiative dialog, clicking a die face to select it (2-dice mode) does nothing. The `data-combatant-id` attribute is empty because the Handlebars path `{{../../npc.combatantId}}` goes two levels up from inside the `#each diceResults` loop, overshooting to the root context where `npc` is undefined.

## What Changes

- Fix Handlebars path from `{{../../npc.combatantId}}` to `{{../npc.combatantId}}` in the dice results loop of the mass dialog template

## Capabilities

### Modified Capabilities

- `mass-initiative-dashboard`: Dice selection in 2-dice mode now works correctly

## Impact

- `templates/apps/mass-initiative-dialog.hbs` — line ~121: change `../../npc.combatantId` → `../npc.combatantId`
