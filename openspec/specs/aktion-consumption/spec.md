# Aktion Consumption (Module-Side)

## Purpose

Consume the `aktion` item type (with `AktionItemDataModel`) from the main Ilaris system in the module's initiative dialog, state manager, sheets, and templates. Replace the hollow `effectItem` type and all associated fragile regex-parsing of ActiveEffect changes with typed, structured access.

## Scope

**IN SCOPE** — Module (`ilaris-alternative-actor-sheet/`):
- Replace `effectItem` → `aktion` in all item type filters
- Replace regex-based INI/AT/VT extraction with `item.system.iniMod` / `.atMod` / `.vtMod`
- Universal action discovery: scan actor items + world items + all world compendiums
- Auto-derived combination rules from `aktionstyp` (remove manual checkbox)
- Weapon-first gating by `bedingungen.waffentyp` and `bedingungen.eigenschaften`
- Gray-out UX for non-matching actions with explanatory tooltips
- ActiveEffect construction with 1-turn `ilarisTiming` from aktion typed data
- State cleanup: remove `kombinierteAktion` from persisted state

**OUT OF SCOPE**:
- Migration of existing `effectItem` items on actors to `aktion` type
- The `aktion` DataModel itself (handled in main Ilaris system)

## Design Decisions

| # | Topic | Decision |
|---|-------|----------|
| 1 | Compendium | Drop `nenneke-aktionen` loading. Scan actor items + `game.items` + all world compendiums for `aktion` type items |
| 2 | Deduplication | By `name`; priority: actor > world > compendium |
| 3 | Gating UX | Gray out non-matching actions (not hide); show tooltip with reason |
| 4 | Context name | `context.actor.aktionen` |
| 5 | Combination | Auto-derived from `aktionstyp`; manual checkbox removed |
| 6 | Cache | None needed (10-15 actions total across all sources) |
| 7 | Effect duration | `ilarisTiming: { durationType: "turns", remaining: 1, expiresOn: "turnEnd" }` |

## Requirements

### Requirement: Action type filter uses `aktion` instead of `effectItem`

All item type filters in sheet `_prepareContext()` methods and initiative dialog action loaders SHALL filter for `type === 'aktion'` instead of `type === 'effectItem'`. The context property SHALL be named `actor.aktionen` instead of `actor.effectItems`.

#### Scenario: Actor sheet prepares context

- **WHEN** `alternative-actor-sheet.js` calls `_prepareContext()`
- **THEN** `context.actor.aktionen` contains all `aktion`-typed items from the actor's inventory

#### Scenario: Creature sheet prepares context

- **WHEN** `alternative-creature-sheet.js` calls `_prepareContext()`
- **THEN** `context.actor.aktionen` contains all `aktion`-typed items from the creature's inventory

#### Scenario: Kampf-Tab renders actions

- **WHEN** the Kampf-Tab template renders
- **THEN** the "Aktion hinzufügen" button uses `data-itemclass="aktion"`
- **AND** the action list iterates `{{#each actor.aktionen}}`

### Requirement: Universal action discovery

The initiative dialog and state manager SHALL discover `aktion` items from three sources, deduplicated by `name` with priority: actor items > world items (`game.items`) > compendium items.

#### Scenario: Action exists on actor and in compendium

- **WHEN** an aktion named "Gezielter Angriff" exists both on the actor and in a compendium
- **THEN** the actor's version is used (they may have customized it)

#### Scenario: Action exists only in compendium

- **WHEN** an aktion exists only in a world compendium
- **THEN** it is included in the available actions list

#### Scenario: World item takes priority over compendium

- **WHEN** the same aktion name exists as a world item and in a compendium
- **THEN** the world item version is used

#### Scenario: Compendium scan discovers aktion items

- **WHEN** `_loadAvailableActions()` runs
- **THEN** all world compendium packs of type `Item` are scanned via `getIndex()` for entries with `type === 'aktion'`

### Requirement: Typed access replaces regex-parsing

Instead of scanning `item.effects[].changes[]` for keys containing `"ini"`, `"nahkampfmod"`, or `"verteidigungmod"`, the code SHALL use direct typed access:

| Old (regex) | New (typed) |
|---|---|
| `effect.changes.find(c => c.key.includes('ini'))` | `item.system.iniMod` |
| `effect.changes.find(c => c.key.includes('nahkampfmod'))` | `item.system.atMod` |
| `effect.changes.find(c => c.key.includes('verteidigungmod'))` | `item.system.vtMod` |
| Parsing `change.value` as int | Already a Number, no parsing needed |

#### Scenario: Action with iniMod -4

- **WHEN** accessing an aktion with `system.iniMod: -4`
- **THEN** `item.system.iniMod` returns `-4` (number, not string)

#### Scenario: Action with atMod +4 and vtMod -8

- **WHEN** accessing an aktion with `system.atMod: 4` and `system.vtMod: -8`
- **THEN** both values are available as typed numbers without string parsing

### Requirement: Auto-derived combination rules

The manual "Kombiniert (-4 AT/VT)" checkbox SHALL be removed from all templates and state. Instead, combination SHALL be auto-derived from selected actions' `aktionstyp`:

| Selection | Behavior |
|---|---|
| 1 einfache Aktion | Solo, no malus |
| 2 einfache Aktionen | Combined: -4 AT, -4 VT automatically applied |
| 1 komplexe Aktion | Solo, no malus |
| 1 komplex + attempt to select 2nd | Blocked at UI level (can't click 2nd card) |

When 2 einfache actions are selected, an informational badge SHALL display "Kombiniert (-4)" — this is display-only, not a user control.

#### Scenario: Two einfache actions selected

- **WHEN** the user selects two actions both with `aktionstyp: "einfach"`
- **THEN** the "Kombiniert (-4)" badge appears and -4 is applied to AT and VT calculations

#### Scenario: Complex action blocks second selection

- **WHEN** the user has selected one komplex action and clicks a second action card
- **THEN** the click is ignored with a notification "Komplexe Aktionen können nicht kombiniert werden"

#### Scenario: Complex selected first, einfache offered

- **WHEN** the user selects a komplex action
- **THEN** all other action cards are grayed out with tooltip "Nicht mit komplexer Aktion kombinierbar"

### Requirement: Weapon-first gating

When a weapon is selected, available actions SHALL be filtered by the weapon's type and eigenschaften. Non-matching actions SHALL be grayed out with an explanatory tooltip.

#### Gating rules

| `bedingungen.waffentyp` | Matching weapon |
|---|---|
| `""` (empty) | Any weapon or no weapon (unarmed) |
| `"nahkampfwaffe"` | nahkampfwaffe, or nahkampfwaffe with "Fernkampfoption" eigenschaft |
| `"fernkampfwaffe"` | fernkampfwaffe, or nahkampfwaffe with "Fernkampfoption" eigenschaft |

For `bedingungen.eigenschaften`: ALL listed eigenschaft keys must be present in the weapon's `eigenschaften` array (matched by `key` field).

#### Scenario: Action requires fernkampfwaffe, nahkampfwaffe selected

- **WHEN** an action has `bedingungen.waffentyp: "fernkampfwaffe"` and a nahkampfwaffe without "Fernkampfoption" is selected
- **THEN** the action card is grayed out with tooltip "Erfordert Fernkampfwaffe"

#### Scenario: Action requires eigenschaft "Präzise", weapon doesn't have it

- **WHEN** an action has `bedingungen.eigenschaften: ["Präzise"]` and the selected weapon lacks that eigenschaft
- **THEN** the action card is grayed out with tooltip "Erfordert Eigenschaft: Präzise"

#### Scenario: Melee weapon with Fernkampfoption bridges both types

- **WHEN** a nahkampfwaffe has eigenschaft `{key: "Fernkampfoption"}` and an action requires `waffentyp: "fernkampfwaffe"`
- **THEN** the action IS available (not grayed out)

#### Scenario: No weapon selected

- **WHEN** no weapon is selected
- **THEN** only actions with `bedingungen.waffentyp: ""` are available; all others are grayed out

### Requirement: Gray-out UX

Non-matching action cards SHALL be rendered with a `.grayed-out` CSS class that reduces opacity, removes pointer events, and shows a tooltip on hover explaining the reason.

#### Tooltip messages

| Reason | Tooltip text |
|---|---|
| Wrong weapon type | "Erfordert Fernkampfwaffe" / "Erfordert Nahkampfwaffe" |
| Missing eigenschaft | "Erfordert Eigenschaft: {name}" |
| Blocked by komplex action | "Nicht mit komplexer Aktion kombinierbar" |

#### Scenario: Hover over grayed-out card

- **WHEN** the user hovers over a grayed-out action card
- **THEN** a tooltip appears explaining why the action is unavailable

### Requirement: Kombiniert state removed

The `kombinierteAktion` field SHALL be removed from all state persistence, loading, and computation. Specifically:

- Removed from `_defaultState()` in `InitiativeStateManager`
- Removed from `loadState()` branches
- Removed from `persistState()`
- Removed from `_savePersistedState()` in `InitiativeDialog`
- Removed from `_loadPersistedState()` in `InitiativeDialog`
- Removed from `_prepareContext()` in `InitiativeDialog`
- Removed from `InitiativeDialog` constructor
- Removed from `MassInitiativeDialog` state management
- Removed from both Handlebars templates (checkbox element)
- Replaced with auto-derived computation in `calculateTotalInitiative()`, `buildEffectChanges()`, `calculateActionModifiers()`, and chat message formatting

#### Scenario: Old state with kombiniert flag loaded

- **WHEN** an actor has persisted state from before this change containing `kombinierteAktion`
- **THEN** the field is silently ignored (graceful degradation)

### Requirement: ActiveEffect construction from aktion data

When "INI ansagen" commits, the `buildEffectChanges()` method SHALL construct effect changes from typed aktion data instead of the legacy state object. The resulting ActiveEffect SHALL include `ilarisTiming` with 1-turn duration.

#### Effect changes built

| Change key | Source |
|---|---|
| `system.abgeleitete.ini` (or `system.kampfwerte.ini` for kreatur) | `totalIni - baseIni` (delta) |
| `system.modifikatoren.nahkampfmod` | `state.atMod + sum(action.atMod) + (combined ? -4 : 0)` |
| `system.modifikatoren.verteidigungmod` | `state.vtMod + sum(action.vtMod) + (combined ? -4 : 0)` |

#### ilarisTiming

```json
{
    "durationType": "turns",
    "remaining": 1,
    "originalValue": 1,
    "expiresOn": "turnEnd"
}
```

#### Scenario: Effect expires after owner's turn ends

- **WHEN** the combat turn ends for the actor who owns the effect
- **THEN** the Ilaris combat-turn-hooks system decrements `remaining`; when it reaches 0, the effect is removed

### Requirement: Styles for grayed-out and combination badge

The CSS SHALL include:

- `.action-card.grayed-out` — reduced opacity (0.4), no pointer events, not selectable
- `.combination-badge` — small informational badge showing "Kombiniert (-4)" when 2 einfache actions are selected

## Files Changed

| File | Change |
|------|--------|
| `scripts/sheets/alternative-actor-sheet.js` | `effectItem` → `aktion` in filters; `effectItems` → `aktionen` in context |
| `scripts/sheets/alternative-creature-sheet.js` | Same |
| `templates/sheets/character/tabs/kampf-tab.hbs` | `data-itemclass` and `{{#each}}` updated |
| `scripts/apps/initiative-dialog.js` | `_loadAvailableActions()` rewritten; `kombinierteAktion` removed; gating added; typed access |
| `scripts/apps/initiative-state-manager.js` | `loadAvailableActions()` rewritten; `kombinierteAktion` removed; `buildEffectChanges()` uses typed data + ilarisTiming; `calculateActionModifiers()` uses typed data |
| `scripts/apps/mass-initiative-dialog.js` | `kombinierteAktion` removed; gating added |
| `templates/apps/initiative-dialog.hbs` | Checkbox removed; gray-out classes added; combination badge added |
| `templates/apps/mass-initiative-dialog.hbs` | Checkbox removed; gray-out classes added |
| `styles/initiative-dialog.css` | `.action-card.grayed-out`, `.combination-badge` styles |
| `styles/mass-initiative-dialog.css` | Same gray-out styles |
