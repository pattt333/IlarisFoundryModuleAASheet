## 1. Sheet context: Replace effectItem with aktion

- [x] 1.1 In `scripts/sheets/alternative-actor-sheet.js`, change `i.type === 'effectItem'` to `i.type === 'aktion'` and rename `context.actor.effectItems` to `context.actor.aktionen` (lines 133-134, 177)
- [x] 1.2 In `scripts/sheets/alternative-creature-sheet.js`, apply the same filter and context rename (lines 101-102, 129)
- [x] 1.3 In `templates/sheets/character/tabs/kampf-tab.hbs`, change `data-itemclass="effectItem"` to `data-itemclass="aktion"` and `{{#each actor.effectItems}}` to `{{#each actor.aktionen}}` (lines 128, 132)

## 2. InitiativeStateManager: Rewrite action loading, remove kombiniert, typed effects

- [x] 2.1 In `scripts/apps/initiative-state-manager.js`, rewrite `loadAvailableActions()` to scan actor items (`type === 'aktion'`), `game.items` (`type === 'aktion'`), and all world compendium packs of document type `Item` (filtered via `getIndex()` for `type === 'aktion'`). Deduplicate by `name` with priority: actor > world > compendium. Remove the `nenneke-aktionen` compendium reference. Use typed access (`item.system.iniMod`, `item.system.atMod`, `item.system.vtMod`, `item.system.aktionstyp`, `item.system.bedingungen`) instead of regex-parsing `effect.changes`.
- [x] 2.2 In `scripts/apps/initiative-state-manager.js`, remove `kombinierteAktion` from `_defaultState()`, both `loadState()` branches, and `persistState()`. Compute combination auto-derived from selected actions' `aktionstyp` in `calculateTotalInitiative()`, `calculateActionModifiers()`, and `buildEffectChanges()`.
- [x] 2.3 In `scripts/apps/initiative-state-manager.js`, update `buildEffectChanges()` to use typed `action.system.atMod` / `.vtMod` instead of regex-scanning effects. Add `ilarisTiming: { durationType: "turns", remaining: 1, expiresOn: "turnEnd" }` to the constructed effect.
- [x] 2.4 In `scripts/apps/initiative-state-manager.js`, update chat message formatting (`postIndividualChatMessage` and mass summary) to use typed aktion data and auto-derived combination values instead of `state.kombinierteAktion`.

## 3. InitiativeDialog: Rewrite action loading, remove kombiniert, add gating

- [x] 3.1 In `scripts/apps/initiative-dialog.js`, rewrite `_loadAvailableActions()` to use the same universal discovery as `InitiativeStateManager.loadAvailableActions()`. Remove the regex-based `iniMod` computation loop. Use typed access.
- [x] 3.2 In `scripts/apps/initiative-dialog.js`, remove `kombinierteAktion` from constructor, `_loadPersistedState()`, `_savePersistedState()`, `_prepareContext()`, and all event handlers. Add `_deriveCombination()` method that checks selected actions' `aktionstyp` and returns `{ isCombined, malus }`.
- [x] 3.3 In `scripts/apps/initiative-dialog.js`, add `_applyWeaponGating(selectedWeapon)` method that marks actions as `grayedOut` with a `grayedOutReason` string based on `bedingungen.waffentyp` and `bedingungen.eigenschaften`. Call this from `_onWeaponChange()` and `_prepareContext()`.
- [x] 3.4 In `scripts/apps/initiative-dialog.js`, update `#onActionCardClick` to block selection when a komplex action is already selected, and to auto-apply the -4 badge when two einfache are selected.
- [x] 3.5 In `scripts/apps/initiative-dialog.js`, update `_getFormulaParts()` and `_calculateTotalInitiative()` to use typed aktion data and the auto-derived combination malus instead of `kombinierteAktion`.
- [x] 3.6 In `scripts/apps/initiative-dialog.js`, update `#onIniAnsagen` to pass typed aktion data through to `InitiativeStateManager.createCombatEffects()`.

## 4. MassInitiativeDialog: Remove kombiniert, add gating

- [x] 4.1 In `scripts/apps/mass-initiative-dialog.js`, remove `kombinierteAktion` from all state management. Replace with auto-derived combination based on each NPC's selected actions' `aktionstyp`.
- [x] 4.2 In `scripts/apps/mass-initiative-dialog.js`, add weapon gating logic for NPCs (same pattern as PC dialog where applicable — NPCs may not have weapon selection but actions should still show `aktionstyp` badges).

## 5. Templates: Remove checkbox, add gray-out, add combination badge

- [x] 5.1 In `templates/apps/initiative-dialog.hbs`, remove the "Kombinierte Aktion" checkbox element (lines 85-87). Add rendering of `aktionstyp` badge on each action card. Add `.grayed-out` class binding and `title` attribute for `grayedOutReason`. Add `.combination-badge` element that appears when two einfache actions are selected.
- [x] 5.2 In `templates/apps/mass-initiative-dialog.hbs`, remove the `kombinierteAktion` checkbox from the modifier row. Add `aktionstyp` badge rendering on action chips.

## 6. Styles: Gray-out and combination badge CSS

- [x] 6.1 In `styles/initiative-dialog.css`, add `.action-card.grayed-out { opacity: 0.4; pointer-events: none; }` and `.combination-badge` styling (small pill/badge with accent color).
- [x] 6.2 In `styles/mass-initiative-dialog.css`, add the same `.grayed-out` style for action elements.

## 7. Verify

- [x] 7.1 Run `npm test` in the module to verify no regressions (no test script in module)
- [x] 7.2 Run `npm run lint` to verify code style (only pre-existing CRLF issues, no new errors)
- [ ] 7.3 Manually verify in Foundry: open initiative dialog for a PC with aktion items, select weapon, verify gating and gray-out, select two einfache actions, verify auto-combination badge and -4 malus, select komplex action, verify second card blocked, confirm initiative, verify effect has ilarisTiming
