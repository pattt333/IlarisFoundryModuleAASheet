# Sheet Settings Dialogs

## Purpose

Sheet-level settings dialogs triggered via AppV2 action system: energy settings (AsP/KaP editing), health settings (wound management), item quantity change, hexagon attribute editing, and global modifier stat editing.

## Requirements

### Requirement: Energy settings dialog edits AsP/KaP values

The `energySettings` action SHALL open a dialog allowing the user to edit the actor's current AsP (`system.energien.asp.value`), blocked AsP, current KaP (`system.energien.kap.value`), and blocked KaP values. The dialog SHALL only show fields relevant to the actor's type (Zauberer, Geweihter, or neither).

#### Scenario: Zauberer opens energy settings

- **WHEN** a Zauberer actor opens the energy settings dialog
- **THEN** only ASP-related fields are displayed

#### Scenario: Actor is neither Zauberer nor Geweihter

- **WHEN** a non-caster actor opens energy settings
- **THEN** no energy fields are displayed or the dialog is not accessible

### Requirement: Health settings dialog adds/removes wounds

The `healthSettings` action SHALL open a dialog allowing the user to add or remove wounds from the actor's `system.gesundheit.wunden`. The dialog SHALL also allow editing HP max value.

#### Scenario: Adding wounds via health settings

- **WHEN** the user adds 3 wounds in the health settings dialog and confirms
- **THEN** `system.gesundheit.wunden` increases by 3

#### Scenario: Removing wounds via health settings

- **WHEN** the user removes 2 wounds in the health settings dialog and confirms
- **THEN** `system.gesundheit.wunden` decreases by 2 (minimum 0)

### Requirement: Item quantity change via ± buttons

The `itemQuantityChange` action SHALL increment or decrement an item's `system.quantity` by 1. Decreasing to 0 SHALL delete the item. The buttons SHALL only be active when the sheet is editable.

#### Scenario: Incrementing item quantity

- **WHEN** the user clicks the + button on an item with quantity 2
- **THEN** the item's quantity updates to 3

#### Scenario: Decrementing item to 0

- **WHEN** the user clicks the − button on an item with quantity 1
- **THEN** the item is deleted from the actor

### Requirement: Hexagon attribute editing

The `hexagonEdit` action SHALL allow editing of the 8 Ilaris attribute values (MU, KL, IN, CH, FF, GE, KO, KK) via the hexagon stat blocks. Each attribute's `wert` and `pw` values SHALL be editable.

#### Scenario: Editing an attribute via hexagon

- **WHEN** the user clicks on a hexagon attribute and changes the value
- **THEN** the corresponding `system.attribute.{key}.wert` is updated

### Requirement: Global modifier stat editing

The `editStat` action SHALL allow editing of global modifier values such as HP-Max, global modifier (`globalermod`), and for creatures, the creature type (`kreaturentyp`).

#### Scenario: Editing HP max on creature sheet

- **WHEN** a GM edits the HP-Max stat on a creature sheet
- **THEN** the actor's `system.gesundheit.hp.max` is updated

#### Scenario: Editing global modifier

- **WHEN** the user edits the global modifier value
- **THEN** `system.abgeleitete.globalermod` is updated and the display refreshes

### Requirement: All settings dialogs use the AppV2 action system

Settings dialogs SHALL be triggered via `data-action` attributes in the sheet's action map (`DEFAULT_OPTIONS.actions`), using static methods on the sheet class.

#### Scenario: Action triggers dialog

- **WHEN** a button with `data-action="healthSettings"` is clicked
- **THEN** the corresponding static method on the sheet class is invoked
