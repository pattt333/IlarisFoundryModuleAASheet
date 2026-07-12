# action Item Type

## Purpose

Define a proper `action` (combat action) item type with a structured `TypeDataModel` in the main Ilaris system. This replaces the current hollow `effect-item` type which has no DataModel and relies on fragile regex-parsing of embedded ActiveEffect changes to derive action behavior (INI modifier, AT/VT modifiers, action type).

## Scope

**IN SCOPE** — Main Ilaris system (`systems/Ilaris/`):
- New item type registration in `system.json`
- New `AktionItemDataModel` TypeDataModel class
- Registration in `type-data-models.js`

**OUT OF SCOPE** (handled separately in the module):
- Initiative dialog changes (action loading, gating, combination logic)
- Initiative state manager changes
- Template changes
- ActiveEffect construction from aktion data during initiative
- Removal of `effect-item` references from the module
- Migration of existing `effectItem` items on actors

## Requirements

### Requirement: New `aktion` item type registered in system.json

The `action` item type SHALL be added to `documentTypes.Item` in `system.json`.

#### Scenario: System boot recognizes the new type

- **WHEN** Foundry starts with the Ilaris system
- **THEN** the `action` item type is available for item creation

### Requirement: `ActionItemDataModel` TypeDataModel defined

A new `ActionItemDataModel` class SHALL be defined in `scripts/items/model-data/models.js` inside the `createItemTypeDataModels` factory function. It SHALL extend `foundry.abstract.TypeDataModel` and use the existing `h` field helpers from `buildTypeDataFieldHelpers()`.

#### Scenario: DataModel provides typed access

- **WHEN** a `action` item's `system` data is accessed
- **THEN** all fields defined below are available with their correct JavaScript types (number, string, boolean)

### Requirement: Field: `description` (description text)

The action SHALL have a `beschreibung` field of type `StringField` for flavor text and rules explanation.

| Property   | Value      |
|------------|------------|
| Field type | StringField |
| Required   | false      |
| Nullable   | true       |
| Initial    | `""`       |

### Requirement: Field: `aktionstyp` (action type)

The action SHALL have an `aktionstyp` field of type `StringField` with constrained choices.

| Property   | Value                        |
|------------|------------------------------|
| Field type | StringField                  |
| Required   | true                         |
| Choices    | `"einfach"`, `"komplex"`     |
| Initial    | `"einfach"`                  |

**Semantics:**

- `"einfach"` (simple): Can be combined with another `"einfach"` action. When two einfache actions are combined, ALL rolls during those actions suffer a -4 malus (AT -4, VT -4, and any skill checks).
- `"komplex"` (complex): Cannot be combined with any other action. A komplex action occupies the entire turn alone.

#### Scenario: Simple action created

- **WHEN** a action item is created without specifying `aktionstyp`
- **THEN** it defaults to `"einfach"`

#### Scenario: Invalid aktionstyp rejected

- **WHEN** a action item is created with `aktionstyp: "ungültig"`
- **THEN** the DataModel validation rejects the value (only `"einfach"` and `"komplex"` are valid)

### Requirement: Field: `iniMod` (initiative modifier)

The action SHALL have an `iniMod` field of type `NumberField` representing the initiative modifier applied when the action is selected.

| Property   | Value      |
|------------|------------|
| Field type | NumberField |
| Required   | false      |
| Nullable   | true       |
| Initial    | `0`        |

**Examples:**
- "Gezielter Angriff" → `iniMod: -4`
- "Schnelle Bewegung" → `iniMod: 2`
- "Standardangriff" → `iniMod: 0`

#### Scenario: Positive, negative, and zero modifiers

- **WHEN** accessed via `item.system.iniMod`
- **THEN** returns the stored number (positive, negative, or zero)

### Requirement: Field: `atMod` (attack modifier)

The action SHALL have an `atMod` field of type `NumberField` representing the attack roll modifier.

| Property   | Value      |
|------------|------------|
| Field type | NumberField |
| Required   | false      |
| Nullable   | true       |
| Initial    | `0`        |

### Requirement: Field: `vtMod` (defense modifier)

The action SHALL have a `vtMod` field of type `NumberField` representing the defense/parry roll modifier.

| Property   | Value      |
|------------|------------|
| Field type | NumberField |
| Required   | false      |
| Nullable   | true       |
| Initial    | `0`        |

### Requirement: Field: `bedingungen` (conditions / gating)

The action SHALL have a `bedingungen` field of type `SchemaField` containing sub-fields that gate whether the action is available based on the selected weapon.

#### Sub-field: `bedingungen.waffentyp`

| Property   | Value                              |
|------------|------------------------------------|
| Field type | StringField                        |
| Required   | false                              |
| Nullable   | true                               |
| Initial    | `null`                             |
| Choices    | `null`, `"nahkampf"`, `"fernkampf"` |

**Semantics:**

- `null`: Action is available regardless of weapon selection (including no weapon).
- `"nahkampf"`: Action requires a nahkampfwaffe (or a nahkampfwaffe with "Fernkampfoption" eigenschaft, which also counts as fernkampf-capable).
- `"fernkampf"`: Action requires a fernkampfwaffe (or a nahkampfwaffe with "Fernkampfoption" eigenschaft).

#### Sub-field: `bedingungen.eigenschaften`

| Property   | Value      |
|------------|------------|
| Field type | ArrayField of StringField |
| Required   | false      |
| Nullable   | true       |
| Initial    | `[]`       |

**Semantics:** An array of Waffeneigenschaft names (matching by `key` in the weapon's `eigenschaften` array). ALL listed eigenschaften must be present on the selected weapon for the action to be available. An empty array means no eigenschaft gating.

**Examples:**

| Action                  | `waffentyp`  | `eigenschaften`  | Meaning                                   |
|-------------------------|-------------|-------------------|-------------------------------------------|
| Standardangriff         | `null`      | `[]`              | Any weapon or unarmed                     |
| Fernkampfangriff        | `"fernkampf"` | `[]`            | Any ranged weapon or Fernkampfoption      |
| Gezielter Angriff       | `null`      | `["Präzise"]`     | Any weapon with Präzise eigenschaft       |
| Schildschlag            | `"nahkampf"` | `["Schild"]`     | Melee weapon with Schild eigenschaft      |
| Wuchtschlag             | `"nahkampf"` | `["Wuchtig"]`    | Melee weapon with Wuchtig eigenschaft     |

#### Scenario: No weapon required

- **WHEN** a action has `bedingungen.waffentyp: null` and `bedingungen.eigenschaften: []`
- **THEN** the action is available even when no weapon is selected

#### Scenario: Weapon type and eigenschaft both required

- **WHEN** a action has `bedingungen.waffentyp: "nahkampf"` and `bedingungen.eigenschaften: ["Präzise"]`
- **THEN** the action is only available when a nahkampfwaffe with "Präzise" is selected

#### Scenario: Fernkampfoption bridging

- **WHEN** a nahkampfwaffe has the "Fernkampfoption" eigenschaft
- **THEN** it satisfies BOTH `waffentyp: "nahkampf"` AND `waffentyp: "fernkampf"` checks

### Requirement: Registration in type-data-models.js

The `ActionItemDataModel` SHALL be registered as `CONFIG.Item.dataModels["action"]` by returning it from the `createItemTypeDataModels` factory function. The existing `registerIlarisTypeDataModels()` in `scripts/core/model-data/type-data-models.js` SHALL pick it up automatically via the spread assignment.

### Requirement: Compendium pack `actionen`

A new compendium pack SHALL be defined in `system.json` under `packs`:

```json
{
    "name": "actionen",
    "label": "actionen",
    "system": "Ilaris",
    "path": "./comp_packs/actionen",
    "type": "Item"
}
```

Source JSON files SHALL be placed in `comp_packs/actionen/_source/`.

#### Scenario: Pack is available in compendium sidebar

- **WHEN** Foundry starts
- **THEN** "actionen" appears in the compendium sidebar under the Ilaris system

## Data Model: Complete Schema

```js
// In scripts/items/model-data/models.js
// Inside createItemTypeDataModels(TypeDataModel, h):

class actionItemDataModel extends TypeDataModel {
    static defineSchema() {
        const itemBase = createItemTemplateFields(h)

        return {
            ...itemBase,

            beschreibung: h.string(''),

            aktionstyp: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                blank: false,
                choices: ['einfach', 'komplex'],
                initial: 'einfach',
            }),

            iniMod: h.number(0),

            atMod: h.number(0),

            vtMod: h.number(0),

            bedingungen: h.schema({
                waffentyp: new foundry.data.fields.StringField({
                    required: false,
                    nullable: true,
                    blank: true,
                    choices: [null, 'nahkampf', 'fernkampf'],
                    initial: null,
                }),
                eigenschaften: h.arrayOfStrings(),
            }),
        }
    }
}
```

## Compendium Source JSON Template

```json
{
    "name": "Gezielter Angriff",
    "type": "action",
    "img": "systems/Ilaris/assets/icons/actions/gezielter-angriff.svg",
    "system": {
        "beschreibung": "Ein präziser Angriff auf eine Schwachstelle.",
        "aktionstyp": "komplex",
        "iniMod": -4,
        "atMod": 4,
        "vtMod": -8,
        "bedingungen": {
            "waffentyp": null,
            "eigenschaften": ["Präzise"]
        }
    }
}
```

## Files Changed

| File | Change |
|------|--------|
| `system.json` | Add `"action"` to `documentTypes.Item`; add `actionen` pack to `packs[]` |
| `scripts/items/model-data/models.js` | Add `actionItemDataModel` class in `createItemTypeDataModels` return value |
| `scripts/core/model-data/type-data-models.js` | No change needed (auto-picked up via spread) |
| `comp_packs/actionen/_source/*.json` | New source JSON files for action definitions |

## Dependencies

- None. This is purely additive to the main system.
- The module (`ilaris-alternative-actor-sheet`) will consume this in a separate change.
