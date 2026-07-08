## Context

Currently `module.css` defines CSS variable scopes for:
1. `.ilaris.sheet.actor.alternative` (light) + `body.theme-dark .ilaris.sheet.actor.alternative` (dark)
2. `.iaas-item-apply-window, .target-selection-dialog` (light) + dark

And `initiative-dialog.css` defines:
3. `.initiative-dialog` (light) + dark
4. `.mass-initiative-dialog` (light) + dark

All four scopes define the exact same `--color-*` variables with identical values. The only difference is the class selector. When a new dialog is added, the entire variable block must be copy-pasted again.

## Goals / Non-Goals

**Goals:**
- Single definition point for the color schema in `module.css`
- All module UI components (sheets, dialogs) inherit from one combined selector
- New components only need to add their class to the combined selector — no variable block needed
- Remove duplicated variable blocks from `initiative-dialog.css`

**Non-Goals:**
- Change any color values
- Change any CSS rules
- Affect non-module Foundry UI elements

## Decisions

### Decision 1: Combined selector in `module.css`

Replace the 4 separate light-mode scopes with a single combined selector:

```css
.ilaris.sheet.actor.alternative,
.iaas-item-apply-window,
.target-selection-dialog,
.initiative-dialog,
.mass-initiative-dialog {
  --color-surface-header: #3c4658;
  /* ... all 50+ vars ... */
}

body.theme-dark .ilaris.sheet.actor.alternative,
body.theme-dark .iaas-item-apply-window,
body.theme-dark .target-selection-dialog,
body.theme-dark .initiative-dialog,
body.theme-dark .mass-initiative-dialog {
  --color-surface-header: #141d1b;
  /* ... dark vars ... */
}
```

**Why**: CSS specificity: a combined selector has the same specificity as any single class selector. The `body.theme-dark` prefix on the dark mode block ensures it overrides the light defaults. CSS custom properties inherit through the cascade, so any element inside these components can reference `var(--color-surface-header)` regardless of nesting depth.

### Decision 2: Remove variable blocks from `initiative-dialog.css`

The 4 variable scope blocks added in the previous change (`initiative-dialog-theme-variables`) are removed. `initiative-dialog.css` retains only the style rules — no variable definitions.

**Why**: Variables now come from the combined selector in `module.css`. Keeping duplicate blocks defeats the purpose of consolidation.

### Decision 3: New component onboarding

When adding a new UI component (dialog, panel, etc.), the developer simply adds its root class to the combined selector in `module.css`. The CSS file for the component only needs style rules using `var(--color-*)`.

**Why**: Minimal boilerplate. A new dialog CSS file can start with just its layout rules — no 50-line variable block.

## Risks / Trade-offs

- **Risk**: Combined selector grows long as more components are added. → Acceptable; it's a single line of CSS. If it becomes unmanageable, a shared class (e.g. `.ilaris-module-ui`) could be introduced later, but that would require JS changes to add the class to every Application.
- **Risk**: Removing variable blocks from `initiative-dialog.css` means it depends on `module.css` being loaded first. → `module.css` is already listed first in `module.json`'s `styles` array.
