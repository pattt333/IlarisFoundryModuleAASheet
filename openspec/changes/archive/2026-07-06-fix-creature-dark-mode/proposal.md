## Why

The `fix-creature-sheet-tabs` change activated `creature-sheet.css` by adding the `.kreaturen` CSS class, but two regressions were introduced: (1) replacing the generic tab template with a custom one broke tab switching, and (2) `creature-sheet.css` uses `--text-dark` (a fixed dark color) in 5 rules, making text black and unreadable in dark mode.

## What Changes

- Revert `PARTS.tabs.template` back to `templates/generic/tab-navigation.hbs` (matching the character sheet)
- Replace all 5 occurrences of `var(--text-dark)` with `var(--color-text-primary)` in `styles/creature-sheet.css`
- Remove the now-unused custom template `templates/sheets/npc/creature-tab-navigation.hbs` and its preload entry

## Capabilities

### Modified Capabilities

- `creature-sheet`: Tab navigation SHALL use Foundry's generic tab template (consistent with the character sheet). All text SHALL use `--color-text-primary` for theme-aware dark mode support.

## Impact

- **Modified files**: `scripts/sheets/alternative-creature-sheet.js` (revert template path), `styles/creature-sheet.css` (5 color replacements), `module.js` (remove unused template preload)
- **Removed files**: `templates/sheets/npc/creature-tab-navigation.hbs`
- **No Hook changes**: Pure CSS/template fix
