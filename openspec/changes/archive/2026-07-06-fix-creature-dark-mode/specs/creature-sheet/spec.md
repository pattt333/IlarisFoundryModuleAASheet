# Creature Sheet — Dark Mode & Tab Fix

## MODIFIED Requirements

### Requirement: Creature sheet has two tabs — Kampf and Allgemein

The sheet SHALL have a tabbed layout with "Kampf" as the default tab and "Allgemein" as the secondary tab. The tab navigation SHALL use Foundry's generic `templates/generic/tab-navigation.hbs` template, consistent with the character sheet. The sheet's CSS class list SHALL include both `alternative` (for shared layout) and `kreaturen` (for creature-specific styles). All text in creature-specific CSS rules SHALL use `var(--color-text-primary)` for theme-aware light/dark mode support.

#### Scenario: Opening creature sheet

- **WHEN** a creature sheet is first rendered
- **THEN** the "Kampf" tab is selected by default and the tab bar is functional and styled

#### Scenario: Switching tabs

- **WHEN** the user clicks the "Allgemein" or "Kampf" tab
- **THEN** the tab switches correctly and the corresponding content is displayed

#### Scenario: Dark mode active

- **WHEN** Foundry's dark mode is active
- **THEN** all creature sheet text is readable — section headers, statblock labels, weapon names, and eigenschaft tags use theme-aware colors

#### Scenario: Light mode active

- **WHEN** Foundry's light mode is active
- **THEN** all creature sheet text is readable with light-appropriate colors
