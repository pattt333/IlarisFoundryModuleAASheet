# AI Creature Generation — registerMenu Fix

## MODIFIED Requirements

### Requirement: Vorteile cache refreshable via settings

A settings menu button registered via `game.settings.registerMenu()` in `Hooks.once('init')` SHALL trigger `refreshVorteileCache()` through a `FormApplication` subclass. The menu SHALL be restricted to GM users, labeled "Vorteile-Cache aktualisieren", and use the `fa-sync` icon. On activation, it SHALL read the Ilaris system's `Ilaris.vorteile` compendium, filter to creature-relevant categories, and store the result as a JSON cache with a notification showing the count.

#### Scenario: GM clicks "Vorteile-Cache aktualisieren" in settings

- **WHEN** the GM clicks the registered menu button in the module's settings section
- **THEN** the vorteile compendium is read, filtered to creature-relevant categories, and stored as a JSON cache with a notification showing the count

#### Scenario: Cache is empty on first use

- **WHEN** the vorteile cache setting is empty and generation is attempted
- **THEN** the prompt is built without vorteile names, and the AI is instructed to omit vorteile from the response
