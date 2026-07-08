# Initiative Dialog Theme Variables

## Purpose

Define CSS variable scopes on initiative and mass-initiative dialogs to ensure correct light/dark mode rendering without depending on Ilaris system CSS variables.

## ADDED Requirements

### Requirement: Initiative dialog defines its own CSS variable scope

The `.initiative-dialog` class SHALL define CSS custom properties matching the module's theme variable convention. A `body.theme-dark .initiative-dialog` scope SHALL override values for dark mode. All CSS rules within `initiative-dialog.css` SHALL reference these dialog-scoped variables instead of Ilaris system variables or hardcoded colors.

#### Scenario: Initiative dialog renders in light mode

- **WHEN** Foundry is in light mode (no `theme-dark` on body) and the initiative dialog opens
- **THEN** the dialog background is light (`--color-surface-base: #f8f8f8`), the header is dark (`--color-surface-header: #3c4658`), text is dark (`--color-text-primary: #2d3748`), and all elements are readable

#### Scenario: Initiative dialog renders in dark mode

- **WHEN** Foundry is in dark mode (`body.theme-dark`) and the initiative dialog opens
- **THEN** the dialog background is dark (`--color-surface-base: #070a09`), the header is very dark (`--color-surface-header: #141d1b`), text is light (`--color-text-primary: #eff1ef`), and all elements are readable

#### Scenario: Initiative dialog CSS uses only dialog-scoped variables

- **WHEN** inspecting the initiative dialog CSS
- **THEN** no rule references `var(--header-bg-color)`, `var(--color-light-1)`, or any other Ilaris system variable — all color references use variables defined in the `.initiative-dialog` or `body.theme-dark .initiative-dialog` scope

### Requirement: Mass initiative dialog defines its own CSS variable scope

The `.mass-initiative-dialog` class SHALL define CSS custom properties matching the module's theme variable convention. A `body.theme-dark .mass-initiative-dialog` scope SHALL override values for dark mode. All CSS rules for the mass dialog SHALL reference these dialog-scoped variables.

#### Scenario: Mass initiative dialog renders in light mode

- **WHEN** Foundry is in light mode and the mass initiative dialog opens
- **THEN** the dialog content is light (`#f8f8f8`), headers are dark (`#3c4658`), text is dark (`#2d3748`), accordion headers are dark with light text, and all form elements are readable

#### Scenario: Mass initiative dialog renders in dark mode

- **WHEN** Foundry is in dark mode and the mass initiative dialog opens
- **THEN** the dialog content is very dark (`#070a09`), headers are very dark (`#141d1b`), text is light (`#eff1ef`), accordion backgrounds are dark, and all elements are readable
