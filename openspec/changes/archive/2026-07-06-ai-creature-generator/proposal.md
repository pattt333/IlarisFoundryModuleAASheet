## Why

Creating creatures (Kreaturen) for encounters is one of the most time-consuming tasks for GMs. Each creature requires filling in 8 attributes, multiple Kampfwerte, weapons with damage formulas, and optional talents, vorteile, and spells — often across groups of enemies with slight variations. An AI-powered generator using the DeepSeek API can produce balanced, thematically appropriate creatures from natural language descriptions, dramatically reducing prep time.

## What Changes

- **New settings**: `deepseekApiKey` (world-scoped, GM-only String) for DeepSeek API authentication
- **New dialog**: `KI-Kreaturen-Generator` AppV2 dialog accessible from the actor directory, with Stärke (schwach/mittel/stark/boss), Gruppengröße (1-10), Typ (humanoid/bestie/dämon/untoter), and natural language description input
- **Token-optimized prompt**: Compact JSON schema, strength lookup table, filtered vorteile name list, and few-shot examples sent to DeepSeek `v1/chat/completions`
- **Response parsing**: Validate AI-generated JSON against the Kreatur data model, clamp out-of-range values, create `Actor` documents with embedded weapon items
- **Vorteile cache**: Settings button that reads the Ilaris system's vorteile compendium and caches creature-relevant vorteile names by category for prompt inclusion

## Capabilities

### New Capabilities

- `ai-creature-generation`: GM-facing dialog that sends a natural language description + Ilaris schema to the DeepSeek API, parses the JSON response, and creates one or more `kreatur` actors with full attributes, Kampfwerte, weapons, and optional talents/vorteile

### Modified Capabilities

_None._

## Impact

- **New files**: `scripts/apps/ai-creature-dialog.js`, `templates/apps/ai-creature-dialog.hbs`, `styles/ai-creature-dialog.css`
- **Modified files**: `module.js` (settings registration, GM-only button in actor directory)
- **External dependency**: DeepSeek API (`https://api.deepseek.com/v1/chat/completions`) — no npm dependency, plain `fetch`
- **No Hook changes**: Feature is self-contained in dialog + API call
- **No existing module code affected**: Pure addition
