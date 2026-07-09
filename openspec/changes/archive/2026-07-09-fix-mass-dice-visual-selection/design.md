## Context

The template uses nested `#each` loops with `../npc` path traversal which fails for `selectedDiceIndex` checks. Solution: pre-compute selection state in `getData()`, avoiding all path traversal in the template.

## Decisions

**Decision**: Add `diceData` to each NPC's context in `getData()` — an array of `{value, selected, index}` — and use `#each npc.diceData as |die|` in the template. `die.selected` and `die.value` are direct properties needing no `../`.

## Tasks

- [ ] 1.1 In `getData()`, compute `diceData` array from `state.diceResults` with selected/index baked in
- [ ] 1.2 In template, replace `#each npc.state.diceResults as |result index|` with `#each npc.diceData as |die|`, use `die.value` and `die.selected`
