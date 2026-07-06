## Context

The creature sheet inherits from `KreaturSheet` (Ilaris system) and uses AppV2 patterns. Its `DEFAULT_OPTIONS.classes` is `['alternative']` and its `PARTS.tabs` points to Foundry's generic `templates/generic/tab-navigation.hbs`. Two issues exist:

1. `creature-sheet.css` uses the selector `.ilaris.sheet.actor.alternative.kreaturen` but `.kreaturen` is never added to the sheet's classes
2. The generic tab template has no Ilaris-specific styling or dark mode support

## Goals / Non-Goals

**Goals:**
- Activate `creature-sheet.css` by adding `'kreaturen'` to the classes array
- Replace generic tab template with a custom one matching the Ilaris look
- Add dark-mode-aware tab CSS using `--color-*` variables
- Match the character sheet's tab bar visual language (colored background, proper hover/active states)

**Non-Goals:**
- Changing the character sheet's tab styles
- Modifying the PARTS structure or tab IDs
- Adding new tabs or changing tab content

## Decisions

### Decision 1: Add `'kreaturen'` as a second class, not replace `'alternative'`

`DEFAULT_OPTIONS.classes` becomes `['alternative', 'kreaturen']`. The `.alternative` class is needed for `module.css` to apply base sheet layout. The `.kreaturen` class enables `creature-sheet.css` overrides.

**Rationale**: Both classes are needed — `.alternative` for shared layout, `.kreaturen` for creature-specific overrides.

### Decision 2: Custom tab template matching character sheet pattern

Create `templates/sheets/npc/creature-tab-navigation.hbs` as a custom tab template. It follows the same HTML structure as Foundry's generic one but uses Ilaris-specific CSS classes and markup for consistency with the character sheet.

**Rationale**: The character sheet has a custom tab implementation in `module.css` with `.sheet-tabs .item` styling. A matching template ensures the creature sheet tabs look identical.

### Decision 3: Tab CSS in creature-sheet.css using CSS custom properties

Tab styles go in `creature-sheet.css` targeting `.ilaris.sheet.actor.alternative.kreaturen .sheet-tabs`. Colors use `var(--color-*)` for automatic dark mode support.

**Rationale**: Keeps creature-specific styles in one file. CSS custom properties are already defined by Foundry's theme system and automatically adapt to light/dark mode.

## Risks / Trade-offs

- **Risk**: Changing classes array could affect other selectors relying on the exact class list → **Mitigation**: Adding a class is additive; no existing selectors should break
- **Trade-off**: Custom template means one more file to maintain → Acceptable; it's a small template (~15 lines)
