## 1. Update Prompt Builder

- [x] 1.1 Add `"rw": N` to JSON schema in `buildCreaturePrompt()` — DONE
- [x] 1.2 Add RW range rules to prompt — DONE, "melee 0-2, thrown 4-16, ranged 16-64"
- [x] 1.3 Update few-shot examples with `rw` values — DONE, both examples now include `"rw":0`

## 2. Update Validation

- [x] 2.1 Add RW clamping in `validateAndClampCreature()` — DONE, infers type from eigenschaften and name
- [x] 2.2 Default RW: 0 for melee, 16 for ranged — DONE via clamping logic

## 3. Update Actor Creation

- [x] 3.1 Add `rw` to embedded `angriff` item in `ai-creature-dialog.js` — DONE, `rw: a.rw ?? 0`
