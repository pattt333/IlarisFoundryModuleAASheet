## Why

The module has a CSS variable scoping convention: every UI component defines its own `--color-*` variables in a light-mode block and a `body.theme-dark` override block. The actor sheets, kreaturen sheet, and item dialogs (`module.css`) all follow this pattern and render correctly in both themes.

The `initiative-dialog.css` violates this convention by referencing Ilaris system variables (`--header-bg-color`, `--color-light-1`, `--primary-color`) that aren't in scope, causing unreadable rendering in dark mode.

The root cause is systemic: **the apply agent has no instruction file for CSS work**. There's a `foundry-js.instructions.md` for JS, but nothing for CSS. The agent needs an instruction file that documents the CSS variable scoping convention so it's automatically applied to all future CSS work.

## What Changes

- Create `.github/instructions/foundry-css.instructions.md` with `applyTo: 'styles/**/*.css'` — documents the CSS variable scoping convention, the required light/dark mode pattern, and the forbidden practices (Ilaris system variables, hardcoded colors)
- Apply the convention to `styles/initiative-dialog.css` as the first compliance fix: add variable scope blocks for `.initiative-dialog` and `.mass-initiative-dialog`, replace all illegal variable references

## Capabilities

### New Capabilities

- `css-instructions`: CSS instruction file scoped to `styles/**/*.css` that documents the module's CSS variable scoping convention and light/dark mode pattern, ensuring the agent always follows it

### Modified Capabilities

None — purely documentation + CSS compliance fix.

## Impact

- `.github/instructions/foundry-css.instructions.md` — **New file**: CSS conventions and variable scoping rules
- `styles/initiative-dialog.css` — Compliance fix: add variable scope blocks, replace illegal references
- Future CSS work in `styles/**/*.css` will automatically follow the convention via the instruction file
