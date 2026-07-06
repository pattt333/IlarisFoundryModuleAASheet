## Why

The project has 34 existing specification documents in `docs/_specs/` written before OpenSpec was adopted. These specs describe the current behavior of the module but exist outside the OpenSpec workflow. Without canonical specs in `openspec/specs/`, OpenSpec cannot reference existing capabilities when proposing new changes, leading to uninformed proposals and potential regressions. Moving them into the OpenSpec system makes them discoverable, referenceable, and diffable — establishing the baseline for all future spec-driven development.

## What Changes

- **Migrate 12 feature specs** from `docs/_specs/` top-level `.md` files into `openspec/specs/<capability>/spec.md` folders, converted to OpenSpec format
- **Migrate 17 dated implementation plans** from `docs/_specs/<YYYY_MM_DD_*>/` subdirectories into a consolidated `migration-history` capability spec
- **Consolidate duplicates**: `fernkampfoption-auto-add.md` and `fernkampfoption-auto-add.spec.md` into a single `fernkampfoption-auto-add` spec
- **Skip 5 MIGRATION_* process logs**: These are session notes and progress trackers, not behavioral specs. They stay in `docs/_specs/` as historical reference
- **Validate against code**: Each migrated spec is cross-referenced with the current codebase to flag any deviations between documented spec and actual implementation

## Capabilities

### New Capabilities

- `ammunition-tracking`: Automatic ammunition consumption for ranged weapons with Kugel/Pfeil/Bolzen properties, including fumble rule table for ranged attacks
- `creature-sheet`: Alternative creature (Kreatur) actor sheet with Ilaris-specific layout and data display
- `effect-decrement`: Decrement button on active effects for countdown-style effect management
- `fernkampfoption-auto-add`: Automatic addition of ranged combat options (Fernkampfoptionen) to actor sheets based on equipped ranged weapons
- `initiative-dialog`: Initiative rolling dialog with support for standard, mass, and negative initiative modes
- `item-accordion`: Accordion-style collapsible sections for item categories on the actor sheet
- `rasten-resting`: Rest (Rasten) mechanic with LeP/Asp recovery and status reset
- `schips`: Schips (fate points) management — tracking, spending, and regeneration
- `segmented-health-bar`: LAW-based segmented health bar visualization replacing the standard continuous LeP bar
- `stack-effects`: Stackable active effects with increment/decrement controls for stacking behavior
- `wurfwaffen-pile`: Throwable weapon pile management — tracking thrown weapons and ammo piles on the token/actor
- `migration-history`: Consolidated record of all completed migrations (AppV2 migration, variable name sync, CSS scope isolation, dark mode theming, combat dialog theme, compendium sync, accordion buttons, dialog reworks, effect timing)

### Modified Capabilities

_None. This is the initial population of `openspec/specs/`._

## Impact

- **New files**: 12 capability folders under `openspec/specs/` with `spec.md` each, plus the change artifacts in `openspec/changes/migrate-brownfield-specs/`
- **No code changes**: This is purely documentation migration; existing `docs/_specs/` files remain in place as historical reference
- **No Hook changes**: No runtime behavior affected
- **Module-level impact**: None — this is a repository documentation change
