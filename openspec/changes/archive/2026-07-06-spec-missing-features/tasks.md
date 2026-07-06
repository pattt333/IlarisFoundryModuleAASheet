## 1. Validate Spec Formatting

- [x] 1.1 Run `openspec validate` on all 6 spec files — PASSED
- [x] 1.2 Verify each spec has `## ADDED Requirements` section header — ALL 6 confirmed
- [x] 1.3 Verify each requirement has at least one `#### Scenario:` block with WHEN/THEN format — ALL verified

## 2. Validate fertigkeit-dialog Against Code

- [x] 2.1 Check `scripts/apps/fertigkeit-dialog.js` for class `IlarisAlternativeFertigkeitDialog` — FOUND line 25
- [x] 2.2 Verify probe types: `fertigkeit`, `attribut`, `freieFertigkeit` — CONFIRMED (switch in `_getDialogTitle`)
- [x] 2.3 Verify context constants: `none`, `gatherMaterials`, `craftItem`, `buyItem` — CONFIRMED (`CONTEXT_LABELS`, `CONTEXT_DIFFICULTY_CONFIG`)
- [x] 2.4 Verify `MATERIAL_ITEM_NAME_PATTERN` = `/(zutat|material)/i` — CONFIRMED line 16
- [x] 2.5 Verify `evaluate_roll_with_crit` and `postRollToChat` imports — CONFIRMED line 1
- [x] 2.6 Check `templates/apps/fertigkeit-dialog.hbs` existence — FOUND
- [x] 2.7 Check `styles/fertigkeit-dialog.css` existence — FOUND

## 3. Validate item-application Against Code

- [x] 3.1 Check `scripts/apps/item-apply-dialog.js` for class `IlarisAlternativeItemApplyDialog` — FOUND line 6
- [x] 3.2 Verify `TargetSelectionDialog` import from Ilaris system — CONFIRMED line 1
- [x] 3.3 Verify actions: `chooseTargets`, `applyItem`, `closeDialog` — CONFIRMED lines 15-17
- [x] 3.4 Verify `canApply` logic: item, quantity > 0, targets, not applying — CONFIRMED line 56
- [x] 3.5 Verify `isApplying` guard prevents double-submission — CONFIRMED line 77
- [x] 3.6 Verify `consumeInventoryItem` and `createItemApplicationPayload` imports — CONFIRMED line 2
- [x] 3.7 Check `templates/apps/item-apply-dialog.hbs` existence — FOUND

## 4. Validate favorites-system Against Code

- [x] 4.1 Check `scripts/components/favorites-manager.js` for `FavoritesManager` class — FOUND line 9
- [x] 4.2 Verify tab switching: `onFavoritesTabSwitch` — CONFIRMED (dataset.tab, active class toggle)
- [x] 4.3 Verify collapse toggle: `onFavoritesToggle` — CONFIRMED (collapsed class, chevron icon swap)
- [x] 4.4 Verify clear button: `onFavoritesClear` — CONFIRMED (DialogV2.confirm, notification)
- [x] 4.5 Verify sessionStorage keys — CONFIRMED (`ilaris-favorites-active-tab-{actorId}`, `ilaris-favorites-collapsed-{actorId}`)
- [x] 4.6 Verify clear button only on favorites tab — CONFIRMED (`data-tab === 'favorites'`)
- [x] 4.7 Check `templates/components/favorites-component.hbs` existence — FOUND
- [x] 4.8 Check `styles/favorites-component.css` existence — FOUND

## 5. Validate item-application-utilities Against Code

- [x] 5.1 Check `scripts/utilities.js` for `consumeInventoryItem` — FOUND line 247
- [x] 5.2 Check `scripts/utilities.js` for `createItemApplicationPayload` — FOUND line 280
- [x] 5.3 Check `scripts/utilities.js` for `applyItemToTarget` — FOUND line 313
- [x] 5.4 Check `scripts/utilities.js` for `applyBleedingEffect` — FOUND line 338

## 6. Validate carrying-system Against Code

- [x] 6.1 Check `templates/components/carrying.hbs` existence — FOUND
- [x] 6.2 Check `templates/components/supporting.hbs` existence — FOUND
- [x] 6.3 Check `templates/components/handcart.hbs` existence — FOUND
- [x] 6.4 Verify carrying.hbs uses `item-accordion` partial — CONFIRMED line 8

## 7. Validate sheet-settings-dialogs Against Code

- [x] 7.1 Check `scripts/sheets/alternative-actor-sheet.js` for `energySettings` — FOUND line 527 (`onEnergySettings`)
- [x] 7.2 Check `scripts/sheets/alternative-actor-sheet.js` for `healthSettings` — FOUND line 612 (`onHealthSettings`)
- [x] 7.3 Check `scripts/sheets/alternative-actor-sheet.js` for `itemQuantityChange` — FOUND line 422 (`onItemQuantityChange`)
- [x] 7.4 Check `scripts/sheets/alternative-actor-sheet.js` for `hexagonEdit` — FOUND line 732 (`onHexagonEdit`)
- [x] 7.5 Check `scripts/sheets/alternative-actor-sheet.js` for `editStat` — FOUND line 681 (`onEditStat`)
- [x] 7.6 Check `scripts/sheets/alternative-creature-sheet.js` for `energySettings`, `healthSettings`, `editStat` — CONFIRMED lines 206, 291, 360

## 8. Final Validation

- [x] 8.1 Run `openspec validate` on the complete change — PASSED
- [x] 8.2 Confirm all 6 spec files are discoverable — ALL 6 listed in openspec status
- [x] 8.3 No code deviations found — all specs match implementation exactly


- [ ] 8.3 Document any code deviations found during validation
