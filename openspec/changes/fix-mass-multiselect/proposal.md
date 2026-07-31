## Why

The multi-select dropdowns for action selection in the mass initiative dialog are completely non-functional. Clicking actions in the dropdown has no effect because the event handler reads `name` from the wrong DOM element (`event.target` instead of `event.currentTarget`). This means GMs cannot assign actions to NPCs or un-owned PCs during mass initiative setup.

## What Changes

- Fix `_onActionsChange` in `scripts/apps/mass-initiative-dialog.js` to correctly read the `name` attribute from the `<multi-select>` element using `event.currentTarget` instead of `event.target`
- Keep `selectedOptions` access on `event.target` (the internal `<select>`) since that's where Foundry's multi-select exposes the selected options

## Capabilities

### New Capabilities

None — this is a pure bug fix.

### Modified Capabilities

- `mass-initiative-dashboard`: Action selection via multi-select dropdowns now works correctly in the mass initiative dialog. The fix restores the intended behavior that was broken by the `event.target` vs `event.currentTarget` confusion with Foundry's custom `<multi-select>` element.

## Impact

- **Files**: `scripts/apps/mass-initiative-dialog.js` (1 method, ~5 lines changed)
- **No API changes**, no new hooks, no template or CSS changes
- **No settings changes**
