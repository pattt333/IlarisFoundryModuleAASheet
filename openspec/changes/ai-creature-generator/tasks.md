## 1. Settings Registration

- [ ] 1.1 Register `deepseekApiKey` setting in `module.js` `Hooks.once('init')` — world scope, type String, config true, default empty
- [ ] 1.2 Register `vorteileCache` setting in `module.js` — world scope, type String, config false, default empty (JSON string of filtered vorteile names)

## 2. Vorteile Cache System

- [ ] 2.1 Create `scripts/utilities.js` function `refreshVorteileCache()` that reads Ilaris system's vorteile compendium, filters to categories (allgemein, profan, kampf, kampfstil), extracts names, and stores as JSON in the `vorteileCache` setting
- [ ] 2.2 Register a settings menu button via `Hooks.on('renderSettingsConfig', ...)` that calls `refreshVorteileCache()` and shows a notification with count

## 3. Prompt Builder

- [ ] 3.1 Create `scripts/utilities.js` function `buildCreaturePrompt(userDescription, strength, count, type)` that constructs the system prompt with compact JSON schema, strength lookup table, cached vorteile names, damage formula rules, weapon property keys, and 2 few-shot examples
- [ ] 3.2 Ensure total prompt is under 2,000 tokens
- [ ] 3.3 Include instruction to output ONLY valid JSON, no markdown wrapping

## 4. AI Creature Dialog (AppV2)

- [ ] 4.1 Create `scripts/apps/ai-creature-dialog.js` with class `IlarisAlternativeAiCreatureDialog` extending `HandlebarsApplicationMixin(ApplicationV2)`
- [ ] 4.2 Implement `DEFAULT_OPTIONS` with dialog config (title: "KI-Kreaturen-Generator", width: 700)
- [ ] 4.3 Implement `PARTS` pointing to `templates/apps/ai-creature-dialog.hbs`
- [ ] 4.4 Implement `_prepareContext` providing `strengthOptions`, `typeOptions`, `count` (1-10), `description`, `isLoading`, `error`, `hasApiKey`
- [ ] 4.5 Implement `generate` action: validate API key exists, call DeepSeek API with prompt, handle loading/error states
- [ ] 4.6 Create `templates/apps/ai-creature-dialog.hbs` with Stärke dropdown, Gruppengröße input, Typ dropdown, textarea, Generate button, loading indicator, error display
- [ ] 4.7 Create `styles/ai-creature-dialog.css` for dialog styling (follows existing dialog CSS patterns)

## 5. API Integration

- [ ] 5.1 Create `scripts/utilities.js` function `callDeepSeekApi(prompt, apiKey)` that POSTs to `https://api.deepseek.com/v1/chat/completions` with model `deepseek-chat`, returns parsed response
- [ ] 5.2 Handle API errors: network failure, 401 (invalid key), 429 (rate limit), 5xx (server error) — return structured error to dialog

## 6. Response Parsing & Validation

- [ ] 6.1 Create `scripts/utilities.js` function `parseAiCreatureResponse(responseText)` that extracts JSON from response (handling markdown code blocks), parses to array
- [ ] 6.2 Create `scripts/utilities.js` function `validateAndClampCreature(creatureData)` that validates attributes (8-20), Kampfwerte (HP 1-200, INI 1-30, GS 1-20, MR 0-20), damage formulas (`NdN+N` pattern), vorteile (against cache), fills missing fields with KreaturDataModel defaults
- [ ] 6.3 Drop invalid vorteile and weapon properties with console warnings

## 7. Actor Creation

- [ ] 7.1 In dialog `generate` action, after successful parse + validation, call `Actor.create()` for each creature with `type: 'kreatur'` and the validated system data
- [ ] 7.2 Create embedded `angriff` items for each weapon in the AI response
- [ ] 7.3 Show `ui.notifications.info("{N} Kreaturen erstellt")` on success

## 8. Dialog Entry Point

- [ ] 8.1 Add button in actor directory via `Hooks.on('renderActorDirectory', ...)` — append a button that opens `IlarisAlternativeAiCreatureDialog`
- [ ] 8.2 Only show button to GM users (`game.user.isGM`)

## 9. Final Validation

- [ ] 9.1 Test full flow: open dialog → enter description → generate → verify creatures created with correct data
- [ ] 9.2 Test error cases: no API key, invalid key, network error, malformed AI response
- [ ] 9.3 Verify vorteile cache refresh works
