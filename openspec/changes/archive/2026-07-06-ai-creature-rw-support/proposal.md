## Why

The AI creature generator currently omits the RW (Reichweite/range) field from generated weapons. In the Ilaris system, every `angriff` item has an RW value that determines engagement range: 0-2 for melee weapons, 4-16 for thrown weapons (Wurfwaffen), and 16-64 for ranged weapons (bows, crossbows, guns). Without RW, generated weapons are incomplete and may not function correctly in combat.

## What Changes

- Add `rw` field to the JSON schema in the AI prompt with range rules by weapon type
- Add RW validation in `validateAndClampCreature`: 0-2 for melee (no eigenschaft indicating ranged), 4-16 for thrown, 16-64 for ranged
- Include `rw` in the embedded `angriff` item creation

## Capabilities

### Modified Capabilities

- `ai-creature-generation`: The prompt SHALL include `rw` in the weapon JSON schema with range rules. Validation SHALL clamp RW based on weapon type (melee 0-2, thrown 4-16, ranged 16-64). Embedded angriff items SHALL include the `rw` value.

## Impact

- **Modified files**: `scripts/utilities.js` (`buildCreaturePrompt` schema + range rules, `validateAndClampCreature` RW validation), `scripts/apps/ai-creature-dialog.js` (add `rw` to embedded item creation)
- **No new files**
- **No Hook changes**
