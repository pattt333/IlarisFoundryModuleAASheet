# Consolidated Color Schema

## Purpose

Define CSS color variables once in a combined selector covering all module UI components, eliminating per-component duplication.

## ADDED Requirements

### Requirement: Single combined selector defines all module color variables

A single CSS rule in `module.css` SHALL define the full set of `--color-*` variables using a combined selector that lists every module UI component class. A `body.theme-dark` variant SHALL override variables for dark mode. No other CSS file in the module SHALL define `--color-*` variable blocks.

#### Scenario: Light mode variable inheritance

- **WHEN** Foundry is in light mode and any module UI component (sheet, dialog) is rendered
- **THEN** all `--color-*` variables are available and have their light mode values from the combined selector in `module.css`

#### Scenario: Dark mode variable inheritance

- **WHEN** Foundry is in dark mode (`body.theme-dark`) and any module UI component is rendered
- **THEN** all `--color-*` variables are available and have their dark mode values

#### Scenario: New component onboarding

- **WHEN** a developer creates a new UI component with root class `.new-dialog`
- **THEN** they add `.new-dialog` to the combined selector in `module.css`; the component's CSS file contains only style rules using `var(--color-*)` — no variable definitions

### Requirement: Component CSS files contain no variable definitions

CSS files for individual components (`initiative-dialog.css`, etc.) SHALL NOT define `--color-*` variable blocks. They SHALL only contain style rules referencing `var(--color-*)`.

#### Scenario: initiative-dialog.css after consolidation

- **WHEN** inspecting `styles/initiative-dialog.css`
- **THEN** the file contains no `--color-surface-header:`, `--color-text-primary:`, or any other variable definitions — only style rules using `var(--color-*)`
