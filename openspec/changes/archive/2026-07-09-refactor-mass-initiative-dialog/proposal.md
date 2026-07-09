## Why

The current mass initiative dialog uses an accordion-based interface that hides NPC details behind expandable sections, making it tedious for GMs to process 4-6 NPCs simultaneously. It also duplicates ~60% of its logic from the PC initiative dialog and lacks visual parity — no formula breakdown, no locked state visualization, and no batch-operation shortcuts. With the PC dialog already having a polished dashboard-style interface, the mass dialog should match that quality while being optimized for multi-NPC workflows.

## What Changes

- Replace the accordion layout with a **2-column card grid** — all NPCs visible at once, each in a compact dashboard card
- Keep Foundry's native `<multi-select>` for action selection but enhance it with **visual action chips** — selected actions are shown as removable pills alongside the dropdown; the multi-select is disabled when 2 actions are selected
- Add a **result-only display** per card with formula breakdown accessible via hover tooltip
- Add **visual state indicators**: ✓ rolled, ⚠ needs dice selection (2-dice mode), 🔒 locked (negative INI from previous round)
- Collapse locked-state cards to show only editable fields (INI-Mod + dice), gray out frozen sections
- Add a **progress bar** in the header and a "Nur unbearbeitete" filter toggle (with world setting for default state)
- Add **batch quick-set**: master action dropdown to apply an action to all NPCs
- "Würfel alle" skips already-rolled NPCs (no re-rolling)
- "INI ansagen" shows a warning with "roll missing" option when some NPCs haven't rolled
- "Abbrechen" discards unsaved changes (changed behavior: previously auto-saved)
- Post a **single summary chat message** instead of one per NPC
- Order NPC cards **alphabetically by name**
- Extract shared initiative logic (state persistence, calculation, dice evaluation, effect creation) into an `InitiativeStateManager` class — removing duplication between `InitiativeDialog` and `MassInitiativeDialog`
- Migrate hardcoded `rgba()` values in `initiative-dialog.css` to `var(--color-*)` variables for consistency
- **BREAKING**: Cancel button behavior changes from "save state on close" to "discard changes on close"; state only persists via "INI ansagen"

## Capabilities

### New Capabilities

- `mass-initiative-dashboard`: Card-grid interface for NPC initiative management with action chips, visual states, batch operations, and filter toggle

### Modified Capabilities

- `initiative-dialog`: Extracts shared initiative logic into `InitiativeStateManager`; both dialogs delegate state persistence, calculation, dice, and effect creation to this shared class
- `initiative-dialog-theme`: Adds new `.mass-initiative-form` CSS classes to the combined variable selector scope; migrates hardcoded `rgba()` values to `var(--color-*)` references

## Impact

- `scripts/apps/mass-initiative-dialog.js` — Full rewrite from accordion Application to card-grid Application using InitiativeStateManager
- `scripts/apps/initiative-dialog.js` — Refactored to delegate shared logic to InitiativeStateManager; migrated hardcoded rgba values to CSS variables
- `scripts/apps/index.js` — Export new InitiativeStateManager
- `scripts/apps/initiative-state-manager.js` — New shared class (state persistence, calculation, dice, effects, chat messages)
- `templates/apps/mass-initiative-dialog.hbs` — Complete redesign from accordion to card grid
- `styles/initiative-dialog.css` — Migrate hardcoded `rgba()` to `var(--color-*)`; ensure all references use dialog-scoped variables
- `styles/module.css` — Ensure `.mass-initiative-dialog` combined selector covers all new child classes
- New CSS file: `styles/mass-initiative-dialog.css` — Card grid, action chips, picker, states, progress bar, filter toggle, result display
