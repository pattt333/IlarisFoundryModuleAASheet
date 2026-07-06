# Ammunition Tracking

## Purpose

Track and consume ammunition for ranged weapons (Kugel/Pfeil/Bolzen) on held-type actors, including fumble table handling for Fernkampf attacks.

## Requirements

### Requirement: Ammunition tracking can be toggled via world setting

The system SHALL register a world-level game setting `ammunitionTracking` in `module.js` that controls whether ammunition consumption is active. The setting SHALL be a Boolean, default `true`, visible only to GMs.

#### Scenario: GM enables ammunition tracking

- **WHEN** a GM sets the `ammunitionTracking` world setting to `true`
- **THEN** ammunition consumption is active for all held-type actors

#### Scenario: GM disables ammunition tracking

- **WHEN** a GM sets the `ammunitionTracking` world setting to `false`
- **THEN** ammunition is not consumed on ranged attacks and no warnings are shown

### Requirement: Sheet data includes ammunition status for ranged weapons

The sheet's `getData()` method SHALL, for each `fernkampfwaffe` item on a `held` actor, determine the ammunition type from `item.system.eigenschaften` (checking for keys "Kugel", "Pfeil", or "Bolzen"), and find a matching `gegenstand` in the actor's inventory. The context SHALL include `item.hasAmmunition` (Boolean) and `item.ammunitionType` (String or undefined).

#### Scenario: Actor has matching ammunition

- **WHEN** a held actor has a fernkampfwaffe with `eigenschaften` key "Pfeil" and a gegenstand named "Pfeil" with `quantity > 0`
- **THEN** the weapon's context shows `hasAmmunition: true` and `ammunitionType: "Pfeil"`

#### Scenario: Actor has no matching ammunition

- **WHEN** a held actor has a fernkampfwaffe with `eigenschaften` key "Kugel" but no gegenstand named "Kugel"
- **THEN** the weapon's context shows `hasAmmunition: false` and `ammunitionType: "Kugel"`

### Requirement: Missing ammunition shows warning icon on weapon

The item accordion template SHALL display a warning icon (`fa-exclamation-triangle`) overlaid on the weapon image when `hasAmmunition` is `false` and `ammunitionType` is defined.

#### Scenario: Weapon has no ammunition

- **WHEN** a fernkampfwaffe is rendered with `hasAmmunition: false` and `ammunitionType: "Bolzen"`
- **THEN** a red warning triangle icon is displayed over the weapon image with tooltip "Keine Munition vorhanden"

#### Scenario: Weapon has ammunition

- **WHEN** a fernkampfwaffe is rendered with `hasAmmunition: true`
- **THEN** no warning icon is displayed

### Requirement: Ranged attack hook consumes ammunition

The `Ilaris.postAngriff` Hook handler SHALL, for `dialog.attackType === "ranged"` on `held` actors, consume one unit of the appropriate ammunition type. A locking mechanism via actor flags SHALL prevent concurrent processing.

#### Scenario: Normal ranged attack with ammunition

- **WHEN** a held actor performs a ranged attack with a "Pfeil"-type weapon and has a "Pfeil" gegenstand with quantity 3
- **THEN** the "Pfeil" gegenstand quantity is reduced to 2

#### Scenario: Last ammunition consumed

- **WHEN** a held actor performs a ranged attack and the ammo gegenstand quantity reaches 0
- **THEN** the ammo gegenstand is deleted from the actor's inventory

#### Scenario: No ammunition available

- **WHEN** a held actor performs a ranged attack but has no matching ammo gegenstand
- **THEN** a warning notification is shown and a ChatMessage is created indicating missing ammunition

### Requirement: Fumble table for ranged attacks

When a ranged attack results in a fumble (`rollResult.fumble === true`), the system SHALL roll 2d6 and apply effects based on the result according to the fumble table.

#### Scenario: Fumble result 2 — Blutung

- **WHEN** a ranged fumble rolls 2 on 2d6
- **THEN** the "Blutung" effect from the effect library compendium is cloned and added to the actor, 1 ammunition is consumed, and a red-bordered ChatMessage describes the result

#### Scenario: Fumble result 3 — double ammunition consumption

- **WHEN** a ranged fumble rolls 3 on 2d6
- **THEN** 2 ammunition are consumed (silently if only 1 available) and a ChatMessage describes "Doppelter Munitionsverbrauch"

#### Scenario: Fumble result 4-8 — misfire

- **WHEN** a ranged fumble rolls 4-8 on 2d6
- **THEN** 1 ammunition is consumed and a ChatMessage describes "Fehlschuss, Waffe muss mit einer Aktion bereit gemacht werden"

#### Scenario: Fumble result 9-11 — friendly fire

- **WHEN** a ranged fumble rolls 9-11 on 2d6
- **THEN** the weapon's damage is rolled, 1 ammunition is consumed, and a ChatMessage describes that a Verbündeter takes half the damage (rounded up)

#### Scenario: Fumble result 12 — self-damage

- **WHEN** a ranged fumble rolls 12 on 2d6
- **THEN** the weapon's damage is rolled and applied as Wunden to the actor, and 1 ammunition is consumed
