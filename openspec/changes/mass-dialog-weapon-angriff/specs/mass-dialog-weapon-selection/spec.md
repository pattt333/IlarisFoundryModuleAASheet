## ADDED Requirements

### Requirement: Weapon/Angriff dropdown per NPC card

Each NPC card in the mass initiative dialog SHALL include a dropdown selector for weapon or Angriff selection, positioned between the action section and the modifier row. For `held` (PC) actors, the dropdown SHALL list weapons from the actor's items (nahkampfwaffe/fernkampfwaffe types where hauptwaffe or nebenwaffe is true). For `kreatur` (NPC) actors, the dropdown SHALL list entries from `system.angriffe`, normalized with an inferred nah/fern type. The first option SHALL be "keine Waffe" (empty value). The selected weapon/Angriff SHALL be persisted in the actor's `dialogState` flag as `selectedWeaponId`.

#### Scenario: PC actor shows weapon dropdown

- **WHEN** a `held` actor without player owner appears in the mass dialog
- **THEN** the card shows a weapon dropdown listing all hauptwaffe/nebenwaffe items

#### Scenario: NPC actor shows Angriff dropdown

- **WHEN** a `kreatur` actor with 3 angriffe appears in the mass dialog
- **THEN** the card shows an Angriff dropdown with all 3 angriffe, labeled with their names and nah/fern type

#### Scenario: Actor with no weapons or angriffe

- **WHEN** an actor has no weapons (PC) or no angriffe (NPC)
- **THEN** the dropdown shows only "keine Waffe" and is disabled

### Requirement: Action gating by weapon/Angriff type

When a weapon or Angriff is selected in the mass dialog, available actions SHALL be gated based on `bedingungen.waffentyp` and `bedingungen.eigenschaften`. Actions requiring `nahkampfwaffe` SHALL be grayed out and unselectable when the selected weapon/Angriff is of type `fernkampfwaffe` (and vice versa), unless the weapon has the opposing type's eigenschaft (e.g., Fernkampfoption). Actions requiring specific eigenschaften SHALL be grayed out when the selected weapon/Angriff does not have those eigenschaften. Actions with no waffentyp requirement SHALL always be selectable. The gating SHALL apply to both the multi-select dropdown and the batch apply "Auf alle anwenden" button.

#### Scenario: Nahkampfwaffe action gated by Fernkampfwaffe

- **WHEN** an NPC has "Bogen (fern)" selected and the action "Gezielter Schlag" requires nahkampfwaffe
- **THEN** "Gezielter Schlag" is grayed out in the multi-select with tooltip "Erfordert Nahkampfwaffe"

#### Scenario: Action with no weapon requirement always available

- **WHEN** an NPC has any weapon selected and the action "Bewegung" has no waffentyp requirement
- **THEN** "Bewegung" is selectable regardless of weapon type

#### Scenario: Fernkampfoption bridges types

- **WHEN** an NPC has a Fernkampfwaffe with "Fernkampfoption" eigenschaft selected
- **THEN** actions requiring nahkampfwaffe are NOT grayed out

### Requirement: Batch apply respects Angriff compatibility

When the GM uses "Auf alle anwenden" with an action that has `bedingungen.waffentyp`, the system SHALL auto-select each NPC's first Angriff. If the first Angriff's type matches the action's waffentyp requirement, the action SHALL be applied and the Angriff SHALL be set as selected. If the first Angriff does not match, the NPC SHALL be skipped. NPCs that already have 2 actions selected SHALL also be skipped.

#### Scenario: Batch apply with compatible first Angriff

- **WHEN** the GM applies "Gezielter Schlag" (requires nahkampfwaffe) to all, and an NPC's first Angriff is "Kurzschwert (nah)"
- **THEN** the action is applied and "Kurzschwert" is set as the selected weapon

#### Scenario: Batch apply with incompatible first Angriff

- **WHEN** the GM applies "Gezielter Schlag" (requires nahkampfwaffe) to all, and an NPC's first Angriff is "Bogen (fern)"
- **THEN** the NPC is skipped (no action applied, no weapon selected)

#### Scenario: Batch apply with no weapon requirement

- **WHEN** the GM applies "Bewegung" (no waffentyp) to all
- **THEN** the action is applied to all eligible NPCs regardless of their Angriff state

### Requirement: Weapon INI modifier conditional on action requirement

The weapon/Angriff INI modifier SHALL only be added to the total initiative calculation when at least one selected action has a non-empty `bedingungen.waffentyp`. If no selected action requires a weapon type, the weapon INI modifier SHALL be treated as 0 even if a weapon is selected.

#### Scenario: Weapon INI applied when action needs weapon

- **WHEN** an NPC has selected "Schlag" (requires nahkampfwaffe) and a weapon with INI -2
- **THEN** the total initiative includes -2 from the weapon INI modifier

#### Scenario: Weapon INI ignored when no action needs weapon

- **WHEN** an NPC has selected only "Bewegung" (no waffentyp) and a weapon with INI -2
- **THEN** the total initiative does NOT include the -2 weapon modifier
