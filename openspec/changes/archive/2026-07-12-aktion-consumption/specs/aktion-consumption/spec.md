## ADDED Requirements

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

### Requirement: Universal action discovery from actor, world, and compendiums

The initiative dialog and state manager SHALL discover `aktion` items from three sources, deduplicated by `name` with priority: actor items > world items (`game.items`) > compendium items. No cache SHALL be used (10-15 actions total across all sources).

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

### Requirement: Typed access replaces regex-parsing of modifiers

Instead of scanning `item.effects[].changes[]` for keys containing `"ini"`, `"nahkampfmod"`, or `"verteidigungmod"`, the code SHALL use direct typed access: `item.system.iniMod`, `item.system.atMod`, `item.system.vtMod`. No string-to-number parsing SHALL be needed (values are already numbers).

#### Scenario: Action with iniMod -4

- **WHEN** accessing an aktion with `system.iniMod: -4`
- **THEN** `item.system.iniMod` returns `-4` (number, not string)

#### Scenario: Action with atMod +4 and vtMod -8

- **WHEN** accessing an aktion with `system.atMod: 4` and `system.vtMod: -8`
- **THEN** both values are available as typed numbers without string parsing

### Requirement: Auto-derived combination rules from aktionstyp

The manual "Kombiniert (-4 AT/VT)" checkbox SHALL be removed. Combination SHALL be auto-derived from selected actions' `aktionstyp`: two `"einfach"` actions auto-apply -4 AT and -4 VT; selecting a `"komplex"` action SHALL block selection of any second action at the UI level. When 2 einfache actions are selected, an informational badge SHALL display "Kombiniert (-4)" (display-only).

#### Scenario: Two einfache actions selected

- **WHEN** the user selects two actions both with `aktionstyp: "einfach"`
- **THEN** the "Kombiniert (-4)" badge appears and -4 is applied to AT and VT calculations

#### Scenario: Complex action blocks second selection

- **WHEN** the user has selected one komplex action and clicks a second action card
- **THEN** the click is ignored with a notification "Komplexe Aktionen können nicht kombiniert werden"

#### Scenario: Complex selected first, all others grayed

- **WHEN** the user selects a komplex action
- **THEN** all other action cards are grayed out with tooltip "Nicht mit komplexer Aktion kombinierbar"

### Requirement: Weapon-first action gating with gray-out

When a weapon is selected, available actions SHALL be filtered by `bedingungen.waffentyp` and `bedingungen.eigenschaften`. Non-matching actions SHALL be grayed out with reduced opacity and an explanatory tooltip. When no weapon is selected, only actions with `bedingungen.waffentyp: ""` SHALL be available.

#### Scenario: Action requires fernkampfwaffe, nahkampfwaffe selected

- **WHEN** an action has `bedingungen.waffentyp: "fernkampfwaffe"` and a nahkampfwaffe without "Fernkampfoption" is selected
- **THEN** the action card is grayed out with tooltip "Erfordert Fernkampfwaffe"

#### Scenario: Action requires eigenschaft, weapon lacks it

- **WHEN** an action has `bedingungen.eigenschaften: ["Präzise"]` and the selected weapon lacks that eigenschaft
- **THEN** the action card is grayed out with tooltip "Erfordert Eigenschaft: Präzise"

#### Scenario: Fernkampfoption bridges weapon types

- **WHEN** a nahkampfwaffe has eigenschaft `{key: "Fernkampfoption"}` and an action requires `waffentyp: "fernkampfwaffe"`
- **THEN** the action IS available (not grayed out)

#### Scenario: No weapon selected

- **WHEN** no weapon is selected
- **THEN** only actions with `bedingungen.waffentyp: ""` are available; all others are grayed out

### Requirement: Kombiniert state removed from persistence

The `kombinierteAktion` field SHALL be removed from all state persistence, loading, and computation in `InitiativeStateManager`, `InitiativeDialog`, and `MassInitiativeDialog`. Old persisted state containing `kombinierteAktion` SHALL be silently ignored.

#### Scenario: Old state with kombiniert flag loaded

- **WHEN** an actor has persisted state from before this change containing `kombinierteAktion`
- **THEN** the field is silently ignored (graceful degradation)

### Requirement: ActiveEffect construction with typed data and ilarisTiming

When "INI ansagen" commits, `buildEffectChanges()` SHALL construct effect changes from typed aktion data. The resulting ActiveEffect SHALL include `ilarisTiming` with `durationType: "turns"`, `remaining: 1`, `expiresOn: "turnEnd"`.

#### Scenario: Effect built from typed aktion data

- **WHEN** an aktion with `iniMod: -4`, `atMod: 4`, `vtMod: -8` is committed
- **THEN** the effect contains changes using those typed values and has `ilarisTiming.durationType: "turns"`, `remaining: 1`

#### Scenario: Effect expires after owner's turn ends

- **WHEN** the combat turn ends for the actor who owns the effect
- **THEN** the Ilaris combat-turn-hooks system decrements `remaining`; when it reaches 0, the effect is removed

### Requirement: Gray-out CSS styling

Non-matching action cards SHALL render with a `.grayed-out` CSS class that reduces opacity to 0.4 and disables pointer events. A `.combination-badge` class SHALL style the informational "Kombiniert (-4)" badge.

#### Scenario: Grayed-out card not clickable

- **WHEN** an action card has the `.grayed-out` class
- **THEN** clicking it has no effect and the card appears at reduced opacity
