## Context

The AI creature generator creates `angriff` embedded items but omits the `rw` (Reichweite) field. In Ilaris, every weapon needs a valid RW: 0-2 for melee, 4-16 for thrown, 16-64 for ranged.

## Goals / Non-Goals

**Goals:**
- Add `rw` to the AI prompt's JSON schema with range rules
- Validate and clamp RW based on weapon type
- Include `rw` in embedded angriff item creation

**Non-Goals:**
- Adding a weapon type classifier — RW type is inferred from existing eigenschaften and TP patterns

## Decisions

### Decision 1: Infer weapon type from eigenschaften

If the weapon has `Fernkampfoption` or no ranged indicators → melee (RW 0-2). If name/skill suggests Wurfwaffen → thrown (RW 4-16). Otherwise → ranged (RW 16-64).

**Rationale**: The AI prompt already includes eigenschaften; reusing them avoids adding another classification field.

### Decision 2: Prompt teaches RW rules inline

Add a single line to the prompt: `RW (Reichweite): melee 0-2, thrown 4-16, ranged 16-64.` No separate table needed.

**Rationale**: Minimal token overhead. The rule is simple enough for one line.
