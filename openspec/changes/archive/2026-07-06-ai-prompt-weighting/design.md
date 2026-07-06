## Context

User descriptions were at the end of a ~1,500 token prompt, getting drowned out by system instructions. Boss-tier damage had no guidelines.

## Decisions

### Decision 1: Description-first with emphasis

Move user input to the front with `IMPORTANT` markers and explicit "base primarily on this" instruction.

**Rationale**: LLMs weight early content higher. Moving the description to position 1 gives it maximum influence.

### Decision 2: Damage ranges in strength table

Add `tpMin`/`tpMax` to STRENGTH_TABLE and display in the prompt table.

**Rationale**: Without explicit damage guidance, the AI defaults to example patterns (1W6+2, 4W6+2) regardless of tier.
