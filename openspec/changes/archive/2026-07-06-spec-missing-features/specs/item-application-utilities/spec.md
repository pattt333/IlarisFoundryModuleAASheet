# Item Application Utilities

> Derived from: `scripts/utilities.js` (lines 247-360)

## ADDED Requirements

### Requirement: consumeInventoryItem reduces item quantity or deletes

The `consumeInventoryItem(actor, itemId, amount)` function SHALL find the item by ID on the actor, reduce its `system.quantity` by the given amount, and delete the item if quantity reaches 0.

#### Scenario: Consuming 1 from a stack of 3

- **WHEN** `consumeInventoryItem(actor, itemId, 1)` is called for an item with quantity 3
- **THEN** the item's quantity is updated to 2

#### Scenario: Consuming the last item

- **WHEN** `consumeInventoryItem(actor, itemId, 1)` is called for an item with quantity 1
- **THEN** the item is deleted from the actor

#### Scenario: Item not found

- **WHEN** `consumeInventoryItem(actor, "nonexistentId", 1)` is called
- **THEN** the function returns gracefully without error

### Requirement: createItemApplicationPayload builds socket payload

The `createItemApplicationPayload(actor, item, targets)` function SHALL construct a payload object containing the actor UUID, item data (name, type, system data), and target actor UUIDs for socket-based item application.

#### Scenario: Building payload with targets

- **WHEN** `createItemApplicationPayload(actor, healingPotion, [target1, target2])` is called
- **THEN** the returned payload contains the source actor UUID, item data, and both target UUIDs

### Requirement: applyItemToTarget applies item effects to target actor

The `applyItemToTarget(sourceActor, targetActor, payload, target)` function SHALL apply item effects (healing, damage, status effects) from the source actor's item to the target actor. It SHALL handle the item's configured effect type.

#### Scenario: Applying a healing item

- **WHEN** a healing potion is applied to a wounded target actor
- **THEN** the target actor's HP/wounds are updated according to the item's healing value

#### Scenario: Applying a damage item

- **WHEN** a damage-dealing item is applied to a target actor
- **THEN** the target actor's wounds are increased by the item's damage value

### Requirement: applyBleedingEffect adds Blutung to actor

The `applyBleedingEffect(actor)` function SHALL retrieve the "Blutung" effect from the module's effect library compendium and apply it to the specified actor.

#### Scenario: Applying bleeding effect

- **WHEN** `applyBleedingEffect(actor)` is called
- **THEN** the "Blutung" effect from the effect-library compendium is cloned and added to the actor's active effects

#### Scenario: Compendium or effect not found

- **WHEN** the effect library compendium or "Blutung" effect cannot be found
- **THEN** a warning notification is shown indicating manual addition is required
