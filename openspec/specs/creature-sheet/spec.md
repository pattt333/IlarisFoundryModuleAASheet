# Creature Sheet

## Purpose

Provide an alternative creature (Kreatur) actor sheet with combat-first layout, AppV2 architecture, and shared component reuse.

## Requirements

### Requirement: Creature sheet extends Ilaris system actor sheet

The module SHALL provide `IlarisAlternativeCreatureSheet` that inherits from the Ilaris system's `IlarisActorSheet`, displayed for actors with `type === "kreatur"`. The sheet SHALL use AppV2 with `HandlebarsApplicationMixin`.

#### Scenario: Opening a creature actor

- **WHEN** a user opens an actor sheet for an actor with `type === "kreatur"`
- **THEN** the `IlarisAlternativeCreatureSheet` is rendered

#### Scenario: Opening a non-creature actor

- **WHEN** a user opens an actor sheet for an actor with `type === "held"`
- **THEN** the `IlarisAlternativeActorSheet` is rendered instead

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

### Requirement: Sticky header shows portrait, name, attributes, and health

The sheet SHALL render a sticky header containing: actor portrait (120x120px), editable name input, the 8 Ilaris attributes (MU/KL/IN/CH/FF/GE/KO/KK) displayed as hexagon stat blocks, health resources (LeP bar), and energy resources (Eng bar for casters).

#### Scenario: Creature is a caster

- **WHEN** a creature has `system.abgeleitete.zauberer === true` or `system.abgeleitete.geweihter === true`
- **THEN** the energy resources bar labeled "Eng" is displayed

#### Scenario: Creature is not a caster

- **WHEN** a creature has neither `zauberer` nor `geweihter` set to true
- **THEN** the energy resources bar is hidden

### Requirement: Health resources bar includes Wundenignorieren toggle

The LeP health resources bar SHALL include a toggle button for `system.gesundheit.wundenignorieren` next to the settings icon.

#### Scenario: Toggling Wundenignorieren

- **WHEN** the user clicks the Wundenignorieren toggle button
- **THEN** the `system.gesundheit.wundenignorieren` value is toggled between true and false

### Requirement: Kampf tab shows effects, weapons, and spells

The Kampf tab SHALL display: active effects as an effect-card grid, a flat list of weapons (Angriffe/Waffen) with inline stats and dice roll buttons, and spells/liturgies if the creature is a caster. No accordions SHALL be used — all information is immediately visible.

#### Scenario: Viewing Kampf tab

- **WHEN** the Kampf tab is active
- **THEN** all effects, weapons, and spells (if caster) are displayed flat without accordion collapse

### Requirement: Allgemein tab shows descriptive and configuration data

The Allgemein tab SHALL display: Kurzbeschreibung textarea, Eigenschaften as comma-separated list with edit links, Vorteile grouped by category, Fertigkeiten as a list with PW values and dice roll buttons, Kampfwerte as input fields, and an item-creation dropdown at the bottom.

#### Scenario: Adding an item to a creature

- **WHEN** the user selects an item type from the dropdown and clicks the add button in the Allgemein tab
- **THEN** a new item of that type is created on the creature actor

### Requirement: Creature sheet uses shared components

The creature sheet SHALL reuse the health-resources, energy-resources, and effect-card components from the character sheet without modification.

#### Scenario: Effect card rendering

- **WHEN** a creature has active effects
- **THEN** effects are rendered using the shared `templates/components/effect-card.hbs` template in an 80x100px grid
