# CSS Instructions

## Purpose

Ensure the apply agent always follows the module's CSS variable scoping convention when modifying or creating CSS files under `styles/**/*.css`.

## Requirements

### Requirement: CSS instruction file exists and is scoped to styles directory

A file `.github/instructions/foundry-css.instructions.md` SHALL exist with frontmatter `applyTo: 'styles/**/*.css'`. The agent SHALL consult this file whenever modifying any file matching that glob pattern.

#### Scenario: Agent touches a CSS file

- **WHEN** the agent is about to modify or create a file matching `styles/**/*.css`
- **THEN** the agent reads `.github/instructions/foundry-css.instructions.md` and applies its rules

### Requirement: CSS instruction file documents the variable scoping convention

The instruction file SHALL document: (a) all module color variables are defined ONCE in `module.css` using a combined selector that lists every module UI component class, (b) a `body.theme-dark` variant overrides those variables for dark mode, (c) individual component CSS files SHALL NOT define `--color-*` variable blocks — they SHALL only contain style rules using `var(--color-*)`, (d) when creating a new UI component, the developer SHALL add its root class to the combined selector in `module.css`.

#### Scenario: Agent creates new CSS for a dialog

- **WHEN** the agent creates CSS for a new dialog class `.my-dialog`
- **THEN** the agent adds `.my-dialog` to the combined selector in `module.css`'s light and dark mode blocks, and the component CSS file contains only style rules using `var(--color-*)` — no variable block

#### Scenario: Agent modifies existing component CSS

- **WHEN** the agent modifies an existing component CSS file
- **THEN** the agent does NOT add `--color-*` variable blocks to that file (variables come from `module.css`)
