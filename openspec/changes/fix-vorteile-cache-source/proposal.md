## Why

`refreshVorteileCache()` currently reads the Ilaris system's vorteile compendium pack (`game.packs.get('Ilaris.vorteile')`) and filters by category. This reads ALL vorteile from the compendium, including ones not used in the current game. The Ilaris system has a configurable vorteile list in its settings that reflects which vorteile are actually in use. The cache should read from this configured list instead.

## What Changes

- Change `refreshVorteileCache()` to read from the Ilaris system's configured vorteile list setting instead of the compendium pack
- The list is already categorized, so category filtering may be simplified or removed

## Capabilities

### Modified Capabilities

- `ai-creature-generation`: The vorteile cache SHALL be populated from the Ilaris system's configured vorteile list setting, not from the compendium pack directly.

## Impact

- **Modified files**: `scripts/utilities.js` (`refreshVorteileCache` function)
- **No other changes**
