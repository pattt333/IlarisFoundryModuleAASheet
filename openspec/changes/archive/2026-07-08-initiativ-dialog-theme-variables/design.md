## Context

The module's `styles/module.css` defines CSS variables in two scoped blocks:
- `.ilaris.sheet.actor.alternative` — light mode variables
- `body.theme-dark .ilaris.sheet.actor.alternative` — dark mode overrides

Other dialogs follow the same pattern:
- `.iaas-item-apply-window` / `body.theme-dark .iaas-item-apply-window`
- `.target-selection-dialog` / `body.theme-dark .target-selection-dialog`

Each dialog scope redefines the same variable names (`--color-surface-header`, `--color-text-primary`, etc.) with values appropriate to the theme. This is the established convention.

The initiative dialog CSS in `styles/initiative-dialog.css` currently references `var(--header-bg-color)`, `var(--color-light-1)`, `var(--primary-color)` etc. — variables NOT defined in any dialog-level scope. They happen to work when the Ilaris system stylesheet is loaded and defines them globally, but they fail in dark mode or when the system's variable cascade doesn't reach the dialog's DOM scope.

The mass-initiative-dialog section has the same problem, additionally using `var(--ini-text-medium)` and `var(--ini-text-dark)` which are even less likely to be available.

## Goals / Non-Goals

**Goals:**
- Define CSS variable scopes for `.initiative-dialog` and `.mass-initiative-dialog` matching the existing module pattern
- Provide both light mode (default) and `body.theme-dark` overrides
- Replace all `var(--ilari-system-*)` references with dialog-scoped `var(--color-*)` references
- Ensure readable rendering in both light and dark mode

**Non-Goals:**
- Change the layout, behavior, or functionality of either dialog
- Create new CSS variable names — reuse the names from `.iaas-item-apply-window` scope
- Modify `module.css`

## Decisions

### Decision 1: Create a CSS instruction file for the agent

Create `.github/instructions/foundry-css.instructions.md` with `applyTo: 'styles/**/*.css'`. This ensures the agent always consults the CSS variable scoping convention when touching any CSS file — preventing future violations.

**Why**: The existing `foundry-js.instructions.md` already does this for JS files. CSS needs the same treatment. Without it, the agent will continue to reference Ilaris system variables or hardcode colors in new CSS work.

### Decision 2: Use identical variable names as `.iaas-item-apply-window`

The `.iaas-item-apply-window` scope defines: `--color-surface-header`, `--color-surface-base`, `--color-text-primary`, `--color-text-secondary`, `--color-accent-primary`, `--color-border-default`, `--color-border-dark`, `--color-danger`, `--color-success`, `--overlay-black-10`, `--overlay-white-10`, `--header-bg-color`.

The initiative dialogs will use the same names plus additional ones they need: `--color-white`, `--color-text-soft`, `--color-text-inverse`, `--color-text-tertiary`, `--color-text-muted`, `--color-danger-light`, `--color-danger-lighter`, `--color-success-strong`, `--color-success-weak`, `--overlay-white-05`, `--overlay-white-50`.

**Why**: Consistency across all module dialogs. An author looking at any dialog CSS will find the same variable names.

### Decision 3: Two separate scopes, not one combined

`.initiative-dialog` and `.mass-initiative-dialog` get separate variable blocks (not `.initiative-dialog, .mass-initiative-dialog { ... }`).

**Why**: Follows the module pattern (each dialog class gets its own scope). Also allows future divergence if the dialogs need different color values.

### Decision 4: Dark mode via `body.theme-dark` selector

Dark mode overrides use `body.theme-dark .initiative-dialog` and `body.theme-dark .mass-initiative-dialog`.

**Why**: Foundry V13 toggles `theme-dark` class on `<body>`. This is the standard mechanism used by all other dialog scopes in the module.

## Risks / Trade-offs

- **Risk**: Variable scope duplication (same values copied to two blocks). → Acceptable; follows existing pattern and allows future per-dialog customization.
- **Risk**: Values must match the light/dark mode design intent. → Use the same hex values from `.iaas-item-apply-window` light mode and `body.theme-dark .iaas-item-apply-window` dark mode as the baseline, then add any additional variables needed by the initiative dialogs.
