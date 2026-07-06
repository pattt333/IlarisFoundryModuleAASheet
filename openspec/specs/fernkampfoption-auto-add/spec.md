# Fernkampfoption Auto-Add

## Purpose

Automatically create linked ranged weapons when melee weapons with Fernkampfoption property are added, with bidirectional flag linking and cascade deletion.

## Requirements

### Requirement: Adding nahkampfwaffe with Fernkampfoption auto-adds linked ranged weapon

When a `nahkampfwaffe` item is created on an actor via `createEmbeddedDocuments`, the `createItem` Hook SHALL detect the "Fernkampfoption" property in `item.system.eigenschaften` and automatically create the corresponding `fernkampfwaffe` from a compendium, matched by exact name.

#### Scenario: Adding Axtpistole with matching compendium weapon

- **WHEN** a nahkampfwaffe with `eigenschaften` containing `{key: "Fernkampfoption"}` and name "Axtpistole" is added to an actor
- **THEN** the "Axtpistole" fernkampfwaffe is automatically created from the compendium and added to the actor, with a success notification

#### Scenario: Adding nahkampfwaffe without Fernkampfoption

- **WHEN** a nahkampfwaffe without the "Fernkampfoption" property is added
- **THEN** no auto-add occurs and the item is created normally

#### Scenario: Compendium pack not found

- **WHEN** the compendium pack cannot be found
- **THEN** a warning notification "Waffe nicht gefunden: {weaponName}" is shown

### Requirement: Duplicate auto-add is prevented via bidirectional flags

The system SHALL prevent duplicate auto-addition by checking for an existing fernkampfwaffe linked via the flag `linkedMeleeId`. After creation, bidirectional flags SHALL be set: the nahkampfwaffe gets `linkedRangedId` pointing to the created fernkampfwaffe, and the fernkampfwaffe gets `linkedMeleeId` pointing back.

#### Scenario: Adding same Fernkampfoption weapon twice

- **WHEN** a nahkampfwaffe is added that already has a linked fernkampfwaffe via the `linkedRangedId` flag
- **THEN** the auto-add is silently skipped

#### Scenario: Manual re-add after deletion

- **WHEN** the linked fernkampfwaffe was manually deleted and the nahkampfwaffe is re-added
- **THEN** a new fernkampfwaffe is created and new bidirectional flags are set

### Requirement: Deleting a linked weapon cascades deletion to its partner

When a nahkampfwaffe or fernkampfwaffe with linked flags is deleted, the `deleteItem` Hook SHALL detect the link and auto-delete the partner weapon. A `linkedWeaponDeletion` flag SHALL prevent infinite recursion.

#### Scenario: Deleting nahkampfwaffe with linked ranged weapon

- **WHEN** a nahkampfwaffe with a `linkedRangedId` flag is deleted
- **THEN** the linked fernkampfwaffe is also deleted

#### Scenario: Deleting fernkampfwaffe with linked melee weapon

- **WHEN** a fernkampfwaffe with a `linkedMeleeId` flag is deleted
- **THEN** the linked nahkampfwaffe is also deleted

#### Scenario: Cascade deletion does not loop

- **WHEN** the cascade deletion triggers the deleteItem hook for the partner
- **THEN** the `linkedWeaponDeletion` flag causes an early return, preventing infinite recursion

### Requirement: Non-weapon item types pass through hooks normally

The `createItem` and `deleteItem` Hooks SHALL return early for items that are not `nahkampfwaffe` or `fernkampfwaffe` types, allowing normal Foundry processing.

#### Scenario: Adding a non-weapon item

- **WHEN** a `gegenstand` or other non-weapon item is created on an actor
- **THEN** no auto-add or link processing occurs
