## 1. Add Eigenschaften List to Prompt

- [x] 1.1 Define `CREATURE_EIGENSCHAFTEN` constant — DONE, 39 entries with German descriptions
- [x] 1.2 Add `"eigenschaften": ["Name"]` to JSON schema — DONE in buildCreaturePrompt
- [x] 1.3 Add categorized eigenschaften list to prompt — DONE, all 39 with one-liners
- [x] 1.4 Update few-shot examples — DONE, Goblin gets Rudel+Lichtscheu, Bär gets Schreckgestalt+Regeneration

## 2. Add Eigenschaften Validation

- [x] 2.1 Add eigenschaften validation in validateAndClampCreature — DONE, filters against CREATURE_EIGENSCHAFTEN_NAMES
- [x] 2.2 Add eigenschaften to returned creature object — DONE, in system.eigenschaften

## 3. Create Embedded Eigenschaft Items

- [x] 3.1 Create embedded eigenschaft items — DONE, with name + description from CREATURE_EIGENSCHAFTEN
