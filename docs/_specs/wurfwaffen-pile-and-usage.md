## Plan: Thrown Weapon Drop as Item Pile on Ranged Attack

Implementing automatic item pile creation next to actor token when thrown weapon (Wurfwaffen skill) is used in ranged combat. Thrown weapon is consumed, and if linked to melee weapon via flags, only the melee weapon lands in pile. Uses existing locking mechanism and hex grid position offset.

### Steps

1. **Create thrown weapon detection function** in [utilities.js](scripts/utilities.js) called `isThrowableWeapon(item)` returning true if `item.type === "fernkampfwaffe" && item.system.fertigkeit === "Wurfwaffen"`, export for reuse

2. **Add token validation and hex grid position calculation** in hook handler: after ammunition lock check, verify token exists with `canvas.tokens.get(actor.getActiveTokens()[0]?.id)` – if no token, log silent and return early without consuming weapon. Calculate hex grid offset: `const pileX = token.x + canvas.grid.size; const pileY = token.y;`

3. **Extract thrown weapon logic to separate async function** called `createThrowableWeaponPile(actor, weapon, token)` without await in hook (fire-and-forget pattern), with try-catch logging errors only

4. **Fetch linked melee weapon via flag** in async function: check `weapon.getFlag("ilaris-alternative-actor-sheet", "linkedMeleeId")` to get melee weapon ID, find melee weapon with `actor.items.get(linkedMeleeId)` – store as `linkedMeleeWeapon`. If no flag exists, no linked weapon

5. **Create default item pile via Item Piles API** using `game.itempiles.API.createItemPile()` with: position object `{x: pileX, y: pileY}` and config `{items: [...]}`, single item in pile – if `linkedMeleeWeapon` exists use its `toObject()` with original quantity, otherwise use thrown weapon `toObject()` with original quantity, standard Item Piles defaults

6. **Consume quantities and handle cleanup** in async function: if `linkedMeleeWeapon` exists reduce and delete it via `consumeAmmunition(actor, linkedMeleeWeapon.name, 1)`, then delete thrown weapon without consuming via `await weapon.delete()`; else reduce thrown weapon via `consumeAmmunition()`. Show `ui.notifications.info("{weaponName} zu Boden gefallen")` after successful pile creation