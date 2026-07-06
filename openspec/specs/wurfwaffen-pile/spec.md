# Wurfwaffen Pile

## Purpose

Create item piles on the canvas when throwable weapons (Wurfwaffen) are used in ranged attacks, with linked melee weapon handling.

## Requirements

### Requirement: Throwable weapon detection

A utility function `isThrowableWeapon(item)` SHALL return `true` when `item.type === "fernkampfwaffe"` AND `item.system.fertigkeit === "Wurfwaffen"`.

#### Scenario: Throwing weapon detected

- **WHEN** a fernkampfwaffe has `system.fertigkeit === "Wurfwaffen"`
- **THEN** `isThrowableWeapon` returns true

#### Scenario: Non-throwing ranged weapon

- **WHEN** a fernkampfwaffe has `system.fertigkeit === "Bogen"`
- **THEN** `isThrowableWeapon` returns false

### Requirement: Thrown weapon creates item pile on ranged attack

When a throwable weapon is used in a ranged attack (`dialog.attackType === "ranged"`), the `Ilaris.postAngriff` Hook handler SHALL detect throwable weapons via `isThrowableWeapon`, and create an item pile at the token's hex-adjacent position using the Item Piles API.

#### Scenario: Thrown weapon attack with token on hex grid

- **WHEN** a throwable weapon is used in a ranged attack and the actor has a token on the canvas
- **THEN** an item pile is created at position `{x: token.x + canvas.grid.size, y: token.y}` containing the weapon

#### Scenario: Thrown weapon attack without token

- **WHEN** a throwable weapon is used but the actor has no active token on the canvas
- **THEN** no item pile is created and the function returns silently

### Requirement: Linked melee weapon lands in pile instead of thrown weapon

When the thrown weapon has a `linkedMeleeId` flag, the linked melee weapon SHALL be placed in the pile with its original quantity, and the thrown weapon SHALL be deleted.

#### Scenario: Fernkampfoption weapon thrown

- **WHEN** a fernkampfwaffe with `linkedMeleeId` pointing to a nahkampfwaffe is thrown
- **THEN** the nahkampfwaffe lands in the pile, the nahkampfwaffe is consumed from inventory, and the fernkampfwaffe is deleted

### Requirement: Thrown weapon consumed on attack

The weapon SHALL be consumed from the actor's inventory after the pile is created. If a linked melee weapon exists, it SHALL be consumed via `consumeAmmunition` and the thrown weapon deleted. Otherwise, the thrown weapon itself SHALL be consumed.

#### Scenario: Standalone thrown weapon

- **WHEN** a fernkampfwaffe without linkedMeleeId is thrown
- **THEN** the weapon is consumed via `consumeAmmunition` and a pile is created

### Requirement: Success notification on pile creation

A notification SHALL be shown after successful pile creation: `"{weaponName} zu Boden gefallen"`.

#### Scenario: Pile created successfully

- **WHEN** the item pile is created without errors
- **THEN** the user sees a notification that the weapon has fallen to the ground
