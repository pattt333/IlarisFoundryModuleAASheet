## 1. InitiativeStateManager — ACTIVE_EFFECT_MODES fix

- [x] 1.1 Replace `CONST.ACTIVE_EFFECT_MODES.ADD` with `"add"` in `scripts/apps/initiative-state-manager.js` line 368 (iniDelta change)
- [x] 1.2 Replace `CONST.ACTIVE_EFFECT_MODES.ADD` with `"add"` in `scripts/apps/initiative-state-manager.js` line 376 (finalAtMod change)
- [x] 1.3 Replace `CONST.ACTIVE_EFFECT_MODES.ADD` with `"add"` in `scripts/apps/initiative-state-manager.js` line 384 (finalVtMod change)

## 2. CombatDockApp — V1 to V2 migration

- [x] 2.1 Change base class: `extends Application` → `HandlebarsApplicationMixin(ApplicationV2)` in `scripts/apps/combat-dock.js`
- [x] 2.2 Add import: `const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;` at top of `scripts/apps/combat-dock.js`
- [x] 2.3 Convert `static get defaultOptions()` to `static DEFAULT_OPTIONS` with `classes`, `position`, `window` properties
- [x] 2.4 Move `template` from options to `static PARTS = { main: { template: '...' } }`
- [x] 2.5 Convert `getData()` → `async _prepareContext(options)` in `scripts/apps/combat-dock.js`
- [x] 2.6 Convert `activateListeners(html)` → `async _onRender(context, options)` in `scripts/apps/combat-dock.js`
- [x] 2.7 Replace jQuery `html.find()` with `this.element.querySelector()` / `addEventListener()` in `scripts/apps/combat-dock.js`
- [x] 2.8 Update instantiation calls in `module.js` if needed (no changes required — V2 render accepts same boolean signature)

## 3. InitiativeDialog — V1 to V2 migration

- [x] 3.1 Change base class: `extends Application` → `HandlebarsApplicationMixin(ApplicationV2)` in `scripts/apps/initiative-dialog.js`
- [x] 3.2 Add import: `const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;` at top of `scripts/apps/initiative-dialog.js`
- [x] 3.3 Convert `static get defaultOptions()` to `static DEFAULT_OPTIONS` with `classes`, `position`, `window`, `actions` properties
- [x] 3.4 Move `template` from options to `static PARTS = { form: { template: '...' } }`
- [x] 3.5 Convert `getData()` → `async _prepareContext(options)` in `scripts/apps/initiative-dialog.js`
- [x] 3.6 Convert `activateListeners(html)` → event binding in `async _onRender(context, options)` for input listeners (`iniMod`, `atMod`, `vtMod`, `diceCount`, `selectedWeapon`, `manualDice`)
- [x] 3.7 Add `data-action` attributes to buttons in `templates/apps/initiative-dialog.hbs` (roll-dice, ini-ansagen, cancel) and wire to `DEFAULT_OPTIONS.actions`
- [x] 3.8 Replace jQuery in `_updateFormulaBreakdown()`: `html.find()` → `this.element.querySelector()`, `.text()` → `.textContent`, `.toggleClass()` → `.classList.toggle()`
- [x] 3.9 Replace jQuery in `_onRollDice()`: dice face animation and result display using vanilla DOM (`querySelectorAll`, `classList.add/remove`)
- [x] 3.10 Replace jQuery in `_onSelectDice()`: `.find().removeClass()` / `.addClass()` → vanilla DOM
- [x] 3.11 Replace jQuery in `_onActionCardClick()`: remove any remaining jQuery references
- [x] 3.12 Verify `_updateObject` works with V2 form submission (dead code — change listeners handle all input, form has no submit button)
- [x] 3.13 Update instantiation calls in `module.js` lines 380, 598 and the `combatStart`/`updateCombat` hooks (no changes needed — V2 render accepts same boolean signature)

## 4. MassInitiativeDialog — V1 to V2 migration

- [x] 4.1 Change base class: `extends Application` → `HandlebarsApplicationMixin(ApplicationV2)` in `scripts/apps/mass-initiative-dialog.js`
- [x] 4.2 Add import: `const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;` at top of `scripts/apps/mass-initiative-dialog.js`
- [x] 4.3 Convert `static get defaultOptions()` to `static DEFAULT_OPTIONS` with `classes`, `position`, `window`, `actions` properties
- [x] 4.4 Move `template` from options to `static PARTS = { form: { template: '...' } }`
- [x] 4.5 Convert `getData()` → `async _prepareContext(options)` in `scripts/apps/mass-initiative-dialog.js`
- [x] 4.6 Convert `activateListeners(html)` → event binding in `async _onRender(context, options)` for all form and card interactions
- [x] 4.7 Add `data-action` attributes for "INI ansagen" and "Abbrechen" buttons in `templates/apps/mass-initiative-dialog.hbs`
- [x] 4.8 Replace all jQuery `html.find()` calls with `this.element.querySelector()` / `querySelectorAll()` + `addEventListener()`
- [x] 4.9 Convert `_showUnprocessedDialog()` from `new Dialog(...)` (V1) to `DialogV2` in `scripts/apps/mass-initiative-dialog.js`
- [x] 4.10 Add import for `DialogV2` at top of `scripts/apps/mass-initiative-dialog.js`
- [x] 4.11 Update instantiation calls in `module.js` for `MassInitiativeDialog` (no changes needed — V2 render accepts same boolean signature)

## 5. NegativeInitiativeDialog — V1 Dialog to DialogV2

- [x] 5.1 Rewrite `NegativeInitiativeDialog` class: remove `extends Dialog`, convert to static method using `DialogV2` in `scripts/apps/negative-initiative-dialog.js`
- [x] 5.2 Implement "Ja" button callback to keep effect and notify
- [x] 5.3 Implement "Nein" button callback to remove combat effects and clear dialogState
- [x] 5.4 Update import in `scripts/apps/negative-initiative-dialog.js` (uses `DialogV2` from `foundry.applications.api`)
- [x] 5.5 Update callers: class is not instantiated in this module's code — static `NegativeInitiativeDialog.show(actor, combat)` API available for external callers

## 6. Verification

- [x] 6.1 Run `npm test` to verify no Jest test regressions (no test script configured — lint passes for modified files)
- [ ] 6.2 Manually verify: PC initiative dialog opens without V1 Application deprecation warning
- [ ] 6.3 Manually verify: Mass initiative dialog opens without V1 Application deprecation warning
- [ ] 6.4 Manually verify: Combat dock renders without V1 Application deprecation warning
- [ ] 6.5 Manually verify: "NPCs nicht fertig" dialog uses DialogV2 (no V1 Dialog deprecation)
- [ ] 6.6 Manually verify: "Aktion fortsetzen?" dialog uses DialogV2 (no V1 Dialog deprecation)
- [ ] 6.7 Manually verify: No `CONST.ACTIVE_EFFECT_MODES` deprecation when creating combat effects
- [ ] 6.8 Manually verify: Dice rolling, action selection, weapon selection, INI ansagen all work correctly in PC dialog
- [ ] 6.9 Manually verify: Batch operations, card states, locked NPC behavior all work correctly in mass dialog
- [ ] 6.10 Manually verify: Negative initiative carry-over and round change re-open behavior works correctly
