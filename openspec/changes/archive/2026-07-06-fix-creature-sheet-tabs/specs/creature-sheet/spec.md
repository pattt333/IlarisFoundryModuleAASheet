# Creature Sheet — Tab Navigation (Modified)

## MODIFIED Requirements

### Requirement: Creature sheet has two tabs — Kampf and Allgemein

The sheet SHALL have a tabbed layout with "Kampf" as the default tab and "Allgemein" as the secondary tab. The tab navigation SHALL use a custom Ilaris-styled template (`creature-tab-navigation.hbs`) with dark-mode-aware CSS custom properties, matching the character sheet's tab bar visual language. The sheet's CSS class list SHALL include both `alternative` (for shared layout) and `kreaturen` (for creature-specific styles).

#### Scenario: Opening creature sheet

- **WHEN** a creature sheet is first rendered
- **THEN** the "Kampf" tab is selected by default and the tab bar uses Ilaris-styled colors with proper dark mode support

#### Scenario: Switching to Allgemein tab

- **WHEN** the user clicks the "Allgemein" tab
- **THEN** the Allgemein tab shows an active indicator matching the Ilaris design language, and the Kampf tab loses its active state

#### Scenario: Dark mode active

- **WHEN** Foundry's dark mode is active
- **THEN** the tab bar background and tab colors adapt to dark mode using CSS custom properties, maintaining visual consistency with the character sheet

#### Scenario: Light mode active

- **WHEN** Foundry's light mode is active
- **THEN** the tab bar uses light-appropriate colors consistent with the Ilaris character sheet tab bar
