## Context

The Ilaris system has a rich creature data model (8 attributes, 8 Kampfwerte, weapon items with damage formulas, optional talents/vorteile/spells). Creating balanced creatures manually is tedious, especially for groups of enemies. The DeepSeek API provides a cost-effective LLM that can generate structured JSON from natural language descriptions.

The feature follows the existing module pattern: AppV2 dialog (`scripts/apps/`), Handlebars template (`templates/apps/`), CSS (`styles/`), with settings registered in `module.js`.

## Goals / Non-Goals

**Goals:**
- GM opens dialog, describes desired creatures in natural language, clicks Generate
- Prompt sent to DeepSeek with compact Ilaris data model schema, strength ranges, filtered vorteile names, and few-shot examples (~1,500 tokens)
- AI returns JSON array of creatures with attributes, Kampfwerte, weapons
- Response validated against data model, out-of-range values clamped
- `Actor.create()` called for each creature with embedded weapon items
- API key stored in world settings (GM-only, configurable)

**Non-Goals:**
- Generating held (player character) actors — kreatur only
- AI-generated portraits/images
- Batch generation with different parameters per creature in one call (future)
- Local LLM support (future)
- Streaming responses (future)

## Decisions

### Decision 1: AppV2 dialog with Handlebars template

Follows the established pattern (`IlarisAlternativeFertigkeitDialog`, `IlarisAlternativeItemApplyDialog`). Uses `HandlebarsApplicationMixin(ApplicationV2)`.

**Rationale**: Consistency with existing codebase. AppV2 provides `static DEFAULT_OPTIONS`, `static PARTS`, action system, and `_prepareContext`.

### Decision 2: Prompt construction as a static module-level object

The system prompt (schema, strength table, vorteile list, examples) is constructed once at module init from a static template and cached vorteile data. User input is appended at generation time.

**Rationale**: The schema and strength table never change. Vorteile change only when the compendium is updated (rare). Caching avoids reconstructing the prompt on every generation.

### Decision 3: Compact JSON schema over prose descriptions

Instead of describing each field in natural language, the prompt includes a compact JSON schema showing the expected structure. Strength ranges use a markdown table.

**Rationale**: Saves ~600 tokens per prompt vs. prose descriptions. LLMs parse JSON schema just as effectively.

### Decision 4: Vorteile cache via settings button

A button in module settings reads the Ilaris system's `vorteile` compendium, filters to creature-relevant categories (allgemein, profan, kampf, kampfstil), and stores the name list as a JSON string in `game.settings`. The prompt builder reads this cache.

**Rationale**: Vorteile change rarely (only when the compendium pack is updated). Caching avoids reading the compendium on every generation. The settings button gives GMs control over when to refresh.

### Decision 5: Plain `fetch` for API calls, no SDK

DeepSeek's API is OpenAI-compatible. A simple `fetch` with `Authorization: Bearer <key>` header suffices. No npm dependency needed.

**Rationale**: Avoids adding dependencies to the module. The Foundry runtime has `fetch` available.

### Decision 6: Post-generation validation with clamping

After receiving the AI response, each field is validated against the Kreatur data model defaults and ranges. Out-of-range values are clamped to valid bounds. Missing required fields use defaults.

**Rationale**: LLMs occasionally hallucinate invalid values. Clamping ensures the created actor is always valid in Foundry, even if the AI makes mistakes.

## Risks / Trade-offs

- **Risk**: API key stored in Foundry world settings (accessible to anyone with GM permissions) → **Mitigation**: Key is world-scoped, only GMs can configure. Foundry's settings storage is the standard pattern for this.
- **Risk**: AI generates nonsensical vorteile or weapon properties → **Mitigation**: Post-process: validate vorteile against cached list, validate weapon properties against known keys. Drop invalid ones with a warning.
- **Risk**: Network errors or API downtime block generation → **Mitigation**: Show clear error message in dialog. Generation is non-blocking — the GM can retry.
- **Risk**: AI response is not valid JSON → **Mitigation**: Try to extract JSON from markdown code blocks first (common LLM behavior). If still invalid, show raw response to GM and offer retry.
