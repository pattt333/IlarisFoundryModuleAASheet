## Context

The current button uses `renderSettingsConfig` with DOM queries. The Foundry API provides `registerMenu` for declarative settings buttons.

## Decisions

### Decision 1: Minimal FormApplication that auto-closes

A `FormApplication` subclass (`VorteileCacheRefresh`) with no template — on first render, it calls `refreshVorteileCache()` and immediately closes. The user never sees a window.

**Rationale**: `registerMenu` requires a `FormApplication` type. Creating a no-op form that auto-closes is the simplest valid implementation for a one-shot action button.
