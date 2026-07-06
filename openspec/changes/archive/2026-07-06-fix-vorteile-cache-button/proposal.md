## Why

The "Vorteile-Cache aktualisieren" button in module settings uses `Hooks.on('renderSettingsConfig', ...)` with DOM query selectors (`[data-tab="ilaris-alternative-actor-sheet"]`). This is fragile — the selector may break across Foundry versions and it's not the recommended API. The proper Foundry VTT approach is `game.settings.registerMenu()` which creates the button declaratively via the settings API.

## What Changes

- Replace the `Hooks.on('renderSettingsConfig', ...)` block with a `game.settings.registerMenu()` call in `Hooks.once('init')`
- Create a minimal `FormApplication` subclass (`VorteileCacheRefresh`) that calls `refreshVorteileCache()` on render and closes immediately

## Capabilities

### Modified Capabilities

- `ai-creature-generation`: The vorteile cache refresh button SHALL use `game.settings.registerMenu()` with a `FormApplication` subclass, following the Foundry VTT settings API pattern.

## Impact

- **Modified files**: `module.js` (remove renderSettingsConfig hook, add registerMenu call)
- **New files**: `scripts/apps/vorteile-cache-refresh.js` (minimal FormApplication)
- **No Hook changes**: Removes one hook, adds none
