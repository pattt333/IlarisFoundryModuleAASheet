## Why

The creature sheet (Kreaturen) uses Foundry's generic `tab-navigation.hbs` template for its tab bar, resulting in unstyled tabs that don't match the Ilaris module's visual design. Additionally, `creature-sheet.css` targets the selector `.ilaris.sheet.actor.alternative.kreaturen` but the sheet's `DEFAULT_OPTIONS.classes` only registers `['alternative']` — meaning every CSS rule in `creature-sheet.css` is silently dead. The creature sheet is falling back entirely to character sheet styles from `module.css`, causing mismatched colors and poor dark mode appearance in the tab area.

## What Changes

- Add `'kreaturen'` to `DEFAULT_OPTIONS.classes` in `scripts/sheets/alternative-creature-sheet.js` to activate creature-specific CSS
- Replace the generic `templates/generic/tab-navigation.hbs` with a custom tab template that matches the Ilaris design language
- Add tab-specific dark-mode-aware CSS to `styles/creature-sheet.css` using CSS custom properties
- Ensure tab colors, hover states, and active indicators are consistent with the character sheet

## Capabilities

### New Capabilities

_None. This is a visual consistency fix for an existing capability._

### Modified Capabilities

- `creature-sheet`: Tab navigation SHALL use a custom Ilaris-styled template with dark-mode-aware colors, proper hover/active states, and consistent CSS custom property usage.

## Impact

- **Modified files**: `scripts/sheets/alternative-creature-sheet.js` (classes + template path), `styles/creature-sheet.css` (add tab styles)
- **New files**: `templates/sheets/npc/creature-tab-navigation.hbs` (custom tab template)
- **No Hook changes**: Pure CSS/template change
- **No module-level changes**: Sheet-level only
