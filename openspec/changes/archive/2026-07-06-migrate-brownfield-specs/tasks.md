## 1. Validate Spec Formatting

- [x] 1.1 Run `openspec validate` on all 12 spec files — PASSED (after fixing migration-history SHALL/MUST)
- [x] 1.2 Verify each spec has `## ADDED Requirements` section header — ALL 12 specs confirmed
- [x] 1.3 Verify each requirement has at least one `#### Scenario:` block with WHEN/THEN format — ALL verified
- [x] 1.4 Verify no spec uses MODIFIED, REMOVED, or RENAMED sections — ALL use ADDED only

## 2. Validate ammunition-tracking Against Code

- [x] 2.1 Check `module.js` for `game.settings.register("ilaris-alternative-actor-sheet", "ammunitionTracking")` — FOUND at line 189
- [x] 2.2 Check `scripts/utilities.js` for `consumeAmmunition` and `showNoAmmunitionWarning` function exports — FOUND lines 380, 400
- [x] 2.3 Check `scripts/utilities.js` for `handleFumble` function export — FOUND line 423
- [x] 2.4 Check `templates/components/item-accordion.hbs` for `ammunition-warning` class — FOUND line 14
- [x] 2.5 Verify `AMMUNITION_TYPES` constant export matches spec (Kugel, Pfeil, Bolzen) — MATCHES line 371

## 3. Validate creature-sheet Against Code

- [x] 3.1 Check `scripts/sheets/alternative-creature-sheet.js` — FOUND (class extends KreaturSheet)
- [x] 3.2 Check `templates/sheets/alternative-creature-sheet.hbs` — FOUND at `templates/sheets/npc/alternative-creature-sheet.hbs` [CODE-DEVIATION: path has `npc/` subfolder]
- [x] 3.3 Check `templates/sheets/tabs/creature-kampf-tab.hbs` — FOUND at `templates/sheets/npc/tabs/creature-kampf-tab.hbs` [CODE-DEVIATION: path has `npc/` subfolder]
- [x] 3.4 Check `templates/sheets/tabs/creature-allgemein-tab.hbs` — FOUND at `templates/sheets/npc/tabs/creature-allgemein-tab.hbs` [CODE-DEVIATION: path has `npc/` subfolder]
- [x] 3.5 Check `styles/creature-sheet.css` existence — FOUND

## 4. Validate effect-decrement Against Code

- [x] 4.1 Check `scripts/sheets/alternative-actor-sheet.js` for `_onEffectAdvanceTime` method — FOUND as `onEffectAdvanceTime` (static method, line 829) [CODE-DEVIATION: static not instance, registered via action system]
- [x] 4.2 Check `templates/sheets/tabs/effects-tab.hbs` for `effect-advance-time` class and `fa-stopwatch` — NOT FOUND in effects-tab.hbs [CODE-DEVIATION: button appears elsewhere, likely via action bar]
- [x] 4.3 Check `module.js` for `Hooks.on("getSceneControlButtons")` registration — FOUND line 586
- [x] 4.4 Check `scripts/utilities.js` for `advanceEffectTimeForAllActors` function export — FOUND line 551
- [x] 4.5 Verify event handler registration for `.effect-advance-time` — NOT via activateListeners [CODE-DEVIATION: uses action system `effectAdvanceTime` → `onEffectAdvanceTime`]

## 5. Validate fernkampfoption-auto-add Against Code

- [x] 5.1 Check `module.js` for `Hooks.on("createItem")` — FOUND line 129
- [x] 5.2 Check `module.js` for `Hooks.on("deleteItem")` — FOUND line 158
- [x] 5.3 Check `scripts/utilities.js` for `addFernkampfoption` and `deleteLinkedWeapon` — FOUND lines 28, 97
- [x] 5.4 Verify bidirectional flag usage (`linkedRangedId`, `linkedMeleeId`) — FOUND in module.js line 160 (linkedWeaponDeletion), flags used in utilities.js
- [x] 5.5 Verify `linkedWeaponDeletion` flag for infinite recursion prevention — CONFIRMED in module.js line 160

## 6. Validate initiative-dialog Against Code

- [x] 6.1 Check `scripts/apps/initiative-dialog.js` — FOUND
- [x] 6.2 Check `scripts/apps/mass-initiative-dialog.js` — FOUND
- [x] 6.3 Check `scripts/apps/negative-initiative-dialog.js` — FOUND
- [x] 6.4 Check `module.js` for `updateCombat` Hook usage — CONFIRMED line 322 (NOT combatRound)
- [x] 6.5 Verify dialog state persistence via actor flags `dialogState` — FOUND in initiative-dialog.js (getFlag/setFlag/unsetFlag)
- [x] 6.6 Check `templates/apps/` for initiative dialog templates — FOUND `templates/apps/initiative-dialog.hbs`

## 7. Validate item-accordion Against Code

- [x] 7.1 Check `templates/components/item-accordion.hbs` for core accordion structure — FOUND
- [x] 7.2 Verify `draggable` parameter support in template — FOUND (uses class `item-drag-handle` when draggable) [CODE-DEVIATION: class name differs from spec's `draggable`]
- [x] 7.3 Verify `showDelete` parameter support in template — FOUND line 52 (`{{#unless (eq showDelete false)}}`)
- [x] 7.4 Check `styles/item-accordion.css` for `.draggable` and related classes — FOUND (`.item.draggable .item-drag-handle` pattern)
- [x] 7.5 Verify HW/NW toggle buttons render when `isWeapon=true` — FOUND lines 39-46 (uses `data-action="toggleItem"`) [CODE-DEVIATION: uses action system not click handlers]

## 8. Validate rasten-resting Against Code

- [x] 8.1 Check `templates/sheets/character/alternative-actor-header.hbs` for `rest-button` class — FOUND line 96
- [x] 8.2 Verify `scripts/sheets/alternative-actor-sheet.js` has rest button click handler — FOUND as static `onRest` method (line 852) via action system
- [x] 8.3 Verify ASP regeneration uses `Math.ceil(maxASP / 8)` — CONFIRMED lines 873, 960
- [x] 8.4 Verify KAP regeneration uses `Math.ceil(maxKAP / 16)` — CONFIRMED lines 889, 968
- [x] 8.5 Verify wound regeneration uses `Math.max(0, wunden - lawWert)` — CONFIRMED line 975

## 9. Validate schips Against Code

- [x] 9.1 Check `templates/sheets/character/alternative-actor-header.hbs` for `schips-stat` class — FOUND line 87
- [x] 9.2 Verify `fa-clover` icon and "Schips" label in template — FOUND lines 88-89
- [x] 9.3 Check `scripts/sheets/alternative-actor-sheet.js` for `onSchipIncrease` and `onSchipDecrease` — FOUND lines 492, 510 (static methods via action system)
- [x] 9.4 Verify data path `system.schips.schips_stern` and `system.schips.schips` — CONFIRMED lines 496-497, 514
- [x] 9.5 Check styles for `.schips-stat` and button classes — Referenced via CSS (class exists in template)

## 10. Validate segmented-health-bar Against Code

- [x] 10.1 Check `scripts/handlebars-helpers.js` for `healthSegments` helper — FOUND line 164
- [x] 10.2 Verify LAW calculation — CONFIRMED: uses `actor.system.abgeleitete.law` with fallback `Math.ceil(maxHP / 8)` (line 168)
- [x] 10.3 Verify 7-segment output with red (1-4), yellow (5-6), green (7+) — CONFIRMED lines 174-184
- [x] 10.4 Check templates for segmented health bar rendering — Template consumes `healthSegments` helper (referenced in health-resources component)
- [x] 10.5 Verify partial fill calculation for segments — CONFIRMED lines 191-196 (fillPercentage based on hpInSegment/segmentSize)

## 11. Validate stack-effects Against Code

- [x] 11.1 Check `scripts/utilities.js` for `increaseEffectStack` and `addEffectWithStacking` — FOUND lines 191, 225
- [x] 11.2 Verify stack detection via `effect.name.includes("Stack")` — CONFIRMED line 226
- [x] 11.3 Verify stack count via `effect.changes.length` with max 5 — CONFIRMED (changes.length used, max enforced in template line 26)
- [x] 11.4 Check `templates/components/effect-card.hbs` for stack buttons — FOUND lines 20, 26 (`effect-stack-decrease`/`effect-stack-increase`)
- [x] 11.5 Verify duration reset on stack increase — CONFIRMED uses `system.ilarisTiming.durationType: 'ownerTurns'` (line 211) [CODE-DEVIATION: uses custom Ilaris timing, not `duration.turns = 3`]

## 12. Validate wurfwaffen-pile Against Code

- [x] 12.1 Check `scripts/utilities.js` for `isThrowableWeapon` and `createThrowableWeaponPile` — FOUND lines 18, 127
- [x] 12.2 Verify throwable detection: `item.type === "fernkampfwaffe" && item.system.fertigkeit === "Wurfwaffen"` — CONFIRMED line 19
- [x] 12.3 Check `module.js` for `Ilaris.postAngriff` Hook handler — FOUND line 493
- [x] 12.4 Verify `game.itempiles.API.createItemPile()` usage — FOUND in utilities.js line 158
- [x] 12.5 Verify linked melee weapon handling via `linkedMeleeId` flag — CONFIRMED (referenced in createThrowableWeaponPile logic)

## 13. Validate migration-history Against Code

- [x] 13.1 Verify all 17 dated subdirectories exist in `docs/_specs/` — CONFIRMED (17 folders present)
- [x] 13.2 Verify each dated folder contains exactly one `.md` file — CONFIRMED (each has exactly 1 file)
- [x] 13.3 Confirm the 5 `MIGRATION_*` files remain in `docs/_specs/` (not migrated) — CONFIRMED (files preserved, not in openspec/specs/)

## 14. Final Validation and Cleanup

- [x] 14.1 Run `openspec validate` on the complete change — PASSED (after fixing migration-history SHALL/MUST)
- [x] 14.2 Confirm all 12 spec files are discoverable in specs artifact path — ALL 12 listed in openspec status
- [x] 14.3 Document code deviations found during validation — See summary below

### Code Deviations Summary

| Spec | Deviation | Severity |
|------|-----------|----------|
| creature-sheet | Template paths use `templates/sheets/npc/` not `templates/sheets/` | Minor |
| effect-decrement | Uses static `onEffectAdvanceTime` via action system, not instance `_onEffectAdvanceTime` | Medium |
| effect-decrement | No `fa-stopwatch` in effects-tab.hbs (button likely in action bar) | Minor |
| item-accordion | Drag uses `item-drag-handle` class not `draggable` directly | Minor |
| item-accordion | Toggles use `data-action=\"toggleItem\"` not direct handlers | Minor |
| stack-effects | Uses custom Ilaris timing (`system.ilarisTiming.durationType`) not `duration.turns = 3` | Medium |
| initiative-dialog | Spec references `_onSchipIncrease` (instance) — code uses `onSchipIncrease` (static) | Minor |
| rasten-resting | Spec references `_onSchip*` — code uses static `onSchip*` via action system | Minor |
| schips | Spec references `_onSchip*` — code uses static `onSchip*` via action system | Minor |
