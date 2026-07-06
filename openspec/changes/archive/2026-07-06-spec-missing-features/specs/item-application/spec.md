# Item Application

> Derived from: `scripts/apps/item-apply-dialog.js`, `templates/apps/item-apply-dialog.hbs`

## ADDED Requirements

### Requirement: Dialog displays item details and quantity

The `IlarisAlternativeItemApplyDialog` SHALL display the item's name, current quantity, and description. The dialog title SHALL include the item name. The dialog SHALL use AppV2 with `HandlebarsApplicationMixin`.

#### Scenario: Opening dialog with a valid item

- **WHEN** the dialog opens with an item that has quantity 3
- **THEN** the dialog title is "Gegenstand anwenden: {itemName}" and the quantity displays 3

#### Scenario: Opening dialog with no item or zero quantity

- **WHEN** the dialog opens but the item is null or has quantity 0
- **THEN** the "apply" button is disabled (`canApply: false`)

### Requirement: Target selection via Ilaris system dialog

The "chooseTargets" action SHALL open the Ilaris system's `TargetSelectionDialog`. Selected targets SHALL be stored in `this.selectedTargets` and the dialog SHALL re-render to reflect the selection.

#### Scenario: User selects targets

- **WHEN** the user clicks "Ziele auswählen" and selects 2 targets in the TargetSelectionDialog
- **THEN** `selectedTargets` contains 2 entries and the dialog re-renders showing the selection count

#### Scenario: User selects no targets

- **WHEN** the user opens target selection and confirms without selecting any targets
- **THEN** `selectedTargets` is an empty array and the apply button is disabled

### Requirement: Apply button requires item, quantity, and targets

The apply button SHALL only be enabled when `canApply` is true — meaning the item exists, quantity > 0, at least one target is selected, and no apply is in progress.

#### Scenario: All conditions met

- **WHEN** an item exists with quantity > 0, targets are selected, and no apply is in progress
- **THEN** the apply button is enabled

#### Scenario: Missing target selection

- **WHEN** an item exists with quantity > 0 but no targets are selected
- **THEN** the apply button is disabled

### Requirement: Apply prevents double-submission

When an apply is in progress (`isApplying === true`), the apply handler SHALL return early to prevent duplicate submissions.

#### Scenario: Rapid double-click on apply

- **WHEN** the user clicks "Anwenden" and `isApplying` is already true
- **THEN** the handler returns immediately without processing

### Requirement: Item consumed on successful application

After successful application, the item SHALL be consumed by 1 quantity via `consumeInventoryItem`. The dialog SHALL close after application.

#### Scenario: Successful item application

- **WHEN** the item is successfully applied to selected targets
- **THEN** the item's quantity is reduced by 1 and the dialog closes

### Requirement: Socket-based multi-user item application

Item application SHALL use socket communication via the module's item-application socket system, enabling multi-user scenarios where one user applies an item that affects another user's actor.

#### Scenario: GM applies healing item to player's actor

- **WHEN** a GM applies a healing item targeting a player's actor
- **THEN** the item effect is applied to the target actor on the player's client via socket
