# Initiative Dialog Theme Variables (Delta)

## MODIFIED Requirements

### Requirement: Initiative dialog defines its own CSS variable scope

The `.initiative-dialog` class SHALL define CSS custom properties matching the module's theme variable convention. A `body.theme-dark .initiative-dialog` scope SHALL override values for dark mode. All CSS rules within `initiative-dialog.css` SHALL reference these dialog-scoped variables instead of Ilaris system variables or hardcoded colors. No CSS rule SHALL use hardcoded `rgba()` values — all color and shadow references SHALL use `var(--color-*)` or `var(--overlay-*)` variables.

#### Scenario: Initiative dialog renders in light mode

- **WHEN** Foundry is in light mode (no `theme-dark` on body) and the initiative dialog opens
- **THEN** the dialog background is light (`--color-surface-base: #f8f8f8`), the header is dark (`--color-surface-header: #3c4658`), text is dark (`--color-text-primary: #2d3748`), and all elements are readable

#### Scenario: Initiative dialog renders in dark mode

- **WHEN** Foundry is in dark mode (`body.theme-dark`) and the initiative dialog opens
- **THEN** the dialog background is dark (`--color-surface-base: #070a09`), the header is very dark (`--color-surface-header: #141d1b`), text is light (`--color-text-primary: #eff1ef`), and all elements are readable

#### Scenario: Initiative dialog CSS uses only dialog-scoped variables

- **WHEN** inspecting the initiative dialog CSS
- **THEN** no rule references `var(--header-bg-color)`, `var(--color-light-1)`, or any other Ilaris system variable — all color references use variables defined in the `.initiative-dialog` or `body.theme-dark .initiative-dialog` scope

#### Scenario: No hardcoded rgba values in initiative-dialog.css

- **WHEN** inspecting the initiative dialog CSS
- **THEN** no rule uses a raw `rgba()` value — locked card backgrounds use `var(--color-danger-overlay-soft)`, selected card backgrounds use `var(--color-accent-primary-overlay-soft)`, and dice glow uses `var(--color-accent-primary-glow)`

### Requirement: Mass initiative dialog defines its own CSS variable scope

The `.mass-initiative-dialog` class SHALL define CSS custom properties matching the module's theme variable convention. A `body.theme-dark .mass-initiative-dialog` scope SHALL override values for dark mode. All CSS rules for the mass dialog SHALL reference these dialog-scoped variables. New child classes (`.mass-initiative-form`, `.npc-card`, `.action-chip`, `.card-actions`, `.card-dice`, `.card-result`, `.progress-bar`, `.batch-controls`, `.filter-toggle`) SHALL all reference only `var(--color-*)` or `var(--overlay-*)` variables — no hardcoded colors.

#### Scenario: Mass initiative dialog renders in light mode

- **WHEN** Foundry is in light mode and the mass initiative dialog opens
- **THEN** the dialog content is light (`#f8f8f8`), headers are dark (`#3c4658`), text is dark (`#2d3748`), NPC cards have light panel backgrounds, action chips use accent colors, and all elements are readable

#### Scenario: Mass initiative dialog renders in dark mode

- **WHEN** Foundry is in dark mode and the mass initiative dialog opens
- **THEN** the dialog content is very dark (`#070a09`), headers are very dark (`#141d1b`), text is light (`#eff1ef`), NPC cards have dark panel backgrounds, action chips use dark-mode accent colors, and all elements are readable

#### Scenario: NPC card states are visible in both modes

- **WHEN** an NPC card is in locked state (red-tinted) or needs-selection state (amber warning)
- **THEN** the state indicators are clearly visible in both light and dark mode using theme-aware variables

## ADDED Requirements

### Requirement: Mass dialog stylesheet is a new component CSS file

The mass initiative dialog styles SHALL be defined in a new file `styles/mass-initiative-dialog.css`. This file SHALL NOT define any `--color-*` variables — it SHALL inherit them from the combined selector in `module.css`. All CSS classes SHALL be scoped under `.mass-initiative-form` (the form element inside `.mass-initiative-dialog`).

#### Scenario: New CSS file follows the convention

- **WHEN** inspecting `styles/mass-initiative-dialog.css`
- **THEN** the file contains no `--color-*` variable definitions, and all color references use `var(--color-*)` or `var(--overlay-*)` from the module's combined selector
