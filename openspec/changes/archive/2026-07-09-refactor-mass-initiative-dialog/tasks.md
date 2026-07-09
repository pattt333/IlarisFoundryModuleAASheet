## 1. InitiativeStateManager — Shared Logic Extraction

- [x] 1.1 Create `scripts/apps/initiative-state-manager.js` with `InitiativeStateManager` class providing: `getBaseInitiative(actor)`, `calculateTotalInitiative(state, availableActions, actorType)`, `calculateActionModifiers(state, availableActions)`, `rollDice(state)`, `createCombatEffects(actor, state, combatRound, availableActions)`, `postSummaryChatMessage(combatData, round, availableActions)`, `persistState(actor, state)`, `clearState(actor)`, `loadState(actor)`
- [x] 1.2 Export `InitiativeStateManager` from `scripts/apps/index.js`

## 2. CSS: Hardcoded RGBA Migration

- [x] 2.1 Replace all hardcoded `rgba(200, 50, 50, ...)` values in `styles/initiative-dialog.css` with `var(--color-danger-overlay-soft)`
- [x] 2.2 Replace all hardcoded `rgba(76, 175, 80, ...)` values in `styles/initiative-dialog.css` with `var(--color-accent-primary-overlay-soft)` or `var(--color-accent-primary-glow)`
- [x] 2.3 Replace `background: #388e3c` hardcoded hover in `styles/initiative-dialog.css` with `var(--color-accent-primary-hover)`
- [x] 2.4 Verify no raw `rgba()` or hex color values remain in `styles/initiative-dialog.css`

## 3. CSS: Mass Initiative Dialog Stylesheet

- [x] 3.1 Create `styles/mass-initiative-dialog.css` with `.mass-initiative-form` scoped styles
- [x] 3.2 Style the card grid layout: `.dialog-content`, `.npc-card-grid` (2-column grid, gap, overflow)
- [x] 3.3 Style `.npc-card`: panel background, border, padding, transitions, state variants (`.is-locked`, `.needs-selection`, `.is-filtered`)
- [x] 3.4 Style `.card-header`: portrait (28px circle), name, base INI, status badges (✓, ⚠, 🔒)
- [x] 3.5 Style `.card-actions`: action chips (unselected, selected, locked, remove button), multi-select container (layout alongside chips, disabled state)
- [x] 3.6 Style `.card-modifiers`: modifier row (3-column grid for INI/AT/VT), Kombiniert checkbox
- [x] 3.7 Style `.card-dice`: dice count select, roll button, number-only dice faces (36px, selected glow, unknown dashed), dice results row
- [x] 3.8 Style `.card-result`: result value (positive/negative/unknown colors), 🛈 info icon hover
- [x] 3.9 Style locked card collapse: hide AT/VT/Kombi in `.is-locked`, show only locked chip
- [x] 3.10 Style `.dialog-header`: progress bar (track + fill + text), batch controls row (select + buttons), filter toggle checkbox
- [x] 3.11 Style `.dialog-footer`: cancel/confirm buttons matching PC dialog pattern
- [x] 3.12 Style `.formula-tooltip`: tooltip rows, divider, total, negative values

## 4. Mass Initiative Dialog Template

- [x] 4.1 Create `templates/apps/mass-initiative-dialog.hbs` with card-grid layout replacing accordion
- [x] 4.2 Header section: title with round, progress bar with fill percentage and "X von Y" text, batch controls (master action select + "Auf alle anwenden" + "Würfel alle" buttons), filter toggle checkbox
- [x] 4.3 NPC card template: card header (portrait, name, base INI, status badge), locked subtitle conditional, action chips loop + picker, modifier row (INI-Mod, AT-Mod, VT-Mod, Kombiniert checkbox), dice section (count select, roll button, results), result value with 🛈 tooltip trigger
- [x] 4.4 Footer: "Abbrechen" and "INI ansagen" buttons

## 5. Mass Initiative Dialog Application Class

- [x] 5.1 Rewrite `scripts/apps/mass-initiative-dialog.js`: remove accordion logic, use `InitiativeStateManager` for all shared operations
- [x] 5.2 Implement `getData()` to build NPC card context sorted alphabetically by name with state, status badges, progress stats
- [x] 5.3 Implement action chip + multi-select interaction: sync chip display with multi-select selections (max 2), remove chip unchecks multi-select item, disable multi-select when 2 actions selected
- [x] 5.4 Implement dice rolling: individual roll (per combatantId), "Würfel alle" (skip already-rolled), dice selection for 2-dice mode
- [x] 5.5 Implement modifier input change handling with live result update
- [x] 5.6 Implement "INI ansagen" flow: validate unprocessed NPCs → show warning dialog with "Fehlende würfeln"/"Trotzdem fortsetzen" → commit via StateManager → post summary chat message → close
- [x] 5.7 Implement cancel: discard changes without persisting state
- [x] 5.8 Implement batch quick-set: "Auf alle anwenden" adds selected action to all eligible NPCs
- [x] 5.9 Implement filter toggle: show/hide processed NPCs based on checkbox state
- [x] 5.10 Register world setting `ilaris-alternative-actor-sheet.massInitiativeFilterDefault` (Boolean, default: false) in `module.js` settings registration

## 6. InitiativeDialog Refactor (PC Dialog)

- [x] 6.1 Refactor `scripts/apps/initiative-dialog.js` to delegate to `InitiativeStateManager` for: state load/persist/clear, initiative calculation, action modifier calculation, dice rolling, effect creation, chat message posting
- [x] 6.2 Update cancel behavior: "Abbrechen" and X button discard changes (remove auto-save on close)
- [x] 6.3 Verify all existing PC dialog scenarios still pass with refactored code

## 7. Registration & Integration

- [x] 7.1 Add `styles/mass-initiative-dialog.css` to `module.json` styles array
- [x] 7.2 Verify `.mass-initiative-dialog` combined selector in `styles/module.css` covers all new child classes (`.mass-initiative-form`, `.npc-card`, etc.)
- [x] 7.3 Verify the trigger code that creates `MassInitiativeDialog` passes correct combat/npcCombatants parameters
- [x] 7.4 Test light mode: all NPC card states (default, rolled, needs-selection, locked) render correctly
- [x] 7.5 Test dark mode: all NPC card states render correctly with `body.theme-dark`
