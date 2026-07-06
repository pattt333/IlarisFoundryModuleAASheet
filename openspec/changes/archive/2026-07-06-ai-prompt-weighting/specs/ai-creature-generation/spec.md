# AI Creature Generation — Prompt Weighting

## MODIFIED Requirements

### Requirement: Token-optimized prompt sent to DeepSeek API

The prompt SHALL place the user's natural language description FIRST with `IMPORTANT` emphasis markers, followed by the JSON schema, strength table (now including damage/TP ranges per tier), rules, eigenschaften list, and examples. The prompt SHALL instruct the AI to prioritize the user description over strength table defaults where they conflict. Total prompt SHALL be under 2,200 tokens.

#### Scenario: User describes a slow, heavily-armored demon

- **WHEN** the user enters "reagiert nicht schnell, dafür ist sein Körper hart wie Eis und massig"
- **THEN** the generated creature has low INI but high KO/KK attributes, reflecting the description over the strength table defaults

#### Scenario: Boss-level creature generated

- **WHEN** a "boss" strength creature is generated
- **THEN** weapon damage is in the range 4W6+4 to 8W6+8 per the strength table
