## Why

The first brownfield migration (`migrate-brownfield-specs`) captured 12 capabilities from `docs/_specs/`, but a gap analysis revealed 6 additional features implemented in the codebase that have no specification coverage. These include two major application dialogs (Fertigkeit and Item Apply), the favorites system, item application utilities, carrying capacity display, and sheet settings dialogs. Without specs for these features, future changes risk introducing regressions in some of the module's most complex UI and logic.

## What Changes

- **Create 6 new capability specs** derived from code analysis of the existing implementation
- **No code changes**: This is purely documentation — capturing existing behavior as OpenSpec requirements
- **No Hook changes**: All specs describe existing Hook usage, not new hooks

## Capabilities

### New Capabilities

- `fertigkeit-dialog`: Full skill check dialog system — W20 dice rolling with critical detection, difficulty (Erschwernis) configuration, context selection (gather materials/craft/buy), material item filtering, and chat output posting. AppV2 with HandlebarsApplicationMixin.
- `item-application`: "Gegenstand anwenden" dialog with target selection, socket-based multi-user item application, quantity consumption, and target confirmation. Uses the Ilaris system's TargetSelectionDialog.
- `favorites-system`: Sidebar favorites component with category tabs, collapse/expand toggle, clear-all with confirmation, and sessionStorage persistence for collapsed state and active tab.
- `item-application-utilities`: Shared utility functions for item consumption (`consumeInventoryItem`), item-to-target application (`applyItemToTarget`), bleeding effect application (`applyBleedingEffect`), and socket payload construction (`createItemApplicationPayload`).
- `carrying-system`: Carrying capacity display with three container types — Mitführend (carrying), Unterstützend (supporting), and Handkarren (handcart) — each with distinct display logic and capacity constraints.
- `sheet-settings-dialogs`: Sheet-level settings dialogs: energy settings (AsP/KaP current and blocked value editing), health settings (wound add/remove), item quantity change (± buttons), hexagon attribute editing, and global modifier stat editing.

### Modified Capabilities

_None._

## Impact

- **New files**: 6 capability folders under `openspec/changes/spec-missing-features/specs/` with `spec.md` each
- **Referenced source files**: `scripts/apps/fertigkeit-dialog.js`, `scripts/apps/item-apply-dialog.js`, `scripts/components/favorites-manager.js`, `scripts/utilities.js`, `scripts/sheets/alternative-actor-sheet.js`, `scripts/sheets/alternative-creature-sheet.js`, `templates/components/carrying.hbs`, `templates/components/supporting.hbs`, `templates/components/handcart.hbs`, `templates/components/favorites-component.hbs`, `templates/apps/fertigkeit-dialog.hbs`, `templates/apps/item-apply-dialog.hbs`, `styles/fertigkeit-dialog.css`, `styles/favorites-component.css`
- **No runtime impact**: Documentation-only change
