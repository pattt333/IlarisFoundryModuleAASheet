## Plan: Automatic Fernkampfwaffe Addition via Fernkampfoption Property

Implementing automatic addition of linked ranged weapons when melee weapons with the `Fernkampfoption` property are added to an actor sheet, using exact name matching, unidirectional behavior, and fire-and-forget async handling.

### Steps

1. **Create specification document** at `.specs/fernkampfoption-auto-add.spec.md` with concrete Given-When-Then examples: Axtpistole addition (expects both weapons added + success notification), duplicate prevention (expects silent skip), missing weapon (expects "Waffe nicht gefunden: {name}"), missing compendium (expects warning)

2. **Implement `createItem` hook** in [module.js](module.js#L15) after imports as non-async function, with guard clauses that allow normal processing for all non-nahkampfwaffe items. Guard sequence: check `options.fernkampfOptionAutoAdded` flag first (return early if true), then verify `item.parent?.documentName === "Actor"`, then check `item.type === "nahkampfwaffe"` (return early if false - this ensures other item types are processed normally), finally verify `eigenschaften.find(e => e.key === "Fernkampfoption")` exists

3. **Extract async logic to separate function** called from hook without await (fire-and-forget), starting with `game.packs.get()`, show `ui.notifications.warn("Waffe nicht gefunden: {weaponName}")` if pack null, then `await pack.getIndex()` and filter by exact name and type

4. **Implement duplicate check and addition** with `item.parent.items.find()` returning early if duplicate exists, then `await pack.getDocument()` and `await createEmbeddedDocuments("Item", [...], {fernkampfOptionAutoAdded: true})`, showing `ui.notifications.warn("Waffe nicht gefunden: {weaponName}")` if compendium entry missing

5. **Add success notification and error handling** with `ui.notifications.info("{weaponName} automatisch hinzugefügt")` after successful addition, wrap entire async function in try-catch with `console.error()` for exceptions only
