## Context

Eigenschaften are descriptive creature properties rendered as comma-separated edit links in the Allgemein tab. The AI should generate fitting ones from a curated list.

## Decisions

### Decision 1: Hardcoded eigenschaften list with descriptions

Define a `CREATURE_EIGENSCHAFTEN` constant mapping name → description. The list is static (unlike vorteile which come from compendiums). Add the full list to the prompt so the AI picks context-appropriate ones.

**Rationale**: Eigenschaften are fixed Ilaris rules, not configurable per-world like vorteile.

### Decision 2: Create as embedded eigenschaft items

Each eigenschaft becomes an embedded item with `type: 'eigenschaft'`, its name, and `system.description` set to the one-liner. This matches how the sheet renders them (`actor.eigenschaften`).

**Rationale**: The sheet template expects eigenschaften as items with `_id` and `name` for item-edit links.
