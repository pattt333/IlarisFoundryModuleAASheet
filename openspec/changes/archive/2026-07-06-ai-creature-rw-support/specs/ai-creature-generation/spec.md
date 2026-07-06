# AI Creature Generation — RW Support

## MODIFIED Requirements

### Requirement: Token-optimized prompt sent to DeepSeek API

The prompt SHALL include: a compact JSON schema of the Kreatur data model using Ilaris conventions (German "W" dice notation: `1W6+2`, attribute keys using `pw`), a strength-to-attribute-range lookup table, cached vorteile names by category, German damage formula syntax (`NWN+N`), weapon property keys, creature type options, RW (Reichweite) range rules (melee: 0-2, thrown/Wurfwaffen: 4-16, ranged/bows/guns: 16-64), two few-shot examples (mittel humanoid with melee weapon, stark bestie), and the user's natural language description. Total prompt SHALL be under 2,000 tokens.

#### Scenario: Prompt constructed for generation

- **WHEN** the user clicks "Generieren"
- **THEN** a system prompt with schema including `rw`, strength table, RW range rules, vorteile cache, and examples is combined with the user's description and sent to `https://api.deepseek.com/v1/chat/completions` with model `deepseek-chat`

#### Scenario: AI generates weapon with correct RW

- **WHEN** the AI generates a melee weapon (nahkampf)
- **THEN** the weapon includes `rw` between 0-2

### Requirement: AI response validated and clamped to valid ranges

Each generated creature SHALL be validated: attributes clamped to 8-20, Kampfwerte to reasonable bounds (HP 1-200, INI 1-30, GS 1-20, MR 0-20), weapon damage formulas validated against the `NWN+N` pattern, weapon RW clamped by type (melee: 0-2, thrown: 4-16, ranged: 16-64), vorteile checked against the cached list, and missing required fields filled with defaults. Invalid vorteile and weapon properties SHALL be dropped with console warnings.

#### Scenario: AI returns melee weapon with RW 10

- **WHEN** a generated melee weapon has `rw: 10`
- **THEN** the RW is clamped to 2

#### Scenario: AI returns ranged weapon with RW 8

- **WHEN** a generated ranged weapon has `rw: 8`
- **THEN** the RW is clamped to 16

### Requirement: Creature actors created with embedded weapons

After validation, each creature in the response SHALL be created via `Actor.create({ type: 'kreatur', name, system: {...} })`. Weapons from the AI response SHALL be created as embedded `angriff` items with `at`, `vt`, `tp`, `rw`, and `eigenschaften`. A notification SHALL confirm the number of creatures created.

#### Scenario: Generating creatures with weapons

- **WHEN** the AI returns valid creatures with weapons including RW values
- **THEN** each weapon is created as an embedded angriff item with `at`, `vt`, `tp`, `rw`, and `eigenschaften`
