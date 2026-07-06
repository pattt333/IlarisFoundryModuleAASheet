# AI Creature Generation

## Purpose

GM-facing dialog that sends a natural language description with Ilaris creature data model schema to the DeepSeek API, parses the JSON response, and creates `kreatur` actors with full attributes, Kampfwerte, weapons, and optional vorteile.

## Requirements

### Requirement: DeepSeek API key stored in world settings

The module SHALL register a world-scoped `deepseekApiKey` setting of type String, default empty, configurable only by GMs. The setting SHALL be registered in `Hooks.once('init')` in `module.js`.

#### Scenario: GM configures API key

- **WHEN** a GM opens module settings and enters a DeepSeek API key
- **THEN** the key is stored in `game.settings.get('ilaris-alternative-actor-sheet', 'deepseekApiKey')`

#### Scenario: No API key configured

- **WHEN** no API key is set and the user attempts to open the generator dialog
- **THEN** a notification warns that an API key is required and the dialog does not open

### Requirement: Generator dialog with strength, group size, type, and description

An AppV2 dialog (`IlarisAlternativeAiCreatureDialog`) SHALL provide: a Stärke dropdown (schwach/mittel/stark/boss), a Gruppengröße input (1-10), a Typ dropdown (humanoid/bestie/dämon/untoter/geist/drache/elementar/beliebig), and a textarea for natural language description. A "Generieren" button SHALL trigger the API call.

#### Scenario: GM fills dialog and clicks Generate

- **WHEN** a GM selects "mittel" strength, group size 4, type "humanoid", and enters "Goblin-Krieger mit Kurzschwertern"
- **THEN** the dialog sends a prompt to DeepSeek and displays a loading state

#### Scenario: Dialog opened from actor directory

- **WHEN** a GM clicks the "KI-Kreaturen-Generator" button in the actor directory header
- **THEN** the generator dialog opens (GM-only visibility)

### Requirement: Token-optimized prompt sent to DeepSeek API

The prompt SHALL include: a compact JSON schema of the Kreatur data model using Ilaris conventions (German "W" dice notation: `1W6+2`, attribute keys using `pw`), a strength-to-attribute-range lookup table, cached vorteile names by category, German damage formula syntax (`NWN+N`), weapon property keys, creature type options, RW (Reichweite) range rules (melee: 0-2, thrown/Wurfwaffen: 4-16, ranged/bows/guns: 16-64), two few-shot examples (mittel humanoid with melee weapon, stark bestie), and the user's natural language description. Total prompt SHALL be under 2,000 tokens.

#### Scenario: Prompt constructed for generation

- **WHEN** the user clicks "Generieren"
- **THEN** a system prompt with schema including `rw`, strength table, RW range rules, vorteile cache, and examples is combined with the user's description and sent to `https://api.deepseek.com/v1/chat/completions` with model `deepseek-chat`

#### Scenario: AI generates weapon with correct RW

- **WHEN** the AI generates a melee weapon (nahkampf)
- **THEN** the weapon includes `rw` between 0-2

#### Scenario: API returns valid JSON

- **WHEN** DeepSeek returns a response containing a JSON array of creature objects
- **THEN** the JSON is parsed and validated

### Requirement: AI response validated and clamped to valid ranges

Each generated creature SHALL be validated: attributes clamped to 8-20, Kampfwerte to reasonable bounds (HP 1-200, INI 1-30, GS 1-20, MR 0-20), weapon damage formulas validated against the `NWN+N` pattern, weapon RW clamped by type (melee: 0-2, thrown: 4-16, ranged: 16-64), vorteile checked against the cached list, and missing required fields filled with defaults. Invalid vorteile and weapon properties SHALL be dropped with console warnings.

#### Scenario: AI returns attribute value of 25

- **WHEN** a generated creature has an attribute value of 25
- **THEN** the value is clamped to 20

#### Scenario: AI returns melee weapon with RW 10

- **WHEN** a generated melee weapon has `rw: 10`
- **THEN** the RW is clamped to 2

#### Scenario: AI returns ranged weapon with RW 8

- **WHEN** a generated ranged weapon has `rw: 8`
- **THEN** the RW is clamped to 16

#### Scenario: AI returns invalid damage formula

- **WHEN** a generated weapon has `tp: "fire damage"`
- **THEN** the weapon's tp is replaced with a default `"1W6"`

### Requirement: Creature actors created with embedded weapons

After validation, each creature in the response SHALL be created via `Actor.create({ type: 'kreatur', name, system: {...} })`. Weapons from the AI response SHALL be created as embedded `angriff` items with `at`, `vt`, `tp`, `rw`, and `eigenschaften`. A notification SHALL confirm the number of creatures created.

#### Scenario: Generating 4 goblins

- **WHEN** the AI returns an array of 4 valid creatures
- **THEN** 4 `kreatur` actors are created, each with their specified weapons as embedded items, and a notification shows "4 Kreaturen erstellt"

#### Scenario: API call fails

- **WHEN** the DeepSeek API returns an error (network, auth, rate limit)
- **THEN** a German error notification is shown with the specific error message, and the dialog remains open for retry

### Requirement: Vorteile cache refreshable via settings

A button in module settings (renderSettingsConfig hook) SHALL read the Ilaris system's `Ilaris.vorteile` compendium, extract creature-relevant vorteile (categories: allgemein, profan, kampf, kampfstil), and store the filtered names as a JSON cache in the `vorteileCache` setting. The cache SHALL be used by the prompt builder. If the cache is empty, vorteile SHALL be omitted from the prompt.

#### Scenario: GM clicks "Vorteile-Cache aktualisieren"

- **WHEN** the GM clicks the cache refresh button in module settings
- **THEN** the vorteile compendium is read, filtered to creature-relevant categories, and stored as a JSON cache with a notification showing the count

#### Scenario: Cache is empty on first use

- **WHEN** the vorteile cache setting is empty and generation is attempted
- **THEN** the prompt is built without vorteile names, and the AI is instructed to omit vorteile from the response
