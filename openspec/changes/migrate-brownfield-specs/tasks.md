## 1. Validate Spec Formatting

- [ ] 1.1 Run `openspec validate` on all 12 spec files in `openspec/changes/migrate-brownfield-specs/specs/` to ensure valid OpenSpec format
- [ ] 1.2 Verify each spec has `## ADDED Requirements` section header
- [ ] 1.3 Verify each requirement has at least one `#### Scenario:` block with WHEN/THEN format
- [ ] 1.4 Verify no spec uses MODIFIED, REMOVED, or RENAMED sections (all are new capabilities)

## 2. Validate ammunition-tracking Against Code

- [ ] 2.1 Check `module.js` for `game.settings.register("ilaris-alternative-actor-sheet", "ammunitionTracking")` existence
- [ ] 2.2 Check `scripts/utilities.js` for `consumeAmmunition` and `showNoAmmunitionWarning` function exports
- [ ] 2.3 Check `scripts/utilities.js` for `handleFumble` function export
- [ ] 2.4 Check `templates/components/item-accordion.hbs` for `ammunition-warning` class reference
- [ ] 2.5 Verify `AMMUNITION_TYPES` constant export matches spec (Kugel, Pfeil, Bolzen)

## 3. Validate creature-sheet Against Code

- [ ] 3.1 Check `scripts/sheets/alternative-creature-sheet.js` file existence and class definition
- [ ] 3.2 Check `templates/sheets/alternative-creature-sheet.hbs` existence
- [ ] 3.3 Check `templates/sheets/tabs/creature-kampf-tab.hbs` existence
- [ ] 3.4 Check `templates/sheets/tabs/creature-allgemein-tab.hbs` existence
- [ ] 3.5 Check `styles/creature-sheet.css` existence

## 4. Validate effect-decrement Against Code

- [ ] 4.1 Check `scripts/sheets/alternative-actor-sheet.js` for `_onEffectAdvanceTime` method
- [ ] 4.2 Check `templates/sheets/tabs/effects-tab.hbs` for `effect-advance-time` class and `fa-stopwatch` icon
- [ ] 4.3 Check `module.js` for `Hooks.on("getSceneControlButtons")` registration
- [ ] 4.4 Check `scripts/utilities.js` for `advanceEffectTimeForAllActors` function export
- [ ] 4.5 Verify event handler registration in `activateListeners()` for `.effect-advance-time`

## 5. Validate fernkampfoption-auto-add Against Code

- [ ] 5.1 Check `module.js` for `Hooks.on("createItem")` with Fernkampfoption detection logic
- [ ] 5.2 Check `module.js` for `Hooks.on("deleteItem")` with linked weapon cascade logic
- [ ] 5.3 Check `scripts/utilities.js` for `addFernkampfoption` and `deleteLinkedWeapon` function exports
- [ ] 5.4 Verify bidirectional flag usage (`linkedRangedId`, `linkedMeleeId`)
- [ ] 5.5 Verify `linkedWeaponDeletion` flag for infinite recursion prevention

## 6. Validate initiative-dialog Against Code

- [ ] 6.1 Check `scripts/apps/initiative-dialog.js` file existence
- [ ] 6.2 Check `scripts/apps/mass-initiative-dialog.js` file existence
- [ ] 6.3 Check `scripts/apps/negative-initiative-dialog.js` file existence
- [ ] 6.4 Check `module.js` for `updateCombat` Hook usage (NOT `combatRound`)
- [ ] 6.5 Verify dialog state persistence via actor flags `dialogState`
- [ ] 6.6 Check `templates/apps/` for initiative dialog templates

## 7. Validate item-accordion Against Code

- [ ] 7.1 Check `templates/components/item-accordion.hbs` for core accordion structure
- [ ] 7.2 Verify `draggable` parameter support in template
- [ ] 7.3 Verify `showDelete` parameter support in template
- [ ] 7.4 Check `styles/item-accordion.css` for `.draggable` and related classes
- [ ] 7.5 Verify HW/NW toggle buttons render when `isWeapon=true`

## 8. Validate rasten-resting Against Code

- [ ] 8.1 Check `templates/sheets/alternative-actor-sheet.hbs` for `rest-button` class
- [ ] 8.2 Verify `scripts/sheets/alternative-actor-sheet.js` has rest button click handler
- [ ] 8.3 Verify ASP regeneration uses `Math.ceil(maxASP / 8)` (max, not current)
- [ ] 8.4 Verify KAP regeneration uses `Math.ceil(maxKAP / 16)` (not /4)
- [ ] 8.5 Verify wound regeneration uses `Math.max(0, wunden - lawWert)` (subtraction)

## 9. Validate schips Against Code

- [ ] 9.1 Check `templates/sheets/alternative-actor-sheet.hbs` for `schips-stat` class
- [ ] 9.2 Verify `fa-clover` icon and "Schips" label in template
- [ ] 9.3 Check `scripts/sheets/alternative-actor-sheet.js` for `_onSchipIncrease` and `_onSchipDecrease` methods
- [ ] 9.4 Verify data path `system.schips.schips_stern` and `system.schips.schips` usage
- [ ] 9.5 Check styles for `.schips-stat` and button classes

## 10. Validate segmented-health-bar Against Code

- [ ] 10.1 Check `scripts/handlebars-helpers.js` for `healthSegments` helper registration
- [ ] 10.2 Verify LAW calculation: `Math.ceil(hp_max / 8)`
- [ ] 10.3 Verify 7-segment output with red (1-4), yellow (5-6), green (7+) color coding
- [ ] 10.4 Check templates for segmented health bar rendering
- [ ] 10.5 Verify partial fill calculation for segments

## 11. Validate stack-effects Against Code

- [ ] 11.1 Check `scripts/utilities.js` for `increaseEffectStack` and `addEffectWithStacking` function exports
- [ ] 11.2 Verify stack detection via `effect.name.includes("Stack")`
- [ ] 11.3 Verify stack count via `effect.changes.length` with max 5
- [ ] 11.4 Check `templates/components/effect-card.hbs` for `effect-stack-increase`/`effect-stack-decrease` buttons
- [ ] 11.5 Verify duration reset to 3 turns on stack increase

## 12. Validate wurfwaffen-pile Against Code

- [ ] 12.1 Check `scripts/utilities.js` for `isThrowableWeapon` and `createThrowableWeaponPile` function exports
- [ ] 12.2 Verify throwable detection: `item.type === "fernkampfwaffe" && item.system.fertigkeit === "Wurfwaffen"`
- [ ] 12.3 Check `module.js` for `Ilaris.postAngriff` Hook handler with `attackType === "ranged"`
- [ ] 12.4 Verify `game.itempiles.API.createItemPile()` usage
- [ ] 12.5 Verify linked melee weapon handling via `linkedMeleeId` flag

## 13. Validate migration-history Against Code

- [ ] 13.1 Verify all 17 dated subdirectories exist in `docs/_specs/`
- [ ] 13.2 Verify each dated folder contains exactly one `.md` file
- [ ] 13.3 Confirm the 5 `MIGRATION_*` files remain in `docs/_specs/` (not migrated)

## 14. Final Validation and Cleanup

- [ ] 14.1 Run `openspec validate` on the complete change to ensure all artifacts are valid
- [ ] 14.2 Confirm all 12 spec files are discoverable in the specs artifact path
- [ ] 14.3 Document any code deviations found during validation in a summary comment on this change
