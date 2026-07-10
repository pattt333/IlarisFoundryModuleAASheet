## Why

The initiative dialogs and combat dock were built on Foundry's V1 Application framework (`extends Application`) and use deprecated APIs (`CONST.ACTIVE_EFFECT_MODES`, V1 `Dialog`). Foundry V13 deprecated these APIs, and they will be **removed** in V15 (renderChatMessage) and V16 (ApplicationV1, ACTIVE_EFFECT_MODES). Since the module already targets Foundry V14 compatibility, these deprecation warnings appear on every initiative interaction — flooding the console and signaling incompatibility with future Foundry versions.

## What Changes

- **Migrate `InitiativeDialog` from `Application` (V1) to `HandlebarsApplicationMixin(ApplicationV2)`** — following the pattern already established by `IlarisAlternativeFertigkeitDialog`, `IlarisAlternativeAiCreatureDialog`, and `IlarisAlternativeItemApplyDialog`
- **Migrate `MassInitiativeDialog` from `Application` (V1) to `HandlebarsApplicationMixin(ApplicationV2)`**
- **Migrate `CombatDockApp` from `Application` (V1) to `HandlebarsApplicationMixin(ApplicationV2)`**
- **Replace `new Dialog(...)` (V1) in `MassInitiativeDialog._showUnprocessedDialog` with `DialogV2`**
- **Migrate `NegativeInitiativeDialog` from `extends Dialog` (V1) to `DialogV2`**
- **Replace `CONST.ACTIVE_EFFECT_MODES.ADD` with `"add"` in `InitiativeStateManager.buildEffectChanges`** (3 occurrences)
- **Replace jQuery DOM manipulation with vanilla DOM** in migrated classes — required by the V2 pattern (no `this.element.find()`, use `this.element.querySelector()`)

No functional behavior changes. The dialogs, dock, and effect creation logic will work identically — just using current Foundry APIs.

## Capabilities

### New Capabilities

- `deprecation-cleanup`: Systematic elimination of deprecated Foundry API usage across the initiative subsystem, ensuring compatibility with Foundry V15+ by replacing V1 Application classes with ApplicationV2, V1 Dialog with DialogV2, and numeric ActiveEffect modes with string types.

### Modified Capabilities

None. The functional requirements defined in `initiative-dialog`, `mass-initiative-dashboard`, and `combat-dock` specs remain unchanged. This is purely an implementation-level migration.

## Impact

**Affected files:**
- `scripts/apps/initiative-dialog.js` — Full V2 migration (~700 lines)
- `scripts/apps/mass-initiative-dialog.js` — Full V2 migration (~600 lines)
- `scripts/apps/combat-dock.js` — Full V2 migration (~300 lines)
- `scripts/apps/initiative-state-manager.js` — 3-line change (ACTIVE_EFFECT_MODES → string)
- `scripts/apps/negative-initiative-dialog.js` — Dialog V1 → DialogV2 rewrite
- `module.js` — Instantiation calls for the three migrated classes (may need adjustment for V2 render options)

**Foundry APIs affected:**
- `Application` → `HandlebarsApplicationMixin(ApplicationV2)`
- `Dialog` (V1) → `DialogV2`
- `CONST.ACTIVE_EFFECT_MODES.ADD` → `"add"` (string type)

**Risk:** High — these are core combat workflow dialogs. Bugs would break initiative for all users. Mitigation: the codebase already has 4 V2-migrated applications to use as reference patterns.
