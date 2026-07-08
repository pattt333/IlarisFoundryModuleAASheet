## 1. Create CSS Instruction File

- [x] 1.1 Create `.github/instructions/foundry-css.instructions.md` with `applyTo: 'styles/**/*.css'` frontmatter
- [x] 1.2 Document the CSS variable scoping convention: every component defines `--color-*` vars on its root class + `body.theme-dark` override
- [x] 1.3 Document forbidden patterns: `var(--header-bg-color)`, `var(--color-light-1)`, `var(--primary-color)`, hardcoded hex colors
- [x] 1.4 Reference `.iaas-item-apply-window` in `module.css` as the canonical example

## 2. Define CSS Variable Scopes in `styles/initiative-dialog.css`

- [x] 2.1 Add `.initiative-dialog { ... }` variable block with light mode values (copy from `.iaas-item-apply-window` in `module.css`, add extra variables as needed)
- [x] 2.2 Add `body.theme-dark .initiative-dialog { ... }` variable block with dark mode values (copy from `body.theme-dark .iaas-item-apply-window`)
- [x] 2.3 Add `.mass-initiative-dialog { ... }` variable block with light mode values
- [x] 2.4 Add `body.theme-dark .mass-initiative-dialog { ... }` variable block with dark mode values

## 3. Replace Variable References — Initiative Dialog

- [x] 3.1 Replace all `var(--header-bg-color)` → `var(--color-surface-header)` in initiative-dialog rules
- [x] 3.2 Replace all `var(--color-light-1)` → `var(--color-surface-base)` in initiative-dialog rules
- [x] 3.3 Replace all `var(--primary-color)` → `var(--color-accent-primary)` in initiative-dialog rules
- [x] 3.4 Replace all `var(--text-dark)` → `var(--color-text-primary)` in initiative-dialog rules
- [x] 3.5 Replace `var(--color-surface-panel)` → `var(--color-white)` (default) / ensure dark mode equivalent
- [x] 3.6 Replace hardcoded `#388e3c` → `var(--color-accent-primary-hover)`
- [x] 3.7 Replace hardcoded `rgba(76, 175, 80, ...)` → `var(--color-accent-primary-glow)` or similar

## 4. Replace Variable References — Mass Initiative Dialog

- [x] 4.1 Replace all `var(--header-bg-color)` → `var(--color-surface-header)`
- [x] 4.2 Replace all `var(--color-light-1)` → `var(--color-surface-base)`
- [x] 4.3 Replace all `var(--primary-color)` → `var(--color-accent-primary)`
- [x] 4.4 Replace `var(--ini-text-medium)` → `var(--color-text-muted)`
- [x] 4.5 Replace `var(--ini-text-dark)` → `var(--color-text-secondary)`
- [x] 4.6 Replace `var(--text-dark)` → `var(--color-text-primary)`
- [x] 4.7 Replace all remaining Ilaris system variable references with dialog-scoped equivalents

## 5. Verification

- [x] 5.1 Verify initiative dialog renders correctly in light mode (no white-on-white or dark-on-dark)
- [x] 5.2 Verify initiative dialog renders correctly in dark mode
- [x] 5.3 Verify mass initiative dialog renders correctly in light mode
- [x] 5.4 Verify mass initiative dialog renders correctly in dark mode
- [x] 5.5 Check browser console for CSS variable warnings (undefined variables)
