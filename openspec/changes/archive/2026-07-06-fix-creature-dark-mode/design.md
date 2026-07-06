## Context

`fix-creature-sheet-tabs` added the `.kreaturen` class and a custom tab template. Two regressions: the custom template breaks AppV2 tab switching, and newly-activated CSS rules use `--text-dark` which is unreadable in dark mode.

## Goals / Non-Goals

**Goals:**
- Restore working tab navigation by reverting to the generic template
- Fix dark mode text readability by replacing `--text-dark` with `--color-text-primary`
- Remove the unused custom template file

**Non-Goals:**
- Removing or reverting the `.kreaturen` class (still needed for creature-specific styles)
- Changing the tab CSS we added to creature-sheet.css (those use theme-aware variables)

## Decisions

### Decision 1: Revert to generic tab template

Use `templates/generic/tab-navigation.hbs` — the same template the character sheet uses. The generic template is proven to work with AppV2's tab system. The tab CSS in creature-sheet.css (with `.kreaturen` namespace) still applies for visual styling.

**Rationale**: The character sheet uses this template and tabs work. No need for a custom one — the creature-specific tab look comes from CSS, not the template.

### Decision 2: `--text-dark` → `--color-text-primary`

Replace all 5 occurrences in creature-sheet.css. `--color-text-primary` is defined by Foundry's theme system and automatically adapts to light/dark mode.

**Rationale**: `--text-dark` is a fixed dark color (likely from the Ilaris system, not Foundry core). It doesn't adapt to dark mode.

## Risks / Trade-offs

- **Risk**: `--color-text-primary` might have different contrast than the original `--text-dark` in light mode → **Mitigation**: Both resolve to similar dark colors in light mode; the difference is negligible
