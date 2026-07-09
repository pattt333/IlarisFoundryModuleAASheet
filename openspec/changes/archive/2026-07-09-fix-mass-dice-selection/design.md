## Context

The mass dialog template nests two `#each` loops:

```handlebars
{{#each npcs as |npc|}}
  {{#each npc.state.diceResults as |result index|}}
    data-combatant-id="{{../../npc.combatantId}}"  ← goes to root, npc undefined
  {{/each}}
{{/each}}
```

`../../` from inside the second `#each` goes: up one level (to `#each npcs` context) → up another level (to root). `npc` is not in root scope. `../` goes up just one level to where `npc` is defined.

## Goals / Non-Goals

**Goals:** Fix the path so `data-combatant-id` resolves to the correct combatant ID.

**Non-Goals:** Changing any other template logic.

## Decisions

**Decision**: Change `../../npc.combatantId` to `../npc.combatantId`.
