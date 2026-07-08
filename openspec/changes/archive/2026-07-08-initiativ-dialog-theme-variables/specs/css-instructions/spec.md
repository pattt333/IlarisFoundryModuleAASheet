# CSS Instructions

## Purpose

Ensure the apply agent always follows the module's CSS variable scoping convention when modifying or creating CSS files under `styles/**/*.css`.

## ADDED Requirements

### Requirement: CSS instruction file exists and is scoped to styles directory

A file `.github/instructions/foundry-css.instructions.md` SHALL exist with frontmatter `applyTo: 'styles/**/*.css'`. The agent SHALL consult this file whenever modifying any file matching that glob pattern.

#### Scenario: Agent touches a CSS file

- **WHEN** the agent is about to modify or create a file matching `styles/**/*.css`
- **THEN** the agent reads `.github/instructions/foundry-css.instructions.md` and applies its rules

### Requirement: CSS instruction file documents the variable scoping convention

The instruction file SHALL document: (a) every UI component MUST define its own `--color-*` variable scope on the component's root class, (b) a `body.theme-dark` variant SHALL override those variables for dark mode, (c) all CSS rules SHALL use `var(--color-*)` references, never `var(--header-bg-color)` / `var(--color-light-1)` / `var(--primary-color)` (Ilaris system variables) or hardcoded hex colors.

#### Scenario: Agent creates new CSS for a dialog

- **WHEN** the agent creates CSS for a new dialog class `.my-dialog`
- **THEN** the CSS file includes `.my-dialog { --color-surface-header: #3c4658; ... }` and `body.theme-dark .my-dialog { --color-surface-header: #141d1b; ... }` blocks, and all rules use `var(--color-*)` references

#### Scenario: Agent modifies existing CSS

- **WHEN** the agent modifies an existing CSS rule
- **THEN** the agent does NOT introduce references to `var(--header-bg-color)`, `var(--color-light-1)`, `var(--primary-color)`, hardcoded hex colors, or any other pattern forbidden by the instruction file
