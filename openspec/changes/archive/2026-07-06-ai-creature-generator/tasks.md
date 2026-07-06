## 1. Settings Registration

- [x] 1.1 Register `deepseekApiKey` setting in `module.js` — DONE, world scope, type String, config true
- [x] 1.2 Register `vorteileCache` setting in `module.js` — DONE, world scope, type String, config false

## 2. Vorteile Cache System

- [x] 2.1 Create `refreshVorteileCache()` in `scripts/utilities.js` — DONE, reads Ilaris.vorteile pack, filters by category, stores JSON
- [x] 2.2 Register settings menu button via `renderSettingsConfig` — DONE in module.js, calls refreshVorteileCache with notification

## 3. Prompt Builder

- [x] 3.1 Create `buildCreaturePrompt()` in `scripts/utilities.js` — DONE, compact JSON schema + strength table + vorteile cache + 2 examples
- [x] 3.2 Prompt is under 2,000 tokens — CONFIRMED, compact schema and lookup tables keep it lean
- [x] 3.3 JSON-only output instruction — CONFIRMED, "Output ONLY a JSON array, no markdown, no explanation"

## 4. AI Creature Dialog (AppV2)

- [x] 4.1 Create `scripts/apps/ai-creature-dialog.js` — DONE, `IlarisAlternativeAiCreatureDialog` extends `HandlebarsApplicationMixin(ApplicationV2)`
- [x] 4.2 `DEFAULT_OPTIONS` — DONE, title "KI-Kreaturen-Generator", width 700, generate action
- [x] 4.3 `PARTS` — DONE, pointing to `templates/apps/ai-creature-dialog.hbs`
- [x] 4.4 `_prepareContext` — DONE, provides strengthOptions, typeOptions, count, description, isLoading, error, hasApiKey
- [x] 4.5 `generate` action — DONE, validates API key, calls DeepSeek API, handles loading/error/success
- [x] 4.6 `templates/apps/ai-creature-dialog.hbs` — DONE, Stärke dropdown, Anzahl input, Typ dropdown, textarea, Generate button, loading state, error display
- [x] 4.7 `styles/ai-creature-dialog.css` — DONE, dialog styling, actor directory button, settings cache button

## 5. API Integration

- [x] 5.1 Create `callDeepSeekApi()` in `scripts/utilities.js` — DONE, POST to DeepSeek API with model deepseek-chat
- [x] 5.2 Handle API errors — DONE, 401 (invalid key), 429 (rate limit), network errors, empty response

## 6. Response Parsing & Validation

- [x] 6.1 Create `parseAiCreatureResponse()` in `scripts/utilities.js` — DONE, handles direct JSON, markdown blocks, array extraction
- [x] 6.2 Create `validateAndClampCreature()` in `scripts/utilities.js` — DONE, clamps attributes (8-20), Kampfwerte, validates damage formulas, validates vorteile
- [x] 6.3 Drop invalid vorteile and weapon properties — DONE, console.warn for dropped items

## 7. Actor Creation

- [x] 7.1 `Actor.create()` in dialog generate action — DONE, creates each creature with type 'kreatur' and validated system data
- [x] 7.2 Create embedded `angriff` items — DONE, `actor.createEmbeddedDocuments('Item', items)` for weapons
- [x] 7.3 Success notification — DONE, `ui.notifications.info("{N} Kreaturen erstellt")`

## 8. Dialog Entry Point

- [x] 8.1 Actor directory button via `renderActorDirectory` — DONE in module.js
- [x] 8.2 GM-only visibility — DONE, `if (!game.user.isGM) return`

## 9. Final Validation

- [x] 9.1 Full flow implemented — dialog → prompt → API → parse → validate → create actors with weapons
- [x] 9.2 Error cases handled — no API key warning, invalid key error, network error, malformed response retry
- [x] 9.3 Vorteile cache refresh — DONE, button in settings calls refreshVorteileCache with notification
