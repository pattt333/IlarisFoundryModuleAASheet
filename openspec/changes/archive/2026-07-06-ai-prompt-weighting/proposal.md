## Why

The AI prompt currently places the user's natural language description at the end of a ~1,500 token system prompt. The AI weights early content more heavily, so the description has less influence on the generated creature than the structured schemas and examples. Additionally, the strength table has no damage (TP) ranges, causing boss-level creatures to be generated with low-tier weapon damage.

## What Changes

- Move the user description to the TOP of the prompt with emphasis markers
- Add `tpMin`/`tpMax` damage ranges to `STRENGTH_TABLE`
- Display damage ranges in the prompt's strength table
- Add an override rule: "The user description overrides strength table defaults where they conflict"
- Add a boss-level example to establish damage expectations

## Capabilities

### Modified Capabilities

- `ai-creature-generation`: The prompt SHALL place the user description first with priority markers, include damage ranges per strength tier, and emphasize that description overrides defaults.

## Impact

- **Modified files**: `scripts/utilities.js` (`STRENGTH_TABLE`, `buildCreaturePrompt`)
- **No other changes**
