## Why

The main Ilaris system now provides a typed `aktion` item type with `AktionItemDataModel` — replacing the hollow `effect-item` type that had no DataModel. The module currently loads actions by regex-parsing ActiveEffect change keys (`c.key.includes('ini')`), uses a manual "Kombiniert" checkbox disconnected from actual action types, and has no weapon gating. Consuming the new typed model eliminates fragile string-parsing, enables auto-derived combination rules, and adds weapon-driven action filtering — all matching the Ilaris tabletop rules.

## What Changes

- **Replace `effectItem` → `aktion`** in all item type filters across sheets, initiative dialog, and templates
- **Replace regex-based modifier extraction** with typed access: `item.system.iniMod`, `.atMod`, `.vtMod`
- **Universal action discovery**: scan actor items + `game.items` + all world compendiums for `aktion` type; deduplicate by name (actor > world > compendium)
- **Remove manual "Kombiniert (-4 AT/VT)" checkbox** from PC and NPC initiative dialogs; auto-derive -4 malus when two `einfach` actions are selected
- **Add weapon-first action gating**: after weapon selection, filter actions by `bedingungen.waffentyp` and `bedingungen.eigenschaften`; non-matching actions are grayed out with explanatory tooltips
- **Remove `kombinierteAktion`** from all persisted state, computation, and templates
- **Construct ActiveEffects with `ilarisTiming`** (1 turn, expires on turn end) from typed aktion data
- **Drop `nenneke-aktionen` compendium reference** — no compendium loading needed
- **BREAKING**: The `dialogState` actor flag schema changes (`kombinierteAktion` removed). Old persisted state is gracefully ignored.

## Capabilities

### New Capabilities
- `aktion-consumption`: Module-side consumption of the system's `aktion` item type — universal discovery, typed access, weapon gating, gray-out UX, auto-derived combination, 1-turn effect timing

### Modified Capabilities
- `initiative-dialog`: Replaces manual kombiniert checkbox with auto-derived combination from `aktionstyp`; adds weapon-first action gating with gray-out; replaces regex-based modifier extraction with typed access
- `mass-initiative-dashboard`: Same kombiniert checkbox removal and auto-derived combination for NPC mass dialog

## Impact

- `scripts/sheets/alternative-actor-sheet.js` — item type filter, context property rename
- `scripts/sheets/alternative-creature-sheet.js` — same
- `scripts/apps/initiative-dialog.js` — action loading rewrite, kombiniert removal, gating, typed access
- `scripts/apps/initiative-state-manager.js` — action loading rewrite, kombiniert removal, effect construction with ilarisTiming, typed modifier computation
- `scripts/apps/mass-initiative-dialog.js` — kombiniert removal, gating
- `templates/sheets/character/tabs/kampf-tab.hbs` — itemclass and iteration rename
- `templates/apps/initiative-dialog.hbs` — checkbox removal, gray-out classes, combination badge
- `templates/apps/mass-initiative-dialog.hbs` — checkbox removal, gray-out classes
- `styles/initiative-dialog.css` — `.grayed-out`, `.combination-badge` styles
- `styles/mass-initiative-dialog.css` — same gray-out styles
- Actor flag `dialogState` — schema change (kombinierteAktion field removed)
