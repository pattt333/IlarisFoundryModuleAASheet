## 1. Update Strength Table

- [x] 1.1 Add `tpMin`/`tpMax` damage ranges to `STRENGTH_TABLE` in `scripts/utilities.js` (schwach: 1W6-2W6, mittel: 1W6+2-3W6+2, stark: 3W6+2-5W6+4, boss: 4W6+4-8W6+8)

## 2. Restructure Prompt

- [x] 2.1 Move user description to top with `IMPORTANT:` prefix and "Base the creature primarily on this description" instruction
- [x] 2.2 Add damage range row to the strength table display in the prompt
- [x] 2.3 Add override rule: "If the user description conflicts with the strength table, the description takes priority"
- [x] 2.4 Add boss-level example to establish high-tier damage expectations
