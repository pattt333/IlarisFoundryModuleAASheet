# Fertigkeit Dialog

## Purpose

Full skill check dialog system for the Ilaris module — W20 dice rolling with critical detection, difficulty (Erschwernis) configuration, context selection (gather materials, craft, buy), material item filtering, Schips usage, and chat output via the Ilaris system's dice utilities.

## Requirements

### Requirement: Dialog supports multiple probe types

The `IlarisAlternativeFertigkeitDialog` SHALL support four probe types: `fertigkeit` (standard skill check), `attribut` (attribute check), `freieFertigkeit` (free skill check), and the dialog title SHALL reflect the probe type.

#### Scenario: Opening a Fertigkeit probe

- **WHEN** a skill check is initiated with `probeType: "fertigkeit"` and `fertigkeitName: "Klettern"`
- **THEN** the dialog title is "Fertigkeitsprobe: Klettern"

#### Scenario: Opening an Attribut probe

- **WHEN** a skill check is initiated with `probeType: "attribut"` and `fertigkeitName: "Mut"`
- **THEN** the dialog title is "Attributsprobe: Mut"

### Requirement: Context selection with difficulty configuration

The dialog SHALL provide a context dropdown with options: none, gatherMaterials (Material sammeln), craftItem (Gegenstand herstellen), and buyItem (Gegenstand einkaufen). Each context SHALL configure difficulty (Erschwernis) behavior: none has no difficulty, gatherMaterials has a fixed difficulty of 16, and craftItem/buyItem have editable difficulty defaulting to 16.

#### Scenario: Selecting gatherMaterials context

- **WHEN** the user selects "Material sammeln" from the context dropdown
- **THEN** the difficulty field shows 16 and is locked (fixed)

#### Scenario: Selecting craftItem context

- **WHEN** the user selects "Gegenstand herstellen" from the context dropdown
- **THEN** the difficulty field shows 16 and is editable

#### Scenario: Selecting none context

- **WHEN** the user selects "nichts" from the context dropdown
- **THEN** no difficulty field is displayed

### Requirement: Material item selection for gatherMaterials context

When context is `gatherMaterials`, the dialog SHALL filter the actor's inventory items by name pattern `/(zutat|material)/i` and present matching items in a dropdown. The selected item's ID SHALL be tracked as `usedItemId`.

#### Scenario: Actor has matching material items

- **WHEN** context is "Material sammeln" and the actor has items named "Zutat: Kräuter" and "Material: Erz"
- **THEN** both items appear in the material selection dropdown

#### Scenario: Actor has no matching material items

- **WHEN** context is "Material sammeln" and no actor items match the name pattern
- **THEN** the dropdown is empty or shows a "no items" state

### Requirement: W20 dice rolling with critical detection

The dialog SHALL roll a W20 die using the Ilaris system's `evaluate_roll_with_crit` function and `formatDiceFormula`. The preview button SHALL trigger the roll and display the result.

#### Scenario: Clicking preview/würfeln button

- **WHEN** the user clicks the preview button (`previewClick` action)
- **THEN** a W20 roll is executed via `evaluate_roll_with_crit` and the result is displayed

### Requirement: Schips (fate points) can be used

The dialog SHALL display Schips options when the actor has available Schips: "Kein Schips", "Schips ohne Eigenheit", and "Schips mit Eigenheit". When no Schips are available, a warning SHALL be shown.

#### Scenario: Actor has Schips available

- **WHEN** the actor has `system.schips.schips_stern > 0`
- **THEN** the three Schips radio options are displayed

#### Scenario: Actor has no Schips

- **WHEN** the actor has `system.schips.schips_stern === 0`
- **THEN** a warning "Keine Schips verfügbar!" is displayed

### Requirement: Used item tracking from actor inventory

The dialog SHALL display a dropdown of the actor's usable items for tracking which item was used in the check. A "none" default option SHALL be provided.

#### Scenario: Selecting a used item

- **WHEN** the user selects an item from the "Benutzter Gegenstand" dropdown
- **THEN** the item's ID is stored as `usedItemId`

### Requirement: Roll result posted to chat

After a successful roll, the result SHALL be posted to chat via the Ilaris system's `postRollToChat` function using the actor's speaker data.

#### Scenario: Successful roll

- **WHEN** a W20 roll is completed
- **THEN** the result including critical status is posted to chat via the actor's speaker
