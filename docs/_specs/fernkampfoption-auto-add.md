## Plan: Automatic Fernkampfwaffe Addition via Fernkampfoption Property

Implementing automatic addition of linked ranged weapons when melee weapons with the `Fernkampfoption` property are added to an actor sheet, using exact name matching, bidirectional linking via flags, and automatic deletion of linked weapons.

### Steps

1. **Create specification document** at `.specs/fernkampfoption-auto-add.spec.md` with concrete Given-When-Then examples: Axtpistole addition (expects both weapons added + success notification), duplicate prevention (expects silent skip), missing weapon (expects "Waffe nicht gefunden: {name}"), missing compendium (expects warning)

2. **Implement `createItem` hook** in [module.js](module.js#L15) after imports as non-async function, with guard clauses that allow normal processing for all non-nahkampfwaffe items. Guard sequence: check `options.fernkampfOptionAutoAdded` flag first (return early if true), then verify `item.parent?.documentName === "Actor"`, then check `item.type === "nahkampfwaffe"` (return early if false - this ensures other item types are processed normally), finally verify `eigenschaften.find(e => e.key === "Fernkampfoption")` exists

3. **Extract async logic to separate function** called from hook without await (fire-and-forget), starting with `game.packs.get()`, show `ui.notifications.warn("Waffe nicht gefunden: {weaponName}")` if pack null, then `await pack.getIndex()` and filter by exact name and type

4. **Implement bidirectional duplicate check and flag-based linking** with `item.parent.items.find(i => i.type === "fernkampfwaffe" && i.name === weaponName && i.getFlag("ilaris-alternative-actor-sheet", "linkedMeleeId") === item.id)` to check if **this specific melee weapon** already triggered this addition (returning early only then), then `await pack.getDocument()` and `await createEmbeddedDocuments("Item", [...], {fernkampfOptionAutoAdded: true})` to create fernkampfwaffe, store created item reference

5. **Establish bidirectional flag links after creation** using `await nahkampfwaffe.setFlag("ilaris-alternative-actor-sheet", "linkedRangedId", createdFernkampfwaffe.id)` and `await createdFernkampfwaffe.setFlag("ilaris-alternative-actor-sheet", "linkedMeleeId", nahkampfwaffe.id)` to enable bidirectional lookup via item IDs (not UUIDs, since both are on same actor)

6. **Add success notification and error handling** with `ui.notifications.info("{weaponName} automatisch hinzugefügt")` after successful addition and flag setting, wrap entire async function in try-catch with `console.error()` for exceptions only

7. **Implement `deleteItem` hook** in [module.js](module.js) after `createItem` hook as non-async function with guard clause checking `item.parent?.documentName === "Actor"` and `(item.type === "nahkampfwaffe" || item.type === "fernkampfwaffe")`, then check for deletion flag `options.linkedWeaponDeletion` (return early if true to prevent infinite loop)

8. **Extract async deletion logic to separate function** called from hook without await (fire-and-forget), checking `item.getFlag("ilaris-alternative-actor-sheet", "linkedRangedId")` for nahkampfwaffe or `item.getFlag("ilaris-alternative-actor-sheet", "linkedMeleeId")` for fernkampfwaffe, finding linked item via `actor.items.get(linkedId)`, deleting with `await linkedItem.delete({linkedWeaponDeletion: true})` to set flag preventing recursion, wrap in try-catch with silent error logging only
