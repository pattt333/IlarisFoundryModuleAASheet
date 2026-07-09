## Context

The module has two initiative dialogs: `InitiativeDialog` (single PC, dashboard-style) and `MassInitiativeDialog` (multiple NPCs, accordion-based). Both independently implement ~60% identical logic: state persistence via actor flags, initiative calculation (`_calculateTotalInitiative`), action modifier resolution, dice rolling with 1-or-2-die selection, active effect creation for combat modifiers, negative-initiative lock/carry-over handling, and chat message posting.

The PC dialog is feature-rich (action cards, weapon dropdown, formula breakdown, locked state visuals). The mass dialog is utilitarian (accordion, multi-select dropdown, no formula, no locked visuals) and requires clicking through each NPC individually.

The dialog handles 4-6 NPCs in typical encounters (matching PC count). All CSS variables are already scoped to both `.initiative-dialog` and `.mass-initiative-dialog` via the combined selector in `module.css`.

## Goals / Non-Goals

**Goals:**
- Redesign the mass dialog UI as a 2-column card grid — all NPCs visible at once
- Extract shared initiative logic into `InitiativeStateManager` to eliminate duplication
- Match the PC dialog's visual quality: action chips, state indicators, formula via tooltip
- Support batch operations (apply action to all, roll all) alongside individual tweaking
- Use the same CSS variable system as the PC dialog (already scoped in `module.css`)
- Migrate hardcoded `rgba()` values in `initiative-dialog.css` to `var(--color-*)`

**Non-Goals:**
- Changing the PC dialog's UI or feature set (only extracting shared logic, migrating hardcoded colors)
- Adding weapon selection to the mass dialog (NPCs use actions only)
- 3-column or responsive grid modes (2 columns regardless of NPC count; scroll if needed)
- Drag-to-reorder cards
- Socket synchronization between GM and players for initiative input

## Decisions

### 1. Architecture: InitiativeStateManager (Composition over Inheritance)

**Decision**: Extract shared logic into a composable `InitiativeStateManager` class rather than a base class.

**Rationale**: Both dialogs are `Application` subclasses with different UI structures. Forcing them into a shared base class would constrain their divergent templates and rendering patterns. Composition allows each dialog to own its UI while delegating to a shared manager for logic.

```
InitiativeStateManager
├── getBaseInitiative(actor)           // PC: abgeleitete.ini, NPC: kampfwerte.ini
├── calculateTotalInitiative(state)    // formula: base + action mods + iniMod + dice
├── calculateActionModifiers(state)    // AT/VT from action effects
├── rollDice(state)                    // 1d6 × diceCount
├── createCombatEffects(actor, state)  // ActiveEffect for Kampf-Modifikatoren
├── postChatMessage(data)             // ChatMessage summary
├── persistState(actor, state)         // setFlag dialogState
├── clearState(actor)                  // unsetFlag dialogState
└── loadState(actor)                   // getFlag dialogState → structured state object
```

**Alternatives considered**:
- **Base class**: Would couple UI inheritance to logic sharing. Rejected because the templates and rendering are too different.
- **Utility functions**: Would scatter state management across stateless functions. Rejected because state (dice, selections, locked) needs lifecycle management.

### 2. Card Grid Layout (2 Columns)

**Decision**: CSS Grid with `grid-template-columns: 1fr 1fr` and `align-items: start`.

**Rationale**: 4-6 NPCs fit in 2-3 rows without scrolling at typical window heights (~600px). Cards have independent heights (locked cards are ~80px, normal cards ~150px), and `align-items: start` prevents stretching. Single-column layout would require excessive scrolling; 3-column would be too narrow for action chips.

**Alternatives considered**:
- **Accordion (current)**: One NPC visible at a time. Rejected — too slow for 4-6 NPCs.
- **Table view**: Compact but loses visual identity (portraits, chip styles). Rejected — doesn't match PC dialog quality.
- **Master-detail split**: List on left, detail panel on right. Rejected — adds unnecessary click to view each NPC.

### 3. Action Selection: Foundry `<multi-select>` + Visual Chips

**Decision**: Use Foundry's native `<multi-select>` element for the dropdown picker (shows all 10+ actions with checkboxes). Selected actions are rendered as compact horizontal chips (icon + name + INI cost + ✕ remove button) displayed inline alongside the multi-select. The multi-select itself shows only the dropdown trigger (no inline text). When 2 actions are selected, the multi-select is disabled (grayed, no interaction). Clicking a chip's ✕ unchecks the corresponding item in the multi-select.

**Rationale**: Foundry's `<multi-select>` provides native accessibility, keyboard navigation, and consistent styling with the rest of the Foundry UI. The chip overlay adds visual clarity — the GM can see at a glance which actions are selected without opening the dropdown. With 10+ actions, the dropdown scrolls naturally.

**Alternatives considered**:
- **Custom popover picker**: Would duplicate Foundry's built-in multi-select behavior. Rejected — adds maintenance burden and diverges from Foundry UX conventions.
- **All-chips-always-visible**: Too much space for 10+ actions. Rejected.
- **Chips only (no dropdown)**: No way to browse available actions. Rejected.

### 4. Formula Display: Result-Only + Hover Tooltip

**Decision**: Each card shows only the calculated initiative total (large number, color-coded: accent for positive, danger for negative, muted for unknown). A 🛈 icon triggers a tooltip with the full formula breakdown (`Basis + Aktion + Mod + Würfel = Ergebnis`).

**Rationale**: The PC dialog's formula breakdown takes significant vertical space. In a multi-NPC grid, repeating it per card would waste space. The tooltip provides full transparency on demand without clutter.

**Alternatives considered**:
- **Full formula per card**: Too much vertical space, repeats the PC dialog pattern unnecessarily.
- **No formula at all**: GM has no way to verify calculation. Rejected.

### 5. Locked State: Greyed Out + Collapsed

**Decision**: Cards in locked state (`movedAction === true`) collapse to ~80px: show only portrait, name, locked-subtitle ("⏱️ Verzögert — X. Runde"), locked action chip (non-interactive, red-tinted), INI-Mod input (editable), and dice section (active). AT/VT inputs, Kombiniert checkbox, and action picker are hidden. Card gets a red-tinted border and subtle red background via `--color-danger-overlay-soft`.

**Rationale**: Locked NPCs have only one editable value (INI-Mod) plus dice to roll for the new round. The rest is frozen from the previous round. Showing full-size cards with grayed-out fields wastes space and creates visual noise.

### 6. Batch "Würfel alle": Skip Already-Rolled

**Decision**: "Würfel alle" iterates all NPCs and rolls dice only for those where `hasRolled === false`. Already-rolled NPCs are untouched.

**Rationale**: "Würfel alle" means "fill in the blanks." If the GM has already manually rolled some NPCs, they likely want to keep those results. Re-rolling everything would be destructive.

**Alternatives considered**:
- **Re-roll all**: Destructive to existing results. Rejected.
- **Confirmation dialog**: Adds a click to a common operation. Rejected.

### 7. "INI ansagen" with Unprocessed NPCs: Warn + Roll-Missing Option

**Decision**: If any NPCs haven't rolled dice, show a confirmation dialog: "X NPCs haben noch nicht gewürfelt." with options "Fehlende würfeln" (rolls missing, then proceeds) and "Trotzdem fortsetzen" (skips, sets base INI only). The button is not disabled — the GM can always proceed.

**Rationale**: Blocking the button entirely would trap the GM if they intentionally don't need dice for some NPCs. But silently proceeding is dangerous (NPCs get wrong initiative). The dialog provides a safety net with a convenient "fix it for me" option.

### 8. Cancel Discards Changes

**Decision**: "Abbrechen" button (and dialog close via X) discards all unsaved changes. State is only persisted when "INI ansagen" commits.

**Rationale**: The previous behavior (auto-save on any close) made it impossible to discard mistakes. The GM would set wrong modifiers, close the dialog, and those wrong values would persist indefinitely. Explicit save-on-confirm is the standard UX pattern.

### 9. Chat Output: Single Summary Message

**Decision**: One `ChatMessage` containing a summary table of all NPC initiatives rather than individual messages per NPC.

**Rationale**: Individual messages for 5+ NPCs flood chat and make it hard to see other events. A single organized message is scannable and can be referenced later.

### 10. Card Order: Alphabetical by Name

**Decision**: Cards are sorted by `actor.name` ascending, regardless of combat tracker order or initiative values.

**Rationale**: Alphabetical order is predictable and stable — the GM always knows where to find a specific NPC. Initiative values change as dice are rolled and modifiers adjusted; sorting by initiative would cause cards to jump around, which is disorienting.

### 11. Filter Toggle with World Setting

**Decision**: A "Nur unbearbeitete" checkbox in the header filters cards to show only NPCs that haven't been fully processed (no dice, or 2-dice without selection). A world setting (`massInitiativeFilterDefault`) controls whether this filter is enabled by default. Setting key: `ilaris-alternative-actor-sheet.massInitiativeFilterDefault`, type: `Boolean`, default: `false`.

**Rationale**: For encounters with many NPCs, the GM may want to focus only on unfinished ones. The world setting lets individual GMs configure their preference once rather than toggling every time.

### 12. CSS: Hardcoded RGBA Migration

**Decision**: Replace hardcoded `rgba(200, 50, 50, ...)` and `rgba(76, 175, 80, ...)` in `initiative-dialog.css` with `var(--color-danger-overlay-soft)`, `var(--color-accent-primary-overlay-soft)`, and `var(--color-accent-primary-glow)` respectively.

**Rationale**: These violate the CSS variable scoping convention (`.github/instructions/foundry-css.instructions.md`). The overlay variables are already defined in the combined selector in `module.css` and correctly flip between light/dark modes.

## Risks / Trade-offs

- **Card height variability**: Locked cards (~80px) and normal cards (~130-160px) have different heights, creating an uneven grid. → Mitigation: `align-items: start` keeps cards top-aligned; the gap between rows is consistent.
- **10+ actions in multi-select**: The dropdown can be tall with 10+ items. → Mitigation: Foundry's native `<multi-select>` handles scrolling natively within the dropdown; no nested scroll issues.
- **State migration**: Existing persisted `dialogState` flags will be loaded by `InitiativeStateManager` which has the same data shape. No migration needed unless the state schema changes.
- **"Nur unbearbeitete" toggle with locked cards**: Locked cards need dice for the new round — they count as "unbearbeitet" if dice haven't been rolled. This is intentional: locked NPCs still need GM attention.
- **Grid scroll with many NPCs**: 10+ NPCs will require scrolling. → Mitigation: The filter toggle reduces visible cards; the grid container has `overflow-y: auto` with the dialog footer fixed at bottom.
