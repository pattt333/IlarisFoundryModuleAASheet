## 1. Consolidate Light Mode Selector in `styles/module.css`

- [x] 1.1 Replace the `.ilaris.sheet.actor.alternative` light-mode variable block with a combined selector including all component classes
- [x] 1.2 Remove the duplicate `.iaas-item-apply-window, .target-selection-dialog` light-mode variable block
- [x] 1.3 Verify the combined selector lists: `.ilaris.sheet.actor.alternative`, `.iaas-item-apply-window`, `.target-selection-dialog`, `.initiative-dialog`, `.mass-initiative-dialog`

## 2. Consolidate Dark Mode Selector in `styles/module.css`

- [x] 2.1 Replace the `body.theme-dark .ilaris.sheet.actor.alternative` dark-mode variable block with the combined dark selector
- [x] 2.2 Remove the duplicate `body.theme-dark .iaas-item-apply-window, body.theme-dark .target-selection-dialog` dark-mode block
- [x] 2.3 Verify the dark combined selector lists all classes prefixed with `body.theme-dark`

## 3. Remove Duplicate Variable Blocks from `styles/initiative-dialog.css`

- [x] 3.1 Remove the `.initiative-dialog` light-mode variable block
- [x] 3.2 Remove the `body.theme-dark .initiative-dialog` dark-mode variable block
- [x] 3.3 Remove the `.mass-initiative-dialog` light-mode variable block
- [x] 3.4 Remove the `body.theme-dark .mass-initiative-dialog` dark-mode variable block

## 4. Update `foundry-css.instructions.md`

- [x] 4.1 Update the instruction file to document: color variables are defined once in `module.css`'s combined selector
- [x] 4.2 Document the new component onboarding process: add class to combined selector, write only rule CSS in component file

## 5. Verification

- [x] 5.1 Verify actor sheet renders correctly in light and dark mode
- [x] 5.2 Verify initiative dialog renders correctly in light and dark mode
- [x] 5.3 Verify mass initiative dialog renders correctly in light and dark mode
- [x] 5.4 Verify item apply dialog renders correctly in light and dark mode
- [x] 5.5 Check browser console for CSS variable warnings
