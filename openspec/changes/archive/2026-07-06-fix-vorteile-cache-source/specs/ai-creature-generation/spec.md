# AI Creature Generation — Vorteile Source Fix

## MODIFIED Requirements

### Requirement: Vorteile cache refreshable via settings

A settings menu button registered via `game.settings.registerMenu()` SHALL trigger `refreshVorteileCache()`. The cache SHALL be populated from the Ilaris system's configured vorteile list (the user-editable list in system settings), not from the raw compendium pack. The cached data SHALL be stored as JSON in the `vorteileCache` setting and used by the prompt builder.

#### Scenario: GM clicks "Vorteile-Cache aktualisieren"

- **WHEN** the GM clicks the registered menu button
- **THEN** the Ilaris system's configured vorteile list is read, filtered to creature-relevant categories, and stored as a JSON cache with a notification showing the count

#### Scenario: Cache is empty on first use

- **WHEN** the vorteile cache setting is empty and generation is attempted
- **THEN** the prompt is built without vorteile names, and the AI is instructed to omit vorteile from the response
