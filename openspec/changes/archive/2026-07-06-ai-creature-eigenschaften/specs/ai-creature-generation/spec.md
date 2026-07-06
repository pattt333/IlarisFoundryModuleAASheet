# AI Creature Generation — Eigenschaften Support

## MODIFIED Requirements

### Requirement: Token-optimized prompt sent to DeepSeek API

The prompt SHALL include: a compact JSON schema of the Kreatur data model including `eigenschaften`, a strength-to-attribute-range lookup table, cached vorteile names by category, German damage formula syntax, weapon property keys, creature type options, RW range rules, a categorized eigenschaften list with one-line German descriptions (~20 entries), two few-shot examples, and the user's natural language description. Total prompt SHALL be under 2,000 tokens.

#### Scenario: AI generates creature with fitting eigenschaften

- **WHEN** the AI generates a "Drache"
- **THEN** the creature includes eigenschaften like "Schreckgestalt III" and "Flieger"

### Requirement: AI response validated and clamped to valid ranges

Each generated creature SHALL be validated: attributes, Kampfwerte, weapon damage formulas, weapon RW, vorteile against cache, and eigenschaften against the known list. Invalid eigenschaften SHALL be dropped with console warnings.

#### Scenario: AI returns unknown eigenschaft

- **WHEN** the AI returns an eigenschaft name not in the known list
- **THEN** the invalid eigenschaft is dropped with a console warning

### Requirement: Creature actors created with embedded items

After validation, each creature SHALL be created via `Actor.create()`. Weapons SHALL be created as `angriff` items. Eigenschaften SHALL be created as embedded `eigenschaft` items with their German name and description. A notification SHALL confirm the count.
