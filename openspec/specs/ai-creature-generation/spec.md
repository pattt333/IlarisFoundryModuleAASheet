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

The prompt SHALL include: a compact JSON schema of the Kreatur data model including `eigenschaften`, a strength-to-attribute-range lookup table, cached vorteile names by category, German damage formula syntax, weapon property keys, creature type options, RW range rules, a categorized eigenschaften list with one-line German descriptions (~39 entries), two few-shot examples with eigenschaften, and the user's natural language description. Total prompt SHALL be under 2,000 tokens.

#### Scenario: Prompt constructed for generation

- **WHEN** the user clicks "Generieren"
- **THEN** a system prompt with schema including `eigenschaften`, strength table, eigenschaften list, vorteile cache, and examples is sent to the DeepSeek API

#### Scenario: AI generates creature with fitting eigenschaften

- **WHEN** the AI generates a "Drache"
- **THEN** the creature includes eigenschaften like "Schreckgestalt III" and "Flieger"

#### Scenario: API returns valid JSON

- **WHEN** DeepSeek returns a response containing a JSON array of creature objects
- **THEN** the JSON is parsed and validated

### Requirement: AI response validated and clamped to valid ranges

Each generated creature SHALL be validated: attributes, Kampfwerte, weapon damage formulas, weapon RW, vorteile against cache, and eigenschaften against the known list. Invalid vorteile, eigenschaften, and weapon properties SHALL be dropped with console warnings. Missing fields SHALL use defaults.

#### Scenario: AI returns attribute value of 25

- **WHEN** a generated creature has an attribute value of 25
- **THEN** the value is clamped to 20

#### Scenario: AI returns unknown eigenschaft

- **WHEN** the AI returns an eigenschaft name not in the known list
- **THEN** the invalid eigenschaft is dropped with a console warning

#### Scenario: AI returns invalid damage formula

- **WHEN** a generated weapon has `tp: "fire damage"`
- **THEN** the weapon's tp is replaced with a default `"1W6"`

### Requirement: Creature actors created with embedded weapons

After validation, each creature in the response SHALL be created via `Actor.create({ type: 'kreatur', name, system: {...} })`. Weapons SHALL be created as `angriff` items. Eigenschaften SHALL be created as embedded `eigenschaft` items with their German name and description. A notification SHALL confirm the count.

#### Scenario: Generating 4 goblins

- **WHEN** the AI returns an array of 4 valid creatures
- **THEN** 4 `kreatur` actors are created, each with their specified weapons as embedded items, and a notification shows "4 Kreaturen erstellt"

#### Scenario: API call fails

- **WHEN** the DeepSeek API returns an error (network, auth, rate limit)
- **THEN** a German error notification is shown with the specific error message, and the dialog remains open for retry

### Requirement: Vorteile cache refreshable via settings

A settings menu button registered via `game.settings.registerMenu()` SHALL trigger `refreshVorteileCache()`. The cache SHALL be populated from the Ilaris system's configured vorteile packs (`game.settings.get('Ilaris', 'vorteilePacks')`), filtered to creature-relevant categories (allgemein, profan, kampf, kampfstil), and stored as JSON in the `vorteileCache` setting. The cache SHALL be used by the prompt builder. If the cache is empty, vorteile SHALL be omitted from the prompt.

#### Scenario: GM clicks "Vorteile-Cache aktualisieren"

- **WHEN** the GM clicks the registered menu button
- **THEN** the Ilaris system's configured vorteile packs are read, filtered to creature-relevant categories, and stored as a JSON cache with a notification showing the count

#### Scenario: Cache is empty on first use

- **WHEN** the vorteile cache setting is empty and generation is attempted
- **THEN** the prompt is built without vorteile names, and the AI is instructed to omit vorteile from the response
