## Why

The mass initiative dialog currently has no weapon or attack (Angriff) selection. This means:

1. **Action gating is broken**: Actions that require `nahkampfwaffe` or `fernkampfwaffe` (e.g., "Gezielter Schlag") are never grayed out, because there is no weapon context to gate against. GMs can select incompatible actions.
2. **Un-owned PCs are degraded**: Held actors without a player owner are routed to the mass dialog, but they lose access to their weapon selection — a feature that exists in the single-PC initiative dialog.
3. **NPCs have no Angriff context**: Kreatur actors have `system.angriffe` with nah/fern types, but there is no way to select one in the dialog.

The single-PC initiative dialog already has weapon selection with proper gating. The mass dialog needs equivalent functionality, adapted for both actor types.

## What Changes

- Add a weapon/Angriff dropdown to each NPC card in the mass initiative dialog
- For `held` (PC) actors: load weapons from items (nahkampfwaffe/fernkampfwaffe with hauptwaffe/nebenwaffe), same as the single-PC dialog
- For `kreatur` (NPC) actors: normalize `system.angriffe` entries into virtual weapons, inferring nah/fern type from `rw` and eigenschaften
- Apply weapon gating to action selection: actions with `bedingungen.waffentyp` set are grayed out when the selected weapon/Angriff doesn't match
- Batch apply ("Auf alle anwenden") defaults to each NPC's first Angriff when the action has a waffentyp requirement; NPCs whose first Angriff doesn't match are skipped
- Weapon INI modifier is only applied when at least one selected action has a non-empty `bedingungen.waffentyp`
- Persist `selectedWeaponId` in actor flags alongside existing initiative state

## Capabilities

### New Capabilities

- `mass-dialog-weapon-selection`: Weapon and Angriff selection in the mass initiative dialog with action gating based on waffentyp and eigenschaften

### Modified Capabilities

- `mass-initiative-dashboard`: Each NPC card gains a weapon/Angriff dropdown. Action chips and multi-select options reflect gating state based on the selected weapon. Batch apply respects Angriff compatibility. Weapon INI modifiers are conditional on action requirements.

## Impact

- **Files**:
  - `scripts/apps/mass-initiative-dialog.js` — weapon loading, selection handling, gating, batch apply logic
  - `templates/apps/mass-initiative-dialog.hbs` — weapon/Angriff dropdown row, gated action display
  - `styles/mass-initiative-dialog.css` — dropdown row styling
  - `scripts/apps/initiative-state-manager.js` — possibly extract shared gating/weapon-loading logic
- **Actor flags**: `selectedWeaponId` added to existing `dialogState` flag (already has `lockedWeaponId` slot)
- **No new hooks**, no settings changes
