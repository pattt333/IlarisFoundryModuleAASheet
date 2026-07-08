## Why

The module's CSS color schema is currently duplicated across 4+ variable scope blocks:
- `.ilaris.sheet.actor.alternative` (light + dark) — in `module.css`
- `.iaas-item-apply-window, .target-selection-dialog` (light + dark) — in `module.css`
- `.initiative-dialog` (light + dark) — in `initiative-dialog.css`
- `.mass-initiative-dialog` (light + dark) — in `initiative-dialog.css`

All four define the exact same 50+ color variables with the same values. Every new dialog must copy-paste the entire block. This is fragile — if a color changes, 4+ places must be updated. It also violates DRY and makes onboarding a new component error-prone.

## What Changes

- Define the CSS color variables **once** in `module.css` using a combined selector covering all module UI components: `.ilaris.sheet.actor.alternative, .iaas-item-apply-window, .target-selection-dialog, .initiative-dialog, .mass-initiative-dialog` for light mode, and the equivalent `body.theme-dark` selector for dark mode
- Remove the duplicate variable blocks from `initiative-dialog.css` (the blocks added in the previous change)
- Remove the duplicate `.iaas-item-apply-window, .target-selection-dialog` variable blocks from `module.css` (they're superseded by the combined selector)
- Update `foundry-css.instructions.md` to reference the combined selector as the single source of truth, and instruct new components to simply add their class to the combined selector
- **BREAKING**: No behavioral breakage. All color values remain identical. This is purely a structural refactoring.

## Capabilities

### New Capabilities

- `consolidated-color-schema`: Single CSS variable definition point for all module UI components, eliminating per-component duplication

### Modified Capabilities

- `css-instructions`: Update the instruction file to document the consolidated selector pattern instead of per-component variable blocks

## Impact

- `styles/module.css` — Combine 4 variable blocks into 2 (one light mode combined selector, one dark mode)
- `styles/initiative-dialog.css` — Remove the 4 variable scope blocks added in the previous change
- `.github/instructions/foundry-css.instructions.md` — Update to document the consolidated pattern
