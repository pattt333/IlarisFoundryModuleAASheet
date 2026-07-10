## Context

The Ilaris Alternative Actor Sheet module's initiative subsystem consists of three V1 `Application` classes (`InitiativeDialog`, `MassInitiativeDialog`, `CombatDockApp`), a V1 `Dialog` subclass (`NegativeInitiativeDialog`), and one inline V1 `Dialog` usage. These were built before Foundry V13 deprecated the V1 Application framework. The module already contains 4 V2-migrated applications (`IlarisAlternativeFertigkeitDialog`, `IlarisAlternativeAiCreatureDialog`, `IlarisAlternativeItemApplyDialog`, `VorteileCacheRefresh`) that demonstrate the target pattern.

The `InitiativeStateManager` also uses the deprecated `CONST.ACTIVE_EFFECT_MODES.ADD` numeric constant (3 occurrences) when building ActiveEffect changes.

**Migration is mandatory**: Foundry V16 will remove the V1 `Application` class entirely. Foundry V15 will remove the `renderChatMessage` hook (the remaining warning, which originates from outside this module). The module already targets V14 compatibility.

## Goals / Non-Goals

**Goals:**
- Eliminate all V1 `Application` usage: migrate `InitiativeDialog`, `MassInitiativeDialog`, `CombatDockApp` to `HandlebarsApplicationMixin(ApplicationV2)`
- Replace V1 `Dialog` with `DialogV2` in `NegativeInitiativeDialog` and `MassInitiativeDialog._showUnprocessedDialog`
- Replace `CONST.ACTIVE_EFFECT_MODES.ADD` with the string `"add"` in `InitiativeStateManager`
- Replace all jQuery DOM manipulation with vanilla DOM in migrated classes
- Maintain identical functional behavior — the dialogs, dock, and effects must work exactly as before
- Follow the V2 pattern established by `IlarisAlternativeFertigkeitDialog`

**Non-Goals:**
- Changing dialog layout, styling, or UX
- Changing the template (.hbs) files (they remain identical)
- Changing `InitiativeStateManager` beyond the `ACTIVE_EFFECT_MODES` fix
- Changing `module.js` hook logic (only instantiation call syntax may adjust)
- Adding new features or modifying initiative calculation logic
- Migrating the Ilaris system's `HeldenSheet`/`KreaturSheet` (that's the system's responsibility)

## Decisions

### Decision 1: Follow the FertigkeitDialog V2 pattern exactly

**Chosen: `HandlebarsApplicationMixin(ApplicationV2)` with `DEFAULT_OPTIONS`, `PARTS`, `_prepareContext`, `_onRender`**

The `IlarisAlternativeFertigkeitDialog` is the closest existing V2 reference — it's a standalone dialog (not a sheet), uses Handlebars templates, has form inputs with state persistence, and complex UI interactions (dice, skill selection). The initiative dialogs share this profile.

Pattern:
```js
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class InitiativeDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'initiative-dialog'],
        position: { width: 520, height: 'auto' },
        window: {
            title: 'Initiative ansagen',
            resizable: true,
        },
        actions: {
            // Static action handlers for data-action attributes
        },
    };

    static PARTS = {
        form: {
            template: 'modules/ilaris-alternative-actor-sheet/templates/apps/initiative-dialog.hbs',
        },
    };

    // title accessor as before
    get title() { return `Initiative: ${this.actor.name}`; }

    // _prepareContext replaces getData()
    async _prepareContext(options) { ... }

    // _onRender replaces activateListeners()
    async _onRender(context, options) { ... }
}
```

**Alternatives considered:**
- Direct `ApplicationV2` without `HandlebarsApplicationMixin`: Would require manual `_renderHTML` and `_replaceHTML`, losing the template-based approach. Not consistent with the rest of the codebase.
- `DocumentSheetV2`: Not appropriate — these are not document sheets.

### Decision 2: jQuery → vanilla DOM for event handling and DOM manipulation

**Chosen: `data-action` attributes + static action handlers for click events, `this.element.querySelector()` for direct DOM access**

The V2 pattern uses `data-action` attributes on HTML elements with corresponding entries in `DEFAULT_OPTIONS.actions`. These map to static handler methods. For non-click interactions (input changes, select changes), use `_onRender` to attach event listeners via `addEventListener`.

Migration map:
| V1 Pattern | V2 Pattern |
|---|---|
| `html.find('input[name="iniMod"]').change(fn)` | `this.element.querySelector('input[name="iniMod"]').addEventListener('change', fn)` |
| `html.find('.action-card').click(fn)` | `DEFAULT_OPTIONS.actions: { toggleAction: ... }` + `data-action="toggleAction"` |
| `html.find('.ini-ansagen-btn').click(fn)` | `DEFAULT_OPTIONS.actions: { iniAnsagen: ... }` + `data-action="iniAnsagen"` |
| `$(event.currentTarget)` | `event.target` / `event.currentTarget` (native DOM) |
| `html.find('.formula-result').text(val)` | `this.element.querySelector('.formula-result').textContent = val` |
| `html.find('.formula-result').toggleClass('negative', cond)` | `this.element.querySelector('.formula-result').classList.toggle('negative', cond)` |
| `html.find('.dice-face').addClass('rolling')` | `this.element.querySelectorAll('.dice-face').forEach(el => el.classList.add('rolling'))` |

**Caveat**: `_updateFormulaBreakdown()` in `InitiativeDialog` currently uses jQuery for live DOM updates between renders. In V2, we have two options:
1. Convert to vanilla DOM (preferred — keeps the "live update" feel)
2. Call `this.render()` to re-render (simpler but causes flicker)

We'll use option 1 (vanilla DOM) since the formula breakdown updates on every keystroke, and re-rendering would be jarring.

### Decision 3: DialogV2 for confirmation dialogs

**Chosen: `DialogV2` with async/await pattern**

`NegativeInitiativeDialog` currently extends V1 `Dialog`. `MassInitiativeDialog._showUnprocessedDialog` creates a V1 `Dialog` inline. Both need `DialogV2`.

`DialogV2` uses a different API:
```js
// V1 (current):
new Dialog({ title, content, buttons, default }).render(true);

// V2:
const result = await DialogV2.prompt({
    window: { title },
    content,
    buttons: [{ action: 'yes', label: 'Ja', icon: 'fa-check' }],
});
```

For `NegativeInitiativeDialog`, which is called from `module.js` combat hooks, the existing callback-based API needs to become async/await. The calling code in `module.js` will need minor adjustments.

**Alternatives considered:**
- Keep `DialogV2` as a drop-in replacement with the same constructor pattern: Not possible — `DialogV2` has a fundamentally different API.
- Use `foundry.applications.api.DialogV2.wait()`: For the "unprocessed NPCs" dialog, this is appropriate since we need a user choice. For `NegativeInitiativeDialog`, which needs complex callbacks, `DialogV2.prompt()` or `DialogV2` with button callbacks works.

### Decision 4: Migration order

**Chosen: Bottom-up — `ACTIVE_EFFECT_MODES` fix first, then `CombatDockApp`, then `InitiativeDialog`/`MassInitiativeDialog`**

1. **`InitiativeStateManager` fix** (trivial, no dependencies) — changes `CONST.ACTIVE_EFFECT_MODES.ADD` → `"add"` in 3 places
2. **`CombatDockApp`** — simplest of the three Application V2 migrations (no form, no dice, no complex interactions). Serves as a warm-up.
3. **`InitiativeDialog`** — most complex (dice, weapons, formula breakdown), but isolated per-PC
4. **`MassInitiativeDialog`** — depends on `InitiativeDialog` patterns, plus DialogV2 for `_showUnprocessedDialog`
5. **`NegativeInitiativeDialog`** — last, since it's triggered by the combat round hook and depends on the dialogs working

### Decision 5: Template files unchanged

**Chosen: No template modifications**

The `.hbs` template files remain identical. The V2 migration only requires adding `data-action` attributes to buttons that need action handlers. However, since we're converting event handlers to use `_onRender` + `addEventListener` (to avoid template changes and keep the migration focused), the templates stay untouched.

**Exception**: If there are clear cases where `data-action` is cleaner (e.g., the "INI ansagen" button), we add the attribute. But the default approach is `_onRender` + `addEventListener` for form inputs and complex interactions.

### Decision 6: `_onRender` vs `_onFirstRender` for event binding

**Chosen: `_onRender` for event binding**

Per Foundry's API docs, `_onFirstRender` fires only on the initial render, while `_onRender` fires on every render (including re-renders). Since the initiative dialogs re-render frequently (on dice rolls, action selection, modifier changes), event listeners need to be re-bound after each render. Using `_onRender` ensures listeners are always attached after the DOM is replaced.

To avoid duplicate listeners, we'll use a cleanup step: remove old listeners before attaching new ones, or use the `{ once: true }` option where appropriate.

### Decision 7: CombatDockApp frameless HUD configuration

**Chosen: `window: { frame: false, positioned: false }` with `position: {}`**

The `CombatDockApp` is a fixed-position HUD bar (like Foundry's hotbar or scene controls), not a windowed dialog. The V1 equivalent was `popOut: false`. In V2, two `ApplicationWindowConfiguration` flags control this:

| Property | Value | Effect |
|----------|-------|--------|
| `window.frame` | `false` | Suppresses the window chrome: no title bar, no close button, no header controls |
| `window.positioned` | `false` | Tells V2 to skip `#applyPosition` — CSS alone controls layout |

**Why both are needed:**

- Without `frame: false`, V2 renders a full window frame (title bar with close button) — the combat dock should never have this.
- Without `positioned: false`, V2's render pipeline calls `setPosition` → `#applyPosition`, which crashes because the dock has no meaningful JS-managed position (it's a CSS fixed-bar).

The `position: {}` (empty object) is required by `ApplicationConfiguration` (all properties except `form` are mandatory), but the base class fills in defaults. Combined with `positioned: false`, V2 never tries to apply these values.

Confirmed against the V14 API:
- `ApplicationWindowConfiguration.frame?: boolean` — "Is this Application rendered inside a window frame?"
- `ApplicationWindowConfiguration.positioned?: boolean` — "Can this Application be positioned via JavaScript or only by CSS"

**Validation**: This configuration eliminates both the `Cannot read properties of undefined (reading 'width')` crash and the unwanted close button.

**Alternatives considered:**
- Removing `position` and `window` entirely: Crashes because both are required properties of `ApplicationConfiguration`. `_initializeApplicationOptions` can't merge missing required fields.
- Setting `window: {}` (empty): Renders a full window frame with close button. Wrong for a HUD bar.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| **Regressions in initiative calculation** — Formula breakdown, carry-over logic, or effect creation could break | `InitiativeStateManager` (shared logic) is unchanged except for ACTIVE_EFFECT_MODES fix. Calculation methods are untouched. |
| **DOM manipulation bugs** — jQuery → vanilla conversion could miss edge cases | Follow the exact mapping table from Decision 2. Test each interaction point (dice roll, action toggle, modifier change, INI ansagen). |
| **Re-render flicker** — V2's `render()` replaces innerHTML, causing brief visual flicker on state changes | Use vanilla DOM updates for formula breakdown (keeps existing behavior). Only call `this.render()` when structural changes occur (action selection, weapon change, dice count change). |
| **DialogV2 API incompatibility** — `NegativeInitiativeDialog` callbacks may not map cleanly to DialogV2's button-based API | DialogV2 supports per-button callbacks. The "Ja/Nein" pattern maps directly to `DialogV2.prompt()` with two buttons. |
| **module.js compatibility** — Instantiation calls may need adjustment | V2's `render({ force: true })` replaces V1's `render(true)`. Constructor signatures remain the same — they accept `options` via `super(options)`. |
| **`renderChatMessage` warning remains** — This originates from Foundry core or another module, not this codebase | Verify after migration that no new warnings appear. If the warning persists, investigate the Ilaris system or other modules. |
