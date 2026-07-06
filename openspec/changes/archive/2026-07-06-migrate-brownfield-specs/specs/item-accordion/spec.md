# Item Accordion

> Source: `docs/_specs/item-accordion-feature.md`

## ADDED Requirements

### Requirement: Accordion component renders collapsible item rows

The item accordion Handlebars partial SHALL render each item as a collapsible row with a header (image, name, stats, stats2) and a detail section. The header SHALL be clickable to toggle the detail content.

#### Scenario: Rendering an item with all fields

- **WHEN** an item with stats, stats2, and details is rendered via the accordion partial
- **THEN** the header shows the item image (24x24px), name, and stat arrays; clicking the header toggles the detail section showing label/value rows

#### Scenario: Item has no details

- **WHEN** an item has an empty or undefined details array
- **THEN** the detail section is hidden but the header row remains clickable

### Requirement: Accordion supports optional weapon toggles

When `isWeapon=true` is passed, the accordion SHALL render Hauptwaffe (HW) and Nebenwaffe (NW) toggle buttons in the item controls section, reflecting current `item.system.hauptwaffe` and `item.system.nebenwaffe` states.

#### Scenario: Weapon with HW toggle active

- **WHEN** a weapon item with `system.hauptwaffe === true` is rendered with `isWeapon=true`
- **THEN** the HW toggle button shows the active state

#### Scenario: Non-weapon item

- **WHEN** `isWeapon` is false or not set
- **THEN** no HW/NW toggle buttons are rendered

### Requirement: Accordion supports optional drag-and-drop

When `draggable=true` is passed, the accordion SHALL set `draggable="true"` on the item container, include `data-item-uuid` and `data-transfer-type="Item"` attributes, and apply `draggable` CSS class for visual feedback. By default, drag-and-drop SHALL be disabled.

#### Scenario: Draggable item

- **WHEN** an item is rendered with `draggable=true`
- **THEN** the item row has `draggable="true"`, the `draggable` CSS class, a `grab` cursor on hover, and `data-item-uuid` set to the item's UUID

#### Scenario: Non-draggable item (default)

- **WHEN** `draggable` is not passed or is false
- **THEN** no drag attributes are set and no draggable CSS class is applied

### Requirement: Accordion supports optional delete button visibility

When `showDelete=false` is passed, the delete button SHALL not be rendered. The default SHALL be `true` for backward compatibility.

#### Scenario: Delete button hidden

- **WHEN** an item is rendered with `showDelete=false`
- **THEN** the delete button is absent from the item controls

#### Scenario: Delete button visible (default)

- **WHEN** `showDelete` is not passed or is `true`
- **THEN** the delete button is rendered in the item controls

### Requirement: Ammunition warning for ranged weapons

When ammunition tracking is active, ranged weapons missing ammunition SHALL show a warning icon over the item image.

#### Scenario: Ranged weapon without ammunition

- **WHEN** a fernkampfwaffe with `hasAmmunition: false` is rendered
- **THEN** a warning triangle icon is displayed on the weapon image with tooltip "Keine Munition vorhanden"
